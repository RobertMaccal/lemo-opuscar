// Frame-perfect offline export.
// usage: node scripts/render-video.js [--seed N] [--workers 4] [--crf 17] [--out output/the_last_safe_tile_45s.mp4] [--range a:b]
//
// 1. bakes the run in Node (checksum), 2. renders every frame in headless Chromium workers
// (each worker bakes the same seed and must match the checksum), JPEG frames piped straight into
// ffmpeg (no PNG folders), 3. synthesizes the SFX mix from the same event timeline, 4. muxes
// H.264 (yuv420p, CRF) + AAC 48 kHz with faststart.

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { openRenderPage, closeServer } from './lib/browser.js';
import { bake } from '../src/simulation.js';
import { buildAudioEvents } from '../src/timeline.js';
import { synthesize, master, toWav16, SR } from '../src/audio.js';
import { FRAMES, FPS, DURATION, DEFAULT_SEED } from '../src/config.js';
import { ROOT } from './lib/server.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const seed = +opt('--seed', DEFAULT_SEED);
const workers = +opt('--workers', 4);
const crf = opt('--crf', '17');
const out = path.resolve(ROOT, opt('--out', 'output/the_last_safe_tile_45s.mp4'));
const [ra, rb] = (opt('--range', `0:${FRAMES}`)).split(':').map(Number);
const outDir = path.dirname(out);
const work = path.join(outDir, '.render');
fs.mkdirSync(work, { recursive: true });
const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

// ---------- 1. reference bake
const B = bake(seed, { record: false });
console.log(`seed ${seed}  checksum ${B.checksum}  survivors ${B.stats.survivors}  winner ${B.stats.winner ? B.stats.winner.family + '#' + B.stats.winner.id : '-'}`);

// ---------- 2. audio (fast; done first so a failure shows early)
function measure(file) {
  const res = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -af ebur128=peak=true -f null - 2>&1 | tail -14`]).toString();
  const I = +(/I:\s+(-?[\d.]+) LUFS/.exec(res) || [])[1];
  const TP = +(/Peak:\s+(-?[\d.]+) dBFS/.exec(res) || [])[1];
  return { I, TP };
}
const TARGET_LUFS = -17;
const events = buildAudioEvents(B);
const wavPath = path.join(outDir, 'audio_mix.wav');
let gainDb = 0, lastM = null;
for (let pass = 0; pass < 5; pass++) {
  const mix = synthesize(events, { duration: DURATION, seed });
  const { L, R } = master(mix.L, mix.R, { gainDb, ceilingDb: -2.6 });  // first guess; encodeAudioSafe may lower it
  fs.writeFileSync(wavPath, Buffer.from(toWav16(L, R)));
  lastM = measure(wavPath);
  console.log(`audio pass ${pass + 1}: gain ${gainDb.toFixed(1)} dB → ${lastM.I} LUFS, true peak ${lastM.TP} dBTP`);
  if (Math.abs(lastM.I - TARGET_LUFS) < 0.5 && lastM.TP <= -1.2) break;
  gainDb += Math.max(-8, Math.min(8, TARGET_LUFS - lastM.I)) - (lastM.TP > -1.2 ? 1 : 0);
}
console.log(`audio: ${events.length} sound events, ${DURATION * SR} samples @ ${SR} Hz  [${secs()}]`);

// encode AAC, measure the true peak AFTER the codec, and lower the limiter ceiling until it is safe
function encodeAudioSafe(videoSrc, dest, durStr, ss = 0) {
  let ceiling = -2.6;
  for (let k = 0; k < 6; k++) {
    const tmp = path.join(work, 'mux_tmp.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoSrc, '-ss', String(ss), '-t', durStr, '-i', wavPath,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2',
      '-movflags', '+faststart', '-t', durStr, tmp], { stdio: 'inherit' });
    const m = execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${tmp}" -map 0:a -af ebur128=peak=true -f null - 2>&1 | tail -14`]).toString();
    const TP = +(/Peak:\s+(-?[\d.]+) dBFS/.exec(m) || [])[1], I = +(/I:\s+(-?[\d.]+) LUFS/.exec(m) || [])[1];
    console.log(`encoded AAC: ${I} LUFS, true peak ${TP} dBTP (limiter ceiling ${ceiling.toFixed(1)} dBFS)`);
    if (TP <= -1.2) { fs.renameSync(tmp, dest); return { I, TP, ceiling }; }
    ceiling -= TP + 1.3;
    const mix = synthesize(events, { duration: DURATION, seed });
    const { L, R } = master(mix.L, mix.R, { gainDb, ceilingDb: ceiling });
    fs.writeFileSync(wavPath, Buffer.from(toWav16(L, R)));
  }
  throw new Error('could not bring the encoded true peak under -1.2 dBTP');
}

