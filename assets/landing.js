/* Design landings: language, colour palettes, reveal on scroll, menu, form, balloons, night sky. No dependencies. */
(function () {
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var slug = (location.pathname.match(/\/([^\/]+)\/(index\.html)?$/) || [])[1] || 'home';

  /* language */
  function setLang(l) {
    root.lang = l;
    document.querySelectorAll('[data-en]').forEach(function (el) { el.innerHTML = el.getAttribute('data-' + l); });
    document.querySelectorAll('[data-ph-en]').forEach(function (el) { el.placeholder = el.getAttribute('data-ph-' + l); });
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === l ? 'true' : 'false'); });
    if (window.PAGE_TITLE) document.title = window.PAGE_TITLE[l];
    var today = document.querySelector('[data-today]');
    if (today) today.textContent = new Date().toLocaleDateString(l === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    store.set('lang', l);
  }
  document.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); }); });
  var lang = store.get('lang') || (/^ru/i.test(navigator.language || '') ? 'ru' : 'en');
  var q = location.search.match(/[?&]lang=(en|ru)/); if (q) lang = q[1];
  setLang(lang);

  /* palettes */
  var box = document.querySelector('[data-pal-box]');
  function setPal(n) {
    root.setAttribute('data-pal', n);
    document.querySelectorAll('[data-pal-set]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pal-set') === String(n) ? 'true' : 'false'); });
    store.set('pal-' + slug, n);
    if (window.drawSky) window.drawSky();
  }
  if (box) {
    var open = box.querySelector('[data-pal-open]');
    open.addEventListener('click', function () { var o = box.classList.toggle('is-open'); open.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    box.querySelectorAll('[data-pal-set]').forEach(function (b) { b.addEventListener('click', function () { setPal(b.getAttribute('data-pal-set')); }); });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) { box.classList.remove('is-open'); open.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.classList.remove('is-open'); });
    var p = location.search.match(/[?&]pal=([1-5])/);
    var saved = p ? p[1] : store.get('pal-' + slug);
    if (saved) setPal(saved);
  }

  /* reveal */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* mobile menu */
  var burger = document.querySelector('[data-burger]'), nav = document.querySelector('.nav[data-nav]');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('is-open'); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('is-open'); }); });
  }

  /* package buttons fill the form */
  document.querySelectorAll('[data-pack]').forEach(function (b) {
    b.addEventListener('click', function () { var h = document.querySelector('[data-form] [name="package"]'); if (h) h.value = b.getAttribute('data-pack'); });
  });

  /* form: only the contact field is required, nothing is sent anywhere */
  document.querySelectorAll('[data-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = f.querySelector('[name="contact"]');
      if (!c.value.trim()) { f.classList.add('is-err'); c.focus(); return; }
      f.classList.remove('is-err');
      f.querySelectorAll('input, button, label, .fm__err').forEach(function (el) { el.hidden = true; });
      f.querySelector('.fm__ok').hidden = false;
    });
  });

  /* balloons pop with confetti */
  document.querySelectorAll('.bl').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var r = b.getBoundingClientRect(), cs = getComputedStyle(root);
      var cols = [cs.getPropertyValue('--acc'), cs.getPropertyValue('--acc2'), '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var c = document.createElement('i'); c.className = 'confetti';
        c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + r.height / 2) + 'px';
        c.style.background = cols[i % 3];
        var a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
        c.style.setProperty('--dx', Math.cos(a) * d + 'px'); c.style.setProperty('--dy', Math.sin(a) * d + 'px');
        document.body.appendChild(c); setTimeout(function (el) { el.remove(); }, 900, c);
      }
      b.classList.add('is-pop');
      setTimeout(function () { b.classList.remove('is-pop'); }, 4000);
    });
  });

  /* night sky: twinkling stars and a rare shooting star */
  var cv = document.querySelector('canvas.sky');
  if (cv) {
    var ctx = cv.getContext('2d'), stars = [], W = 0, H = 0, shoot = null, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var size = function () {
      var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = []; for (var i = 0; i < Math.round(W * H / 2600); i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, p: Math.random() * 6.3, s: .6 + Math.random() * 1.6 });
    };
    window.drawSky = function () {};
    size(); window.addEventListener('resize', size);
    var t0 = performance.now();
    var frame = function (t) {
      var k = (t - t0) / 1000, ink = getComputedStyle(root).getPropertyValue('--ink').trim() || '#fff';
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = ink;
      stars.forEach(function (s) { ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(s.p + k * s.s * .6)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill(); });
      if (!shoot && Math.random() < .004) shoot = { x: Math.random() * W * .7, y: Math.random() * H * .4, l: 0 };
      if (shoot) {
        shoot.l += 14; ctx.globalAlpha = Math.max(0, 1 - shoot.l / 420); ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(shoot.x + shoot.l, shoot.y + shoot.l * .45); ctx.lineTo(shoot.x + shoot.l - 90, shoot.y + (shoot.l - 90) * .45); ctx.stroke();
        if (shoot.l > 420) shoot = null;
      }
      ctx.globalAlpha = 1;
      if (!still) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
})();
