require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HTML_DIR = path.join(__dirname, 'public', 'html');

// Serve static assets (CSS, JS, images, favicons)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/send-email', require('./public/api/send-email'));

// Route map: clean URL → HTML file (subdirectory/index.html structure)
const routes = {
  '/':                 'index.html',
  '/services':         'services/index.html',
  '/about':            'about/index.html',
  '/contact':          'contact/index.html',
  '/cleaning-services':'cleaning-services/index.html',
  '/evercare-care':    'evercare-care/index.html',
  '/privacy':          'privacy/index.html',
  '/terms':            'terms/index.html',
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
  res.status(404).sendFile(path.join(HTML_DIR, '404', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EverCare server running at http://localhost:${PORT}`);
});
