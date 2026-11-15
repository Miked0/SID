/* Agenda online com WhatsApp · demonstração SID
   Dados de exemplo. Nada é enviado nem salvo fora desta página. */
(function () {
  'use strict';

  var CONFIG = {
    salao: 'Barbearia Modelo',
    endereco: 'Rua das Flores, 123 · Vila Mariana, São Paulo',
    // Número de exemplo (não é de um cliente real).
    whatsapp: '5511900000000',
    abre: 9 * 60,
    fecha: 19 * 60,
    almoco: [12 * 60 + 30, 13 * 60 + 30],
    passo: 30,
    diasAFrente: 10
  };

  var SERVICOS = [
    { id: 'corte', nome: 'Corte masculino', desc: 'Corte com máquina e tesoura, finalização', min: 45, preco: 45 },
    { id: 'barba', nome: 'Barba', desc: 'Barba desenhada com toalha quente', min: 30, preco: 35 },
    { id: 'combo', nome: 'Corte + barba', desc: 'O combo completo, com modelagem', min: 60, preco: 79 },
    { id: 'pigmento', nome: 'Pigmentação de barba', desc: 'Preenche falhas e alinha o contorno', min: 60, preco: 120 }
  ];

  var PROFISSIONAIS = [
    { id: 'bruno', nome: 'Bruno Lima', funcao: 'Barbeiro · 8 anos' },
    { id: 'marina', nome: 'Marina Costa', funcao: 'Barbeira · 5 anos' },
    { id: 'diego', nome: 'Diego Alves', funcao: 'Barbeiro · 3 anos' }
  ];

  var DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var ETAPAS_TITULO = ['Serviço', 'Equipe', 'Horário', 'Seus dados'];

  var estado = {
    passo: 1,
    servico: null,
    prof: null,        // id do profissional ou 'qualquer'
    dia: null,         // Date (meia-noite)
    hora: null,        // minutos desde 00:00
    nome: '',
    tel: '',
    obs: ''
  };

  // Agenda de exemplo: já existem horários ocupados (ver ocupado()).
  var agenda = [
    { id: 1, dia: hojeMeiaNoite(0), hora: 9 * 60, cliente: 'Maria Souza', tel: '11988887777', servico: 'Corte masculino', prof: 'Bruno Lima', status: 'confirmado' },
    { id: 2, dia: hojeMeiaNoite(0), hora: 10 * 60 + 30, cliente: 'Rafael Nunes', tel: '11977776666', servico: 'Corte + barba', prof: 'Marina Costa', status: 'pendente' },
    { id: 3, dia: hojeMeiaNoite(0), hora: 15 * 60, cliente: 'Thiago Pires', tel: '11966665555', servico: 'Barba', prof: 'Diego Alves', status: 'pendente' },
    { id: 4, dia: hojeMeiaNoite(1), hora: 11 * 60, cliente: 'Lucas Ferreira', tel: '11955554444', servico: 'Corte masculino', prof: 'Marina Costa', status: 'confirmado' },
    { id: 5, dia: hojeMeiaNoite(1), hora: 16 * 60 + 30, cliente: 'André Gomes', tel: '11944443333', servico: 'Pigmentação de barba', prof: 'Bruno Lima', status: 'pendente' }
  ];
  var proximoId = 6;

  var $ = function (id) { return document.getElementById(id); };
  var anuncioEl = $('anuncio');
  var toastEl = $('toast');
  var toastTimer = null;

  /* ---------- Utilidades ---------- */

  function hojeMeiaNoite(somaDias) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + somaDias);
    return d;
  }

  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'texto') n.textContent = v;
        else if (k === 'on') Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
        else if (k === 'classe') n.className = v;
        else n.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined) return;
      n.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    });
    return n;
  }

  function reais(v) {
    return 'R$ ' + v.toFixed(2).replace('.', ',');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function horaTexto(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }

  function diaTexto(d) {
    return DIAS_SEM[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }

  function diaCurto(d) {
    return DIAS_SEM[d.getDay()] + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  }

  function chaveDia(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Hash simples e determinístico: a mesma data e horário sempre dão o mesmo resultado.
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  function ocupado(d, min, profId) {
    if (min >= CONFIG.almoco[0] && min < CONFIG.almoco[1]) return true;
    var marcado = agenda.some(function (a) {
      return chaveDia(a.dia) === chaveDia(d) && a.hora === min && a.prof === nomeProf(profId) && a.status !== 'cancelado';
    });
    if (marcado) return true;
    return hash(chaveDia(d) + '|' + min + '|' + profId) % 5 === 0;
  }

  function nomeProf(id) {
    var p = PROFISSIONAIS.filter(function (x) { return x.id === id; })[0];
    return p ? p.nome : '';
  }

  // Um horário está livre se todos os blocos de 30 min do serviço estão livres.
  function horarioLivre(d, inicio, servico, profId) {
    var fim = inicio + servico.min;
    if (fim > CONFIG.fecha) return false;
    for (var m = inicio; m < fim; m += CONFIG.passo) {
      var algum = false;
      if (profId === 'qualquer') {
        algum = PROFISSIONAIS.some(function (p) { return !ocupado(d, m, p.id); });
      } else {
        algum = !ocupado(d, m, profId);
      }
      if (!algum) return false;
    }
    return true;
  }

  function horariosDoDia(d, servico, profId) {
    var lista = [];
    var agora = new Date();
    for (var m = CONFIG.abre; m + servico.min <= CONFIG.fecha; m += CONFIG.passo) {
      if (chaveDia(d) === chaveDia(agora) && m < agora.getHours() * 60 + agora.getMinutes() + 60) continue;
      if (horarioLivre(d, m, servico, profId)) lista.push(m);
    }
    return lista;
  }

  function diasDisponiveis() {
    var dias = [];
    var d = hojeMeiaNoite(0);
    while (dias.length < CONFIG.diasAFrente) {
      if (d.getDay() !== 0) dias.push(new Date(d.getTime())); // domingo fechado
      d.setDate(d.getDate() + 1);
    }
    return dias;
  }

  function anunciar(texto) {
    anuncioEl.textContent = '';
    window.setTimeout(function () { anuncioEl.textContent = texto; }, 30);
  }

  function toast(texto) {
    toastEl.textContent = texto;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  function validarTel(t) {
    var digitos = t.replace(/\D/g, '');
    return digitos.length === 10 || digitos.length === 11;
  }

  function mascaraTel(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  /* ---------- Resumo e etapas ---------- */

  function atualizarResumo() {
    $('r-servico').textContent = estado.servico ? estado.servico.nome : 'Escolha um serviço';
    $('r-prof').textContent = estado.prof === null ? 'Qualquer disponível' :
      (estado.prof === 'qualquer' ? 'Qualquer disponível' : nomeProf(estado.prof));
    $('r-data').textContent = estado.dia ? diaTexto(estado.dia) : 'Ainda não escolhida';
    $('r-hora').textContent = estado.hora !== null ? horaTexto(estado.hora) : 'Ainda não escolhido';
    $('r-valor').textContent = estado.servico ? reais(estado.servico.preco) : 'R$ 0,00';
  }

  function atualizarEtapas() {
    var itens = document.querySelectorAll('.etapa');
    for (var i = 0; i < itens.length; i++) {
      var n = i + 1;
      itens[i].classList.toggle('feita', n < estado.passo && estado.passo <= 5);
      if (n === estado.passo) itens[i].setAttribute('aria-current', 'step');
      else itens[i].removeAttribute('aria-current');
    }
  }

  function mostrarPasso(n, silencioso) {
    estado.passo = n;
    for (var i = 1; i <= 5; i++) $('passo-' + i).hidden = i !== n;
    $('voltar').hidden = n === 1 || n === 5;
    var avancar = $('avancar');
    avancar.hidden = n === 5;
    avancar.textContent = n === 4 ? 'Ver resumo e confirmar' : 'Continuar';
    avancar.disabled = !podeAvancar();
    atualizarEtapas();
    atualizarResumo();
    if (n === 5) { $('barra-acoes').hidden = true; } else { $('barra-acoes').hidden = false; }
    var titulo = document.querySelector('#passo-' + n + ' .passo-titulo');
    if (titulo && !silencioso) {
      anunciar('Etapa ' + n + ' de 4: ' + ETAPAS_TITULO[n - 1]);
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
      window.scrollTo({ top: document.getElementById('painel-agendar').offsetTop - 8, behavior: 'auto' });
    }
  }

  function podeAvancar() {
    if (estado.passo === 1) return !!estado.servico;
    if (estado.passo === 2) return estado.prof !== null;
    if (estado.passo === 3) return estado.dia !== null && estado.hora !== null;
    if (estado.passo === 4) return true;
    return false;
  }

  /* ---------- Etapa 1: serviços ---------- */

  function montarServicos() {
    var lista = $('lista-servicos');
    lista.innerHTML = '';
    SERVICOS.forEach(function (s) {
      var pressionado = estado.servico && estado.servico.id === s.id;
      lista.appendChild(el('button', {
        type: 'button', classe: 'opcao', 'aria-pressed': pressionado ? 'true' : 'false',
        on: { click: function () {
          estado.servico = s;
          // Trocar o serviço pode invalidar o horário escolhido.
          estado.hora = null;
          montarServicos();
          atualizarResumo();
          $('avancar').disabled = false;
          anunciar('Serviço escolhido: ' + s.nome);
        } }
      }, [
        el('span', { classe: 'opcao-nome', texto: s.nome }),
        el('span', { classe: 'opcao-preco', texto: reais(s.preco) }),
        el('span', { classe: 'opcao-desc', texto: s.desc }),
        el('span', { classe: 'opcao-meta', texto: s.min + ' min' })
      ]));
    });
  }

  /* ---------- Etapa 2: profissionais ---------- */

  function montarProfissionais() {
    var lista = $('lista-profissionais');
    lista.innerHTML = '';
    var opcoes = [{ id: 'qualquer', nome: 'Qualquer profissional', funcao: 'Mostramos o primeiro horário livre' }].concat(PROFISSIONAIS);
    opcoes.forEach(function (p) {
      var pressionado = estado.prof === p.id;
      var iniciais = p.id === 'qualquer' ? '★' : p.nome.split(' ').map(function (x) { return x[0]; }).join('');
      lista.appendChild(el('button', {
        type: 'button', classe: 'opcao', 'aria-pressed': pressionado ? 'true' : 'false',
        on: { click: function () {
          estado.prof = p.id;
          estado.hora = null;
          montarProfissionais();
          $('avancar').disabled = false;
          anunciar('Profissional escolhido: ' + p.nome);
        } }
      }, [
        el('span', { classe: 'opcao-linha' }, [
          el('span', { classe: 'opcao-foto', 'aria-hidden': 'true', texto: iniciais }),
          el('span', { classe: 'opcao-texto' }, [
            el('span', { classe: 'opcao-nome', texto: p.nome }),
            el('span', { classe: 'opcao-desc', texto: p.funcao })
          ])
        ])
      ]));
    });
  }

  /* ---------- Etapa 3: dia e horário ---------- */

  function montarDias() {
    var lista = $('lista-dias');
    lista.innerHTML = '';
    diasDisponiveis().forEach(function (d) {
      var pressionado = estado.dia && chaveDia(estado.dia) === chaveDia(d);
      lista.appendChild(el('button', {
        type: 'button', classe: 'dia', 'aria-pressed': pressionado ? 'true' : 'false',
        'aria-label': diaTexto(d),
        on: { click: function () {
          estado.dia = d;
          estado.hora = null;
          montarDias();
          montarHorarios();
          atualizarResumo();
          $('avancar').disabled = true;
        } }
      }, [
        el('span', { classe: 'dia-sem', 'aria-hidden': 'true', texto: DIAS_SEM[d.getDay()] }),
        el('span', { classe: 'dia-num', 'aria-hidden': 'true', texto: pad(d.getDate()) })
      ]));
    });
  }

  function montarHorarios() {
    var lista = $('lista-horarios');
    lista.innerHTML = '';
    if (!estado.dia) {
      lista.appendChild(el('p', { classe: 'vazio', texto: 'Escolha um dia para ver os horários livres.' }));
      return;
    }
    var livres = horariosDoDia(estado.dia, estado.servico, estado.prof);
    if (!livres.length) {
      lista.appendChild(el('p', { classe: 'vazio', texto: 'Sem horários livres neste dia. Tente outro dia.' }));
      return;
    }
    livres.forEach(function (m) {
      var pressionado = estado.hora === m;
      lista.appendChild(el('button', {
        type: 'button', classe: 'horario', 'aria-pressed': pressionado ? 'true' : 'false',
        on: { click: function () {
          estado.hora = m;
          montarHorarios();
          atualizarResumo();
          $('avancar').disabled = false;
          anunciar('Horário escolhido: ' + horaTexto(m));
        } }
      }, [horaTexto(m)]));
    });
  }

  /* ---------- Etapa 4: dados ---------- */

  function validarDados() {
    var ok = true;
    var nome = $('nome').value.trim();
    var tel = $('tel').value;
    var erroNome = $('nome-erro');
    var erroTel = $('tel-erro');

    if (nome.length < 2 || nome.length > 80) {
      erroNome.textContent = 'Informe um nome entre 2 e 80 letras.';
      erroNome.hidden = false;
      $('nome').setAttribute('aria-invalid', 'true');
      $('nome').setAttribute('aria-describedby', 'nome-dica nome-erro');
      ok = false;
    } else {
      erroNome.hidden = true;
      $('nome').removeAttribute('aria-invalid');
      $('nome').setAttribute('aria-describedby', 'nome-dica');
    }

    if (!validarTel(tel)) {
      erroTel.textContent = 'Informe um WhatsApp com DDD, por exemplo (11) 98765-4321.';
      erroTel.hidden = false;
      $('tel').setAttribute('aria-invalid', 'true');
      $('tel').setAttribute('aria-describedby', 'tel-dica tel-erro');
      ok = false;
    } else {
      erroTel.hidden = true;
      $('tel').removeAttribute('aria-invalid');
      $('tel').setAttribute('aria-describedby', 'tel-dica');
    }

    if (ok) {
      estado.nome = nome;
      estado.tel = tel.replace(/\D/g, '');
      estado.obs = $('obs').value.trim();
    }
    return ok;
  }

  /* ---------- Etapa 5: confirmação ---------- */

  function montarMensagem() {
    var linhas = [
      'Olá! Quero confirmar meu agendamento:',
      '',
      '• Serviço: ' + estado.servico.nome,
      '• Profissional: ' + (estado.prof === 'qualquer' ? 'Quem estiver livre' : nomeProf(estado.prof)),
      '• Data: ' + diaTexto(estado.dia),
      '• Horário: ' + horaTexto(estado.hora),
      '• Valor: ' + reais(estado.servico.preco),
      '• Nome: ' + estado.nome
    ];
    if (estado.obs) linhas.push('• Observações: ' + estado.obs);
    linhas.push('', 'Pode confirmar? Obrigado(a)!');
    return linhas.join('\n');
  }

  function mostrarConfirmacao() {
    var mensagem = montarMensagem();
    $('mensagem-previa').textContent = mensagem;
    $('link-whatsapp').href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(mensagem);

    // Entra na agenda do salão como pendente, até o salão confirmar.
    agenda.push({
      id: proximoId++, dia: new Date(estado.dia.getTime()), hora: estado.hora,
      cliente: estado.nome, tel: estado.tel, servico: estado.servico.nome,
      prof: estado.prof === 'qualquer' ? sortearProf(estado.dia, estado.hora) : nomeProf(estado.prof),
      status: 'pendente'
    });
    mostrarPasso(5);
    desenharPainel();
  }

  function sortearProf(d, min) {
    var livres = PROFISSIONAIS.filter(function (p) { return !ocupado(d, min, p.id); });
    return (livres[0] || PROFISSIONAIS[0]).nome;
  }

  function resetar() {
    estado.servico = null;
    estado.prof = null;
    estado.dia = null;
    estado.hora = null;
    estado.nome = '';
    estado.tel = '';
    estado.obs = '';
    $('nome').value = '';
    $('tel').value = '';
    $('obs').value = '';
    montarServicos();
    montarProfissionais();
    montarDias();
    montarHorarios();
    mostrarPasso(1);
  }

  /* ---------- Painel do salão ---------- */

  function desenharPainel() {
    var lista = $('lista-agenda');
    lista.innerHTML = '';
    var ordenada = agenda.slice().sort(function (a, b) {
      return (a.dia - b.dia) || (a.hora - b.hora);
    });

    var total = ordenada.filter(function (a) { return a.status !== 'cancelado'; }).length;
    $('k-total').textContent = total;
    $('k-conf').textContent = ordenada.filter(function (a) { return a.status === 'confirmado'; }).length;
    $('k-pend').textContent = ordenada.filter(function (a) { return a.status === 'pendente'; }).length;

    ordenada.forEach(function (a) {
      var rotuloStatus = { pendente: 'Aguardando', confirmado: 'Confirmado', cancelado: 'Cancelado' }[a.status];
      var acoes = [];

      if (a.status === 'pendente') {
        acoes.push(el('button', {
          type: 'button', classe: 'btn btn-menta btn-pequeno',
          on: { click: function () {
            a.status = 'confirmado';
            desenharPainel();
            toast('Horário confirmado para ' + a.cliente + '.');
          } }
        }, ['Confirmar']));
      }
      if (a.status !== 'cancelado') {
        acoes.push(el('a', {
          classe: 'btn btn-sec btn-pequeno', target: '_blank', rel: 'noopener',
          href: 'https://wa.me/' + '55' + a.tel + '?text=' + encodeURIComponent(
            'Oi, ' + a.cliente.split(' ')[0] + '! Lembrete: seu ' + a.servico.toLowerCase() +
            ' é ' + (a.dia.getTime() === hojeMeiaNoite(0).getTime() ? 'hoje' : 'em ' + diaCurto(a.dia)) +
            ' às ' + horaTexto(a.hora) + ' com ' + a.prof + '. Para remarcar, responda REAGENDAR.')
        }, ['Enviar lembrete']));
        acoes.push(el('button', {
          type: 'button', classe: 'btn btn-perigo btn-pequeno',
          on: { click: function () {
            a.status = 'cancelado';
            desenharPainel();
            toast('Agendamento de ' + a.cliente + ' cancelado.');
          } }
        }, ['Cancelar']));
      }

      lista.appendChild(el('li', { classe: 'item' }, [
        el('div', { classe: 'item-hora' }, [
          horaTexto(a.hora),
          el('span', { classe: 'item-dia', texto: diaCurto(a.dia) })
        ]),
        el('div', { classe: 'item-corpo' }, [
          el('p', { classe: 'item-nome', texto: a.cliente }),
          el('p', { classe: 'item-info', texto: a.servico + ' · ' + a.prof })
        ]),
        el('div', { classe: 'item-acoes' }, [
          el('span', { classe: 'status status-' + a.status, texto: rotuloStatus }),
          el('div', { classe: 'acoes-item' }, acoes)
        ])
      ]));
    });
  }

  /* ---------- Abas ---------- */

  function ativarAba(nome, focar) {
    var abas = document.querySelectorAll('.aba');
    for (var i = 0; i < abas.length; i++) {
      var ativa = abas[i].getAttribute('data-aba') === nome;
      abas[i].setAttribute('aria-selected', ativa ? 'true' : 'false');
      abas[i].tabIndex = ativa ? 0 : -1;
      if (ativa && focar) abas[i].focus();
    }
    $('painel-agendar').hidden = nome !== 'agendar';
    $('painel-painel').hidden = nome !== 'painel';
    $('barra-acoes').hidden = nome !== 'agendar' || estado.passo === 5;
    if (nome === 'painel') desenharPainel();
  }

  /* ---------- Ligações ---------- */

  function ligar() {
    $('salao-nome').textContent = CONFIG.salao;
    $('salao-end').textContent = CONFIG.endereco;

    montarServicos();
    montarProfissionais();
    montarDias();
    montarHorarios();

    $('avancar').addEventListener('click', function () {
      if (estado.passo === 4) {
        if (validarDados()) mostrarConfirmacao();
        else { anunciar('Confira os campos destacados.'); $('nome').focus(); }
        return;
      }
      if (podeAvancar()) mostrarPasso(estado.passo + 1);
    });

    $('voltar').addEventListener('click', function () {
      if (estado.passo > 1) mostrarPasso(estado.passo - 1);
    });

    $('novo-agendamento').addEventListener('click', resetar);

    $('tel').addEventListener('input', function (e) {
      e.target.value = mascaraTel(e.target.value);
    });

    var abas = document.querySelectorAll('.aba');
    for (var i = 0; i < abas.length; i++) {
      abas[i].addEventListener('click', function (e) { ativarAba(e.currentTarget.getAttribute('data-aba'), false); });
      abas[i].addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var proxima = e.key === 'ArrowRight' ? 'painel' : 'agendar';
        ativarAba(proxima, true);
        e.preventDefault();
      });
    }

    mostrarPasso(1, true);
    desenharPainel();
  }

  ligar();
})();