// ---------- 3. video (or reuse the picture of an existing export with --remux)
const REMUX = args.includes('--remux');
if (REMUX) {
  const src = path.join(work, 'picture.mp4');
  fs.copyFileSync(out, src);
  const enc = encodeAudioSafe(src, out, String(DURATION));
  fs.rmSync(src, { force: true });
  const prev = JSON.parse(fs.readFileSync(path.join(outDir, 'render-info.json'), 'utf8'));
  prev.audio = { events: events.length, gainDb: +gainDb.toFixed(2), wavLUFS: lastM.I, encodedLUFS: enc.I, encodedTruePeak: enc.TP, ceilingDb: enc.ceiling, remuxed: new Date().toISOString() };
  prev.stats = B.stats;
  fs.writeFileSync(path.join(outDir, 'render-info.json'), JSON.stringify(prev, null, 2));
  console.log(`remuxed audio → ${out}  [${secs()}]`);
  process.exit(0);
}
const total = rb - ra;
const per = Math.ceil(total / workers);
let rendered = 0;
const segs = [];
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const a = ra + w * per, b = Math.min(rb, a + per);
  if (a >= b) return;
  const seg = path.join(work, `seg_${w}.mp4`);
  segs[w] = seg;
  const { browser, page, info } = await openRenderPage(seed);
  if (info.checksum !== B.checksum) {
    console.error(`worker ${w}: browser simulation checksum ${info.checksum} != node ${B.checksum}. Determinism broken; aborting.`);
    process.exit(1);
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-tune', 'animation', '-pix_fmt', 'yuv420p',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((r) => ff.on('close', r));
  const el = page.locator('#stage');
  for (let f = a; f < b; f++) {
    await page.evaluate((f) => window.renderFrame(f), f);
    const buf = await el.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    rendered++;
    if (rendered % 150 === 0) console.log(`frames ${rendered}/${total}  [${secs()}]`);
  }
  ff.stdin.end();
  const code = await closed;
  await browser.close();
  if (code !== 0) { console.error(`ffmpeg failed for worker ${w}`); process.exit(1); }
}));
closeServer();
const list = path.join(work, 'segs.txt');
fs.writeFileSync(list, segs.filter(Boolean).map((s) => `file '${path.basename(s)}'`).join('\n'));
const videoOnly = path.join(work, 'video_only.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'segs.txt', '-c', 'copy', 'video_only.mp4'], { cwd: work, stdio: 'inherit' });
console.log(`video: ${total} frames  [${secs()}]`);

// ---------- 4. mux
const dur = (total / FPS).toFixed(6);
const enc = encodeAudioSafe(videoOnly, out, dur, ra / FPS);
for (const s of segs.filter(Boolean)) fs.rmSync(s, { force: true });
fs.rmSync(videoOnly, { force: true }); fs.rmSync(list, { force: true });

const info = {
  file: path.relative(ROOT, out), seed, checksum: B.checksum, frames: total, fps: FPS,
  stats: B.stats, audio: { events: events.length, gainDb: +gainDb.toFixed(2), wavLUFS: lastM.I, encodedLUFS: enc.I, encodedTruePeak: enc.TP, ceilingDb: enc.ceiling },
  renderSeconds: (Date.now() - t0) / 1000, rendered: new Date().toISOString(),
};
fs.writeFileSync(path.join(outDir, 'render-info.json'), JSON.stringify(info, null, 2));
console.log(`done → ${out}  [${secs()}]`);
