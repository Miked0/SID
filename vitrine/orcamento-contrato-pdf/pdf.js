// Gerador de PDF no navegador, sem bibliotecas e sem rede externa.
// As fontes da marca (TrueType, licença OFL) são embutidas no PDF como
// CIDFontType2 com Identity-H, e o texto continua selecionável (ToUnicode).

const A4_W = 595;
const A4_H = 842;
const MARGEM_X = 48;
const DIREITA = 547;
const LIMITE_Y = 760;

function hexCor(h) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const COR = {
  roxo: hexCor('#6516BD'),
  roxoFundo: hexCor('#2B0A57'),
  menta: hexCor('#68E0BC'),
  noite: hexCor('#17141D'),
  tinta2: hexCor('#5E5670'),
  filete: hexCor('#E3DDEC'),
  nevoa: hexCor('#F3F0F8'),
  branco: [1, 1, 1],
};

const h4 = (n) => n.toString(16).padStart(4, '0').toUpperCase();
const cor3 = (c) => c.map((v) => v.toFixed(3)).join(' ');

// ---------------------------------------------------------------------------
// Leitura de TrueType: métricas, cmap (formato 4) e bytes para embutir.
// ---------------------------------------------------------------------------
export function lerFonte(buffer, nomePS) {
  const bytes = new Uint8Array(buffer);
  const v = new DataView(buffer);
  const tab = {};
  const n = v.getUint16(4);
  for (let i = 0; i < n; i++) {
    const r = 12 + i * 16;
    const tag = String.fromCharCode(bytes[r], bytes[r + 1], bytes[r + 2], bytes[r + 3]);
    tab[tag] = { off: v.getUint32(r + 8), len: v.getUint32(r + 12) };
  }
  for (const t of ['head', 'hhea', 'hmtx', 'maxp', 'cmap']) {
    if (!tab[t]) throw new Error(`Fonte ${nomePS} sem a tabela ${t}`);
  }

  const H = tab.head.off;
  const upm = v.getUint16(H + 18);
  const k = (x) => Math.round((x * 1000) / upm);
  const bbox = [v.getInt16(H + 36), v.getInt16(H + 38), v.getInt16(H + 40), v.getInt16(H + 42)].map(k);

  const HH = tab.hhea.off;
  const ascent = k(v.getInt16(HH + 4));
  const descent = k(v.getInt16(HH + 6));
  const nHM = v.getUint16(HH + 34);
  const numGlyphs = v.getUint16(tab.maxp.off + 4);
  const adv = new Array(numGlyphs);
  for (let g = 0; g < numGlyphs; g++) {
    adv[g] = k(v.getUint16(tab.hmtx.off + Math.min(g, nHM - 1) * 4));
  }

  const C = tab.cmap.off;
  const nSub = v.getUint16(C + 2);
  let sub = -1;
  for (let i = 0; i < nSub; i++) {
    const r = C + 4 + i * 8;
    const plat = v.getUint16(r);
    const enc = v.getUint16(r + 2);
    const off = v.getUint32(r + 4);
    if (v.getUint16(C + off) === 4 && ((plat === 3 && enc === 1) || plat === 0)) {
      sub = C + off;
      break;
    }
  }
  if (sub < 0) throw new Error(`Fonte ${nomePS} sem cmap Unicode`);

  const segX2 = v.getUint16(sub + 6);
  const endA = sub + 14;
  const startA = endA + segX2 + 2;
  const deltaA = startA + segX2;
  const rangeA = deltaA + segX2;
  const segs = [];
  for (let i = 0; i < segX2 / 2; i++) {
    segs.push({
      end: v.getUint16(endA + 2 * i),
      start: v.getUint16(startA + 2 * i),
      delta: v.getInt16(deltaA + 2 * i),
      ro: v.getUint16(rangeA + 2 * i),
      roPos: rangeA + 2 * i,
    });
  }

  const cache = new Map();
  const gid = (cp) => {
    if (cache.has(cp)) return cache.get(cp);
    let g = 0;
    for (const s of segs) {
      if (cp < s.start || cp > s.end) continue;
      if (s.ro === 0) g = (cp + s.delta) & 0xffff;
      else {
        const addr = s.roPos + s.ro + 2 * (cp - s.start);
        g = addr + 2 <= buffer.byteLength ? v.getUint16(addr) : 0;
        if (g) g = (g + s.delta) & 0xffff;
      }
      break;
    }
    if (g >= numGlyphs) g = 0;
    cache.set(cp, g);
    return g;
  };

  return { nome: nomePS, bytes, bbox, ascent, descent, adv, gid };
}

