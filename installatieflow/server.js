// Lokale server voor de Installatieflow-kloon: schone URL's + 404-pagina.
// Start: node installatieflow/server.js  (http://localhost:4000/installatieflow/)
// Alle paden in de pagina's gaan uit van het subpad /installatieflow (zoals op site.buildproof.nl).
const express = require('express');
const path = require('path');

const app = express();
const site = express.Router();
const BASE = '/installatieflow';
const ROOT = __dirname;
const PORT = process.env.PORT || 4000;

// Onbekend pakket valt terug op Groei, net als het origineel
site.get('/aanbod/:id', (req, res, next) => {
  if (['start', 'groei', 'pro'].includes(req.params.id)) return next();
  res.sendFile(path.join(ROOT, 'aanbod/index.html'));
});

// Schone URL's zonder slash aan het eind: /faq -> faq/index.html
site.use((req, res, next) => {
  if (path.extname(req.path)) return next();
  const file = path.join(ROOT, path.normalize(req.path).replace(/^(\.\.[/\\])+/, ''), 'index.html');
  if (!file.startsWith(ROOT)) return next();
  res.sendFile(file, err => err && next());
});

site.use(express.static(ROOT, { index: false, redirect: false }));

app.get('/', (req, res) => res.redirect(BASE + '/'));
app.use(BASE, site);

app.use((req, res) => res.status(404).sendFile(path.join(ROOT, '404.html')));

app.listen(PORT, () => console.log(`Installatieflow op http://localhost:${PORT}${BASE}/`));
