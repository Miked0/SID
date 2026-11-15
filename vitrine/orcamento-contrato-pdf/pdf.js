// Gerador de PDF no navegador, sem bibliotecas e sem rede.
// Usa a Helvetica padrão do PDF (não embutida) com codificação WinAnsi (pt-BR).

const A4_W = 595;
const A4_H = 842;
const MARGEM_X = 48;
const DIREITA = 547;
const LIMITE_Y = 760;

// Larguras Helvetica (AFM) para ASCII 32–126, em 1/1000 em.
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const WIN = { 0x2013: 0x96, 0x2014: 0x97, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95 };

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const COR = {
  roxo: hex('#6516BD'),
  roxoFundo: hex('#2B0A57'),
  menta: hex('#68E0BC'),
  noite: hex('#17141D'),
  tinta2: hex('#5E5670'),
  filete: hex('#E3DDEC'),
  branco: [1, 1, 1],
};

function toWin(str) {
  let out = '';
  for (const ch of String(str)) {
    let c = ch.codePointAt(0);
    if (WIN[c] !== undefined) c = WIN[c];
    else if (c > 255) c = 63; // '?' para caracteres fora do WinAnsi
    out += String.fromCharCode(c);
  }
  return out;
}

function larguraTexto(s, tamanho, negrito) {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    w += c >= 32 && c <= 126 ? HELV[c - 32] : 556;
  }
  return ((w * tamanho) / 1000) * (negrito ? 1.07 : 1);
}

