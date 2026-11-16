import { gerarPdf } from './pdf.js';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CHAVE_RASCUNHO = 'sid-orcamento-rascunho-v1';
const CHAVE_HISTORICO = 'sid-orcamento-historico-v1';
const LIMITE_HISTORICO = 12;

const FONTES = {
  titulo: 'fonts/BigShouldersDisplay-800.ttf',
  corpo: 'fonts/Manrope-400.ttf',
  negrito: 'fonts/Manrope-800.ttf',
};

const PAGAMENTO = {
  'pix-vista': { rotulo: 'Pix à vista', parcelas: 1 },
  'pix-2': { rotulo: 'Pix em 2 parcelas iguais', parcelas: 2 },
  'pix-3': { rotulo: 'Pix em 3 parcelas iguais', parcelas: 3 },
  'credito-3': { rotulo: 'Cartão de crédito em 3x', parcelas: 3 },
};

// Dados de exemplo: emitente e cliente fictícios, do público-alvo da SID
// (um pequeno negócio emitindo para a cliente dele). Sem telefone do cliente
// para o botão do WhatsApp nunca abrir conversa com um número real.
const EXEMPLO = {
  tipo: 'orcamento',
  empNome: 'Studio Aurora Estética (exemplo)',
  empContato: '@studioaurora.exemplo · Pinheiros, São Paulo',
  cliNome: 'Mariana Costa (exemplo)',
  cliDoc: '123.456.789-00',
  cliEmail: 'cliente@exemplo.com',
  cliTel: '',
  numero: 'ORC-2026-014',
  emissao: '2026-11-15',
  validade: '2026-12-15',
  itens: [
    { descricao: 'Limpeza de pele profunda (pacote com 4 sessões)', qtd: '4', unit: '180' },
    { descricao: 'Peeling de diamante', qtd: '1', unit: '250' },
    { descricao: 'Máscara de LED (2 sessões)', qtd: '2', unit: '90' },
  ],
  desconto: '10',
  pagamento: 'pix-2',
  prazo: 'Sessões semanais a partir de 18/11/2026',
  obs: 'Valores em reais. Agendamentos pelo WhatsApp do studio.',
  objeto: 'Prestação de serviços estéticos faciais, conforme os itens e condições deste documento.',
  rescisao: 'Qualquer parte pode rescindir com aviso prévio de 7 dias. As sessões já realizadas permanecem devidas.',
  assinatura: null,
};

const form = $('#form');
const itensBox = $('#itens');
const tplItem = $('#tpl-item');
const tplHist = $('#tpl-hist');
const btnGerar = $('#gerar');
const errosBox = $('#erros');
const papel = $('#papel');

