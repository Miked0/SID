/* Página de obrigado: o botão "Não abriu?" reabre o WhatsApp com a mensagem que a pessoa montou no formulário. */
(function () {
  var b = document.getElementById('reabrir');
  if (!b) return;
  try {
    var url = sessionStorage.getItem('sid-whatsapp');
    if (url && url.indexOf('https://wa.me/') === 0) b.href = url;
  } catch (e) {}
})();
