
const express = require("express");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const cheerio = require("cheerio");
const { createWorker } = require("tesseract.js");
const translate = require("@vitalets/google-translate-api");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 1. Вэб хуудасны манганы зургуудыг ялгаж авдаг Proxy
app.post("/api/extract-images", async (req, res) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) return res.status(400).json({ error: "URL шаардлагатай." });

    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(response.data);
    const images = [];

    $('img').each((i, el) => {
      let src = $(el).attr('src') \vert{}\vert{}$(el).attr('data-src');
      if (src) {
        if (src.startsWith('//')) src = 'https:' + src;
        else if (src.startsWith('/')) {
          const urlObj = new URL(targetUrl);
          src = urlObj.origin + src;
        }
        if (src.match(/\.(jpg|jpeg|png|webp)/i)) {
          images.push(src);
        }
      }
    });

    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: "Сайтын зургуудыг уншиж чадсангүй." });
  }
});

// 2. Зургийг SCAN хийж Монгол руу орчуулах API
app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Зураг сонгоогүй байна." });

    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    if (!text || text.trim() === "") {
      return res.json({ translatedText: "Текст олдсонгүй.", originalText: "" });
    }

    const translated = await translate(text, { to: "mn" });
    res.json({ originalText: text, translatedText: translated.text });
  } catch (error) {
    res.status(500).json({ error: "SCAN хийхэд алдаа гарлаа." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`MANGU Server running on port ${port}`);
});