// ---------------------------------------------------------------------------
// Armazenamento local (só conveniência: falha em silêncio quando bloqueado)
// ---------------------------------------------------------------------------
const armazenamento = {
  ler(chave, padrao) {
    try {
      const v = window.localStorage.getItem(chave);
      return v ? JSON.parse(v) : padrao;
    } catch {
      return padrao;
    }
  },
  gravar(chave, valor) {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  },
  apagar(chave) {
    try {
      window.localStorage.removeItem(chave);
    } catch {
      /* sem armazenamento */
    }
  },
};

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function parseNum(valor) {
  let t = String(valor ?? '').trim().replace(/R\$|\s/g, '');
  if (!t) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

const minusculaInicial = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const br = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const txt = (v) => (v && String(v).trim() ? String(v).trim() : '—');
const hojeISO = () => {
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const somarDias = (iso, dias) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

let toastTimer;
function toast(msg, tipo = 'ok') {
  const el = $('#toast');
  el.textContent = msg;
  el.dataset.tipo = tipo;
  el.classList.remove('visivel');
  void el.offsetWidth;
  el.classList.add('visivel');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visivel'), 3600);
}

// ---------------------------------------------------------------------------
// Modelo
// ---------------------------------------------------------------------------
function lerForm() {
  const campo = (nome) => (form.elements[nome] ? form.elements[nome].value : '');
  const itens = $$('.item', itensBox)
    .filter((l) => !l.classList.contains('saindo'))
    .map((linha) => ({
      descricao: $('[name=descricao]', linha).value.trim(),
      qtd: $('[name=qtd]', linha).value,
      unit: $('[name=unit]', linha).value,
      linha,
    }));
  return {
    tipo: form.elements.tipo.value,
    empNome: campo('empNome').trim(),
    empContato: campo('empContato').trim(),
    cliNome: campo('cliNome').trim(),
    cliDoc: campo('cliDoc').trim(),
    cliEmail: campo('cliEmail').trim(),
    cliTel: campo('cliTel').trim(),
    numero: campo('numero').trim(),
    emissao: campo('emissao'),
    validade: campo('validade'),
    itens,
    desconto: campo('desconto'),
    pagamento: campo('pagamento'),
    prazo: campo('prazo').trim(),
    obs: campo('obs').trim(),
    objeto: campo('objeto').trim(),
    rescisao: campo('rescisao').trim(),
  };
}

let assinatura = null;

function instantaneo(m) {
  const { itens, ...resto } = m;
  return {
    ...resto,
    itens: itens.map(({ descricao, qtd, unit }) => ({ descricao, qtd, unit })),
    assinatura,
  };
}

function calcular(m) {
  const itens = m.itens
    .filter((i) => i.descricao || i.qtd || i.unit)
    .map((i) => {
      const q = parseNum(i.qtd);
      const u = parseNum(i.unit);
      return { ...i, q, u, sub: Number.isFinite(q) && Number.isFinite(u) ? q * u : NaN };
    });
  const subtotal = itens.reduce((s, i) => s + (i.descricao && Number.isFinite(i.sub) ? i.sub : 0), 0);
  const pct = String(m.desconto).trim() === '' ? 0 : parseNum(m.desconto);
  const descontoValor = Number.isFinite(pct) && pct > 0 && pct <= 100 ? (subtotal * pct) / 100 : 0;
  const total = subtotal - descontoValor;
  return { itens, subtotal, pct, descontoValor, total };
}

function textoPagamento(m, c) {
  const p = PAGAMENTO[m.pagamento] ?? PAGAMENTO['pix-vista'];
  if (p.parcelas === 1) return `${p.rotulo}, ${moeda.format(c.total)}`;
  return `${p.rotulo}, de ${moeda.format(c.total / p.parcelas)} cada`;
}

function validar(m, c) {
  const erros = [];
  const ref = (el, msg) => erros.push({ el, msg });
  if (!m.empNome) ref(form.elements.empNome, 'Informe o nome da sua empresa.');
  if (!m.cliNome) ref(form.elements.cliNome, 'Informe o nome do cliente para gerar o documento.');
  if (!m.numero) ref(form.elements.numero, 'Informe o número do documento, por exemplo ORC-2026-001.');
  if (!m.emissao) ref(form.elements.emissao, 'Escolha a data de emissão.');
  if (m.emissao && m.validade && m.validade < m.emissao) {
    ref(form.elements.validade, 'A validade precisa ser depois da data de emissão.');
  }
  if (!c.itens.some((i) => i.descricao)) ref($('#add-item'), 'Adicione pelo menos um item com descrição.');
  c.itens.forEach((i, n) => {
    if (i.descricao && (!Number.isFinite(i.q) || i.q <= 0)) {
      ref($('[name=qtd]', i.linha), `Quantidade do item ${n + 1} precisa ser maior que zero.`);
    }
    if (i.descricao && (!Number.isFinite(i.u) || i.u < 0)) {
      ref($('[name=unit]', i.linha), `Valor unitário do item ${n + 1} precisa ser um número, como 1.500,00.`);
    }
    if (!i.descricao && (i.unit || (i.qtd && i.qtd !== '1'))) {
      ref($('[name=descricao]', i.linha), `Descreva o item ${n + 1} ou remova a linha.`);
    }
  });
  if (String(m.desconto).trim() !== '' && (!Number.isFinite(c.pct) || c.pct < 0 || c.pct > 100)) {
    ref(form.elements.desconto, 'Desconto deve ficar entre 0 e 100%.');
  }
  return erros;
}

function marcarErros(erros) {
  $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
  erros.forEach(({ el }) => el && el.setAttribute('aria-invalid', 'true'));
}

function mostrarErros(erros) {
  errosBox.replaceChildren();
  errosBox.hidden = !erros.length;
  if (!erros.length) return;
  const titulo = document.createElement('strong');
  titulo.textContent = `Corrija ${erros.length === 1 ? '1 ponto' : `${erros.length} pontos`} antes de gerar o PDF:`;
  const lista = document.createElement('ul');
  for (const { el, msg } of erros) {
    const li = document.createElement('li');
    const bt = document.createElement('button');
    bt.type = 'button';
    bt.className = 'erro-link';
    bt.textContent = msg;
    bt.addEventListener('click', () => el && el.focus());
    li.append(bt);
    lista.append(li);
  }
  errosBox.append(titulo, lista);
  errosBox.classList.remove('tremer');
  void errosBox.offsetWidth;
  errosBox.classList.add('tremer');
}

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------
function renumerar() {
  $$('.item', itensBox).forEach((linha, idx) => {
    const n = idx + 1;
    $('.item-num', linha).textContent = String(n).padStart(2, '0');
    $('[name=descricao]', linha).setAttribute('aria-label', `Descrição do item ${n}`);
    $('[name=qtd]', linha).setAttribute('aria-label', `Quantidade do item ${n}`);
    $('[name=unit]', linha).setAttribute('aria-label', `Valor unitário do item ${n}, em reais`);
    $('.remover', linha).setAttribute('aria-label', `Remover item ${n}`);
  });
}

function novaLinha(valores = {}, animar = false) {
  const linha = tplItem.content.firstElementChild.cloneNode(true);
  $('[name=descricao]', linha).value = valores.descricao ?? '';
  $('[name=qtd]', linha).value = valores.qtd ?? '1';
  $('[name=unit]', linha).value = valores.unit ?? '';
  if (animar) linha.classList.add('entrando');
  itensBox.append(linha);
  renumerar();
  return linha;
}

function atualizarSubtotais() {
  $$('.item', itensBox).forEach((linha) => {
    const q = parseNum($('[name=qtd]', linha).value);
    const u = parseNum($('[name=unit]', linha).value);
    const sub = Number.isFinite(q) && Number.isFinite(u) ? q * u : NaN;
    $('.sub', linha).textContent = Number.isFinite(sub) ? moeda.format(sub) : '—';
  });
}

// ---------------------------------------------------------------------------
// Prévia
// ---------------------------------------------------------------------------
let totalAtual = 0;
let animTotal;
function animarTotal(destino) {
  const el = $('#p-total');
  cancelAnimationFrame(animTotal);
  const inicio = totalAtual;
  if (reduzMovimento() || inicio === destino) {
    totalAtual = destino;
    el.textContent = moeda.format(destino);
    return;
  }
  const t0 = performance.now();
  const dur = 520;
  const passo = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - (1 - k) ** 3;
    totalAtual = inicio + (destino - inicio) * e;
    el.textContent = moeda.format(totalAtual);
    if (k < 1) animTotal = requestAnimationFrame(passo);
    else totalAtual = destino;
  };
  animTotal = requestAnimationFrame(passo);
}

function pulsarPapel() {
  if (reduzMovimento()) return;
  papel.classList.remove('pulso');
  void papel.offsetWidth;
  papel.classList.add('pulso');
}

function atualizarTipo() {
  const contrato = form.elements.tipo.value === 'contrato';
  form.dataset.tipo = contrato ? 'contrato' : 'orcamento';
  $('#campos-contrato').hidden = !contrato;
  $('#p-contrato').hidden = !contrato;
  $('#p-titulo').textContent = contrato ? 'Contrato' : 'Orçamento';
  $('#p-ass1-rot').textContent = contrato ? 'Contratada' : 'Emitente';
  $('#p-ass2-rot').textContent = contrato ? 'Contratante' : 'Cliente (aceite)';
  $('.btn-rotulo', btnGerar).textContent = contrato ? 'Gerar PDF do contrato' : 'Gerar PDF do orçamento';
}

function renderizar({ pulso = false } = {}) {
  const m = lerForm();
  const c = calcular(m);
  const set = (id, v) => {
    $(`#${id}`).textContent = v;
  };
  set('p-numero', txt(m.numero));
  set('p-emissao', br(m.emissao));
  set('p-validade', br(m.validade));
  set('p-emp-nome', txt(m.empNome));
  set('p-marca', txt(m.empNome));
  $('#enviar-whats').href = linkWhats(m, c);
  set('p-emp-contato', m.empContato);
  set('p-cli-nome', txt(m.cliNome));
  set('p-cli-doc', m.cliDoc);
  set('p-cli-email', m.cliEmail);
  set('p-cli-tel', m.cliTel);

  const corpo = $('#p-itens');
  corpo.replaceChildren();
  const validas = c.itens.filter((i) => i.descricao);
  validas.forEach((i, idx) => {
    const tr = document.createElement('tr');
    const celulas = [
      [i.descricao, '', String(idx + 1).padStart(2, '0')],
      [Number.isFinite(i.q) ? numero.format(i.q) : '—', 'n'],
      [Number.isFinite(i.u) ? moeda.format(i.u) : '—', 'n'],
      [Number.isFinite(i.sub) ? moeda.format(i.sub) : '—', 'n'],
    ];
    for (const [v, cls, num] of celulas) {
      const td = document.createElement('td');
      if (num) {
        const s = document.createElement('span');
        s.className = 'p-num';
        s.textContent = num;
        td.append(s, document.createTextNode(v));
      } else td.textContent = v;
      if (cls) td.className = cls;
      tr.append(td);
    }
    corpo.append(tr);
  });
  if (!validas.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'p-vazio';
    td.textContent = 'Nenhum item ainda. Adicione o primeiro no formulário.';
    tr.append(td);
    corpo.append(tr);
  }

  set('p-subtotal', moeda.format(c.subtotal));
  $('#p-desc-linha').hidden = !c.descontoValor;
  set('p-desc-rotulo', `Desconto (${numero.format(c.pct || 0)}%)`);
  set('p-desc', `− ${moeda.format(c.descontoValor)}`);
  animarTotal(c.total);
  set('p-pagamento', textoPagamento(m, c));
  set('p-prazo', txt(m.prazo));
  set('p-prazo2', txt(m.prazo));
  set('p-obs', m.obs);
  set('p-objeto', txt(m.objeto));
  set('p-valor', `O valor total é ${moeda.format(c.total)}, pago da seguinte forma: ${minusculaInicial(textoPagamento(m, c))}.`);
  set('p-rescisao', txt(m.rescisao));
  set('p-ass1', txt(m.empNome));
  set('p-ass2', txt(m.cliNome));
  atualizarSubtotais();
  if (pulso) pulsarPapel();
}

// ---------------------------------------------------------------------------
// Preencher, rascunho e histórico
// ---------------------------------------------------------------------------
function preencher(dados) {
  form.elements.tipo.value = dados.tipo === 'contrato' ? 'contrato' : 'orcamento';
  for (const k of Object.keys(dados)) {
    if (k === 'tipo' || k === 'itens') continue;
    if (form.elements[k]) form.elements[k].value = dados[k] ?? '';
  }
  assinatura = dados.assinatura ?? null;
  renderAssinatura();
  itensBox.replaceChildren();
  (dados.itens?.length ? dados.itens : [{}]).forEach((i) => novaLinha(i));
  mostrarErros([]);
  marcarErros([]);
  atualizarTipo();
  renderizar({ pulso: true });
  $('#badge-status').textContent = 'Rascunho';
  $('#badge-status').dataset.estado = 'rascunho';
}

let salvarTimer;
function agendarRascunho() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    const ok = armazenamento.gravar(CHAVE_RASCUNHO, { salvoEm: Date.now(), dados: instantaneo(lerForm()) });
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    $('#salvo').textContent = ok ? `Rascunho salvo às ${hora}` : 'Este navegador não permite salvar o rascunho.';
    $('#salvo').classList.toggle('ok', ok);
  }, 450);
}

