MANGU WEB — GitHub + Render дээр байрлуулах

Энэ нь Electron desktop app-аас тусдаа веб хувилбар. Atsu.moe шинэ табд нээгдэнэ; SCAN-д манганы зургийг файл болгон оруулах шаардлагатай. Энэ нь вэб браузерын хамгаалалтаас шалтгаалж өөр сайтын табыг дур мэдэн уншихгүй.

GitHub:
1. https://github.com/new руу ор.
2. Repository name: mangu-web гэж оруул.
3. Public сонгоод Create repository дар.
4. Add file > Upload files дарж энэ ZIP-ийг задлаад доторх package.json, server.js, public хавтсыг (доторх index.html-тэй нь) оруул. Хэрэв хавтас upload хийхэд асуудалтай бол public доторх index.html-ийг repo дээр public/index.html замаар үүсгэ.
5. Commit changes дар.

Render:
1. https://dashboard.render.com руу ор.
2. New + > Web Service сонго.
3. GitHub repository mangu-web-ээ холбоод Connect дар.
4. Runtime Node сонго.
5. Build Command: npm install
6. Start Command: npm start
7. Free plan боломжтой бол сонгоод Create Web Service дар.
8. Deploy дуусахад https://....onrender.com холбоос гарна.

Монгол орчуулгын тохиргоо:
- Render service > Environment хэсэгт TRANSLATE_URL variable нэмээд /translate төгсгөлтэй, Монгол (mn) хэл дэмждэг LibreTranslate endpoint-оо тавь.
- Хэрэв үйлчилгээ API key шаардвал LIBRETRANSLATE_API_KEY variable нэм.
- Public LibreTranslate endpoint тогтвортой/үнэгүй байх баталгаа байхгүй; Монгол хэлний загвар дэмжигдэх ёстой.
- Environment variable өөрчилсний дараа redeploy/restart хий.

Анхаар:
- Энэ сайт Electron desktop browser биш; браузер доторх web app.
- Atsu.moe сайтыг iframe-ээр суулгах боломжгүй байж болох тул тусдаа табаар нээдэг.
- OCR browser дотор Tesseract.js-аар ажиллана; анхны таталт удаан байж болно.