function medir(F, s) {
  let w = 0;
  for (const ch of String(s)) w += F.m.adv[F.m.gid(ch.codePointAt(0))] || 0;
  return w;
}

const largura = (F, s, tamanho) => (medir(F, s) * tamanho) / 1000;

function codificar(F, s) {
  let out = '';
  for (const ch of String(s)) {
    const cp = ch.codePointAt(0);
    if (cp > 0xffff) continue;
    let g = F.m.gid(cp);
    if (!g) g = F.m.gid(63);
    if (!F.usados.has(g)) F.usados.set(g, cp);
    out += h4(g);
  }
  return `<${out}>`;
}

function quebrar(F, texto, tamanho, larguraMax) {
  const palavras = String(texto || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const linhas = [];
  let linha = '';
  for (const p of palavras) {
    const t = linha ? `${linha} ${p}` : p;
    if (largura(F, t, tamanho) <= larguraMax) linha = t;
    else {
      if (linha) linhas.push(linha);
      linha = p;
    }
  }
  if (linha || !linhas.length) linhas.push(linha);
  return linhas;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
class Pagina {
  constructor(fontes) {
    this.F = fontes;
    this.ops = [];
  }

  retangulo(x, y, w, h, c) {
    this.ops.push(`${cor3(c)} rg ${x.toFixed(2)} ${(A4_H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  linha(x1, y1, x2, y2, c, espessura = 0.6) {
    this.ops.push(
      `${cor3(c)} RG ${espessura} w ${x1.toFixed(2)} ${(A4_H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(A4_H - y2).toFixed(2)} l S`
    );
  }

  poligono(pontos, c) {
    const [p0, ...resto] = pontos;
    let s = `${cor3(c)} rg ${p0[0].toFixed(2)} ${(A4_H - p0[1]).toFixed(2)} m`;
    for (const [x, y] of resto) s += ` ${x.toFixed(2)} ${(A4_H - y).toFixed(2)} l`;
    this.ops.push(`${s} h f`);
  }

  texto(x, y, str, { tamanho = 10, fonte = 'C', cor = COR.noite, alinhar = 'esquerda' } = {}) {
    const F = this.F[fonte];
    let tx = x;
    if (alinhar === 'direita') tx = x - largura(F, str, tamanho);
    if (alinhar === 'centro') tx = x - largura(F, str, tamanho) / 2;
    this.ops.push(
      `BT /F_${fonte} ${tamanho} Tf ${cor3(cor)} rg ${tx.toFixed(2)} ${(A4_H - y).toFixed(2)} Td ${codificar(F, str)} Tj ET`
    );
  }
}

// Símbolo SID (triângulo-foguete), mesmas proporções do brand.mjs, escalado.
function simbolo(pagina, ox, oy, escala) {
  const p = ([x, y]) => [ox + (x - 250) * escala, oy + (y - 495) * escala];
  pagina.poligono([[374, 495], [500, 655], [374, 628], [250, 655]].map(p), COR.menta);
  pagina.poligono(
    [[374, 538], [394, 556], [399, 586], [392, 612], [356, 612], [349, 586], [354, 556]].map(p),
    COR.roxo
  );
}

// ---------------------------------------------------------------------------
// Serialização (binária, para embutir as fontes)
// ---------------------------------------------------------------------------
const tam = (x) => (typeof x === 'string' ? x.length : x.byteLength);

function utf16(s) {
  let out = '<FEFF';
  for (let i = 0; i < s.length; i++) out += h4(s.charCodeAt(i));
  return `${out}>`;
}

function cmapUnicode(F) {
  const pares = [...F.usados.entries()].sort((a, b) => a[0] - b[0]);
  let blocos = '';
  for (let i = 0; i < pares.length; i += 100) {
    const parte = pares.slice(i, i + 100);
    blocos += `${parte.length} beginbfchar\n${parte.map(([g, cp]) => `<${h4(g)}> <${h4(cp)}>`).join('\n')}\nendbfchar\n`;
  }
  return (
    '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n' +
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n' +
    '/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n' +
    '1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n' +
    `${blocos}endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`
  );
}

function embutir(F, objs, reservar) {
  const m = F.m;
  const arquivo = reservar();
  objs[arquivo] = { extra: `/Length1 ${m.bytes.byteLength}`, stream: m.bytes };
  const desc = reservar();
  objs[desc] =
    `<< /Type /FontDescriptor /FontName /${m.nome} /Flags 32 /FontBBox [${m.bbox.join(' ')}] ` +
    `/ItalicAngle 0 /Ascent ${m.ascent} /Descent ${m.descent} /CapHeight 700 /StemV 90 /FontFile2 ${arquivo} 0 R >>`;
  const usados = [...F.usados.keys()].sort((a, b) => a - b);
  const w = usados.map((g) => `${g} [${m.adv[g]}]`).join(' ');
  const cid = reservar();
  objs[cid] =
    `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${m.nome} ` +
    `/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> ` +
    `/FontDescriptor ${desc} 0 R /DW 1000 /W [${w}] /CIDToGIDMap /Identity >>`;
  const tu = reservar();
  objs[tu] = { extra: '', stream: cmapUnicode(F) };
  const t0 = reservar();
  objs[t0] =
    `<< /Type /Font /Subtype /Type0 /BaseFont /${m.nome} /Encoding /Identity-H ` +
    `/DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`;
  return t0;
}

function montar(objs, raiz, info) {
  const partes = [];
  let total = 0;
  const add = (x) => {
    partes.push(x);
    total += tam(x);
  };
  add('%PDF-1.4\n%âãÏÓ\n');
  const offs = [];
  for (let i = 1; i < objs.length; i++) {
    offs[i] = total;
    const o = objs[i];
    if (typeof o === 'string') add(`${i} 0 obj\n${o}\nendobj\n`);
    else {
      add(`${i} 0 obj\n<< ${o.extra ? `${o.extra} ` : ''}/Length ${tam(o.stream)} >>\nstream\n`);
      add(o.stream);
      add('\nendstream\nendobj\n');
    }
  }
  const xref = total;
  let x = `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) x += `${String(offs[i]).padStart(10, '0')} 00000 n \n`;
  x += `trailer\n<< /Size ${objs.length} /Root ${raiz} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  add(x);

  const bytes = new Uint8Array(total);
  let p = 0;
  for (const parte of partes) {
    if (typeof parte === 'string') {
      for (let i = 0; i < parte.length; i++) bytes[p++] = parte.charCodeAt(i) & 255;
    } else {
      bytes.set(parte, p);
      p += parte.byteLength;
    }
  }
  return bytes;
}

function serializar(paginas, fontes, meta) {
  const objs = [null];
  const reservar = () => {
    objs.push(null);
    return objs.length - 1;
  };
  const raiz = reservar();
  const arvore = reservar();
  const info = reservar();

  const refs = {};
  for (const chave of Object.keys(fontes)) {
    if (fontes[chave].usados.size) refs[chave] = embutir(fontes[chave], objs, reservar);
  }
  const recursos = Object.entries(refs)
    .map(([k, n]) => `/F_${k} ${n} 0 R`)
    .join(' ');

  const kids = [];
  for (const p of paginas) {
    const conteudo = reservar();
    objs[conteudo] = { extra: '', stream: p.ops.join('\n') };
    const pg = reservar();
    objs[pg] =
      `<< /Type /Page /Parent ${arvore} 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] ` +
      `/Resources << /Font << ${recursos} >> >> /Contents ${conteudo} 0 R >>`;
    kids.push(pg);
  }

  objs[raiz] = `<< /Type /Catalog /Pages ${arvore} 0 R >>`;
  objs[arvore] = `<< /Type /Pages /Kids [${kids.map((n) => `${n} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  objs[info] =
    `<< /Title ${utf16(meta.titulo)} /Author ${utf16(meta.autor)} ` +
    `/Creator ${utf16('Solution Innova Digital')} /Producer ${utf16('Solution Innova Digital · gerador no navegador')} >>`;
  return montar(objs, raiz, info);
}

// ---------------------------------------------------------------------------
// Layout do documento
// ---------------------------------------------------------------------------
/**
 * doc: { tipo, numero, emissao, validade, empresa, cliente, itens[{descricao,qtdFmt,unitFmt,subFmt}],
 *        subtotalFmt, descontoLabel, descontoFmt, totalFmt, pagamento, prazo, obs,
 *        objeto, valorTexto, rescisao, nomeEmitente }
 * buffers: { titulo, corpo, negrito } (ArrayBuffer de cada .ttf)
 */
export function gerarPdf(doc, buffers) {
  const fontes = {
    T: { m: lerFonte(buffers.titulo, 'BigShouldersDisplay-ExtraBold'), usados: new Map() },
    C: { m: lerFonte(buffers.corpo, 'Manrope-Regular'), usados: new Map() },
    N: { m: lerFonte(buffers.negrito, 'Manrope-ExtraBold'), usados: new Map() },
  };

  const paginas = [];
  let pagina;
  let y;
  const eContrato = doc.tipo === 'contrato';
  const titulo = eContrato ? 'CONTRATO' : 'ORÇAMENTO';

  function novaPagina(primeira) {
    pagina = new Pagina(fontes);
    paginas.push(pagina);
    if (primeira) {
      pagina.retangulo(0, 0, A4_W, 124, COR.roxo);
      pagina.retangulo(0, 124, A4_W, 4, COR.menta);
      simbolo(pagina, 48, 30, 0.3);
      pagina.texto(140, 48, 'SOLUTION INNOVA DIGITAL', { tamanho: 9, fonte: 'N', cor: COR.branco });
      pagina.texto(139, 96, titulo, { tamanho: 46, fonte: 'T', cor: COR.branco });
      pagina.texto(DIREITA, 48, `Nº ${doc.numero}`, { tamanho: 10, fonte: 'N', cor: COR.branco, alinhar: 'direita' });
      pagina.texto(DIREITA, 66, `Emissão ${doc.emissao}`, { tamanho: 9, cor: COR.branco, alinhar: 'direita' });
      pagina.texto(DIREITA, 81, `Validade ${doc.validade}`, { tamanho: 9, cor: COR.branco, alinhar: 'direita' });
      y = 162;
    } else {
      pagina.retangulo(0, 0, A4_W, 30, COR.roxo);
      pagina.retangulo(0, 30, A4_W, 2, COR.menta);
      pagina.texto(MARGEM_X, 20, `SOLUTION INNOVA DIGITAL · ${titulo} ${doc.numero}`, {
        tamanho: 8,
        fonte: 'N',
        cor: COR.branco,
      });
      y = 66;
    }
  }

  const garantir = (altura) => {
    if (y + altura > LIMITE_Y) novaPagina(false);
  };

  const rotulo = (x, yy, texto) =>
    pagina.texto(x, yy, texto.toUpperCase(), { tamanho: 10, fonte: 'T', cor: COR.tinta2 });

  function paragrafo(x, yy, texto, larg, tamanho = 9.5, fonte = 'C', cor = COR.noite) {
    const linhas = quebrar(fontes[fonte], texto, tamanho, larg);
    linhas.forEach((l, i) => pagina.texto(x, yy + i * (tamanho + 4), l, { tamanho, fonte, cor }));
    return linhas.length * (tamanho + 4);
  }

  novaPagina(true);

  // Partes
  rotulo(MARGEM_X, y, 'Emitente');
  rotulo(320, y, 'Cliente');
  pagina.texto(MARGEM_X, y + 20, doc.empresa.nome, { tamanho: 11.5, fonte: 'N' });
  const altEsq = 20 + paragrafo(MARGEM_X, y + 36, doc.empresa.contato, 236, 9, 'C', COR.tinta2);
  pagina.texto(320, y + 20, doc.cliente.nome, { tamanho: 11.5, fonte: 'N' });
  let altDir = 20;
  for (const campo of [doc.cliente.documento, doc.cliente.email, doc.cliente.telefone].filter(Boolean)) {
    altDir += paragrafo(320, y + altDir + 16, campo, 227, 9, 'C', COR.tinta2);
  }
  y += Math.max(altEsq, altDir) + 32;
  pagina.linha(MARGEM_X, y, DIREITA, y, COR.filete, 0.6);
  y += 24;

  // Itens
  garantir(60);
  pagina.texto(MARGEM_X, y, 'DESCRIÇÃO', { tamanho: 10, fonte: 'T', cor: COR.tinta2 });
  pagina.texto(392, y, 'QTD', { tamanho: 10, fonte: 'T', cor: COR.tinta2, alinhar: 'direita' });
  pagina.texto(468, y, 'UNITÁRIO', { tamanho: 10, fonte: 'T', cor: COR.tinta2, alinhar: 'direita' });
  pagina.texto(DIREITA, y, 'SUBTOTAL', { tamanho: 10, fonte: 'T', cor: COR.tinta2, alinhar: 'direita' });
  y += 8;
  pagina.linha(MARGEM_X, y, DIREITA, y, COR.noite, 1.2);
  y += 4;

  doc.itens.forEach((it, idx) => {
    const linhas = quebrar(fontes.C, it.descricao, 9.5, 300);
    const altura = linhas.length * 13 + 14;
    garantir(altura + 4);
    pagina.texto(MARGEM_X, y + 16, String(idx + 1).padStart(2, '0'), { tamanho: 9, fonte: 'T', cor: COR.roxo });
    linhas.forEach((l, i) => pagina.texto(MARGEM_X + 20, y + 16 + i * 13, l, { tamanho: 9.5 }));
    pagina.texto(392, y + 16, it.qtdFmt, { tamanho: 9.5, alinhar: 'direita' });
    pagina.texto(468, y + 16, it.unitFmt, { tamanho: 9.5, alinhar: 'direita' });
    pagina.texto(DIREITA, y + 16, it.subFmt, { tamanho: 9.5, fonte: 'N', alinhar: 'direita' });
    y += altura;
    pagina.linha(MARGEM_X, y, DIREITA, y, COR.filete, 0.5);
  });

  // Totais
  y += 24;
  garantir(120);
  pagina.texto(330, y, 'Subtotal', { tamanho: 9.5, cor: COR.tinta2 });
  pagina.texto(DIREITA, y, doc.subtotalFmt, { tamanho: 9.5, alinhar: 'direita' });
  y += 17;
  if (doc.descontoFmt) {
    pagina.texto(330, y, doc.descontoLabel, { tamanho: 9.5, cor: COR.tinta2 });
    pagina.texto(DIREITA, y, doc.descontoFmt, { tamanho: 9.5, alinhar: 'direita' });
    y += 17;
  }
  pagina.linha(330, y - 5, DIREITA, y - 5, COR.noite, 1.2);
  y += 26;
  pagina.texto(330, y, 'TOTAL', { tamanho: 16, fonte: 'T' });
  pagina.texto(DIREITA, y + 2, doc.totalFmt, { tamanho: 30, fonte: 'T', cor: COR.roxo, alinhar: 'direita' });
  y += 40;

  // Condições
  garantir(90);
  rotulo(MARGEM_X, y, 'Condições');
  y += 18;
  pagina.texto(MARGEM_X, y, 'Pagamento', { tamanho: 9.5, fonte: 'N' });
  y += paragrafo(140, y, doc.pagamento, 407) + 6;
  pagina.texto(MARGEM_X, y, 'Prazo', { tamanho: 9.5, fonte: 'N' });
  y += paragrafo(140, y, doc.prazo, 407) + 6;
  if (doc.obs) y += paragrafo(MARGEM_X, y, doc.obs, 499, 9, 'C', COR.tinta2) + 6;

  // Cláusulas (contrato)
  if (eContrato) {
    y += 16;
    garantir(120);
    rotulo(MARGEM_X, y, 'Cláusulas');
    y += 18;
    const clausulas = [
      ['1. Objeto', doc.objeto],
      ['2. Valor e pagamento', doc.valorTexto],
      ['3. Prazo', doc.prazo],
      ['4. Rescisão', doc.rescisao],
      ['5. Foro', 'Fica eleito o foro da comarca do domicílio do contratante.'],
    ];
    for (const [t, corpo] of clausulas) {
      garantir(46);
      pagina.texto(MARGEM_X, y, t, { tamanho: 9.5, fonte: 'N' });
      y += 14;
      y += paragrafo(MARGEM_X, y, corpo, 499) + 9;
    }
  }

  // Assinaturas
  garantir(130);
  y += 30;
  const rotuloA = eContrato ? 'Contratada' : 'Emitente';
  const rotuloB = eContrato ? 'Contratante' : 'Cliente (aceite)';
  pagina.linha(MARGEM_X, y + 40, 280, y + 40, COR.noite, 0.8);
  pagina.linha(315, y + 40, DIREITA, y + 40, COR.noite, 0.8);
  pagina.texto(MARGEM_X, y + 56, rotuloA.toUpperCase(), { tamanho: 9.5, fonte: 'T', cor: COR.tinta2 });
  pagina.texto(MARGEM_X, y + 70, doc.nomeEmitente, { tamanho: 9 });
  pagina.texto(315, y + 56, rotuloB.toUpperCase(), { tamanho: 9.5, fonte: 'T', cor: COR.tinta2 });
  pagina.texto(315, y + 70, doc.cliente.nome, { tamanho: 9 });
  y += 88;
  if (eContrato) {
    garantir(24);
    pagina.texto(
      MARGEM_X,
      y,
      'Modelo ilustrativo gerado no navegador. Revise com profissional jurídico antes de usar.',
      { tamanho: 7.5, cor: COR.tinta2 }
    );
  }

  // Rodapé de todas as páginas
  paginas.forEach((p, i) => {
    p.linha(MARGEM_X, 800, DIREITA, 800, COR.filete, 0.6);
    p.texto(MARGEM_X, 815, 'Solution Innova Digital · documento de demonstração', { tamanho: 7.5, cor: COR.tinta2 });
    p.texto(DIREITA, 815, `Página ${i + 1} de ${paginas.length}`, { tamanho: 7.5, cor: COR.tinta2, alinhar: 'direita' });
  });

  return serializar(paginas, fontes, {
    titulo: `${eContrato ? 'Contrato' : 'Orçamento'} ${doc.numero}`,
    autor: doc.nomeEmitente || 'Solution Innova Digital',
  });
}
