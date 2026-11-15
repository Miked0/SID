import { gerarPdf } from './pdf.js';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const PAGAMENTO = {
  'pix-vista': { rotulo: 'Pix à vista', parcelas: 1 },
  'pix-2': { rotulo: 'Pix em 2 parcelas iguais', parcelas: 2 },
  'pix-3': { rotulo: 'Pix em 3 parcelas iguais', parcelas: 3 },
};

// Dados de exemplo: cliente fictício. Contato da empresa é o WhatsApp público da SID.
const EXEMPLO = {
  tipo: 'orcamento',
  empNome: 'Solution Innova Digital',
  empContato: 'WhatsApp (11) 98477-4107 · solutioninnovadigital.com',
  cliNome: 'Ana Ferreira (exemplo)',
  cliDoc: '123.456.789-00',
  cliEmail: 'cliente@exemplo.com',
  cliTel: '(11) 90000-0000',
  numero: 'ORC-2026-014',
  emissao: '2026-11-15',
  validade: '2026-12-15',
  itens: [
    { descricao: 'Site institucional responsivo com 5 seções', qtd: '1', unit: '1800' },
    { descricao: 'Identidade visual básica (logo e paleta de cores)', qtd: '1', unit: '900' },
    { descricao: 'Hospedagem e domínio por 12 meses', qtd: '12', unit: '45' },
  ],
  desconto: '5',
  pagamento: 'pix-2',
  prazo: '15 dias úteis após aprovação e primeiro pagamento',
  obs: 'Valores em reais. Orçamento válido até a data indicada.',
  objeto: 'Desenvolvimento de site institucional responsivo, com identidade visual básica e publicação.',
  rescisao: 'Qualquer parte pode rescindir com aviso prévio de 15 dias. As etapas concluídas permanecem devidas.',
};

const form = $('#form');
const itensBox = $('#itens');
const tplItem = $('#tpl-item');
const btnGerar = $('#gerar');
const statusBox = $('#status');
const errosBox = $('#erros');

