/* Painel de Vendas e Metas · demonstração da Solution Innova Digital.
   Todos os números são fictícios. Nada é enviado nem lido de planilhas reais.
   Sem dependências externas. Sem scripts inline (CSP do site). */
(function () {
  'use strict';

  /* ---------- Dados de exemplo ---------- */

  var DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  var DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  var DATAS = [9, 10, 11, 12, 13, 14, 15]; // semana 46 de 2026: segunda 9 a domingo 15
  var HOJE = 5; // índice de sábado (dia de referência da demonstração)
  var META_CONVERSAO = 0.25;

  // Agendamentos e confirmações da rede inteira, por dia da semana
  var AGEND_BASE = [118, 104, 131, 142, 176, 92, 44];
  var CONF_BASE = [92, 84, 106, 116, 142, 75, 34];

  var LOJAS = {
    sp: {
      nome: 'SP · Jardins', meta: 90000,
      atual: [11200, 9400, 12800, 14100, 17900, 10300, 3600],
      ant:   [9800, 9100, 10200, 11800, 13200, 9700, 3900],
      vendas: 232, vendasAnt: 205, leads: 980, leadsAnt: 940
    },
    rj: {
      nome: 'RJ · Ipanema', meta: 75000,
      atual: [8600, 7200, 9900, 11400, 13800, 8100, 2900],
      ant:   [7900, 7600, 8300, 9000, 11200, 7400, 3100],
      vendas: 181, vendasAnt: 170, leads: 820, leadsAnt: 800
    },
    mg: {
      nome: 'MG · Savassi', meta: 60000,
      atual: [6100, 5300, 6900, 7800, 9400, 5600, 2300],
      ant:   [5800, 5100, 6200, 6600, 7900, 5000, 2000],
      vendas: 127, vendasAnt: 118, leads: 610, leadsAnt: 590
    },
    rs: {
      nome: 'RS · Moinhos', meta: 45000,
      atual: [5200, 4700, 5900, 6700, 8200, 4800, 1900],
      ant:   [4700, 4300, 5100, 5600, 6900, 4400, 1700],
      vendas: 109, vendasAnt: 102, leads: 540, leadsAnt: 520
    }
  };
  var ORDEM_LOJAS = ['sp', 'rj', 'mg', 'rs'];

  var VENDEDORES = [
    { nome: 'Ana Silva', loja: 'sp', valor: 48500, vendas: 12 },
    { nome: 'Carlos Mendes', loja: 'rj', valor: 36200, vendas: 9 },
    { nome: 'Julia Costa', loja: 'mg', valor: 31800, vendas: 8 },
    { nome: 'Rafael Lima', loja: 'rs', valor: 28900, vendas: 7 },
    { nome: 'Patrícia Ferreira', loja: 'sp', valor: 22400, vendas: 6 },
    { nome: 'Bruno Tavares', loja: 'rj', valor: 19700, vendas: 5 },
    { nome: 'Larissa Nunes', loja: 'mg', valor: 15600, vendas: 4 },
    { nome: 'Tiago Rocha', loja: 'rs', valor: 12300, vendas: 3 }
  ];

  var PERIODOS = {
    hoje: {
      fat: 'Faturamento do dia', meta: 'Meta do dia',
      ant: 'mesmo dia da semana anterior', sub: 'Sábado, 14 de novembro'
    },
    semana: {
      fat: 'Faturamento da semana', meta: 'Meta da semana',
      ant: 'semana anterior', sub: 'Semana 46 · 9 a 15 de novembro'
    },
    mes: {
      fat: 'Faturamento do mês', meta: 'Meta do mês',
      ant: 'mês anterior', sub: 'Novembro de 2026 · semanas 45 a 48'
    }
  };

  var ICONES = {
    danger: '<svg class="alerta-icone icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/></svg>',
    warning: '<svg class="alerta-icone icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    info: '<svg class="alerta-icone icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    success: '<svg class="alerta-icone icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>'
  };

  /* ---------- Formatação ---------- */

  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var percento1 = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
  var percento0 = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
  var decimal1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  function sinal(n, texto) { return (n >= 0 ? '+' : '−') + texto; }
  function fmtDelta(x) { return sinal(x, percento1.format(Math.abs(x))); }
  function fmtPP(x) { return sinal(x, decimal1.format(Math.abs(x)) + ' pp'); }
  function fmtMil(v) { return v >= 1000 ? 'R$ ' + decimal1.format(v / 1000).replace(',0', '') + ' mil' : 'R$ ' + v; }
  function classeDelta(x) { return x > 0.0005 ? 'up' : x < -0.0005 ? 'down' : 'flat'; }
  function somaDias(arr) { return arr.reduce(function (a, b) { return a + b; }, 0); }

  /* ---------- Estado ---------- */

  var estado = { loja: 'todas', periodo: 'semana' };

  function chavesSelecionadas() {
    return estado.loja === 'todas' ? ORDEM_LOJAS.slice() : [estado.loja];
  }

  // Calcula os totais do recorte (lojas e período escolhidos)
  function escopo(periodo, chaves) {
    var t = { fat: 0, fatAnt: 0, meta: 0, vendas: 0, vendasAnt: 0, leads: 0, leadsAnt: 0, semanaFat: 0 };
    chaves.forEach(function (k) {
      var L = LOJAS[k];
      var somaA = somaDias(L.atual);
      var somaP = somaDias(L.ant);
      var r = 1, rp = 1, meta = L.meta, a = somaA, p = somaP;
      if (periodo === 'hoje') {
        a = L.atual[HOJE]; p = L.ant[HOJE];
        r = a / somaA; rp = p / somaP; meta = L.meta / 7;
      } else if (periodo === 'mes') {
        a = somaA * 4; p = somaP * 4; r = 4; rp = 4; meta = L.meta * 4;
      }
      t.fat += a; t.fatAnt += p; t.meta += meta;
      t.vendas += L.vendas * r; t.vendasAnt += L.vendasAnt * rp;
      t.leads += L.leads * r; t.leadsAnt += L.leadsAnt * rp;
      t.semanaFat += somaA;
    });
    t.vendas = Math.round(t.vendas); t.vendasAnt = Math.round(t.vendasAnt);
    t.leads = Math.round(t.leads); t.leadsAnt = Math.round(t.leadsAnt);
    return t;
  }

  /* ---------- Elementos ---------- */

  var el = {
    loja: document.getElementById('filtro-loja'),
    seg: document.querySelectorAll('.seg'),
    data: document.getElementById('data-atual'),
    grafico: document.getElementById('grafico-semana'),
    alertas: document.getElementById('alertas'),
    bullets: document.getElementById('bullets'),
    funil: document.getElementById('funil'),
    funilSub: document.getElementById('funil-sub'),
    ranking: document.getElementById('ranking'),
    tabela: document.getElementById('tabela-dias'),
    avisos: document.getElementById('avisos'),
    sincronizar: document.getElementById('btn-sincronizar'),
    kFat: document.getElementById('kpi-fat'),
    kTicket: document.getElementById('kpi-ticket'),
    kConv: document.getElementById('kpi-conv'),
    kMeta: document.getElementById('kpi-meta')
  };

  function setKpi(card, valor, delta, deltaClasse) {
    card.querySelector('[data-valor]').textContent = valor;
    var d = card.querySelector('[data-delta]');
    d.textContent = delta;
    d.className = 'kpi-delta' + (deltaClasse ? ' ' + deltaClasse : '');
  }

  /* ---------- KPIs ---------- */

  function renderKpis(t) {
    var p = PERIODOS[estado.periodo];
    var ticket = t.fat / Math.max(t.vendas, 1);
    var ticketAnt = t.fatAnt / Math.max(t.vendasAnt, 1);
    var conv = t.vendas / Math.max(t.leads, 1);
    var convAnt = t.vendasAnt / Math.max(t.leadsAnt, 1);
    var dFat = t.fat / Math.max(t.fatAnt, 1) - 1;
    var dTicket = ticket / Math.max(ticketAnt, 1) - 1;
    var dConv = (conv - convAnt) * 100;
    var pct = t.fat / Math.max(t.meta, 1);

    el.kFat.querySelector('.kpi-rotulo').textContent = p.fat;
    setKpi(el.kFat, moeda.format(t.fat), sinal(dFat, percento1.format(Math.abs(dFat))) + ' vs ' + p.ant, classeDelta(dFat));
    setKpi(el.kTicket, moeda.format(ticket), sinal(dTicket, percento1.format(Math.abs(dTicket))) + ' vs ' + p.ant, classeDelta(dTicket));
    setKpi(el.kConv, percento1.format(conv), fmtPP(dConv) + ' vs ' + p.ant, classeDelta(dConv));

    el.kMeta.querySelector('.kpi-rotulo').textContent = p.meta;
    var restante = Math.max(t.meta - t.fat, 0);
    setKpi(el.kMeta, percento0.format(pct),
      pct >= 1 ? 'Meta atingida' : 'Faltam ' + moeda.format(restante) + ' para 100%',
      pct >= 1 ? 'up' : 'flat');
    var barra = el.kMeta.querySelector('.barra-meta');
    barra.setAttribute('aria-valuenow', String(Math.min(Math.round(pct * 100), 100)));
    el.kMeta.querySelector('[data-preench]').style.width = Math.min(pct, 1) * 100 + '%';

    return { pct: pct, conv: conv };
  }

  /* ---------- Gráfico semanal (SVG gerado por JS) ---------- */

  function renderGrafico(chaves) {
    var atual = [], ant = [], i, k;
    for (i = 0; i < 7; i++) {
      atual[i] = 0; ant[i] = 0;
      chaves.forEach(function (c) { atual[i] += LOJAS[c].atual[i]; ant[i] += LOJAS[c].ant[i]; });
    }
    var max = Math.max.apply(null, atual.concat(ant));
    var passo = Math.pow(10, Math.floor(Math.log10(max))) / 2;
    var topo = Math.ceil(max * 1.08 / passo) * passo;

    var W = 720, H = 300, pl = 72, pr = 16, pt = 24, pb = 36;
    var iw = W - pl - pr, ih = H - pt - pb;
    function x(i) { return pl + i * (iw / 6); }
    function y(v) { return pt + ih * (1 - v / topo); }

    var grades = '';
    for (k = 0; k <= 4; k++) {
      var v = topo * k / 4, yy = y(v).toFixed(1);
      grades += '<line class="' + (k === 0 ? 'eixo' : 'grade-h') + '" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/>';
      grades += '<text x="' + (pl - 10) + '" y="' + (+yy + 4) + '" text-anchor="end">' + fmtMil(Math.round(v)) + '</text>';
    }

    var pontosA = [], pontosP = [], rotulos = '';
    for (i = 0; i < 7; i++) {
      pontosA.push(x(i).toFixed(1) + ',' + y(atual[i]).toFixed(1));
      pontosP.push(x(i).toFixed(1) + ',' + y(ant[i]).toFixed(1));
      rotulos += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle"' +
        (i === HOJE ? ' style="fill:var(--roxo);font-weight:800"' : '') + '>' + DIAS_CURTOS[i] + ' ' + DATAS[i] + '</text>';
    }
    var areaFechada = 'M' + pontosA[0] + ' L' + pontosA.slice(1).join(' L') +
      ' L' + x(6).toFixed(1) + ',' + y(0).toFixed(1) + ' L' + x(0).toFixed(1) + ',' + y(0).toFixed(1) + ' Z';

    var pico = atual.indexOf(Math.max.apply(null, atual));
    var marcas = '';
    for (i = 0; i < 7; i++) {
      marcas += '<circle class="ponto-atual" cx="' + x(i).toFixed(1) + '" cy="' + y(atual[i]).toFixed(1) + '" r="' + (i === HOJE ? 6 : 4) + '"/>';
    }
    var textoPico = '<text class="rot-valor" x="' + x(pico).toFixed(1) + '" y="' + (y(atual[pico]) - 14).toFixed(1) + '" text-anchor="middle">' + fmtMil(atual[pico]) + '</text>';

    var totalA = somaDias(atual), totalP = somaDias(ant);
    var resumo = 'Faturamento diário da semana: ' + moeda.format(totalA) + ' contra ' + moeda.format(totalP) + ' na semana anterior.';

    el.grafico.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + resumo + '">' +
      grades +
      '<path class="area-atual" d="' + areaFechada + '"/>' +
      '<polyline class="serie-anterior" points="' + pontosP.join(' ') + '"/>' +
      '<polyline class="serie-atual" points="' + pontosA.join(' ') + '"/>' +
      marcas + textoPico + rotulos +
      '</svg>';
  }

  /* ---------- Alertas ---------- */

  function renderAlertas(chaves, t, conv) {
    var lista = [];

    // Lojas abaixo da meta semanal (no consolidado, mostra cada uma)
    ORDEM_LOJAS.forEach(function (k) {
      if (chaves.indexOf(k) === -1) return;
      var L = LOJAS[k];
      var p = somaDias(L.atual) / L.meta;
      if (p < 0.75) {
        lista.push({
          tipo: p < 0.6 ? 'danger' : 'warning',
          titulo: 'Loja ' + L.nome + ' abaixo da meta',
          msg: 'Atingiu ' + percento0.format(p) + ' da meta semanal. Revise agendamentos e prospecção desta loja.'
        });
      }
    });

    // Conversão abaixo da meta de 25%
    if (conv < META_CONVERSAO) {
      var faltam = Math.max(Math.ceil(META_CONVERSAO * t.leads) - t.vendas, 0);
      lista.push({
        tipo: 'warning',
        titulo: 'Conversão abaixo da meta de 25%',
        msg: 'Conversão atual de ' + percento1.format(conv) + '. Faltam ' + inteiro.format(faltam) + ' vendas para atingir a meta do período.'
      });
    }

    // Projeção do ritmo (só faz sentido na visão semanal)
    if (estado.periodo === 'semana') {
      var seisDias = 0;
      chaves.forEach(function (k) {
        seisDias += somaDias(LOJAS[k].atual.slice(0, 6));
      });
      var projecao = seisDias * 7 / 6;
      var metaSemana = chaves.reduce(function (s, k) { return s + LOJAS[k].meta; }, 0);
      var pp = projecao / metaSemana;
      lista.push(pp >= 1
        ? { tipo: 'success', titulo: 'Ritmo projeta ' + percento0.format(pp) + ' da meta', msg: 'Mantido o ritmo dos seis primeiros dias, a semana fecha acima da meta.' }
        : { tipo: 'info', titulo: 'Ritmo projeta ' + percento0.format(pp) + ' da meta', msg: 'Mantido o ritmo atual, a semana fecha abaixo da meta. Vale acelerar as propostas em aberto.' });
    }

    // Planilha sem atualização (fonte de dados)
    if (chaves.indexOf('rs') !== -1) {
      lista.push({
        tipo: 'warning',
        titulo: 'Planilha RS · Moinhos sem atualização',
        msg: 'A última versão chegou há 2 dias. Use “Sincronizar agora” para atualizar os números.'
      });
    }

    if (!lista.length) {
      el.alertas.innerHTML = '<p class="vazio">Nenhum alerta neste recorte. Tudo dentro da meta.</p>';
      return;
    }
    el.alertas.innerHTML = lista.map(function (a) {
      return '<article class="alerta ' + a.tipo + '" role="note">' + ICONES[a.tipo] +
        '<strong>' + a.titulo + '</strong><p>' + a.msg + '</p></article>';
    }).join('');
  }

  /* ---------- Metas por loja ---------- */

  function renderBullets() {
    el.bullets.innerHTML = '';
    ORDEM_LOJAS.forEach(function (k) {
      var L = LOJAS[k];
      var t = escopo(estado.periodo, [k]);
      var pct = t.fat / t.meta;
      var li = document.createElement('li');
      li.className = 'bullet-item' + (estado.loja === k ? ' ativo' : '');
      li.innerHTML =
        '<div class="bullet-topo"><span class="bullet-nome">' + L.nome + '</span>' +
        '<span class="bullet-valor">' + percento0.format(pct) + '</span></div>' +
        '<div class="bullet-trilho" role="img" aria-label="' + L.nome + ': ' + percento0.format(pct) + ' da meta">' +
        '<span class="bullet-real' + (pct < 0.75 ? ' baixo' : '') + '"></span>' +
        '<span class="bullet-marca"></span></div>' +
        '<p class="bullet-meta"><strong>' + moeda.format(t.fat) + '</strong> de ' + moeda.format(t.meta) + ' · ' +
        (pct >= 1 ? 'meta atingida' : 'faltam ' + moeda.format(t.meta - t.fat)) + '</p>';
      el.bullets.appendChild(li);
      // Escala do trilho: 0 a 120% da meta; a marca fica em 100%
      li.querySelector('.bullet-real').style.width = (Math.min(pct, 1.2) / 1.2 * 100).toFixed(2) + '%';
      li.querySelector('.bullet-marca').style.left = (100 / 120 * 100).toFixed(2) + '%';
    });
  }

  /* ---------- Funil ---------- */

  function renderFunil(t) {
    var qual = Math.round(t.leads * 0.567);
    var prop = Math.round(t.leads * 0.321);
    var fech = t.vendas;
    var etapas = [
      { nome: 'Leads recebidos', v: t.leads, nota: 'Início do funil' },
      { nome: 'Qualificados', v: qual, nota: percento1.format(qual / t.leads) + ' dos leads' },
      { nome: 'Propostas enviadas', v: prop, nota: percento1.format(prop / qual) + ' dos qualificados' },
      { nome: 'Fechados', v: fech, nota: percento1.format(fech / prop) + ' das propostas' }
    ];
    el.funilSub.textContent = PERIODOS[estado.periodo].sub;
    el.funil.innerHTML = etapas.map(function (e, i) {
      var w = 0.06 + 0.22 * (e.v / t.leads);
      return '<li class="etapa" style="--i:' + i + ';--w:' + w.toFixed(3) + '">' +
        '<span class="etapa-nome">' + e.nome + '</span>' +
        '<span class="etapa-valor">' + inteiro.format(e.v) + '</span>' +
        '<span class="etapa-taxa">' + e.nota + '</span></li>';
    }).join('');
  }

  /* ---------- Ranking ---------- */

  function iniciais(nome) {
    return nome.split(' ').slice(0, 2).map(function (p) { return p.charAt(0); }).join('');
  }

  function renderRanking(chaves, t) {
    var fator = t.fat / Math.max(t.semanaFat, 1);
    var lista = VENDEDORES.filter(function (v) { return chaves.indexOf(v.loja) !== -1; })
      .map(function (v) { return { nome: v.nome, loja: v.loja, valor: v.valor * fator, vendas: Math.max(Math.round(v.vendas * fator), 1) }; })
      .sort(function (a, b) { return b.valor - a.valor; })
      .slice(0, 6);
    el.ranking.innerHTML = lista.map(function (v, i) {
      return '<li class="item-rank" style="--i:' + i + '">' +
        '<span class="posicao">' + (i + 1) + '</span>' +
        '<span class="avatar" aria-hidden="true">' + iniciais(v.nome) + '</span>' +
        '<span class="nome-bloco"><span class="nome">' + v.nome + '</span>' +
        '<span class="sub">' + LOJAS[v.loja].nome + ' · ' + inteiro.format(v.vendas) + ' vendas</span></span>' +
        '<span class="valor">' + moeda.format(v.valor) + '</span></li>';
    }).join('');
  }

  /* ---------- Tabela por dia (sempre a semana) ---------- */

  function renderTabela(chaves) {
    var linhas = '';
    var tot = { fat: 0, agend: 0, conf: 0 };
    for (var i = 0; i < 7; i++) {
      var fatD = 0, fatTodas = 0;
      chaves.forEach(function (k) { fatD += LOJAS[k].atual[i]; });
      ORDEM_LOJAS.forEach(function (k) { fatTodas += LOJAS[k].atual[i]; });
      var share = fatD / fatTodas;
      var agend = Math.round(AGEND_BASE[i] * share);
      var conf = Math.round(CONF_BASE[i] * share);
      var taxa = conf / agend;
      tot.fat += fatD; tot.agend += agend; tot.conf += conf;
      linhas += '<tr style="--i:' + i + '">' +
        '<th scope="row">' + DIAS[i] + ' (' + DATAS[i] + ')</th>' +
        '<td class="num">' + moeda.format(fatD) + '</td>' +
        '<td class="num">' + inteiro.format(agend) + '</td>' +
        '<td class="num">' + inteiro.format(conf) + '</td>' +
        '<td class="num"><span class="selo ' + (taxa >= 0.8 ? 'ok' : 'aten') + '">' + percento1.format(taxa) + '</span></td>' +
        '<td class="num">' + moeda.format(fatD / Math.max(conf, 1)) + '</td></tr>';
    }
    el.tabela.innerHTML = linhas;
    var tabela = el.tabela.parentNode;
    var antigo = tabela.querySelector('tfoot');
    if (antigo) antigo.remove();
    var pe = tabela.createTFoot();
    pe.innerHTML = '<tr><th scope="row">Total da semana</th>' +
      '<td class="num">' + moeda.format(tot.fat) + '</td>' +
      '<td class="num">' + inteiro.format(tot.agend) + '</td>' +
      '<td class="num">' + inteiro.format(tot.conf) + '</td>' +
      '<td class="num">' + percento1.format(tot.conf / Math.max(tot.agend, 1)) + '</td>' +
      '<td class="num">' + moeda.format(tot.fat / Math.max(tot.conf, 1)) + '</td></tr>';
  }

  /* ---------- Render geral ---------- */

  function render() {
    var chaves = chavesSelecionadas();
    var t = escopo(estado.periodo, chaves);
    var k = renderKpis(t);
    renderGrafico(chaves);
    renderAlertas(chaves, t, k.conv);
    renderBullets();
    renderFunil(t);
    renderRanking(chaves, t);
    renderTabela(chaves);
  }

  /* ---------- Avisos (toast) ---------- */

  function aviso(texto) {
    var item = document.createElement('div');
    item.className = 'aviso';
    item.textContent = texto;
    el.avisos.appendChild(item);
    setTimeout(function () { item.remove(); }, 4200);
  }

  /* ---------- Eventos ---------- */

  el.loja.addEventListener('change', function () {
    estado.loja = el.loja.value;
    render();
  });

  el.seg.forEach(function (botao) {
    botao.addEventListener('click', function () {
      estado.periodo = botao.getAttribute('data-periodo');
      el.seg.forEach(function (b) { b.setAttribute('aria-pressed', b === botao ? 'true' : 'false'); });
      render();
    });
  });

  el.sincronizar.addEventListener('click', function () {
    aviso('Demonstração: aqui o painel releria as planilhas. Nenhum dado real foi alterado.');
  });

  /* ---------- Início ---------- */

  var dataTexto = new Date(2026, 10, 14).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  el.data.textContent = dataTexto.charAt(0).toUpperCase() + dataTexto.slice(1);
  render();
})();
