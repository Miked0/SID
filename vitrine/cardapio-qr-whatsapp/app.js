/* Cardápio digital com QR code e pedido pelo WhatsApp: demonstração SID.
   Dados de exemplo. Nenhum pedido sai da página sem o toque de quem pede:
   o pedido vira uma mensagem pronta em um link wa.me. O carrinho fica salvo
   só neste navegador (localStorage), por mesa. */
(function () {
  'use strict';

  var CONFIG = {
    restaurante: 'Casa Brasa',
    // Número de exemplo (DDI 55 + DDD + número). Troque pelo WhatsApp do restaurante.
    whatsapp: '5511900000000',
    mesaPadrao: '12',
    qtdMax: 20
  };

  // Cardápio de exemplo. Preços em centavos.
  var CARDAPIO = [
    {
      id: 'lanches', nome: 'Lanches', itens: [
        { id: 'smash-classico', nome: 'Smash Clássico', desc: 'Pão brioche, 2 smashs de 90 g, cheddar, picles e molho da casa.', preco: 2800, cor: 'roxo' },
        { id: 'smash-bacon', nome: 'Smash Bacon', desc: 'Bacon crocante, cebola caramelizada e cheddar duplo.', preco: 3400, cor: 'menta' },
        { id: 'frango-crocante', nome: 'Frango Crocante', desc: 'Filé empanado na casa, alface, tomate e maionese defumada.', preco: 2900, cor: 'roxo' },
        { id: 'veggie-grao', nome: 'Veggie de Grão-de-Bico', desc: 'Hambúrguer de grão-de-bico, rúcula, tomate seco e pão australiano.', preco: 2700, cor: 'menta', tags: ['vegano'] }
      ]
    },
    {
      id: 'porcoes', nome: 'Porções', itens: [
        { id: 'batata-rustica', nome: 'Batata Rústica', desc: 'Porção de 400 g com alecrim, páprica e sal grosso.', preco: 2200, cor: 'menta', tags: ['vegano'] },
        { id: 'aneis-cebola', nome: 'Anéis de Cebola', desc: 'Porção de 300 g com molho defumado.', preco: 2400, cor: 'roxo' },
        { id: 'mandioca-queijo', nome: 'Mandioca com Queijo Coalho', desc: 'Mandioca frita, queijo coalho grelhado e geleia de pimenta.', preco: 2600, cor: 'roxo', indisponivel: true }
      ]
    },
    {
      id: 'bebidas', nome: 'Bebidas', itens: [
        { id: 'limonada-siciliana', nome: 'Limonada Siciliana', desc: 'Limão siciliano, hortelã e gengibre. 400 ml.', preco: 1000, cor: 'menta', tags: ['vegano'] },
        { id: 'refrigerante-lata', nome: 'Refrigerante em lata', desc: 'Lata de 350 ml. Consulte os sabores.', preco: 600, cor: 'roxo' },
        { id: 'agua-gas', nome: 'Água com gás', desc: 'Garrafa de 500 ml.', preco: 500, cor: 'menta', tags: ['vegano'] },
        { id: 'ipa-artesanal', nome: 'Cerveja IPA artesanal', desc: 'Garrafa de 500 ml, amargor cítrico. Venda para maiores de 18 anos.', preco: 2000, cor: 'roxo' }
      ]
    },
    {
      id: 'sobremesas', nome: 'Sobremesas', itens: [
        { id: 'brownie-sorvete', nome: 'Brownie com Sorvete', desc: 'Brownie morno de chocolate meio amargo com sorvete de baunilha.', preco: 1800, cor: 'roxo' },
        { id: 'petit-gateau', nome: 'Petit Gâteau', desc: 'Bolo de chocolate com centro cremoso e calda de frutas vermelhas.', preco: 2200, cor: 'menta' }
      ]
    }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var reduzirMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var carrinho = new Map(); // id -> quantidade
  var indice = {};          // id -> { item, categoria, li, saida, menos, mais }
  var mesa = lerMesa();
  var chaveSalva = 'sid-demo-cardapio-mesa-' + mesa;
  var filtroVegano = false;
  var termoBusca = '';

  var el = {
    categorias: document.getElementById('categorias'),
    secoes: document.getElementById('secoes'),
    mesaAtual: document.getElementById('mesa-atual'),
    busca: document.getElementById('busca'),
    filtroVegano: document.getElementById('filtro-vegano'),
    semResultado: document.getElementById('sem-resultado'),
    barra: document.getElementById('barra-pedido'),
    resumoQtd: document.getElementById('resumo-qtd'),
    resumoTotal: document.getElementById('resumo-total'),
    abrir: document.getElementById('abrir-pedido'),
    fechar: document.getElementById('fechar-pedido'),
    veu: document.getElementById('veu'),
    pedido: document.getElementById('pedido'),
    itens: document.getElementById('itens-pedido'),
    vazio: document.getElementById('vazio'),
    totalItens: document.getElementById('total-itens'),
    totalPedido: document.getElementById('total-pedido'),
    nome: document.getElementById('campo-nome'),
    obs: document.getElementById('campo-obs'),
    enviar: document.getElementById('enviar-pedido'),
    imprimir: document.getElementById('imprimir-comanda'),
    limpar: document.getElementById('limpar-pedido'),
    comanda: document.getElementById('comanda'),
    confirmado: document.getElementById('confirmado')
  };

  function lerMesa() {
    try {
      var valor = new URLSearchParams(window.location.search).get('mesa');
      if (valor && /^[A-Za-z0-9-]{1,12}$/.test(valor)) return valor;
    } catch (e) { /* sem URLSearchParams: usa a mesa padrão */ }
    return CONFIG.mesaPadrao;
  }

  function criarEl(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  function criarTriangulo(cor) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '230 470 288 210');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var corpo = document.createElementNS(SVG_NS, 'path');
    corpo.setAttribute('d', 'M374,495 L500,655 L374,628 L250,655 Z');
    corpo.setAttribute('fill', cor === 'menta' ? '#2B0A57' : '#68E0BC');
    svg.appendChild(corpo);
    return svg;
  }

  function resumoTotais() {
    var qtd = 0, total = 0;
    carrinho.forEach(function (n, id) {
      qtd += n;
      total += n * indice[id].item.preco;
    });
    return { qtd: qtd, total: total };
  }

  function rotuloItens(n) { return n === 1 ? '1 item' : n + ' itens'; }

  /* ----- Cardápio ----- */
  function montarCardapio() {
    CARDAPIO.forEach(function (cat) {
      var li = criarEl('li');
      var a = criarEl('a', null, cat.nome);
      a.href = '#secao-' + cat.id;
      li.appendChild(a);
      el.categorias.appendChild(li);

      var secao = criarEl('section', 'secao');
      secao.id = 'secao-' + cat.id;
      secao.setAttribute('aria-labelledby', 'titulo-' + cat.id);
      var titulo = criarEl('h3', null, cat.nome);
      titulo.id = 'titulo-' + cat.id;
      secao.appendChild(titulo);

      var lista = criarEl('ul', 'itens');
      cat.itens.forEach(function (item) {
        lista.appendChild(montarItem(item, cat));
      });
      secao.appendChild(lista);
      el.secoes.appendChild(secao);
    });
  }

  function montarItem(item, cat) {
    var li = criarEl('li', 'item reveal' + (item.indisponivel ? ' indisponivel' : ''));
    var foto = criarEl('div', 'item-foto' + (item.cor === 'menta' ? ' menta' : ''));
    foto.appendChild(criarTriangulo(item.cor));

    var corpo = criarEl('div', 'item-corpo');
    var topo = criarEl('div', 'item-topo');
    topo.appendChild(criarEl('h4', 'item-nome', item.nome));
    topo.appendChild(criarEl('span', 'item-preco', moeda.format(item.preco / 100)));
    corpo.appendChild(topo);
    corpo.appendChild(criarEl('p', 'item-desc', item.desc));

    var meta = criarEl('div', 'item-meta');
    var tags = criarEl('div', 'tags');
    (item.tags || []).forEach(function (t) { tags.appendChild(criarEl('span', 'tag ' + t, t === 'vegano' ? 'Vegano' : t)); });
    if (item.indisponivel) tags.appendChild(criarEl('span', 'tag indisp', 'Indisponível hoje'));
    meta.appendChild(tags);

    var stepper = criarEl('div', 'stepper');
    stepper.setAttribute('role', 'group');
    stepper.setAttribute('aria-label', 'Quantidade de ' + item.nome);
    var menos = criarEl('button', null, '−');
    menos.type = 'button';
    menos.setAttribute('aria-label', 'Tirar um ' + item.nome);
    var saida = criarEl('output', null, '0');
    saida.setAttribute('aria-live', 'polite');
    var mais = criarEl('button', null, '+');
    mais.type = 'button';
    mais.setAttribute('aria-label', 'Adicionar um ' + item.nome);
    menos.addEventListener('click', function () { alterar(item.id, -1, mais); });
    mais.addEventListener('click', function () { alterar(item.id, 1, mais); });
    stepper.appendChild(menos);
    stepper.appendChild(saida);
    stepper.appendChild(mais);
    if (item.indisponivel) { menos.disabled = true; mais.disabled = true; }
    meta.appendChild(stepper);
    corpo.appendChild(meta);

    li.appendChild(foto);
    li.appendChild(corpo);
    indice[item.id] = { item: item, categoria: cat, li: li, saida: saida, menos: menos, mais: mais };
    return li;
  }

  function alterar(id, delta, botao) {
    var atual = carrinho.get(id) || 0;
    var novo = Math.max(0, Math.min(CONFIG.qtdMax, atual + delta));
    if (novo === atual) return;
    if (novo === 0) carrinho.delete(id); else carrinho.set(id, novo);
    atualizarItem(id);
    atualizarPedido();
    if (delta > 0) {
      pulsar(indice[id].li);
      if (botao) particulas(botao);
    }
  }

  function pulsar(li) {
    li.classList.remove('pulsa');
    void li.offsetWidth; // reinicia a animação
    li.classList.add('pulsa');
  }

  // Partículas "poeira de projetor" saindo do + até a barra do pedido (DS 7.1)
  function particulas(origem) {
    if (reduzirMovimento || !origem || !el.barra || el.barra.hidden) return;
    var a = origem.getBoundingClientRect();
    var b = el.resumoTotal.getBoundingClientRect();
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    var x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    for (var i = 0; i < 8; i++) {
      var p = criarEl('span', 'particula');
      var dx = (x1 - x0) + (Math.random() - 0.5) * 60;
      var dy = (y1 - y0) + (Math.random() - 0.5) * 40;
      p.style.left = x0 + 'px';
      p.style.top = y0 + 'px';
      p.style.setProperty('--tx', dx + 'px');
      p.style.setProperty('--ty', dy + 'px');
      p.style.animationDelay = (i * 25) + 'ms';
      document.body.appendChild(p);
      p.addEventListener('animationend', function (e) { e.target.remove(); });
    }
  }

  function atualizarItem(id) {
    var r = indice[id];
    var qtd = carrinho.get(id) || 0;
    r.saida.textContent = String(qtd);
    r.li.classList.toggle('no-pedido', qtd > 0);
    r.menos.disabled = qtd === 0 || r.item.indisponivel;
    r.mais.disabled = qtd >= CONFIG.qtdMax || r.item.indisponivel;
  }

  /* ----- Busca e filtro ----- */
  function aplicarFiltros() {
    var termo = termoBusca.trim().toLowerCase();
    var visiveis = 0;
    CARDAPIO.forEach(function (cat) {
      var secao = document.getElementById('secao-' + cat.id);
      var n = 0;
      cat.itens.forEach(function (item) {
        var texto = (item.nome + ' ' + item.desc).toLowerCase();
        var ok = (!termo || texto.indexOf(termo) !== -1) && (!filtroVegano || (item.tags || []).indexOf('vegano') !== -1);
        indice[item.id].li.hidden = !ok;
        if (ok) n++;
      });
      secao.hidden = n === 0;
      visiveis += n;
    });
    el.semResultado.hidden = visiveis > 0;
  }

  el.busca.addEventListener('input', function () { termoBusca = el.busca.value; aplicarFiltros(); });
  el.filtroVegano.addEventListener('click', function () {
    filtroVegano = !filtroVegano;
    el.filtroVegano.setAttribute('aria-pressed', String(filtroVegano));
    el.filtroVegano.classList.toggle('ativo', filtroVegano);
    aplicarFiltros();
  });

  /* ----- Pedido ----- */
  function atualizarPedido(opcoes) {
    var t = resumoTotais();
    el.resumoQtd.textContent = rotuloItens(t.qtd);
    el.resumoTotal.textContent = moeda.format(t.total / 100);
    el.totalItens.textContent = String(t.qtd);
    el.totalPedido.textContent = moeda.format(t.total / 100);
    el.barra.hidden = t.qtd === 0;
    document.body.classList.toggle('tem-pedido', t.qtd > 0);
    el.vazio.hidden = t.qtd > 0;
    el.imprimir.disabled = t.qtd === 0;
    el.limpar.disabled = t.qtd === 0;
    renderLinhas();
    atualizarEnvio(t);
    guardar();
    if (t.qtd === 0) fecharPedido(false);
    if (!(opcoes && opcoes.semPulso) && !reduzirMovimento) {
      el.barra.classList.remove('bate');
      void el.barra.offsetWidth;
      el.barra.classList.add('bate');
    }
  }

  function renderLinhas() {
    el.itens.textContent = '';
    carrinho.forEach(function (qtd, id) {
      var item = indice[id].item;
      var li = criarEl('li', 'linha-pedido');
      var info = criarEl('div');
      info.appendChild(criarEl('p', 'nome', item.nome));
      info.appendChild(criarEl('p', 'sub', moeda.format(item.preco / 100) + ' cada · ' + moeda.format(qtd * item.preco / 100)));
      li.appendChild(info);

      var stepper = criarEl('div', 'stepper');
      var menos = criarEl('button', null, '−');
      menos.type = 'button';
      menos.setAttribute('aria-label', 'Tirar um ' + item.nome);
      var saida = criarEl('output', null, String(qtd));
      var mais = criarEl('button', null, '+');
      mais.type = 'button';
      mais.setAttribute('aria-label', 'Adicionar um ' + item.nome);
      menos.addEventListener('click', function () { alterar(id, -1); });
      mais.addEventListener('click', function () { alterar(id, 1); });
      mais.disabled = qtd >= CONFIG.qtdMax;
      stepper.appendChild(menos);
      stepper.appendChild(saida);
      stepper.appendChild(mais);
      li.appendChild(stepper);

      var remover = criarEl('button', 'remover', 'Remover do pedido');
      remover.type = 'button';
      remover.addEventListener('click', function () {
        // Dissolução (DS 7.2): a linha some antes de o pedido ser atualizado
        if (reduzirMovimento) { tirar(id); return; }
        li.classList.add('saindo');
        setTimeout(function () { tirar(id); }, 300);
      });
      li.appendChild(remover);
      el.itens.appendChild(li);
    });
  }

  function tirar(id) {
    carrinho.delete(id);
    atualizarItem(id);
    atualizarPedido({ semPulso: true });
  }

  function montarMensagem() {
    var t = resumoTotais();
    var linhas = [];
    linhas.push('*Pedido · ' + CONFIG.restaurante + '*');
    linhas.push('Mesa: ' + mesa);
    var nome = el.nome.value.trim();
    if (nome) linhas.push('Nome: ' + nome);
    linhas.push('');
    carrinho.forEach(function (qtd, id) {
      var item = indice[id].item;
      linhas.push('• ' + qtd + 'x ' + item.nome + ' — ' + moeda.format(qtd * item.preco / 100));
    });
    linhas.push('');
    linhas.push('*Total: ' + moeda.format(t.total / 100) + '*');
    var obs = el.obs.value.trim();
    if (obs) { linhas.push(''); linhas.push('Observações: ' + obs); }
    return linhas.join('\n');
  }

  function atualizarEnvio(t) {
    if (t.qtd === 0) {
      el.enviar.setAttribute('aria-disabled', 'true');
      el.enviar.removeAttribute('href');
      return;
    }
    var link = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(montarMensagem());
    el.enviar.setAttribute('href', link);
    el.enviar.setAttribute('aria-disabled', 'false');
  }

  function avisar(texto) {
    el.confirmado.textContent = texto;
    el.confirmado.hidden = false;
    clearTimeout(avisar.timer);
    avisar.timer = setTimeout(function () { el.confirmado.hidden = true; }, 7000);
  }

  /* ----- Persistência por mesa (só neste navegador) ----- */
  function guardar() {
    try {
      var dados = {
        itens: Array.from(carrinho.entries()),
        nome: el.nome.value,
        obs: el.obs.value
      };
      if (carrinho.size === 0 && !dados.nome && !dados.obs) localStorage.removeItem(chaveSalva);
      else localStorage.setItem(chaveSalva, JSON.stringify(dados));
    } catch (e) { /* navegador privado ou sem armazenamento: segue sem salvar */ }
  }

  function restaurar() {
    try {
      var bruto = localStorage.getItem(chaveSalva);
      if (!bruto) return false;
      var dados = JSON.parse(bruto);
      var entrou = false;
      (dados.itens || []).forEach(function (par) {
        var id = par[0], qtd = par[1];
        if (indice[id] && !indice[id].item.indisponivel && qtd > 0) {
          carrinho.set(id, Math.min(CONFIG.qtdMax, Number(qtd) || 1));
          entrou = true;
        }
      });
      el.nome.value = typeof dados.nome === 'string' ? dados.nome.slice(0, 40) : '';
      el.obs.value = typeof dados.obs === 'string' ? dados.obs.slice(0, 240) : '';
      return entrou;
    } catch (e) { return false; }
  }

  /* ----- Limpar e imprimir ----- */
  el.limpar.addEventListener('click', function () {
    carrinho.forEach(function (q, id) { indice[id].saida.textContent = '0'; });
    carrinho.clear();
    Object.keys(indice).forEach(atualizarItem);
    el.nome.value = '';
    el.obs.value = '';
    atualizarPedido({ semPulso: true });
    avisar('Pedido limpo.');
  });

  function montarComanda() {
    var c = el.comanda;
    c.textContent = '';
    c.appendChild(criarEl('h2', 'comanda-titulo', CONFIG.restaurante));
    c.appendChild(criarEl('p', 'comanda-meta', 'Mesa ' + mesa));
    var hora = new Date();
    c.appendChild(criarEl('p', 'comanda-meta', hora.toLocaleDateString('pt-BR') + ' · ' + hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })));
    var nome = el.nome.value.trim();
    if (nome) c.appendChild(criarEl('p', 'comanda-meta', 'Cliente: ' + nome));
    var lista = criarEl('ul', 'comanda-itens');
    carrinho.forEach(function (qtd, id) {
      var item = indice[id].item;
      var li = criarEl('li');
      li.appendChild(criarEl('span', 'comanda-qtd', qtd + 'x'));
      li.appendChild(criarEl('span', 'comanda-nome', item.nome));
      li.appendChild(criarEl('span', 'comanda-val', moeda.format(qtd * item.preco / 100)));
      lista.appendChild(li);
    });
    c.appendChild(lista);
    c.appendChild(criarEl('p', 'comanda-total', 'Total ' + moeda.format(resumoTotais().total / 100)));
    var obs = el.obs.value.trim();
    if (obs) c.appendChild(criarEl('p', 'comanda-obs', 'Obs.: ' + obs));
    c.appendChild(criarEl('p', 'comanda-rodape', 'Demonstração · dados de exemplo'));
  }

  el.imprimir.addEventListener('click', function () {
    if (resumoTotais().qtd === 0) return;
    montarComanda();
    window.print();
  });

  /* ----- Painel do pedido ----- */
  var ultimoFoco = null;

  function abrirPedido() {
    if (resumoTotais().qtd === 0) return;
    ultimoFoco = document.activeElement;
    el.veu.hidden = false;
    el.pedido.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      el.veu.classList.add('ver');
      el.pedido.classList.add('aberto');
    });
    el.pedido.focus({ preventScroll: true });
  }

  function fecharPedido(devolverFoco) {
    if (el.pedido.getAttribute('aria-hidden') === 'true') return;
    el.veu.classList.remove('ver');
    el.pedido.classList.remove('aberto');
    el.pedido.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (!el.veu.classList.contains('ver')) el.veu.hidden = true; }, 320);
    if (devolverFoco !== false && ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true });
  }

  function focaveis() {
    return Array.prototype.slice.call(el.pedido.querySelectorAll('button, a[href], input, textarea')).filter(function (n) {
      return !n.disabled && n.getAttribute('aria-disabled') !== 'true' && n.offsetParent !== null;
    });
  }

  document.addEventListener('keydown', function (e) {
    if (el.pedido.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') { fecharPedido(); return; }
    if (e.key !== 'Tab') return;
    var lista = focaveis();
    if (!lista.length) return;
    var primeiro = lista[0], ultimo = lista[lista.length - 1];
    if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === el.pedido)) {
      e.preventDefault(); ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault(); primeiro.focus();
    }
  });

  el.abrir.addEventListener('click', abrirPedido);
  el.fechar.addEventListener('click', function () { fecharPedido(); });
  el.veu.addEventListener('click', function () { fecharPedido(); });
  el.enviar.addEventListener('click', function (e) {
    if (resumoTotais().qtd === 0) { e.preventDefault(); return; }
    avisar('Pedido aberto no WhatsApp. Confirme o envio por lá. Se a janela não abrir, toque no botão de novo.');
  });
  el.nome.addEventListener('input', function () { atualizarEnvio(resumoTotais()); guardar(); });
  el.obs.addEventListener('input', function () { atualizarEnvio(resumoTotais()); guardar(); });

  /* ----- Destaque da categoria atual ----- */
  function acompanharCategorias() {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    Array.prototype.forEach.call(el.categorias.querySelectorAll('a'), function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          links[id].setAttribute('aria-current', id === en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Array.prototype.forEach.call(el.secoes.querySelectorAll('.secao'), function (s) { obs.observe(s); });
  }

  /* ----- Movimento de entrada (só com JS e sem pedido de movimento reduzido) ----- */
  function iniciarMovimento() {
    var root = document.documentElement;
    if (reduzirMovimento || !('IntersectionObserver' in window)) return;
    root.classList.add('js');

    Array.prototype.forEach.call(document.querySelectorAll('.hero .linha > span'), function (s, i) {
      s.style.setProperty('--d', String(i));
    });
    requestAnimationFrame(function () { root.classList.add('pronto'); });

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visivel'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (n) { obs.observe(n); });
  }

  /* ----- Início ----- */
  el.mesaAtual.textContent = 'Mesa ' + mesa;
  montarCardapio();
  var restaurou = restaurar();
  Object.keys(indice).forEach(atualizarItem);
  atualizarPedido({ semPulso: true });
  if (restaurou) avisar('Retomamos o pedido desta mesa, salvo neste navegador.');
  aplicarFiltros();
  acompanharCategorias();
  iniciarMovimento();
}());
