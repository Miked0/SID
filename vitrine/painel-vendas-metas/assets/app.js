/* Painel de vendas e metas · demonstração da Solution Innova Digital.
   Negócio, pessoas e números são fictícios. Tudo roda no navegador:
   a planilha importada e as metas ficam só no localStorage deste navegador.
   Sem dependências externas e sem scripts inline (CSP do site). */
(function () {
  'use strict';

  var CHAVE = 'sid-vitrine-vendas-v2';
  var DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  var DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  var META_CONVERSAO = 0.25;
  var REF_EXEMPLO = '2026-11-14'; // sábado: último dia com dados do exemplo
  var REDUZIR = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Exemplo: Padaria Pão Quente (negócio fictício, 3 lojas)
  var LOJAS_EXEMPLO = [
    { id: 'centro', nome: 'Centro', meta: 5600, fator: 1.0, equipe: ['Ana Paula', 'Marcos Vieira', 'Juliana Reis'] },
    { id: 'bairro', nome: 'Bairro Alto', meta: 4600, fator: 0.78, equipe: ['Rafael Souza', 'Carla Mendes'] },
    { id: 'norte', nome: 'Shopping Norte', meta: 4200, fator: 0.66, equipe: ['Diego Alves', 'Patrícia Lima', 'Bruno Tavares'] }
  ];

  /* ---------- Utilidades de data (UTC, sem fuso) ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function addDias(iso, n) {
    var d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function diaSemana(iso) { return (new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7; } // 0 = segunda
  function inicioSemana(iso) { return addDias(iso, -diaSemana(iso)); }
  function inicioMes(iso) { return iso.slice(0, 8) + '01'; }
  function fimMes(iso) {
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7);
    return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  }
  function inicioMesAnterior(iso) {
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1;
    if (m === 0) { y--; m = 12; }
    return y + '-' + pad(m) + '-01';
  }
  function diasNoMes(iso) { return +fimMes(iso).slice(8, 10); }
  function fmtCurto(iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7); }
  function fmtLongo(iso) {
    var t = new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function slug(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loja';
  }

  /* ---------- Formatação ---------- */

  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var moeda2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var pct1 = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
  var pct0 = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
  var dec1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  function sinal(n, txt) { return (n >= 0 ? '+' : '−') + txt; }
  function fmtMil(v) { return v >= 1000 ? 'R$ ' + dec1.format(v / 1000).replace(',0', '') + ' mil' : 'R$ ' + Math.round(v); }
  function classeDelta(x) { return x > 0.0005 ? 'up' : x < -0.0005 ? 'down' : 'flat'; }

  /* ---------- Exemplo (dados gerados com semente fixa) ---------- */

  function prng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function gerarExemplo() {
    var rnd = prng(20261109);
    var rows = [];
    var semanas = [
      { ini: '2026-11-02', fator: 0.93 }, // semana anterior
      { ini: '2026-11-09', fator: 1.0 }    // semana atual
    ];
    semanas.forEach(function (sem) {
      LOJAS_EXEMPLO.forEach(function (loja) {
        for (var j = 0; j < 7; j++) {
          var data = addDias(sem.ini, j);
          var atend = Math.round((54 + rnd() * 26) * loja.fator * sem.fator);
          var vendas = Math.round(atend * (0.18 + rnd() * 0.08));
          for (var k = 0; k < atend; k++) {
            var venda = k < vendas;
            rows.push({
              d: data,
              loja: loja.id,
              vendedor: loja.equipe[Math.floor(rnd() * loja.equipe.length)],
              valor: venda ? Math.round((34 + rnd() * 22) * 100) / 100 : 0,
              venda: venda
            });
          }
        }
      });
    });
    return rows;
  }

  /* ---------- Persistência (try/catch: pode falhar em aba privada) ---------- */

  function lerSalvo() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || null; } catch (e) { return null; }
  }
  function gravar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({
        origem: estado.origem,
        rows: estado.origem === 'importado' ? estado.rows : [],
        lojas: estado.origem === 'importado' ? estado.lojas : null,
        metas: estado.metas,
        tema: estado.tema,
        loja: estado.loja,
        periodo: estado.periodo
      }));
    } catch (e) { /* sem persistência: a página segue funcionando */ }
  }

  /* ---------- Estado ---------- */

  var estado = {
    origem: 'exemplo',
    rows: [],
    lojas: LOJAS_EXEMPLO.map(function (l) { return { id: l.id, nome: l.nome }; }),
    metas: {},
    tema: 'default',
    loja: 'todas',
    periodo: 'semana'
  };

  function carregarEstado() {
    LOJAS_EXEMPLO.forEach(function (l) { estado.metas[l.id] = l.meta; });
    var salvo = lerSalvo();
    if (!salvo) { estado.rows = gerarExemplo(); return; }
    estado.origem = salvo.origem === 'importado' && salvo.rows && salvo.rows.length ? 'importado' : 'exemplo';
    if (estado.origem === 'importado') {
      estado.rows = salvo.rows;
      estado.lojas = salvo.lojas || [];
    } else {
      estado.rows = gerarExemplo();
    }
    Object.keys(salvo.metas || {}).forEach(function (k) { estado.metas[k] = salvo.metas[k]; });
    estado.tema = salvo.tema === 'light-noir' ? 'light-noir' : 'default';
    estado.loja = salvo.loja || 'todas';
    estado.periodo = ['hoje', 'semana', 'mes'].indexOf(salvo.periodo) !== -1 ? salvo.periodo : 'semana';
  }

  /* ---------- Cálculos ---------- */

  function referencia() {
    if (estado.origem === 'exemplo') return REF_EXEMPLO;
    var max = '';
    estado.rows.forEach(function (r) { if (r.d > max) max = r.d; });
    return max || REF_EXEMPLO;
  }

  function periodoDe(ref) {
    var p = estado.periodo;
    if (p === 'hoje') {
      return { atual: [ref, ref], ant: [addDias(ref, -7), addDias(ref, -7)], fator: 1 / 7, sub: fmtLongo(ref), ant_txt: 'mesmo dia da semana anterior', fat: 'Faturamento do dia', meta: 'Meta do dia' };
    }
    if (p === 'mes') {
      var ini = inicioMes(ref);
      return { atual: [ini, fimMes(ref)], ant: [inicioMesAnterior(ref), addDias(ini, -1)], fator: diasNoMes(ref) / 7, sub: 'Mês de ' + ref.slice(5, 7) + '/' + ref.slice(0, 4), ant_txt: 'mês anterior', fat: 'Faturamento do mês', meta: 'Meta do mês' };
    }
    var ws = inicioSemana(ref);
    return { atual: [ws, addDias(ws, 6)], ant: [addDias(ws, -7), addDias(ws, -1)], fator: 1, sub: 'Semana de ' + fmtCurto(ws) + ' a ' + fmtCurto(addDias(ws, 6)), ant_txt: 'semana anterior', fat: 'Faturamento da semana', meta: 'Meta da semana' };
  }

  function lojasSelecionadas() {
    var ids = estado.lojas.map(function (l) { return l.id; });
    return estado.loja === 'todas' ? ids : [estado.loja];
  }

  function noRecorte(r, ini, fim, lojas) {
    return r.d >= ini && r.d <= fim && lojas.indexOf(r.loja) !== -1;
  }

  function agregar(rs) {
    var fat = 0, vendas = 0;
    rs.forEach(function (r) { if (r.venda) { fat += r.valor; vendas++; } });
    var atend = rs.length;
    return { fat: fat, vendas: vendas, atend: atend, ticket: vendas ? fat / vendas : 0, conv: atend ? vendas / atend : 0 };
  }

  function nomeLoja(id) {
    var l = estado.lojas.filter(function (x) { return x.id === id; })[0];
    return l ? l.nome : id;
  }

  function metaDe(id) { return +estado.metas[id] || 0; }

  // Dados do recorte escolhido (período + loja)
  function calcular() {
    var ref = referencia();
    var P = periodoDe(ref);
    var lojas = lojasSelecionadas();
    var atualRows = estado.rows.filter(function (r) { return noRecorte(r, P.atual[0], P.atual[1], lojas); });
    var antRows = estado.rows.filter(function (r) { return noRecorte(r, P.ant[0], P.ant[1], lojas); });
    var meta = lojas.reduce(function (s, id) { return s + metaDe(id); }, 0) * P.fator;
    return { ref: ref, P: P, lojas: lojas, atualRows: atualRows, A: agregar(atualRows), B: agregar(antRows), meta: meta };
  }

  function semanaDo(ref) {
    var ws = inicioSemana(ref);
    var dias = [], ant = [];
    for (var i = 0; i < 7; i++) {
      dias.push(addDias(ws, i));
      ant.push(addDias(ws, i - 7));
    }
    return { dias: dias, ant: ant };
  }

  function faturamentoDia(data, lojas) {
    var t = 0;
    estado.rows.forEach(function (r) { if (r.d === data && r.venda && lojas.indexOf(r.loja) !== -1) t += r.valor; });
    return t;
  }

  function atendimentosDia(data, lojas) {
    var n = 0, v = 0;
    estado.rows.forEach(function (r) {
      if (r.d === data && lojas.indexOf(r.loja) !== -1) { n++; if (r.venda) v++; }
    });
    return { atend: n, vendas: v };
  }

  /* ---------- Elementos ---------- */

  var el = {
    loja: document.getElementById('filtro-loja'),
    seg: document.querySelectorAll('.seg'),
    tema: document.getElementById('btn-tema'),
    data: document.getElementById('data-atual'),
    fonte: document.getElementById('fonte-texto'),
    btnImportar: document.getElementById('btn-importar'),
    importar: document.getElementById('importar'),
    btnExemplo: document.getElementById('btn-exemplo'),
    btnCsv: document.getElementById('btn-csv'),
    btnPdf: document.getElementById('btn-pdf'),
    grafico: document.getElementById('grafico-semana'),
    subGrafico: document.getElementById('sub-grafico'),
    alertas: document.getElementById('alertas'),
    bullets: document.getElementById('bullets'),
    funil: document.getElementById('funil'),
    funilSub: document.getElementById('funil-sub'),
    ranking: document.getElementById('ranking'),
    tabela: document.getElementById('tabela-dias'),
    metasLista: document.getElementById('metas-lista'),
    vazio: document.getElementById('vazio-geral'),
    grade: document.getElementById('grade'),
    avisos: document.getElementById('avisos'),
    kFat: document.getElementById('kpi-fat'),
    kTicket: document.getElementById('kpi-ticket'),
    kConv: document.getElementById('kpi-conv'),
    kMeta: document.getElementById('kpi-meta')
  };

  /* ---------- Avisos ---------- */

  function aviso(texto, tipo) {
    var item = document.createElement('div');
    item.className = 'aviso' + (tipo ? ' ' + tipo : '');
    item.textContent = texto;
    el.avisos.appendChild(item);
    setTimeout(function () { item.classList.add('saindo'); }, 3600);
    setTimeout(function () { item.remove(); }, 4100);
  }

  /* ---------- Animação de números ---------- */

  function animarValor(elValor, alvo, formatar) {
    var ini = typeof elValor._v === 'number' ? elValor._v : 0;
    elValor._v = alvo;
    if (REDUZIR || ini === alvo || !isFinite(alvo)) { elValor.textContent = formatar(alvo); return; }
    var t0 = null, dur = 650;
    function passo(t) {
      if (t0 === null) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 3);
      elValor.textContent = formatar(ini + (alvo - ini) * e);
      if (k < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function setKpi(card, alvo, formatar, delta, classe) {
    animarValor(card.querySelector('[data-valor]'), alvo, formatar);
    var d = card.querySelector('[data-delta]');
    d.textContent = delta;
    d.className = 'kpi-delta' + (classe ? ' ' + classe : '');
  }

  /* ---------- KPIs ---------- */

  function renderKpis(c) {
    var A = c.A, B = c.B, P = c.P;
    var dFat = B.fat ? A.fat / B.fat - 1 : 0;
    var dTicket = B.ticket ? A.ticket / B.ticket - 1 : 0;
    var dConv = (A.conv - B.conv) * 100;
    var pct = c.meta ? A.fat / c.meta : 0;

    el.kFat.querySelector('.kpi-rotulo').textContent = P.fat;
    setKpi(el.kFat, A.fat, moeda.format, sinal(dFat, pct1.format(Math.abs(dFat))) + ' vs ' + P.ant_txt, classeDelta(dFat));
    setKpi(el.kTicket, A.ticket, moeda.format, sinal(dTicket, pct1.format(Math.abs(dTicket))) + ' vs ' + P.ant_txt, classeDelta(dTicket));
    setKpi(el.kConv, A.conv * 100, function (v) { return dec1.format(v) + '%'; }, sinal(dConv, dec1.format(Math.abs(dConv)) + ' pp') + ' vs ' + P.ant_txt, classeDelta(dConv));

    el.kMeta.querySelector('.kpi-rotulo').textContent = P.meta;
    var falta = Math.max(c.meta - A.fat, 0);
    setKpi(el.kMeta, pct * 100, function (v) { return pct0.format(v / 100); },
      pct >= 1 ? 'Meta atingida' : 'Faltam ' + moeda.format(falta) + ' para 100%', pct >= 1 ? 'up' : 'flat');
    el.kMeta.querySelector('.barra-meta').setAttribute('aria-valuenow', String(Math.min(Math.round(pct * 100), 100)));
    el.kMeta.querySelector('[data-preench]').style.width = Math.min(pct, 1) * 100 + '%';
  }

  /* ---------- Gráfico semanal (SVG gerado por JS) ---------- */

  function renderGrafico(c) {
    var sem = semanaDo(c.ref);
    var atual = sem.dias.map(function (d) { return faturamentoDia(d, c.lojas); });
    var ant = sem.ant.map(function (d) { return faturamentoDia(d, c.lojas); });
    var max = Math.max.apply(null, atual.concat(ant, [1]));
    var passo = Math.pow(10, Math.floor(Math.log10(max))) / 2;
    var topo = Math.ceil(max * 1.08 / passo) * passo;

    var W = 720, H = 300, pl = 72, pr = 34, pt = 24, pb = 36;
    var iw = W - pl - pr, ih = H - pt - pb;
    function x(i) { return pl + i * (iw / 6); }
    function y(v) { return pt + ih * (1 - v / topo); }

    var grades = '';
    for (var k = 0; k <= 4; k++) {
      var v = topo * k / 4, yy = y(v).toFixed(1);
      grades += '<line class="' + (k === 0 ? 'eixo' : 'grade-h') + '" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/>';
      grades += '<text x="' + (pl - 10) + '" y="' + (+yy + 4) + '" text-anchor="end">' + fmtMil(v) + '</text>';
    }

    var pA = [], pP = [], rot = '', marcas = '';
    var hoje = diaSemana(c.ref);
    for (var i = 0; i < 7; i++) {
      pA.push(x(i).toFixed(1) + ',' + y(atual[i]).toFixed(1));
      pP.push(x(i).toFixed(1) + ',' + y(ant[i]).toFixed(1));
      rot += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle"' + (i === hoje ? ' class="dia-ref"' : '') + '>' + DIAS_CURTOS[i] + ' ' + fmtCurto(sem.dias[i]).slice(0, 2) + '</text>';
      marcas += '<circle class="ponto-atual" cx="' + x(i).toFixed(1) + '" cy="' + y(atual[i]).toFixed(1) + '" r="' + (i === hoje ? 6.5 : 4) + '"/>';
    }
    var area = 'M' + pA[0] + ' L' + pA.slice(1).join(' L') + ' L' + x(6).toFixed(1) + ',' + y(0).toFixed(1) + ' L' + x(0).toFixed(1) + ',' + y(0).toFixed(1) + ' Z';
    var pico = atual.indexOf(Math.max.apply(null, atual));
    var textoPico = '<text class="rot-valor" x="' + x(pico).toFixed(1) + '" y="' + (y(atual[pico]) - 14).toFixed(1) + '" text-anchor="middle">' + fmtMil(atual[pico]) + '</text>';

    var tA = atual.reduce(function (s, n) { return s + n; }, 0);
    var tP = ant.reduce(function (s, n) { return s + n; }, 0);
    var resumo = 'Faturamento diário da semana: ' + moeda.format(tA) + ', contra ' + moeda.format(tP) + ' na semana anterior.';

    el.subGrafico.textContent = 'Semana de ' + fmtCurto(sem.dias[0]) + ' a ' + fmtCurto(sem.dias[6]) + '. Linha roxa: semana atual. Tracejada: semana anterior.';
    el.grafico.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + resumo + '">' + grades +
      '<path class="area-atual" d="' + area + '"/>' +
      '<polyline class="serie-anterior" points="' + pP.join(' ') + '"/>' +
      '<polyline class="serie-atual" points="' + pA.join(' ') + '"/>' +
      marcas + textoPico + rot + '</svg>';
  }

  /* ---------- Alertas ---------- */

  function renderAlertas(c) {
    var lista = [];
    var A = c.A;

    c.lojas.forEach(function (id) {
      var meta = metaDe(id) * c.P.fator;
      if (!meta) return;
      var fat = agregar(c.atualRows.filter(function (r) { return r.loja === id; })).fat;
      var p = fat / meta;
      if (p < 0.75) {
        lista.push({ tipo: p < 0.6 ? 'danger' : 'warning', titulo: 'Loja ' + nomeLoja(id) + ' abaixo da meta',
          msg: 'Atingiu ' + pct0.format(p) + ' da meta do período. Vale revisar a escala e as vendas desta loja.' });
      }
      // Sem registros recentes (planilha parada)
      var ult = '';
      estado.rows.forEach(function (r) { if (r.loja === id && r.d > ult) ult = r.d; });
      if (ult && ult < addDias(c.ref, -1)) {
        lista.push({ tipo: 'warning', titulo: 'Sem registros da loja ' + nomeLoja(id), msg: 'Último lançamento em ' + fmtCurto(ult) + '. Atualize a planilha para manter o painel em dia.' });
      }
    });

    if (A.atend && A.conv < META_CONVERSAO) {
      var faltam = Math.max(Math.ceil(META_CONVERSAO * A.atend) - A.vendas, 0);
      lista.push({ tipo: 'warning', titulo: 'Conversão abaixo da meta de 25%',
        msg: 'Conversão atual de ' + pct1.format(A.conv) + '. Faltam ' + inteiro.format(faltam) + ' vendas para bater 25% no período.' });
    }

    if (estado.periodo === 'semana' && diaSemana(c.ref) < 6 && c.meta) {
      var passados = diaSemana(c.ref) + 1;
      var proj = A.fat * 7 / passados;
      var pp = proj / c.meta;
      lista.push(pp >= 1
        ? { tipo: 'success', titulo: 'Ritmo projeta ' + pct0.format(pp) + ' da meta', msg: 'Mantido o ritmo até agora, a semana fecha acima da meta.' }
        : { tipo: 'info', titulo: 'Ritmo projeta ' + pct0.format(pp) + ' da meta', msg: 'Mantido o ritmo até agora, a semana fecha abaixo da meta. Vale reforçar o atendimento.' });
    }

    if (!lista.length) {
      el.alertas.innerHTML = '<p class="vazio">Nenhum alerta neste recorte. Tudo dentro do esperado.</p>';
      return;
    }
    var icones = {
      danger: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/>',
      warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
      success: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>'
    };
    el.alertas.innerHTML = lista.map(function (a, i) {
      return '<article class="alerta ' + a.tipo + '" style="--i:' + i + '"><svg class="alerta-icone icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
        icones[a.tipo] + '</svg><div><strong>' + a.titulo + '</strong><p>' + a.msg + '</p></div></article>';
    }).join('');
  }

  /* ---------- Metas por loja (barras) ---------- */

  function renderBullets(c) {
    el.bullets.innerHTML = '';
    estado.lojas.forEach(function (l, idx) {
      var meta = metaDe(l.id) * c.P.fator;
      var fat = agregar(c.atualRows.filter(function (r) { return r.loja === l.id; })).fat;
      var p = meta ? fat / meta : 0;
      var li = document.createElement('li');
      li.className = 'bullet-item' + (estado.loja === l.id ? ' ativo' : '');
      li.style.setProperty('--i', idx);
      li.innerHTML =
        '<div class="bullet-topo"><span class="bullet-nome"></span><span class="bullet-valor">' + pct0.format(p) + '</span></div>' +
        '<div class="bullet-trilho" role="img" aria-label="' + l.nome + ': ' + pct0.format(p) + ' da meta"><span class="bullet-real' + (p < 0.75 ? ' baixo' : '') + '"></span><span class="bullet-marca"></span></div>' +
        '<p class="bullet-meta"><strong>' + moeda.format(fat) + '</strong> de ' + moeda.format(meta) + ' · ' +
        (p >= 1 ? 'meta atingida' : 'faltam ' + moeda.format(meta - fat)) + '</p>';
      li.querySelector('.bullet-nome').textContent = l.nome;
      el.bullets.appendChild(li);
      li.querySelector('.bullet-real').style.width = (Math.min(p, 1.2) / 1.2 * 100).toFixed(2) + '%';
      li.querySelector('.bullet-marca').style.left = (100 / 120 * 100).toFixed(2) + '%';
    });
  }

  /* ---------- Funil (atendimentos -> vendas) ---------- */

  function renderFunil(c) {
    var A = c.A;
    el.funilSub.textContent = c.P.sub;
    var etapas = [
      { nome: 'Atendimentos', v: A.atend, nota: 'Todos os atendimentos do período' },
      { nome: 'Vendas fechadas', v: A.vendas, nota: pct1.format(A.conv) + ' dos atendimentos' }
    ];
    el.funil.innerHTML = etapas.map(function (e, i) {
      var w = 0.08 + 0.3 * (A.atend ? e.v / A.atend : 0);
      return '<li class="etapa" style="--i:' + i + ';--w:' + w.toFixed(3) + '"><span class="etapa-nome">' + e.nome + '</span>' +
        '<span class="etapa-valor">' + inteiro.format(e.v) + '</span><span class="etapa-taxa">' + e.nota + '</span></li>';
    }).join('');
    if (!A.atend) el.funil.innerHTML = '<li class="vazio">Sem atendimentos neste período.</li>';
  }

  /* ---------- Ranking ---------- */

  function iniciais(nome) {
    return nome.split(' ').slice(0, 2).map(function (p) { return p.charAt(0); }).join('');
  }

  function renderRanking(c) {
    var mapa = {};
    c.atualRows.forEach(function (r) {
      if (!r.venda) return;
      var k = r.vendedor + '|' + r.loja;
      if (!mapa[k]) mapa[k] = { nome: r.vendedor, loja: r.loja, valor: 0, vendas: 0 };
      mapa[k].valor += r.valor; mapa[k].vendas++;
    });
    var lista = Object.keys(mapa).map(function (k) { return mapa[k]; })
      .sort(function (a, b) { return b.valor - a.valor; }).slice(0, 6);
    el.ranking.innerHTML = lista.length ? lista.map(function (v, i) {
      return '<li class="item-rank" style="--i:' + i + '"><span class="posicao">' + (i + 1) + '</span>' +
        '<span class="avatar" aria-hidden="true">' + iniciais(v.nome) + '</span>' +
        '<span class="nome-bloco"><span class="nome"></span><span class="sub"></span></span>' +
        '<span class="valor">' + moeda.format(v.valor) + '</span></li>';
    }).join('') : '<li class="vazio">Nenhuma venda neste período.</li>';
    el.ranking.querySelectorAll('.item-rank').forEach(function (li, i) {
      li.querySelector('.nome').textContent = lista[i].nome;
      li.querySelector('.sub').textContent = nomeLoja(lista[i].loja) + ' · ' + inteiro.format(lista[i].vendas) + ' vendas';
    });
  }

  /* ---------- Tabela por dia (semana da referência) ---------- */

  var ultimaTabela = [];

  function linhasTabela(c) {
    var sem = semanaDo(c.ref);
    var linhas = sem.dias.map(function (d, i) {
      var fat = faturamentoDia(d, c.lojas);
      var at = atendimentosDia(d, c.lojas);
      return { dia: DIAS[i] + ' (' + fmtCurto(d) + ')', fat: fat, atend: at.atend, vendas: at.vendas,
        conv: at.atend ? at.vendas / at.atend : 0, ticket: at.vendas ? fat / at.vendas : 0 };
    });
    return linhas;
  }

  function renderTabela(c) {
    var linhas = linhasTabela(c);
    ultimaTabela = linhas;
    var tot = { fat: 0, atend: 0, vendas: 0 };
    el.tabela.innerHTML = linhas.map(function (l, i) {
      tot.fat += l.fat; tot.atend += l.atend; tot.vendas += l.vendas;
      return '<tr style="--i:' + i + '"><th scope="row">' + l.dia + '</th>' +
        '<td class="num">' + moeda.format(l.fat) + '</td>' +
        '<td class="num">' + inteiro.format(l.atend) + '</td>' +
        '<td class="num">' + inteiro.format(l.vendas) + '</td>' +
        '<td class="num"><span class="selo ' + (l.conv >= META_CONVERSAO ? 'ok' : 'aten') + '">' + pct1.format(l.conv) + '</span></td>' +
        '<td class="num">' + moeda.format(l.ticket) + '</td></tr>';
    }).join('');
    var tabela = document.getElementById('tabela');
    var antigo = tabela.querySelector('tfoot');
    if (antigo) antigo.remove();
    var pe = tabela.createTFoot();
    pe.innerHTML = '<tr><th scope="row">Total da semana</th><td class="num">' + moeda.format(tot.fat) +
      '</td><td class="num">' + inteiro.format(tot.atend) + '</td><td class="num">' + inteiro.format(tot.vendas) +
      '</td><td class="num">' + pct1.format(tot.atend ? tot.vendas / tot.atend : 0) + '</td><td class="num">' +
      moeda.format(tot.vendas ? tot.fat / tot.vendas : 0) + '</td></tr>';
  }

  /* ---------- Metas editáveis ---------- */

  function renderMetas() {
    el.metasLista.innerHTML = '';
    estado.lojas.forEach(function (l) {
      var wrap = document.createElement('div');
      wrap.className = 'meta-campo';
      var id = 'meta-' + l.id;
      wrap.innerHTML = '<label for="' + id + '"></label><div class="meta-input"><span class="prefixo">R$</span>' +
        '<input type="number" inputmode="numeric" min="0" step="100" id="' + id + '"></div>';
      wrap.querySelector('label').textContent = 'Meta semanal · ' + l.nome;
      var input = wrap.querySelector('input');
      input.value = metaDe(l.id) || '';
      input.addEventListener('change', function () {
        var v = Math.max(0, Math.round(+input.value || 0));
        estado.metas[l.id] = v;
        input.value = v;
        gravar();
        render();
      });
      el.metasLista.appendChild(wrap);
    });
  }

  /* ---------- Seletor de loja e cabeçalho da fonte ---------- */

  function renderSeletor() {
    var atual = estado.loja;
    el.loja.innerHTML = '';
    var todas = document.createElement('option');
    todas.value = 'todas';
    todas.textContent = 'Todas as lojas (consolidado)';
    el.loja.appendChild(todas);
    estado.lojas.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.id;
      o.textContent = l.nome;
      el.loja.appendChild(o);
    });
    el.loja.value = atual;
  }

  function renderFonte() {
    var n = estado.rows.length;
    var lojas = estado.lojas.length;
    if (estado.origem === 'exemplo') {
      el.fonte.textContent = 'Exemplo: Padaria Pão Quente, 3 lojas, 2 semanas de atendimentos (dados gerados). Importe a sua planilha para substituir.';
    } else {
      el.fonte.textContent = 'Planilha importada: ' + inteiro.format(n) + ' registros em ' + lojas + (lojas === 1 ? ' loja' : ' lojas') + '. Guardada só neste navegador.';
    }
    el.btnExemplo.hidden = estado.origem === 'exemplo';
  }

  /* ---------- Render geral ---------- */

  function render() {
    var c = calcular();
    renderFonte();
    renderSeletor();
    el.loja.value = estado.loja;
    el.seg.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-periodo') === estado.periodo ? 'true' : 'false'); });
    el.tema.setAttribute('aria-pressed', estado.tema === 'light-noir' ? 'true' : 'false');
    document.documentElement.setAttribute('data-theme', estado.tema);

    if (estado.rows.length === 0) {
      el.grade.hidden = true;
      el.vazio.hidden = false;
      return;
    }
    el.grade.hidden = false;
    var semRegistros = c.atualRows.length === 0 && c.B.atend === 0;
    el.vazio.hidden = !semRegistros;
    if (semRegistros) {
      el.vazio.querySelector('p').textContent = 'Nenhum registro para este período nas lojas escolhidas. Troque o período ou a loja.';
    }

    renderKpis(c);
    renderGrafico(c);
    renderAlertas(c);
    renderBullets(c);
    renderFunil(c);
    renderRanking(c);
    renderTabela(c);
    renderMetas();
  }

  /* ---------- Eventos básicos ---------- */

  el.loja.addEventListener('change', function () {
    estado.loja = el.loja.value;
    gravar();
    render();
  });

  el.seg.forEach(function (botao) {
    botao.addEventListener('click', function () {
      estado.periodo = botao.getAttribute('data-periodo');
      gravar();
      render();
    });
  });

  el.tema.addEventListener('click', function () {
    estado.tema = estado.tema === 'light-noir' ? 'default' : 'light-noir';
    gravar();
    render();
  });

  el.btnImportar.addEventListener('click', function () {
    var abrir = el.importar.hidden;
    el.importar.hidden = !abrir;
    el.btnImportar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    if (abrir) el.importar.scrollIntoView({ behavior: REDUZIR ? 'auto' : 'smooth', block: 'start' });
  });

  el.btnExemplo.addEventListener('click', function () {
    estado.origem = 'exemplo';
    estado.rows = gerarExemplo();
    estado.lojas = LOJAS_EXEMPLO.map(function (l) { return { id: l.id, nome: l.nome }; });
    LOJAS_EXEMPLO.forEach(function (l) { estado.metas[l.id] = l.meta; });
    estado.loja = 'todas';
    gravar();
    render();
    aviso('Exemplo restaurado.');
  });

  /* ---------- Exportação ---------- */

  el.btnPdf.addEventListener('click', function () { window.print(); });

  el.btnCsv.addEventListener('click', function () {
    var cab = ['Dia', 'Faturamento', 'Atendimentos', 'Vendas', 'Conversao', 'Ticket'];
    var linhas = [cab.join(';')].concat(ultimaTabela.map(function (l) {
      return [l.dia, dec2(l.fat), l.atend, l.vendas, dec2(l.conv * 100) + '%', dec2(l.ticket)].join(';');
    }));
    var blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'painel-vendas-semana.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    aviso('CSV da semana baixado.');
  });

  function dec2(n) { return n.toFixed(2).replace('.', ','); }

  /* ---------- Importação de CSV ---------- */

  var importacao = { cabecalho: [], linhas: [], sep: ',' };
  var MAPA_ALVO = [
    { chave: 'data', rotulo: 'Data', obrigatorio: true, nomes: ['data', 'dia', 'date'] },
    { chave: 'loja', rotulo: 'Loja', obrigatorio: true, nomes: ['loja', 'unidade', 'filial'] },
    { chave: 'vendedor', rotulo: 'Vendedor', obrigatorio: true, nomes: ['vendedor', 'atendente', 'responsavel'] },
    { chave: 'valor', rotulo: 'Valor (R$)', obrigatorio: true, nomes: ['valor', 'total', 'faturamento', 'valor venda'] },
    { chave: 'status', rotulo: 'Status (opcional)', obrigatorio: false, nomes: ['status', 'situacao', 'resultado'] }
  ];

  function erroImport(msg) {
    var p = document.getElementById('importar-erro');
    p.textContent = msg;
    p.hidden = false;
    var dz = document.getElementById('dropzone');
    dz.classList.remove('tremer');
    void dz.offsetWidth;
    if (!REDUZIR) dz.classList.add('tremer');
  }

  function limparErro() {
    var p = document.getElementById('importar-erro');
    p.hidden = true;
    p.textContent = '';
  }

  function detectarSeparador(linha) {
    var pv = (linha.match(/;/g) || []).length, vg = (linha.match(/,/g) || []).length;
    return pv >= vg ? ';' : ',';
  }

  function parseLinhaCSV(linha, sep) {
    var campos = [], atual = '', aspas = false;
    for (var i = 0; i < linha.length; i++) {
      var ch = linha.charAt(i);
      if (aspas) {
        if (ch === '"' && linha.charAt(i + 1) === '"') { atual += '"'; i++; }
        else if (ch === '"') aspas = false;
        else atual += ch;
      } else if (ch === '"') aspas = true;
      else if (ch === sep) { campos.push(atual); atual = ''; }
      else atual += ch;
    }
    campos.push(atual);
    return campos.map(function (c) { return c.trim(); });
  }

  function parseData(s) {
    var t = String(s || '').trim();
    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) {
      var ano = m[3].length === 2 ? '20' + m[3] : m[3];
      return ano + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    }
    return null;
  }

  function parseValor(s) {
    var t = String(s || '').replace(/R\$/gi, '').replace(/\s/g, '');
    if (!t) return NaN;
    if (t.indexOf(',') !== -1 && t.indexOf('.') !== -1) t = t.replace(/\./g, '').replace(',', '.');
    else if (t.indexOf(',') !== -1) t = t.replace(',', '.');
    return Number(t);
  }

  function palavraIgual(a, b) { return slug(a) === slug(b); }

  function sugerirColuna(alvo, cabecalho) {
    for (var i = 0; i < alvo.nomes.length; i++) {
      for (var j = 0; j < cabecalho.length; j++) {
        if (palavraIgual(cabecalho[j], alvo.nomes[i])) return j;
      }
    }
    return -1;
  }

  function montarMapa() {
    var box = document.getElementById('mapa');
    box.innerHTML = '';
    MAPA_ALVO.forEach(function (alvo) {
      var wrap = document.createElement('div');
      wrap.className = 'mapa-campo';
      var id = 'map-' + alvo.chave;
      wrap.innerHTML = '<label for="' + id + '"></label><select id="' + id + '"></select>';
      wrap.querySelector('label').textContent = alvo.rotulo;
      var sel = wrap.querySelector('select');
      if (!alvo.obrigatorio) {
        var nada = document.createElement('option');
        nada.value = '-1';
        nada.textContent = '— não usar —';
        sel.appendChild(nada);
      }
      importacao.cabecalho.forEach(function (nome, idx) {
        var o = document.createElement('option');
        o.value = String(idx);
        o.textContent = nome || '(coluna ' + (idx + 1) + ')';
        sel.appendChild(o);
      });
      var s = sugerirColuna(alvo, importacao.cabecalho);
      sel.value = String(s >= 0 ? s : (alvo.obrigatorio ? 0 : -1));
      sel.addEventListener('change', atualizarPrevia);
      box.appendChild(wrap);
    });
  }

  function lerMapa() {
    var m = {};
    MAPA_ALVO.forEach(function (a) { m[a.chave] = +document.getElementById('map-' + a.chave).value; });
    return m;
  }

  function linhaMapeada(raw, m) {
    var g = function (k) { return m[k] >= 0 ? (raw[m[k]] || '') : ''; };
    var data = parseData(g('data'));
    var loja = g('loja').trim();
    var vend = g('vendedor').trim();
    var valor = parseValor(g('valor'));
    var st = slug(g('status'));
    var venda;
    if (m.status >= 0 && st) venda = !/perd|nao|cancel|sem/.test(st);
    else venda = isFinite(valor) && valor > 0;
    return { d: data, loja: loja, vendedor: vend || '—', valor: isFinite(valor) ? valor : 0, venda: venda, ok: !!data && !!loja, valorInvalido: venda && !isFinite(valor) };
  }

  function atualizarPrevia() {
    var m = lerMapa();
    var cab = document.getElementById('previa-cab');
    var corpo = document.getElementById('previa-corpo');
    cab.innerHTML = '';
    corpo.innerHTML = '';
    MAPA_ALVO.forEach(function (a) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = a.rotulo.replace(' (opcional)', '');
      cab.appendChild(th);
    });
    var validas = 0, ignoradas = 0, invalidosValor = 0;
    importacao.linhas.forEach(function (raw, i) {
      var r = linhaMapeada(raw, m);
      if (r.ok) validas++; else ignoradas++;
      if (r.valorInvalido) invalidosValor++;
      if (i < 5) {
        var tr = document.createElement('tr');
        var celulas = [r.d ? fmtCurto(r.d) + '/' + r.d.slice(0, 4) : 'data inválida', r.loja || '—', r.vendedor,
          r.venda ? moeda2.format(r.valor) : '—', r.venda ? 'Venda' : 'Perdido'];
        if (m.status < 0) celulas[4] = r.venda ? 'Venda' : 'Sem valor';
        celulas.forEach(function (txt) { var td = document.createElement('td'); td.textContent = txt; tr.appendChild(td); });
        corpo.appendChild(tr);
      }
    });
    var resumo = inteiro.format(validas) + ' registros prontos para importar';
    if (ignoradas) resumo += ' · ' + inteiro.format(ignoradas) + ' linhas ignoradas (data ou loja em branco/inválida)';
    if (invalidosValor) resumo += ' · ' + inteiro.format(invalidosValor) + ' vendas sem valor válido (contadas como R$ 0)';
    document.getElementById('importar-resumo').textContent = resumo;
    document.getElementById('btn-confirmar').disabled = validas === 0;
  }

  function lerArquivo(arquivo) {
    limparErro();
    if (!arquivo) return;
    if (arquivo.size > 2 * 1024 * 1024) { erroImport('Arquivo maior que 2 MB. Divida a planilha por período e tente de novo.'); return; }
    var leitor = new FileReader();
    leitor.onload = function () {
      var texto = String(leitor.result || '').replace(/^﻿/, '');
      var linhas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
      if (linhas.length < 2) { erroImport('A planilha precisa ter uma linha de cabeçalho e pelo menos uma linha de dados.'); return; }
      importacao.sep = detectarSeparador(linhas[0]);
      importacao.cabecalho = parseLinhaCSV(linhas[0], importacao.sep);
      importacao.linhas = linhas.slice(1).map(function (l) { return parseLinhaCSV(l, importacao.sep); });
      document.getElementById('mapeamento-wrap').hidden = false;
      montarMapa();
      atualizarPrevia();
      document.getElementById('mapeamento-wrap').scrollIntoView({ behavior: REDUZIR ? 'auto' : 'smooth', block: 'nearest' });
    };
    leitor.onerror = function () { erroImport('Não consegui ler esse arquivo. Salve de novo como CSV e tente outra vez.'); };
    leitor.readAsText(arquivo, 'utf-8');
  }

  function fecharImportacao() {
    document.getElementById('mapeamento-wrap').hidden = true;
    document.getElementById('arquivo').value = '';
    importacao = { cabecalho: [], linhas: [], sep: ',' };
  }

  var entrada = document.getElementById('arquivo');
  var dropzone = document.getElementById('dropzone');
  entrada.addEventListener('change', function () { lerArquivo(entrada.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add('ativa'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove('ativa'); });
  });
  dropzone.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files[0];
    if (f) lerArquivo(f);
  });

  document.getElementById('btn-cancelar').addEventListener('click', fecharImportacao);

  document.getElementById('btn-confirmar').addEventListener('click', function () {
    var m = lerMapa();
    var rows = [], ids = {}, lojasNovas = [];
    importacao.linhas.forEach(function (raw) {
      var r = linhaMapeada(raw, m);
      if (!r.ok) return;
      var id = slug(r.loja);
      if (!ids[id]) { ids[id] = r.loja; lojasNovas.push({ id: id, nome: r.loja }); }
      rows.push({ d: r.d, loja: id, vendedor: r.vendedor, valor: r.venda ? r.valor : 0, venda: r.venda });
    });
    if (!rows.length) { erroImport('Nenhuma linha válida. Confira a coluna de data e a de loja.'); return; }

    estado.origem = 'importado';
    estado.rows = rows;
    estado.lojas = lojasNovas;
    estado.loja = 'todas';
    // Metas novas: sugestão de 10% acima da semana mais recente de cada loja
    var ref = referencia(), ws = inicioSemana(ref), fim = addDias(ws, 6);
    lojasNovas.forEach(function (l) {
      if (estado.metas[l.id] === undefined) {
        var fat = agregar(rows.filter(function (r) { return r.loja === l.id && r.d >= ws && r.d <= fim; })).fat;
        estado.metas[l.id] = Math.max(Math.round(fat * 1.1 / 100) * 100, 100);
      }
    });
    gravar();
    fecharImportacao();
    el.importar.hidden = true;
    el.btnImportar.setAttribute('aria-expanded', 'false');
    render();
    aviso(inteiro.format(rows.length) + ' registros importados.', 'ok');
  });

  /* ---------- Início ---------- */

  carregarEstado();
  el.data.textContent = fmtLongo(REF_EXEMPLO);
  render();
})();
