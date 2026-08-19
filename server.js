const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ሁሉንም HTML, CSS, JS ፋይሎች በቀጥታ ከዋናው ፎልደር እንዲያነብ ማድረግ
app.use(express.static(__dirname));

// 2. Gemini AI Initialize ማድረግ
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ------------------- ROUTES -------------------

// Dashboard ገጽ Route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'), (err) => {
        if (err) {
            res.status(404).send("dashboard.html ፋይል አልተገኘም። ፋይሉ ከ server.js ጋር በአንድ ፎልደር ውስጥ መሆኑን ያረጋግጡ።");
        }
    });
});

// Profile API Endpoint
app.get('/api/profile', (req, res) => {
    // የተጠቃሚ መረጃን ለመመለስ
    res.json({
        success: true,
        user: {
            name: "Educaeet User",
            email: "user@educaeet.com",
            role: "Student"
        }
    });
});

// Logout API Endpoint
app.post('/api/logout', (req, res) => {
    res.json({ 
        success: true, 
        message: "በተሳካ ሁኔታ ወጥተዋል (Logged out)",
        redirectUrl: "/login.html" 
    });
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "መልእክት አልተላከም" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY በ Render Server ላይ አልተዋቀረም።" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        if (text) {
            return res.json({ reply: text });
        } else {
            return res.status(500).json({ error: "ምንም መልስ አልተገኘም።" });
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: "API Server Error: " + error.message });
    }
});

// ማንኛውም ሌላ ጥያቄ ሲመጣ ወደ index.html እንዲሄድ
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            res.status(404).send("ገፁ አልተገኘም።");
        }
    });
});

// 3. Server Start
app.listen(PORT, () => {
    console.log(`Educaeet Server running on port ${PORT}`);
});
// Logout ሲደረግ በቀጥታ ወደ register.html Redirect ለማድረግ
app.get('/logout', (req, res) => {
    res.redirect('/register.html');
});
