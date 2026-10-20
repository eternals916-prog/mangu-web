const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.send("Хандах URL хаяг олдсонгүй.");

    // Хэрэв https:// байхгүй бол автоматаар нэмнэ
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        let body = response.data;

        // Дэлгэцийн баруун доод өнцөгт дагаж явах MANGU SCAN товчлуур
        const scanButtonHtml = `
            <div id="mangu-scan-toolbar" style="position:fixed; bottom:20px; right:20px; z-index:999999; background:#7c3aed; color:#fff; padding:12px 20px; border-radius:30px; font-weight:bold; box-shadow: 0 4px 15px rgba(0,0,0,0.5); cursor:pointer; font-family:sans-serif;" onclick="alert('MANGU Scan идэвхтэй байна!')">
                🔍 MANGU SCAN
            </div>
        `;

        if (typeof body === 'string') {
            body = body + scanButtonHtml;
        }

        res.send(body);
    } catch (error) {
        res.status(500).send("Сайт руу нэвтрэхэд алдаа гарлаа: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
