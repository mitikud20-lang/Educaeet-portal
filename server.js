 const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static ፋይሎችን (CSS, JS, Images) ማቅረብ
app.use(express.static(__dirname));

// API Key ማረጋገጫና Gemini Initialise ማድረግ
const getGeminiModel = () => {
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// 1. የገጾች ዋና ዋና Routes (ስሞቹ በካፒታልም ሆነ በትንሽ ፊደል ቢጻፉ እንዲሰሩ)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/ai-assistant', (req, res) => res.sendFile(path.join(__dirname, 'ai-assistant.html')));

// በ ሪፖዚቶሪህ ውስጥ ላሉት የፋይል ስሞች (ከነ space እና Capital ፊደሎቻቸው) የተዘጋጁ አሊያሶች
app.get(['/lectureppt', '/lectureppt.html', '/Lectureppt.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'Lectureppt.html'));
});

app.get(['/lecturevido', '/lecturevido.html', '/lecture vido.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'lecture vido.html'));
});

app.get(['/cocexam', '/cocexam.html', '/Coc exam.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'Coc exam.html'));
});

// Direct Logout Redirect
app.get('/logout', (req, res) => res.redirect('/register.html'));

// 2. AI Chat API
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "መልእክት አልተላከም" });

        const model = getGeminiModel();
        if (!model) {
            return res.status(500).json({ error: "GEMINI_API_KEY በትክክል አልተዋቀረም።" });
        }

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return res.json({ reply: text || "ምንም መልስ አልተገኘም።" });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: "API Error: " + error.message });
    }
});

// 3. Any file fallback (URL Space እና Case Handling)
app.get('*', (req, res) => {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = path.join(__dirname, decodedPath);
    
    res.sendFile(filePath, (err) => {
        if (err) {
            // ጥያቄው የ HTML ገፅ ካልሆነ (ለ CSS/JS/Image ከሆነ) error እንዲመልስ
            if (req.path.includes('.')) {
                return res.status(404).send("File not found");
            }
            // ለሌሎች የገፅ ጥያቄዎች ወደ dashboard እንዲወስድ
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
