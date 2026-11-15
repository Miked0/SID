/* Controle financeiro por extrato · demonstração SID
   Sem backend e sem rede: tudo roda no navegador, com dados fictícios.
   Nenhum dado do arquivo é inserido como HTML: o texto entra sempre por textContent. */
(function () {
  'use strict';

  var CHAVE = 'sid-cef-v2';
  var CHAVE_TEMA = 'sid-cef-tema';
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var NS = 'http://www.w3.org/2000/svg';
  var PAGINA = 50;
  var ORCAMENTO_MARKETING = 800;
  var META_CATEGORIZACAO = 0.9;

  // Categorias: t = r (receita), d (despesa), t (transferência, fora do DRE). c = código contábil para exportação.
  var CATS = [
    { n: 'Vendas', t: 'r', c: '3.1.01' },
    { n: 'Serviços prestados', t: 'r', c: '3.1.02' },
    { n: 'Outras receitas', t: 'r', c: '3.1.09' },
    { n: 'Pessoal', t: 'd', c: '4.1.01' },
    { n: 'Fornecedores', t: 'd', c: '4.1.02' },
    { n: 'Aluguel e condomínio', t: 'd', c: '4.1.03' },
    { n: 'Marketing', t: 'd', c: '4.1.04' },
    { n: 'Impostos', t: 'd', c: '4.1.05' },
    { n: 'Tarifas bancárias', t: 'd', c: '4.1.06' },
    { n: 'Energia e telefonia', t: 'd', c: '4.1.07' },
    { n: 'Transporte', t: 'd', c: '4.1.08' },
    { n: 'Alimentação', t: 'd', c: '4.1.09' },
    { n: 'Serviços de terceiros', t: 'd', c: '4.1.10' },
    { n: 'Outras despesas', t: 'd', c: '4.1.99' },
    { n: 'Transferência interna', t: 'x', c: '1.9.01' }
  ];
  var QUICK = ['Vendas', 'Fornecedores', 'Pessoal', 'Aluguel e condomínio', 'Energia e telefonia', 'Transporte', 'Alimentação', 'Impostos', 'Outras despesas'];

  var REGRAS_PADRAO = [
    ['VENDA', 'contem', 'Vendas'], ['PIX RECEBIDO', 'contem', 'Vendas'], ['CARTAO CRED', 'contem', 'Vendas'], ['CARTAO DEB', 'contem', 'Vendas'],
    ['FOLHA', 'contem', 'Pessoal'], ['SALARIO', 'contem', 'Pessoal'], ['INSS', 'contem', 'Pessoal'], ['FGTS', 'contem', 'Pessoal'],
    ['FORNECEDOR', 'contem', 'Fornecedores'], ['FARINHA', 'contem', 'Fornecedores'], ['MOINHO', 'contem', 'Fornecedores'], ['LATICINIO', 'contem', 'Fornecedores'], ['ATACADO', 'contem', 'Fornecedores'],
    ['ALUGUEL', 'contem', 'Aluguel e condomínio'], ['CONDOMINIO', 'contem', 'Aluguel e condomínio'],
    ['GOOGLE ADS', 'contem', 'Marketing'], ['META ADS', 'contem', 'Marketing'], ['INSTAGRAM', 'contem', 'Marketing'],
    ['SIMPLES NACIONAL', 'contem', 'Impostos'], ['DARF', 'contem', 'Impostos'], ['IMPOSTO', 'contem', 'Impostos'],
    ['TARIFA', 'contem', 'Tarifas bancárias'], ['IOF', 'contem', 'Tarifas bancárias'],
    ['ENEL', 'contem', 'Energia e telefonia'], ['SABESP', 'contem', 'Energia e telefonia'], ['VIVO', 'contem', 'Energia e telefonia'], ['COMGAS', 'contem', 'Energia e telefonia'],
    ['UBER', 'contem', 'Transporte'], ['POSTO', 'contem', 'Transporte'], ['ENTREGA', 'contem', 'Transporte'],
    ['IFOOD', 'contem', 'Alimentação'], ['SUPERMERCADO', 'contem', 'Alimentação'], ['PADARIA', 'contem', 'Alimentação'],
    ['CONTADOR', 'contem', 'Serviços de terceiros'],
    ['ENTRE CONTAS', 'contem', 'Transferência interna']
  ];

  // Extratos fictícios de duas empresas de demonstração.
  var EXEMPLO_PADARIA = [
    'Data;Descrição;Valor',
    '01/11/2026;VENDA CARTAO CRED MAQUINA 0912;2.184,50',
    '02/11/2026;VENDA CARTAO DEB MAQUINA 0912;1.036,20',
    '02/11/2026;PIX RECEBIDO CLIENTE ENCOMENDA CASAMENTO;640,00',
    '03/11/2026;ALUGUEL PONTO COMERCIAL;-2.100,00',
    '03/11/2026;FARINHA MOINHO SAO JORGE;-1.180,00',
    '04/11/2026;FOLHA PAGAMENTO NOV;-3.480,00',
    '04/11/2026;ENEL DISTRIB SP;-386,90',
    '05/11/2026;VENDA CARTAO CRED MAQUINA 0912;2.402,80',
    '05/11/2026;GOOGLE ADS *CAMP PADARIA;-280,00',
    '06/11/2026;LATICINIOS VALE DO SOL;-742,60',
    '06/11/2026;UBER TRIP;-22,40',
    '07/11/2026;VENDA CARTAO DEB MAQUINA 0912;1.218,30',
    '07/11/2026;DAS SIMPLES NACIONAL;-612,75',
    '08/11/2026;SABESP AGUA;-214,35',
    '08/11/2026;PIX RECEBIDO CLIENTE CAFE DA ESQUINA;910,00',
    '09/11/2026;VENDA CARTAO CRED MAQUINA 0912;2.061,00',
    '09/11/2026;TARIFA PACOTE SERVICOS;-39,90',
    '10/11/2026;INSTAGRAM ANUNCIO IMPULSIONADO;-150,00',
    '10/11/2026;CONTADOR MENSALIDADE;-480,00',
    '11/11/2026;VENDA CARTAO DEB MAQUINA 0912;1.390,15',
    '11/11/2026;POSTO SHELL AV BRASIL;-236,00',
    '12/11/2026;IFOOD *LANCHE EQUIPE;-58,90',
    '12/11/2026;ATACADO EMBALAGENS PAPEL;-516,00',
    '12/11/2026;RESGATE CDB;500,00',
    '13/11/2026;TRANSFERENCIA SUSPEITA XYZ;-300,00',
    '13/11/2026;ENTRE CONTAS PARA POUPANCA;-1.000,00',
    '14/11/2026;COMGAS GAS NATURAL;-298,40',
    '14/11/2026;PIX RECEBIDO CLIENTE ENCOMENDA ANIVERSARIO;385,00',
    '14/11/2026;VENDA CARTAO CRED MAQUINA 0912;1.874,60'
  ].join('\n');

  var EXEMPLO_BARBEARIA = [
    'Data;Descrição;Valor',
    '02/11/2026;PIX RECEBIDO CLIENTE JULIO;85,00',
    '02/11/2026;VENDA CARTAO CRED MAQ 77;410,00',
    '03/11/2026;ALUGUEL SALA;-1.300,00',
    '04/11/2026;SALARIO BARBEIRO RICARDO;-2.200,00',
    '05/11/2026;PRODUTOS POMADA FORNECEDOR BARBA;-389,00',
    '06/11/2026;META ADS CORTE DE SEMANA;-120,00',
    '07/11/2026;VENDA CARTAO DEB MAQ 77;260,00',
    '08/11/2026;ENEL DISTRIB;-156,70',
    '09/11/2026;DAS SIMPLES NACIONAL;-298,40',
    '10/11/2026;TARIFA MANUTENCAO CONTA;-29,90',
    '11/11/2026;UBER ENTREGA TOALHAS;-19,80',
    '12/11/2026;PIX RECEBIDO CLIENTE PACOTE NOIVO;680,00',
    '13/11/2026;POSTO IPIRANGA;-180,00',
    '14/11/2026;VENDA CARTAO CRED MAQ 77;520,00'
  ].join('\n');

  var fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var fmtPct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var fmtPct1 = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

  var db = null;
  var seq = 0;
  var imp = null;
  var ui = {
    filtro: 'todas', busca: '', pagina: PAGINA, selId: null, marcados: {}, painelAberto: false,
    aba: 'visao', catDetalhe: null, meses: 6, cenario: 'realista',
    formato: 'csv', periodo: 'todos', conc: {}, saldoBanco: '', prefill: null, exemplos: {}, rotaAnterior: null
  };
  var ultimaRota = null;
  var timerPrevia = null;

  var $ = function (id) { return document.getElementById(id); };

  // ---------- Utilitários ----------

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  }

  function el(tag, opts, filhos) {
    var n = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) n.className = opts.cls;
    if (opts.texto != null) n.textContent = opts.texto;
    if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { n.setAttribute(k, opts.attrs[k]); });
    if (opts.on) Object.keys(opts.on).forEach(function (ev) { n.addEventListener(ev, opts.on[ev]); });
    (filhos || []).forEach(function (f) { if (f) n.appendChild(f); });
    return n;
  }

  function svg(tag, attrs, filhos) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (filhos || []).forEach(function (f) { if (f) n.appendChild(f); });
    return n;
  }

  function limpar(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }
  function fmt(v) { return fmtMoeda.format(v); }
  function fmtSinal(v) { return (v < 0 ? '−' : (v > 0 ? '+' : '')) + fmtMoeda.format(Math.abs(v)); }
  function fmtK(v) { return (v / 1000 >= 1 || v / 1000 <= -1) ? fmtNum.format(v / 1000) + ' mil' : fmtNum.format(v); }

  function dataISO(s) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4}|\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var ano = m[3].length === 2 ? '20' + m[3] : m[3];
    return ano + '-' + m[2] + '-' + m[1];
  }
  function brData(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function mesDe(iso) { return iso.slice(0, 7); }
  function nomeMes(chave) { return MESES[+chave.slice(5, 7) - 1] + '/' + chave.slice(2, 4); }
  function nomeMesLongo(chave) { return MESES_LONGOS[+chave.slice(5, 7) - 1] + ' de ' + chave.slice(0, 4); }

  function parseValor(s) {
    var t = String(s || '').replace(/R\$/g, '').replace(/[\s ]/g, '').replace(/−/g, '-');
    if (t.indexOf('(') !== -1) t = '-' + t.replace(/[()]/g, '');
    if (t.indexOf(',') !== -1) t = t.replace(/\./g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }

  function splitLinha(linha, sep) {
    var out = [], cur = '', aspas = false;
    for (var i = 0; i < linha.length; i++) {
      var ch = linha.charAt(i);
      if (ch === '"') aspas = !aspas;
      else if (ch === sep && !aspas) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function catInfo(nome) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].n === nome) return CATS[i];
    return { n: nome, t: 'd', c: '4.1.99' };
  }

  function tipoOk(cat, valor) {
    var c = catInfo(cat);
    if (c.t === 'x') return true;
    return (valor > 0) === (c.t === 'r');
  }

  function catsOpcoes(comVazio, semTransf) {
    var frag = document.createDocumentFragment();
    if (comVazio) frag.appendChild(el('option', { attrs: { value: '' }, texto: 'Sem categoria' }));
    var grupos = [['Receitas', 'r'], ['Despesas', 'd'], ['Transferências', 'x']];
    grupos.forEach(function (g) {
      if (semTransf && g[1] === 'x') return;
      var og = el('optgroup', { attrs: { label: g[0] } });
      CATS.filter(function (c) { return c.t === g[1]; }).forEach(function (c) {
        og.appendChild(el('option', { attrs: { value: c.n }, texto: c.n }));
      });
      frag.appendChild(og);
    });
    return frag;
  }

  var avisosEl;
  function avisar(msg, acao) {
    var anuncio = $('anuncio');
    if (anuncio) anuncio.textContent = msg;
    var item = el('div', { cls: 'aviso-item' }, [el('span', { texto: msg })]);
    if (acao) {
      item.appendChild(el('button', {
        attrs: { type: 'button' }, texto: acao.rotulo,
        on: { click: function () { acao.fn(); sair(); } }
      }));
    }
    function sair() {
      item.classList.add('saindo');
      setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 200);
    }
    avisosEl.appendChild(item);
    setTimeout(sair, 6500);
  }

  function sacudir(node) {
    if (!node) return;
    node.classList.remove('sacudir');
    void node.offsetWidth;
    node.classList.add('sacudir');
    setTimeout(function () { node.classList.remove('sacudir'); }, 320);
  }

  function particulas(container, n) {
    var caixa = el('div', { cls: 'particulas' });
    container.appendChild(caixa);
    for (var i = 0; i < n; i++) {
      var p = el('span', { cls: 'particula' + (i % 2 ? ' menta' : '') });
      var ang = (Math.PI * 2 * i) / n;
      var dist = 90 + (i % 3) * 30;
      p.style.setProperty('--tx', Math.round(Math.cos(ang) * dist) + 'px');
      p.style.setProperty('--ty', Math.round(Math.sin(ang) * dist) + 'px');
      caixa.appendChild(p);
    }
    setTimeout(function () { if (caixa.parentNode) caixa.parentNode.removeChild(caixa); }, 800);
  }

  // ---------- Dados ----------

  function T() {
    for (var i = 0; i < db.tenants.length; i++) if (db.tenants[i].id === db.ativo) return db.tenants[i];
    return db.tenants[0];
  }

  function novoId(prefixo) { seq++; return prefixo + Date.now().toString(36) + seq.toString(36); }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) { /* modo privado ou bloqueado: segue só em memória */ }
  }

  function histGerar(base) {
    var meses = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    return meses.map(function (m, i) {
      var ent = Math.round(base * (1 + 0.025 * i + 0.06 * Math.sin(i * 1.7)));
      var sai = Math.round(ent * (0.74 + 0.04 * Math.cos(i * 1.3)));
      return { mes: m, ent: ent, sai: sai };
    });
  }

  function regrasIniciais() {
    return REGRAS_PADRAO.map(function (r, i) {
      return { id: 'r' + i, texto: r[0], op: r[1], cat: r[2], ativa: true };
    });
  }

  function txsDeTexto(texto, tenant) {
    var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    var sep = linhas[0].split(';').length >= linhas[0].split(',').length ? ';' : ',';
    var txs = [];
    linhas.forEach(function (l, i) {
      if (i === 0 && /data/i.test(l)) return;
      var c = splitLinha(l, sep);
      var iso = dataISO(c[0]);
      var valor = parseValor(c[2]);
      if (!iso || !isFinite(valor) || valor === 0) return;
      txs.push({ id: novoId('t'), data: brData(iso), iso: iso, desc: c[1] || 'Sem descrição', valor: valor, cat: null, origem: null, ia: null, conc: false });
    });
    txs.sort(function (a, b) { return a.iso < b.iso ? -1 : (a.iso > b.iso ? 1 : 0); });
    if (tenant) txs.forEach(function (t) { aplicarRegras(t, tenant); });
    return txs;
  }

  function seedDb() {
    var pad = { id: 'pe', nome: 'Padaria Espiga de Ouro', sigla: 'PE', contaNome: 'Conta corrente *1234', saldoInicial: 8200, txs: [], regras: regrasIniciais(), hist: histGerar(18000) };
    var barb = { id: 'bn', nome: 'Barbearia Navalha Fina', sigla: 'BN', contaNome: 'Conta corrente *5521', saldoInicial: 3100, txs: [], regras: regrasIniciais(), hist: histGerar(7000) };
    var nova = { id: 'en', nome: 'Empresa nova', sigla: 'EN', contaNome: 'Conta corrente', saldoInicial: 0, txs: [], regras: regrasIniciais(), hist: [] };
    pad.txs = txsDeTexto(EXEMPLO_PADARIA, pad);
    barb.txs = txsDeTexto(EXEMPLO_BARBEARIA, barb);
    return { ativo: 'pe', tenants: [pad, barb, nova] };
  }

  function carregarDb() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        var d = JSON.parse(bruto);
        if (d && Array.isArray(d.tenants) && d.tenants.length) return d;
      }
    } catch (e) { /* sem armazenamento: usa os dados de demonstração */ }
    return seedDb();
  }

  // ---------- Regras e categorização ----------

  function matchRegra(r, desc) {
    if (r.op === 'comeca') return norm(desc).indexOf(norm(r.texto)) === 0;
    if (r.op === 'regex') {
      try { return new RegExp(r.texto, 'i').test(desc); } catch (e) { return false; }
    }
    return norm(desc).indexOf(norm(r.texto)) !== -1;
  }

  function regraPara(tenant, t) {
    for (var i = 0; i < tenant.regras.length; i++) {
      var r = tenant.regras[i];
      if (!r.ativa) continue;
      if (matchRegra(r, t.desc) && tipoOk(r.cat, t.valor)) return r;
    }
    return null;
  }

  function aplicarRegras(t, tenant) {
    if (t.origem === 'manual') return;
    var r = regraPara(tenant, t);
    if (r) { t.cat = r.cat; t.origem = 'regra'; t.ia = null; }
    else if (t.origem === 'regra') { t.cat = null; t.origem = null; }
  }

  function aplicarTodas(tenant) { tenant.txs.forEach(function (t) { aplicarRegras(t, tenant); }); }

  function sugerirIA(tenant, t) {
    var tokens = norm(t.desc).split(' ').filter(function (w) { return w.length >= 4 && !/\d/.test(w); });
    if (!tokens.length) return null;
    var pontos = {};
    tenant.txs.forEach(function (x) {
      if (!x.cat || x.origem === 'ia' || !tipoOk(x.cat, t.valor)) return;
      var outros = norm(x.desc).split(' ');
      var acertos = tokens.filter(function (w) { return outros.indexOf(w) !== -1; }).length;
      if (acertos) pontos[x.cat] = (pontos[x.cat] || 0) + acertos;
    });
    var melhor = null, nota = 0;
    Object.keys(pontos).forEach(function (c) { if (pontos[c] > nota) { nota = pontos[c]; melhor = c; } });
    if (!melhor) return null;
    return { cat: melhor, conf: Math.min(0.95, 0.45 + 0.15 * nota) };
  }

  function ehDuplicata(tenant, t) {
    return tenant.txs.some(function (x) { return x.id !== t.id && x.iso === t.iso && x.valor === t.valor && norm(x.desc) === norm(t.desc); });
  }

  // ---------- Cálculos ----------

  function resumo(txs) {
    var ent = 0, sai = 0, sem = 0;
    txs.forEach(function (t) {
      if (t.valor > 0) ent += t.valor; else sai += -t.valor;
      if (!t.cat) sem++;
    });
    return { ent: ent, sai: sai, saldo: ent - sai, sem: sem, n: txs.length };
  }

  function mesMaisRecente(txs) {
    return txs.reduce(function (m, t) { return !m || t.iso > m ? t.iso : m; }, null);
  }

  function periodoTexto(txs) {
    if (!txs.length) return 'Sem extrato importado';
    var ordenados = txs.slice().sort(function (a, b) { return a.iso < b.iso ? -1 : 1; });
    var a = ordenados[0].data, b = ordenados[ordenados.length - 1].data;
    return 'Período ' + (a === b ? a : a + ' a ' + b);
  }

  function saldoConsolidado(t) {
    return t.saldoInicial + t.txs.reduce(function (s, x) { return s + x.valor; }, 0);
  }

  // Série mensal: histórico fictício + mês atual vindo do extrato
  function serieMensal(t) {
    var mapa = {};
    t.hist.forEach(function (h) { mapa[h.mes] = { mes: h.mes, ent: h.ent, sai: h.sai, real: false }; });
    t.txs.forEach(function (x) {
      var k = mesDe(x.iso);
      if (!mapa[k] || mapa[k].real !== true) mapa[k] = { mes: k, ent: 0, sai: 0, real: true, tmp: true };
      if (mapa[k].tmp) { mapa[k].ent = 0; mapa[k].sai = 0; mapa[k].tmp = false; }
      if (x.valor > 0) mapa[k].ent += x.valor; else mapa[k].sai += -x.valor;
    });
    return Object.keys(mapa).sort().map(function (k) { return mapa[k]; }).slice(-12);
  }

  // ---------- Navegação e cabeçalho ----------

  function atualizarCabecalho() {
    var t = T();
    $('empresa-sigla').textContent = t.sigla;
    $('empresa-nome').textContent = t.nome;
    $('empresa-gatilho').setAttribute('aria-label', 'Empresa: ' + t.nome + '. Trocar empresa');
  }

  function rotaAtual() {
    var m = /#\/([a-z]+)/.exec(location.hash || '');
    var r = m ? m[1] : 'inicio';
    var validas = ['inicio', 'importar', 'categorizar', 'regras', 'relatorios', 'dre', 'conciliacao', 'exportar'];
    return validas.indexOf(r) === -1 ? 'inicio' : r;
  }

  var VISTAS = {};

  function render() {
    var rota = rotaAtual();
    if (rota !== ultimaRota) {
      if (rota !== 'importar') imp = null;
      if (rota !== 'categorizar') ui.selId = null;
      ui.marcados = {};
      ultimaRota = rota;
    }
    document.querySelectorAll('.abas a').forEach(function (a) {
      if (a.getAttribute('data-rota') === rota) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    atualizarCabecalho();
    var conteudo = $('conteudo');
    limpar(conteudo);
    var sec = el('section', { cls: 'pagina', attrs: { 'aria-labelledby': 'titulo-pagina' } });
    conteudo.appendChild(sec);
    VISTAS[rota](sec);
  }

  function cabecalhoPagina(sec, rot, titulo, descricao) {
    var h = el('div', { cls: 'cabecalho-pagina' }, [
      el('p', { cls: 'rot', texto: rot }),
      el('h1', { attrs: { id: 'titulo-pagina' }, texto: titulo })
    ]);
    if (descricao) h.appendChild(el('p', { texto: descricao }));
    sec.appendChild(h);
  }

  function cabecalhoSVG() {
    return svg('svg', { viewBox: '0 0 84 84', 'aria-hidden': 'true', focusable: 'false', class: 'marca-grande' });
  }

  // ---------- Início ----------

  VISTAS.inicio = function (sec) {
    var t = T();
    if (!t.txs.length) {
      var hero = el('section', { cls: 'hero-vazio', attrs: { 'aria-labelledby': 'titulo-pagina' } });
      hero.appendChild(el('p', { cls: 'rot', texto: 'Controle financeiro por extrato' }));
      hero.appendChild(el('h1', { attrs: { id: 'titulo-pagina' }, texto: 'O seu dinheiro tem destino.' }));
      hero.appendChild(el('p', { texto: 'Importe o extrato do banco. O sistema categoriza cada transação e mostra para onde vai cada real: pessoal, fornecedores, impostos, aluguel.' }));
      var acoes = el('div', { cls: 'acoes' }, [
        el('a', { cls: 'btn menta', attrs: { href: '#/importar' }, texto: 'Importar primeiro extrato' }),
        el('button', { cls: 'btn ghost', attrs: { type: 'button' }, texto: 'Carregar extrato de exemplo', on: { click: function () { carregarExemplo(); } } })
      ]);
      hero.appendChild(acoes);
      var img = el('img', { cls: 'marca-grande', attrs: { src: '/favicon.svg', alt: '', width: '300', height: '300' } });
      hero.appendChild(img);
      sec.appendChild(hero);
      return;
    }

    var mes = mesMaisRecente(t.txs);
    var doMes = t.txs.filter(function (x) { return mesDe(x.iso) === mesDe(mes); });
    var rm = resumo(doMes);
    var rt = resumo(t.txs);
    var saldo = saldoConsolidado(t);
    var taxa = rt.n ? (rt.n - rt.sem) / rt.n : 0;

    cabecalhoPagina(sec, 'Visão geral · ' + nomeMesLongo(mesDe(mes)), 'Seu dinheiro, em um quadro', periodoTexto(t.txs) + '. Saldo inicial de ' + fmt(t.saldoInicial) + ' mais as transações importadas.');

    var kpis = el('div', { cls: 'kpis' });
    kpis.appendChild(kpiCard('Saldo consolidado', fmt(saldo), saldo < 0 ? 'despesa' : 'receita', 'Saldo inicial mais todas as transações', null));
    kpis.appendChild(kpiCard('Fluxo do mês', fmtSinal(rm.saldo), rm.saldo < 0 ? 'despesa' : 'receita',
      'Entradas ' + fmt(rm.ent) + ' · Saídas ' + fmt(rm.sai), null));
    kpis.appendChild(kpiCard('Taxa de categorização', fmtPct.format(taxa), taxa >= META_CATEGORIZACAO ? 'receita' : '',
      'Meta de ' + fmtPct.format(META_CATEGORIZACAO) + '. ' + rt.sem + ' sem categoria.', { valor: taxa, alvo: META_CATEGORIZACAO }));
    sec.appendChild(kpis);

    var grade = el('div', { cls: 'grid-2 bloco' });

    var alertas = [];
    if (rt.sem) alertas.push({ tipo: 'aviso', texto: rt.sem + (rt.sem === 1 ? ' transação' : ' transações') + ' sem categoria. Categorize para fechar o quadro.', link: ['#/categorizar', 'Categorizar agora'] });
    var mkt = doMes.filter(function (x) { return x.cat === 'Marketing'; }).reduce(function (s, x) { return s - x.valor; }, 0);
    if (mkt) {
      var pm = mkt / ORCAMENTO_MARKETING;
      alertas.push({ tipo: pm >= 0.85 ? 'aviso' : 'ok', texto: 'Marketing em ' + fmt(mkt) + ' de ' + fmt(ORCAMENTO_MARKETING) + ' previstos (' + fmtPct.format(pm) + ').' });
    }
    var pendConc = t.txs.filter(function (x) { return !x.conc; }).length;
    if (pendConc) alertas.push({ tipo: 'info', texto: pendConc + (pendConc === 1 ? ' lançamento ainda não conciliado' : ' lançamentos ainda não conciliados') + ' com o banco.', link: ['#/conciliacao', 'Conciliar'] });

    var cardAlertas = el('section', { cls: 'card', attrs: { 'aria-labelledby': 'h-alertas' } }, [
      el('div', { cls: 'cab' }, [el('p', { cls: 'rot', texto: 'Insights' }), el('h2', { attrs: { id: 'h-alertas' }, texto: 'O que pede atenção' })])
    ]);
    var lista = el('ul', { cls: 'alertas' });
    alertas.forEach(function (a) {
      var item = el('li', { cls: a.tipo }, [el('span', { texto: a.texto })]);
      if (a.link) item.appendChild(el('a', { attrs: { href: a.link[0] }, texto: a.link[1] }));
      lista.appendChild(item);
    });
    if (!alertas.length) lista.appendChild(el('li', { cls: 'ok', texto: 'Tudo em dia por aqui.' }));
    cardAlertas.appendChild(lista);
    grade.appendChild(cardAlertas);

    var recentes = t.txs.slice().sort(function (a, b) { return a.iso < b.iso ? 1 : -1; }).slice(0, 10);
    var cardAtiv = el('section', { cls: 'card', attrs: { 'aria-labelledby': 'h-ativ' } }, [
      el('div', { cls: 'cab' }, [el('p', { cls: 'rot', texto: 'Atividade' }), el('h2', { attrs: { id: 'h-ativ' }, texto: 'Últimas transações' })])
    ]);
    var tb = el('tbody');
    recentes.forEach(function (x) {
      tb.appendChild(el('tr', {}, [
        el('td', { cls: 'c-data', texto: x.data }),
        el('td', { cls: 'c-desc', texto: x.desc }),
        el('td', { cls: 'num ' + (x.valor > 0 ? 'receita' : 'despesa'), texto: fmtSinal(x.valor) })
      ]));
    });
    cardAtiv.appendChild(el('div', { cls: 'tabela-wrap' }, [el('table', { cls: 'tabela' }, [
      el('caption', { cls: 'sr', texto: 'Dez transações mais recentes' }),
      el('thead', {}, [el('tr', {}, [el('th', { attrs: { scope: 'col' }, texto: 'Data' }), el('th', { attrs: { scope: 'col' }, texto: 'Descrição' }), el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Valor' })])]),
      tb
    ])]));
    grade.appendChild(cardAtiv);
    sec.appendChild(grade);
  };

  function kpiCard(rot, valor, cls, detalhe, barra) {
    var card = el('article', { cls: 'kpi' }, [
      el('p', { cls: 'kpi-rot', texto: rot }),
      el('p', { cls: 'kpi-valor ' + (cls || ''), texto: valor }),
      el('p', { cls: 'kpi-detalhe', texto: detalhe })
    ]);
    if (barra) {
      var trilho = el('div', { cls: 'kpi-trilho', attrs: { role: 'img', 'aria-label': 'Progresso: ' + fmtPct.format(barra.valor) + ' de ' + fmtPct.format(barra.alvo) } });
      var span = el('span', { cls: barra.valor >= barra.alvo ? 'alvo' : 'abaixo' });
      trilho.appendChild(span);
      card.appendChild(trilho);
      requestAnimationFrame(function () { span.style.width = Math.min(100, barra.valor * 100) + '%'; });
    }
    return card;
  }

  function carregarExemplo() {
    var t = T();
    if (t.txs.length) { ir('#/importar'); return; }
    t.txs = txsDeTexto(t.id === 'bn' ? EXEMPLO_BARBEARIA : EXEMPLO_PADARIA, t);
    salvar();
    avisar('Extrato de exemplo carregado. Dados fictícios.');
    render();
  }

  function ir(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  // ---------- Importar (assistente de 3 passos) ----------

  function linhasDe(texto) { return texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; }); }

  function detectarCabecalho(linhas, sep) {
    var c = splitLinha(linhas[0], sep).map(norm);
    var temData = c.some(function (x) { return x.indexOf('DATA') !== -1; });
    var temValor = c.some(function (x) { return x.indexOf('VALOR') !== -1 || x.indexOf('QUANTIA') !== -1; });
    var idx = { data: 0, desc: 1, valor: 2 };
    if (temData && temValor) {
      c.forEach(function (x, i) {
        if (x.indexOf('DATA') !== -1) idx.data = i;
        else if (x.indexOf('DESCRI') !== -1 || x.indexOf('HISTOR') !== -1 || x.indexOf('LANCAMENTO') !== -1) idx.desc = i;
        else if (x.indexOf('VALOR') !== -1 || x.indexOf('QUANTIA') !== -1) idx.valor = i;
      });
      return { temCab: true, idx: idx };
    }
    return { temCab: false, idx: idx };
  }

  function montarTxs(linhas, sep, temCab, idx) {
    var txs = [], ignoradas = 0;
    var inicio = temCab ? 1 : 0;
    for (var r = inicio; r < linhas.length; r++) {
      var c = splitLinha(linhas[r], sep);
      var iso = dataISO(c[idx.data]);
      var valor = parseValor(c[idx.valor]);
      if (!iso || !isFinite(valor) || valor === 0) { ignoradas++; continue; }
      txs.push({ id: null, data: brData(iso), iso: iso, desc: c[idx.desc] || 'Sem descrição', valor: valor, cat: null, origem: null, ia: null, conc: false });
    }
    txs.sort(function (a, b) { return a.iso < b.iso ? -1 : (a.iso > b.iso ? 1 : 0); });
    return { txs: txs, ignoradas: ignoradas };
  }

  function prepararImport(texto, nome) {
    var linhas = linhasDe(texto);
    if (!linhas.length) return false;
    var sep = linhas[0].split(';').length >= linhas[0].split(',').length ? ';' : ',';
    var det = detectarCabecalho(linhas, sep);
    imp = { passo: 2, nome: nome, linhas: linhas, sep: sep, temCab: det.temCab, idx: det.idx, opReg: true, opIA: true, erro: '' };
    return true;
  }

  function carregarArquivoImport(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { erroImport('Arquivo muito grande para a demonstração (limite de 2 MB). Exporte um período menor.'); return; }
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { erroImport('Esta demonstração aceita apenas CSV. Exporte o extrato como CSV ou planilha.'); return; }
    var leitor = new FileReader();
    leitor.onload = function () {
      if (!prepararImport(String(leitor.result || ''), file.name)) { erroImport('O arquivo está vazio. Confira a exportação e tente de novo.'); return; }
      render();
    };
    leitor.onerror = function () { erroImport('Não foi possível ler o arquivo. Tente exportar de novo.'); };
    leitor.readAsText(file, 'utf-8');
  }

  function erroImport(msg) {
    if (!imp) imp = { passo: 1, nome: '', linhas: null, sep: ';', temCab: true, idx: { data: 0, desc: 1, valor: 2 }, opReg: true, opIA: true, erro: '' };
    imp.erro = msg;
    render();
  }

  VISTAS.importar = function (sec) {
    if (!imp) imp = { passo: 1, nome: '', linhas: null, sep: ';', temCab: true, idx: { data: 0, desc: 1, valor: 2 }, opReg: true, opIA: true, erro: '' };
    cabecalhoPagina(sec, 'Importar extrato', 'Do extrato à categoria', 'Três passos: escolha o arquivo, confira as colunas e revise antes de confirmar. Nada é salvo antes da confirmação.');

    var passos = el('ol', { cls: 'passos', attrs: { 'aria-label': 'Etapas da importação' } });
    [['Arquivo', 1], ['Colunas', 2], ['Revisar', 3]].forEach(function (p) {
      var cls = imp.passo > p[1] ? 'feito' : '';
      var li = el('li', { cls: cls, attrs: imp.passo === p[1] ? { 'aria-current': 'step' } : {} }, [el('span', { texto: p[0] })]);
      passos.appendChild(li);
    });
    sec.appendChild(passos);

    var caixa = el('div', { cls: 'card', attrs: { id: 'caixa-import' } });
    sec.appendChild(caixa);
    if (imp.passo === 1) passoArquivo(caixa);
    else if (imp.passo === 2) passoColunas(caixa);
    else if (imp.passo === 3) passoRevisar(caixa);
    else if (imp.passo === 4) passoProgresso(caixa);
    else if (imp.passo === 5) passoSucesso(caixa);
  };

  function passoArquivo(caixa) {
    var zona = el('div', { cls: 'dropzone', attrs: { id: 'dropzone' } });
    zona.appendChild(el('p', { cls: 'dz-titulo', texto: 'Arraste o CSV para cá' }));
    zona.appendChild(el('p', { cls: 'dz-texto', texto: 'Colunas Data, Descrição e Valor. Separador ponto e vírgula ou vírgula. Datas no formato DD/MM/AAAA.' }));
    var input = el('input', { attrs: { type: 'file', id: 'arquivo', accept: '.csv,text/csv', hidden: 'hidden' } });
    input.addEventListener('change', function (ev) { carregarArquivoImport(ev.target.files[0]); });
    zona.appendChild(input);
    zona.appendChild(el('button', { cls: 'btn secondary', attrs: { type: 'button' }, texto: 'Selecionar arquivo', on: { click: function () { input.click(); } } }));
    zona.addEventListener('dragenter', function (ev) { ev.preventDefault(); zona.classList.add('ativa'); });
    zona.addEventListener('dragover', function (ev) { ev.preventDefault(); zona.classList.add('ativa'); });
    zona.addEventListener('dragleave', function () { zona.classList.remove('ativa'); });
    zona.addEventListener('drop', function (ev) {
      ev.preventDefault(); zona.classList.remove('ativa');
      carregarArquivoImport(ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]);
    });
    caixa.appendChild(zona);

    var linhaExemplo = el('div', { cls: 'acoes', attrs: { style: '' } });
    linhaExemplo.appendChild(el('button', {
      cls: 'btn ghost', attrs: { type: 'button' }, texto: 'Usar extrato de exemplo (fictício)',
      on: { click: function () {
        var txt = T().id === 'bn' ? EXEMPLO_BARBEARIA : EXEMPLO_PADARIA;
        prepararImport(txt, 'extrato-exemplo.csv');
        render();
      } }
    }));
    caixa.appendChild(linhaExemplo);
    if (imp.erro) caixa.appendChild(el('p', { cls: 'erro-campo', attrs: { role: 'alert' }, texto: imp.erro }));
  }

  function passoColunas(caixa) {
    var linhas = imp.linhas;
    var cab = splitLinha(linhas[0], imp.sep);
    var nomes = cab.map(function (c, i) { return imp.temCab ? c : 'Coluna ' + (i + 1); });
    if (!imp.temCab) nomes = cab.map(function (c, i) { return 'Coluna ' + (i + 1); });

    caixa.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Arquivo: ' + imp.nome + ' · ' + (linhas.length - (imp.temCab ? 1 : 0)) + ' linhas.' }));

    var grade = el('div', { cls: 'linha-form', attrs: { style: '' } });
    var campos = [['data', 'Coluna da data'], ['desc', 'Coluna da descrição'], ['valor', 'Coluna do valor']];
    var sels = {};
    campos.forEach(function (c) {
      var sel = el('select', { attrs: { id: 'map-' + c[0] } });
      nomes.forEach(function (n, i) { sel.appendChild(el('option', { attrs: { value: String(i) }, texto: n })); });
      sel.value = String(imp.idx[c[0]]);
      sel.addEventListener('change', function () { imp.idx[c[0]] = +sel.value; imp.erro = ''; render(); });
      sels[c[0]] = sel;
      grade.appendChild(el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'map-' + c[0] }, texto: c[1] }), sel]));
    });
    caixa.appendChild(grade);

    var sepSel = el('select', { attrs: { id: 'map-sep' } }, [
      el('option', { attrs: { value: ';' }, texto: 'Ponto e vírgula (;)' }),
      el('option', { attrs: { value: ',' }, texto: 'Vírgula (,)' })
    ]);
    sepSel.value = imp.sep;
    sepSel.addEventListener('change', function () { imp.sep = sepSel.value; var d = detectarCabecalho(linhas, imp.sep); imp.temCab = d.temCab; imp.idx = d.idx; render(); });
    var cabCheck = el('input', { cls: 'caixa', attrs: { type: 'checkbox', id: 'map-cab' } });
    cabCheck.checked = imp.temCab;
    cabCheck.addEventListener('change', function () { imp.temCab = cabCheck.checked; render(); });

    caixa.appendChild(el('div', { cls: 'linha-form', attrs: { style: '' } }, [
      el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'map-sep' }, texto: 'Separador' }), sepSel]),
      el('label', { cls: 'toggle', attrs: { for: 'map-cab' } }, [cabCheck, el('span', { cls: 'trilho' }), el('span', { texto: 'A primeira linha é cabeçalho' })])
    ]));

    var duplicados = imp.idx.data === imp.idx.desc || imp.idx.data === imp.idx.valor || imp.idx.desc === imp.idx.valor;
    var r = lerLinhas();
    var resumoEl = el('p', { cls: 'ajuda-campo', attrs: { role: 'status' } });
    resumoEl.textContent = duplicados ? 'Use uma coluna diferente para cada campo.' : plural(r.txs.length, 'transação válida', 'transações válidas') + (r.ignoradas ? ' · ' + r.ignoradas + ' linhas ignoradas por data ou valor inválidos.' : '.');
    caixa.appendChild(resumoEl);

    var previa = el('div', { cls: 'tabela-wrap' });
    var tb = el('tbody');
    r.txs.slice(0, 5).forEach(function (x) {
      tb.appendChild(el('tr', {}, [el('td', { cls: 'c-data', texto: x.data }), el('td', { cls: 'c-desc', texto: x.desc }), el('td', { cls: 'num ' + (x.valor > 0 ? 'receita' : 'despesa'), texto: fmtSinal(x.valor) })]));
    });
    previa.appendChild(el('table', { cls: 'tabela' }, [
      el('caption', { cls: 'sr', texto: 'Prévia das primeiras transações' }),
      el('thead', {}, [el('tr', {}, [el('th', { attrs: { scope: 'col' }, texto: 'Data' }), el('th', { attrs: { scope: 'col' }, texto: 'Descrição' }), el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Valor' })])]),
      tb
    ]));
    caixa.appendChild(el('p', { cls: 'rotulo', texto: 'Prévia (5 primeiras)' }));
    caixa.appendChild(previa);

    var ok = !duplicados && r.txs.length > 0;
    var acoes = el('div', { cls: 'acoes', attrs: { style: '' } }, [
      el('button', { cls: 'btn ghost', attrs: { type: 'button' }, texto: 'Voltar', on: { click: function () { imp.passo = 1; imp.linhas = null; render(); } } }),
      el('button', { cls: 'btn primary', attrs: { type: 'button' }, texto: 'Continuar', on: { click: function () { if (!ok) { sacudir(grade); return; } imp.passo = 3; render(); } } })
    ]);
    if (!ok) acoes.lastChild.setAttribute('disabled', 'disabled');
    caixa.appendChild(acoes);
  }

  function lerLinhas() {
    var r = montarTxs(imp.linhas, imp.sep, imp.temCab, imp.idx);
    return r;
  }

  function passoRevisar(caixa) {
    var t = T();
    var r = lerLinhas();
    var chaves = {};
    var novas = [], dups = 0;
    r.txs.forEach(function (x) {
      var k = x.iso + '|' + x.valor + '|' + norm(x.desc);
      var existe = t.txs.some(function (y) { return y.iso === x.iso && y.valor === x.valor && norm(y.desc) === norm(x.desc); });
      if (existe || chaves[k]) { dups++; return; }
      chaves[k] = true;
      novas.push(x);
    });
    var simulada = novas.map(function (x) {
      var c = { desc: x.desc, valor: x.valor, cat: null, origem: null };
      if (imp.opReg) { var reg = regraPara(t, c); if (reg) c.cat = reg.cat; }
      if (!c.cat && imp.opIA) { var s = sugerirIA(t, c); if (s) c.cat = s.cat; }
      return c;
    });
    var semCat = simulada.filter(function (c) { return !c.cat; }).length;

    caixa.appendChild(el('div', { cls: 'cab' }, [el('p', { cls: 'rot', texto: 'Passo 3' }), el('h2', { cls: 'h2', texto: 'Revisar e confirmar' })]));
    var kp = el('div', { cls: 'kpi-linha' });
    [['Transações lidas', String(r.txs.length)], ['Novas', String(novas.length)], ['Duplicatas (ignoradas)', String(dups)], ['Sem categoria após regras', String(semCat)]].forEach(function (k) {
      kp.appendChild(el('div', { cls: 'mini' }, [el('p', { cls: 'kpi-rot', texto: k[0] }), el('p', { cls: 'kpi-valor', texto: k[1] })]));
    });
    caixa.appendChild(kp);

    var g = el('div', { cls: 'grid-2', attrs: { style: '' } });
    var chkR = el('input', { cls: 'caixa', attrs: { type: 'checkbox', id: 'op-reg' } });
    chkR.checked = imp.opReg;
    chkR.addEventListener('change', function () { imp.opReg = chkR.checked; render(); });
    var chkI = el('input', { cls: 'caixa', attrs: { type: 'checkbox', id: 'op-ia' } });
    chkI.checked = imp.opIA;
    chkI.addEventListener('change', function () { imp.opIA = chkI.checked; render(); });
    g.appendChild(el('label', { cls: 'toggle', attrs: { for: 'op-reg' } }, [chkR, el('span', { cls: 'trilho' }), el('span', {}, [document.createTextNode('Aplicar regras existentes'), el('small', { texto: 'Usa as regras da aba Regras. Categorias manuais não são alteradas.' })])]));
    g.appendChild(el('label', { cls: 'toggle', attrs: { for: 'op-ia' } }, [chkI, el('span', { cls: 'trilho' }), el('span', {}, [document.createTextNode('Categorizar com IA (beta)'), el('small', { texto: 'Sugere categoria pelas palavras de transações já categorizadas. Você confere depois.' })])]));
    caixa.appendChild(g);

    var acoes = el('div', { cls: 'acoes', attrs: { style: '' } }, [
      el('button', { cls: 'btn ghost', attrs: { type: 'button' }, texto: 'Voltar', on: { click: function () { imp.passo = 2; render(); } } }),
      el('button', { cls: 'btn primary', attrs: { type: 'button', id: 'confirmar-import' }, texto: 'Confirmar importação (' + novas.length + ')', on: { click: function () {
        if (!novas.length) { sacudir(caixa); avisar('Não há transações novas para importar.'); return; }
        imp.passo = 4; imp.novas = novas; imp.dups = dups; render();
      } } })
    ]);
    if (!novas.length) acoes.lastChild.setAttribute('disabled', 'disabled');
    caixa.appendChild(acoes);
  }

  function passoProgresso(caixa) {
    var C = 2 * Math.PI * 58;
    var arco = svg('circle', { cx: '66', cy: '66', r: '58', class: 'arco', 'stroke-dasharray': String(C), 'stroke-dashoffset': String(C) });
    var anel = svg('svg', { viewBox: '0 0 132 132', class: 'anel', role: 'img', 'aria-label': 'Importando transações' }, [
      svg('circle', { cx: '66', cy: '66', r: '58', class: 'trilho-anel' }), arco
    ]);
    var texto = el('p', { texto: 'Lendo e categorizando ' + plural(imp.novas.length, 'transação', 'transações') + '…', attrs: { role: 'status' } });
    caixa.appendChild(el('div', { cls: 'progresso' }, [anel, texto]));
    var passo = 0, total = 9;
    var timer = setInterval(function () {
      passo++;
      arco.setAttribute('stroke-dashoffset', String(C * (1 - passo / total)));
      if (passo >= total) {
        clearInterval(timer);
        confirmarImport();
      }
    }, 100);
  }

  function confirmarImport() {
    var t = T();
    var criadas = 0, semCat = 0, ia = 0;
    imp.novas.forEach(function (x, i) {
      var n = { id: novoId('i'), data: x.data, iso: x.iso, desc: x.desc, valor: x.valor, cat: null, origem: null, ia: null, conc: false };
      if (imp.opReg) aplicarRegras(n, t);
      if (!n.cat && imp.opIA) {
        var s = sugerirIA(t, n);
        if (s) { n.cat = s.cat; n.origem = 'ia'; n.ia = s; ia++; }
      }
      if (!n.cat) semCat++;
      t.txs.push(n);
      criadas++;
    });
    t.txs.sort(function (a, b) { return a.iso < b.iso ? -1 : (a.iso > b.iso ? 1 : 0); });
    salvar();
    imp.resultado = { criadas: criadas, semCat: semCat, ia: ia, dups: imp.dups };
    imp.passo = 5;
    render();
  }

  function passoSucesso(caixa) {
    var res = imp.resultado || { criadas: 0, semCat: 0, ia: 0, dups: 0 };
    var zona = el('div', { cls: 'revelar', attrs: { style: '' } });
    var tri = svg('svg', { viewBox: '0 0 84 84', class: 'triangulo-sid', 'aria-hidden': 'true', focusable: 'false' }, [
      svg('path', { d: 'M42 8 L78 72 L6 72 Z', class: 'desenhar', pathLength: '200' })
    ]);
    zona.appendChild(tri);
    zona.appendChild(el('p', { cls: 'dz-titulo', texto: plural(res.criadas, 'transação importada.', 'transações importadas.') }));
    var txt = res.semCat ? res.semCat + ' ainda precisam de categoria. Categorize agora para fechar o quadro.' : 'Todas foram categorizadas.';
    if (res.ia) txt += ' ' + res.ia + ' sugestões de IA aguardam sua confirmação.';
    if (res.dups) txt += ' ' + res.dups + ' duplicatas foram ignoradas.';
    zona.appendChild(el('p', { cls: 'dz-texto', texto: txt }));
    zona.appendChild(el('div', { cls: 'acoes', attrs: { style: '' } }, [
      el('a', { cls: 'btn primary', attrs: { href: '#/categorizar' }, texto: res.semCat || res.ia ? 'Categorizar agora' : 'Ver transações' }),
      el('a', { cls: 'btn ghost', attrs: { href: '#/inicio' }, texto: 'Ver visão geral' }),
      el('button', { cls: 'btn ghost', attrs: { type: 'button' }, texto: 'Importar outro', on: { click: function () { imp = null; render(); } } })
    ]));
    caixa.appendChild(zona);
    particulas(zona, 16);
    caixa.setAttribute('data-ok', '1');
  }

  // ---------- Categorizar ----------

  function filtrarTxs(txs) {
    var q = norm(ui.busca);
    return txs.filter(function (x) {
      if (ui.filtro === 'sem' && x.cat) return false;
      if (ui.filtro === 'regra' && x.origem !== 'regra') return false;
      if (ui.filtro === 'ia' && x.origem !== 'ia') return false;
      if (ui.filtro === 'manual' && x.origem !== 'manual') return false;
      if (q) {
        var alvo = norm(x.desc + ' ' + x.data + ' ' + fmt(x.valor));
        if (alvo.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function badgeOrigem(x) {
    if (x.origem === 'regra') return el('span', { cls: 'badge regra', texto: 'Regra' });
    if (x.origem === 'ia') return el('span', { cls: 'badge ia', texto: 'IA beta' });
    if (x.origem === 'manual') return el('span', { cls: 'badge manual', texto: 'Manual' });
    return el('span', { cls: 'badge pendente', texto: 'Pendente' });
  }

  function mudarCat(x, nome, origem) {
    x.cat = nome || null;
    x.origem = x.cat ? (origem || 'manual') : null;
    if (x.origem !== 'ia') x.ia = x.origem === 'ia' ? x.ia : null;
    salvar();
  }

  VISTAS.categorizar = function (sec) {
    var t = T();
    cabecalhoPagina(sec, 'Categorizar', 'Cada real no seu lugar', 'Escolha uma transação para ver detalhes, marque várias para ação em lote ou use as teclas 1 a 9 com uma transação selecionada.');

    if (!t.txs.length) {
      sec.appendChild(el('div', { cls: 'vazio' }, [
        el('h2', { texto: 'Nenhum extrato importado' }),
        el('p', { texto: 'Importe um extrato para começar a categorizar.' }),
        el('div', { cls: 'acoes', attrs: { style: '' } }, [el('a', { cls: 'btn primary', attrs: { href: '#/importar' }, texto: 'Importar extrato' })])
      ]));
      return;
    }

    var chipsBox = el('div', { cls: 'chips', attrs: { role: 'group', 'aria-label': 'Filtrar transações' } });
    var filtros = [['todas', 'Todas'], ['sem', 'Sem categoria'], ['regra', 'Por regra'], ['ia', 'Por IA'], ['manual', 'Manuais']];
    filtros.forEach(function (f) {
      var b = el('button', { cls: 'chip', attrs: { type: 'button', 'data-rotulo': f[1], 'data-filtro': f[0], 'aria-pressed': ui.filtro === f[0] ? 'true' : 'false' } });
      b.appendChild(document.createTextNode(f[1]));
      b.addEventListener('click', function () { ui.filtro = f[0]; ui.pagina = PAGINA; render(); });
      chipsBox.appendChild(b);
    });
    var busca = el('input', { cls: 'entrada', attrs: { type: 'search', id: 'busca', placeholder: 'Ex.: UBER, 320,00', 'aria-label': 'Buscar por descrição, data ou valor', autocomplete: 'off', value: ui.busca } });
    busca.value = ui.busca;
    busca.addEventListener('input', function () { ui.busca = busca.value; ui.pagina = PAGINA; renderLista(); });

    sec.appendChild(el('div', { cls: 'card', attrs: { style: '' } }, [
      el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'busca' }, texto: 'Buscar' }), busca]),
      el('div', { cls: 'bloco' }, [chipsBox])
    ]));

    var lote = el('div', { cls: 'lote', attrs: { id: 'lote', hidden: 'hidden' } });
    sec.appendChild(lote);

    var layout = el('div', { cls: 'layout-lista bloco', attrs: { id: 'layout' } });
    var tabelaCard = el('section', { cls: 'card', attrs: { 'aria-labelledby': 't-lista' } }, [
      el('div', { cls: 'cab' }, [el('h2', { attrs: { id: 't-lista' }, texto: 'Transações' })]),
      el('p', { cls: 'contagem', attrs: { id: 'contagem', 'aria-live': 'polite' } }),
      el('div', { cls: 'tabela-wrap' }, [el('table', { cls: 'tabela', attrs: { id: 'tab-cat' } }, [
        el('caption', { cls: 'sr', texto: 'Transações para categorizar' }),
        el('thead', {}, [el('tr', {}, [
          el('th', { attrs: { scope: 'col' } }, [el('input', { cls: 'caixa', attrs: { type: 'checkbox', id: 'marcar-todas', 'aria-label': 'Marcar todas as transações visíveis' } })]),
          el('th', { attrs: { scope: 'col' }, texto: 'Data' }),
          el('th', { attrs: { scope: 'col' }, texto: 'Descrição' }),
          el('th', { attrs: { scope: 'col' }, texto: 'Categoria' }),
          el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Valor' }),
          el('th', { attrs: { scope: 'col' }, texto: 'Origem' })
        ])]),
        el('tbody', { attrs: { id: 'corpo' } })
      ])]),
      el('div', { cls: 'acoes', attrs: { id: 'mais', style: '' } })
    ]);
    layout.appendChild(tabelaCard);
    layout.appendChild(el('div', { attrs: { id: 'painel-box' } }));
    sec.appendChild(layout);

    $('marcar-todas') || 0;
    sec.querySelector('#marcar-todas').addEventListener('change', function (ev) {
      var visiveis = filtrarTxs(T().txs).slice(0, ui.pagina);
      visiveis.forEach(function (x) { if (ev.target.checked) ui.marcados[x.id] = true; else delete ui.marcados[x.id]; });
      renderLista();
    });

    renderLista();
  };

  function renderLista() {
    var t = T();
    var lista = filtrarTxs(t.txs);
    var visiveis = lista.slice(0, ui.pagina);
    var corpo = $('corpo');
    if (!corpo) return;
    limpar(corpo);

    var chips = document.querySelectorAll('.chips [data-filtro]');
    chips.forEach(function (b) {
      var f = b.getAttribute('data-filtro');
      var n = t.txs.filter(function (x) {
        if (f === 'sem') return !x.cat;
        if (f === 'regra') return x.origem === 'regra';
        if (f === 'ia') return x.origem === 'ia';
        if (f === 'manual') return x.origem === 'manual';
        return true;
      }).length;
      b.setAttribute('aria-pressed', ui.filtro === f ? 'true' : 'false');
      limpar(b);
      b.appendChild(document.createTextNode(b.getAttribute('data-rotulo')));
      b.appendChild(el('span', { cls: 'n', texto: String(n) }));
    });
    $('contagem').textContent = lista.length + (lista.length === 1 ? ' transação' : ' transações') + (lista.length > visiveis.length ? ' · mostrando ' + visiveis.length : '');

    if (!visiveis.length) {
      corpo.appendChild(el('tr', { cls: 'vazio-tabela' }, [el('td', { attrs: { colspan: '6' }, texto: 'Nenhuma transação neste filtro.' })]));
    }

    visiveis.forEach(function (x, i) {
      var marcado = !!ui.marcados[x.id];
      var chk = el('input', { cls: 'caixa', attrs: { type: 'checkbox', 'aria-label': 'Selecionar ' + x.desc + ' em ' + x.data } });
      chk.checked = marcado;
      chk.addEventListener('change', function () { if (chk.checked) ui.marcados[x.id] = true; else delete ui.marcados[x.id]; renderLista(); });

      var sel = el('select', { cls: 'sel-cat', attrs: { id: 'cat-' + x.id, 'aria-label': 'Categoria de ' + x.desc + ' em ' + x.data } }, [catsOpcoes(true, false)]);
      sel.value = x.cat || '';
      sel.addEventListener('change', function () {
        mudarCat(x, sel.value, 'manual');
        ui.selId = x.id;
        renderLista(); foco('cat-' + x.id);
      });

      var dup = ehDuplicata(t, x);
      var classe = [];
      if (x.conc) classe.push('conc');
      if (dup) classe.push('dup');
      else if (!x.cat) classe.push('pendente');
      else if (x.origem === 'regra') classe.push('reg');
      else if (x.origem === 'ia') classe.push('ia');
      if (ui.selId === x.id) classe.push('selecionada');

      var tr = el('tr', { cls: classe.join(' ') });
      tr.style.setProperty('--i', String(i));
      var celDesc = el('td', { cls: 'c-desc' }, [el('button', {
        cls: 'desc-btn', attrs: { type: 'button', 'aria-pressed': ui.selId === x.id ? 'true' : 'false' }, texto: x.desc,
        on: { click: function () { ui.selId = ui.selId === x.id ? null : x.id; renderLista(); } }
      })]);
      if (dup) celDesc.appendChild(el('span', { cls: 'badge pendente', attrs: { title: 'Mesma data, valor e descrição de outra transação' }, texto: 'Duplicata suspeita' }));
      tr.appendChild(el('td', { cls: 'c-chk' }, [chk]));
      tr.appendChild(el('td', { cls: 'c-data', texto: x.data }));
      tr.appendChild(celDesc);
      tr.appendChild(el('td', { cls: 'c-cat' }, [sel]));
      tr.appendChild(el('td', { cls: 'num ' + (x.valor > 0 ? 'receita' : 'despesa'), texto: fmtSinal(x.valor) }));
      tr.appendChild(el('td', { cls: 'c-orig' }, [badgeOrigem(x)]));
      corpo.appendChild(tr);
    });

    var marcarTodas = $('marcar-todas');
    if (marcarTodas) {
      var todasMarcadas = visiveis.length > 0 && visiveis.every(function (x) { return ui.marcados[x.id]; });
      marcarTodas.checked = todasMarcadas;
    }

    var mais = $('mais');
    if (mais) {
      limpar(mais);
      if (lista.length > visiveis.length) {
        mais.appendChild(el('button', { cls: 'btn', attrs: { type: 'button' }, texto: 'Carregar mais (' + (lista.length - visiveis.length) + ')', on: { click: function () { ui.pagina += PAGINA; renderLista(); } } }));
      }
    }

    renderLote();
    renderPainel();
  }

  function foco(id) {
    var n = document.getElementById(id);
    if (n) n.focus();
  }

  function renderLote() {
    var lote = $('lote');
    if (!lote) return;
    var ids = Object.keys(ui.marcados).filter(function (id) { return T().txs.some(function (x) { return x.id === id; }); });
    limpar(lote);
    if (!ids.length) { lote.hidden = true; return; }
    lote.hidden = false;
    lote.appendChild(el('span', { cls: 'contagem-lote', texto: ids.length + (ids.length === 1 ? ' selecionada' : ' selecionadas') }));
    var sel = el('select', { attrs: { id: 'lote-cat', 'aria-label': 'Categoria para aplicar em lote' } }, [catsOpcoes(true, false)]);
    lote.appendChild(sel);
    lote.appendChild(el('button', { cls: 'btn menta pequeno', attrs: { type: 'button' }, texto: 'Aplicar categoria', on: { click: function () {
      var nome = sel.value;
      ids.forEach(function (id) { var x = T().txs.filter(function (y) { return y.id === id; })[0]; if (x) mudarCat(x, nome, 'manual'); });
      avisar('Categoria aplicada a ' + plural(ids.length, 'transação.', 'transações.'));
      ui.marcados = {};
      renderLista();
    } } }));
    lote.appendChild(el('button', { cls: 'btn pequeno ghost', attrs: { type: 'button' }, texto: 'Marcar transferência', on: { click: function () {
      ids.forEach(function (id) { var x = T().txs.filter(function (y) { return y.id === id; })[0]; if (x) mudarCat(x, 'Transferência interna', 'manual'); });
      avisar('Marcadas como transferência interna. Não entram no DRE.');
      ui.marcados = {};
      renderLista();
    } } }));
    lote.appendChild(el('button', { cls: 'btn pequeno ghost perigo', attrs: { type: 'button' }, texto: 'Excluir', on: { click: function () {
      var t = T();
      var removidas = t.txs.filter(function (x) { return ui.marcados[x.id]; });
      t.txs = t.txs.filter(function (x) { return !ui.marcados[x.id]; });
      salvar();
      ui.marcados = {};
      if (ui.selId && !t.txs.some(function (x) { return x.id === ui.selId; })) ui.selId = null;
      renderLista();
      avisar(plural(removidas.length, 'transação removida.', 'transações removidas.'), { rotulo: 'Desfazer', fn: function () {
        t.txs = t.txs.concat(removidas).sort(function (a, b) { return a.iso < b.iso ? -1 : (a.iso > b.iso ? 1 : 0); });
        salvar(); renderLista(); avisar('Transações restauradas.');
      } });
    } } }));
  }

  function renderPainel() {
    var box = $('painel-box');
    var layout = $('layout');
    if (!box || !layout) return;
    limpar(box);
    var t = T();
    var x = t.txs.filter(function (y) { return y.id === ui.selId; })[0];
    layout.classList.toggle('com-painel', !!x);
    if (!x) return;
    var painel = el('aside', { cls: 'painel-lateral', attrs: { 'aria-labelledby': 'p-titulo' } });
    painel.appendChild(el('button', { cls: 'fechar', attrs: { type: 'button', 'aria-label': 'Fechar detalhes' }, texto: '×', on: { click: function () { ui.selId = null; renderLista(); } } }));
    painel.appendChild(el('p', { cls: 'rot', texto: 'Detalhe' }));
    painel.appendChild(el('h2', { cls: 'h2', attrs: { id: 'p-titulo' }, texto: 'Transação' }));
    painel.lastChild.style.fontSize = '1.8rem';
    var dl = el('dl');
    [['Data', x.data], ['Descrição', x.desc], ['Valor', fmtSinal(x.valor)], ['Categoria', x.cat || 'Pendente'], ['Origem', x.origem === 'regra' ? 'Regra' : (x.origem === 'ia' ? 'IA (beta)' : (x.origem === 'manual' ? 'Manual' : 'Pendente'))]].forEach(function (p) {
      dl.appendChild(el('dt', { texto: p[0] })); dl.appendChild(el('dd', { texto: p[1] }));
    });
    painel.appendChild(dl);

    if (!x.cat && x.ia === null) {
      var s = sugerirIA(t, x);
      if (s) x.ia = s;
    }
    if (x.ia && x.origem !== 'manual' && x.origem !== 'ia') {
      var bloco = el('div', { cls: 'sugestao' });
      bloco.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Sugestão de IA (beta)' }));
      bloco.appendChild(el('p', {}, [el('strong', { texto: x.ia.cat }), document.createTextNode(' · confiança ' + fmtPct.format(x.ia.conf))]));
      bloco.appendChild(el('button', { cls: 'btn menta pequeno', attrs: { type: 'button', style: '' }, texto: 'Aceitar sugestão', on: { click: function () {
        x.cat = x.ia.cat; x.origem = 'ia'; salvar(); renderLista(); avisar('Sugestão aceita.');
      } } }));
      painel.appendChild(bloco);
    }

    var parecidas = t.txs.filter(function (y) {
      return y.id !== x.id && norm(y.desc).split(' ')[0] === norm(x.desc).split(' ')[0] && norm(y.desc).split(' ')[0].length > 2;
    }).slice(0, 4);
    painel.appendChild(el('p', { cls: 'rotulo', texto: 'Transações parecidas' }));
    if (!parecidas.length) painel.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Nenhuma outra transação com esse início de descrição.' }));
    else painel.appendChild(el('ul', { cls: 'previa-lista' }, parecidas.map(function (y) {
      return el('li', { texto: y.data + ' · ' + y.desc + ' · ' + (y.cat || 'sem categoria') });
    })));

    painel.appendChild(el('div', { cls: 'acoes', attrs: { style: '' } }, [
      el('button', { cls: 'btn primary pequeno', attrs: { type: 'button' }, texto: 'Criar regra a partir desta', on: { click: function () {
        ui.prefill = { texto: norm(x.desc).split(' ').slice(0, 2).join(' '), cat: x.cat || null };
        ir('#/regras');
      } } })
    ]));
    box.appendChild(painel);
  }

  document.addEventListener('keydown', function (ev) {
    if (rotaAtual() !== 'categorizar' || !ui.selId) return;
    var alvo = ev.target;
    if (alvo && /INPUT|SELECT|TEXTAREA/.test(alvo.tagName)) return;
    if (!/^[1-9]$/.test(ev.key)) return;
    var nome = QUICK[+ev.key - 1];
    var x = T().txs.filter(function (y) { return y.id === ui.selId; })[0];
    if (!x) return;
    if (!tipoOk(nome, x.valor)) {
      avisar('“' + nome + '” é categoria de ' + (x.valor > 0 ? 'despesa' : 'receita') + ' e esta transação é uma ' + (x.valor > 0 ? 'entrada' : 'saída') + '. Escolha pelo seletor.');
      return;
    }
    mudarCat(x, nome, 'manual');
    avisar('“' + nome + '” aplicada.');
    renderLista();
  });

  // ---------- Regras ----------

  VISTAS.regras = function (sec) {
    var t = T();
    cabecalhoPagina(sec, 'Regras de categorização', 'Ensine uma vez, aplique sempre', 'Uma regra categoriza todas as transações que contêm o texto. A primeira regra ativa que bate vale. Categorias feitas à mão nunca são trocadas.');

    var card = el('section', { cls: 'card', attrs: { 'aria-labelledby': 'h-nova' } });
    card.appendChild(el('div', { cls: 'cab' }, [el('p', { cls: 'rot', texto: 'Nova regra' }), el('h2', { cls: 'h2', attrs: { id: 'h-nova' }, texto: 'Criar regra' })]));

    var texto = el('input', { attrs: { type: 'text', id: 'regra-texto', placeholder: 'Ex.: UBER, PIX CLIENTE', autocomplete: 'off', maxlength: '40', 'aria-describedby': 'regra-erro regra-previa' } });
    var op = el('select', { attrs: { id: 'regra-op' } }, [
      el('option', { attrs: { value: 'contem' }, texto: 'contém' }),
      el('option', { attrs: { value: 'comeca' }, texto: 'começa com' }),
      el('option', { attrs: { value: 'regex' }, texto: 'expressão (regex)' })
    ]);
    var cat = el('select', { attrs: { id: 'regra-cat' } }, [catsOpcoes(false, false)]);
    var erro = el('p', { cls: 'erro-campo', attrs: { id: 'regra-erro', role: 'alert' } });
    var previa = el('p', { cls: 'previa', attrs: { id: 'regra-previa', 'aria-live': 'polite' } });
    var lista = el('ul', { cls: 'previa-lista', attrs: { id: 'regra-exemplos' } });
    var botaoEx = el('button', { cls: 'btn ghost pequeno', attrs: { type: 'button', 'aria-expanded': 'false' }, texto: 'Ver exemplos' });
    var botaoCriar = el('button', { cls: 'btn primary', attrs: { type: 'button', id: 'regra-criar' }, texto: 'Criar regra' });

    if (ui.prefill) {
      texto.value = ui.prefill.texto;
      if (ui.prefill.cat) cat.value = ui.prefill.cat;
      ui.prefill = null;
    } else cat.value = 'Fornecedores';

    var form = el('form', { cls: 'form-regra', attrs: { novalidate: 'novalidate' } }, [
      el('div', { cls: 'linha-form' }, [
        el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'regra-texto' }, texto: 'Quando a descrição' }), texto]),
        el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'regra-op' }, texto: 'Operador' }), op]),
        el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'regra-cat' }, texto: 'Então categoria' }), cat])
      ]),
      erro,
      el('div', { cls: 'bloco' }, [previa, lista]),
      el('div', { cls: 'acoes', attrs: { style: '' } }, [botaoCriar, botaoEx])
    ]);
    card.appendChild(form);
    sec.appendChild(card);

    function validar() {
      var k = texto.value.trim();
      if (op.value === 'regex') {
        try { new RegExp(k, 'i'); } catch (e) { return 'Expressão inválida. Revise os caracteres especiais.'; }
      }
      if (k.length < 3) return 'Digite pelo menos 3 caracteres.';
      return '';
    }

    function atualizarPreviaRegra() {
      var k = texto.value.trim();
      limpar(lista);
      botaoEx.setAttribute('aria-expanded', 'false');
      if (k.length < 3 || validar()) {
        previa.textContent = 'Digite pelo menos 3 caracteres para ver quantas transações bateriam.';
        botaoCriar.disabled = false;
        return;
      }
      var candidato = { id: '_', texto: k, op: op.value, cat: cat.value, ativa: true };
      var bate = T().txs.filter(function (x) { return x.origem !== 'manual' && matchRegra(candidato, x.desc) && tipoOk(cat.value, x.valor); });
      limpar(previa);
      previa.appendChild(document.createTextNode('Aplicaria a '));
      previa.appendChild(el('strong', { texto: bate.length + (bate.length === 1 ? ' transação' : ' transações') }));
      previa.appendChild(document.createTextNode(bate.length ? '.' : '. Ajuste o texto ou a categoria.'));
      botaoEx.onclick = function () {
        var aberto = botaoEx.getAttribute('aria-expanded') === 'true';
        limpar(lista);
        if (!aberto) bate.slice(0, 5).forEach(function (x) { lista.appendChild(el('li', { texto: x.data + ' · ' + x.desc + ' · ' + fmtSinal(x.valor) })); });
        botaoEx.setAttribute('aria-expanded', aberto ? 'false' : 'true');
      };
    }

    texto.addEventListener('input', function () {
      erro.textContent = '';
      clearTimeout(timerPrevia);
      timerPrevia = setTimeout(atualizarPreviaRegra, 300);
    });
    op.addEventListener('change', atualizarPreviaRegra);
    cat.addEventListener('change', atualizarPreviaRegra);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); criar(); });
    botaoCriar.addEventListener('click', function () { criar(); });

    function criar() {
      var e = validar();
      if (e) { erro.textContent = e; texto.classList.add('invalido'); sacudir(texto); texto.focus(); return; }
      texto.classList.remove('invalido');
      var tn = T();
      var r = { id: novoId('r'), texto: texto.value.trim(), op: op.value, cat: cat.value, ativa: true };
      tn.regras.unshift(r);
      aplicarTodas(tn);
      salvar();
      var n = tn.txs.filter(function (x) { return x.origem === 'regra' && x.cat === r.cat && matchRegra(r, x.desc); }).length;
      avisar('Regra criada. ' + n + (n === 1 ? ' transação categorizada.' : ' transações categorizadas.'));
      render();
    }

    var cabLista = el('div', { cls: 'cab bloco' }, [
      el('p', { cls: 'rot', texto: 'Regras ativas' }),
      el('h2', { cls: 'h2', texto: t.regras.length + (t.regras.length === 1 ? ' regra' : ' regras') })
    ]);
    sec.appendChild(cabLista);
    cabLista.appendChild(el('button', { cls: 'btn ghost pequeno', attrs: { type: 'button' }, texto: 'Reaplicar todas', on: { click: function () {
      aplicarTodas(T()); salvar(); avisar('Regras reaplicadas às transações não editadas à mão.'); render();
    } } }));

    var ul = el('ul', { cls: 'lista-regras' });
    if (!t.regras.length) ul.appendChild(el('li', { cls: 'ajuda-campo', texto: 'Nenhuma regra. Crie a primeira acima.' }));
    t.regras.forEach(function (r, i) {
      var contagem = t.txs.filter(function (x) { return matchRegra(r, x.desc) && (x.origem === 'regra' || !x.cat || x.origem === 'ia'); }).length;
      var opTexto = r.op === 'contem' ? 'contém' : (r.op === 'comeca' ? 'começa com' : 'regex');
      var item = el('li', { cls: 'regra-linha' + (r.ativa ? '' : ' pausada') }, [
        el('div', { cls: 'topo-regra' }, [
          el('span', { cls: 'texto-regra', texto: (i + 1) + '. ' + r.texto }),
          el('span', { cls: 'badge ' + (r.ativa ? 'regra' : ''), texto: r.ativa ? 'Ativa' : 'Pausada' })
        ]),
        el('p', { cls: 'detalhe-regra', texto: 'Quando a descrição ' + opTexto + ' “' + r.texto + '” → ' + r.cat + ' · ' + contagem + (contagem === 1 ? ' transação' : ' transações') }),
        el('div', { cls: 'acoes-regra' }, [
          el('button', { cls: 'btn pequeno', attrs: { type: 'button', 'aria-pressed': r.ativa ? 'true' : 'false' }, texto: r.ativa ? 'Pausar' : 'Ativar', on: { click: function () {
            r.ativa = !r.ativa; aplicarTodas(T()); salvar(); render();
          } } }),
          el('button', { cls: 'btn pequeno perigo', attrs: { type: 'button' }, texto: 'Remover', on: { click: function () {
            var tn = T();
            var idx = tn.regras.indexOf(r);
            tn.regras.splice(idx, 1);
            aplicarTodas(tn); salvar();
            avisar('Regra removida. Transações categorizadas só por ela voltam a pendente.', { rotulo: 'Desfazer', fn: function () {
              tn.regras.splice(idx, 0, r); aplicarTodas(tn); salvar(); render();
            } });
            render();
          } } })
        ])
      ]);
      ul.appendChild(item);
    });
    sec.appendChild(ul);
  };

  // ---------- Relatórios ----------

  function graficoFluxo(serie) {
    var W = 720, H = 300, P = { l: 56, r: 12, t: 16, b: 34 };
    var max = Math.max.apply(null, serie.map(function (s) { return Math.max(s.ent, s.sai); })) * 1.1 || 1;
    var n = serie.length;
    var x = function (i) { return P.l + (n > 1 ? i * (W - P.l - P.r) / (n - 1) : (W - P.l - P.r) / 2); };
    var y = function (v) { return H - P.b - (v / max) * (H - P.t - P.b); };
    var raiz = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Entradas e saídas dos últimos meses' });
    for (var g = 0; g <= 4; g++) {
      var v = (max / 1.1) * g / 4;
      raiz.appendChild(svg('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), class: 'eixo' }));
      raiz.appendChild(svg('text', { x: P.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, [document.createTextNode(fmtK(v))]));
    }
    var pEnt = serie.map(function (s, i) { return x(i) + ',' + y(s.ent); });
    var pSai = serie.map(function (s, i) { return x(i) + ',' + y(s.sai); });
    raiz.appendChild(svg('polygon', { points: [x(0) + ',' + y(0)].concat(pEnt, [x(n - 1) + ',' + y(0)]).join(' '), class: 'area-ent' }));
    raiz.appendChild(svg('polygon', { points: [x(0) + ',' + y(0)].concat(pSai, [x(n - 1) + ',' + y(0)]).join(' '), class: 'area-sai' }));
    raiz.appendChild(svg('polyline', { points: pEnt.join(' '), class: 'linha-ent' }));
    raiz.appendChild(svg('polyline', { points: pSai.join(' '), class: 'linha-sai' }));
    serie.forEach(function (s, i) {
      raiz.appendChild(svg('text', { x: x(i), y: H - 10, 'text-anchor': 'middle' }, [document.createTextNode(nomeMes(s.mes))]));
    });
    return raiz;
  }

  function graficoRosca(itens, total) {
    var C = 2 * Math.PI * 80;
    var raiz = svg('svg', { viewBox: '0 0 220 220', class: 'grafico', role: 'img', 'aria-label': 'Participação das categorias nas saídas' });
    var acumulado = 0;
    itens.forEach(function (it) {
      var frac = total ? it.valor / total : 0;
      var seg = svg('circle', { cx: '110', cy: '110', r: '80', class: 'rosca-seg', stroke: it.cor });
      seg.setAttribute('stroke-dasharray', (frac * C) + ' ' + C);
      seg.setAttribute('stroke-dashoffset', String(-acumulado * C));
      seg.setAttribute('transform', 'rotate(-90 110 110)');
      raiz.appendChild(seg);
      acumulado += frac;
    });
    raiz.appendChild(svg('text', { x: '110', y: '106', 'text-anchor': 'middle', style: '' }, [document.createTextNode(fmtK(total))]));
    raiz.appendChild(svg('text', { x: '110', y: '126', 'text-anchor': 'middle' }, [document.createTextNode('em saídas')]));
    return raiz;
  }

  var CORES = ['#6516BD', '#68E0BC', '#A3192F', '#0B6B52', '#2F3F9E', '#B9A3E3', '#7A4F00', '#5E5670'];

  VISTAS.relatorios = function (sec) {
    var t = T();
    cabecalhoPagina(sec, 'Relatórios', 'Como o caixa se mexe', 'Três visões do mesmo extrato: tendência, categorias e projeção. Meses anteriores são um histórico fictício de demonstração; o mês atual vem do extrato importado.');
    var abas = [['visao', 'Visão geral'], ['categoria', 'Por categoria'], ['projecao', 'Projeção']];
    var tl = el('div', { cls: 'tabs', attrs: { role: 'tablist', 'aria-label': 'Tipo de relatório' } });
    abas.forEach(function (a) {
      var b = el('button', { attrs: { type: 'button', role: 'tab', id: 'tab-' + a[0], 'aria-selected': ui.aba === a[0] ? 'true' : 'false', 'aria-controls': 'painel-rel', tabindex: ui.aba === a[0] ? '0' : '-1' }, texto: a[1] });
      b.addEventListener('click', function () { ui.aba = a[0]; render(); });
      b.addEventListener('keydown', function (ev) {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        var i = abas.findIndex(function (q) { return q[0] === ui.aba; });
        i = (i + (ev.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length;
        ui.aba = abas[i][0]; render(); foco('tab-' + ui.aba);
      });
      tl.appendChild(b);
    });
    sec.appendChild(tl);
    var area = el('section', { cls: 'card', attrs: { id: 'painel-rel', role: 'tabpanel', 'aria-labelledby': 'tab-' + ui.aba } });
    sec.appendChild(area);

    if (ui.aba === 'visao') relVisao(area, t);
    else if (ui.aba === 'categoria') relCategoria(area, t);
    else relProjecao(area, t);
  };

  function relVisao(area, t) {
    var serie = serieMensal(t);
    var ult = serie[serie.length - 1] || { ent: 0, sai: 0 };
    var ant = serie[serie.length - 2] || { ent: 0, sai: 0 };
    var totE = serie.reduce(function (s, m) { return s + m.ent; }, 0);
    var totS = serie.reduce(function (s, m) { return s + m.sai; }, 0);
    var var_ = ant.sai ? (ult.sai - ant.sai) / ant.sai : 0;
    var kl = el('div', { cls: 'kpi-linha' });
    [['Entradas (' + serie.length + ' meses)', fmt(totE), 'receita'], ['Saídas (' + serie.length + ' meses)', fmt(totS), 'despesa'], ['Saldo do período', fmtSinal(totE - totS), totE - totS < 0 ? 'despesa' : 'receita'], ['Saídas vs. mês anterior', (var_ >= 0 ? '+' : '−') + fmtPct.format(Math.abs(var_)), var_ > 0 ? 'despesa' : 'receita']].forEach(function (k) {
      kl.appendChild(el('div', { cls: 'mini' }, [el('p', { cls: 'kpi-rot', texto: k[0] }), el('p', { cls: 'kpi-valor ' + k[2], texto: k[1] })]));
    });
    area.appendChild(kl);
    area.appendChild(graficoFluxo(serie));
    area.appendChild(el('div', { cls: 'legenda' }, [el('span', { attrs: { style: '' }, texto: 'Entradas' }), el('span', { texto: 'Saídas' })]));
    var legendas = area.querySelectorAll('.legenda span');
    if (legendas[0]) legendas[0].style.setProperty('--c', 'var(--receita)');
    if (legendas[1]) legendas[1].style.setProperty('--c', 'var(--despesa)');

    var atual = t.txs.filter(function (x) { return mesDe(x.iso) === mesDe(mesMaisRecente(t.txs) || ''); });
    var porCat = {};
    atual.forEach(function (x) { if (x.valor < 0) porCat[x.cat || 'Sem categoria'] = (porCat[x.cat || 'Sem categoria'] || 0) - x.valor; });
    var top = Object.keys(porCat).map(function (k) { return { nome: k, valor: porCat[k] }; }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, 5);
    var tot = top.reduce(function (s, i) { return s + i.valor; }, 0);
    area.appendChild(el('div', { cls: 'cab bloco' }, [el('p', { cls: 'rot', texto: 'Mês atual' }), el('h2', { cls: 'h2', texto: 'Top 5 saídas' })]));
    if (!top.length) area.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Nenhuma saída no mês atual.' }));
    else {
      var barras = el('ol', { cls: 'barras' });
      top.forEach(function (i) {
        var pre = el('span', { cls: 'barra-preenchimento' });
        pre.style.width = (tot ? (i.valor / tot) * 100 : 0).toFixed(1) + '%';
        barras.appendChild(el('li', { cls: 'barra-item' + (i.nome === 'Sem categoria' ? ' sem' : '') }, [
          el('div', { cls: 'barra-topo' }, [el('span', { cls: 'barra-nome', texto: i.nome }), el('span', { cls: 'barra-valor', texto: fmt(i.valor) + ' · ' + fmtPct.format(tot ? i.valor / tot : 0) })]),
          el('div', { cls: 'barra-trilho', attrs: { 'aria-hidden': 'true' } }, [pre])
        ]));
      });
      area.appendChild(barras);
    }
  }

  function relCategoria(area, t) {
    var mapa = {};
    var totS = 0;
    t.txs.forEach(function (x) {
      var k = x.cat || 'Sem categoria';
      if (!mapa[k]) mapa[k] = { nome: k, ent: 0, sai: 0, n: 0 };
      if (x.valor > 0) mapa[k].ent += x.valor; else { mapa[k].sai += -x.valor; totS += -x.valor; }
      mapa[k].n++;
    });
    var linhas = Object.keys(mapa).map(function (k) { return mapa[k]; }).sort(function (a, b) { return b.sai - a.sai || b.ent - a.ent; });
    if (!linhas.length) { area.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Sem transações para agrupar.' })); return; }

    var saidas = linhas.filter(function (l) { return l.sai > 0; });
    var topo = saidas.slice(0, 4);
    var outras = saidas.slice(4).reduce(function (s, l) { return s + l.sai; }, 0);
    var itensRosca = topo.map(function (l, i) { return { nome: l.nome, valor: l.sai, cor: CORES[i] }; });
    if (outras) itensRosca.push({ nome: 'Outras', valor: outras, cor: CORES[4] });
    var roscaBox = el('div', { cls: 'rosca-wrap' });
    roscaBox.appendChild(graficoRosca(itensRosca, totS));
    roscaBox.appendChild(el('ul', { cls: 'lista-cores' }, itensRosca.map(function (i) {
      var li = el('li', {}, [el('i'), el('span', { texto: i.nome + ' · ' + fmtPct.format(totS ? i.valor / totS : 0) })]);
      li.querySelector('i').style.setProperty('--c', i.cor);
      return li;
    })));
    area.appendChild(roscaBox);

    var tb = el('tbody');
    linhas.forEach(function (l) {
      var btn = el('button', { cls: 'desc-btn', attrs: { type: 'button' }, texto: l.nome, on: { click: function () { ui.catDetalhe = l.nome; render(); } } });
      tb.appendChild(el('tr', {}, [
        el('td', { cls: 'c-desc' }, [btn]),
        el('td', { cls: 'num receita', texto: fmt(l.ent) }),
        el('td', { cls: 'num despesa', texto: fmt(l.sai) }),
        el('td', { cls: 'num ' + (l.ent - l.sai < 0 ? 'despesa' : 'receita'), texto: fmtSinal(l.ent - l.sai) }),
        el('td', { cls: 'num', texto: fmtPct.format(totS && l.sai ? l.sai / totS : 0) })
      ]));
    });
    area.appendChild(el('div', { cls: 'tabela-wrap bloco' }, [el('table', { cls: 'tabela' }, [
      el('caption', { cls: 'sr', texto: 'Totais por categoria. Clique no nome para ver as transações.' }),
      el('thead', {}, [el('tr', {}, [
        el('th', { attrs: { scope: 'col' }, texto: 'Categoria' }),
        el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Entradas' }),
        el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Saídas' }),
        el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Saldo' }),
        el('th', { cls: 'num', attrs: { scope: 'col' }, texto: '% das saídas' })
      ])]),
      tb
    ])]));
    area.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Variação por categoria entra quando houver histórico categorizado de meses anteriores.' }));

    if (ui.catDetalhe) {
      var det = t.txs.filter(function (x) { return (x.cat || 'Sem categoria') === ui.catDetalhe; }).sort(function (a, b) { return a.iso < b.iso ? 1 : -1; });
      var bloco = el('div', { cls: 'detalhe-cat' });
      bloco.appendChild(el('h3', { texto: ui.catDetalhe }));
      bloco.appendChild(el('div', { cls: 'acoes', attrs: { style: '' } }, [el('button', { cls: 'btn ghost pequeno', attrs: { type: 'button' }, texto: 'Fechar detalhe', on: { click: function () { ui.catDetalhe = null; render(); } } })]));
      var tbd = el('tbody');
      det.forEach(function (x) {
        tbd.appendChild(el('tr', {}, [el('td', { cls: 'c-data', texto: x.data }), el('td', { cls: 'c-desc', texto: x.desc }), el('td', { cls: 'num ' + (x.valor > 0 ? 'receita' : 'despesa'), texto: fmtSinal(x.valor) })]));
      });
      bloco.appendChild(el('div', { cls: 'tabela-wrap' }, [el('table', { cls: 'tabela' }, [
        el('caption', { cls: 'sr', texto: 'Transações da categoria ' + ui.catDetalhe }),
        el('thead', {}, [el('tr', {}, [el('th', { attrs: { scope: 'col' }, texto: 'Data' }), el('th', { attrs: { scope: 'col' }, texto: 'Descrição' }), el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Valor' })])]),
        tbd
      ])]));
      area.appendChild(bloco);
    }
  }

  function relProjecao(area, t) {
    var serie = serieMensal(t);
    var base = serie.slice(-3);
    var mediaE = base.reduce(function (s, m) { return s + m.ent; }, 0) / (base.length || 1);
    var mediaS = base.reduce(function (s, m) { return s + m.sai; }, 0) / (base.length || 1);
    var cen = {
      conservador: { g: 0.002, c: 0.008, rotulo: 'Conservador' },
      realista: { g: 0.008, c: 0.005, rotulo: 'Realista' },
      otimista: { g: 0.015, c: 0.003, rotulo: 'Otimista' }
    }[ui.cenario];

    var entrada = el('input', { attrs: { type: 'number', id: 'meses', min: '1', max: '12', step: '1', value: String(ui.meses), 'aria-describedby': 'meses-erro' } });
    var erroM = el('p', { cls: 'erro-campo', attrs: { id: 'meses-erro', role: 'alert' } });
    entrada.addEventListener('change', function () {
      var v = parseInt(entrada.value, 10);
      if (!(v >= 1 && v <= 12)) { erroM.textContent = 'Informe entre 1 e 12 meses.'; sacudir(entrada); return; }
      ui.meses = v; render();
    });
    var radios = ['conservador', 'realista', 'otimista'].map(function (k) {
      var r = el('input', { attrs: { type: 'radio', name: 'cenario', value: k } });
      r.checked = ui.cenario === k;
      r.addEventListener('change', function () { ui.cenario = k; render(); });
      return el('label', {}, [r, document.createTextNode(' ' + { conservador: 'Conservador', realista: 'Realista', otimista: 'Otimista' }[k])]);
    });
    area.appendChild(el('div', { cls: 'linha-form' }, [
      el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'meses' }, texto: 'Meses à frente' }), entrada, erroM]),
      el('div', { cls: 'campo' }, [el('span', { cls: 'rotulo', texto: 'Cenário' }), el('div', { cls: 'cenarios' }, radios)])
    ]));

    var pontos = [], saldo = 0;
    var n = ui.meses;
    pontos.push({ k: 0, saldo: 0, lo: 0, hi: 0 });
    for (var k = 1; k <= n; k++) {
      var ent = mediaE * Math.pow(1 + cen.g, k);
      var sai = mediaS * Math.pow(1 + cen.c, k);
      saldo += ent - sai;
      var faixa = Math.abs(ent - sai) * 0.5 * k + mediaE * 0.02 * k;
      pontos.push({ k: k, saldo: saldo, lo: saldo - faixa, hi: saldo + faixa });
    }
    var negativo = pontos.filter(function (p) { return p.saldo < 0; })[0];

    var W = 720, H = 300, P = { l: 64, r: 12, t: 16, b: 34 };
    var vals = pontos.reduce(function (acc, p) { return acc.concat([p.lo, p.hi, p.saldo]); }, [0]);
    var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    var span = (vmax - vmin) || 1;
    var x = function (i) { return P.l + (n ? i * (W - P.l - P.r) / n : 0); };
    var y = function (v) { return P.t + (vmax - v) / span * (H - P.t - P.b); };
    var raiz = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Projeção do saldo acumulado para ' + n + ' meses, cenário ' + cen.rotulo });
    for (var g = 0; g <= 4; g++) {
      var v = vmin + span * g / 4;
      raiz.appendChild(svg('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), class: 'eixo' }));
      raiz.appendChild(svg('text', { x: P.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, [document.createTextNode(fmtK(v))]));
    }
    var sup = pontos.map(function (p) { return x(p.k) + ',' + y(p.hi); });
    var inf = pontos.slice().reverse().map(function (p) { return x(p.k) + ',' + y(p.lo); });
    raiz.appendChild(svg('polygon', { points: sup.concat(inf).join(' '), class: 'cone' }));
    raiz.appendChild(svg('polyline', { points: pontos.map(function (p) { return x(p.k) + ',' + y(p.saldo); }).join(' '), class: 'linha-proj' }));
    pontos.forEach(function (p) {
      raiz.appendChild(svg('circle', { cx: x(p.k), cy: y(p.saldo), r: '3.5', class: 'ponto' }));
      raiz.appendChild(svg('text', { x: x(p.k), y: H - 10, 'text-anchor': 'middle' }, [document.createTextNode(p.k === 0 ? 'Hoje' : '+' + p.k)]));
    });
    area.appendChild(el('div', { cls: 'bloco' }, [raiz]));
    area.appendChild(el('div', { cls: 'legenda' }, [el('span', { texto: 'Saldo projetado' }), el('span', { texto: 'Faixa estimada' })]));
    var leg = area.querySelectorAll('.legenda span');
    if (leg[0]) leg[0].style.setProperty('--c', 'var(--roxo)');
    if (leg[1]) { leg[1].style.setProperty('--c', 'var(--roxo)'); leg[1].style.opacity = '.4'; }

    var conclusao = negativo
      ? 'Saldo projetado negativo a partir do mês +' + negativo.k + ' (cenário ' + cen.rotulo.toLowerCase() + ').'
      : 'Saldo projetado positivo nos ' + n + ' meses (cenário ' + cen.rotulo.toLowerCase() + ').';
    area.appendChild(el('p', { cls: 'destaque bloco', texto: conclusao }));
    area.appendChild(el('p', { cls: 'ajuda-campo', texto: 'Base: média de entradas e saídas dos últimos 3 meses. Taxas do cenário: entradas ' + fmtPct1.format(cen.g) + ' e saídas ' + fmtPct1.format(cen.c) + ' ao mês. Estimativa, não promessa.' }));
  }

  // ---------- DRE ----------

  VISTAS.dre = function (sec) {
    var t = T();
    cabecalhoPagina(sec, 'DRE simplificado', 'Resultado do período', 'Receitas e despesas por categoria, a partir das transações importadas. Transferências internas ficam fora do DRE.');
    if (!t.txs.length) { sec.appendChild(el('p', { cls: 'vazio', texto: 'Importe um extrato para montar o DRE.' })); return; }

    var grupos = { r: {}, d: {} };
    var semR = 0, semD = 0, transf = 0;
    t.txs.forEach(function (x) {
      var c = catInfo(x.cat || '');
      if (!x.cat) { if (x.valor > 0) semR += x.valor; else semD += -x.valor; return; }
      if (c.t === 'x') { transf++; return; }
      var g = c.t === 'r' ? grupos.r : grupos.d;
      g[x.cat] = (g[x.cat] || 0) + Math.abs(x.valor);
    });
    var totR = Object.keys(grupos.r).reduce(function (s, k) { return s + grupos.r[k]; }, 0) + semR;
    var totD = Object.keys(grupos.d).reduce(function (s, k) { return s + grupos.d[k]; }, 0) + semD;
    var lucro = totR - totD;
    var margem = totR ? lucro / totR : 0;

    function bloco(titulo, obj, sem, total, cls) {
      var b = el('section', { cls: 'card dre-bloco ' + cls, attrs: { 'aria-labelledby': 'dre-' + cls } });
      b.appendChild(el('h2', { attrs: { id: 'dre-' + cls }, texto: titulo }));
      var dl = el('dl');
      Object.keys(obj).sort(function (a, b2) { return obj[b2] - obj[a]; }).forEach(function (k) {
        dl.appendChild(el('dt', { texto: k })); dl.appendChild(el('dd', { texto: fmt(obj[k]) }));
      });
      if (sem) { dl.appendChild(el('dt', { texto: 'Sem categoria' })); dl.appendChild(el('dd', { cls: 'pendente-txt', texto: fmt(sem) })); }
      dl.appendChild(el('dt', { cls: 'total', texto: 'Total' }));
      dl.appendChild(el('dd', { cls: 'total ' + cls, texto: fmt(total) }));
      b.appendChild(dl);
      return b;
    }

    var grade = el('div', { cls: 'dre bloco' });
    grade.appendChild(bloco('Receitas', grupos.r, semR, totR, 'receita'));
    grade.appendChild(bloco('Despesas', grupos.d, semD, totD, 'despesa'));
    var res = el('section', { cls: 'dre-resultado', attrs: { 'aria-label': 'Resultado do período' } }, [
      el('div', {}, [el('p', { cls: 'kpi-rot', texto: 'Lucro líquido do período' }), el('p', { cls: 'kpi-valor ' + (lucro < 0 ? 'despesa' : ''), texto: fmtSinal(lucro) })]),
      el('div', {}, [el('p', { cls: 'kpi-rot', texto: 'Margem' }), el('span', { cls: 'badge', texto: fmtPct.format(margem) })])
    ]);
    grade.appendChild(res);
    sec.appendChild(grade);
    sec.appendChild(el('p', { cls: 'ajuda-campo bloco', texto: (transf ? plural(transf, 'transação marcada como transferência interna foi excluída', 'transações marcadas como transferência interna foram excluídas') + ' do DRE. ' : '') + (semR + semD ? 'Valores sem categoria estão contados à parte e entram no total.' : '') }));
  };

  // ---------- Conciliação ----------

  VISTAS.conciliacao = function (sec) {
    var t = T();
    cabecalhoPagina(sec, 'Conciliação bancária', 'Confira o saldo com o banco', 'Marque os lançamentos já conferidos com o extrato. Informe o saldo do banco para ver a diferença.');
    if (!t.txs.length) { sec.appendChild(el('p', { cls: 'vazio', texto: 'Importe um extrato para conciliar.' })); return; }

    var saldoSis = saldoConsolidado(t);
    var saldoBanco = parseValor(ui.saldoBanco);
    var temBanco = isFinite(saldoBanco);
    var diff = temBanco ? saldoSis - saldoBanco : null;

    var inputBanco = el('input', { attrs: { type: 'text', id: 'saldo-banco', inputmode: 'decimal', placeholder: 'Ex.: 12.450,00', value: ui.saldoBanco, 'aria-describedby': 'dif' } });
    inputBanco.value = ui.saldoBanco;
    inputBanco.addEventListener('input', function () { ui.saldoBanco = inputBanco.value; atualizarDif(); });

    var conta = el('select', { attrs: { id: 'conta' } }, [el('option', { attrs: { value: 'principal' }, texto: t.contaNome })]);

    sec.appendChild(el('div', { cls: 'card recon-cab' }, [
      el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'conta' }, texto: 'Conta' }), conta]),
      el('div', { cls: 'campo' }, [el('label', { attrs: { for: 'saldo-banco' }, texto: 'Saldo informado pelo banco' }), inputBanco]),
      el('div', { cls: 'saldos' }, [
        el('p', { cls: 'kpi-rot', texto: 'Saldo no sistema' }),
        el('p', { cls: 'saldo-linha', texto: fmt(saldoSis) })
      ])
    ]));

    var conc = t.txs.filter(function (x) { return x.conc; }).length;
    var lista = el('section', { cls: 'card bloco', attrs: { 'aria-labelledby': 'rec-t' } });
    lista.appendChild(el('div', { cls: 'cab' }, [el('h2', { attrs: { id: 'rec-t' }, texto: 'Lançamentos' }), el('p', { cls: 'ajuda-campo', texto: conc + ' de ' + t.txs.length + ' conciliados.' })]));
    var tb = el('tbody');
    t.txs.forEach(function (x, i) {
      var chk = el('input', { cls: 'caixa', attrs: { type: 'checkbox', 'aria-label': 'Marcar ' + x.desc + ' em ' + x.data + ' como conferido' } });
      chk.checked = !!ui.conc[x.id];
      chk.disabled = x.conc;
      chk.addEventListener('change', function () { if (chk.checked) ui.conc[x.id] = true; else delete ui.conc[x.id]; atualizarRodape(); });
      var estado = x.conc ? el('span', { cls: 'badge conc', texto: '✓ Conciliado' }) : el('span', { cls: 'badge pendente', texto: 'Pendente' });
      var tr = el('tr', { cls: x.conc ? 'conc' : '' });
      tr.style.setProperty('--i', String(i));
      tr.appendChild(el('td', { cls: 'c-chk' }, [chk]));
      tr.appendChild(el('td', { cls: 'c-data', texto: x.data }));
      tr.appendChild(el('td', { cls: 'c-desc', texto: x.desc }));
      tr.appendChild(el('td', { cls: 'num ' + (x.valor > 0 ? 'receita' : 'despesa'), texto: fmtSinal(x.valor) }));
      tr.appendChild(el('td', {}, [estado]));
      tb.appendChild(tr);
    });
    lista.appendChild(el('div', { cls: 'tabela-wrap' }, [el('table', { cls: 'tabela' }, [
      el('caption', { cls: 'sr', texto: 'Lançamentos para conferir com o extrato do banco' }),
      el('thead', {}, [el('tr', {}, [
        el('th', { attrs: { scope: 'col' }, texto: 'Conferido' }),
        el('th', { attrs: { scope: 'col' }, texto: 'Data' }),
        el('th', { attrs: { scope: 'col' }, texto: 'Descrição' }),
        el('th', { cls: 'num', attrs: { scope: 'col' }, texto: 'Valor' }),
        el('th', { attrs: { scope: 'col' }, texto: 'Status' })
      ])]),
      tb
    ])]));

    var rodape = el('div', { cls: 'rodape-acao', attrs: { id: 'rodape-rec' } });
    sec.appendChild(lista);
    sec.appendChild(rodape);

    function atualizarDif() {
      var d = $('dif');
      if (!d) return;
      var b = parseValor(ui.saldoBanco);
      if (!isFinite(b)) { d.textContent = 'Diferença: informe o saldo do banco'; d.className = 'diff'; return; }
      var df = saldoSis - b;
      d.textContent = 'Diferença: ' + fmtSinal(df);
      d.className = 'diff ' + (Math.abs(df) < 0.005 ? 'ok' : 'erro');
    }

    function atualizarRodape() {
      limpar(rodape);
      var marcados = Object.keys(ui.conc).filter(function (id) { return t.txs.some(function (x) { return x.id === id && !x.conc; }); });
      var selecionar = el('button', { cls: 'btn ghost pequeno', attrs: { type: 'button' }, texto: 'Selecionar categorizadas', on: { click: function () {
        t.txs.forEach(function (x) { if (x.cat && !x.conc) ui.conc[x.id] = true; });
        atualizarRodape(); render();
      } } });
      var confirmar = el('button', { cls: 'btn primary', attrs: { type: 'button', id: 'confirmar-rec' }, texto: 'Confirmar conciliação (' + marcados.length + ')', on: { click: function () {
        if (!marcados.length) return;
        t.txs.forEach(function (x) { if (ui.conc[x.id]) x.conc = true; });
        ui.conc = {};
        salvar();
        var df = saldoSis - parseValor(ui.saldoBanco);
        var fechou = isFinite(df) && Math.abs(df) < 0.005;
        avisar(plural(marcados.length, 'lançamento conciliado.', 'lançamentos conciliados.') + (fechou ? ' Saldo fechado.' : ''));
        render();
        if (fechou) {
          var tri = document.querySelector('.triangulo-sid');
          if (tri) tri.classList.add('ok');
        }
      } } });
      if (!marcados.length) confirmar.setAttribute('disabled', 'disabled');
      rodape.appendChild(el('div', { cls: 'acoes', attrs: { style: '' } }, [selecionar, confirmar]));
      rodape.appendChild(el('span', { cls: 'diff', attrs: { id: 'dif' } }));
      atualizarDif();
    }
    atualizarRodape();
    if (temBanco) { /* diferença já calculada no rodapé */ }
  };

  // ---------- Exportar ----------

  function linhasExport(txs, conta) {
    var linhas = ['Data;Histórico;Débito;Crédito;Conta;Valor'];
    txs.forEach(function (x) {
      var c = catInfo(x.cat).c;
      var deb = x.valor < 0 ? c : '1.1.01';
      var cre = x.valor < 0 ? '1.1.01' : c;
      linhas.push([x.data, '"' + x.desc.replace(/"/g, '""') + '"', deb, cre, conta, Math.abs(x.valor).toFixed(2).replace('.', ',')].join(';'));
    });
    return linhas.join('\r\n');
  }

  function ofxData(iso) { return iso.replace(/-/g, '') + '120000[-3:BRT]'; }

  function ofxArquivo(txs, t) {
    var ordenados = txs.slice().sort(function (a, b) { return a.iso < b.iso ? -1 : 1; });
    var ini = ordenados[0].iso, fim = ordenados[ordenados.length - 1].iso;
    var saldoFim = t.saldoInicial + t.txs.filter(function (x) { return x.iso <= fim; }).reduce(function (s, x) { return s + x.valor; }, 0);
    var corpo = ordenados.map(function (x) {
      return '<STMTTRN>\r\n<TRNTYPE>' + (x.valor < 0 ? 'DEBIT' : 'CREDIT') + '\r\n<DTPOSTED>' + ofxData(x.iso) +
        '\r\n<TRNAMT>' + x.valor.toFixed(2) + '\r\n<FITID>' + x.id + '\r\n<MEMO>' + x.desc.replace(/[<>&]/g, ' ') + '\r\n</STMTTRN>';
    }).join('\r\n');
    return 'OFXHEADER:100\r\nDATA:OFXSGML\r\nVERSION:102\r\nSECURITY:NONE\r\nENCODING:UTF-8\r\nCHARSET:1252\r\nCOMPRESSION:NONE\r\nOLDFILEUID:NONE\r\nNEWFILEUID:NONE\r\n\r\n' +
      '<OFX>\r\n<BANKMSGSRSV1><STMTTRNRS><TRNUID>1<STATUS><CODE>0<SEVERITY>INFO</STATUS>\r\n<STMTRS><CURDEF>BRL\r\n' +
      '<BANKACCTFROM><BANKID>0001<ACCTID>1234<ACCTTYPE>CHECKING</BANKACCTFROM>\r\n<BANKTRANLIST>\r\n<DTSTART>' + ofxData(ini) + '\r\n<DTEND>' + ofxData(fim) + '\r\n' +
      corpo + '\r\n</BANKTRANLIST>\r\n<LEDGERBAL><BALAMT>' + saldoFim.toFixed(2) + '\r\n<DTASOF>' + ofxData(fim) + '</LEDGERBAL>\r\n</STMTRS></STMTTRNRS></BANKMSGSRSV1>\r\n</OFX>\r\n';
  }

  function baixar(nome, conteudo, tipo) {
    var blob = new Blob([(/csv/.test(tipo) ? '\uFEFF' : '') + conteudo], { type: tipo });
    var url = URL.createObjectURL(blob);
    var a = el('a', { attrs: { href: url, download: nome } });
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  VISTAS.exportar = function (sec) {
    var t = T();
    cabecalhoPagina(sec, 'Exportar para a contabilidade', 'Arquivo pronto para o contador', 'Gera um arquivo com as transações do período. Antes, todas precisam ter categoria, porque cada categoria vira uma conta contábil.');
    if (!t.txs.length) { sec.appendChild(el('p', { cls: 'vazio', texto: 'Importe um extrato para exportar.' })); return; }

    var meses = [];
    t.txs.forEach(function (x) { var m = mesDe(x.iso); if (meses.indexOf(m) === -1) meses.push(m); });
    meses.sort();

    var formatos = [
      { k: 'csv', n: 'CSV genérico', d: 'Data, Histórico, Débito, Crédito, Conta e Valor, separados por ponto e vírgula.', ok: true },
      { k: 'ofx', n: 'OFX reverso', d: 'Extrato em OFX para reimportar em outro sistema.', ok: true },
      { k: 'sped', n: 'SPED Contábil', d: 'Layout oficial ECD/ECF. Em breve.', ok: false }
    ];
    var cards = el('div', { cls: 'formatos', attrs: { role: 'radiogroup', 'aria-label': 'Formato de exportação' } });
    formatos.forEach(function (f) {
      var r = el('input', { attrs: { type: 'radio', name: 'formato', value: f.k } });
      r.checked = ui.formato === f.k;
      if (!f.ok) r.disabled = true;
      r.addEventListener('change', function () { ui.formato = f.k; render(); });
      var corpo = el('span', { cls: 'corpo' }, [el('strong', { texto: f.n }), el('span', { texto: f.d })]);
      if (!f.ok) corpo.appendChild(el('span', { cls: 'em-breve', texto: 'Em breve' }));
      cards.appendChild(el('label', { cls: 'formato-card' }, [r, corpo]));
    });
    sec.appendChild(el('section', { cls: 'card bloco', attrs: { 'aria-labelledby': 'fmt-t' } }, [
      el('h2', { cls: 'h2', attrs: { id: 'fmt-t' }, texto: 'Formato' }),
      cards
    ]));

    var periodo = el('select', { attrs: { id: 'periodo' } }, [el('option', { attrs: { value: 'todos' }, texto: 'Todo o período importado' })]);
    meses.forEach(function (m) { periodo.appendChild(el('option', { attrs: { value: m }, texto: nomeMesLongo(m) })); });
    periodo.value = ui.periodo;
    periodo.addEventListener('change', function () { ui.periodo = periodo.value; render(); });

    var erros = el('ul', { cls: 'erros-lista', attrs: { id: 'erros-exp', role: 'alert' } });
    var botao = el('button', { cls: 'btn primary', attrs: { type: 'button', id: 'gerar' }, texto: 'Gerar arquivo', on: { click: function () {
      var lista = txsPeriodo();
      var semCat = lista.filter(function (x) { return !x.cat; });
      limpar(erros);
      if (!lista.length) { erros.appendChild(el('li', { texto: 'Nenhuma transação no período escolhido.' })); sacudir(erros); return; }
      if (semCat.length) {
        erros.appendChild(el('li', { texto: semCat.length + (semCat.length === 1 ? ' transação sem categoria.' : ' transações sem categoria.') + ' Categorize antes de gerar o arquivo.' }));
        sacudir(erros);
        return;
      }
      var nomeBase = 'extrato-' + t.sigla.toLowerCase() + '-' + (ui.periodo === 'todos' ? 'periodo' : ui.periodo);
      if (ui.formato === 'ofx') baixar(nomeBase + '.ofx', ofxArquivo(lista, t), 'application/x-ofx;charset=utf-8');
      else baixar(nomeBase + '.csv', linhasExport(lista, t.contaNome), 'text/csv;charset=utf-8');
      avisar('Arquivo gerado com ' + plural(lista.length, 'transação.', 'transações.'));
    } } });

    sec.appendChild(el('section', { cls: 'card bloco', attrs: { 'aria-labelledby': 'per-t' } }, [
      el('h2', { cls: 'h2', attrs: { id: 'per-t' }, texto: 'Período' }),
      el('div', { cls: 'campo bloco' }, [el('label', { attrs: { for: 'periodo' }, texto: 'Mês' }), periodo]),
      el('div', { cls: 'acoes bloco', attrs: { style: '' } }, [botao]),
      erros
    ]));

    var resumoEx = txsPeriodo();
    var semCatEx = resumoEx.filter(function (x) { return !x.cat; }).length;
    sec.appendChild(el('p', { cls: 'ajuda-campo bloco', texto: plural(resumoEx.length, 'transação', 'transações') + ' no período' + (semCatEx ? ' · ' + semCatEx + ' sem categoria' : ' · todas categorizadas') + '.' }));
  };

  function txsPeriodo() {
    var t = T();
    return t.txs.filter(function (x) { return ui.periodo === 'todos' || mesDe(x.iso) === ui.periodo; });
  }

  // ---------- Empresas (troca de tenant) ----------

  function montarEmpresas() {
    var lista = $('empresa-lista');
    var gatilho = $('empresa-gatilho');
    limpar(lista);
    db.tenants.forEach(function (t) {
      var li = el('li', { attrs: { role: 'option', tabindex: '0', 'aria-selected': t.id === db.ativo ? 'true' : 'false' } });
      li.appendChild(el('span', { cls: 'avatar', attrs: { 'aria-hidden': 'true' }, texto: t.sigla }));
      li.appendChild(el('span', {}, [el('span', { texto: t.nome }), el('span', { cls: 'cnpj', texto: 'Empresa de demonstração · fictícia' })]));
      var escolher = function () { trocarEmpresa(t.id); };
      li.addEventListener('click', escolher);
      li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); escolher(); } });
      lista.appendChild(li);
    });
    var novo = el('li', { attrs: { role: 'option', tabindex: '0', 'aria-selected': 'false' } }, [el('span', { cls: 'novo', texto: '+ Adicionar empresa' })]);
    var adicionar = function () { adicionarEmpresa(); };
    novo.addEventListener('click', adicionar);
    novo.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); adicionar(); } });
    lista.appendChild(novo);
    gatilho.setAttribute('aria-expanded', 'true');
    lista.hidden = false;
    var primeiro = lista.querySelector('[aria-selected="true"]') || lista.firstChild;
    if (primeiro) primeiro.focus();
  }

  function fecharEmpresas(voltarFoco) {
    var lista = $('empresa-lista');
    lista.hidden = true;
    $('empresa-gatilho').setAttribute('aria-expanded', 'false');
    if (voltarFoco) $('empresa-gatilho').focus();
  }

  function trocarEmpresa(id) {
    db.ativo = id;
    ui.marcados = {}; ui.selId = null; ui.conc = {}; ui.catDetalhe = null; ui.pagina = PAGINA; ui.busca = '';
    salvar();
    fecharEmpresas(true);
    render();
    avisar('Empresa trocada: ' + T().nome + '.');
  }

  function adicionarEmpresa() {
    var n = db.tenants.filter(function (t) { return t.id.indexOf('nova') === 0; }).length + 1;
    var nova = { id: novoId('nova'), nome: 'Empresa nova ' + n, sigla: 'E' + n, contaNome: 'Conta corrente', saldoInicial: 0, txs: [], regras: regrasIniciais(), hist: [] };
    db.tenants.push(nova);
    trocarEmpresa(nova.id);
  }

  // ---------- Tema ----------

  function aplicarTema(noir) {
    document.documentElement.setAttribute('data-theme', noir ? 'light-noir' : 'light');
    var b = $('tema');
    b.setAttribute('aria-pressed', noir ? 'true' : 'false');
    b.textContent = noir ? 'Light (claro)' : 'Light-Noir';
    try { localStorage.setItem(CHAVE_TEMA, noir ? 'noir' : 'claro'); } catch (e) { /* sem armazenamento */ }
  }

  // ---------- Inicialização ----------

  function ligar() {
    avisosEl = $('avisos');
    db = carregarDb();
    if (!db.tenants.some(function (t) { return t.id === db.ativo; })) db.ativo = db.tenants[0].id;

    var noir = false;
    try { noir = localStorage.getItem(CHAVE_TEMA) === 'noir'; } catch (e) { noir = false; }
    aplicarTema(noir);
    $('tema').addEventListener('click', function () { aplicarTema(document.documentElement.getAttribute('data-theme') !== 'light-noir'); });

    $('empresa-gatilho').addEventListener('click', function () {
      if ($('empresa-lista').hidden) montarEmpresas(); else fecharEmpresas(false);
    });
    $('empresa-lista').addEventListener('keydown', function (ev) {
      var itens = Array.prototype.slice.call(this.querySelectorAll('[role="option"]'));
      var i = itens.indexOf(document.activeElement);
      if (ev.key === 'Escape') { fecharEmpresas(true); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        var j = (i + (ev.key === 'ArrowDown' ? 1 : itens.length - 1)) % itens.length;
        itens[j].focus();
      }
    });
    document.addEventListener('click', function (ev) {
      if (!$('empresa').contains(ev.target)) { if (!$('empresa-lista').hidden) fecharEmpresas(false); }
    });

    window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
    if (!location.hash) location.replace('#/inicio');
    render();
  }

  ligar();
})();