function quebrar(texto, tamanho, larguraMax, negrito = false) {
  const palavras = String(texto || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const linhas = [];
  let linha = '';
  for (const p of palavras) {
    const t = linha ? `${linha} ${p}` : p;
    if (larguraTexto(toWin(t), tamanho, negrito) <= larguraMax) linha = t;
    else {
      if (linha) linhas.push(linha);
      linha = p;
    }
  }
  if (linha || !linhas.length) linhas.push(linha);
  return linhas;
}

function escapar(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function cor(c) {
  return c.map((v) => v.toFixed(3)).join(' ');
}

class Pagina {
  constructor() {
    this.ops = [];
  }

  retangulo(x, y, w, h, c) {
    this.ops.push(`${cor(c)} rg ${x.toFixed(2)} ${(A4_H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  linha(x1, y1, x2, y2, c, espessura = 0.6) {
    this.ops.push(`${cor(c)} RG ${espessura} w ${x1.toFixed(2)} ${(A4_H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(A4_H - y2).toFixed(2)} l S`);
  }

  poligono(pontos, c) {
    const [primeiro, ...resto] = pontos;
    let s = `${cor(c)} rg ${primeiro[0].toFixed(2)} ${(A4_H - primeiro[1]).toFixed(2)} m`;
    for (const [x, y] of resto) s += ` ${x.toFixed(2)} ${(A4_H - y).toFixed(2)} l`;
    this.ops.push(`${s} h f`);
  }

  texto(x, y, str, { tamanho = 10, negrito = false, cor: c = COR.noite, alinhar = 'esquerda' } = {}) {
    const s = toWin(str);
    let tx = x;
    if (alinhar === 'direita') tx = x - larguraTexto(s, tamanho, negrito);
    if (alinhar === 'centro') tx = x - larguraTexto(s, tamanho, negrito) / 2;
    this.ops.push(
      `BT /${negrito ? 'F2' : 'F1'} ${tamanho} Tf ${cor(c)} rg ${tx.toFixed(2)} ${(A4_H - y).toFixed(2)} Td (${escapar(s)}) Tj ET`
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

function serializar(paginas) {
  const total = paginas.length;
  const objs = [];
  const numerosPagina = [];
  const numerosConteudo = [];
  let proximo = 5;
  paginas.forEach(() => {
    numerosPagina.push(proximo);
    numerosConteudo.push(proximo + 1);
    proximo += 2;
  });

  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${numerosPagina.map((n) => `${n} 0 R`).join(' ')}] /Count ${total} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  paginas.forEach((p, i) => {
    const conteudo = p.ops.join('\n');
    objs[numerosPagina[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${numerosConteudo[i]} 0 R >>`;
    objs[numerosConteudo[i]] = `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`;
  });

  let saida = '%PDF-1.4\n%âãÏÓ\n';
  const deslocamentos = [];
  for (let i = 1; i < objs.length; i++) {
    deslocamentos[i] = saida.length;
    saida += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = saida.length;
  saida += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) {
    saida += `${String(deslocamentos[i]).padStart(10, '0')} 00000 n \n`;
  }
  saida += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(saida.length);
  for (let i = 0; i < saida.length; i++) bytes[i] = saida.charCodeAt(i) & 255;
  return bytes;
}

/**
 * doc: { tipo, numero, emissao, validade, empresa, cliente, itens[{descricao,qtdFmt,unitFmt,subFmt}],
 *        subtotalFmt, descontoLabel, descontoFmt, totalFmt, pagamento, prazo, obs,
 *        objeto, valorTexto, rescisao, nomeEmitente }
 */
export function gerarPdf(doc) {
  const paginas = [];
  let pagina;
  let y;
  const eContrato = doc.tipo === 'contrato';
  const titulo = eContrato ? 'CONTRATO' : 'ORÇAMENTO';

  function novaPagina(primeira) {
    pagina = new Pagina();
    paginas.push(pagina);
    if (primeira) {
      pagina.retangulo(0, 0, A4_W, 116, COR.roxo);
      simbolo(pagina, 48, 26, 0.3);
      pagina.texto(140, 46, 'SOLUTION INNOVA DIGITAL', { tamanho: 10, negrito: true, cor: COR.branco });
      pagina.texto(140, 84, titulo, { tamanho: 28, negrito: true, cor: COR.branco });
      pagina.texto(DIREITA, 46, `Nº ${doc.numero}`, { tamanho: 10, negrito: true, cor: COR.branco, alinhar: 'direita' });
      pagina.texto(DIREITA, 62, `Emissão: ${doc.emissao}`, { tamanho: 9, cor: COR.branco, alinhar: 'direita' });
      pagina.texto(DIREITA, 76, `Validade: ${doc.validade}`, { tamanho: 9, cor: COR.branco, alinhar: 'direita' });
      y = 150;
    } else {
      pagina.retangulo(0, 0, A4_W, 28, COR.roxo);
      pagina.texto(MARGEM_X, 18, `Solution Innova Digital · ${doc.numero}`, { tamanho: 8, negrito: true, cor: COR.branco });
      y = 62;
    }
  }

  function garantir(altura) {
    if (y + altura > LIMITE_Y) novaPagina(false);
  }

  function rotulo(x, yy, texto) {
    pagina.texto(x, yy, texto.toUpperCase(), { tamanho: 7.5, negrito: true, cor: COR.tinta2 });
  }

  function paragrafo(x, yy, texto, largura, tamanho = 9.5, negrito = false) {
    const linhas = quebrar(texto, tamanho, largura, negrito);
    linhas.forEach((l, i) => pagina.texto(x, yy + i * (tamanho + 3), l, { tamanho, negrito }));
    return linhas.length * (tamanho + 3);
  }

  novaPagina(true);

  // Partes
  rotulo(MARGEM_X, y, 'Emitente');
  rotulo(320, y, 'Cliente');
  pagina.texto(MARGEM_X, y + 18, doc.empresa.nome, { tamanho: 11, negrito: true });
  let altEsq = 18 + paragrafo(MARGEM_X, y + 32, doc.empresa.contato, 230);
  pagina.texto(320, y + 18, doc.cliente.nome, { tamanho: 11, negrito: true });
  let altDir = 18;
  for (const campo of [doc.cliente.documento, doc.cliente.email, doc.cliente.telefone].filter(Boolean)) {
    altDir += paragrafo(320, y + altDir + 14, campo, 227);
  }
  y += Math.max(altEsq, altDir) + 30;
  pagina.linha(MARGEM_X, y, DIREITA, y, COR.filete, 0.6);
  y += 20;

  // Itens
  garantir(60);
  pagina.texto(MARGEM_X, y, 'DESCRIÇÃO', { tamanho: 7.5, negrito: true, cor: COR.tinta2 });
  pagina.texto(396, y, 'QTD', { tamanho: 7.5, negrito: true, cor: COR.tinta2, alinhar: 'direita' });
  pagina.texto(470, y, 'UNIT.', { tamanho: 7.5, negrito: true, cor: COR.tinta2, alinhar: 'direita' });
  pagina.texto(DIREITA, y, 'SUBTOTAL', { tamanho: 7.5, negrito: true, cor: COR.tinta2, alinhar: 'direita' });
  y += 8;
  pagina.linha(MARGEM_X, y, DIREITA, y, COR.noite, 1.2);
  y += 6;

  for (const it of doc.itens) {
    const linhas = quebrar(it.descricao, 9.5, 320);
    const altura = linhas.length * 12.5 + 12;
    garantir(altura + 4);
    linhas.forEach((l, i) => pagina.texto(MARGEM_X, y + 14 + i * 12.5, l, { tamanho: 9.5 }));
    pagina.texto(396, y + 14, it.qtdFmt, { tamanho: 9.5, alinhar: 'direita' });
    pagina.texto(470, y + 14, it.unitFmt, { tamanho: 9.5, alinhar: 'direita' });
    pagina.texto(DIREITA, y + 14, it.subFmt, { tamanho: 9.5, negrito: true, alinhar: 'direita' });
    y += altura;
    pagina.linha(MARGEM_X, y, DIREITA, y, COR.filete, 0.5);
  }

  // Totais
  y += 22;
  garantir(110);
  pagina.texto(340, y, 'Subtotal', { tamanho: 9.5 });
  pagina.texto(DIREITA, y, doc.subtotalFmt, { tamanho: 9.5, alinhar: 'direita' });
  y += 16;
  if (doc.descontoFmt) {
    pagina.texto(340, y, doc.descontoLabel, { tamanho: 9.5 });
    pagina.texto(DIREITA, y, doc.descontoFmt, { tamanho: 9.5, alinhar: 'direita' });
    y += 16;
  }
  pagina.linha(340, y - 6, DIREITA, y - 6, COR.noite, 1.2);
  y += 10;
  pagina.texto(340, y + 4, 'Total', { tamanho: 12, negrito: true });
  pagina.texto(DIREITA, y + 6, doc.totalFmt, { tamanho: 18, negrito: true, cor: COR.roxo, alinhar: 'direita' });
  y += 44;

  // Condições
  garantir(90);
  rotulo(MARGEM_X, y, 'Condições');
  y += 16;
  pagina.texto(MARGEM_X, y, 'Pagamento:', { tamanho: 9.5, negrito: true });
  y += paragrafo(140, y, doc.pagamento, 400) + 6;
  pagina.texto(MARGEM_X, y, 'Prazo:', { tamanho: 9.5, negrito: true });
  y += paragrafo(140, y, doc.prazo, 400) + 6;
  if (doc.obs) y += paragrafo(MARGEM_X, y, doc.obs, 499, 9.5) + 6;

  // Cláusulas (contrato)
  if (eContrato) {
    y += 14;
    garantir(120);
    rotulo(MARGEM_X, y, 'Cláusulas');
    y += 16;
    const clausulas = [
      ['1. Objeto.', doc.objeto],
      ['2. Valor e pagamento.', doc.valorTexto],
      ['3. Prazo.', doc.prazo],
      ['4. Rescisão.', doc.rescisao],
      ['5. Foro.', 'Fica eleito o foro da comarca do domicílio do contratante.'],
    ];
    for (const [t, corpo] of clausulas) {
      garantir(44);
      pagina.texto(MARGEM_X, y, t, { tamanho: 9.5, negrito: true });
      y += 13;
      y += paragrafo(MARGEM_X, y, corpo, 499) + 8;
    }
  }

  // Assinaturas
  garantir(130);
  y += 26;
  const rotuloA = eContrato ? 'Contratante' : 'Emitente';
  const rotuloB = eContrato ? 'Contratada' : 'Cliente (aceite)';
  pagina.linha(MARGEM_X, y + 40, 280, y + 40, COR.noite, 0.8);
  pagina.linha(315, y + 40, DIREITA, y + 40, COR.noite, 0.8);
  pagina.texto(MARGEM_X, y + 54, `${rotuloA}: ${doc.nomeEmitente}`, { tamanho: 8.5, cor: COR.tinta2 });
  pagina.texto(315, y + 54, `${rotuloB}: ${doc.cliente.nome}`, { tamanho: 8.5, cor: COR.tinta2 });
  y += 70;
  if (eContrato) {
    garantir(30);
    pagina.texto(MARGEM_X, y, 'Modelo ilustrativo gerado no navegador. Revise com profissional jurídico antes de usar.', {
      tamanho: 7.5,
      cor: COR.tinta2,
    });
  }

  // Rodapé
  paginas.forEach((p, i) => {
    const atual = paginas[i];
    const antes = pagina;
    pagina = atual;
    pagina.linha(MARGEM_X, 800, DIREITA, 800, COR.filete, 0.6);
    pagina.texto(MARGEM_X, 814, 'Solution Innova Digital · documento de demonstração', { tamanho: 7.5, cor: COR.tinta2 });
    pagina.texto(DIREITA, 814, `Página ${i + 1} de ${paginas.length}`, { tamanho: 7.5, cor: COR.tinta2, alinhar: 'direita' });
    pagina = antes;
  });

  return serializar(paginas);
}
