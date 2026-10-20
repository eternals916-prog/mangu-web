const express = require("express");
const path = require("path");
const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ ok: true, app: "MANGU Web" }));

app.post("/api/translate", async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Орчуулах текст олдсонгүй." });

  // Set TRANSLATE_URL in Render to a LibreTranslate-compatible /translate endpoint.
  const endpoint = process.env.TRANSLATE_URL || "https://libretranslate.com/translate";
  const body = { q: text.slice(0, 4500), source: "auto", target: "mn", format: "text" };
  if (process.env.LIBRETRANSLATE_API_KEY) body.api_key = process.env.LIBRETRANSLATE_API_KEY;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        error: data.error || "Орчуулгын үйлчилгээ татгалзлаа. Монгол хэлний загвар/API key шаардлагатай байж болно."
      });
    }
    if (!data.translatedText) return res.status(502).json({ error: "Орчуулгын үйлчилгээ хоосон хариу өглөө." });
    res.json({ translatedText: data.translatedText });
  } catch (e) {
    res.status(502).json({ error: "Орчуулгын серверт холбогдож чадсангүй. Render-ийн TRANSLATE_URL тохиргоог шалга." });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => console.log(`MANGU Web listening on ${port}`));
