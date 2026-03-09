const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HTML_DIR = path.join(__dirname, 'public', 'html');

// Serve static assets (CSS, JS, images, favicons)
app.use(express.static(path.join(__dirname, 'public')));

// Route map: clean URL → HTML file
const routes = {
  '/':                 'index.html',
  '/services':         'services.html',
  '/about':            'about.html',
  '/contact':          'contact.html',
  '/cleaning-services':'cleaning-services.html',
  '/evercare-care':    'evercare-care.html',
  '/privacy':          'privacy.html',
  '/terms':            'terms.html',
};

// Register each route
Object.entries(routes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(HTML_DIR, file));
  });
});

// Redirects for legacy/inconsistent route aliases
app.get('/care',     (req, res) => res.redirect(301, '/evercare-care'));
app.get('/cleaning', (req, res) => res.redirect(301, '/cleaning-services'));

// 404 handler — must be last
app.use((req, res) => {
  res.status(404).sendFile(path.join(HTML_DIR, '404.html'));
});

app.listen(PORT, () => {
  console.log(`EverCare server running at http://localhost:${PORT}`);
});
