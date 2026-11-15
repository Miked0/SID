/* Loja demo com Pix · Solution Innova Digital (Ateliê Vó Nena, fictício)
   Tudo local: sem backend, sem chave Pix real, sem dados de clientes.
   O pagamento é simulado pelo botão "Simular pagamento aprovado". */
(function () {
  'use strict';

  var TAM_ROUPA = ['PP', 'P', 'M', 'G', 'GG'];
  var TAM_CALCADO = ['38', '39', '40', '41', '42', '43'];
  var CORES_TRACO = [
    { n: 'Roxo Órbita', c: '#6516BD' },
    { n: 'Noite', c: '#2B0A57' },
    { n: 'Menta', c: '#68E0BC' }
  ];

  var PRODUTOS = [
    { id: 'p1', nome: 'Camiseta Algodão', cat: 'vestuario', preco: 59.9, cor: '#6516BD', esgotado: false,
      desc: 'Malha penteada, modelagem reta.',
      detalhe: 'Algodão penteado 30.1, gola reforçada e costura dupla. Lavar do avesso em água fria.',
      tamanhos: TAM_ROUPA, cores: CORES_TRACO },
    { id: 'p2', nome: 'Moletom Noite', cat: 'vestuario', preco: 149.9, cor: '#2B0A57', esgotado: false,
      desc: 'Felpado por dentro, capuz forrado.',
      detalhe: 'Moletom 400 g/m², bolso canguru e punhos em ribana. Ideal para dias frios.',
      tamanhos: TAM_ROUPA, cores: CORES_TRACO },
    { id: 'p3', nome: 'Meia Cano Alto', cat: 'vestuario', preco: 49.9, cor: '#6516BD', esgotado: false,
      desc: 'Kit com 3 pares, algodão.',
      detalhe: 'Kit com três pares de algodão com elastano. Tamanho único, 37 a 43.' },
    { id: 'p4', nome: 'Tênis Corrida Leve', cat: 'calcados', preco: 329.9, cor: '#68E0BC', esgotado: false,
      desc: 'Entressola macia, solado antiderrapante.',
      detalhe: 'Entressola de espuma leve, cabedal respirável e solado de borracha com tração.',
      tamanhos: TAM_CALCADO, cores: [{ n: 'Menta', c: '#68E0BC' }, { n: 'Noite', c: '#2B0A57' }] },
    { id: 'p5', nome: 'Chinelo Sol', cat: 'calcados', preco: 79.9, cor: '#B9A3E3', esgotado: false,
      desc: 'Tiras em couro sintético.',
      detalhe: 'Tiras em couro sintético, palmilha macia e solado antiderrapante.',
      tamanhos: ['37', '38', '39', '40', '41'], cores: [{ n: 'Lilás', c: '#B9A3E3' }, { n: 'Noite', c: '#2B0A57' }] },
    { id: 'p6', nome: 'Boné Órbita', cat: 'acessorios', preco: 69.9, cor: '#6516BD', esgotado: false,
      desc: 'Aba curva, ajuste traseiro.',
      detalhe: 'Sarja de algodão, aba curva e ajuste traseiro em fivela.',
      cores: CORES_TRACO },
    { id: 'p7', nome: 'Mochila Urbana 20L', cat: 'acessorios', preco: 199.0, cor: '#2B0A57', esgotado: true,
      desc: 'Compartimento para notebook.',
      detalhe: 'Compartimento acolchoado para notebook de até 15 polegadas e bolso frontal.',
      cores: [{ n: 'Noite', c: '#2B0A57' }, { n: 'Menta', c: '#68E0BC' }] },
    { id: 'p8', nome: 'Garrafa Térmica 500 ml', cat: 'casa', preco: 89.9, cor: '#68E0BC', esgotado: false,
      desc: 'Aço inox, mantém a bebida por horas.',
      detalhe: 'Parede dupla de aço inox, tampa à prova de vazamento. Mantém gelada por 12 horas.',
      cores: [{ n: 'Menta', c: '#68E0BC' }, { n: 'Noite', c: '#2B0A57' }, { n: 'Lilás', c: '#B9A3E3' }] },
    { id: 'p9', nome: 'Caneca Foguete', cat: 'casa', preco: 39.9, cor: '#6516BD', esgotado: false,
      desc: 'Cerâmica 350 ml, pode ir ao micro-ondas.',
      detalhe: 'Cerâmica esmaltada de 350 ml. Pode ir ao micro-ondas e à lava-louças.',
      cores: CORES_TRACO },
    { id: 'p10', nome: 'Cápsulas de Café', cat: 'casa', preco: 27.5, cor: '#B9A3E3', esgotado: false,
      desc: 'Caixa com 10 cápsulas, intensidade média.',
      detalhe: 'Caixa com 10 cápsulas compatíveis com máquinas padrão. Intensidade média.' },
    { id: 'p11', nome: 'Caderno Pontilhado A5', cat: 'papelaria', preco: 34.9, cor: '#68E0BC', esgotado: false,
      desc: '96 folhas, capa dura, marcador.',
      detalhe: '96 folhas pontilhadas, capa dura, marcador de página e elástico.' },
    { id: 'p12', nome: 'Kit Post-it Menta', cat: 'papelaria', preco: 24.9, cor: '#B9A3E3', esgotado: false,
      desc: 'Três blocos em tons de menta e lilás.',
      detalhe: 'Três blocos adesivos de 76 × 76 mm em menta, lilás e branco.' }
  ];

  var CATEGORIAS = [
    { id: 'todos', nome: 'Todos' },
    { id: 'vestuario', nome: 'Vestuário' },
    { id: 'calcados', nome: 'Calçados' },
    { id: 'acessorios', nome: 'Acessórios' },
    { id: 'casa', nome: 'Casa' },
    { id: 'papelaria', nome: 'Papelaria' }
  ];

  /* Frete fictício por primeiro dígito do CEP (aproximação, só para demonstração). */
  var FRETE = {
    '0': { regiao: 'Região de São Paulo (capital)', valor: 19.9, prazo: 3 },
    '1': { regiao: 'Interior de São Paulo', valor: 24.9, prazo: 4 },
    '2': { regiao: 'Rio de Janeiro e Espírito Santo', valor: 32.9, prazo: 6 },
    '3': { regiao: 'Minas Gerais', valor: 29.9, prazo: 5 },
    '4': { regiao: 'Bahia e Sergipe', valor: 49.9, prazo: 9 },
    '5': { regiao: 'Pernambuco, Alagoas, Paraíba e Rio Grande do Norte', valor: 49.9, prazo: 9 },
    '6': { regiao: 'Ceará, Piauí, Maranhão, Pará e Norte', valor: 49.9, prazo: 10 },
    '7': { regiao: 'Centro-Oeste e Tocantins', valor: 39.9, prazo: 7 },
    '8': { regiao: 'Paraná e Santa Catarina', valor: 36.9, prazo: 6 },
    '9': { regiao: 'Rio Grande do Sul', valor: 44.9, prazo: 8 }
  };
  var FRETE_GRATIS_ACIMA = 299;

  var CUPONS = { DEMO10: 0.10 };
  var CHAVE = 'sid-loja-demo-carrinho';
  var CHAVE_PEDIDOS = 'sid-loja-demo-pedidos';
  var CHAVE_TEMA = 'sid-loja-demo-tema';
  var PIX_SEGUNDOS = 600;

  var BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var $ = function (id) { return document.getElementById(id); };

  var estado = {
    carrinho: {},        // { chave: quantidade }, chave = id|tamanho|cor
    filtro: 'todos',
    busca: '',
    ordem: 'relevancia', // relevancia | menor | maior
    cupom: null,         // { codigo, pct }
    frete: null,         // { cep, regiao, valor, prazo }
    pdp: null,           // { id, tam, cor, qtd }
    timer: null,
    pedido: null,
    ultimoFoco: null
  };
  estado.carrinho = lerCarrinho();

  /* ---------- armazenamento (tolerante a bloqueio) ---------- */
  function lerJSON(chave, padrao) {
    try {
      var bruto = window.localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { window.localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ }
  }

  function lerCarrinho() {
    var obj = lerJSON(CHAVE, {});
    var limpo = {};
    Object.keys(obj || {}).forEach(function (chave) {
      var v = parseChave(chave);
      if (v && v.p && obj[chave] > 0) limpo[chave] = Math.min(obj[chave], 20);
    });
    return limpo;
  }
  function salvarCarrinho() { gravar(CHAVE, estado.carrinho); }

  function lerPedidos() {
    var lista = lerJSON(CHAVE_PEDIDOS, []);
    return Array.isArray(lista) ? lista.slice(0, 5) : [];
  }
  function salvarPedido(pedido) {
    gravar(CHAVE_PEDIDOS, [pedido].concat(lerPedidos()).slice(0, 5));
  }

  /* ---------- produtos e variantes ---------- */
  function achar(id) {
    for (var i = 0; i < PRODUTOS.length; i++) if (PRODUTOS[i].id === id) return PRODUTOS[i];
    return null;
  }
  function chave(id, tam, cor) {
    return id + '|' + (tam || '') + '|' + (cor || '');
  }
  function parseChave(k) {
    var partes = String(k).split('|');
    var p = achar(partes[0]);
    if (!p) return null;
    var tam = partes[1] || '';
    var cor = partes[2] || '';
    if (tam && (!p.tamanhos || p.tamanhos.indexOf(tam) === -1)) return null;
    if (cor && (!p.cores || !p.cores.some(function (c) { return c.n === cor; }))) return null;
    return { p: p, tam: tam, cor: cor };
  }
  function hexDaCor(p, nome) {
    if (!nome || !p.cores) return p.cor;
    for (var i = 0; i < p.cores.length; i++) if (p.cores[i].n === nome) return p.cores[i].c;
    return p.cor;
  }
  function temOpcoes(p) {
    return !!(p.tamanhos || p.cores);
  }
  function descVariante(v) {
    var partes = [];
    if (v.tam) partes.push('Tam. ' + v.tam);
    if (v.cor) partes.push(v.cor);
    return partes.join(' · ');
  }

  /* Arte do produto: forma geométrica da marca, sem imagens externas. */
  function arte(p, hex) {
    var c = hex || p.cor;
    var forma = {
      vestuario: '<path d="M30 20 L44 12 Q50 18 56 12 L70 20 L80 34 L72 40 L70 88 L30 88 L28 40 L20 34 Z" fill="' + c + '"/>',
      calcados: '<path d="M18 62 Q18 40 34 40 L48 48 L76 52 Q84 54 84 64 L84 72 L18 72 Z" fill="' + c + '"/>',
      acessorios: '<circle cx="50" cy="56" r="26" fill="' + c + '"/><rect x="36" y="22" width="28" height="12" rx="6" fill="' + c + '"/>',
      casa: '<rect x="28" y="32" width="36" height="50" rx="8" fill="' + c + '"/><path d="M64 44 Q80 44 80 58 Q80 72 64 72" fill="none" stroke="' + c + '" stroke-width="6"/>',
      papelaria: '<rect x="26" y="22" width="48" height="60" rx="4" fill="' + c + '"/><path d="M36 40h28M36 52h28M36 64h20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
    }[p.cat];
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + forma + '</svg>';
  }

  function escapar(txt) {
    return String(txt).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- cálculos ---------- */
  function itensCarrinho() {
    return Object.keys(estado.carrinho).map(function (k) {
      var v = parseChave(k);
      var q = estado.carrinho[k];
      return { chave: k, p: v.p, tam: v.tam, cor: v.cor, qtd: q, linha: v.p.preco * q };
    });
  }
  function subtotal() {
    return itensCarrinho().reduce(function (s, i) { return s + i.linha; }, 0);
  }
  function descontoValor() {
    return estado.cupom ? subtotal() * estado.cupom.pct : 0;
  }
  function freteValor() {
    if (!estado.frete) return 0;
    return subtotal() >= FRETE_GRATIS_ACIMA ? 0 : estado.frete.valor;
  }
  function total() {
    return subtotal() - descontoValor() + freteValor();
  }
  function quantidadeTotal() {
    return Object.keys(estado.carrinho).reduce(function (s, k) { return s + estado.carrinho[k]; }, 0);
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
    if (estado.ordem === 'menor') lista = lista.slice().sort(function (a, b) { return a.preco - b.preco; });
    if (estado.ordem === 'maior') lista = lista.slice().sort(function (a, b) { return b.preco - a.preco; });

    $('grade').innerHTML = lista.map(function (p, i) {
      var tag = p.esgotado ? '<span class="tag esgotado">Esgotado</span>' : '';
      var nomeCat = (CATEGORIAS.filter(function (c) { return c.id === p.cat; })[0] || {}).nome || '';
      var acao;
      if (p.esgotado) acao = '<button class="btn-add" type="button" disabled>Indisponível</button>';
      else if (temOpcoes(p)) acao = '<button class="btn-add" type="button" data-abrir="' + p.id + '">Escolher opções</button>';
      else acao = '<button class="btn-add" type="button" data-add="' + p.id + '">Adicionar</button>';
      return '<li class="card" style="--i:' + Math.min(i, 8) + '">' +
        '<button class="arte arte-btn" type="button" data-abrir="' + p.id + '" aria-label="Ver detalhes de ' + escapar(p.nome) + '">' +
          arte(p) + '<span class="tag">' + escapar(nomeCat) + '</span>' + tag +
        '</button>' +
        '<div class="info">' +
          '<h3>' + escapar(p.nome) + '</h3>' +
          '<p class="desc">' + escapar(p.desc) + '</p>' +
          '<p class="preco">' + BRL.format(p.preco) + '</p>' +
          acao +
        '</div>' +
      '</li>';
    }).join('');

    $('contagem').textContent = lista.length === 1 ? '1 produto' : lista.length + ' produtos';
    $('vazio').hidden = lista.length > 0;
  }

  /* ---------- página do produto ---------- */
  function abrirProduto(id) {
    var p = achar(id);
    if (!p) return;
    estado.pdp = {
      id: id,
      tam: '',
      cor: p.cores ? p.cores[0].n : '',
      qtd: 1
    };
    irPara('produto');
  }

  function renderProduto() {
    var s = estado.pdp;
    var p = achar(s.id);
    if (!p) return;
    $('pdp-categoria').textContent = (CATEGORIAS.filter(function (c) { return c.id === p.cat; })[0] || {}).nome || '';
    $('titulo-produto').textContent = p.nome;
    $('pdp-desc').textContent = p.detalhe;
    $('pdp-arte').innerHTML = arte(p, hexDaCor(p, s.cor));
    $('pdp-arte').setAttribute('data-cor', hexDaCor(p, s.cor));
    $('pdp-preco').textContent = BRL.format(p.preco);

    $('bloco-tamanhos').hidden = !p.tamanhos;
    if (p.tamanhos) {
      $('pdp-tamanhos').innerHTML = p.tamanhos.map(function (t) {
        return '<button type="button" class="opcao" data-tam="' + escapar(t) + '" aria-pressed="' + (s.tam === t) + '">' + escapar(t) + '</button>';
      }).join('');
    }

    $('bloco-cores').hidden = !p.cores;
    if (p.cores) {
      $('cor-atual').textContent = s.cor;
      $('pdp-cores').innerHTML = p.cores.map(function (c) {
        return '<button type="button" class="opcao cor" data-cor="' + escapar(c.n) + '" aria-pressed="' + (s.cor === c.n) +
          '" aria-label="' + escapar(c.n) + '" title="' + escapar(c.n) + '"><span class="swatch" style="background:' + c.c + '"></span></button>';
      }).join('');
    }

    $('pqtd').textContent = s.qtd;
    $('pdp-msg').textContent = '';
    $('pdp-msg').className = 'msg';
  }

  function adicionarDaPagina() {
    var s = estado.pdp;
    var p = achar(s.id);
    if (!p) return;
    if (p.tamanhos && !s.tam) {
      $('pdp-msg').textContent = 'Escolha um tamanho para continuar.';
      $('pdp-msg').className = 'msg nok';
      $('pdp-tamanhos').querySelector('button').focus();
      return;
    }
    var k = chave(p.id, s.tam, s.cor);
    estado.carrinho[k] = Math.min((estado.carrinho[k] || 0) + s.qtd, 20);
    salvarCarrinho();
    atualizarTudo();
    toast(p.nome + (s.tam || s.cor ? ' (' + descVariante({ tam: s.tam, cor: s.cor }) + ')' : '') + ' adicionado');
    $('pdp-msg').textContent = 'Adicionado ao carrinho.';
    $('pdp-msg').className = 'msg ok';
  }

  /* ---------- carrinho ---------- */
  function adicionarRapido(id) {
    var p = achar(id);
    if (!p || p.esgotado || temOpcoes(p)) return;
    var k = chave(p.id, '', '');
    estado.carrinho[k] = Math.min((estado.carrinho[k] || 0) + 1, 20);
    salvarCarrinho();
    atualizarTudo();
    toast(p.nome + ' adicionado ao carrinho');
  }
  function alterar(k, delta) {
    var nova = (estado.carrinho[k] || 0) + delta;
    if (nova <= 0) delete estado.carrinho[k];
    else estado.carrinho[k] = Math.min(nova, 20);
    salvarCarrinho();
    atualizarTudo();
  }
  function remover(k) {
    delete estado.carrinho[k];
    salvarCarrinho();
    atualizarTudo();
  }

  function renderCarrinho() {
    var itens = itensCarrinho();
    $('itens').innerHTML = itens.map(function (i) {
      var var_ = descVariante(i);
      return '<li class="item">' +
        '<div class="mini">' + arte(i.p, hexDaCor(i.p, i.cor)) + '</div>' +
        '<div>' +
          '<h4>' + escapar(i.p.nome) + '</h4>' +
          (var_ ? '<p class="variante">' + escapar(var_) + '</p>' : '') +
          '<p class="unit">' + BRL.format(i.p.preco) + ' cada</p>' +
          '<div class="qtd">' +
            '<button type="button" data-menos="' + escapar(i.chave) + '" aria-label="Diminuir quantidade de ' + escapar(i.p.nome) + '">−</button>' +
            '<span aria-live="polite">' + i.qtd + '</span>' +
            '<button type="button" data-mais="' + escapar(i.chave) + '" aria-label="Aumentar quantidade de ' + escapar(i.p.nome) + '">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="lado">' +
          '<span class="linha-preco">' + BRL.format(i.linha) + '</span>' +
          '<button class="remover" type="button" data-remover="' + escapar(i.chave) + '">Remover</button>' +
        '</div>' +
      '</li>';
    }).join('');
    $('carrinho-vazio').hidden = itens.length > 0;
    $('subtotal').textContent = BRL.format(subtotal());
    $('ir-checkout').disabled = itens.length === 0;
  }

  function atualizarContador() {
    var q = quantidadeTotal();
    var badge = $('contador');
    badge.textContent = q;
    badge.classList.remove('pulsa');
    void badge.offsetWidth;
    badge.classList.add('pulsa');
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
  var VIEWS = { catalogo: 'view-catalogo', produto: 'view-produto', checkout: 'view-checkout', pix: 'view-pix', sucesso: 'view-sucesso' };
  var TITULOS = { catalogo: 'titulo-catalogo', produto: 'titulo-produto', checkout: 'titulo-checkout', pix: 'titulo-pix', sucesso: 'titulo-sucesso' };

  function irPara(etapa) {
    if (etapa === 'checkout' && quantidadeTotal() === 0) { toast('Adicione produtos antes de finalizar'); return; }
    fecharCarrinho(false);
    if (etapa === 'produto') renderProduto();
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
      var var_ = descVariante(i);
      return '<li><span>' + escapar(i.p.nome) + (var_ ? ' <small>' + escapar(var_) + '</small>' : '') +
        ' <small>' + i.qtd + ' × ' + BRL.format(i.p.preco) + '</small></span>' +
        '<strong>' + BRL.format(i.linha) + '</strong></li>';
    }).join('');
    $('resumo-subtotal').textContent = BRL.format(subtotal());
    $('linha-desconto').hidden = !estado.cupom;
    $('resumo-desconto').textContent = '-' + BRL.format(descontoValor());
    if (!estado.frete) $('resumo-frete').textContent = 'Informe o CEP';
    else if (freteValor() === 0) $('resumo-frete').textContent = 'Grátis';
    else $('resumo-frete').textContent = BRL.format(freteValor());
    $('resumo-total').textContent = BRL.format(total());
  }

  /* ---------- frete por CEP (simulado) ---------- */
  function calcularFrete() {
    var cep = $('cep').value.replace(/\D/g, '');
    var erro = $('erro-cep');
    var msg = $('frete-msg');
    if (cep.length !== 8) {
      erro.hidden = false;
      $('cep').setAttribute('aria-invalid', 'true');
      estado.frete = null;
      msg.textContent = '';
      renderResumo();
      return false;
    }
    erro.hidden = true;
    $('cep').setAttribute('aria-invalid', 'false');
    var f = FRETE[cep.charAt(0)];
    estado.frete = { cep: cep, regiao: f.regiao, valor: f.valor, prazo: f.prazo };
    var gratis = subtotal() >= FRETE_GRATIS_ACIMA;
    msg.textContent = 'Entrega em até ' + f.prazo + ' dias úteis para ' + f.regiao + '. ' +
      (gratis ? 'Frete grátis nesta compra.' : 'Frete ' + BRL.format(f.valor) + '.');
    msg.className = 'msg ok';
    renderResumo();
    return true;
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
    $(erroId).hidden = ok;
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
    var okFrete = !!estado.frete;
    if (!okFrete) {
      $('erro-cep').hidden = false;
      $('cep').setAttribute('aria-invalid', 'true');
      $('cep').focus();
    }
    return okNome && okEmail && okZap && okFrete;
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

  /* ---------- pedidos recentes (neste navegador) ---------- */
  function mostrarPedidos() {
    var lista = lerPedidos();
    $('bloco-pedidos').hidden = lista.length === 0;
    $('pedidos-recentes').innerHTML = lista.map(function (p) {
      var itens = p.itens === 1 ? '1 item' : p.itens + ' itens';
      return '<li><span><strong>' + escapar(p.numero) + '</strong> · ' + escapar(p.data) + ' · ' + itens + '</span>' +
        '<strong>' + BRL.format(p.total) + '</strong></li>';
    }).join('');
  }

  /* ---------- tema Light Noir ---------- */
  function aplicarTema(noir) {
    if (noir) document.documentElement.setAttribute('data-theme', 'light-noir');
    else document.documentElement.removeAttribute('data-theme');
    $('tema').setAttribute('aria-pressed', noir ? 'true' : 'false');
  }
  function alternarTema() {
    var noir = document.documentElement.getAttribute('data-theme') !== 'light-noir';
    aplicarTema(noir);
    gravar(CHAVE_TEMA, noir);
  }

  /* ---------- eventos ---------- */
  function ligar() {
    $('tema').addEventListener('click', alternarTema);

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

    $('ordem').addEventListener('change', function (e) {
      estado.ordem = e.target.value;
      renderGrade();
    });

    $('grade').addEventListener('click', function (e) {
      var ver = e.target.closest('[data-abrir]');
      if (ver) { abrirProduto(ver.getAttribute('data-abrir')); return; }
      var b = e.target.closest('[data-add]');
      if (b) adicionarRapido(b.getAttribute('data-add'));
    });

    $('view-produto').addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !estado.pdp) return;
      if (t.hasAttribute('data-tam')) { estado.pdp.tam = t.getAttribute('data-tam'); renderProduto(); }
      else if (t.hasAttribute('data-cor')) { estado.pdp.cor = t.getAttribute('data-cor'); renderProduto(); }
      else if (t.id === 'pqtd-mais') { estado.pdp.qtd = Math.min(estado.pdp.qtd + 1, 20); $('pqtd').textContent = estado.pdp.qtd; }
      else if (t.id === 'pqtd-menos') { estado.pdp.qtd = Math.max(estado.pdp.qtd - 1, 1); $('pqtd').textContent = estado.pdp.qtd; }
      else if (t.id === 'pdp-add') adicionarDaPagina();
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
      var aberto = $('carrinho').classList.contains('aberto');
      if (e.key === 'Escape' && aberto) { fecharCarrinho(); return; }
      if (e.key !== 'Tab' || !aberto) return;
      // Mantém o foco dentro da gaveta enquanto ela estiver aberta.
      var foco = Array.prototype.slice.call($('carrinho').querySelectorAll('button:not([disabled])'));
      if (!foco.length) return;
      var primeiro = foco[0], ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
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

    $('calcular-frete').addEventListener('click', calcularFrete);
    $('cep').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calcularFrete(); }
    });
    $('cep').addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 8);
      e.target.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
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
      salvarPedido({
        numero: num,
        data: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        itens: quantidadeTotal(),
        total: total()
      });
      $('pedido-num').textContent = num;
      mostrarPedidos();
      estado.carrinho = {};
      estado.cupom = null;
      estado.frete = null;
      salvarCarrinho();
      estado.pedido = null;
      atualizarTudo();
      $('cupom-input').value = '';
      $('cupom-msg').textContent = '';
      $('cep').value = '';
      $('frete-msg').textContent = '';
      irPara('sucesso');
    });
  }

  /* ---------- início ---------- */
  aplicarTema(lerJSON(CHAVE_TEMA, false) === true);
  mostrarPedidos();
  renderChips();
  renderGrade();
  atualizarTudo();
  ligar();
})();
