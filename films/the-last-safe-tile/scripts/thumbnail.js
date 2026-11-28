// Render the YouTube thumbnails: node scripts/thumbnail.js  → output/thumbnail_shorts_1080x1920.jpg, output/thumbnail_1280x720.jpg
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { serve, ROOT } from './lib/server.js';

async function chromium() {
  try { return (await import('playwright')).chromium; } catch {}
  for (const base of [import.meta.url, ...(process.env.NODE_PATH || '').split(':').filter(Boolean).map((b) => b + '/')]) {
    try { return createRequire(base)('playwright').chromium; } catch {}
  }
  throw new Error('Playwright not found: run npm install');
}
const { server, port } = await serve(0);
const browser = await (await chromium()).launch();
for (const [fmt, file, w, h] of [['short', 'thumbnail_shorts_1080x1920.jpg', 1080, 1920], ['wide', 'thumbnail_1280x720.jpg', 1280, 720]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => { console.error(e.message); process.exit(1); });
  await page.goto(`http://127.0.0.1:${port}/thumbnail/index.html?fmt=${fmt}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const data = await page.evaluate(() => window.THUMB());
  const p = path.join(ROOT, 'output', file);
  fs.writeFileSync(p, Buffer.from(data.split(',')[1], 'base64'));
  console.log(p, (fs.statSync(p).size / 1024).toFixed(0) + ' KB');
  await page.close();
}
await browser.close(); server.close();
process.exit(0);
