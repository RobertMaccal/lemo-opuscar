// QC: node films/brides/qc.mjs <outdir> [shotIndexFrom] [shotIndexTo]  — 3 frames per shot + framing check
import path from 'node:path'; import fs from 'node:fs';
import { openDemo, closeServer } from '../../core/render/page.mjs';
const dir = path.dirname(new URL(import.meta.url).pathname), out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const a = +(process.argv[3] ?? 0), b = +(process.argv[4] ?? 999);
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920, q: process.argv[5] || '' });
const shots = await page.evaluate(() => window.SHOTS), DUR = await page.evaluate(() => window.DUR);
const rep = [];
for (let i = Math.max(0, a); i < Math.min(shots.length, b + 1); i++) {
  const t0 = shots[i].t0, t1 = i + 1 < shots.length ? shots[i + 1].t0 : DUR;
  const ts = [t0 + .4, (t0 + t1) / 2, t1 - .05];
  for (const [k, t] of ts.entries()) {
    await page.evaluate(t => window.render(t), t);
    const c = await page.evaluate(() => window.CHECK());
    await page.screenshot({ path: path.join(out, `s${String(i).padStart(2, '0')}_${k}.jpg`), type: 'jpeg', quality: 80 });
    if (c.issues.length) rep.push(`#${i} ${shots[i].name} @${t.toFixed(2)}: ${c.issues.join(' | ')}`);
  }
  console.log(i, shots[i].name, t0.toFixed(2));
}
console.log('ISSUES\n' + (rep.join('\n') || 'none'));
await browser.close(); closeServer();
