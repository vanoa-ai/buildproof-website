/* BuildProof v3 — menu, voordelen-tabs, strip en demo-popup (Calendly). */
(function () {
  'use strict';
  var CALENDLY = 'https://calendly.com/buildproof-nl/kort-gesprek?hide_gdpr_banner=1&primary_color=e07840';

  // Mobiel menu
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('mainNav');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a,button')) setMenu(false); });

  // Voordelen-tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role=tab]'));
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(i); });
    tab.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(next); tabs[next].focus();
      }
    });
  });
  function select(i) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }

  // Strip sluiten (per sessie)
  var strip = document.getElementById('strip');
  try { if (sessionStorage.getItem('bp-strip') === 'dicht') strip.remove(); } catch (e) {}
  var close = document.getElementById('stripClose');
  close && close.addEventListener('click', function () {
    strip.remove();
    try { sessionStorage.setItem('bp-strip', 'dicht'); } catch (e) {}
  });

  // Demo-popup
  var modal = document.getElementById('demoModal');
  var frame = document.getElementById('demoFrame');
  var lastFocus = null;
  function openDemo() {
    lastFocus = document.activeElement;
    if (!frame.firstChild) frame.innerHTML = '<iframe src="' + CALENDLY + '" title="Plan een demo met BuildProof" loading="lazy"></iframe>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }
  function closeDemo() {
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-demo]')) { e.preventDefault(); openDemo(); }
    else if (e.target.closest('[data-close]')) closeDemo();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeDemo(); });
})();
