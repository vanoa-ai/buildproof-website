/* Scan-resultaat: bouwt het FLOW-rapport op uit de URL-parameters
 * (pakket, motor, naam, f, l, o, w, tools) — zelfde logica als de originele site. */
window.IF_renderScanResult = function () {
  'use strict';

  var PAKKETTEN = { start: 'Start', groei: 'Groei', pro: 'Pro' };
  var KANSEN = {
    facturen: { letter: 'F', titel: 'Facturen', tekst: 'Administratie kost je nu tijd en cashflow. Automatische verwerking van werkbonnen en facturen geeft je die uren terug, en facturen die automatisch worden opgevolgd worden sneller betaald.' },
    leads: { letter: 'L', titel: 'Leads & opvolging', tekst: 'Wie het eerst reageert, krijgt de klus. Automatische opvolging binnen 2 minuten, 24/7, haalt meer omzet uit de aanvragen die je nu al krijgt. Zonder dat jij er iets voor hoeft te doen.' },
    offertes: { letter: 'O', titel: 'Offertes', tekst: 'Jouw offertes blijven liggen of worden niet structureel opgevolgd. Met automatische offerte-opvolging en een offerte-assistent gaat elke offerte snel de deur uit en wordt hij nagejaagd. Direct meer omzet uit werk dat je al gedaan hebt.' },
    werk: { letter: 'W', titel: 'Werk & overzicht', tekst: 'Te veel komt nu bij jou samen. Eén systeem met alles op één plek en automatische planning geeft je grip terug, en maakt het bedrijf minder afhankelijk van jou.' }
  };
  var MOTOR_BY_KEY = { f: 'facturen', l: 'leads', o: 'offertes', w: 'werk' };
  var MOTOREN = [
    { key: 'f', letter: 'F', label: 'FACTUREN' },
    { key: 'l', letter: 'L', label: 'LEADS & OPVOLGING' },
    { key: 'o', letter: 'O', label: 'OFFERTES' },
    { key: 'w', letter: 'W', label: 'WERK & OVERZICHT' }
  ];
  var TOOLS = {
    website: { naam: 'Slimme website', subtekst: 'vangt aanvragen, incl. hosting en SSL' },
    configurator: { naam: 'Offerte-configurator', subtekst: 'klant stelt zijn klus zelf samen' },
    chat: { naam: 'Chat-assistent', subtekst: 'reageert direct op elke klant' },
    agenda: { naam: 'Agenda & boekingen', subtekst: 'afspraken plannen zichzelf in' },
    crm: { naam: 'CRM & klantdossier', subtekst: 'elke klant compleet in beeld' },
    email: { naam: 'E-mail opvolging', subtekst: 'vaste workflows, niks vergeten' },
    whatsapp: { naam: 'WhatsApp assistent', subtekst: 'leads warm gehouden, vanzelf' },
    offerte: { naam: 'Offerte Assistent', subtekst: 'offerte in 2 minuten in de mail' },
    facturatie: { naam: 'Automatische facturatie', subtekst: 'klus klaar, factuur onderweg' },
    betalingen: { naam: 'Betalingen & herinneringen', subtekst: 'je geld komt binnen, zonder nabellen' },
    dashboard: { naam: 'Dashboard & rapportage', subtekst: 'al je aanvragen in een overzicht' },
    telefoon: { naam: 'AI-telefoonassistent', subtekst: 'elke oproep opgevangen, 24/7' },
    chatbot: { naam: 'Chatbot medewerker', subtekst: 'voert het gesprek, dag en nacht' },
    'gemiste-oproep': { naam: 'Gemiste-oproep opvolging', subtekst: 'gemiste oproep? automatisch een berichtje' },
    herinneringen: { naam: 'Afspraakherinneringen', subtekst: 'bevestiging en herinnering, vanzelf' },
    ondertekening: { naam: 'Ondertekening', subtekst: 'akkoord digitaal, rechtsgeldig geregeld' },
    reviews: { naam: 'Reviews & reputatie', subtekst: 'tevreden klanten laten het zien' }
  };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var params = new URLSearchParams(location.search);
  function param(name) {
    var found = null;
    params.forEach(function (v, k) { if (found === null && k.toLowerCase() === name.toLowerCase()) found = v; });
    return found;
  }

  var pakketParam = (param('pakket') || '').toLowerCase();
  var motorParam = (param('motor') || '').toLowerCase();
  var naam = param('naam') || '';
  var pakketId = PAKKETTEN[pakketParam] ? pakketParam : 'start';
  var pakketNaam = PAKKETTEN[pakketId] || 'Start';

  var scores = {};
  var compleet = true;
  MOTOREN.forEach(function (m) {
    var raw = param(m.key);
    var n = raw !== null ? parseInt(raw, 10) : NaN;
    if (raw === null || isNaN(n) || n < 0) compleet = false;
    scores[m.key] = isNaN(n) ? 0 : Math.max(0, n);
  });

  var motor = motorParam;
  if (compleet) {
    var best = -1, bestKey = '';
    MOTOREN.forEach(function (m) { if (scores[m.key] > best) { best = scores[m.key]; bestKey = m.key; } });
    if (best > 0) motor = MOTOR_BY_KEY[bestKey] || motorParam;
  }
  var kans = KANSEN[motor] || KANSEN.leads;
  var tools = (param('tools') || '').split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t.length > 0 && !!TOOLS[t]; });
  var maxScore = Math.max.apply(null, MOTOREN.map(function (m) { return scores[m.key]; }));

  function niveau(key) {
    var n = scores[key];
    return compleet && maxScore > 0 && n === maxScore ? 'grootste' : n >= 1 ? 'kans' : 'orde';
  }
  function breedte(niv, n) { return niv === 'grootste' ? '96%' : niv === 'kans' ? Math.min(85, 58 + n * 7) + '%' : '46%'; }
  function balkKleur(niv) { return niv === 'grootste' ? 'bg-red-500' : niv === 'kans' ? 'bg-amber-500' : 'bg-green-600'; }
  function label(niv) { return niv === 'grootste' ? 'Grootste kans' : niv === 'kans' ? 'Grote kans' : 'Op orde'; }
  function tekstKleur(niv) { return niv === 'grootste' ? 'text-red-500' : niv === 'kans' ? 'text-amber-500' : 'text-green-600'; }

  // Titel met naam
  var h1 = document.querySelector('main h1');
  if (h1 && naam) {
    // Losse tekstnodes, net als het origineel (beïnvloedt de tekst-shaping)
    var span = document.createElement('span');
    span.className = 'bg-primary text-primary-foreground px-2 py-0.5 rounded-md';
    span.textContent = naam;
    h1.textContent = '';
    h1.append('Jouw FLOW-rapport,', ' ', span);
  }
  if (!compleet) return;

  var fallback = Array.prototype.find.call(document.querySelectorAll('main p'), function (p) { return p.textContent.indexOf('Je scan is verwerkt.') === 0; });
  var card = fallback && fallback.parentElement;
  if (!card) return;

  var ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-2 w-4 h-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
  var DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>';

  var html = '';
  html += '<div class="bg-[#FAFAF8] border border-zinc-200 rounded-xl p-3 text-center text-sm font-bold text-zinc-500 mb-6">Hoe voller de balk, hoe groter jouw kans. <span class="text-[#111113]">Rood = daar beginnen we.</span></div>';
  html += '<div class="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 mb-6 shadow-[0_20px_50px_rgba(17,17,19,0.07)]"><div class="space-y-5">';
  MOTOREN.forEach(function (m) {
    var niv = niveau(m.key);
    html += '<div class="flex items-center gap-3">' +
      '<div class="w-10 h-10 rounded-xl bg-[#111113] text-[#FFCC00] font-black flex items-center justify-center shrink-0 text-lg">' + m.letter + '</div>' +
      '<div class="flex-1 min-w-0"><div class="text-xs font-extrabold uppercase tracking-[0.06em] mb-1.5 text-[#111113]">' + esc(m.label) + '</div>' +
      '<div class="h-3 bg-[#E8E8E4] rounded-full overflow-hidden"><div class="h-full rounded-full transition-all duration-1000 ease-out ' + balkKleur(niv) + '" style="width: ' + breedte(niv, scores[m.key]) + '; transition-delay: 300ms;"></div></div></div>' +
      '<div class="text-xs font-extrabold shrink-0 w-24 text-right ' + tekstKleur(niv) + '">' + label(niv) + '</div></div>';
  });
  html += '</div></div>';
  html += '<div class="bg-[#FFCC00] border-2 border-[#FFCC00] rounded-2xl p-6 md:p-8 mb-6"><div class="text-xs font-extrabold uppercase tracking-[0.1em] text-[#111113] mb-2">JOUW GROOTSTE KANS</div>' +
    '<h2 class="text-2xl md:text-3xl font-black text-[#111113] tracking-tight mb-3">' + esc(kans.titel) + '</h2>' +
    '<p class="text-base text-[#111113] font-medium leading-relaxed">' + esc(kans.tekst) + '</p></div>';
  if (tools.length) {
    html += '<div class="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 mb-6 shadow-[0_20px_50px_rgba(17,17,19,0.07)]"><div class="text-xs font-extrabold tracking-[0.1em] uppercase text-primary mb-5">Aanbevolen voor jou</div><ol class="space-y-4">';
    tools.forEach(function (t, i) {
      html += '<li class="flex items-start gap-4"><div class="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center shrink-0 text-sm">' + (i + 1) + '</div>' +
        '<div class="pt-0.5"><div class="font-black text-[#111113] text-base leading-tight">' + esc(TOOLS[t].naam) + '</div><div class="text-sm text-zinc-500 font-medium mt-0.5">' + esc(TOOLS[t].subtekst) + '</div></div></li>';
    });
    html += '</ol></div>';
  }
  html += '<div class="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 mb-6 shadow-[0_20px_50px_rgba(17,17,19,0.07)]"><div class="text-xs font-extrabold tracking-[0.1em] uppercase text-zinc-400 mb-2">Aanbevolen pakket</div>' +
    '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div class="text-2xl font-black text-[#111113]">' + esc(pakketNaam) + '</div>' +
    '<a class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold rounded-xl px-6 h-12" href="/aanbod/' + pakketId + '" data-pakket-link="">' + ARROW + '</a></div></div>';
  html += '<div class="flex justify-center mb-6"><a href="https://ai-scanrapport.vibepreview.com/rapport' + esc(location.search) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-[#FFCC00] text-[#111113] font-extrabold rounded-xl px-8 h-14 hover:translate-y-[-2px] transition-all shadow-[0_4px_14px_rgba(255,204,0,0.35)]">' + DOWNLOAD + ' Download jouw rapport (PDF)</a></div>';

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  var parent = card.parentNode;
  var link = wrap.querySelector('[data-pakket-link]');
  link.removeAttribute('data-pakket-link');
  link.insertBefore(document.createTextNode(' '), link.firstChild);
  link.insertBefore(document.createTextNode(pakketNaam), link.firstChild);
  link.insertBefore(document.createTextNode('Bekijk pakket '), link.firstChild);
  var legend = wrap.firstElementChild;
  legend.insertBefore(document.createTextNode(' '), legend.lastElementChild);
  legend.firstChild.nodeValue = 'Hoe voller de balk, hoe groter jouw kans.';
  while (wrap.firstChild) parent.insertBefore(wrap.firstChild, card);
  card.remove();
};
