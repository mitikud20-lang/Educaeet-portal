const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('./')); // HTML ፋይሎችን ለማስተናገድ

// API Key ከ Render Environment Variable ይወሰዳል
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "እባክዎ ጥያቄዎን ያስገቡ።" });
    }

    // በ 2026 የሚሰራው ትክክለኛው የሞዴል ስም gemini-1.5-flash ነው
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are Educaeet AI, a helpful medical academic assistant for students at Mizan-Aman Health Science College."
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "የ AI ረዳቱ ላይ ስህተት ተፈጥሯል!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
