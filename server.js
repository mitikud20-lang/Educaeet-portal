const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();

// 1. CORS Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

app.use(express.json());
app.use(express.static('./'));

// 2. Multer Configuration (ለስክሪንሾት ፋይል መቀበያ)
const upload = multer({ storage: multer.memoryStorage() });

// ------------------------------------------------------------------
// Telegram Bot መረጃዎች (የአንተን Token እና Chat ID እዚህ ጋር ተካ)
// ------------------------------------------------------------------
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_TELEGRAM_CHAT_ID_HERE';

// ------------------------------------------------------------------
// ROUTE 1: የተማሪዎች ምዝገባ እና የ CBE ክፍያ ደረሰኝ ወደ Telegram መላኪያ
// ------------------------------------------------------------------
app.post('/api/register', upload.single('receipt'), async (req, res) => {
  try {
    const { name, studentId, email, department } = req.body;
    const receiptFile = req.file;

    if (!name || !studentId || !email || !department || !receiptFile) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም መረጃዎች ያስገቡ!' });
    }

    // Telegram መልእክት ማዘጋጀት
    const captionText = `📌 *አዲስ የተማሪ ምዝገባ እና የ CBE ክፍያ*\n\n` +
      `👤 *ስም:* ${name}\n` +
      `🆔 *መታወቂያ:* ${studentId}\n` +
      `📧 *ኢሜይል:* ${email}\n` +
      `🎓 *ዲፓርትመንት:* ${department}\n` +
      `💵 *ክፍያ:* 30 ETB (CBE)`;

    // Telegram API Form Data ማዘጋጀት
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('caption', captionText);
    formData.append('parse_mode', 'Markdown');
    formData.append('photo', receiptFile.buffer, {
      filename: receiptFile.originalname,
      contentType: receiptFile.mimetype,
    });

    // ፎቶውን እና መረጃውን ወደ Telegram Bot መላክ
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      formData,
      { headers: formData.getHeaders() }
    );

    return res.status(200).json({
      success: true,
      message: 'ምዝገባውና የክፍያ ደረሰኙ በተሳካ ሁኔታ ተልኳል!'
    });

  } catch (error) {
    console.error('Telegram Error:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'ክፍያውን ወደ ቴሌግራም መላክ አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።'
    });
  }
});

// ------------------------------------------------------------------
// ROUTE 2: Educaeet AI Chatbot Service (Gemini API)
// ------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY በ Render ላይ አልተዘጋጀም!" });
    }

    if (!message) {
      return res.status(400).json({ error: "እባክዎ ጥያቄዎን ያስገቡ።" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: {
            parts: [{ text: "You are Educaeet AI, a helpful medical academic assistant for students at Mizan-Aman Health Science College." }]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "የ Gemini API ስህተት");
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "ምንም መልስ አልተገኘም።";
    res.json({ reply: replyText });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "የ AI ረዳቱ ላይ ስህተት ተፈጥሯል!" });
  }
});

// 3. Server Listener
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
