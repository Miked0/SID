/* Controle financeiro por extrato · demonstração SID
   Sem backend, sem rede, sem dados reais. Tudo roda no navegador.
   Sem innerHTML com dados do arquivo: o texto entra sempre por textContent. */
(function () {
  'use strict';

  var CATEGORIAS = [
    { grupo: 'Receitas', itens: ['Vendas', 'Serviços prestados', 'Outras receitas'] },
    { grupo: 'Despesas', itens: [
      'Pessoal', 'Fornecedores', 'Aluguel e condomínio', 'Marketing', 'Impostos',
      'Tarifas bancárias', 'Energia e telefonia', 'Transporte', 'Alimentação',
      'Serviços de terceiros', 'Outras despesas'
    ] }
  ];
  var RECEITAS = CATEGORIAS[0].itens;

  // Regras automáticas: trecho da descrição → categoria. A primeira que bater vale.
  var REGRAS_AUTO = [
    ['CLIENTE', 'Vendas'],
    ['SALARIO', 'Pessoal'], ['FOLHA', 'Pessoal'], ['INSS', 'Pessoal'], ['FGTS', 'Pessoal'],
    ['FORNECEDOR', 'Fornecedores'], ['ATACADO', 'Fornecedores'],
    ['ALUGUEL', 'Aluguel e condomínio'], ['CONDOMINIO', 'Aluguel e condomínio'],
    ['GOOGLE ADS', 'Marketing'], ['META ADS', 'Marketing'],
    ['SIMPLES NACIONAL', 'Impostos'], ['IMPOSTO', 'Impostos'], ['DARF', 'Impostos'],
    ['TARIFA', 'Tarifas bancárias'], ['IOF', 'Tarifas bancárias'],
    ['ENEL', 'Energia e telefonia'], ['SABESP', 'Energia e telefonia'], ['VIVO', 'Energia e telefonia'],
    ['UBER', 'Transporte'], ['ENTREGA', 'Transporte'], ['POSTO', 'Transporte'],
    ['IFOOD', 'Alimentação'], ['SUPERMERCADO', 'Alimentação'], ['PADARIA', 'Alimentação'],
    ['CONTADOR', 'Serviços de terceiros']
  ];

  // Extrato de exemplo (fictício). Empresa demonstrativa, novembro de 2026.
  var EXEMPLO = [
    'Data;Descrição;Valor',
    '02/11/2026;PIX RECEBIDO CLIENTE ANA SOUZA;3.200,00',
    '03/11/2026;ALUGUEL SALA COMERCIAL;-2.400,00',
    '03/11/2026;PAGAMENTO CLIENTE BRUNO LIMA;1.850,00',
    '04/11/2026;FOLHA PAGAMENTO NOV;-4.100,00',
    '04/11/2026;ENEL DISTRIB SP;-412,80',
    '05/11/2026;FORNECEDOR EMBALAGENS VALE;-890,00',
    '05/11/2026;UBER TRIP;-23,90',
    '06/11/2026;GOOGLE ADS *CAMP;-310,00',
    '06/11/2026;TARIFA PACOTE SERVICOS;-39,90',
    '07/11/2026;PIX RECEBIDO CLIENTE CASA VERDE;2.750,00',
    '07/11/2026;IFOOD *RESTAURANTE;-84,50',
    '08/11/2026;DAS SIMPLES NACIONAL;-689,30',
    '08/11/2026;SUPERMERCADO BH;-356,20',
    '09/11/2026;POSTO SHELL AV PAULISTA;-198,00',
    '10/11/2026;META ADS ANUNCIO;-260,00',
    '10/11/2026;PIX ENVIADO JOAO ENTREGAS;-150,00',
    '11/11/2026;CLIENTE LOJA NORTE PGTO;4.300,00',
    '11/11/2026;CONTADOR MENSALIDADE;-550,00',
    '12/11/2026;SABESP AGUA;-168,40',
    '12/11/2026;TED FORNECEDOR PAPEL ATACADO;-1.240,00',
    '13/11/2026;PADARIA CENTRAL;-41,80',
    '13/11/2026;RESGATE INVESTIMENTO;800,00',
    '14/11/2026;TRANSFERENCIA SUSPEITA XYZ;-520,00',
    '14/11/2026;VIVO FIBRA EMPRESA;-299,90'
  ].join('\n');

  var LIMITE_BYTES = 2 * 1024 * 1024;
  var estado = { txs: [], nome: '', filtro: 'todas', ultimoFoco: null };

  var $ = function (id) { return document.getElementById(id); };
  var fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var fmtPct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

  function limpar(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function sinal(v) {
    var s = fmtMoeda.format(Math.abs(v));
    return (v < 0 ? '−' : (v > 0 ? '+' : '')) + s;
  }

  function isReceita(cat) { return RECEITAS.indexOf(cat) !== -1; }

  function categoriaAuto(desc, valor) {
    var d = norm(desc);
    for (var i = 0; i < REGRAS_AUTO.length; i++) {
      if (d.indexOf(REGRAS_AUTO[i][0]) !== -1) {
        var cat = REGRAS_AUTO[i][1];
        // Regra de receita só vale para entrada, e de despesa só para saída.
        if ((valor > 0) === isReceita(cat)) return cat;
      }
    }
    return null;
  }

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
      if (ch === '"') { aspas = !aspas; }
      else if (ch === sep && !aspas) { out.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    out.push(cur.trim());
    return out;
  }

  function dataISO(s) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : null;
  }

  function lerCSV(texto) {
    var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    var resultado = { txs: [], ignoradas: 0 };
    if (!linhas.length) return resultado;

    var sep = linhas[0].split(';').length >= linhas[0].split(',').length ? ';' : ',';
    var cab = splitLinha(linhas[0], sep).map(norm);
    var idx = { data: 0, desc: 1, valor: 2 };
    var inicio = 0;
    var achouCab = cab.some(function (c) { return c.indexOf('DATA') !== -1; }) &&
                   cab.some(function (c) { return c.indexOf('VALOR') !== -1; });
    if (achouCab) {
      inicio = 1;
      cab.forEach(function (c, i) {
        if (c.indexOf('DATA') !== -1) idx.data = i;
        else if (c.indexOf('DESCRI') !== -1 || c.indexOf('HISTOR') !== -1) idx.desc = i;
        else if (c.indexOf('VALOR') !== -1) idx.valor = i;
      });
    }

    for (var r = inicio; r < linhas.length; r++) {
      var c = splitLinha(linhas[r], sep);
      var data = c[idx.data] || '';
      var iso = dataISO(data);
      var valor = parseValor(c[idx.valor]);
      if (!iso || !isFinite(valor) || valor === 0) { resultado.ignoradas++; continue; }
      var desc = c[idx.desc] || 'Sem descrição';
      var cat = categoriaAuto(desc, valor);
      resultado.txs.push({
        id: 't' + r,
        data: data,
        iso: iso,
        desc: desc,
        valor: valor,
        cat: cat,
        origem: cat ? 'regra' : null
      });
    }
    resultado.txs.sort(function (a, b) { return a.iso < b.iso ? -1 : (a.iso > b.iso ? 1 : 0); });
    return resultado;
  }

  // ---------- Estado da tela ----------

  function setStatus(msg, tipo) {
    var s = $('status');
    s.textContent = msg;
    s.className = 'status' + (tipo ? ' ' + tipo : '');
  }

  function carregarTexto(texto, nome) {
    var r = lerCSV(texto);
    if (!r.txs.length) {
      setStatus('Não encontramos linhas válidas. Confira se o arquivo tem as colunas Data, Descrição e Valor, com datas DD/MM/AAAA.', 'erro');
      return;
    }
    estado.txs = r.txs;
    estado.nome = nome;
    estado.filtro = 'todas';
    setFiltroPressionado();
    var sem = r.txs.filter(function (t) { return !t.cat; }).length;
    var msg = r.txs.length + ' transações importadas. ' +
      (sem ? sem + ' precisam de categoria.' : 'Todas foram categorizadas.');
    if (r.ignoradas) msg += ' ' + r.ignoradas + ' linhas foram ignoradas por data ou valor inválidos.';
    setStatus(msg, 'ok');
    renderTudo();
    $('vazio').hidden = true;
    $('painel').hidden = false;
  }

  function carregarArquivo(file) {
    if (!file) return;
    if (file.size > LIMITE_BYTES) {
      setStatus('Arquivo muito grande para a demonstração (limite de 2 MB). Exporte um período menor do extrato.', 'erro');
      return;
    }
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setStatus('Esta demonstração aceita apenas CSV. Exporte o extrato do banco como CSV ou planilha.', 'erro');
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function () { carregarTexto(String(leitor.result || ''), file.name); };
    leitor.onerror = function () { setStatus('Não foi possível ler o arquivo. Tente exportar de novo.', 'erro'); };
    leitor.readAsText(file, 'utf-8');
  }

  function periodoTexto() {
    if (!estado.txs.length) return '';
    var primeira = estado.txs[0].data;
    var ultima = estado.txs[estado.txs.length - 1].data;
    return 'Período ' + (primeira === ultima ? primeira : primeira + ' a ' + ultima) +
      (estado.nome ? ' · ' + estado.nome : '');
  }

  function renderTudo() {
    $('periodo').textContent = periodoTexto();
    renderKPIs();
    renderDestinos();
    renderTabela();
    atualizarPrevia();
    if (estado.ultimoFoco) {
      var alvo = document.getElementById(estado.ultimoFoco);
      if (alvo) alvo.focus();
      estado.ultimoFoco = null;
    }
  }

  function renderKPIs() {
    var entradas = 0, saidas = 0, sem = 0;
    estado.txs.forEach(function (t) {
      if (t.valor > 0) entradas += t.valor; else saidas += -t.valor;
      if (!t.cat) sem++;
    });
    var saldo = entradas - saidas;
    var n = estado.txs.length;

    function kpi(rot, valorTxt, cls, detalhe) {
      return el('article', { cls: 'kpi' }, [
        el('p', { cls: 'kpi-rot', texto: rot }),
        el('p', { cls: 'kpi-valor ' + (cls || ''), texto: valorTxt }),
        el('p', { cls: 'kpi-detalhe', texto: detalhe })
      ]);
    }

    var box = $('kpis');
    limpar(box);
    box.appendChild(kpi('Entradas', fmtMoeda.format(entradas), 'receita', n + ' transações no período'));
    box.appendChild(kpi('Saídas', fmtMoeda.format(saidas), 'despesa', 'Total pago no período'));
    box.appendChild(kpi('Saldo do período', (saldo < 0 ? '−' : '') + fmtMoeda.format(Math.abs(saldo)), saldo < 0 ? 'despesa' : 'receita', 'Entradas menos saídas'));
    box.appendChild(kpi('Sem categoria', String(sem), '', sem ? 'Categorize para ver o quadro completo' : 'Tudo categorizado'));
  }

  function renderDestinos() {
    var gastos = estado.txs.filter(function (t) { return t.valor < 0; });
    var total = 0;
    var porCat = {};
    gastos.forEach(function (t) {
      var chave = t.cat || '__sem__';
      porCat[chave] = (porCat[chave] || 0) + (-t.valor);
      total += -t.valor;
    });
    var itens = Object.keys(porCat).map(function (k) { return { nome: k === '__sem__' ? 'Sem categoria' : k, valor: porCat[k], sem: k === '__sem__' }; });
    itens.sort(function (a, b) { return b.valor - a.valor; });

    var destaque = $('destaque');
    limpar(destaque);
    var lista = $('barras');
    limpar(lista);

    if (!total) {
      destaque.textContent = 'Nenhuma saída neste extrato.';
      return;
    }

    var topo = itens.filter(function (i) { return !i.sem; })[0];
    if (topo) {
      destaque.appendChild(document.createTextNode('Maior destino: '));
      destaque.appendChild(el('strong', { texto: topo.nome + ' (' + fmtPct.format(topo.valor / total) + ' das saídas)' }));
      destaque.appendChild(document.createTextNode('.'));
    } else {
      destaque.textContent = 'Nenhuma saída categorizada ainda.';
    }

    itens.forEach(function (i) {
      var pct = i.valor / total;
      var preench = el('span', { cls: 'barra-preenchimento' });
      preench.style.width = (pct * 100).toFixed(1) + '%';
      lista.appendChild(el('li', { cls: 'barra-item' + (i.sem ? ' sem' : '') }, [
        el('div', { cls: 'barra-topo' }, [
          el('span', { cls: 'barra-nome', texto: i.nome }),
          el('span', { cls: 'barra-valor', texto: fmtMoeda.format(i.valor) + ' · ' + fmtPct.format(pct) })
        ]),
        el('div', { cls: 'barra-trilho', attrs: { 'aria-hidden': 'true' } }, [preench])
      ]));
    });
  }

  function opcoesCategoria(comSemCategoria) {
    var frag = document.createDocumentFragment();
    if (comSemCategoria) frag.appendChild(el('option', { attrs: { value: '' }, texto: 'Sem categoria' }));
    CATEGORIAS.forEach(function (g) {
      var og = el('optgroup', { attrs: { label: g.grupo } });
      g.itens.forEach(function (c) { og.appendChild(el('option', { attrs: { value: c }, texto: c })); });
      frag.appendChild(og);
    });
    return frag;
  }

  function filtrar() {
    return estado.txs.filter(function (t) {
      if (estado.filtro === 'sem') return !t.cat;
      if (estado.filtro === 'entradas') return t.valor > 0;
      if (estado.filtro === 'saidas') return t.valor < 0;
      return true;
    });
  }

  function badgeOrigem(t) {
    if (!t.cat) return el('span', { cls: 'badge pendente', texto: 'Pendente' });
    if (t.origem === 'manual') return el('span', { cls: 'badge manual', texto: 'Manual' });
    return el('span', { cls: 'badge regra', texto: 'Regra' });
  }

  function renderTabela() {
    var corpo = $('corpo');
    limpar(corpo);
    var lista = filtrar();
    $('contagem').textContent = lista.length + (lista.length === 1 ? ' transação exibida' : ' transações exibidas');

    if (!lista.length) {
      corpo.appendChild(el('tr', {}, [el('td', { attrs: { colspan: '5' }, texto: 'Nenhuma transação neste filtro.' })]));
      return;
    }

    lista.forEach(function (t) {
      var sel = el('select', {
        attrs: { id: 'cat-' + t.id, 'aria-label': 'Categoria de ' + t.desc + ' em ' + t.data },
        on: { change: function (ev) { mudarCategoria(t.id, ev.target.value); } }
      }, [opcoesCategoria(true)]);
      sel.value = t.cat || '';

      corpo.appendChild(el('tr', { cls: t.cat ? '' : 'pendente' }, [
        el('td', { cls: 'c-data', texto: t.data }),
        el('td', { cls: 'c-desc', texto: t.desc }),
        el('td', { cls: 'c-cat' }, [sel]),
        el('td', { cls: 'num ' + (t.valor > 0 ? 'receita' : 'despesa'), texto: sinal(t.valor) }),
        el('td', { cls: 'c-orig' }, [badgeOrigem(t)])
      ]));
    });
  }

  function mudarCategoria(id, valor) {
    var t = estado.txs.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    t.cat = valor || null;
    t.origem = t.cat ? 'manual' : null;
    estado.ultimoFoco = 'cat-' + id;
    renderTudo();
  }

  function setFiltroPressionado() {
    document.querySelectorAll('#filtros .chip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filtro') === estado.filtro ? 'true' : 'false');
    });
  }

  // ---------- Regras ----------

  function casamentosRegra() {
    var k = norm($('regra-texto').value);
    if (k.length < 3) return { k: k, lista: [] };
    var cat = $('regra-cat').value;
    var receita = isReceita(cat);
    var lista = estado.txs.filter(function (t) {
      return norm(t.desc).indexOf(k) !== -1 && ((t.valor > 0) === receita);
    });
    return { k: k, lista: lista };
  }

  function atualizarPrevia() {
    var previa = $('regra-previa');
    var botao = $('regra-aplicar');
    if (!estado.txs.length) { botao.disabled = true; return; }
    var r = casamentosRegra();
    if (r.k.length < 3) {
      previa.textContent = 'Digite pelo menos 3 letras.';
      botao.disabled = true;
      return;
    }
    limpar(previa);
    var n = r.lista.length;
    previa.appendChild(document.createTextNode('Aplicaria a '));
    previa.appendChild(el('strong', { texto: n + (n === 1 ? ' transação' : ' transações') }));
    previa.appendChild(document.createTextNode(n ? '.' : '. Ajuste o texto ou a categoria.'));
    botao.disabled = n === 0;
  }

  function aplicarRegra(ev) {
    ev.preventDefault();
    var r = casamentosRegra();
    if (!r.lista.length) return;
    var cat = $('regra-cat').value;
    var mudadas = 0;
    r.lista.forEach(function (t) {
      if (t.origem === 'manual') return;
      t.cat = cat;
      t.origem = 'regra';
      mudadas++;
    });
    var pulados = r.lista.length - mudadas;
    var msg = 'Regra aplicada a ' + mudadas + (mudadas === 1 ? ' transação' : ' transações') + ' com categoria ' + cat + '.';
    if (pulados) msg += ' ' + pulados + ' já tinham categoria manual e foram mantidas.';
    setStatus(msg, 'ok');
    renderTudo();
  }

  // ---------- Eventos ----------

  function ligar() {
    var popular = $('regra-cat');
    limpar(popular);
    popular.appendChild(opcoesCategoria(false));
    popular.value = 'Fornecedores';

    $('btn-exemplo').addEventListener('click', function () { carregarTexto(EXEMPLO, 'extrato de exemplo'); });
    $('btn-abrir-arquivo').addEventListener('click', function () { $('arquivo').click(); });
    $('btn-selecionar').addEventListener('click', function () { $('arquivo').click(); });
    $('arquivo').addEventListener('change', function (ev) { carregarArquivo(ev.target.files[0]); ev.target.value = ''; });

    var dz = $('dropzone');
    ['dragenter', 'dragover'].forEach(function (evt) {
      dz.addEventListener(evt, function (ev) { ev.preventDefault(); dz.classList.add('ativa'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      dz.addEventListener(evt, function (ev) { ev.preventDefault(); dz.classList.remove('ativa'); });
    });
    dz.addEventListener('drop', function (ev) {
      var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      carregarArquivo(f);
    });

    $('filtros').addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip');
      if (!b) return;
      estado.filtro = b.getAttribute('data-filtro');
      setFiltroPressionado();
      renderTabela();
    });

    $('regra-texto').addEventListener('input', atualizarPrevia);
    $('regra-cat').addEventListener('change', atualizarPrevia);
    $('form-regra').addEventListener('submit', aplicarRegra);
  }

  ligar();
})();
