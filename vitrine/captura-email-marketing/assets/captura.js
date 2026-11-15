/* Demonstração de captura de leads. Nada é salvo nem enviado: a validação roda no navegador
   e o envio é simulado com um atraso. Sem scripts inline e sem terceiros (CSP do site). */
(function () {
  'use strict';

  var form = document.getElementById('form-captura');
  if (!form) return;

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var status = document.getElementById('status');
  var botao = form.querySelector('button[type="submit"]');
  var textoBotao = botao.querySelector('.btn-texto');

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

  function mascararEmail(email) {
    var partes = email.split('@');
    var inicio = partes[0].slice(0, 2);
    return inicio + '***@' + partes[1];
  }

  function enviarSimulado(nome, email) {
    botao.disabled = true;
    form.setAttribute('aria-busy', 'true');
    textoBotao.textContent = 'Enviando…';
    status.textContent = 'Simulando o envio…';

    window.setTimeout(function () {
      var primeiroNome = nome.split(' ')[0].slice(0, 40);
      var query = '?nome=' + encodeURIComponent(primeiroNome) +
                  '&email=' + encodeURIComponent(mascararEmail(email));
      window.location.href = 'obrigado' + query;
    }, 1100);
  }

  ['nome', 'email', 'lgpd'].forEach(function (id) {
    var campo = document.getElementById(id);
    campo.addEventListener('input', function () {
      marcarErro(campo, 'erro-' + id, '');
    });
    campo.addEventListener('change', function () {
      marcarErro(campo, 'erro-' + id, '');
    });
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var nome = document.getElementById('nome');
    var email = document.getElementById('email');
    var lgpd = document.getElementById('lgpd');
    var valorNome = nome.value.trim();
    var valorEmail = email.value.trim();
    var ok = true;

    if (valorNome.length < 2) {
      marcarErro(nome, 'erro-nome', 'Informe seu nome, com pelo menos 2 letras.');
      ok = false;
    } else {
      marcarErro(nome, 'erro-nome', '');
    }

    if (!EMAIL.test(valorEmail)) {
      marcarErro(email, 'erro-email', 'Digite um e-mail válido, por exemplo: nome@dominio.com.br');
      ok = false;
    } else {
      marcarErro(email, 'erro-email', '');
    }

    if (!lgpd.checked) {
      marcarErro(lgpd, 'erro-lgpd', 'Marque a caixa para receber o material.');
      ok = false;
    } else {
      marcarErro(lgpd, 'erro-lgpd', '');
    }

    if (!ok) {
      var primeiro = form.querySelector('[aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      status.textContent = 'Revise os campos destacados.';
      return;
    }

    enviarSimulado(valorNome, valorEmail);
  });
})();
