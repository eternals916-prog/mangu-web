const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Прокси сервер
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("URL хаяг олдсонгүй.");

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

        // LIGTH SCAN болон 🏠 Нүүр товчлуур
        const ligthBar = `
            <style>
                #ligth-bar {
                    position: fixed;
                    bottom: 25px;
                    right: 20px;
                    z-index: 99999999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .ligth-btn {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: #ffffff;
                    padding: 12px 20px;
                    border-radius: 30px;
                    font-weight: bold;
                    font-size: 14px;
                    border: 2px solid #60a5fa;
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6);
                    cursor: pointer;
                }
                .ligth-home {
                    background: #090d16;
                    color: #3b82f6;
                    border: 2px solid #1e293b;
                    padding: 12px;
                    border-radius: 50%;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                }
            </style>
            <div id="ligth-bar">
                <a href="/" class="ligth-home" title="Нүүр хуудас">🏠</a>
                <div class="ligth-btn" onclick="alert('🔍 LIGTH SCAN идэвхтэй байна!')">🔍 LIGTH SCAN</div>
            </div>
        `;

        if (typeof body === 'string') {
            body = body + ligthBar;
        }

        res.send(body);
    } catch (error) {
        res.status(500).send(`
            <div style="background:#090d16; color:#fff; padding:30px; text-align:center; font-family:sans-serif; min-height:100vh;">
                <h2 style="color:#ef4444;">LIGTH Холболтын Алдаа</h2>
                <p>Сайт руу холбогдож чадсангүй: ${error.message}</p>
                <a href="/" style="color:#3b82f6; text-decoration:none;">➔ Нүүр хуудас руу буцах</a>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`LIGTH Server is running on port ${PORT}`);
});
