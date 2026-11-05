// Restart-proof rendering: fills every frame range not yet covered by out/pieces/<start>_<end>.mp4, in small chunks that are each
// finished (moov written) and renamed into place on completion. Run it again after any interruption; it only renders what is missing.
// usage: node tools/chunks.mjs [--workers 3] [--chunk 60]
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = process.env.LIB || path.resolve(HERE, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const WK = opt('--workers', 3), CH = opt('--chunk', 60), FPS = 30;
const PD = path.join(HERE, 'out', 'pieces'); fs.mkdirSync(PD, { recursive: true });
const { DUR } = await import(path.join(HERE, 'timeline.js')); const TOTAL = Math.round(DUR * FPS);
const have = fs.readdirSync(PD).filter(n => /^\d+_\d+\.mp4$/.test(n)).map(n => n.slice(0, -4).split('_').map(Number)).sort((a, b) => a[0] - b[0]);
const gaps = []; let c = 0; for (const [a, b] of have) { if (a > c) gaps.push([c, a]); c = Math.max(c, b); } if (c < TOTAL) gaps.push([c, TOTAL]);
const jobs = []; for (const [a, b] of gaps) for (let s = a; s < b; s += CH) jobs.push([s, Math.min(b, s + CH)]);
console.log('missing', gaps.map(g => g.join('-')).join(' '), '→', jobs.length, 'chunks');
let next = 0; const t0 = Date.now();
await Promise.all([...Array(Math.min(WK, jobs.length))].map(async (_, w) => {
  const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920 });
  while (next < jobs.length) {
    const [a, b] = jobs[next++], dst = path.join(PD, `${String(a).padStart(5, '0')}_${String(b).padStart(5, '0')}.mp4`), tmp = dst + '.part.mp4';
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', tmp]);
    for (let f = a; f < b; f++) { await page.evaluate(t => window.render(t), f / FPS); const buf = await page.screenshot({ type: 'jpeg', quality: 95 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); fs.renameSync(tmp, dst);
    console.log(`w${w} chunk ${a}-${b} done  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
}));
console.log('ALL DONE'); closeServer(); process.exit(0);
