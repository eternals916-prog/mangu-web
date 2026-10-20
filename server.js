const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("URL хаяг олдсонгүй.");

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const parsedTarget = new URL(targetUrl);

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
            },
            responseType: 'text',
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Линкүүдийг прокси руу холбох
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                try {
                    const absoluteUrl = new URL(href, parsedTarget.origin).href;
                    $(el).attr('href', `/proxy?url=${encodeURIComponent(absoluteUrl)}`);
                } catch (e) {}
            }
        });

        // Зургийн замыг засах
        $('img[src]').each((_, el) => {
            const src = $(el).attr('src');
            if (src) {
                try {
                    $(el).attr('src', new URL(src, parsedTarget.origin).href);
                } catch (e) {}
            }
        });

        // MANGU SCAN болон 🏠 Нүүр товч
        const manguBar = `
            <div style="position:fixed; bottom:20px; right:20px; z-index:999999; display:flex; gap:10px; font-family:sans-serif;">
                <a href="/" style="background:#090d16; color:#a855f7; border:2px solid #1e293b; padding:12px; border-radius:50%; text-decoration:none; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 15px rgba(0,0,0,0.5);">🏠</a>
                <div onclick="alert('🔍 MANGU SCAN идэвхтэй байна!')" style="background:linear-gradient(135deg, #7c3aed, #4f46e5); color:#fff; padding:12px 20px; border-radius:30px; font-weight:bold; font-size:14px; border:2px solid #a855f7; cursor:pointer; box-shadow:0 6px 20px rgba(124,58,237,0.6);">🔍 MANGU SCAN</div>
            </div>
        `;

        $('body').append(manguBar);

        res.send($.html());
    } catch (error) {
        res.status(500).send(`
            <div style="background:#090d16; color:#fff; padding:40px; text-align:center; font-family:sans-serif;">
                <h2 style="color:#ef4444;">MANGU Холболтын алдаа</h2>
                <p>${error.message}</p>
                <a href="/" style="color:#a855f7; text-decoration:none;">➔ Нүүр хуудас руу буцах</a>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`MANGU running on port ${PORT}`);
});
