// node tools/export_srt.mjs → <name>.srt from the cues the page actually draws (window.CUES)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = process.env.LIB || path.resolve(HERE, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: 'only=tunnel' });
const cues = await page.evaluate(() => window.CUES.map(c => ({ t: c.t, d: c.d, sub: c.sub })));
await browser.close();
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
let out = '', n = 1;
cues.forEach((c, i) => { const a = Math.max(0, c.t - .2), next = cues[i + 1], b = Math.min(c.t + c.d + .5, next ? next.t - .25 : 1e9); out += `${n++}\n${ts(a)} --> ${ts(Math.max(a + 1.0, b))}\n${c.sub}\n\n`; });
fs.writeFileSync(path.join(HERE, 'bug-boy.srt'), out);
console.log('bug-boy.srt', cues.length, 'cues'); closeServer(); process.exit(0);
