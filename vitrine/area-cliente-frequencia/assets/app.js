/* Área do Cliente com Frequência · demonstração com dados fictícios.
   Sem backend, sem cookies, sem terceiros. Tudo fica na memória da página. */
(function () {
  'use strict';

  var BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var SIGLAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  var DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  /* ---------- Dados de exemplo (nomes fictícios) ---------- */
  var NOMES = [
    ['Ana Souza', 'Mensal', 189, 5], ['Bruno Lima', 'Mensal', 189, 10], ['Carla Ribeiro', 'Trimestral', 159, 12],
    ['Diego Martins', 'Mensal', 189, 3], ['Elisa Ferreira', 'Anual', 139, 20], ['Felipe Neves', 'Mensal', 189, 8],
    ['Gabriela Alves', 'Trimestral', 159, 15], ['Heitor Duarte', 'Mensal', 189, 1], ['Isabela Rocha', 'Mensal', 189, 25],
    ['João Pedro Melo', 'Anual', 139, 7], ['Larissa Castro', 'Mensal', 189, 18], ['Marcos Viana', 'Trimestral', 159, 28]
  ];

  // Gerador determinístico, para a demonstração ser sempre a mesma
  var semente = 20261115;
  function aleatorio() {
    semente = (semente * 1103515245 + 12345) & 0x7fffffff;
    return semente / 0x7fffffff;
  }

  var alunos = NOMES.map(function (n, i) {
    var historico = [];
    for (var d = 0; d < 14; d++) {
      var r = aleatorio();
      historico.push(r < 0.72 ? 'present' : r < 0.86 ? 'late' : 'absent');
    }
    // Situação de pagamento: 7 em dia, 3 a vencer, 2 atrasados
    var situacao = i < 7 ? 'pago' : i < 10 ? 'pendente' : 'atrasado';
    return {
      id: 'a' + (i + 1),
      nome: n[0],
      plano: n[1],
      valor: n[2],
      vencimento: n[3],
      situacao: situacao,
      historico: historico,
      hojePresente: i === 1 || i === 4
    };
  });

  // Ana é a aluna da visão do portal
  var ALUNA_ID = 'a1';
  alunos[0].historico[13] = 'present';

  /* ---------- Estado ---------- */
  var estado = { filtro: 'todos', busca: '', visao: 'gestao', aba: 'pagamentos', abaAluno: 'freq' };
  var ultimoFoco = null;

  /* ---------- Utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function frequencia(aluno) {
    var presentes = aluno.historico.filter(function (h) { return h !== 'absent'; }).length;
    return Math.round((presentes / aluno.historico.length) * 100);
  }
  function rotuloSituacao(s) {
    return {
      pago: { texto: 'Em dia', icone: '✓', classe: 'paid' },
      pendente: { texto: 'A vencer', icone: '◷', classe: 'pending' },
      atrasado: { texto: 'Atrasado', icone: '!', classe: 'overdue' }
    }[s];
  }
  function badgeSituacao(s) {
    var r = rotuloSituacao(s);
    return '<span class="badge badge--' + r.classe + '" data-icone="' + r.icone + '">' + r.texto + '</span>';
  }
  function rotuloPresenca(p) {
    return { present: 'Presente', late: 'Atraso', absent: 'Falta' }[p];
  }
  function iconePresenca(p) {
    return { present: '✓', late: '◷', absent: '✕' }[p];
  }
  function badgePresenca(p) {
    var classe = p === 'present' ? 'present' : p === 'late' ? 'late' : 'absent';
    return '<span class="badge badge--' + classe + '" data-icone="' + iconePresenca(p) + '">' + rotuloPresenca(p) + '</span>';
  }
  function diasUltimos14() {
    var hoje = new Date();
    var lista = [];
    for (var k = 13; k >= 0; k--) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - k);
      lista.push({ sigla: SIGLAS[d.getDay()], numero: d.getDate(), semana: DIAS_SEMANA[d.getDay()] });
    }
    return lista;
  }

  var toastTimer = null;
  function mostrarToast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  /* ---------- Render: KPIs ---------- */
  function renderKpis() {
    var total = alunos.length;
    var emDia = alunos.filter(function (a) { return a.situacao === 'pago'; }).length;
    var atrasados = alunos.filter(function (a) { return a.situacao === 'atrasado'; });
    var emAberto = atrasados.reduce(function (s, a) { return s + a.valor; }, 0);
    var freqMedia = Math.round(alunos.reduce(function (s, a) { return s + frequencia(a); }, 0) / total);
    var pctEmDia = Math.round((emDia / total) * 100);

    $('kpis').innerHTML =
      '<div class="kpi"><p class="kpi__rotulo">Alunos ativos</p><p class="kpi__valor">' + total + '</p><p class="kpi__extra">Plano mensal, trimestral e anual</p></div>' +
      '<div class="kpi"><p class="kpi__rotulo">Em dia</p><p class="kpi__valor">' + pctEmDia + '%</p><p class="kpi__extra">' + emDia + ' de ' + total + ' alunos pagaram</p></div>' +
      '<div class="kpi kpi--alerta"><p class="kpi__rotulo">Atrasados</p><p class="kpi__valor">' + atrasados.length + '</p><p class="kpi__extra">' + BRL.format(emAberto) + ' em aberto</p></div>' +
      '<div class="kpi"><p class="kpi__rotulo">Frequência média</p><p class="kpi__valor">' + freqMedia + '%</p><p class="kpi__extra">Últimos 14 dias</p></div>';
  }

  /* ---------- Render: tabela de pagamentos ---------- */
  function alunosFiltrados() {
    var termo = estado.busca.trim().toLowerCase();
    return alunos.filter(function (a) {
      var okFiltro = estado.filtro === 'todos' || a.situacao === estado.filtro;
      var okBusca = !termo || a.nome.toLowerCase().indexOf(termo) !== -1;
      return okFiltro && okBusca;
    });
  }

  function barraPresenca(aluno) {
    var marcas = aluno.historico.map(function (h) {
      var classe = h === 'present' ? 'present' : h === 'late' ? 'late' : 'absent';
      return '<span class="presenca__dia presenca__dia--' + classe + '"></span>';
    }).join('');
    return '<span class="presenca" aria-hidden="true">' + marcas + '</span>' +
      '<span class="presenca__pct">' + frequencia(aluno) + '%</span>';
  }

  function renderTabela() {
    var lista = alunosFiltrados();
    var corpo = $('linhas-alunos');
    $('vazio-pagamentos').hidden = lista.length !== 0;

    corpo.innerHTML = lista.map(function (a) {
      var classeLinha = a.situacao === 'atrasado' ? 'linha--atrasado' : a.situacao === 'pendente' ? 'linha--pendente' : '';
      var classeValor = a.situacao === 'atrasado' ? 'money money--overdue' : a.situacao === 'pago' ? 'money money--paid' : 'money';
      return '<tr class="' + classeLinha + '" data-id="' + a.id + '" tabindex="0" aria-label="Ver detalhes de ' + esc(a.nome) + '">' +
        '<td><span class="nome">' + esc(a.nome) + '</span></td>' +
        '<td>' + esc(a.plano) + '</td>' +
        '<td><span class="' + classeValor + '">' + BRL.format(a.valor) + '</span></td>' +
        '<td>Dia ' + String(a.vencimento).padStart(2, '0') + '</td>' +
        '<td>' + badgeSituacao(a.situacao) + '</td>' +
        '<td>' + barraPresenca(a) + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ---------- Render: chamada de hoje ---------- */
  function renderChamada() {
    var presentes = alunos.filter(function (a) { return a.hojePresente; }).length;
    $('resumo-chamada').textContent = presentes + ' de ' + alunos.length + ' presentes';
    $('lista-chamada').innerHTML = alunos.map(function (a) {
      return '<li><button type="button" class="aluno-check" aria-pressed="' + a.hojePresente + '" data-chamada="' + a.id + '">' +
        '<span>' + esc(a.nome) + '</span>' +
        '<span class="aluno-check__marca">' + (a.hojePresente ? '✓ Presente' : 'Marcar presença') + '</span>' +
        '</button></li>';
    }).join('');
  }

  /* ---------- Render: visão do aluno ---------- */
  function renderAluno() {
    var ana = alunos.filter(function (a) { return a.id === ALUNA_ID; })[0];
    $('aluno-badge').innerHTML = badgeSituacao(ana.situacao);
    $('aluno-valor').textContent = BRL.format(ana.valor);
    $('aluno-venc').textContent = 'Plano ' + ana.plano.toLowerCase() + ' · vence dia ' + String(ana.vencimento).padStart(2, '0');
    $('btn-pix').hidden = ana.situacao === 'pago';

    $('grade-dias').innerHTML = diasUltimos14().map(function (dia, i) {
      var p = ana.historico[i];
      var nome = rotuloPresenca(p);
      return '<li><span class="grade-dias__sigla" aria-hidden="true">' + dia.sigla + '</span>' +
        '<span>' + dia.numero + '</span>' +
        '<span class="grade-dias__ponto grade-dias__ponto--' + (p === 'present' ? 'present' : p === 'late' ? 'late' : 'absent') + '" aria-hidden="true"></span>' +
        '<span class="sr-only">' + dia.semana + ', dia ' + dia.numero + ': ' + nome + '</span></li>';
    }).join('');
  }

  /* ---------- Gaveta de detalhe do aluno ---------- */
  function abrirGaveta(id, origem) {
    var aluno = alunos.filter(function (a) { return a.id === id; })[0];
    if (!aluno) return;
    ultimoFoco = origem || document.activeElement;

    var fundo = document.createElement('div');
    fundo.className = 'gaveta-fundo';
    fundo.id = 'gaveta-fundo';

    var gaveta = document.createElement('aside');
    gaveta.className = 'gaveta';
    gaveta.id = 'gaveta';
    gaveta.setAttribute('role', 'dialog');
    gaveta.setAttribute('aria-modal', 'true');
    gaveta.setAttribute('aria-labelledby', 'gaveta-titulo');

    var pago = aluno.situacao === 'pago';
    gaveta.innerHTML =
      '<button type="button" class="gaveta__fechar" aria-label="Fechar detalhes">✕</button>' +
      '<p class="kicker">Aluno</p>' +
      '<h2 class="titulo-display titulo-display--sm" id="gaveta-titulo">' + esc(aluno.nome) + '</h2>' +
      '<dl>' +
        '<div><dt>Plano</dt><dd>' + esc(aluno.plano) + '</dd></div>' +
        '<div><dt>Mensalidade</dt><dd>' + BRL.format(aluno.valor) + '</dd></div>' +
        '<div><dt>Vencimento</dt><dd>Dia ' + String(aluno.vencimento).padStart(2, '0') + '</dd></div>' +
        '<div><dt>Frequência</dt><dd>' + frequencia(aluno) + '%</dd></div>' +
      '</dl>' +
      '<p>' + badgeSituacao(aluno.situacao) + '</p>' +
      '<div class="acoes-gaveta">' +
        (pago ? '' : '<button type="button" class="btn btn--primario" data-acao="pagar">Registrar pagamento</button>') +
        '<button type="button" class="btn btn--contorno" data-acao="lembrete">Enviar lembrete</button>' +
      '</div>';

    document.body.appendChild(fundo);
    document.body.appendChild(gaveta);
    document.body.style.overflow = 'hidden';

    fundo.addEventListener('click', fecharGaveta);
    gaveta.querySelector('.gaveta__fechar').addEventListener('click', fecharGaveta);
    gaveta.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-acao]');
      if (!botao) return;
      if (botao.getAttribute('data-acao') === 'pagar') {
        aluno.situacao = 'pago';
        mostrarToast(aluno.nome + ': pagamento registrado.');
        fecharGaveta();
        renderTudo();
      } else {
        mostrarToast('Lembrete simulado para ' + aluno.nome + '.');
      }
    });
    gaveta.querySelector('.gaveta__fechar').focus();
  }

  function fecharGaveta() {
    var g = $('gaveta'); var f = $('gaveta-fundo');
    if (g) g.remove();
    if (f) f.remove();
    document.body.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  /* ---------- Troca de visão e abas ---------- */
  function definirVisao(visao, foco) {
    estado.visao = visao;
    ['gestao', 'aluno'].forEach(function (v) {
      var tab = $('tab-' + v);
      var painel = $('visao-' + v);
      var ativa = v === visao;
      tab.setAttribute('aria-selected', ativa ? 'true' : 'false');
      tab.tabIndex = ativa ? 0 : -1;
      painel.hidden = !ativa;
      painel.classList.toggle('is-ativa', ativa);
    });
    if (foco) $('tab-' + visao).focus();
  }

  function definirAba(aba) {
    estado.aba = aba;
    document.querySelectorAll('[data-aba]').forEach(function (b) {
      var ativa = b.getAttribute('data-aba') === aba;
      b.classList.toggle('is-ativa', ativa);
      b.setAttribute('aria-pressed', ativa ? 'true' : 'false');
    });
    $('painel-pagamentos').hidden = aba !== 'pagamentos';
    $('painel-frequencia').hidden = aba !== 'frequencia';
  }

  function definirAbaAluno(aba) {
    document.querySelectorAll('[data-aba-aluno]').forEach(function (b) {
      var ativa = b.getAttribute('data-aba-aluno') === aba;
      b.classList.toggle('is-ativa', ativa);
      b.setAttribute('aria-pressed', ativa ? 'true' : 'false');
    });
    $('aluno-freq').hidden = aba !== 'freq';
    $('aluno-avisos').hidden = aba !== 'avisos';
  }

  function renderTudo() {
    renderKpis();
    renderTabela();
    renderChamada();
    renderAluno();
  }

  /* ---------- Check-in da aluna ---------- */
  function fazerCheckin() {
    var botao = $('btn-checkin');
    var ana = alunos.filter(function (a) { return a.id === ALUNA_ID; })[0];
    if (ana.hojePresente || botao.disabled) return;
    botao.disabled = true;
    botao.classList.add('is-lendo');
    $('checkin-status').textContent = 'Validando sua presença…';

    setTimeout(function () {
      botao.classList.remove('is-lendo');
      botao.classList.add('is-ok');
      botao.querySelector('span').textContent = 'Check-in feito';
      ana.hojePresente = true;
      ana.historico[13] = 'present';
      $('checkin-status').textContent = 'Check-in registrado às ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '. Bom treino!';
      renderChamada();
      renderAluno();
      renderKpis();
      renderTabela();
    }, 900);
  }

  /* ---------- Eventos ---------- */
  function ligarEventos() {
    // Abas de visão, com setas do teclado
    document.querySelector('.segmento').addEventListener('click', function (e) {
      var b = e.target.closest('[data-visao]');
      if (b) definirVisao(b.getAttribute('data-visao'), false);
    });
    document.querySelector('.segmento').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var proxima = estado.visao === 'gestao' ? 'aluno' : 'gestao';
      definirVisao(proxima, true);
      e.preventDefault();
    });

    // Abas da gestão
    document.querySelector('.abas:not(.abas--aluno)').addEventListener('click', function (e) {
      var b = e.target.closest('[data-aba]');
      if (b) definirAba(b.getAttribute('data-aba'));
    });

    // Filtros
    document.querySelector('.filtros').addEventListener('click', function (e) {
      var b = e.target.closest('[data-filtro]');
      if (!b) return;
      estado.filtro = b.getAttribute('data-filtro');
      document.querySelectorAll('[data-filtro]').forEach(function (x) {
        var ativo = x === b;
        x.classList.toggle('is-ativo', ativo);
        x.setAttribute('aria-pressed', ativo ? 'true' : 'false');
      });
      renderTabela();
    });

    // Busca
    $('busca').addEventListener('input', function (e) {
      estado.busca = e.target.value;
      renderTabela();
    });

    // Linhas da tabela abrem a gaveta (clique ou Enter)
    $('linhas-alunos').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-id]');
      if (tr) abrirGaveta(tr.getAttribute('data-id'), tr);
    });
    $('linhas-alunos').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var tr = e.target.closest('tr[data-id]');
      if (tr) abrirGaveta(tr.getAttribute('data-id'), tr);
    });

    // Chamada: marcar presença
    $('lista-chamada').addEventListener('click', function (e) {
      var b = e.target.closest('[data-chamada]');
      if (!b) return;
      var aluno = alunos.filter(function (a) { return a.id === b.getAttribute('data-chamada'); })[0];
      aluno.hojePresente = !aluno.hojePresente;
      renderChamada();
      mostrarToast(aluno.nome + (aluno.hojePresente ? ': presença registrada.' : ': presença removida.'));
    });

    // Aba do aluno
    document.querySelector('.abas--aluno').addEventListener('click', function (e) {
      var b = e.target.closest('[data-aba-aluno]');
      if (b) definirAbaAluno(b.getAttribute('data-aba-aluno'));
    });

    // Check-in
    $('btn-checkin').addEventListener('click', fazerCheckin);

    // Botões de demonstração
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-demo]');
      if (b) mostrarToast(b.getAttribute('data-demo'));
    });

    // Escape fecha a gaveta
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('gaveta')) fecharGaveta();
    });
  }

  /* ---------- Início ---------- */
  function iniciar() {
    renderTudo();
    definirAba('pagamentos');
    definirAbaAluno('freq');
    ligarEventos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
