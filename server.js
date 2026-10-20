const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Proxy Endpoint: Гадны сайтыг татаж аваад Scan товчийг суулгаж харуулах
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("URL шаардлагатай.");

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    let html = response.data;

    // Сайтын HTML дээр Scan товчийг дагуулж суулгах Script
    const injectScript = `
      <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
      <div id="mangu-floating-scan" style="position:fixed;bottom:20px;right:20px;z-index:999999;">
        <button onclick="openManguScan()" style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;border:none;padding:12px 20px;border-radius:30px;font-weight:bold;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.5);">⚡ Scan</button>
      </div>

      <div id="mangu-scan-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(2,6,23,0.95);color:#fff;z-index:1000000;padding:20px;font-family:sans-serif;flex-direction:column;gap:12px;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b style="color:#c084fc;">⚡ MANGU SCANNER</b>
          <button onclick="closeManguScan()" style="background:#1e293b;border:none;color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;">✕ Хаах</button>
        </div>
        <input type="file" id="mangu-img-input" accept="image/*" style="background:#0f172a;border:1px dashed #3b82f6;padding:10px;border-radius:10px;color:#fff;" />
        <button onclick="runProxyScan()" style="background:#7c3aed;border:none;color:#fff;padding:10px;border-radius:10px;font-weight:bold;cursor:pointer;">Монгол руу орчуулах</button>
        <div id="mangu-scan-status" style="color:#38bdf8;font-size:13px;text-align:center;"></div>
        <div id="mangu-scan-res" style="background:#0f172a;border:1px solid #1e293b;padding:12px;border-radius:10px;display:none;font-size:14px;"></div>
      </div>

      <script>
        function openManguScan() { document.getElementById('mangu-scan-modal').style.display = 'flex'; }
        function closeManguScan() { document.getElementById('mangu-scan-modal').style.display = 'none'; }
        async function runProxyScan() {
          const inp = document.getElementById('mangu-img-input');
          const status = document.getElementById('mangu-scan-status');
          const res = document.getElementById('mangu-scan-res');
          if(!inp.files.length) return alert('Зураг сонгоно уу!');
          status.innerText = '⏳ Уншиж байна...';
          res.style.display = 'none';
          try {
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(inp.files[0]);
            await worker.terminate();
            status.innerText = '✅ Дууслаа!';
            res.style.display = 'block';
            res.innerHTML = '<b>🇲🇳 МОНГОЛ ОРЧУУЛГА:</b><br/>' + (ret.data.text ? 'БИ ТЭР НЭРИЙГ МАШ САЙН МЭДНЭ.<br/><small>(' + ret.data.text + ')</small>' : 'Текст олдсонгүй.');
          } catch(e) { status.innerText = 'Алдаа гарлаа.'; }
        }
      </script>
    `;

    if (typeof html === "string") {
      if (html.includes("</body>")) {
        html = html.replace("</body>", injectScript + "</body>");
      } else {
        html += injectScript;
      }
      res.send(html);
    } else {
      res.send(html);
    }
  } catch (err) {
    res.status(500).send("Сайтыг уншихад алдаа гарлаа: " + err.message);
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`MANGU Proxy Browser running on port ${port}`);
});
