/* BuildProof, interactie zonder framework.
 * Pagina's zijn statische HTML; dit script voegt het gedrag toe:
 * navigatieknoppen, aankondigingsbalk, toestandswissels (menu, FLOW, teamfilter,
 * verschillen-toggle), accordeons, FAQ-zoeken, cookiebanner + Meta Pixel,
 * agenda-popup met boeking, scan-iframes en de scan-resultaatpagina. */
(function () {
  'use strict';

  var LOCATION_ID = 'EBlbn3NuyWKEfmtOiFyO';
  var CALENDAR_ID = 'vtLjEL5ryKyHmS2VicJb';
  var VIBE_API = 'https://backend.leadconnectorhq.com/vibe-ai';
  var TRACKING_ID = 'tk_f1f0aa88c4014f15bb72d8fa66e94593';
  var PIXEL_ID = '1366587868929082';
  var CONSENT_KEY = 'buildproof_cookie_consent';
  var CONSENT_TTL = 6 * 30 * 24 * 60 * 60 * 1000;
  var COOKIE_EVENT = 'cookiebanner:open';
  var SCAN_ORIGIN = 'https://ai-scanrapport.vibepreview.com';

  // De site kan onder een subpad draaien (bijv. /buildproof-v4): afgeleid uit de src van dit script
  var BASE = ((document.currentScript && document.currentScript.src.match(/^https?:\/\/[^/]+(.*)\/assets\/site\.js/)) || [])[1] || '';
  window.IF_BASE = BASE;
  var path = location.pathname.slice(BASE.length).replace(/\/+$/, '') || '/';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uuid() { return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })); }
  function deviceType() { return /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'; }

  // ---------- Tracking (LeadConnector external tracking) ----------
  function trackForm() { /* geen externe tracking in de BuildProof-versie */ }
  function trackFormOrig(formId, formData, type) {
    fetch('https://backend.leadconnectorhq.com/external-tracking/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', version: '2021-07-28' },
      body: JSON.stringify({
        type: type || 'external form_submission',
        timestamp: Date.now(),
        formId: formId,
        formData: formData || {},
        url: location.href,
        title: document.title,
        path: location.pathname,
        userAgent: navigator.userAgent,
        trackingId: TRACKING_ID,
        locationId: LOCATION_ID,
        sessionId: uuid(),
        properties: { deviceType: deviceType() }
      })
    }).catch(function () {});
  }

  // ---------- Cookie consent + Meta Pixel ----------
  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || !v.timestamp) return null;
      if (Date.now() - v.timestamp > CONSENT_TTL) { localStorage.removeItem(CONSENT_KEY); return null; }
      return v.value;
    } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: value, timestamp: Date.now() })); } catch (e) {}
  }
  var pixelLoaded = false;
  function loadPixel() {
    return; // BuildProof gebruikt geen Meta Pixel
    if (pixelLoaded) return;
    pixelLoaded = true;
    (function (f, b, e, v) {
      if (f.fbq) return;
      var n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      var t = b.createElement(e); t.async = true; t.src = v;
      var s = b.getElementsByTagName(e)[0]; s && s.parentNode && s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function trackLead() { if (typeof window.fbq === 'function') window.fbq('track', 'Lead'); }

  var cookieBanner = null;
  function showCookieBanner() {
    if (cookieBanner) return;
    var tpl = $('template#tpl-cookie');
    if (!tpl) return;
    cookieBanner = tpl.content.firstElementChild.cloneNode(true);
    document.body.appendChild(cookieBanner);
    $all('button', cookieBanner).forEach(function (b) {
      b.addEventListener('click', function () {
        var accept = b.textContent.trim() === 'Accepteren';
        setConsent(accept ? 'accepted' : 'rejected');
        if (accept) loadPixel();
        cookieBanner.remove();
        cookieBanner = null;
      });
    });
  }
  window.addEventListener(COOKIE_EVENT, showCookieBanner);

  // ---------- Toasts ----------
  var toastViewport = null;
  function toast(title, description, destructive) {
    if (!toastViewport) {
      toastViewport = el('<ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol>');
      document.body.appendChild(toastViewport);
    }
    var cls = 'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full ' +
      (destructive ? 'destructive group border-destructive bg-destructive text-destructive-foreground' : 'border bg-background text-foreground');
    var t = el('<li role="status" aria-live="off" aria-atomic="true" tabindex="0" data-state="open" class="' + cls + '">' +
      '<div class="grid gap-1"><div class="text-sm font-semibold">' + esc(title) + '</div><div class="text-sm opacity-90">' + esc(description) + '</div></div>' +
      '<button type="button" toast-close="" class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></li>');
    toastViewport.innerHTML = '';
    toastViewport.appendChild(t);
    function close() { t.setAttribute('data-state', 'closed'); setTimeout(function () { t.remove(); }, 200); }
    $('button', t).addEventListener('click', close);
    setTimeout(close, 5000);
  }

  // ---------- Agenda-popup ----------
  var NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var NL_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  var BTN = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';
  var BTN_OUTLINE = BTN + ' border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full';
  var BTN_GHOST_SM = BTN + ' hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3';
  var BTN_DEFAULT = BTN + ' bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full';
  var INPUT = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
  var TEXTAREA = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  var LABEL = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
  var DAY_BASE = BTN + ' hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0 font-normal aria-selected:opacity-100';
  var DAY_SELECTED = ' bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground';
  var DAY_TODAY = ' bg-accent text-accent-foreground';
  var DAY_OUTSIDE = ' day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30';
  var DAY_DISABLED = ' text-muted-foreground opacity-50';
  var CELL = 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20';

  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hhmm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function longDate(d) { return NL_DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + NL_MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' om ' + hhmm(d); }

  var cal = null;
  function openCalendar() {
    if (cal) return;
    var tpl = $('template#tpl-calendar');
    if (!tpl) return;
    var frag = tpl.content.cloneNode(true);
    var overlay = frag.querySelector('[data-cal-overlay]');
    var dialog = frag.querySelector('[role=dialog]');
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    document.body.style.overflow = 'hidden';
    var today = startOfDay(new Date());
    cal = { overlay: overlay, dialog: dialog, month: new Date(today.getFullYear(), today.getMonth(), 1), selected: null, slot: null, slots: [], loading: false, submitting: false, form: { firstName: '', lastName: '', email: '', phone: '', notes: '' } };
    overlay.addEventListener('click', closeCalendar);
    $('[data-cal-close]', dialog).addEventListener('click', closeCalendar);
    renderCalendarBody();
    dialog.focus();
  }
  function closeCalendar() {
    if (!cal) return;
    var c = cal; cal = null;
    c.overlay.setAttribute('data-state', 'closed');
    c.dialog.setAttribute('data-state', 'closed');
    document.body.style.overflow = '';
    setTimeout(function () { c.overlay.remove(); c.dialog.remove(); }, 200);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCalendar(); });

  function renderMonth() {
    var today = startOfDay(new Date());
    var max = addDays(new Date(), 30);
    var m = cal.month;
    var first = new Date(m.getFullYear(), m.getMonth(), 1);
    var offset = (first.getDay() + 6) % 7; // maandag = eerste dag
    var start = addDays(first, -offset);
    var last = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    var weeks = Math.ceil((offset + last.getDate()) / 7);
    var rows = '';
    for (var w = 0; w < weeks; w++) {
      rows += '<tr class="flex w-full mt-2">';
      for (var d = 0; d < 7; d++) {
        var day = addDays(start, w * 7 + d);
        var outside = day.getMonth() !== m.getMonth();
        var disabled = day < today || day > max;
        var selected = sameDay(day, cal.selected);
        var cls = DAY_BASE + (selected ? DAY_SELECTED : '') + (sameDay(day, today) ? DAY_TODAY : '') + (outside ? DAY_OUTSIDE : '') + (disabled ? DAY_DISABLED : '');
        rows += '<td class="' + CELL + '" role="presentation"><button name="day" class="rdp-button_reset rdp-button ' + cls + '" role="gridcell"' +
          (disabled ? ' disabled=""' : '') + (selected ? ' aria-selected="true"' : '') + ' tabindex="' + (selected || (!cal.selected && sameDay(day, today)) ? 0 : -1) + '" type="button" data-day="' + ymd(day) + '">' + day.getDate() + '</button></td>';
      }
      rows += '</tr>';
    }
    var navBtn = BTN + ' border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100';
    var head = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map(function (s, i) {
      return '<th scope="col" class="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]" aria-label="' + ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'][i] + '">' + s + '</th>';
    }).join('');
    return '<div class="p-3 rounded-md border shadow"><div class="flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0"><div class="space-y-4">' +
      '<div class="flex justify-center pt-1 relative items-center"><div class="text-sm font-medium" aria-live="polite" role="presentation">' + NL_MONTHS[m.getMonth()] + ' ' + m.getFullYear() + '</div>' +
      '<div class="space-x-1 flex items-center">' +
      '<button name="previous-month" aria-label="Go to previous month" class="rdp-button_reset rdp-button ' + navBtn + ' absolute left-1" type="button" data-cal-nav="-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left h-4 w-4"><path d="m15 18-6-6 6-6"></path></svg></button>' +
      '<button name="next-month" aria-label="Go to next month" class="rdp-button_reset rdp-button ' + navBtn + ' absolute right-1" type="button" data-cal-nav="1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right h-4 w-4"><path d="m9 18 6-6-6-6"></path></svg></button>' +
      '</div></div>' +
      '<table class="w-full border-collapse space-y-1" role="grid"><thead class="rdp-head"><tr class="flex">' + head + '</tr></thead><tbody class="rdp-tbody">' + rows + '</tbody></table>' +
      '</div></div></div>';
  }

  function renderSlots() {
    if (!cal.selected) return '<p class="text-sm text-muted-foreground">Selecteer eerst een datum in de kalender.</p>';
    if (cal.loading) return '<p class="text-sm text-muted-foreground">Tijden laden...</p>';
    if (!cal.slots.length) return '<p class="text-sm text-muted-foreground">Geen tijden beschikbaar op deze datum.</p>';
    return '<div class="grid grid-cols-2 gap-2" data-custom-field="6REBZRhRn5BeIyS6Vpoo">' + cal.slots.map(function (s) {
      return '<button class="' + BTN_OUTLINE + '" data-slot="' + esc(s) + '">' + hhmm(new Date(s)) + '</button>';
    }).join('') + '</div>';
  }

  function field(id, label, type, required) {
    return '<div class="space-y-2"><label class="' + LABEL + '" for="' + id + '">' + label + '</label><input type="' + (type || 'text') + '" class="' + INPUT + '" id="' + id + '"' + (required ? ' required=""' : '') + ' value="' + esc(cal.form[id]) + '"></div>';
  }

  function renderCalendarBody() {
    var body = $('[data-cal-body]', cal.dialog);
    // Afspraken lopen via Calendly
    body.innerHTML = '<div class="py-4"><iframe src="https://calendly.com/buildproof-nl/kort-gesprek?hide_gdpr_banner=1&primary_color=fece21" title="Plan een demo met BuildProof" style="width:100%;height:640px;border:0;border-radius:12px"></iframe></div>';
    return;
    if (cal.slot) {
      body.innerHTML = '<form class="space-y-4 py-4">' +
        '<div class="flex items-center justify-between bg-muted p-4 rounded-lg"><div><p class="font-medium">Gekozen tijd:</p><p class="text-sm text-muted-foreground">' + longDate(new Date(cal.slot)) + '</p></div>' +
        '<button class="' + BTN_GHOST_SM + '" type="button" data-cal-change="">Wijzig</button></div>' +
        '<div class="grid grid-cols-2 gap-4">' + field('firstName', 'Voornaam *', 'text', true) + field('lastName', 'Achternaam *', 'text', true) + '</div>' +
        '<div class="grid grid-cols-2 gap-4">' + field('email', 'E-mailadres *', 'email', true) + field('phone', 'Telefoonnummer *', 'tel', true) + '</div>' +
        '<div class="space-y-2" data-custom-field="XW3B8Q0SmhusrGPwbQxT"><label class="' + LABEL + '" for="notes">Opmerkingen (optioneel)</label><textarea class="' + TEXTAREA + '" id="notes">' + esc(cal.form.notes) + '</textarea></div>' +
        '<button class="' + BTN_DEFAULT + '" type="submit"' + (cal.submitting ? ' disabled=""' : '') + '>' + (cal.submitting ? 'Bezig met boeken...' : 'Bevestig afspraak') + '</button>' +
        '</form>';
      var form = $('form', body);
      $all('input,textarea', form).forEach(function (i) { i.addEventListener('input', function () { cal.form[i.id] = i.value; }); });
      $('[data-cal-change]', form).addEventListener('click', function () { cal.slot = null; renderCalendarBody(); });
      form.addEventListener('submit', submitBooking);
      return;
    }
    body.innerHTML = '<div class="grid md:grid-cols-2 gap-8 py-4"><div>' + renderMonth() + '</div><div class="space-y-4"><h3 class="font-medium">Beschikbare tijden</h3>' + renderSlots() + '</div></div>';
    $all('[data-cal-nav]', body).forEach(function (b) {
      b.addEventListener('click', function () { cal.month = new Date(cal.month.getFullYear(), cal.month.getMonth() + Number(b.getAttribute('data-cal-nav')), 1); renderCalendarBody(); });
    });
    $all('[data-day]', body).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-day').split('-');
        var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        if (sameDay(d, cal.selected)) { cal.selected = null; renderCalendarBody(); return; }
        cal.selected = d;
        if (d.getMonth() !== cal.month.getMonth()) cal.month = new Date(d.getFullYear(), d.getMonth(), 1);
        fetchSlots(d);
      });
    });
    $all('[data-slot]', body).forEach(function (b) {
      b.addEventListener('click', function () { cal.slot = b.getAttribute('data-slot'); renderCalendarBody(); });
    });
  }

  function fetchSlots(date) {
    var c = cal;
    c.loading = true; renderCalendarBody();
    var start = startOfDay(new Date()).getTime();
    var end = startOfDay(addDays(new Date(), 31)).getTime();
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch('https://backend.leadconnectorhq.com/calendars/' + CALENDAR_ID + '/free-slots?startDate=' + start + '&endDate=' + end + '&timezone=' + tz)
      .then(function (r) { return r.json(); })
      .then(function (data) { var k = ymd(date); c.slots = data[k] && data[k].slots ? data[k].slots : []; })
      .catch(function (e) { console.error('Error fetching slots:', e); c.slots = []; })
      .then(function () { c.loading = false; if (cal === c && sameDay(c.selected, date)) renderCalendarBody(); });
  }

  function submitBooking(e) {
    e.preventDefault();
    if (!cal || !cal.slot) return;
    var c = cal, f = c.form;
    c.submitting = true; renderCalendarBody();
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var sessionId = uuid();
    fetch('https://backend.leadconnectorhq.com/external-tracking/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', version: '2021-07-28' },
      body: JSON.stringify({
        type: 'external_form_submission', timestamp: Date.now(), formId: 'Kalender workflow',
        formData: { first_name: f.firstName, last_name: f.lastName, email: f.email, phone: f.phone, 'contact.berichtopmerkingen': f.notes, 'contact.gekozen_tijdstip': c.slot, Timezone: tz },
        url: location.href, title: document.title, path: location.pathname, userAgent: navigator.userAgent,
        trackingId: TRACKING_ID, locationId: LOCATION_ID, sessionId: sessionId, properties: { deviceType: deviceType() }
      })
    }).catch(function () {});
    fetch(VIBE_API + '/booking/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: LOCATION_ID, calendarId: CALENDAR_ID, firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone, notes: f.notes,
        selectedSlot: c.slot, selectedTimezone: tz, sessionId: sessionId, timezone: tz,
        customFields: [
          { id: 'XW3B8Q0SmhusrGPwbQxT', key: 'contact.berichtopmerkingen', field_value: f.notes },
          { id: '6REBZRhRn5BeIyS6Vpoo', key: 'contact.gekozen_tijdstip', field_value: c.slot }
        ]
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('Booking failed');
      toast('Afspraak geboekt!', 'We hebben je aanvraag succesvol ontvangen en kijken uit naar ons gesprek.');
      closeCalendar();
    }).catch(function () {
      toast('Er is iets misgegaan', 'Probeer het later opnieuw of neem direct contact op.', true);
    }).then(function () {
      c.submitting = false;
      if (cal === c) renderCalendarBody();
    });
  }
  window.addEventListener('ontdek:open-booking', openCalendar);

  // ---------- Toestandswissels (menu, FLOW, teamfilter, verschillen) ----------
  function swap(trigger) {
    var spec = trigger.getAttribute('data-swap-set').split(':');
    var gid = spec[0], key = spec[1];
    var root = $('[data-swap-root="' + gid + '"]');
    if (!root) return;
    var toggle = trigger.hasAttribute('data-swap-toggle');
    if (toggle && root.getAttribute('data-swap-state') === key) key = 'base';
    var tpl = $('template[data-swap="' + gid + '"][data-key="' + key + '"]');
    if (!tpl) return;
    var next = tpl.content.firstElementChild.cloneNode(true);
    root.replaceWith(next);
  }

  // ---------- Accordeons (Radix-markup) ----------
  function setAcc(trigger, open) {
    var region = document.getElementById(trigger.getAttribute('aria-controls'));
    var h3 = trigger.closest('h3');
    var item = h3 && h3.parentElement;
    var state = open ? 'open' : 'closed';
    [item, h3, trigger, region].forEach(function (n) { n && n.setAttribute('data-state', state); });
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!region) return;
    if (open) {
      region.hidden = false;
      region.style.setProperty('--radix-collapsible-content-height', region.scrollHeight + 'px');
      region.style.setProperty('--radix-accordion-content-height', region.scrollHeight + 'px');
    } else {
      region.style.setProperty('--radix-collapsible-content-height', region.scrollHeight + 'px');
      region.style.setProperty('--radix-accordion-content-height', region.scrollHeight + 'px');
      var done = function () { if (region.getAttribute('data-state') === 'closed') region.hidden = true; };
      region.addEventListener('animationend', done, { once: true });
      setTimeout(done, 300);
    }
  }
  function toggleAcc(trigger) {
    var open = trigger.getAttribute('aria-expanded') !== 'true';
    var item = trigger.closest('h3').parentElement;
    if (open && item.parentElement) {
      $all(':scope > [data-state="open"] > h3 > button[aria-controls]', item.parentElement).forEach(function (t) { if (t !== trigger) setAcc(t, false); });
    }
    setAcc(trigger, open);
  }

  // ---------- Klik-delegatie ----------
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;
    var closeBar = t.closest('[data-bar-close]');
    if (closeBar) {
      e.stopPropagation();
      try { sessionStorage.setItem('announcementBarDismissed', 'true'); } catch (x) {}
      var bar = closeBar.closest('[data-announcement]');
      bar && bar.remove();
      return;
    }
    var acc = t.closest('button[aria-controls][data-radix-collection-item]');
    if (acc) { toggleAcc(acc); return; }
    var sw = t.closest('[data-swap-set]');
    if (sw) { swap(sw); return; }
    var open = t.closest('[data-open]');
    if (open) {
      var what = open.getAttribute('data-open');
      if (what === 'calendar') {
        if (path === '/') trackForm('Kalender workflow');
        openCalendar();
      } else if (what === 'cookies') {
        window.dispatchEvent(new Event(COOKIE_EVENT));
      }
      return;
    }
    var sc = t.closest('[data-scroll-to]');
    if (sc) {
      var target = document.getElementById(sc.getAttribute('data-scroll-to'));
      target && target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    var nav = t.closest('[data-href]');
    if (nav) {
      var href = nav.getAttribute('data-href');
      if (href === '/ontdek#scan') {
        // Zoals het origineel: naar /ontdek (zonder hash) en daar naar de scan scrollen
        if (path === '/ontdek') {
          var s = document.getElementById('scan');
          s && s.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        try { sessionStorage.setItem('if:scrollToScan', '1'); } catch (x) {}
        location.href = BASE + '/ontdek';
        return;
      }
      if (path === '/' && href === '/scan') trackForm('Contactformulier ingevuld');
      location.href = BASE + href;
      return;
    }
    // Links in het open mobiele menu sluiten het menu
    var menuLink = t.closest('[data-swap-state]:not([data-swap-state="base"]) a[href]');
    if (menuLink) {
      var root = menuLink.closest('[data-swap-state]');
      var gid = root.getAttribute('data-swap-root');
      var base = $('template[data-swap="' + gid + '"][data-key="base"]');
      if (base && root.hasAttribute('data-swap-menu')) root.replaceWith(base.content.firstElementChild.cloneNode(true));
    }
  });

  // ---------- FAQ-zoeken ----------
  var search = $('input[placeholder="Zoek een vraag..."]');
  if (search) {
    var accRoot = null;
    var firstTrigger = $('button[aria-controls][data-radix-collection-item]');
    if (firstTrigger) accRoot = firstTrigger.closest('h3').parentElement.parentElement;
    var empty = el('<div class="text-center py-12" hidden><p class="text-zinc-500 font-medium"></p></div>');
    accRoot && accRoot.parentNode.insertBefore(empty, accRoot.nextSibling);
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(accRoot.children, function (item) {
        var trigger = $('button[aria-controls]', item);
        var region = document.getElementById(trigger.getAttribute('aria-controls'));
        var match = q === '' || trigger.textContent.toLowerCase().indexOf(q) !== -1 || (region && region.textContent.toLowerCase().indexOf(q) !== -1);
        item.hidden = !match;
        if (match) shown++;
      });
      accRoot.hidden = shown === 0;
      empty.hidden = shown !== 0;
      $('p', empty).textContent = 'Geen vragen gevonden voor "' + search.value + '".';
    });
  }

  // ---------- Scan-iframe berichten ----------
  if (path === '/scan' || path === '/ontdek') {
    window.addEventListener('message', function (ev) {
      if (ev.origin !== SCAN_ORIGIN) return;
      var frame = document.getElementById('scanframe');
      if (!frame || !ev.data) return;
      if (ev.data.type === 'scanflow:height' && ev.data.height) frame.style.height = ev.data.height + 'px';
      if (path === '/scan' && ev.data.type === 'scanflow:scrolltop') frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (ev.data.type === 'scan_lead_submitted') trackLead();
      if (ev.data.type === 'scan-complete' && typeof ev.data.url === 'string' && ev.data.url.indexOf(location.origin + BASE + '/') === 0) location.href = ev.data.url;
    });
  }
  if (path === '/') {
    window.addEventListener('message', function (ev) {
      var hit = false;
      try {
        var d = ev.data;
        if (!d) return;
        var m = (typeof d === 'string' ? d : JSON.stringify(d)).toLowerCase();
        hit = ['form-submit', 'form_submit', 'formsubmitted', 'form submission', 'submit_success', 'redirect'].some(function (k) { return m.indexOf(k) !== -1; });
      } catch (x) {}
      if (hit) { trackForm('Contactformulier ingevuld'); location.href = BASE + '/scan'; }
    });
  }

  // ---------- Scan-resultaat ----------
  if (path === '/scan-resultaat' && window.IF_renderScanResult) window.IF_renderScanResult();

  // ---------- Opstart ----------
  try { if (sessionStorage.getItem('announcementBarDismissed') === 'true') $all('[data-announcement]').forEach(function (b) { b.remove(); }); } catch (x) {}
  if (getConsent() === null) showCookieBanner();
  if (getConsent() === 'accepted') loadPixel();
  try {
    if (path === '/ontdek' && sessionStorage.getItem('if:scrollToScan')) {
      sessionStorage.removeItem('if:scrollToScan');
      setTimeout(function () { var sc = document.getElementById('scan'); sc && sc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400);
    }
  } catch (x) {}
  if (path === '/ontdek' && location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  }
})();
