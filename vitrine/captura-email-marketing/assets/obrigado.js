/* Página de obrigado: preenche saudação e e-mail mascarado a partir da query string
   (só textContent, nada vira HTML), mostra a variante do teste e comemora com partículas. */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var nome = (params.get('nome') || '').trim().slice(0, 40);
  var email = (params.get('email') || '').trim().slice(0, 120);

  if (nome) {
    document.getElementById('saudacao').textContent =
      nome + ', enviamos o checklist para o seu e-mail.';
  }
  if (email) {
    document.getElementById('email-destino').textContent = email;
  }

  try {
    if (window.localStorage.getItem('sid-captura-tema') === 'noite') {
      document.documentElement.setAttribute('data-tema', 'noite');
    }
  } catch (e) { /* sem armazenamento: segue no tema claro */ }

  var movimentoReduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var selo = document.querySelector('.selo');

  function explodir(origem, quantidade) {
    if (movimentoReduzido || !origem) return;
    var caixa = document.createElement('div');
    caixa.className = 'particulas';
    origem.appendChild(caixa);
    for (var i = 0; i < quantidade; i++) {
      var p = document.createElement('span');
      p.className = 'particula';
      var angulo = (Math.PI * 2 * i) / quantidade + Math.random() * 0.4;
      var distancia = 60 + Math.random() * 90;
      p.style.setProperty('--tx', Math.round(Math.cos(angulo) * distancia) + 'px');
      p.style.setProperty('--ty', Math.round(Math.sin(angulo) * distancia) + 'px');
      p.style.setProperty('--atraso', Math.round(Math.random() * 150) + 'ms');
      caixa.appendChild(p);
    }
    window.setTimeout(function () { caixa.remove(); }, 1300);
  }

  if (selo) {
    window.setTimeout(function () { explodir(selo, 26); }, 400);
  }

  window.sidVitrine = window.sidVitrine || { eventos: [] };
  window.sidVitrine.eventos.push({ evento: 'obrigado_visto', dados: { variante: params.get('variante') || '' }, em: new Date().toISOString() });
})();
