/* Rastreador do Metricool (carregado de tracker.metricool.com).
   Fica em arquivo próprio para o site não precisar de script inline. */
(function () {
  var HASH = '8033691dfe467d783e125c95825ac0f';
  var done = false;
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = 'https://tracker.metricool.com/resources/be.js';
  s.onload = function () {
    if (done) return;
    done = true;
    if (window.beTracker) window.beTracker.t({ hash: HASH });
  };
  document.head.appendChild(s);
})();