const lerHistorico = () => {
  const h = armazenamento.ler(CHAVE_HISTORICO, []);
  return Array.isArray(h) ? h : [];
};

function proximoNumero(tipo) {
  const prefixo = tipo === 'contrato' ? 'CT' : 'ORC';
  const ano = new Date().getFullYear();
  const usados = lerHistorico()
    .map((h) => String(h.dados?.numero || ''))
    .filter((n) => n.startsWith(`${prefixo}-${ano}-`))
    .map((n) => parseInt(n.split('-')[2], 10))
    .filter(Number.isFinite);
  const prox = (usados.length ? Math.max(...usados) : 0) + 1;
  return `${prefixo}-${ano}-${String(prox).padStart(3, '0')}`;
}

function registrarNoHistorico(m, c) {
  const hist = lerHistorico();
  const entrada = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    criadoEm: Date.now(),
    tipo: m.tipo,
    numero: m.numero,
    cliente: m.cliNome,
    total: c.total,
    dados: instantaneo(m),
  };
  const semDuplicado = hist.filter((h) => !(h.numero === entrada.numero && h.tipo === entrada.tipo));
  const novo = [entrada, ...semDuplicado].slice(0, LIMITE_HISTORICO);
  const ok = armazenamento.gravar(CHAVE_HISTORICO, novo);
  renderizarHistorico(ok ? entrada.id : null);
  return ok;
}

