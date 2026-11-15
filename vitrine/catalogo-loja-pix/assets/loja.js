/* Loja demo com Pix · Solution Innova Digital
   Tudo local: sem backend, sem chave Pix real, sem dados de clientes.
   O pagamento é simulado pelo botão "Simular pagamento aprovado". */
(function () {
  'use strict';

  var PRODUTOS = [
    { id: 'p1', nome: 'Camiseta Algodão', cat: 'vestuario', preco: 59.9, desc: 'Malha penteada, modelagem reta.', cor: '#6516BD' },
    { id: 'p2', nome: 'Moletom Noite', cat: 'vestuario', preco: 149.9, desc: 'Felpado por dentro, capuz forrado.', cor: '#2B0A57' },
    { id: 'p3', nome: 'Meia Cano Alto', cat: 'vestuario', preco: 49.9, desc: 'Kit com 3 pares, algodão.', cor: '#6516BD' },
    { id: 'p4', nome: 'Tênis Corrida Leve', cat: 'calcados', preco: 329.9, desc: 'Entressola macia, solado antiderrapante.', cor: '#68E0BC' },
    { id: 'p5', nome: 'Chinelo Sol', cat: 'calcados', preco: 79.9, desc: 'Tiras em couro sintético.', cor: '#B9A3E3' },
    { id: 'p6', nome: 'Boné Órbita', cat: 'acessorios', preco: 69.9, desc: 'Aba curva, ajuste traseiro.', cor: '#6516BD' },
    { id: 'p7', nome: 'Mochila Urbana 20L', cat: 'acessorios', preco: 199.0, desc: 'Compartimento para notebook.', cor: '#2B0A57', esgotado: true },
    { id: 'p8', nome: 'Garrafa Térmica 500 ml', cat: 'casa', preco: 89.9, desc: 'Aço inox, mantém a bebida por horas.', cor: '#68E0BC' },
    { id: 'p9', nome: 'Caneca Foguete', cat: 'casa', preco: 39.9, desc: 'Cerâmica 350 ml, pode ir ao micro-ondas.', cor: '#6516BD' },
    { id: 'p10', nome: 'Cápsulas de Café', cat: 'casa', preco: 27.5, desc: 'Caixa com 10 cápsulas, intensidade média.', cor: '#B9A3E3' },
    { id: 'p11', nome: 'Caderno Pontilhado A5', cat: 'papelaria', preco: 34.9, desc: '96 folhas, capa dura, marcador.', cor: '#68E0BC' },
    { id: 'p12', nome: 'Kit Post-it Menta', cat: 'papelaria', preco: 24.9, desc: 'Três blocos em tons de menta e lilás.', cor: '#B9A3E3' }
  ];

  var CATEGORIAS = [
    { id: 'todos', nome: 'Todos' },
    { id: 'vestuario', nome: 'Vestuário' },
    { id: 'calcados', nome: 'Calçados' },
    { id: 'acessorios', nome: 'Acessórios' },
    { id: 'casa', nome: 'Casa' },
    { id: 'papelaria', nome: 'Papelaria' }
  ];

  var CUPONS = { DEMO10: 0.10 };
  var CHAVE = 'sid-loja-demo-carrinho';
  var PIX_SEGUNDOS = 600;

  var BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var $ = function (id) { return document.getElementById(id); };

  var estado = {
    carrinho: lerCarrinho(),   // { [id]: quantidade }
    filtro: 'todos',
    busca: '',
    cupom: null,               // { codigo, pct }
    timer: null,
    pedido: null
  };

  /* ---------- armazenamento (tolerante a bloqueio) ---------- */
  function lerCarrinho() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      var obj = bruto ? JSON.parse(bruto) : {};
      var limpo = {};
      Object.keys(obj).forEach(function (id) {
        if (achar(id) && obj[id] > 0) limpo[id] = Math.min(obj[id], 20);
      });
      return limpo;
    } catch (e) { return {}; }
  }
  function salvarCarrinho() {
    try { window.localStorage.setItem(CHAVE, JSON.stringify(estado.carrinho)); } catch (e) { /* ignora */ }
  }

  /* ---------- utilidades ---------- */
  function achar(id) {
    for (var i = 0; i < PRODUTOS.length; i++) if (PRODUTOS[i].id === id) return PRODUTOS[i];
    return null;
  }
  function itensCarrinho() {
    return Object.keys(estado.carrinho).map(function (id) {
      var p = achar(id);
      return { p: p, qtd: estado.carrinho[id], linha: p.preco * estado.carrinho[id] };
    });
  }
  function subtotal() {
    return itensCarrinho().reduce(function (s, i) { return s + i.linha; }, 0);
  }
  function descontoValor() {
    return estado.cupom ? subtotal() * estado.cupom.pct : 0;
  }
  function total() {
    return subtotal() - descontoValor();
  }
  function quantidadeTotal() {
    return Object.keys(estado.carrinho).reduce(function (s, id) { return s + estado.carrinho[id]; }, 0);
  }
  function escapar(txt) {
    return String(txt).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Arte do produto: forma geométrica da marca, sem imagens externas. */
  function arte(p) {
    var forma = {
      vestuario: '<path d="M30 20 L44 12 Q50 18 56 12 L70 20 L80 34 L72 40 L70 88 L30 88 L28 40 L20 34 Z" fill="' + p.cor + '"/>',
      calcados: '<path d="M18 62 Q18 40 34 40 L48 48 L76 52 Q84 54 84 64 L84 72 L18 72 Z" fill="' + p.cor + '"/>',
      acessorios: '<circle cx="50" cy="56" r="26" fill="' + p.cor + '"/><rect x="36" y="22" width="28" height="12" rx="6" fill="' + p.cor + '"/>',
      casa: '<rect x="28" y="32" width="36" height="50" rx="8" fill="' + p.cor + '"/><path d="M64 44 Q80 44 80 58 Q80 72 64 72" fill="none" stroke="' + p.cor + '" stroke-width="6"/>',
      papelaria: '<rect x="26" y="22" width="48" height="60" rx="4" fill="' + p.cor + '"/><path d="M36 40h28M36 52h28M36 64h20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
    }[p.cat];
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + forma + '</svg>';
  }

  /* ---------- catálogo ---------- */
  function renderChips() {
    $('chips').innerHTML = CATEGORIAS.map(function (c) {
      return '<button class="chip" type="button" data-cat="' + c.id + '" aria-pressed="' +
        (estado.filtro === c.id) + '">' + escapar(c.nome) + '</button>';
    }).join('');
  }

  function renderGrade() {
    var termo = estado.busca.trim().toLowerCase();
    var lista = PRODUTOS.filter(function (p) {
      var okCat = estado.filtro === 'todos' || p.cat === estado.filtro;
      var okBusca = !termo || p.nome.toLowerCase().indexOf(termo) !== -1 || p.desc.toLowerCase().indexOf(termo) !== -1;
      return okCat && okBusca;
    });

    $('grade').innerHTML = lista.map(function (p) {
      var tag = p.esgotado ? '<span class="tag esgotado">Esgotado</span>' : '';
      var nomeCat = (CATEGORIAS.filter(function (c) { return c.id === p.cat; })[0] || {}).nome || '';
      return '<li class="card">' +
        '<div class="arte">' + arte(p) + '<span class="tag">' + escapar(nomeCat) + '</span>' + tag + '</div>' +
        '<div class="info">' +
          '<h3>' + escapar(p.nome) + '</h3>' +
          '<p class="desc">' + escapar(p.desc) + '</p>' +
          '<p class="preco">' + BRL.format(p.preco) + '</p>' +
          '<button class="btn-add" type="button" data-add="' + p.id + '"' + (p.esgotado ? ' disabled' : '') + '>' +
            (p.esgotado ? 'Indisponível' : 'Adicionar') +
          '</button>' +
        '</div>' +
      '</li>';
    }).join('');

    $('contagem').textContent = lista.length === 1 ? '1 produto' : lista.length + ' produtos';
    $('vazio').hidden = lista.length > 0;
  }

  /* ---------- carrinho ---------- */
  function adicionar(id) {
    var p = achar(id);
    if (!p || p.esgotado) return;
    estado.carrinho[id] = Math.min((estado.carrinho[id] || 0) + 1, 20);
    salvarCarrinho();
    atualizarTudo();
    toast(p.nome + ' adicionado ao carrinho');
  }
  function alterar(id, delta) {
    var nova = (estado.carrinho[id] || 0) + delta;
    if (nova <= 0) delete estado.carrinho[id];
    else estado.carrinho[id] = Math.min(nova, 20);
    salvarCarrinho();
    atualizarTudo();
  }
  function remover(id) {
    delete estado.carrinho[id];
    salvarCarrinho();
    atualizarTudo();
  }

  function renderCarrinho() {
    var itens = itensCarrinho();
    $('itens').innerHTML = itens.map(function (i) {
      return '<li class="item">' +
        '<div class="mini">' + arte(i.p) + '</div>' +
        '<div>' +
          '<h4>' + escapar(i.p.nome) + '</h4>' +
          '<p class="unit">' + BRL.format(i.p.preco) + ' cada</p>' +
          '<div class="qtd">' +
            '<button type="button" data-menos="' + i.p.id + '" aria-label="Diminuir quantidade de ' + escapar(i.p.nome) + '">−</button>' +
            '<span aria-live="polite">' + i.qtd + '</span>' +
            '<button type="button" data-mais="' + i.p.id + '" aria-label="Aumentar quantidade de ' + escapar(i.p.nome) + '">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="lado">' +
          '<span class="linha-preco">' + BRL.format(i.linha) + '</span>' +
          '<button class="remover" type="button" data-remover="' + i.p.id + '">Remover</button>' +
        '</div>' +
      '</li>';
    }).join('');
    $('carrinho-vazio').hidden = itens.length > 0;
    $('subtotal').textContent = BRL.format(subtotal());
    $('ir-checkout').disabled = itens.length === 0;
  }

  function atualizarContador() {
    var q = quantidadeTotal();
    $('contador').textContent = q;
    $('abrir-carrinho').setAttribute('aria-label', 'Carrinho, ' + q + (q === 1 ? ' item' : ' itens'));
  }

  function atualizarTudo() {
    atualizarContador();
    renderCarrinho();
    if (!$('view-checkout').hidden) renderResumo();
  }

  function abrirCarrinho() {
    estado.ultimoFoco = document.activeElement;
    $('carrinho').classList.add('aberto');
    $('carrinho').setAttribute('aria-hidden', 'false');
    $('overlay').hidden = false;
    $('abrir-carrinho').setAttribute('aria-expanded', 'true');
    $('fechar-carrinho').focus();
  }
  function fecharCarrinho(devolverFoco) {
    $('carrinho').classList.remove('aberto');
    $('carrinho').setAttribute('aria-hidden', 'true');
    $('overlay').hidden = true;
    $('abrir-carrinho').setAttribute('aria-expanded', 'false');
    if (devolverFoco !== false && estado.ultimoFoco) estado.ultimoFoco.focus();
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('visivel'); }, 2200);
  }

  /* ---------- navegação entre etapas ---------- */
  var VIEWS = { catalogo: 'view-catalogo', checkout: 'view-checkout', pix: 'view-pix', sucesso: 'view-sucesso' };
  var TITULOS = { catalogo: 'titulo-catalogo', checkout: 'titulo-checkout', pix: 'titulo-pix', sucesso: 'titulo-sucesso' };

  function irPara(etapa) {
    if (etapa === 'checkout' && quantidadeTotal() === 0) { toast('Adicione produtos antes de finalizar'); return; }
    fecharCarrinho(false);
    Object.keys(VIEWS).forEach(function (k) { $(VIEWS[k]).hidden = k !== etapa; });
    if (etapa === 'checkout') renderResumo();
    if (etapa !== 'pix') pararTimer();
    if (etapa === 'pix') iniciarPix();
    window.scrollTo({ top: 0, behavior: 'auto' });
    $(TITULOS[etapa]).focus({ preventScroll: true });
  }

  function renderResumo() {
    var itens = itensCarrinho();
    $('resumo-lista').innerHTML = itens.map(function (i) {
      return '<li><span>' + escapar(i.p.nome) + ' <small>' + i.qtd + ' × ' + BRL.format(i.p.preco) + '</small></span>' +
        '<strong>' + BRL.format(i.linha) + '</strong></li>';
    }).join('');
    $('resumo-subtotal').textContent = BRL.format(subtotal());
    var temDesc = !!estado.cupom;
    $('linha-desconto').hidden = !temDesc;
    $('resumo-desconto').textContent = '-' + BRL.format(descontoValor());
    $('resumo-total').textContent = BRL.format(total());
  }

  /* ---------- cupom ---------- */
  function aplicarCupom() {
    var codigo = $('cupom-input').value.trim().toUpperCase();
    var msg = $('cupom-msg');
    if (!codigo) {
      estado.cupom = null;
      msg.textContent = 'Digite um cupom para aplicar.';
      msg.className = 'msg nok';
    } else if (CUPONS[codigo] !== undefined) {
      estado.cupom = { codigo: codigo, pct: CUPONS[codigo] };
      msg.textContent = 'Cupom ' + codigo + ' aplicado: 10% de desconto.';
      msg.className = 'msg ok';
    } else {
      estado.cupom = null;
      msg.textContent = 'Cupom inválido. Experimente DEMO10.';
      msg.className = 'msg nok';
    }
    renderResumo();
  }

  /* ---------- formulário ---------- */
  function validarCampo(input, erroId, ok) {
    var erro = $(erroId);
    erro.hidden = ok;
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  function validarFormulario() {
    var nome = $('nome').value.trim();
    var email = $('email').value.trim();
    var zap = $('whatsapp').value.replace(/\D/g, '');
    var okNome = validarCampo($('nome'), 'erro-nome', nome.length >= 3 && nome.indexOf(' ') !== -1);
    var okEmail = validarCampo($('email'), 'erro-email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
    var okZap = validarCampo($('whatsapp'), 'erro-whatsapp', zap.length === 10 || zap.length === 11);
    return okNome && okEmail && okZap;
  }

  /* ---------- Pix (simulado) ---------- */
  function gerarPedido() {
    return '#' + String(Math.floor(1000 + Math.random() * 9000));
  }

  function iniciarPix() {
    if (!estado.pedido) estado.pedido = gerarPedido();
    $('pix-valor').textContent = BRL.format(total());
    $('pix-codigo').value = 'DEMO-PIX-' + estado.pedido.slice(1) + '-SIMULACAO-NAO-PAGAVEL';
    $('copia-msg').textContent = '';
    desenharQr(estado.pedido);
    pararTimer();
    var restante = PIX_SEGUNDOS;
    mostrarTempo(restante);
    estado.timer = setInterval(function () {
      restante -= 1;
      mostrarTempo(restante);
      if (restante <= 0) {
        pararTimer();
        $('timer').textContent = 'expirado';
        toast('O tempo do Pix expirou (simulação). Gere um novo código.');
        $('simular-pago').disabled = true;
      }
    }, 1000);
    $('simular-pago').disabled = false;
  }

  function mostrarTempo(s) {
    var m = Math.floor(s / 60), r = s % 60;
    $('timer').textContent = (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function pararTimer() {
    if (estado.timer) { clearInterval(estado.timer); estado.timer = null; }
  }

  /* QR de demonstração: padrão decorativo com cantos de posicionamento. Não codifica nada real. */
  function desenharQr(semente) {
    var n = 25, s = 0;
    for (var k = 0; k < semente.length; k++) s = (s * 31 + semente.charCodeAt(k)) >>> 0;
    function rnd() { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) & 1; }
    var grade = [];
    for (var y = 0; y < n; y++) {
      grade[y] = [];
      for (var x = 0; x < n; x++) grade[y][x] = rnd();
    }
    function canto(cx, cy) {
      for (var dy = 0; dy < 7; dy++) for (var dx = 0; dx < 7; dx++) {
        var borda = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        var miolo = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        grade[cy + dy][cx + dx] = (borda || miolo) ? 1 : 0;
      }
    }
    canto(0, 0); canto(n - 7, 0); canto(0, n - 7);
    var partes = [];
    for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) {
      if (grade[yy][xx]) partes.push('M' + xx + ' ' + yy + 'h1v1h-1z');
    }
    $('qr').innerHTML = '<rect width="25" height="25" fill="#FFFFFF"/><path fill="#17141D" d="' + partes.join('') + '"/>';
  }

  /* ---------- eventos ---------- */
  function ligar() {
    $('chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      estado.filtro = b.getAttribute('data-cat');
      renderChips();
      renderGrade();
    });

    $('busca').addEventListener('input', function (e) {
      estado.busca = e.target.value;
      renderGrade();
    });

    $('grade').addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]');
      if (b) adicionar(b.getAttribute('data-add'));
    });

    $('itens').addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-mais')) alterar(t.getAttribute('data-mais'), 1);
      else if (t.hasAttribute('data-menos')) alterar(t.getAttribute('data-menos'), -1);
      else if (t.hasAttribute('data-remover')) remover(t.getAttribute('data-remover'));
    });

    $('abrir-carrinho').addEventListener('click', abrirCarrinho);
    $('fechar-carrinho').addEventListener('click', function () { fecharCarrinho(); });
    $('overlay').addEventListener('click', function () { fecharCarrinho(); });
    $('ir-checkout').addEventListener('click', function () { irPara('checkout'); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('carrinho').classList.contains('aberto')) fecharCarrinho();
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ir]');
      if (!b) return;
      var destino = b.getAttribute('data-ir');
      if (destino === 'catalogo') estado.pedido = null;
      irPara(destino);
    });

    $('aplicar-cupom').addEventListener('click', aplicarCupom);
    $('cupom-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); aplicarCupom(); }
    });

    $('form-checkout').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validarFormulario()) {
        var primeiroErro = document.querySelector('#form-checkout [aria-invalid="true"]');
        if (primeiroErro) primeiroErro.focus();
        return;
      }
      estado.pedido = null;
      irPara('pix');
    });

    $('whatsapp').addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 11);
      var f = d;
      if (d.length > 2) f = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + (d.length > 7 ? '-' + d.slice(7) : '');
      e.target.value = f;
    });

    $('copiar-pix').addEventListener('click', function () {
      var campo = $('pix-codigo');
      campo.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      $('copia-msg').textContent = ok ? 'Código copiado (demonstração).' : 'Selecione o código e copie manualmente.';
      $('copia-msg').className = 'msg ' + (ok ? 'ok' : 'nok');
    });

    $('simular-pago').addEventListener('click', function () {
      pararTimer();
      var num = estado.pedido || gerarPedido();
      $('pedido-num').textContent = num;
      estado.carrinho = {};
      estado.cupom = null;
      salvarCarrinho();
      estado.pedido = null;
      atualizarTudo();
      $('cupom-input').value = '';
      $('cupom-msg').textContent = '';
      irPara('sucesso');
    });
  }

  /* ---------- início ---------- */
  renderChips();
  renderGrade();
  atualizarTudo();
  ligar();
})();
