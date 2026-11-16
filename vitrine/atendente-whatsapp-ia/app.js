/* Atendente de WhatsApp com IA · demonstração roteirizada
 * Sem backend e sem API de IA: as respostas vêm de uma base de exemplo
 * (negócio fictício) e a correspondência é por palavras-chave.
 * Sem innerHTML: todo texto entra por textContent.
 */
(function () {
  'use strict';

  var NEGOCIO = 'Padaria Flor do Campo';
  var ATRASO_RESPOSTA = 900;
  var ATRASO_REDUZIDO = 120;

  var FAQ = [
    {
      id: 'horario',
      rotulo: 'Qual o horário?',
      chaves: ['horario', 'horarios', 'abre', 'abrem', 'fecha', 'fecham', 'funciona', 'aberto', 'hora'],
      resposta: 'Seg a sáb, das 7h às 20h. Domingo e feriados, das 7h às 13h.'
    },
    {
      id: 'entrega',
      rotulo: 'Vocês entregam?',
      chaves: ['entrega', 'entregam', 'entregar', 'delivery', 'bairro', 'frete', 'taxa', 'paraiso', 'vila'],
      resposta: 'Sim! Entregamos na Vila Mariana e no Paraíso. A taxa é de R$ 6,00 e o pedido chega em até 40 minutos.'
    },
    {
      id: 'encomenda',
      rotulo: 'Como faço uma encomenda?',
      chaves: ['encomenda', 'encomendar', 'bolo', 'festa', 'aniversario', 'pedido', 'pedir', 'reservar'],
      resposta: 'Encomendas precisam de 24 horas de antecedência. Me diga o sabor, o tamanho e a data que eu já deixo anotado.'
    },
    {
      id: 'pagamento',
      rotulo: 'Formas de pagamento',
      chaves: ['pagamento', 'pagar', 'pix', 'cartao', 'debito', 'credito', 'dinheiro', 'pagamentos'],
      resposta: 'Aceitamos Pix, cartão de débito e crédito e dinheiro. No Pix, a chave é enviada no fechamento do pedido.'
    },
    {
      id: 'gluten',
      rotulo: 'Tem opção sem glúten?',
      chaves: ['gluten', 'celiaco', 'celiaca', 'alergia', 'lactose', 'vegano', 'vegana', 'sem gluten'],
      resposta: 'Temos pão de queijo e bolo sem glúten, feitos em dias específicos. Como dividimos a cozinha, não garantimos ausência total de contaminação. Posso chamar alguém da equipe para confirmar.'
    }
  ];

  var CHAVES_ATENDENTE = ['atendente', 'humano', 'pessoa', 'reclamacao', 'reclamar', 'cancelar', 'problema', 'gerente'];

  var log = document.getElementById('log');
  var rapidas = document.getElementById('rapidas');
  var form = document.getElementById('form');
  var entrada = document.getElementById('entrada');
  var btnEnviar = form.querySelector('.chat__enviar');
  var btnReiniciar = document.getElementById('btn-reiniciar');
  var statusBox = document.getElementById('status-chat');
  var statusTexto = document.getElementById('status-texto');

  var ocupado = false;
  var escalado = false;
  var digitandoEl = null;
  var timers = [];
  var reduzirMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function horaAgora() {
    var d = new Date();
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function agendar(fn, ms) {
    var t = setTimeout(function () {
      timers = timers.filter(function (x) { return x !== t; });
      fn();
    }, reduzirMovimento ? Math.min(ms, ATRASO_REDUZIDO) : ms);
    timers.push(t);
  }

  function rolar() {
    log.scrollTop = log.scrollHeight;
  }

  function criarBalao(tipo, autor, texto) {
    var el = document.createElement('div');
    el.className = 'msg msg--' + tipo;

    if (autor) {
      var nome = document.createElement('span');
      nome.className = 'msg__autor';
      nome.textContent = autor;
      el.appendChild(nome);
    }

    var corpo = document.createElement('span');
    corpo.className = 'msg__texto';
    corpo.textContent = texto;
    el.appendChild(corpo);

    var hora = document.createElement('span');
    hora.className = 'msg__hora';
    hora.textContent = horaAgora();
    el.appendChild(hora);

    return el;
  }

  function mostrarDigitando() {
    removerDigitando();
    digitandoEl = document.createElement('div');
    digitandoEl.className = 'digitando';
    digitandoEl.setAttribute('role', 'status');
    digitandoEl.setAttribute('aria-label', 'Assistente digitando');
    for (var i = 0; i < 3; i++) {
      digitandoEl.appendChild(document.createElement('span'));
    }
    log.appendChild(digitandoEl);
    rolar();
  }

  function removerDigitando() {
    if (digitandoEl && digitandoEl.parentNode) {
      digitandoEl.parentNode.removeChild(digitandoEl);
    }
    digitandoEl = null;
  }

  function falarBot(texto, opcoes) {
    removerDigitando();
    log.appendChild(criarBalao('bot', 'Assistente IA', texto));
    rolar();
    if (opcoes && opcoes.rapidas) {
      mostrarRapidas(opcoes.rapidas);
    }
  }

  function falarUsuario(texto) {
    log.appendChild(criarBalao('usuario', 'Você', texto));
    rolar();
  }

  function evento(texto, classe) {
    var el = document.createElement('div');
    el.className = 'evento' + (classe ? ' ' + classe : '');
    el.setAttribute('role', 'status');
    el.textContent = texto;
    log.appendChild(el);
    rolar();
  }

  function mostrarRapidas(itens) {
    rapidas.textContent = '';
    itens.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = item.rotulo;
      b.addEventListener('click', function () {
        if (ocupado) return;
        enviarTexto(item.rotulo, item.id);
      });
      rapidas.appendChild(b);
    });
  }

  function esconderRapidas() {
    rapidas.textContent = '';
  }

  function bloquear(sim) {
    ocupado = sim;
    entrada.disabled = sim;
    btnEnviar.disabled = sim;
    Array.prototype.forEach.call(rapidas.querySelectorAll('button'), function (b) { b.disabled = sim; });
  }

  function escalar() {
    escalado = true;
    statusBox.classList.add('escalado');
    statusTexto.textContent = 'Aguardando atendente humano';
    evento('Conversa escalada para atendente humano. Tempo estimado: 2 min.');
    log.appendChild(criarBalao('humano', 'Equipe ' + NEGOCIO, 'Oi, aqui é a equipe da ' + NEGOCIO + '. Já vi o histórico da conversa e vou te responder por aqui.'));
    rolar();
  }

  function sugestoesPadrao() {
    return FAQ.map(function (f) { return { id: f.id, rotulo: f.rotulo }; })
      .concat([{ id: 'atendente', rotulo: 'Falar com atendente' }]);
  }

  function responder(textoOriginal, idDireto) {
    var norm = normalizar(textoOriginal);
    var pedeAtendente = idDireto === 'atendente' || CHAVES_ATENDENTE.some(function (c) {
      return norm.split(' ').indexOf(c) !== -1;
    });

    if (pedeAtendente) {
      falarBot('Entendi. Vou transferir você para uma pessoa da equipe e ela recebe todo o histórico desta conversa.');
      agendar(function () {
        escalar();
        bloquear(false);
        esconderRapidas();
        entrada.focus();
      }, ATRASO_RESPOSTA);
      return;
    }

    var melhor = null;
    var melhorPontos = 0;

    if (idDireto) {
      melhor = FAQ.filter(function (f) { return f.id === idDireto; })[0] || null;
    } else {
      var palavras = norm.split(' ');
      FAQ.forEach(function (f) {
        var pontos = 0;
        f.chaves.forEach(function (c) {
          var chaveNorm = normalizar(c);
          if (chaveNorm.indexOf(' ') !== -1) {
            if (norm.indexOf(chaveNorm) !== -1) pontos += 2;
          } else if (palavras.indexOf(chaveNorm) !== -1) {
            pontos += 1;
          }
        });
        if (pontos > melhorPontos) {
          melhorPontos = pontos;
          melhor = f;
        }
      });
    }

    if (melhor) {
      falarBot(melhor.resposta, { rapidas: sugestoesPadrao().filter(function (s) { return s.id !== melhor.id; }).slice(0, 4) });
      bloquear(false);
      return;
    }

    falarBot('Ainda não tenho essa informação. Posso chamar uma pessoa da equipe para te responder, ou você escolhe uma das perguntas abaixo.', { rapidas: sugestoesPadrao() });
    bloquear(false);
  }

  function enviarTexto(texto, idDireto) {
    var limpo = String(texto || '').trim();
    if (!limpo || ocupado) return;

    esconderRapidas();
    falarUsuario(limpo);
    entrada.value = '';
    bloquear(true);

    if (escalado) {
      evento('Sua mensagem foi enviada para a equipe. Alguém responde em instantes.');
      bloquear(false);
      return;
    }

    mostrarDigitando();
    agendar(function () {
      responder(limpo, idDireto);
    }, ATRASO_RESPOSTA);
  }

  function iniciar() {
    timers.forEach(clearTimeout);
    timers = [];
    removerDigitando();
    log.textContent = '';
    rapidas.textContent = '';
    escalado = false;
    statusBox.classList.remove('escalado');
    statusTexto.textContent = 'Assistente IA online';
    bloquear(true);

    mostrarDigitando();
    agendar(function () {
      falarBot('Oi! Sou a assistente virtual da ' + NEGOCIO + '. Escolha uma pergunta ou escreva a sua.', { rapidas: sugestoesPadrao() });
      bloquear(false);
    }, ATRASO_RESPOSTA);
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    enviarTexto(entrada.value);
  });

  btnReiniciar.addEventListener('click', function () {
    if (ocupado) return;
    iniciar();
  });

  iniciar();
})();