function renderizarHistorico(destaque = null) {
  const hist = lerHistorico();
  const lista = $('#hist-lista');
  lista.replaceChildren();
  $('#hist-vazio').hidden = hist.length > 0;
  $('#limpar-historico').hidden = !hist.length;
  for (const h of hist) {
    const li = tplHist.content.firstElementChild.cloneNode(true);
    li.dataset.id = h.id;
    li.dataset.tipo = h.tipo;
    $('.hist-tipo', li).textContent = h.tipo === 'contrato' ? 'Contrato' : 'Orçamento';
    $('.hist-num', li).textContent = h.numero || 'Sem número';
    $('.hist-cli', li).textContent = h.cliente || 'Cliente sem nome';
    $('.hist-total', li).textContent = moeda.format(Number(h.total) || 0);
    $('.hist-data', li).textContent = new Date(h.criadoEm).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    for (const bt of $$('button', li)) {
      bt.setAttribute('aria-label', `${bt.textContent.trim()}: ${h.numero || 'documento'}`);
    }
    if (h.id === destaque) li.classList.add('novo');
    lista.append(li);
  }
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------
let fontesPromise = null;
function carregarFontes() {
  if (!fontesPromise) {
    fontesPromise = Promise.all(
      Object.entries(FONTES).map(async ([chave, url]) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Fonte ${url}: ${r.status}`);
        return [chave, await r.arrayBuffer()];
      })
    )
      .then(Object.fromEntries)
      .catch((e) => {
        fontesPromise = null;
        throw e;
      });
  }
  return fontesPromise;
}

function montarDocumento(m, c) {
  return {
    tipo: m.tipo,
    numero: m.numero,
    emissao: br(m.emissao),
    validade: m.validade ? br(m.validade) : '—',
    empresa: { nome: m.empNome, contato: m.empContato },
    nomeEmitente: m.empNome,
    cliente: { nome: m.cliNome, documento: m.cliDoc, email: m.cliEmail, telefone: m.cliTel },
    itens: c.itens
      .filter((i) => i.descricao)
      .map((i) => ({
        descricao: i.descricao,
        qtdFmt: Number.isFinite(i.q) ? numero.format(i.q) : '—',
        unitFmt: Number.isFinite(i.u) ? moeda.format(i.u) : '—',
        subFmt: Number.isFinite(i.sub) ? moeda.format(i.sub) : '—',
      })),
    subtotalFmt: moeda.format(c.subtotal),
    descontoLabel: `Desconto (${numero.format(c.pct || 0)}%)`,
    descontoFmt: c.descontoValor ? `− ${moeda.format(c.descontoValor)}` : '',
    totalFmt: moeda.format(c.total),
    pagamento: textoPagamento(m, c),
    prazo: m.prazo || '—',
    obs: m.obs,
    objeto: m.objeto || '—',
    valorTexto: `O valor total é ${moeda.format(c.total)}, pago da seguinte forma: ${minusculaInicial(textoPagamento(m, c))}.`,
    rescisao: m.rescisao || '—',
    assinatura: m.assinatura === undefined ? assinatura : m.assinatura,
  };
}

function nomeArquivo(m) {
  const base = `${m.tipo === 'contrato' ? 'contrato' : 'orcamento'}-${m.numero || 'sem-numero'}`;
  return `${base}.pdf`.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
}

function baixar(bytes, nome) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function poeira(origem) {
  if (reduzMovimento()) return;
  const r = origem.getBoundingClientRect();
  const camada = document.createElement('div');
  camada.className = 'explosao';
  camada.setAttribute('aria-hidden', 'true');
  camada.style.left = `${r.left + r.width / 2}px`;
  camada.style.top = `${r.top + r.height / 2}px`;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('i');
    const ang = (-150 + Math.random() * 120) * (Math.PI / 180);
    const dist = 50 + Math.random() * 70;
    p.style.setProperty('--tx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--ty', `${Math.sin(ang) * dist}px`);
    p.style.setProperty('--d', `${Math.random() * 80}ms`);
    if (i % 3 === 0) p.classList.add('menta');
    camada.append(p);
  }
  document.body.append(camada);
  setTimeout(() => camada.remove(), 1000);
}

async function produzirPdf(m) {
  const c = calcular(m);
  const fontes = await carregarFontes();
  const bytes = gerarPdf(montarDocumento(m, c), fontes);
  baixar(bytes, nomeArquivo(m));
  return c;
}

async function onGerar() {
  const m = lerForm();
  const c = calcular(m);
  const erros = validar(m, c);
  marcarErros(erros);
  mostrarErros(erros);
  if (erros.length) {
    toast('Ainda há pontos para corrigir. Veja a lista no formulário.', 'erro');
    erros.find((e) => e.el)?.el.focus();
    return;
  }

  btnGerar.disabled = true;
  btnGerar.classList.add('carregando');
  const rotulo = $('.btn-rotulo', btnGerar);
  const anterior = rotulo.textContent;
  rotulo.textContent = 'Renderizando PDF…';
  try {
    await new Promise((r) => setTimeout(r, 60));
    await produzirPdf(m);
    const salvo = registrarNoHistorico(m, c);
    $('#badge-status').textContent = 'PDF gerado';
    $('#badge-status').dataset.estado = 'gerado';
    poeira(btnGerar);
    toast(salvo ? 'PDF gerado e guardado no histórico. Envie ao cliente para assinar.' : 'PDF gerado. Envie ao cliente para assinar.');
  } catch (err) {
    console.warn(err);
    toast('Não foi possível gerar o PDF agora. Verifique a conexão e tente de novo.', 'erro');
  } finally {
    rotulo.textContent = anterior;
    btnGerar.disabled = false;
    btnGerar.classList.remove('carregando');
  }
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------
function linkWhats(m, c) {
  const dig = (m.cliTel || '').replace(/\D/g, '');
  let num = '';
  if (dig.length === 10 || dig.length === 11) num = `55${dig}`;
  else if (dig.startsWith('55') && (dig.length === 12 || dig.length === 13)) num = dig;
  const doc = m.tipo === 'contrato' ? 'o contrato' : 'o orçamento';
  const primeiro = (m.cliNome || '').replace(/\(.*?\)/g, '').trim().split(/\s+/)[0] || '';
  const msg =
    `Olá${primeiro ? `, ${primeiro}` : ''}! Segue ${doc} ${m.numero || ''} no valor de ${moeda.format(c.total)}. ` +
    `Vou anexar o PDF aqui na conversa. Qualquer dúvida, é só me chamar.${m.empNome ? `\n${m.empNome}` : ''}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg.replace(/\s+(?=\n)/g, ''))}`;
}

// ---------------------------------------------------------------------------
// Assinatura do emitente
// ---------------------------------------------------------------------------
const SVG = 'http://www.w3.org/2000/svg';
const dlg = $('#dlg-assinar');
const tela = $('#tela');
const ctx = tela.getContext('2d');
let tracos = [];
let tracoAtual = null;

const dataHora = (t) =>
  new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function renderAssinatura() {
  const alvo = $('#p-assin-marca');
  const quando = $('#p-assin-quando');
  alvo.replaceChildren();
  alvo.hidden = !assinatura;
  quando.hidden = !assinatura;
  $('#remover-assinatura').hidden = !assinatura;
  $('#abrir-assinatura-rot').textContent = assinatura ? 'Assinar de novo' : 'Assinar documento';
  if (!assinatura) return;
  if (assinatura.tipo === 'desenho') {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 300 100');
    svg.setAttribute('aria-hidden', 'true');
    for (const t of assinatura.tracos) {
      const path = document.createElementNS(SVG, 'path');
      const pts = t.length === 1 ? [t[0], [t[0][0] + 0.002, t[0][1]]] : t;
      path.setAttribute('d', pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 300).toFixed(1)} ${(y * 100).toFixed(1)}`).join(' '));
      svg.append(path);
    }
    alvo.append(svg);
  } else {
    const nome = document.createElement('span');
    nome.className = 'assin-nome';
    nome.textContent = assinatura.nome;
    alvo.append(nome);
  }
  quando.textContent = `Assinado em ${dataHora(assinatura.quando)}`;
}

