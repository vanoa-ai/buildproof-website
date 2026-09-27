/* Scan-resultaat: bouwt het FLOW-rapport op uit de URL-parameters
 * (pakket, motor, naam, f, l, o, w, tools), zelfde logica als de originele site. */
window.IF_renderScanResult = function () {
  'use strict';

  var PAKKETTEN = { start: 'Start', groei: 'Groei', pro: 'Pro' };
  var KANSEN = {
    facturen: { letter: 'F', titel: 'Foto’s', tekst: 'Je bewijs staat nu verspreid over telefoons en groepsapps. Met foto’s per project, kavel en onderdeel heb je elke leiding en elk onderdeel direct terug, ook als het al achter een wand zit.' },
    leads: { letter: 'C', titel: 'Checklists', tekst: 'Onderdelen worden nu afgerond zonder vaste controle. Met checklists per onderdeel bepaalt kantoor de vragen, en is een onderdeel pas af als ze zijn beantwoord.' },
    offertes: { letter: 'I', titel: 'Inregelrapport', tekst: 'Meetwaarden staan nu op papier of in een schrift. Met het digitale inregelrapport lees je de luchtstaat uit de tekening, vul je de waarden in op de telefoon en staat het PDF-rapport klaar.' },
    werk: { letter: 'M', titel: 'Meerwerk', tekst: 'Meerwerk en afwijkingen worden nu mondeling afgesproken. Leg ze vast met foto en omschrijving op het moment dat ze gebeuren, dan is er achteraf geen discussie.' }
  };
  var MOTOR_BY_KEY = { f: 'facturen', l: 'leads', o: 'offertes', w: 'werk' };
  var MOTOREN = [
    { key: 'f', letter: 'F', label: 'FOTO’S' },
    { key: 'l', letter: 'C', label: 'CHECKLISTS' },
    { key: 'o', letter: 'I', label: 'INREGELRAPPORT' },
    { key: 'w', letter: 'M', label: 'MEERWERK' }
  ];
  var TOOLS = {
    fotos: { naam: 'Foto’s per kavel', subtekst: 'elk onderdeel direct op de juiste plek' },
    offline: { naam: 'Offline vastleggen', subtekst: 'uploadt vanzelf zodra er bereik is' },
    meerwerk: { naam: 'Meerwerk', subtekst: 'met foto en omschrijving, geen discussie' },
    afwijkingen: { naam: 'Afwijkingen', subtekst: 'melden en opvolgen tot het is opgelost' },
    uren: { naam: 'Urenregistratie', subtekst: 'per project en medewerker' },
    leverbonnen: { naam: 'Digitale leverbonnen', subtekst: 'met handtekening op de bouwplaats' },
    inregelrapport: { naam: 'Inregelrapporten', subtekst: 'meetwaarden per kavel vastgelegd' },
    vgm: { naam: 'VGM-meldingen', subtekst: 'veiligheid aantoonbaar op orde' },
    fotodoelen: { naam: 'Fotodoelen', subtekst: 'zie direct wat nog ontbreekt' },
    dossier: { naam: 'Opleverdossier', subtekst: 'per woning met één klik' },
    delen: { naam: 'Dossier delen', subtekst: 'via een beveiligde link' },
    webdav: { naam: 'WebDAV-sync', subtekst: 'automatisch naar je eigen server' }
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
    '<a class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold rounded-xl px-6 h-12" href="' + (window.IF_BASE || '') + '/aanbod/' + pakketId + '" data-pakket-link="">' + ARROW + '</a></div></div>';

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
