const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/logout', (req, res) => {
    res.redirect('/register.html');
});

// Gemini AI Chat API
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "መልእክት አልተላከም" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "GEMINI_API_KEY አልተዋቀረም።" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return res.json({ reply: text || "ምንም መልስ አልተገኘም።" });
    } catch (error) {
        console.error("AI Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
});

// Catch-all route
app.get('*', (req, res) => {
    const requestedPath = path.join(__dirname, req.path);
    res.sendFile(requestedPath, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