function parseNum(valor) {
  let t = String(valor ?? '').trim().replace(/R\$|\s/g, '');
  if (!t) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

const br = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const txt = (v) => (v && String(v).trim() ? String(v).trim() : '—');

function lerForm() {
  const campo = (nome) => (form.elements[nome] ? form.elements[nome].value : '');
  const itens = $$('.item', itensBox).map((linha) => ({
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

function calcular(m) {
  const itens = m.itens
    .filter((i) => i.descricao || i.qtd || i.unit)
    .map((i) => {
      const q = parseNum(i.qtd);
      const u = parseNum(i.unit);
      return { ...i, q, u, sub: Number.isFinite(q) && Number.isFinite(u) ? q * u : NaN };
    });
  const subtotal = itens.reduce((s, i) => s + (Number.isFinite(i.sub) ? i.sub : 0), 0);
  const pct = m.desconto.trim() === '' ? 0 : parseNum(m.desconto);
  const descontoValor = Number.isFinite(pct) ? (subtotal * pct) / 100 : 0;
  const total = subtotal - descontoValor;
  const parcelas = PAGAMENTO[m.pagamento]?.parcelas ?? 1;
  return { itens, subtotal, pct, descontoValor, total, parcelas };
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
  const comItem = c.itens.filter((i) => i.descricao);
  if (!comItem.length) {
    erros.push({ el: $('#add-item'), msg: 'Adicione pelo menos um item com descrição.' });
  }
  c.itens.forEach((i, n) => {
    const campoDesc = $('[name=descricao]', i.linha);
    const campoQtd = $('[name=qtd]', i.linha);
    const campoUnit = $('[name=unit]', i.linha);
    if (i.descricao && (!Number.isFinite(i.q) || i.q <= 0)) {
      erros.push({ el: campoQtd, msg: `Quantidade do item ${n + 1} precisa ser maior que zero.` });
    }
    if (i.descricao && (!Number.isFinite(i.u) || i.u < 0)) {
      erros.push({ el: campoUnit, msg: `Valor unitário do item ${n + 1} precisa ser um número válido.` });
    }
    if (!i.descricao && (i.qtd || i.unit)) {
      erros.push({ el: campoDesc, msg: `Descreva o item ${n + 1} ou remova a linha.` });
    }
  });
  if (m.desconto.trim() !== '' && (!Number.isFinite(c.pct) || c.pct < 0 || c.pct > 100)) {
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
  if (!erros.length) {
    errosBox.hidden = true;
    return;
  }
  const titulo = document.createElement('strong');
  titulo.textContent = `Corrija ${erros.length === 1 ? '1 ponto' : `${erros.length} pontos`} antes de gerar o PDF:`;
  const lista = document.createElement('ul');
  erros.forEach(({ el, msg }) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = msg;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      el && el.focus();
    });
    li.append(link);
    lista.append(li);
  });
  errosBox.append(titulo, lista);
  errosBox.hidden = false;
}

function setStatus(msg) {
  statusBox.textContent = msg;
}

function novaLinha(valores = {}) {
  const frag = tplItem.content.cloneNode(true);
  const linha = frag.querySelector('.item');
  $('[name=descricao]', linha).value = valores.descricao ?? '';
  $('[name=qtd]', linha).value = valores.qtd ?? '1';
  $('[name=unit]', linha).value = valores.unit ?? '';
  const n = itensBox.children.length + 1;
  $('[name=descricao]', linha).setAttribute('aria-label', `Descrição do item ${n}`);
  $('[name=qtd]', linha).setAttribute('aria-label', `Quantidade do item ${n}`);
  $('[name=unit]', linha).setAttribute('aria-label', `Valor unitário do item ${n}, em reais`);
  $('.remover', linha).setAttribute('aria-label', `Remover item ${n}`);
  itensBox.append(linha);
  atualizarSubtotais();
}

function renumerar() {
  $$('.item', itensBox).forEach((linha, idx) => {
    const n = idx + 1;
    $('[name=descricao]', linha).setAttribute('aria-label', `Descrição do item ${n}`);
    $('[name=qtd]', linha).setAttribute('aria-label', `Quantidade do item ${n}`);
    $('[name=unit]', linha).setAttribute('aria-label', `Valor unitário do item ${n}, em reais`);
    $('.remover', linha).setAttribute('aria-label', `Remover item ${n}`);
  });
}

function atualizarSubtotais() {
  $$('.item', itensBox).forEach((linha) => {
    const q = parseNum($('[name=qtd]', linha).value);
    const u = parseNum($('[name=unit]', linha).value);
    const sub = Number.isFinite(q) && Number.isFinite(u) ? q * u : NaN;
    $('.sub', linha).textContent = Number.isFinite(sub) ? moeda.format(sub) : '—';
  });
}

function preencher(dados) {
  form.elements.tipo.value = dados.tipo;
  for (const k of Object.keys(dados)) {
    if (k === 'tipo' || k === 'itens') continue;
    if (form.elements[k]) form.elements[k].value = dados[k];
  }
  itensBox.replaceChildren();
  dados.itens.forEach((i) => novaLinha(i));
  renumerar();
  atualizarTipo();
  renderizar();
}

function atualizarTipo() {
  const contrato = form.elements.tipo.value === 'contrato';
  $('#campos-contrato').hidden = !contrato;
  $('#p-contrato').hidden = !contrato;
  $('#p-titulo').textContent = contrato ? 'Contrato' : 'Orçamento';
  $('#p-ass1').textContent = contrato ? 'Contratante' : 'Emitente';
  $('#p-ass2').textContent = contrato ? 'Contratada' : 'Cliente (aceite)';
  btnGerar.textContent = contrato ? 'Gerar PDF do contrato' : 'Gerar PDF do orçamento';
}

function renderizar() {
  const m = lerForm();
  const c = calcular(m);
  const set = (id, v) => {
    $(`#${id}`).textContent = v;
  };
  set('p-numero', txt(m.numero));
  set('p-emissao', br(m.emissao));
  set('p-validade', br(m.validade));
  set('p-emp-nome', txt(m.empNome));
  set('p-emp-contato', m.empContato);
  set('p-cli-nome', txt(m.cliNome));
  set('p-cli-doc', m.cliDoc);
  set('p-cli-email', m.cliEmail);
  set('p-cli-tel', m.cliTel);

  const corpo = $('#p-itens');
  corpo.replaceChildren();
  const linhasValidas = c.itens.filter((i) => i.descricao);
  for (const i of linhasValidas) {
    const tr = document.createElement('tr');
    const celulas = [
      [i.descricao, ''],
      [Number.isFinite(i.q) ? numero.format(i.q) : '—', 'n'],
      [Number.isFinite(i.u) ? moeda.format(i.u) : '—', 'n'],
      [Number.isFinite(i.sub) ? moeda.format(i.sub) : '—', 'n'],
    ];
    for (const [v, cls] of celulas) {
      const td = document.createElement('td');
      td.textContent = v;
      if (cls) td.className = cls;
      tr.append(td);
    }
    corpo.append(tr);
  }
  if (!linhasValidas.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Nenhum item ainda. Adicione um item ao lado.';
    td.style.color = 'var(--tinta-2)';
    tr.append(td);
    corpo.append(tr);
  }

  set('p-subtotal', moeda.format(c.subtotal));
  $('#p-desc-linha').hidden = !c.descontoValor;
  set('p-desc-rotulo', `Desconto (${numero.format(c.pct || 0)}%)`);
  set('p-desc', `− ${moeda.format(c.descontoValor)}`);
  set('p-total', moeda.format(c.total));
  set('p-pagamento', textoPagamento(m, c));
  set('p-prazo', txt(m.prazo));
  set('p-prazo2', txt(m.prazo));
  set('p-obs', m.obs);
  set('p-objeto', txt(m.objeto));
  set('p-valor', `O valor total é ${moeda.format(c.total)}, pago da seguinte forma: ${textoPagamento(m, c).toLowerCase()}.`);
  set('p-rescisao', txt(m.rescisao));
  set('p-ass1', m.tipo === 'contrato' ? `Contratante: ${txt(m.empNome)}` : `Emitente: ${txt(m.empNome)}`);
  set('p-ass2', m.tipo === 'contrato' ? `Contratada: ${txt(m.cliNome)}` : `Cliente: ${txt(m.cliNome)}`);
  atualizarSubtotais();
}

function montarDocumento(m, c) {
  const contrato = m.tipo === 'contrato';
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
    valorTexto: `O valor total é ${moeda.format(c.total)}, pago da seguinte forma: ${textoPagamento(m, c).toLowerCase()}.`,
    rescisao: m.rescisao || '—',
    contrato,
  };
}

function nomeArquivo(m) {
  const base = `${m.tipo === 'contrato' ? 'contrato' : 'orcamento'}-${m.numero || 'sem-numero'}`;
  return `${base}.pdf`.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-');
}

function onGerar() {
  const m = lerForm();
  const c = calcular(m);
  const erros = validar(m, c);
  marcarErros(erros);
  mostrarErros(erros);
  if (erros.length) {
    setStatus('Ainda há pontos para corrigir. Veja a lista acima.');
    const primeiro = erros.find((e) => e.el && e.el.focus);
    if (primeiro) primeiro.el.focus();
    return;
  }

  btnGerar.disabled = true;
  setStatus('Renderizando PDF…');
  setTimeout(() => {
    try {
      const bytes = gerarPdf(montarDocumento(m, c));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo(m);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus('PDF gerado. Confira o arquivo e envie ao cliente para assinatura.');
    } catch (err) {
      setStatus('Não foi possível gerar o PDF agora. Tente de novo ou revise os campos.');
    } finally {
      btnGerar.disabled = false;
    }
  }, 40);
}

// Eventos
form.addEventListener('input', (e) => {
  if (e.target.matches('[name=qtd], [name=unit]')) atualizarSubtotais();
  if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  renderizar();
});

form.addEventListener('change', (e) => {
  if (e.target.name === 'tipo') atualizarTipo();
  renderizar();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  onGerar();
});

$('#add-item').addEventListener('click', () => {
  novaLinha({ qtd: '1' });
  renumerar();
  renderizar();
  $('[name=descricao]', itensBox.lastElementChild).focus();
});

itensBox.addEventListener('click', (e) => {
  const botao = e.target.closest('.remover');
  if (!botao) return;
  botao.closest('.item').remove();
  renumerar();
  renderizar();
  $('#add-item').focus();
});

$('#restaurar').addEventListener('click', () => {
  preencher(EXEMPLO);
  mostrarErros([]);
  marcarErros([]);
  setStatus('Exemplo restaurado.');
});

preencher(EXEMPLO);
