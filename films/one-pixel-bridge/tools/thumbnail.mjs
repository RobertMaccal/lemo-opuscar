// node tools/thumbnail.mjs → thumbnail_1080x1920.png (+ .jpg under 2 MB for YouTube)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url'; import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.otf': 'font/otf' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
pg.on('pageerror', e => { console.error(e.message); process.exit(1); });
await pg.goto(`http://127.0.0.1:${srv.address().port}/thumbnail.html`);
await pg.waitForFunction(() => window.READY === true);
const png = path.join(ROOT, 'thumbnail_1080x1920.png'), jpg = path.join(ROOT, 'thumbnail_1080x1920.jpg');
await pg.screenshot({ path: png }); await b.close(); srv.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log(png, (fs.statSync(png).size / 1e6).toFixed(2) + ' MB;', jpg, (fs.statSync(jpg).size / 1e6).toFixed(2) + ' MB');
