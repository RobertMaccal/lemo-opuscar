#!/usr/bin/env node
// export.js — frame-perfect offline export of THE ONE-PIXEL BRIDGE.
//   node export.js [--seed 1234] [--workers 3] [--out one_pixel_bridge_45s.mp4]
//   node export.js --stills 0,3,12.5,41 [--seed 1234]      review stills (JPEG) into out/stills/
//   node export.js --audio-only                            just the soundtrack (out/sfx.wav)
// Pipeline: headless Chromium renders every frame N = t·60 with window.renderFrame(N) → JPEG → ffmpeg (H.264),
// the Web Audio soundtrack is rendered with OfflineAudioContext from the same event log → loudness-normalised AAC,
// then video + audio are muxed and verified with ffprobe.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn, spawnSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SEED = opt('--seed', null), WORKERS = +opt('--workers', 3), FPS = 60, FRAMES = 2700, W = 1080, H = 1920;
const OUT = path.resolve(ROOT, opt('--out', 'one_pixel_bridge_45s.mp4'));
const work = path.join(ROOT, 'out'); fs.mkdirSync(work, { recursive: true });

// ---- tiny static server (ES modules cannot load from file://) ----
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.otf': 'font/otf', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URLQ = `http://127.0.0.1:${server.address().port}/index.html?export=1${SEED ? '&seed=' + SEED : ''}`;

async function open() {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('[page error]', e.message); process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.goto(URLQ);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  return { browser, page };
}
const run = (cmd, a, o = {}) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'pipe'], ...o }).toString();

// ---- stills ----
if (args.includes('--stills')) {
  const ts = opt('--stills', '0').split(',').map(Number), dir = path.join(work, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await open();
  for (const t of ts) {
    await page.evaluate(n => window.renderFrame(n), Math.round(t * FPS));
    await page.screenshot({ path: path.join(dir, `t_${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 90 });
  }
  console.log('stats', JSON.stringify(await page.evaluate(() => window.STATS)));
  await browser.close(); server.close(); console.log('stills in', dir); process.exit(0);
}

const t0 = Date.now();
// ---- 1. soundtrack ----
const wavRaw = path.join(work, 'sfx_raw.wav'), wavNorm = path.join(work, 'sfx.wav');
{
  const { browser, page } = await open();
  const stats = await page.evaluate(() => window.STATS);
  console.log('simulation', JSON.stringify(stats));
  fs.writeFileSync(path.join(work, 'stats.json'), JSON.stringify(stats, null, 1));
  const { wav, peak } = await page.evaluate(() => window.renderAudio());
  fs.writeFileSync(wavRaw, Buffer.from(wav, 'base64'));
  console.log(`audio rendered (raw peak ${peak.toFixed(3)})`);
  await browser.close();
  // two-pass loudness normalisation to -14 LUFS, true peak -1.5 dBTP
  const err = spawnSyncErr(['-hide_banner', '-nostats', '-i', wavRaw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const J = JSON.parse(err.match(/\{[\s\S]*?\}/)[0]);
  const af = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${J.input_i}:measured_TP=${J.input_tp}:measured_LRA=${J.input_lra}:measured_thresh=${J.input_thresh}:offset=${J.target_offset}:linear=true`;
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wavRaw, '-af', af, '-ar', '48000', wavNorm]);
  console.log(`loudness: measured ${J.input_i} LUFS → -14 LUFS`);
}
function spawnSyncErr(a) { return String(spawnSync('ffmpeg', a, { encoding: 'utf8' }).stderr); }
if (args.includes('--audio-only')) { server.close(); process.exit(0); }

// ---- 2. frames → H.264 segments (parallel workers), joined losslessly ----
const segDir = fs.mkdtempSync(path.join(work, 'segs-'));
const per = Math.ceil(FRAMES / WORKERS);
await Promise.all([...Array(WORKERS)].map(async (_, w) => {
  const a = w * per, b = Math.min(FRAMES, a + per); if (a >= b) return;
  const { browser, page } = await open();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-x264-params', 'aq-mode=3', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p',
    '-r', String(FPS), `seg_${w}.mp4`], { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise(r => ff.on('close', r));
  for (let f = a; f < b; f++) {
    await page.evaluate(n => window.renderFrame(n), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 150 === 0) console.log(`worker ${w}: ${f - a}/${b - a} frames  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end(); const code = await closed; await browser.close();
  if (code !== 0) { console.error('ffmpeg failed in worker', w); process.exit(1); }
}));
fs.writeFileSync(path.join(segDir, 'list.txt'), [...Array(WORKERS)].map((_, w) => `file 'seg_${w}.mp4'`).filter((_, w) => w * per < FRAMES).join('\n'));
const video = path.join(work, 'video.mp4');
run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', video], { cwd: segDir });
fs.rmSync(segDir, { recursive: true, force: true });

// ---- 3. mux: H.264 + AAC, exactly 45.000 s ----
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', wavNorm, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
  '-af', 'alimiter=limit=0.7:attack=1:release=60:level=false', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', '45', '-movflags', '+faststart', OUT]);
server.close();

// ---- 4. verify ----
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_read_frames,duration:format=duration', '-of', 'json', OUT]));
const v = probe.streams.find(s => s.codec_name === 'h264'), au = probe.streams.find(s => s.codec_name === 'aac');
const ok = v && au && v.width === 1080 && v.height === 1920 && v.r_frame_rate === '60/1' && +v.nb_read_frames === FRAMES && Math.abs(+probe.format.duration - 45) < 0.03;
console.log(JSON.stringify({ video: v, audio: au, duration: probe.format.duration }, null, 1));
console.log(ok ? `OK ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB) in ${((Date.now() - t0) / 1000).toFixed(0)} s` : 'VERIFY FAILED');
process.exit(ok ? 0 : 1);
