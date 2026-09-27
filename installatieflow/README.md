# Installatieflow — statische kloon

1-op-1 nabouw van https://installatieflow.ai als statische HTML/CSS/JS (geen React, geen build-stap).

## Starten

```bash
node installatieflow/server.js   # http://localhost:4000
```

De server gebruikt `express` uit de hoofdmap van deze repo.

## Structuur

| Pad | Inhoud |
| --- | --- |
| `index.html` | Home |
| `aanbod/`, `aanbod/{start,groei,pro}/` | Pakketpagina's (`/aanbod` = Groei, onbekend pakket valt ook terug op Groei) |
| `faq/`, `ontdek/`, `privacyverklaring/`, `scan/`, `scan-resultaat/` | Overige pagina's |
| `404.html` | Niet-gevonden-pagina |
| `assets/app.css` | Originele gecompileerde Tailwind-CSS (afbeeldingspaden lokaal gemaakt) |
| `assets/site.js` | Alle interactie: menu, FLOW-tabs, teamfilter, verschillen-toggle, accordeons, FAQ-zoeken, cookiebanner + Meta Pixel, agenda-popup + boeking, scan-iframes |
| `assets/scan-resultaat.js` | Bouwt het FLOW-rapport op uit de URL-parameters |
| `assets/img/` | Alle afbeeldingen lokaal |

## Hoe het werkt

- Toestanden (menu open, FLOW-letter, teamgrootte, "Toon alleen verschillen") staan als `<template data-swap=…>` in de pagina. Knoppen met `data-swap-set` wisselen de container.
- Knoppen met `data-href` navigeren, `data-open="calendar|cookies"` opent een popup, `data-scroll-to` scrollt.
- Externe koppelingen zijn ongewijzigd: LeadConnector-agenda en -tracking, chatwidget (alleen desktop), scan-iframe (`ai-scanrapport.vibepreview.com`) en Meta Pixel (pas na cookie-akkoord).
