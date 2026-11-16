/* Demonstração de captura de leads — Solution Innova Digital (SID).
   Nada é enviado a lugar nenhum: a validação roda no navegador, o envio é simulado
   e o "rastreamento" fica numa lista local (window.sidVitrine.eventos).
   Sem scripts inline e sem terceiros (CSP do site). Preferências ficam só neste navegador. */
(function () {
  'use strict';

  var form = document.getElementById('form-captura');
  if (!form) return;

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var CHAVE_VARIANTE = 'sid-captura-variante';
  var CHAVE_TEMA = 'sid-captura-tema';
  var CHAVE_RASCUNHO = 'sid-captura-rascunho';
  var movimentoReduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var status = document.getElementById('status');
  var botao = form.querySelector('button[type="submit"]');
  var textoBotao = botao.querySelector('.btn-texto');
  var cartao = form.closest('.card-form');
  var campos = { nome: document.getElementById('nome'), email: document.getElementById('email'), lgpd: document.getElementById('lgpd') };

  /* ---------- Armazenamento local (tolerante a falhas) ---------- */
  function lerLocal(chave) {
    try { return window.localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravarLocal(chave, valor) {
    try { window.localStorage.setItem(chave, valor); } catch (e) { /* navegador bloqueou: segue sem salvar */ }
  }
  function apagarLocal(chave) {
    try { window.localStorage.removeItem(chave); } catch (e) { /* ignora */ }
  }

  /* ---------- Rastreamento simulado ---------- */
  window.sidVitrine = window.sidVitrine || { eventos: [] };
  function registrar(evento, dados) {
    window.sidVitrine.eventos.push({ evento: evento, dados: dados || {}, em: new Date().toISOString() });
  }

  /* ---------- Teste A/B: variante fixa por navegador ---------- */
  var variantes = {
    A: 'O seu e-mail vale mais do que você imagina',
    B: 'Transforme sua caixa de entrada em clientes'
  };
  var variante = lerLocal(CHAVE_VARIANTE);
  if (variante !== 'A' && variante !== 'B') {
    variante = Math.random() < 0.5 ? 'A' : 'B';
    gravarLocal(CHAVE_VARIANTE, variante);
  }
  var titulo = document.getElementById('titulo');
  if (titulo && variante === 'B') {
    titulo.textContent = variantes.B;
  }
  document.documentElement.setAttribute('data-variante', variante);
  registrar('hero_visto', { variante: variante });

  /* ---------- Modo noite (preferência salva) ---------- */
  var botaoTema = document.getElementById('tema');
  function aplicarTema(noite) {
    document.documentElement.setAttribute('data-tema', noite ? 'noite' : 'claro');
    if (botaoTema) {
      botaoTema.setAttribute('aria-pressed', noite ? 'true' : 'false');
      botaoTema.textContent = noite ? 'Modo claro' : 'Modo noite';
    }
  }
  aplicarTema(lerLocal(CHAVE_TEMA) === 'noite');
  if (botaoTema) {
    botaoTema.addEventListener('click', function () {
      var noite = document.documentElement.getAttribute('data-tema') !== 'noite';
      aplicarTema(noite);
      gravarLocal(CHAVE_TEMA, noite ? 'noite' : 'claro');
    });
  }

  /* ---------- Rascunho: nome e e-mail voltam se a pessoa sair da página ---------- */
  try {
    var rascunho = JSON.parse(lerLocal(CHAVE_RASCUNHO) || 'null');
    if (rascunho) {
      if (rascunho.nome) campos.nome.value = String(rascunho.nome).slice(0, 60);
      if (rascunho.email) campos.email.value = String(rascunho.email).slice(0, 120);
      if (rascunho.nome || rascunho.email) status.textContent = 'Recuperamos o que você tinha digitado neste navegador.';
    }
  } catch (e) { /* rascunho corrompido: ignora */ }

  function salvarRascunho() {
    gravarLocal(CHAVE_RASCUNHO, JSON.stringify({ nome: campos.nome.value, email: campos.email.value }));
  }

  /* ---------- Mensagens de erro ---------- */
  function marcarErro(campo, idErro, mensagem) {
    var p = document.getElementById(idErro);
    if (mensagem) {
      campo.setAttribute('aria-invalid', 'true');
      p.textContent = mensagem;
    } else {
      campo.removeAttribute('aria-invalid');
      p.textContent = '';
    }
  }

  function tremer() {
    if (!cartao || movimentoReduzido) return;
    cartao.classList.remove('tremer');
    void cartao.offsetWidth; // reinicia a animação
    cartao.classList.add('tremer');
  }

  /* ---------- Partículas ("poeira de projetor") ---------- */
  function particulas(origem, quantidade) {
    if (movimentoReduzido || !origem) return;
    var caixa = document.createElement('div');
    caixa.className = 'particulas';
    origem.appendChild(caixa);
    for (var i = 0; i < quantidade; i++) {
      var p = document.createElement('span');
      p.className = 'particula';
      var angulo = (Math.PI * 2 * i) / quantidade + Math.random() * 0.5;
      var distancia = 40 + Math.random() * 70;
      p.style.setProperty('--tx', Math.round(Math.cos(angulo) * distancia) + 'px');
      p.style.setProperty('--ty', Math.round(Math.sin(angulo) * distancia) + 'px');
      p.style.setProperty('--atraso', Math.round(Math.random() * 120) + 'ms');
      caixa.appendChild(p);
    }
    window.setTimeout(function () { caixa.remove(); }, 1100);
  }

  var simbolo = document.querySelector('.simbolo-wrap');
  if (simbolo) {
    simbolo.addEventListener('pointerenter', function () { particulas(simbolo, 14); });
    simbolo.addEventListener('click', function () { particulas(simbolo, 18); });
  }

  /* ---------- Revelação suave ao rolar ---------- */
  var revelar = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !movimentoReduzido) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15 });
    revelar.forEach(function (el) { observador.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add('visivel'); });
  }

  /* ---------- Botão fixo no celular: aparece só quando o formulário está fora da tela ---------- */
  var formulario = document.getElementById('formulario');
  if (formulario && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      document.body.classList.toggle('cta-visivel', !entradas[0].isIntersecting);
    }, { threshold: 0.2 }).observe(formulario);
  }

  /* ---------- Validação e envio simulado ---------- */
  ['nome', 'email', 'lgpd'].forEach(function (id) {
    var campo = campos[id];
    var limpar = function () { marcarErro(campo, 'erro-' + id, ''); };
    campo.addEventListener('input', limpar);
    campo.addEventListener('change', limpar);
  });
  campos.nome.addEventListener('input', salvarRascunho);
  campos.email.addEventListener('input', salvarRascunho);

  function mascararEmail(email) {
    var partes = email.split('@');
    return partes[0].slice(0, 2) + '***@' + partes[1];
  }

  function enviarSimulado(nome, email) {
    botao.disabled = true;
    form.setAttribute('aria-busy', 'true');
    textoBotao.textContent = 'Enviando…';
    status.textContent = 'Simulando o envio…';
    registrar('formulario_enviado_simulado', { variante: variante });

    window.setTimeout(function () {
      apagarLocal(CHAVE_RASCUNHO);
      particulas(botao, 22);
      var primeiroNome = nome.split(' ')[0].slice(0, 40);
      var query = '?nome=' + encodeURIComponent(primeiroNome) +
                  '&email=' + encodeURIComponent(mascararEmail(email)) +
                  '&variante=' + encodeURIComponent(variante);
      window.setTimeout(function () { window.location.href = 'obrigado' + query; }, movimentoReduzido ? 0 : 450);
    }, 1100);
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var valorNome = campos.nome.value.trim();
    var valorEmail = campos.email.value.trim();
    var ok = true;

    if (valorNome.length < 2) {
      marcarErro(campos.nome, 'erro-nome', 'Informe seu nome, com pelo menos 2 letras.');
      ok = false;
    } else {
      marcarErro(campos.nome, 'erro-nome', '');
    }

    if (!EMAIL.test(valorEmail)) {
      marcarErro(campos.email, 'erro-email', 'Digite um e-mail válido, por exemplo: nome@dominio.com.br');
      ok = false;
    } else {
      marcarErro(campos.email, 'erro-email', '');
    }

    if (!campos.lgpd.checked) {
      marcarErro(campos.lgpd, 'erro-lgpd', 'Marque a caixa para receber o material.');
      ok = false;
    } else {
      marcarErro(campos.lgpd, 'erro-lgpd', '');
    }

    if (!ok) {
      tremer();
      var primeiro = form.querySelector('[aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      status.textContent = 'Revise os campos destacados.';
      registrar('validacao_falhou');
      return;
    }

    enviarSimulado(valorNome, valorEmail);
  });
})();
