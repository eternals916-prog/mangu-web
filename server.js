const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// AI Шинжилгээ (Gemini API-г шууд fetch-ээр дуудна)
app.post('/api/ai-scan', async (req, res) => {
    const { textContent } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.json({ error: "GEMINI_API_KEY тохируулагдаагүй байна." });
    }
    if (!textContent) {
        return res.status(400).json({ error: "Бичвэр олдсонгүй." });
    }

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const aiResponse = await axios.post(geminiUrl, {
            contents: [{
                parts: [{ text: `Дараах вэб хуудасны агуулгыг монгол хэл рүү ойлгомжтойгоор товч орчуулж тайлбарлаж өгнө үү:\n\n${textContent.slice(0, 3000)}` }]
            }]
        });

        const aiText = aiResponse.data.candidates[0].content.parts[0].text;
        res.json({ result: aiText });
    } catch (error) {
        res.status(500).json({ error: "AI алдаа гарлаа: " + error.message });
    }
});

// Proxy Сервер (Сайт руу саадгүй нэвтрэх)
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("URL хаяг бичнэ үү.");

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        let body = response.data;

        // MANGU AI SCAN болон Нүүр товч
        const manguAiWidget = `
            <style>
                #mangu-ai-bar {
                    position: fixed;
                    bottom: 25px;
                    right: 20px;
                    z-index: 99999999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .mangu-ai-btn {
                    background: linear-gradient(135deg, #a855f7, #6366f1);
                    color: #ffffff;
                    padding: 12px 20px;
                    border-radius: 30px;
                    font-weight: bold;
                    font-size: 14px;
                    border: 2px solid #c084fc;
                    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.6);
                    cursor: pointer;
                }
                .mangu-home {
                    background: #090d16;
                    color: #a855f7;
                    border: 2px solid #1e293b;
                    padding: 12px;
                    border-radius: 50%;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                }
                #mangu-modal {
                    display: none;
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85);
                    z-index: 999999999;
                    padding: 20px;
                    box-sizing: border-box;
                    color: #fff;
                    font-family: sans-serif;
                }
                .modal-content {
                    background: #090d16;
                    border: 1px solid #334155;
                    border-radius: 16px;
                    padding: 20px;
                    max-width: 500px;
                    margin: 40px auto;
                    max-height: 80vh;
                    overflow-y: auto;
                }
            </style>
            <div id="mangu-ai-bar">
                <a href="/" class="mangu-home">🏠</a>
                <div class="mangu-ai-btn" onclick="runManguAI()">✨ MANGU AI SCAN</div>
            </div>

            <div id="mangu-modal">
                <div class="modal-content">
                    <h3 style="color:#c084fc; margin-top:0;">🤖 MANGU AI Орчуулга / Шинжилгээ</h3>
                    <div id="ai-result">Уншиж байна...</div>
                    <button onclick="document.getElementById('mangu-modal').style.display='none'" style="margin-top:20px; background:#ef4444; color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">Хаах</button>
                </div>
            </div>

            <script>
                async function runManguAI() {
                    const modal = document.getElementById('mangu-modal');
                    const resultDiv = document.getElementById('ai-result');
                    modal.style.display = 'block';
                    resultDiv.innerHTML = "⏳ AI хуудасны агуулгыг уншиж байна...";

                    const pageText = document.body.innerText;

                    try {
                        const res = await fetch('/api/ai-scan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ textContent: pageText })
                        });
                        const data = await res.json();
                        resultDiv.innerHTML = data.result || data.error;
                    } catch (err) {
                        resultDiv.innerHTML = "Алдаа гарлаа: " + err.message;
                    }
                }
            </script>
        `;

        if (typeof body === 'string') {
            body = body + manguAiWidget;
        }

        res.send(body);
    } catch (error) {
        res.status(500).send(`
            <div style="background:#090d16; color:#fff; padding:30px; text-align:center; font-family:sans-serif; min-height:100vh;">
                <h2 style="color:#ef4444;">MANGU Холболтын Алдаа</h2>
                <p>Сайт руу холбогдож чадсангүй: ${error.message}</p>
                <a href="/" style="color:#a855f7; text-decoration:none;">➔ Нүүр хуудас руу буцах</a>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`MANGU Browser active on port ${PORT}`);
});
