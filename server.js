const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const URL = require('url').URL;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("URL хаяг бичнэ үү.");

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const parsedTarget = new URL(targetUrl);

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9,mn;q=0.8'
            },
            responseType: 'text'
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // 1. Сайтын линкүүдийг MANGU-аар дамжуулах
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                try {
                    const absoluteUrl = new URL(href, parsedTarget.origin).href;
                    $(el).attr('href', `/proxy?url=${encodeURIComponent(absoluteUrl)}`);
                } catch (e) {}
            }
        });

        // 2. Зургуудын замыг гүйцээх
        $('img[src]').each((_, el) => {
            const src = $(el).attr('src');
            if (src) {
                try {
                    $(el).attr('src', new URL(src, parsedTarget.origin).href);
                } catch (e) {}
            }
        });

        // 3. MANGU SCAN товчлуурыг дэлгэцэнд харуулах
        const manguScanHtml = `
            <style>
                #mangu-scan-container {
                    position: fixed;
                    bottom: 25px;
                    right: 20px;
                    z-index: 9999999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .mangu-btn {
                    background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    color: #ffffff;
                    padding: 12px 20px;
                    border-radius: 30px;
                    font-weight: bold;
                    font-size: 14px;
                    border: 2px solid #a855f7;
                    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.6);
                    cursor: pointer;
                    user-select: none;
                    transition: transform 0.2s;
                }
                .mangu-btn:active {
                    transform: scale(0.95);
                }
                .mangu-home {
                    background: #090d16;
                    color: #a855f7;
                    border: 2px solid #1e293b;
                    padding: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            </style>
            <div id="mangu-scan-container">
                <a href="/" class="mangu-home" title="MANGU Нүүр рүү буцах">🏠</a>
                <div class="mangu-btn" onclick="alert('🔍 MANGU SCAN идэвхтэй байна!')">
                    🔍 MANGU SCAN
                </div>
            </div>
        `;

        $('body').append(manguScanHtml);

        res.send($.html());
    } catch (error) {
        res.status(500).send(`
            <div style="background:#090d16; color:#fff; padding:30px; text-align:center; font-family:sans-serif; min-height:100vh;">
                <h2 style="color:#ef4444;">MANGU Proxy Алдаа</h2>
                <p>Сайт руу холбогдож чадсангүй: ${error.message}</p>
                <a href="/" style="color:#a855f7; text-decoration:none;">➔ Нүүр хуудас руу буцах</a>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`MANGU Server running on port ${PORT}`);
});
