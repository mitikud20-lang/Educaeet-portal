const express = require('express');
const app = express();

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

    // gemini-2.5-flash ወይም gemini-1.5-flash-latest መጠቀም
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
