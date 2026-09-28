/* BuildProof v5: gedrag zonder framework.
 * Mobiel menu, header-schaduw, cookiebanner, klikbare kavelkaart, onthullen bij scrollen
 * en de Calendly-hoogte op de demopagina. */
(function () {
  'use strict';

  var CONSENT_KEY = 'buildproof_cookie_consent';
  var CONSENT_TTL = 6 * 30 * 24 * 60 * 60 * 1000;
  var BASE = ((document.currentScript && document.currentScript.src.match(/^https?:\/\/[^/]+(.*)\/assets\/v5\.js/)) || [])[1] || '';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---------- Header: rand zodra er gescrold is ----------
  var header = $('.site-header');
  function onScroll() { header && header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobiel menu ----------
  var menuBtn = $('.menu-btn');
  var menu = $('#mobiel-menu');
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    header.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  // ---------- Cookiebanner ----------
  function getConsent() {
    try {
      var v = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      if (!v || !v.timestamp) return null;
      if (Date.now() - v.timestamp > CONSENT_TTL) { localStorage.removeItem(CONSENT_KEY); return null; }
      return v.value;
    } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: value, timestamp: Date.now() })); } catch (e) {}
  }
  var banner = null;
  function showCookies() {
    if (banner) return;
    var tpl = $('#tpl-cookie');
    if (!tpl) return;
    banner = tpl.content.firstElementChild.cloneNode(true);
    document.body.appendChild(banner);
    $all('button', banner).forEach(function (b) {
      b.addEventListener('click', function () {
        setConsent(b.hasAttribute('data-accept') ? 'accepted' : 'rejected');
        banner.remove();
        banner = null;
      });
    });
  }
  $all('[data-open="cookies"]').forEach(function (b) { b.addEventListener('click', showCookies); });
  if (getConsent() === null) showCookies();

  // ---------- Kavelkaart ----------
  var PARTS = [['Riolering', 4], ['Vloerverwarming', 6], ['Warmtepomp', 3], ['Ventilatie WTW', 4], ['Meterkast', 3]];
  var LABEL = { ok: 'Gereed', bezig: 'Bezig', open: 'Open', grijs: 'Nog niet' };
  var PILL = { ok: 'pill-ok', bezig: 'pill-bezig', open: 'pill-open', grijs: 'pill-grijs' };
  var IMG = BASE + '/assets/img/';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  var ICON_ALERT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  var ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';

  // Per kavel: hoeveel is er per onderdeel vastgelegd, en wat kwam er het laatst binnen
  function detailFor(n, status) {
    var done;
    if (status === 'ok') done = PARTS.map(function (p) { return p[1]; });
    else if (status === 'grijs') done = [0, 0, 0, 0, 0];
    else if (n === 14) done = [4, 6, 2, 1, 3];
    else if (status === 'open') done = n % 2 ? [4, 5, 3, 4, 3] : [4, 6, 3, 2, 3];
    else done = [[4, 6, 3, 2, 1], [4, 4, 1, 0, 3], [4, 6, 3, 3, 2], [3, 2, 0, 0, 1]][n % 4];
    var flag = status === 'open' ? (n % 2 ? 1 : 3) : -1;
    var feed;
    if (status === 'ok') feed = [
      { img: 'foto-wtw.jpg', t: 'Rapport als PDF klaar', s: 'Alle onderdelen afgerond' },
      { img: 'foto-haspel.jpg', t: 'Meterkast afgerond', s: 'Checklist 3/3 · foto’s bij' }
    ];
    else if (status === 'open') feed = [
      { ic: ICON_ALERT, t: 'Open punt · ' + PARTS[flag][0], s: flag === 1 ? 'Foto van het afpersen ontbreekt' : 'Luchthoeveelheid badkamer te laag' },
      { img: 'foto-gereedschap.jpg', t: 'Checklist bijgewerkt', s: 'Vandaag 10:18' }
    ];
    else if (status === 'grijs') feed = [
      { ic: ICON_CAL, t: 'Nog niet gestart', s: 'Checklists staan klaar voor de monteur' }
    ];
    else feed = n === 14 ? [
      { img: 'foto-wtw.jpg', t: 'Foto · WTW-unit geplaatst', s: 'Vandaag 09:42 · 3 foto’s' },
      { ic: ICON_CHECK, t: 'Checklist · Meterkast afgerond', s: 'Vandaag 08:15' }
    ] : [
      { img: 'foto-airco.jpg', t: 'Foto · Buitenunit geplaatst', s: 'Vandaag 11:05 · 2 foto’s' },
      { ic: ICON_CHECK, t: 'Checklist · Riolering afgerond', s: 'Gisteren 15:30' }
    ];
    return { done: done, flag: flag, feed: feed };
  }

  function renderDetail(root, n, status) {
    var d = detailFor(n, status);
    var total = 0, sum = 0;
    var parts = PARTS.map(function (p, i) {
      total += p[1]; sum += d.done[i];
      var cls = 'part' + (i === d.flag ? ' is-flag' : d.done[i] === p[1] ? ' is-done' : '');
      var extra = i === d.flag ? ' · open punt' : '';
      return '<li class="' + cls + '"><span>' + p[0] + '</span><em>' + d.done[i] + '/' + p[1] + extra + '</em>' +
        '<span class="part-bar"><i style="width:' + Math.round(d.done[i] / p[1] * 100) + '%"></i></span></li>';
    }).join('');
    var feed = d.feed.map(function (f) {
      var vis = f.img ? '<img src="' + IMG + f.img + '" alt="" loading="lazy" width="40" height="40">' : '<span class="feed-ic">' + f.ic + '</span>';
      return '<li>' + vis + '<div><b>' + f.t + '</b><span>' + f.s + '</span></div></li>';
    }).join('');
    var ready = status === 'ok';
    root.innerHTML =
      '<div class="det-head"><div><h3>Kavel ' + n + '</h3><p class="det-sub">Installatie · ' + sum + ' van ' + total + ' vastgelegd</p></div>' +
      '<span class="pill ' + PILL[status] + '">' + LABEL[status] + '</span></div>' +
      '<ul class="det-parts">' + parts + '</ul>' +
      '<div class="det-feed"><small>Laatst vastgelegd</small><ul class="feed">' + feed + '</ul></div>' +
      '<div class="det-pdf' + (ready ? '' : ' is-off') + '"><span class="pdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>Rapport als PDF</span>' +
      '<span class="note">' + (ready ? 'Klaar voor de oplevering' : 'Zodra alles is vastgelegd') + '</span></div>';
  }

  var map = $('[data-kavels]');
  var detail = $('[data-kavel-detail]');
  if (map && detail) {
    map.addEventListener('click', function (e) {
      var btn = e.target.closest('button.kv');
      if (!btn) return;
      $all('button.kv', map).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      renderDetail(detail, Number(btn.getAttribute('data-n')), btn.getAttribute('data-status'));
    });
  }

  // ---------- Veegbare rijen: stipjes die de positie tonen ----------
  $all('[data-swipe]').forEach(function (row) {
    var items = Array.prototype.slice.call(row.children);
    var dots = document.createElement('div');
    dots.className = 'dots';
    dots.setAttribute('aria-hidden', 'true');
    items.forEach(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.addEventListener('click', function () { row.scrollTo({ left: item.offsetLeft - items[0].offsetLeft, behavior: 'smooth' }); });
      dots.appendChild(b);
    });
    row.parentNode.insertBefore(dots, row.nextSibling);
    function update() {
      var step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 1;
      var max = row.scrollWidth - row.clientWidth;
      var idx = row.scrollLeft >= max - 4 ? items.length - 1 : Math.round(row.scrollLeft / step);
      Array.prototype.forEach.call(dots.children, function (d, i) { d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    }
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  // ---------- Onthullen bij scrollen ----------
  // De head zet html.js; zonder dit vlaggetje haalt een vangnet de verberg-klasse weer weg
  window.__bp = true;
  document.documentElement.classList.add('js');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = $all('[data-reveal], [data-fill]');
  function reveal(elm) {
    elm.classList.add('is-in');
    if (!elm.hasAttribute('data-fill')) return;
    // Slot: de open kavels springen een voor een op gereed
    var todo = $all('.kv.grijs', elm);
    var count = $('[data-fill-count]', elm);
    todo.forEach(function (k, i) {
      setTimeout(function () {
        k.className = 'kv ok';
        k.querySelector('span').textContent = 'Gereed';
        if (i === todo.length - 1 && count) count.textContent = count.getAttribute('data-fill-count');
      }, calm ? 0 : 500 + i * 160);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (elm) { io.observe(elm); });
  } else {
    revealEls.forEach(reveal);
  }

  // ---------- Demopagina: Calendly meldt zijn hoogte, het iframe groeit mee ----------
  var cal = $('#calendly');
  if (cal) {
    window.addEventListener('message', function (ev) {
      if (ev.origin !== 'https://calendly.com' || !ev.data || ev.data.event !== 'calendly.page_height') return;
      var h = parseInt(ev.data.payload && ev.data.payload.height, 10);
      if (h > 0) { cal.style.height = h + 'px'; cal.style.minHeight = '0'; }
    });
  }
})();
