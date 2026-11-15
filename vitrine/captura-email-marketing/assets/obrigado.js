/* Preenche a página de obrigado com o nome e o e-mail mascarado vindos da query string.
   Usa só textContent, então nada digitado vira HTML. */
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
})();
