(function () {
  var root = document.documentElement;
  var calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finoPonteiro = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!calmo) root.classList.add('motion');

  /* ---------- Abertura ---------- */
  var intro = document.getElementById('intro');
  function liberar() { root.classList.add('pronto'); }
  if (calmo) { liberar(); }
  else {
    var cont = document.getElementById('contador'), t0 = performance.now(), dur = 1500;
    (function conta(t) {
      var p = Math.min(1, (t - t0) / dur);
      cont.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100) + '%';
      if (p < 1) requestAnimationFrame(conta);
      else setTimeout(function () {
        intro.classList.add('sai');
        setTimeout(liberar, 250);
        setTimeout(function () { intro.classList.add('fim'); }, 950);
      }, 250);
    })(t0);
    intro.addEventListener('click', function () { intro.classList.add('fim'); liberar(); });
  }

  /* ---------- Quebra títulos em palavras e o letreiro em letras ---------- */
  function quebraPalavras(el) {
    var palavras = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    palavras.forEach(function (p, i) {
      var w = document.createElement('span'); w.className = 'w';
      var s = document.createElement('span'); s.textContent = p; s.style.setProperty('--d', i);
      w.appendChild(s); el.appendChild(w);
      if (i < palavras.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  document.querySelectorAll('.cab h2, #contato h2').forEach(quebraPalavras);
  var grande = document.querySelector('.grande');
  if (grande) {
    var txt = grande.textContent; grande.textContent = '';
    Array.from(txt).forEach(function (ch, i) {
      if (ch === ' ') { grande.appendChild(document.createTextNode(' ')); return; }
      var c = document.createElement('span'); c.className = 'c';
      c.textContent = ch; c.style.setProperty('--d', i);
      grande.appendChild(c);
    });
  }

  /* ---------- Revelação ao rolar ---------- */
  document.querySelectorAll('.foto').forEach(function (f) { if (!f.closest('.painel')) f.classList.add('rv'); });
  document.querySelectorAll('.pilares, .grid, .cases-lista').forEach(function (g) {
    Array.from(g.children).forEach(function (c, i) { c.style.setProperty('--i', i % 3); });
  });
  var alvos = document.querySelectorAll('.rev, .grande, .numero');
  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        if (e.target.classList.contains('numero')) embaralha(e.target.querySelector('strong'));
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    alvos.forEach(function (el) { io.observe(el); });
  }

  /* Números: embaralham antes de assentar */
  function embaralha(el) {
    if (!el || calmo) return;
    var final = el.textContent, passos = 0;
    var id = setInterval(function () {
      el.textContent = final.replace(/[0-9]/g, function () { return Math.floor(Math.random() * 10); });
      if (++passos > 14) { clearInterval(id); el.textContent = final; }
    }, 55);
  }

  /* ---------- Rolagem: progresso, cabeçalho, parallax, faixa ---------- */
  var header = document.getElementById('topo');
  var barra = document.getElementById('progresso');
  var subir = document.getElementById('subir');
  var hero = document.querySelector('.hero');
  var heroH1 = hero.querySelector('h1');
  var foguete = hero.querySelector('.foguete-hero');
  var orbe = hero.querySelector('.orbe');
  var trilho = document.querySelector('.faixa .trilho');
  var ultimoY = window.scrollY, vel = 0, faixaX = 0, dir = 1;
  var mx = 0, my = 0, omx = 0, omy = 0;

  function quadro() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    header.classList.toggle('solido', y > 40);
    subir.classList.toggle('ver', y > innerHeight * 1.2);

    var dy = y - ultimoY; ultimoY = y;
    vel += (dy - vel) * 0.12;
    if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;

    if (!calmo) {
      var h = hero.offsetHeight;
      if (y < h * 1.2) {
        var p = y / h;
        heroH1.style.transform = 'translateY(' + (y * 0.25) + 'px)';
        heroH1.style.opacity = String(Math.max(0, 1 - p * 1.1));
        omx += (mx - omx) * 0.06; omy += (my - omy) * 0.06;
        foguete.style.transform = 'translate(' + (omx * 24) + 'px,' + (omy * 18 - y * 0.6) + 'px) rotate(' + (omx * 6) + 'deg)';
        orbe.style.transform = 'translate(' + (omx * -40) + 'px,' + (omy * -30 + y * 0.2) + 'px)';
      }
      if (trilho) {
        faixaX -= (0.6 + Math.min(Math.abs(vel) * 0.35, 14)) * dir;
        var meio = trilho.scrollWidth / 2;
        if (faixaX <= -meio) faixaX += meio;
        if (faixaX > 0) faixaX -= meio;
        trilho.style.transform = 'translate3d(' + faixaX + 'px,0,0)';
      }
    }
    requestAnimationFrame(quadro);
  }
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
  });
  requestAnimationFrame(quadro);

  subir.addEventListener('click', function () {
    subir.classList.remove('lanca'); void subir.offsetWidth; subir.classList.add('lanca');
    setTimeout(function () { window.scrollTo({ top: 0, behavior: calmo ? 'auto' : 'smooth' }); }, calmo ? 0 : 250);
  });

  /* ---------- Cursor ---------- */
  if (!calmo && finoPonteiro) {
    var anel = document.querySelector('.cursor.anel'), ponto = document.querySelector('.cursor.ponto');
    var cx = innerWidth / 2, cy = innerHeight / 2, ax = cx, ay = cy;
    addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; });
    (function segue() {
      ax += (cx - ax) * 0.18; ay += (cy - ay) * 0.18;
      ponto.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      anel.style.transform = 'translate(' + ax + 'px,' + ay + 'px)';
      requestAnimationFrame(segue);
    })();
    document.addEventListener('mouseover', function (e) {
      var c = e.target.closest('.case');
      var l = e.target.closest('a, button, summary, select, input');
      anel.classList.toggle('grande', !!c);
      anel.classList.toggle('link', !c && !!l);
    });
  }

  /* ---------- Botões magnéticos ---------- */
  if (!calmo && finoPonteiro) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.classList.add('mag');
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * 0.25 + 'px,' + y * 0.35 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }


  /* ---------- Prévias das soluções: rastro, palavras e números ---------- */
  var painel = document.querySelector('.painel');
  function contar(arte) {
    arte.querySelectorAll('.m-conta').forEach(function (el) {
      var alvo = parseFloat(el.dataset.para), dec = +(el.dataset.dec || 0);
      function fmt(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
      if (calmo) { el.textContent = fmt(alvo); return; }
      var t0 = null, dur = 1400, atraso = 1100;
      el.textContent = fmt(0);
      (function passo(t) {
        if (t0 === null) t0 = t + atraso;
        var p = Math.max(0, Math.min(1, (t - t0) / dur));
        el.textContent = fmt(alvo * (1 - Math.pow(1 - p, 4)));
        if (p < 1 && arte.classList.contains('ativa')) requestAnimationFrame(passo);
      })(performance.now());
    });
  }
  function tocar(arte) {
    arte.classList.remove('ativa'); void arte.offsetWidth; arte.classList.add('ativa');
    contar(arte);
  }
  if (calmo || !('IntersectionObserver' in window)) {
    painel.classList.add('on');
    document.querySelectorAll('.arte').forEach(contar);
  } else {
    var ioP = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      painel.classList.add('on'); contar(painel.querySelector('.arte.ativa')); ioP.disconnect();
    }, { threshold: 0.35 });
    ioP.observe(painel);
  }

  /* ---------- Soluções: troca do painel com cortina ---------- */
  var frentes = document.querySelectorAll('.frente');
  var foto = document.getElementById('painel-foto');
  var nome = document.getElementById('painel-nome');
  var cortina = document.getElementById('painel-cortina');
  frentes.forEach(function (f) {
    function ativar() {
      if (f.classList.contains('ativa')) return;
      frentes.forEach(function (o) { o.classList.remove('ativa'); o.setAttribute('aria-selected', 'false'); });
      f.classList.add('ativa'); f.setAttribute('aria-selected', 'true');
      function troca() {
        foto.className = 'foto r-4x5' + (f.dataset.cor === 'roxo' ? '' : ' ' + f.dataset.cor);
        nome.textContent = f.dataset.nome;
        nome.classList.remove('troca');
        foto.querySelectorAll('.arte').forEach(function (a) { if (a.dataset.arte === f.dataset.nome) tocar(a); else a.classList.remove('ativa'); });
      }
      if (calmo) return troca();
      cortina.classList.remove('vai'); void cortina.offsetWidth; cortina.classList.add('vai');
      nome.classList.add('troca');
      setTimeout(troca, 380);
    }
    f.addEventListener('click', ativar);
    f.addEventListener('mouseenter', function () { if (finoPonteiro) ativar(); });
  });

  /* ---------- Contato: WhatsApp com mensagem pronta ---------- */
  /* Coloque o número com DDI e DDD, só dígitos (ex.: 5511999999999). Enquanto estiver vazio, os botões abrem o Direct do Instagram. */
  var WHATSAPP = ''.replace(/\D/g, '');
  document.querySelectorAll('.js-contato').forEach(function (b) {
    b.target = '_blank'; b.rel = 'noopener noreferrer';
    b.href = /^\d{10,15}$/.test(WHATSAPP)
      ? 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(b.dataset.msg)
      : 'https://ig.me/m/solutioninnovadigital';
  });
})();

