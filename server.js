const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// AI Chat Endpoint (API Key-ን ከ Environment Variable ተጠቅሞ Googleን ይጠይቃል)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY አልተዘጋጀም!' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ምንም መልስ አልተገኘም።';
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'የ AI አገልግሎት ችግር አጋጥሞታል።' });
  }
});

// Home Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Logout Route
app.get('/logout', (req, res) => {
  res.redirect('/');
});

// Dynamic Route for HTML pages
app.get('/:page', (req, res, next) => {
  const pageName = req.params.page;
  if (pageName.includes('.')) return next();
  res.sendFile(path.join(__dirname, `${pageName}.html`), (err) => {
    if (err) res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
