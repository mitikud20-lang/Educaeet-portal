const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware for handling JSON & Form requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JavaScript, Images)
app.use(express.static(__dirname));

// 1. Home Route -> Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 2. Logout Route
app.get('/logout', (req, res) => {
  res.redirect('/');
});

// 3. Dynamic Route for HTML pages (handles /register, /login, /ai-assistant, etc.)
app.get('/:page', (req, res, next) => {
  const pageName = req.params.page;

  // Skip if request includes a file extension (like .png, .css)
  if (pageName.includes('.')) {
    return next();
  }

  const filePath = path.join(__dirname, `${pageName}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      // If requested page doesn't exist, redirect to home
      res.redirect('/');
    }
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Educaeet Portal Server is running on port ${PORT}`);
});
