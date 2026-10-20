const express = require("express");
const path = require("path");
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_q, res) => res.json({ ok: true, app: "MANGU Web", ai: !!process.env.ANTHROPIC_API_KEY }));

const LANG = { ja: "Japanese", ko: "Korean", zh: "Chinese", en: "English" };
const cache = new Map();

async function post(url, body, headers = {}) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.error && d.error.message) || d.error || "HTTP " + r.status);
  return d;
}

// Энгийн машин орчуулга (LibreTranslate эсвэл үнэгүй MyMemory) + санах ой
async function mt(text, source, target) {
  const key = source + target + text;
  if (cache.has(key)) return cache.get(key);
  let out;
  if (process.env.TRANSLATE_URL) {
    const body = { q: text, source, target, format: "text" };
    if (process.env.LIBRETRANSLATE_API_KEY) body.api_key = process.env.LIBRETRANSLATE_API_KEY;
    out = (await post(process.env.TRANSLATE_URL, body)).translatedText;
  } else {
    const c = (l) => (l === "zh" ? "zh-CN" : l);
    const r = await fetch(
      "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=" + c(source) + "|" + c(target),
      { signal: AbortSignal.timeout(30000) }
    );
    const d = await r.json().catch(() => ({}));
    if (d.responseStatus !== 200) throw new Error("MyMemory: " + (d.responseDetails || "алдаа"));
    out = d.responseData.translatedText;
  }
  if (!out) throw new Error("Хоосон хариу");
  cache.set(key, out);
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return out;
}

// Claude: нэг хуудасны бүх хөөргийг контексттэй нь хамт орчуулна (ANTHROPIC_API_KEY тохируулсан үед)
async function ai(lines, source) {
  const d = await post(
    "https://api.anthropic.com/v1/messages",
    {
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 3000,
      system:
        "You translate manga dialogue. The input is a JSON array of speech-bubble texts from one page in reading order (OCR may contain errors; fix obvious ones using context). Translate each into natural, colloquial Mongolian in Cyrillic, keeping tone, brevity and character voice. Return ONLY a JSON array of strings with exactly the same length.",
      messages: [{ role: "user", content: "Source language: " + LANG[source] + "\n" + JSON.stringify(lines) }],
    },
    { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }
  );
  const txt = d.content.map((c) => c.text || "").join("");
  const arr = JSON.parse(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1));
  if (!Array.isArray(arr) || arr.length !== lines.length) throw new Error("AI хариу буруу");
  return arr.map(String);
}

app.post("/api/translate-page", async (req, res) => {
  const { lines, source = "ja", pivot = true } = req.body || {};
  if (!Array.isArray(lines) || !lines.length || lines.length > 60) return res.status(400).json({ error: "Орчуулах текст олдсонгүй." });
  const src = lines.map((t) => String(t).slice(0, 400));
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        return res.json({ translations: await ai(src, source), engine: "ai" });
      } catch (e) {
        console.error("AI:", e.message);
      }
    }
    const via = pivot && source !== "en";
    const out = [];
    for (let i = 0; i < src.length; i += 3) {
      out.push(
        ...(await Promise.all(
          src.slice(i, i + 3).map(async (t) => {
            try {
              const mid = via ? await mt(t, source, "en") : t;
              return await mt(mid, via || source === "en" ? "en" : source, "mn");
            } catch (e) {
              console.error("MT:", e.message);
              return "";
            }
          })
        ))
      );
    }
    if (out.every((t) => !t)) return res.status(502).json({ error: "Орчуулгын сервертэй холбогдож чадсангүй (өдрийн хязгаар дүүрсэн байж болно)." });
    res.json({ translations: out, engine: "mt" });
  } catch (e) {
    res.status(502).json({ error: "Орчуулга амжилтгүй." });
  }
});

// Зургийн URL-ыг серверээр дамжуулж татах (CORS-оос зайлсхийх)
app.get("/api/image", async (req, res) => {
  try {
    const u = new URL(String(req.query.url || ""));
    if (!/^https?:$/.test(u.protocol)) throw new Error("protocol");
    if (/^(localhost|0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) throw new Error("host");
    const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0", Referer: u.origin + "/" }, signal: AbortSignal.timeout(20000) });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("image/")) throw new Error("not image");
    res.set("Content-Type", type);
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.status(400).json({ error: "Зургийг татаж чадсангүй. Шууд зургийн холбоос оруулна уу." });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => console.log(`MANGU Web listening on ${port}`));
