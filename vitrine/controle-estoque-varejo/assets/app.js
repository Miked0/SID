/* Controle de Estoque · demo Solution Innova Digital
   Dados de exemplo, sem backend. O estado fica só neste navegador (localStorage, com fallback). */
(function () {
  'use strict';

  var CHAVE = 'sid-vitrine-estoque-v1';
  var reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var dataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  var ROTULO = { ok: 'Em dia', baixo: 'Baixo', critico: 'Crítico', zerado: 'Zerado' };

  /* ---------- Dados de exemplo ---------- */
  var PRODUTOS_EXEMPLO = [
    { sku: 'SKU-001', nome: 'Camiseta Preta M', categoria: 'Vestuário', fornecedor: 'Têxtil Brasil', custo: 25, preco: 59.9, estoque: 50, min: 20, max: 200, giro: 12.4 },
    { sku: 'SKU-045', nome: 'Tênis Runner 42', categoria: 'Calçados', fornecedor: 'Passo Forte', custo: 95, preco: 219.9, estoque: 12, min: 10, max: 30, giro: 8.2 },
    { sku: 'SKU-002', nome: 'Camiseta Branca G', categoria: 'Vestuário', fornecedor: 'Têxtil Brasil', custo: 25, preco: 59.9, estoque: 8, min: 20, max: 200, giro: 9.1 },
    { sku: 'SKU-012', nome: 'Calça Jeans 38', categoria: 'Vestuário', fornecedor: 'Denim Sul', custo: 45, preco: 129.9, estoque: 18, min: 10, max: 60, giro: 6.1 },
    { sku: 'SKU-057', nome: 'Boné Aba Reta', categoria: 'Acessórios', fornecedor: 'Acessa Mais', custo: 14, preco: 49.9, estoque: 14, min: 10, max: 50, giro: 3.4 },
    { sku: 'SKU-064', nome: 'Tênis Casual 40', categoria: 'Calçados', fornecedor: 'Passo Forte', custo: 70, preco: 189.9, estoque: 22, min: 8, max: 40, giro: 4.0 },
    { sku: 'SKU-075', nome: 'Jaqueta Corta-Vento M', categoria: 'Vestuário', fornecedor: 'Denim Sul', custo: 110, preco: 229.9, estoque: 26, min: 12, max: 60, giro: 1.8 },
    { sku: 'SKU-081', nome: 'Shorts Moletom P', categoria: 'Vestuário', fornecedor: 'Têxtil Brasil', custo: 32, preco: 69.9, estoque: 11, min: 12, max: 60, giro: 2.9 },
    { sku: 'SKU-088', nome: 'Meia Esportiva (kit 3)', categoria: 'Acessórios', fornecedor: 'Acessa Mais', custo: 9, preco: 29.9, estoque: 60, min: 20, max: 120, giro: 5.6 },
    { sku: 'SKU-089', nome: 'Blusa Listrada', categoria: 'Vestuário', fornecedor: 'Denim Sul', custo: 30, preco: 79.9, estoque: 4, min: 10, max: 50, giro: 0.5 },
    { sku: 'SKU-095', nome: 'Garrafa Térmica 500 ml', categoria: 'Acessórios', fornecedor: 'Casa Viva', custo: 40, preco: 89.9, estoque: 16, min: 10, max: 40, giro: 1.2 },
    { sku: 'SKU-031', nome: 'Mochila Urbana', categoria: 'Acessórios', fornecedor: 'Casa Viva', custo: 80, preco: 149.9, estoque: 9, min: 5, max: 25, giro: 2.2 },
    { sku: 'SKU-070', nome: 'Chinelo Slide 39', categoria: 'Calçados', fornecedor: 'Passo Forte', custo: 15, preco: 39.9, estoque: 0, min: 15, max: 80, giro: 0 },
    { sku: 'SKU-102', nome: 'Meia Cano Alto', categoria: 'Acessórios', fornecedor: 'Acessa Mais', custo: 4, preco: 19.9, estoque: 0, min: 30, max: 300, giro: 0 }
  ];

  function movimentosExemplo() {
    var agora = Date.now();
    var h = 3600000;
    return [
      { id: 'm1', sku: 'SKU-001', tipo: 'entrada', qtd: 50, doc: 'NF 1042', obs: 'Reposição mensal', quando: agora - 1.5 * h },
      { id: 'm2', sku: 'SKU-045', tipo: 'saida', qtd: 3, doc: '', obs: 'Venda balcão', quando: agora - 3 * h },
      { id: 'm3', sku: 'SKU-081', tipo: 'saida', qtd: 2, doc: '', obs: 'Venda online', quando: agora - 5 * h },
      { id: 'm4', sku: 'SKU-089', tipo: 'saida', qtd: 2, doc: '', obs: 'Venda balcão', quando: agora - 26 * h },
      { id: 'm5', sku: 'SKU-095', tipo: 'entrada', qtd: 10, doc: 'NF 1038', obs: '', quando: agora - 30 * h },
      { id: 'm6', sku: 'SKU-002', tipo: 'saida', qtd: 5, doc: '', obs: 'Venda online', quando: agora - 48 * h }
    ];
  }

  /* ---------- Estado ---------- */
  var estado = {
    produtos: [],
    movs: [],
    ordem: { campo: 'nome', dir: 'asc' },
    ignorados: {}
  };

  function copiar(obj) { return JSON.parse(JSON.stringify(obj)); }

  function carregar() {
    try {
      var salvo = window.localStorage.getItem(CHAVE);
      if (salvo) {
        var d = JSON.parse(salvo);
        if (d && Array.isArray(d.produtos) && Array.isArray(d.movs)) {
          estado.produtos = d.produtos;
          estado.movs = d.movs;
          return;
        }
      }
    } catch (e) { /* sem localStorage: segue com os dados de exemplo */ }
    estado.produtos = copiar(PRODUTOS_EXEMPLO);
    estado.movs = movimentosExemplo();
  }

  function salvar() {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify({ produtos: estado.produtos, movs: estado.movs }));
    } catch (e) { /* ignora: a demo continua funcionando sem persistência */ }
  }

  /* ---------- Utilidades ---------- */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function situacao(p) {
    if (p.estoque <= 0) return 'zerado';
    if (p.estoque <= p.min) return 'critico';
    if (p.estoque <= p.min * 1.5) return 'baixo';
    return 'ok';
  }

  function porSku(sku) {
    for (var i = 0; i < estado.produtos.length; i++) if (estado.produtos[i].sku === sku) return estado.produtos[i];
    return null;
  }

  function fracao(p) {
    var alvo = Math.max(p.max, 1);
    return Math.min(100, Math.round((p.estoque / alvo) * 100));
  }

  function badge(st) {
    return '<span class="badge" data-st="' + st + '">' + ROTULO[st] + '</span>';
  }

  function aviso(texto, tipo) {
    var caixa = document.getElementById('avisos');
    if (!caixa) return;
    var item = document.createElement('div');
    item.className = 'aviso';
    item.setAttribute('data-tipo', tipo || 'ok');
    item.textContent = texto;
    caixa.appendChild(item);
    setTimeout(function () {
      item.classList.add('saindo');
      setTimeout(function () { item.remove(); }, 300);
    }, 3800);
  }

  function particulas(origem, quantidade) {
    if (reduzir || !origem || !origem.getBoundingClientRect) return;
    var r = origem.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    for (var i = 0; i < quantidade; i++) {
      var p = document.createElement('span');
      p.className = 'particula';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--tx', ((Math.random() - 0.5) * 120) + 'px');
      p.style.setProperty('--ty', ((Math.random() - 0.5) * 120) + 'px');
      document.body.appendChild(p);
      p.addEventListener('animationend', function (ev) { ev.target.remove(); });
    }
  }

  /* ---------- Painel ---------- */
  function renderMetricas() {
    var cont = { produtos: estado.produtos.length, baixo: 0, critico: 0, zerado: 0 };
    estado.produtos.forEach(function (p) {
      var s = situacao(p);
      if (s !== 'ok') cont[s]++;
    });
    var itens = [
      { tipo: 'todos', valor: cont.produtos, rotulo: 'Produtos', nota: 'cadastrados' },
      { tipo: 'baixo', valor: cont.baixo, rotulo: 'Baixo', nota: 'até 1,5× o mínimo' },
      { tipo: 'critico', valor: cont.critico, rotulo: 'Crítico', nota: 'no mínimo ou abaixo' },
      { tipo: 'zerado', valor: cont.zerado, rotulo: 'Zerado', nota: 'sem unidades' }
    ];
    document.getElementById('metricas').innerHTML = itens.map(function (m) {
      return '<button type="button" class="metrica" data-tipo="' + m.tipo + '" data-filtro-status="' +
        (m.tipo === 'todos' ? '' : m.tipo) + '">' +
        '<span class="metrica-valor">' + m.valor + '</span>' +
        '<span class="metrica-rotulo">' + m.rotulo + '</span>' +
        '<span class="metrica-nota">' + m.nota + '</span></button>';
    }).join('');
  }

  function renderMovimentos() {
    var lista = document.getElementById('lista-mov');
    var recentes = estado.movs.slice().sort(function (a, b) { return b.quando - a.quando; }).slice(0, 6);
    if (!recentes.length) {
      lista.innerHTML = '<li class="vazio">Nenhuma movimentação ainda.</li>';
      return;
    }
    lista.innerHTML = recentes.map(function (m) {
      var p = porSku(m.sku);
      var nome = p ? p.nome : m.sku;
      var sinal = m.tipo === 'entrada' ? '+' : '−';
      var rot = m.tipo === 'entrada' ? 'Entrada' : 'Saída';
      var meta = [m.sku, rot, dataHora.format(new Date(m.quando))];
      if (m.doc) meta.push(m.doc);
      return '<li>' +
        '<span class="mov-sinal" data-tipo="' + m.tipo + '" aria-hidden="true">' + sinal + '</span>' +
        '<span class="mov-texto"><span class="mov-nome">' + esc(nome) + '</span>' +
        '<span class="mov-meta">' + esc(meta.join(' · ')) + (m.obs ? ' · ' + esc(m.obs) : '') + '</span></span>' +
        '<span class="mov-qtd" data-tipo="' + m.tipo + '">' + sinal + m.qtd + '</span>' +
        '</li>';
    }).join('');
  }

  function renderGiro() {
    var top = estado.produtos.filter(function (p) { return p.giro > 0; })
      .sort(function (a, b) { return b.giro - a.giro; }).slice(0, 5);
    var max = top.length ? top[0].giro : 1;
    var ol = document.getElementById('giro');
    if (!top.length) {
      ol.innerHTML = '<li class="vazio">Sem giro registrado.</li>';
      return;
    }
    ol.innerHTML = top.map(function (p) {
      var pct = Math.round((p.giro / max) * 100);
      return '<li>' +
        '<div class="giro-linha"><span class="giro-nome">' + esc(p.nome) + '</span>' +
        '<span class="giro-valor">' + p.giro.toString().replace('.', ',') + 'x/mês</span></div>' +
        '<div class="giro-barra" role="img" aria-label="' + esc(p.nome) + ': ' + pct + '% do maior giro"><span style="--p:' + pct + '"></span></div>' +
        '</li>';
    }).join('');
  }

  function renderFiltroCategorias() {
    var sel = document.getElementById('filtro-categoria');
    var atual = sel.value;
    var cats = [];
    estado.produtos.forEach(function (p) { if (cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
    cats.sort();
    sel.innerHTML = '<option value="">Todas</option>' + cats.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('');
    sel.value = cats.indexOf(atual) >= 0 ? atual : '';
  }

  /* ---------- Produtos ---------- */
  function filtrados() {
    var termo = document.getElementById('busca').value.trim().toLowerCase();
    var cat = document.getElementById('filtro-categoria').value;
    var st = document.getElementById('filtro-status').value;
    var lista = estado.produtos.filter(function (p) {
      if (cat && p.categoria !== cat) return false;
      if (st && situacao(p) !== st) return false;
      if (termo) {
        var alvo = (p.sku + ' ' + p.nome + ' ' + p.fornecedor).toLowerCase();
        if (alvo.indexOf(termo) < 0) return false;
      }
      return true;
    });
    var c = estado.ordem.campo;
    var d = estado.ordem.dir === 'asc' ? 1 : -1;
    lista.sort(function (a, b) {
      var va = a[c], vb = b[c];
      if (c === 'nome') va = a.nome, vb = b.nome;
      if (typeof va === 'string') return va.localeCompare(vb, 'pt-BR') * d;
      return (va - vb) * d;
    });
    return lista;
  }

  function renderProdutos() {
    var lista = filtrados();
    var corpo = document.getElementById('corpo-produtos');
    document.getElementById('vazio-produtos').hidden = lista.length > 0;
    document.querySelector('#tabela-produtos').hidden = lista.length === 0;
    document.getElementById('resumo-produtos').textContent =
      lista.length + ' de ' + estado.produtos.length + ' produtos exibidos';

    corpo.innerHTML = lista.map(function (p) {
      var s = situacao(p);
      var classe = s === 'ok' ? '' : ' class="linha-' + s + '"';
      return '<tr data-sku="' + esc(p.sku) + '"' + (classe ? classe.replace(' class="', ' class="') : '') + '>' +
        '<td class="sku" data-label="Código">' + esc(p.sku) + '</td>' +
        '<td class="nome" data-label="Produto">' + esc(p.nome) + '<small>' + esc(p.fornecedor) + '</small></td>' +
        '<td data-label="Categoria">' + esc(p.categoria) + '</td>' +
        '<td class="num" data-label="Preço">' + moeda.format(p.preco) + '</td>' +
        '<td class="num" data-label="Estoque"><div class="estoque-cel">' +
          '<span class="estoque-num">' + p.estoque + '</span>' +
          '<span class="medidor" data-st="' + s + '" aria-hidden="true"><span style="--p:' + fracao(p) + '"></span></span>' +
        '</div></td>' +
        '<td class="num" data-label="Mín / Máx">' + p.min + ' / ' + p.max + '</td>' +
        '<td data-label="Situação">' + badge(s) + '</td>' +
        '<td class="acoes"><button type="button" class="btn btn-contorno btn-pequeno" data-movimentar="' + esc(p.sku) + '">Movimentar<span class="sr-only"> ' + esc(p.nome) + '</span></button></td>' +
        '</tr>';
    }).join('');

    document.querySelectorAll('[data-ordenar]').forEach(function (b) {
      var campo = b.getAttribute('data-ordenar');
      if (campo === estado.ordem.campo) b.setAttribute('aria-sort', estado.ordem.dir === 'asc' ? 'ascending' : 'descending');
      else b.removeAttribute('aria-sort');
    });
  }

  /* ---------- Alertas ---------- */
  function alertas() {
    return estado.produtos.filter(function (p) {
      return situacao(p) !== 'ok' && !estado.ignorados[p.sku];
    }).sort(function (a, b) {
      var ordem = { zerado: 0, critico: 1, baixo: 2 };
      return ordem[situacao(a)] - ordem[situacao(b)];
    });
  }

  function renderAlertas() {
    var lista = alertas();
    var cont = document.getElementById('contador-alerta');
    cont.textContent = lista.length;
    cont.setAttribute('data-zero', lista.length ? 'false' : 'true');
    document.getElementById('vazio-alertas').hidden = lista.length > 0;
    var box = document.getElementById('lista-alertas');
    box.innerHTML = lista.map(function (p) {
      var s = situacao(p);
      var sugestao = Math.max(p.max - p.estoque, 1);
      return '<article class="alerta" data-st="' + s + '">' +
        '<div class="alerta-cab"><div><div class="alerta-nome">' + esc(p.nome) + '</div>' +
        '<div class="alerta-sku">' + esc(p.sku) + ' · ' + esc(p.fornecedor) + '</div></div>' + badge(s) + '</div>' +
        '<dl class="alerta-dados">' +
          '<div><dt>Em estoque</dt><dd>' + p.estoque + '</dd></div>' +
          '<div><dt>Mínimo / máximo</dt><dd>' + p.min + ' / ' + p.max + '</dd></div>' +
        '</dl>' +
        '<div class="alerta-acoes">' +
          '<button type="button" class="btn btn-primario btn-pequeno" data-pedir="' + esc(p.sku) + '">Sugerir pedido de ' + sugestao + '</button>' +
          '<button type="button" class="btn btn-contorno btn-pequeno" data-movimentar="' + esc(p.sku) + '">Movimentar</button>' +
          '<button type="button" class="btn-texto" data-ignorar="' + esc(p.sku) + '">Ignorar</button>' +
        '</div></article>';
    }).join('');
  }

  function renderTudo() {
    renderMetricas();
    renderMovimentos();
    renderGiro();
    renderFiltroCategorias();
    renderProdutos();
    renderAlertas();
  }

  /* ---------- Abas ---------- */
  function irPara(nome, opcoes) {
    document.querySelectorAll('.secao').forEach(function (s) {
      var ativa = s.getAttribute('data-secao') === nome;
      s.hidden = !ativa;
      s.classList.toggle('ativa', ativa);
    });
    document.querySelectorAll('.aba').forEach(function (b) {
      if (b.getAttribute('data-aba') === nome) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (opcoes && opcoes.status !== undefined) {
      document.getElementById('filtro-status').value = opcoes.status;
      renderProdutos();
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- Modal de movimentação ---------- */
  var modal = document.getElementById('modal-mov');
  var form = document.getElementById('form-mov');
  var ultimoFoco = null;

  function preencherSelect(skuPreferido) {
    var sel = document.getElementById('mov-produto');
    sel.innerHTML = estado.produtos.map(function (p) {
      return '<option value="' + esc(p.sku) + '">' + esc(p.sku) + ' · ' + esc(p.nome) + ' (' + p.estoque + ' em estoque)</option>';
    }).join('');
    if (skuPreferido) sel.value = skuPreferido;
  }

  function limparErros() {
    ['erro-produto', 'erro-qtd'].forEach(function (id) {
      var el = document.getElementById(id);
      el.hidden = true; el.textContent = '';
    });
    ['mov-produto', 'mov-qtd'].forEach(function (id) { document.getElementById(id).removeAttribute('aria-invalid'); });
  }

  function atualizarResumo() {
    var tipo = form.elements.tipo.value;
    var p = porSku(document.getElementById('mov-produto').value);
    var qtd = parseInt(document.getElementById('mov-qtd').value, 10);
    var out = document.getElementById('resumo-mov');
    if (!p || !(qtd > 0)) { out.textContent = 'Informe um produto e uma quantidade.'; out.removeAttribute('data-tipo'); return; }
    var novo = tipo === 'entrada' ? p.estoque + qtd : p.estoque - qtd;
    out.setAttribute('data-tipo', novo < 0 ? 'erro' : 'info');
    out.innerHTML = 'Estoque passa de <strong>' + p.estoque + '</strong> para <strong>' + Math.max(novo, 0) + '</strong>' +
      (novo < 0 ? ' — saída maior que o estoque.' : '.');
  }

  function abrirMovimento(skuPreferido, origem) {
    ultimoFoco = origem || document.activeElement;
    form.reset();
    limparErros();
    preencherSelect(skuPreferido);
    document.getElementById('mov-qtd').value = 1;
    atualizarResumo();
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    setTimeout(function () { document.getElementById('mov-qtd').focus(); }, 50);
  }

  function fecharModal() {
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
  }

  modal.addEventListener('close', function () {
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  });
  modal.addEventListener('click', function (ev) {
    if (ev.target === modal) fecharModal(); /* clique no fundo */
  });

  form.addEventListener('input', atualizarResumo);
  form.addEventListener('change', atualizarResumo);

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    limparErros();
    var sku = document.getElementById('mov-produto').value;
    var p = porSku(sku);
    var tipo = form.elements.tipo.value;
    var qtdTxt = document.getElementById('mov-qtd').value;
    var qtd = parseInt(qtdTxt, 10);
    var ok = true;

    if (!p) {
      mostrarErro('erro-produto', 'mov-produto', 'Escolha um produto da lista.');
      ok = false;
    }
    if (!/^\d+$/.test(qtdTxt) || !(qtd >= 1)) {
      mostrarErro('erro-qtd', 'mov-qtd', 'Informe uma quantidade inteira, a partir de 1.');
      ok = false;
    } else if (p && tipo === 'saida' && qtd > p.estoque) {
      mostrarErro('erro-qtd', 'mov-qtd', 'Saída de ' + qtd + ' é maior que o estoque (' + p.estoque + '). Ajuste a quantidade.');
      ok = false;
    }
    if (!ok) {
      var primeiroErro = document.querySelector('[aria-invalid="true"]');
      if (primeiroErro) primeiroErro.focus();
      var botao = form.querySelector('[type="submit"]');
      botao.classList.remove('sacudir'); void botao.offsetWidth; botao.classList.add('sacudir');
      return;
    }

    p.estoque = tipo === 'entrada' ? p.estoque + qtd : p.estoque - qtd;
    estado.movs.push({
      id: 'm' + Date.now(),
      sku: p.sku,
      tipo: tipo,
      qtd: qtd,
      doc: document.getElementById('mov-doc').value.trim().slice(0, 40),
      obs: document.getElementById('mov-obs').value.trim().slice(0, 140),
      quando: Date.now()
    });
    delete estado.ignorados[p.sku];
    salvar();
    particulas(form.querySelector('[type="submit"]'), 8);
    fecharModal();
    renderTudo();
    aviso((tipo === 'entrada' ? 'Entrada registrada: ' : 'Saída registrada: ') + qtd + ' × ' + p.nome + '. Novo estoque: ' + p.estoque + '.', 'ok');
  });

  function mostrarErro(idErro, idCampo, texto) {
    var el = document.getElementById(idErro);
    el.textContent = texto;
    el.hidden = false;
    document.getElementById(idCampo).setAttribute('aria-invalid', 'true');
  }

  /* ---------- Eventos gerais ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target : ev.target.parentElement;
    if (!t || !t.closest) return;
    var el;

    if ((el = t.closest('.aba'))) { irPara(el.getAttribute('data-aba')); return; }
    if ((el = t.closest('[data-ir]'))) { irPara(el.getAttribute('data-ir')); return; }
    if ((el = t.closest('.metrica'))) {
      var st = el.getAttribute('data-filtro-status');
      irPara('produtos', { status: st });
      document.getElementById('sec-produtos').scrollIntoView({ block: 'start' });
      return;
    }
    if (t.closest('[data-abrir-movimento]')) { abrirMovimento(null, t.closest('[data-abrir-movimento]')); return; }
    if ((el = t.closest('[data-movimentar]'))) { abrirMovimento(el.getAttribute('data-movimentar'), el); return; }
    if (t.closest('[data-fechar]')) { fecharModal(); return; }
    if ((el = t.closest('[data-ordenar]'))) {
      var campo = el.getAttribute('data-ordenar');
      if (estado.ordem.campo === campo) estado.ordem.dir = estado.ordem.dir === 'asc' ? 'desc' : 'asc';
      else { estado.ordem.campo = campo; estado.ordem.dir = 'asc'; }
      renderProdutos();
      return;
    }
    if ((el = t.closest('[data-ignorar]'))) {
      var skuI = el.getAttribute('data-ignorar');
      estado.ignorados[skuI] = true;
      renderAlertas();
      aviso('Alerta de ' + (porSku(skuI) || {}).nome + ' ignorado nesta sessão.', 'ok');
      return;
    }
    if ((el = t.closest('[data-pedir]'))) {
      var p = porSku(el.getAttribute('data-pedir'));
      if (p) aviso('Pedido sugerido: ' + Math.max(p.max - p.estoque, 1) + ' × ' + p.nome + ' (demonstração, nada foi enviado).', 'ok');
      return;
    }
    if ((el = t.closest('[data-restaurar]'))) {
      estado.produtos = copiar(PRODUTOS_EXEMPLO);
      estado.movs = movimentosExemplo();
      estado.ignorados = {};
      salvar();
      renderTudo();
      aviso('Dados de exemplo restaurados.', 'ok');
      return;
    }
  });

  document.getElementById('busca').addEventListener('input', renderProdutos);
  document.getElementById('filtro-categoria').addEventListener('change', renderProdutos);
  document.getElementById('filtro-status').addEventListener('change', renderProdutos);

  /* ---------- Início ---------- */
  carregar();
  renderTudo();
})();