function ajustarTela() {
  const r = tela.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  tela.width = Math.max(1, Math.round(r.width * dpr));
  tela.height = Math.max(1, Math.round(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redesenhar();
}

function redesenhar() {
  const r = tela.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  ctx.strokeStyle = '#2B0A57';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const t of tracos) {
    ctx.beginPath();
    t.forEach(([x, y], i) => (i ? ctx.lineTo(x * r.width, y * r.height) : ctx.moveTo(x * r.width, y * r.height)));
    if (t.length === 1) ctx.lineTo(t[0][0] * r.width + 0.5, t[0][1] * r.height);
    ctx.stroke();
  }
  tela.closest('.tela-wrap').classList.toggle('com-traco', tracos.length > 0);
}

function pontoDe(e) {
  const r = tela.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  return [Number(x.toFixed(4)), Number(y.toFixed(4))];
}

tela.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  tela.setPointerCapture(e.pointerId);
  tracoAtual = [pontoDe(e)];
  tracos.push(tracoAtual);
  $('#dlg-msg').textContent = '';
  redesenhar();
});
tela.addEventListener('pointermove', (e) => {
  if (!tracoAtual) return;
  const p = pontoDe(e);
  const u = tracoAtual[tracoAtual.length - 1];
  if (Math.hypot(p[0] - u[0], (p[1] - u[1]) / 3) < 0.004) return;
  if (tracos.reduce((n, t) => n + t.length, 0) > 2400) return;
  tracoAtual.push(p);
  redesenhar();
});
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  tela.addEventListener(ev, () => {
    tracoAtual = null;
  });
}

