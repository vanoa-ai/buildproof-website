require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Only allow requests from the configured origin in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGIN || false)
    : true,
  methods: ['POST'],
};

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Oude prototypes en de oude agenda-url gaan naar de echte pagina's
app.use((req, res, next) => {
  if (/^\/(buildproof-(nieuw|v3|v4|v5)|installatieflow)(\/|$)/.test(req.path)) return res.redirect(301, '/');
  if (/^\/calendly(\/|$)/.test(req.path)) return res.redirect(301, '/demo/');
  next();
});

// Bestanden in de repo-root die niet publiek horen te zijn
const PRIVATE_PATHS = /^\/(server\.js|package(-lock)?\.json|ecosystem\.config\.js|nginx-api\.conf|site\.css|node_modules|uploads)(\/|$)/;
app.use((req, res, next) => {
  if (PRIVATE_PATHS.test(req.path)) return res.status(404).sendFile(path.join(__dirname, '404.html'));
  next();
});

app.use(express.static(path.join(__dirname)));

// Max 5 form submissions per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Te veel aanvragen. Probeer het over 15 minuten opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function isValidEmail(str) {
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(str);
}

function clean(str, maxLen) {
  return String(str || '').trim().slice(0, maxLen).replace(/[<>"'`]/g, '');
}

app.options('/api/subscribe', cors(corsOptions));
app.post('/api/subscribe', cors(corsOptions), limiter, async (req, res) => {
  const voornaam = clean(req.body.voornaam, 100);
  const email    = clean(req.body.email, 254);

  if (voornaam.length < 2) {
    return res.status(400).json({ error: 'Vul een geldige voornaam in (minimaal 2 tekens).' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Vul een geldig e-mailadres in.' });
  }
  if (!process.env.SYSTEME_API_KEY) {
    console.error('SYSTEME_API_KEY not set');
    return res.status(500).json({ error: 'Serverconfiguratiefout.' });
  }

  try {
    const resp = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SYSTEME_API_KEY,
      },
      body: JSON.stringify({
        email: email,
        firstName: voornaam,
        tags: ['stappenplan-download'],
      }),
    });

    // 409 = contact already exists — still a success from user's perspective
    if (!resp.ok && resp.status !== 409) {
      const body = await resp.json().catch(() => ({}));
      console.error('systeme.io error', resp.status, body);
      return res.status(502).json({ error: 'Er ging iets mis. Probeer het opnieuw.' });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('fetch error:', err.message);
    return res.status(502).json({ error: 'Er ging iets mis. Probeer het opnieuw.' });
  }
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '404.html')));

app.listen(PORT, () => {
  console.log(`BuildProof draait op http://localhost:${PORT}`);
});
