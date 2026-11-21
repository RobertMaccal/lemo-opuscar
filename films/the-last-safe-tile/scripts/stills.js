// QC stills: node scripts/stills.js [--seed N] [--out output/qc] t1 t2 ...   (seconds)
import fs from 'fs';
import path from 'path';
import { openRenderPage, closeServer } from './lib/browser.js';
import { DEFAULT_SEED, FPS, FRAMES } from '../src/config.js';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const seed = +opt('--seed', DEFAULT_SEED), out = opt('--out', 'output/qc'), q = +opt('--q', 90);
fs.mkdirSync(out, { recursive: true });
const { browser, page, info } = await openRenderPage(seed);
console.log('seed', info.seed, 'checksum', info.checksum, 'survivors', info.stats.survivors);
for (const a of args) {
  const f = Math.min(FRAMES - 1, Math.round(+a * FPS));
  await page.evaluate((f) => window.renderFrame(f), f);
  const file = path.join(out, `t_${(+a).toFixed(2).padStart(5, '0')}.jpg`);
  await page.locator('#stage').screenshot({ path: file, type: 'jpeg', quality: q });
  console.log(file);
}
await browser.close(); closeServer();