function trocarAba(qual) {
  const desenhar = qual === 'desenhar';
  $('#aba-desenhar').setAttribute('aria-selected', String(desenhar));
  $('#aba-clique').setAttribute('aria-selected', String(!desenhar));
  $('#aba-desenhar').tabIndex = desenhar ? 0 : -1;
  $('#aba-clique').tabIndex = desenhar ? -1 : 0;
  $('#painel-desenhar').hidden = !desenhar;
  $('#painel-clique').hidden = desenhar;
  dlg.dataset.aba = qual;
  if (desenhar) requestAnimationFrame(ajustarTela);
}

function abrirAssinatura() {
  const nome = form.elements.empNome.value.trim() || 'Emitente';
  tracos = [];
  $('#dlg-msg').textContent = '';
  $('#clique-nome').textContent = nome;
  $('#clique-quando').textContent = dataHora(Date.now());
  trocarAba('desenhar');
  dlg.showModal();
  requestAnimationFrame(ajustarTela);
}

function aplicarAssinatura(nova) {
  assinatura = nova;
  renderAssinatura();
  dlg.close();
  pulsarPapel();
  poeira($('#p-assin-marca').hidden ? $('#abrir-assinatura') : $('#p-assin-marca'));
  agendarRascunho();
  toast('Assinatura do emitente aplicada. Ela também sai no PDF.');
}

