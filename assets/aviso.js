/* Aviso de privacidade e medição de visitas.
   O site não grava cookies. A medição usa o Vercel Web Analytics (anônimo, sem cookies),
   servido pelo próprio domínio, então a CSP continua com script-src 'self'.
   A escolha da pessoa fica no localStorage do navegador dela (chave "sid-aviso"). */
(function () {
  var CHAVE = 'sid-aviso';
  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) {} }

  function medir() {
    if (document.querySelector('script[data-medicao]')) return;
    var s = document.createElement('script');
    s.src = '/_vercel/insights/script.js';
    s.defer = true;
    s.setAttribute('data-medicao', '');
    document.body.appendChild(s);
  }

  var escolha = ler();
  if (escolha !== 'sem-medicao') medir();
  if (escolha) return;

  var aviso = document.createElement('div');
  aviso.className = 'aviso-priv';
  aviso.setAttribute('role', 'region');
  aviso.setAttribute('aria-label', 'Aviso de privacidade');
  aviso.innerHTML =
    '<p>Este site não usa cookies. Contamos as visitas de forma anônima, sem identificar você. ' +
    '<a href="/privacidade">Política de privacidade</a></p>' +
    '<div class="aviso-acoes">' +
    '<button type="button" class="btn btn-menta" data-escolha="ok">Entendi</button>' +
    '<button type="button" class="aviso-recusa" data-escolha="sem-medicao">Não contar minhas visitas</button>' +
    '</div>';
  aviso.addEventListener('click', function (e) {
    var b = e.target.closest('[data-escolha]');
    if (!b) return;
    gravar(b.dataset.escolha);
    aviso.classList.add('sai');
    document.documentElement.classList.remove('com-aviso');
    setTimeout(function () { aviso.remove(); }, 400);
    if (b.dataset.escolha === 'sem-medicao') {
      /* Vale a partir da próxima página: o script de medição deixa de ser carregado. */
      var s = document.querySelector('script[data-medicao]');
      if (s) s.remove();
    }
  });
  document.body.appendChild(aviso);
  document.documentElement.classList.add('com-aviso');
})();