$('#abrir-assinatura').addEventListener('click', abrirAssinatura);
$('#remover-assinatura').addEventListener('click', () => {
  assinatura = null;
  renderAssinatura();
  agendarRascunho();
  $('#abrir-assinatura').focus();
  toast('Assinatura removida.');
});
$('#limpar-tela').addEventListener('click', () => {
  tracos = [];
  redesenhar();
  tela.focus();
});
$('#confirmar-desenho').addEventListener('click', () => {
  const pontos = tracos.reduce((n, t) => n + t.length, 0);
  if (pontos < 4) {
    $('#dlg-msg').textContent = 'Desenhe sua assinatura na área acima antes de confirmar.';
    return;
  }
  aplicarAssinatura({ tipo: 'desenho', tracos: tracos.map((t) => t.map((p) => [...p])), quando: Date.now() });
});
$('#assinar-clique').addEventListener('click', () => {
  aplicarAssinatura({ tipo: 'clique', nome: form.elements.empNome.value.trim() || 'Emitente', quando: Date.now() });
});
$('#aba-desenhar').addEventListener('click', () => trocarAba('desenhar'));
$('#aba-clique').addEventListener('click', () => trocarAba('clique'));
$('.abas').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const proxima = dlg.dataset.aba === 'desenhar' ? 'clique' : 'desenhar';
  trocarAba(proxima);
  $(proxima === 'desenhar' ? '#aba-desenhar' : '#aba-clique').focus();
});
$$('[data-fechar]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
dlg.addEventListener('click', (e) => {
  if (e.target === dlg) dlg.close();
});
dlg.addEventListener('close', () => $('#abrir-assinatura').focus());
window.addEventListener('resize', () => {
  if (dlg.open && dlg.dataset.aba === 'desenhar') ajustarTela();
});

$('#enviar-whats').addEventListener('click', () => {
  toast('Abrindo o WhatsApp com a mensagem pronta. Anexe o PDF baixado na conversa.');
});

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
form.addEventListener('input', (e) => {
  if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  if (e.target.name === 'tipo') return;
  renderizar();
  $('#badge-status').textContent = 'Rascunho';
  $('#badge-status').dataset.estado = 'rascunho';
  agendarRascunho();
});

form.addEventListener('change', (e) => {
  if (e.target.name === 'tipo') {
    const campoNum = form.elements.numero;
    const contrato = e.target.value === 'contrato';
    campoNum.value = contrato ? campoNum.value.replace(/^ORC-/, 'CT-') : campoNum.value.replace(/^CT-/, 'ORC-');
    atualizarTipo();
    renderizar({ pulso: true });
    agendarRascunho();
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  onGerar();
});

$('#add-item').addEventListener('click', () => {
  const linha = novaLinha({ qtd: '1' }, true);
  renderizar();
  agendarRascunho();
  $('[name=descricao]', linha).focus();
});

itensBox.addEventListener('click', (e) => {
  const botao = e.target.closest('.remover');
  if (!botao) return;
  const linha = botao.closest('.item');
  const sair = () => {
    linha.remove();
    renumerar();
    renderizar();
    agendarRascunho();
  };
  $('#add-item').focus();
  if (reduzMovimento()) sair();
  else {
    linha.classList.add('saindo');
    renderizar();
    setTimeout(sair, 220);
  }
});

$('#restaurar').addEventListener('click', () => {
  preencher(EXEMPLO);
  agendarRascunho();
  toast('Exemplo restaurado.');
});

$('#novo').addEventListener('click', () => {
  const tipo = form.elements.tipo.value;
  const hoje = hojeISO();
  preencher({
    tipo,
    empNome: form.elements.empNome.value || EXEMPLO.empNome,
    empContato: form.elements.empContato.value || EXEMPLO.empContato,
    cliNome: '',
    cliDoc: '',
    cliEmail: '',
    cliTel: '',
    numero: proximoNumero(tipo),
    emissao: hoje,
    validade: somarDias(hoje, 30),
    itens: [{ descricao: '', qtd: '1', unit: '' }],
    desconto: '',
    pagamento: 'pix-vista',
    prazo: '',
    obs: '',
    objeto: '',
    rescisao: EXEMPLO.rescisao,
    assinatura: null,
  });
  agendarRascunho();
  $('#aviso-rascunho').hidden = true;
  form.elements.cliNome.focus();
  toast('Documento novo em branco. Os dados da sua empresa foram mantidos.');
});

$('#descartar').addEventListener('click', () => {
  armazenamento.apagar(CHAVE_RASCUNHO);
  preencher(EXEMPLO);
  $('#aviso-rascunho').hidden = true;
  $('#salvo').textContent = '';
  toast('Rascunho descartado.');
});

$('#hist-lista').addEventListener('click', async (e) => {
  const bt = e.target.closest('button[data-acao]');
  if (!bt) return;
  const li = bt.closest('.hist-item');
  const hist = lerHistorico();
  const entrada = hist.find((h) => h.id === li.dataset.id);
  if (!entrada) return;
  const acao = bt.dataset.acao;
  if (acao === 'abrir') {
    preencher(entrada.dados);
    agendarRascunho();
    $('#editor').focus();
    $('#editor').scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
    toast(`${entrada.numero} aberto para edição.`);
  } else if (acao === 'baixar') {
    try {
      bt.disabled = true;
      const m = { ...entrada.dados, itens: entrada.dados.itens.map((i) => ({ ...i })) };
      await produzirPdf(m);
      toast(`${entrada.numero} baixado de novo.`);
    } catch (err) {
      console.warn(err);
      toast('Não foi possível gerar o PDF agora. Tente de novo.', 'erro');
    } finally {
      bt.disabled = false;
    }
  } else if (acao === 'excluir') {
    armazenamento.gravar(
      CHAVE_HISTORICO,
      hist.filter((h) => h.id !== entrada.id)
    );
    renderizarHistorico();
    toast(`${entrada.numero} removido do histórico.`);
  }
});

$('#limpar-historico').addEventListener('click', () => {
  armazenamento.apagar(CHAVE_HISTORICO);
  renderizarHistorico();
  toast('Histórico limpo.');
});

// Parallax sutil do palco no hero (só com ponteiro fino e sem redução de movimento)
const palco = $('#palco');
if (palco && window.matchMedia('(pointer: fine)').matches) {
  let raf;
  window.addEventListener('pointermove', (e) => {
    if (reduzMovimento()) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      palco.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      palco.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    });
  });
}

// Revela blocos ao rolar
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver(
    (entradas) => {
      for (const en of entradas) {
        if (en.isIntersecting) {
          en.target.classList.add('visto');
          obs.unobserve(en.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  $$('.editor, .previa, .historico').forEach((el) => {
    el.classList.add('revelar');
    obs.observe(el);
  });
}

// Início: recupera rascunho ou carrega o exemplo
const rascunho = armazenamento.ler(CHAVE_RASCUNHO, null);
if (rascunho?.dados) {
  preencher(rascunho.dados);
  $('#aviso-rascunho').hidden = false;
  const quando = new Date(rascunho.salvoEm).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  $('#salvo').textContent = `Rascunho de ${quando}`;
  $('#salvo').classList.add('ok');
} else {
  preencher(EXEMPLO);
}
renderizarHistorico();
document.documentElement.classList.add('pronto');

// Pré-carrega as fontes do PDF em segundo plano
carregarFontes().catch(() => {});
