// Verify the exported MP4: container/stream specs, exact frame count, loop seam, black frames,
// audio loudness/peaks/clipping, audio–video sync at known events, QC stills + contact sheet.
// usage: node scripts/verify-output.js [output/the_last_safe_tile_45s.mp4]

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT } from './lib/server.js';
import { bake } from '../src/simulation.js';
import { FRAMES, FPS, W, H, DURATION } from '../src/config.js';

const file = path.resolve(ROOT, process.argv[2] || 'output/the_last_safe_tile_45s.mp4');
const outDir = path.dirname(file);
const qcDir = path.join(outDir, 'qc');
fs.mkdirSync(qcDir, { recursive: true });
if (!fs.existsSync(file)) { console.error('missing', file); process.exit(1); }
const info = JSON.parse(fs.readFileSync(path.join(outDir, 'render-info.json'), 'utf8'));

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { maxBuffer: 1 << 28, ...opts });
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

// ---- streams
const probe = JSON.parse(sh('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file]).toString());
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
check('video codec H.264', v.codec_name === 'h264', `${v.codec_name} (${v.profile})`);
check('resolution 1080×1920 (9:16)', v.width === W && v.height === H, `${v.width}×${v.height}`);
check('frame rate 60 fps', v.r_frame_rate === '60/1' && v.avg_frame_rate === '60/1', `r=${v.r_frame_rate} avg=${v.avg_frame_rate}`);
check('exactly 2,700 frames', +v.nb_read_frames === FRAMES, `decoded ${v.nb_read_frames}`);
check('pixel format yuv420p', v.pix_fmt === 'yuv420p', v.pix_fmt);
check('video duration 45.000 s', Math.abs(+v.duration - DURATION) < 0.0005, `${(+v.duration).toFixed(3)} s`);
check('audio AAC 48 kHz stereo', a && a.codec_name === 'aac' && a.sample_rate === '48000' && a.channels === 2, a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch` : 'none');
check('audio duration ≈ 45 s', a && Math.abs(+a.duration - DURATION) < 0.03, a ? `${(+a.duration).toFixed(3)} s` : '-');
check('container duration', Math.abs(+probe.format.duration - DURATION) < 0.03, `${(+probe.format.duration).toFixed(3)} s`);
const head = fs.readFileSync(file).subarray(0, 64 * 1024);
const moov = head.indexOf('moov'), mdat = head.indexOf('mdat');
check('fast start (moov before mdat)', moov >= 0 && (mdat < 0 || moov < mdat), `moov@${moov} mdat@${mdat}`);

// ---- frames: decode helpers
function frameRGB(n) {
  return sh('ffmpeg', ['-v', 'error', '-i', file, '-vf', `select=eq(n\\,${n})`, '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
}
const f0 = frameRGB(0), fl = frameRGB(FRAMES - 1);
let sad = 0, maxd = 0, big = 0;
for (let i = 0; i < f0.length; i++) { const d = Math.abs(f0[i] - fl[i]); sad += d; if (d > maxd) maxd = d; if (d > 40) big++; }
const mad = sad / f0.length;
check('loop seam: last frame ≈ first frame', mad < 1.5 && big / f0.length < 0.002, `mean |Δ| ${mad.toFixed(3)}/255, ${(100 * big / f0.length).toFixed(3)}% px differ by >40`);

// black frames (fully black screens)
const bd = sh('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -vf blackdetect=d=0.016:pic_th=0.995:pix_th=0.03 -an -f null - 2>&1 | grep -c black_start || true`]).toString().trim();
check('no black-screen glitches', +bd === 0, `${bd} black intervals`);

// frozen / duplicated frames: count frames identical to their predecessor (excluding the deliberate 5-frame loop hold)
const mp = sh('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -vf "mpdecimate=hi=1:lo=1:frac=1:max=0,showinfo" -an -f null - 2>&1 | grep -c "pts_time" || true`]).toString().trim();
const kept = +mp, dups = FRAMES - kept;
check('no unintended duplicate frames', dups <= 8, `${dups} frames identical to the previous one (loop hold frames are expected)`);

// ---- audio
const eb = sh('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -map 0:a -af ebur128=peak=true -f null - 2>&1 | tail -14`]).toString();
const I = +(/I:\s+(-?[\d.]+) LUFS/.exec(eb) || [])[1], TP = +(/Peak:\s+(-?[\d.]+) dBFS/.exec(eb) || [])[1];
check('loudness for phones (−18…−13 LUFS)', I > -18 && I < -13, `${I} LUFS integrated`);
check('no clipping (true peak ≤ −1 dBTP)', TP <= -1.0, `${TP} dBTP`);
const pcm = sh('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:a', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-']);
const samples = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
let clip = 0; for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) >= 0.999) clip++;
check('no full-scale samples', clip === 0, `${clip} samples at full scale`);

// sync: find the crack transient near each scheduled collapse (expected within ±1 frame)
const B = bake(info.seed, { record: false });
const env = (t0, t1) => { let m = 0, at = t0; for (let i = Math.max(0, Math.round(t0 * 48000)); i < Math.min(samples.length, Math.round(t1 * 48000)); i++) { const x = Math.abs(samples[i]); if (x > m) { m = x; at = i / 48000; } } return { m, at }; };
const offs = [];
for (const c of B.schedule.collapses.filter((c) => c.k % 7 === 0 || c.k >= 94)) {
  // onset: first sample in [t-0.03, t+0.05] exceeding 4× the median level of the 50 ms before it
  const pre = env(c.t - 0.08, c.t - 0.03).m;
  const st = Math.round((c.t - 0.03) * 48000), en = Math.round((c.t + 0.05) * 48000);
  let on = null;
  for (let i = st; i < en; i++) if (Math.abs(samples[i]) > Math.max(0.02, pre * 3)) { on = i / 48000; break; }
  if (on !== null) offs.push(on - c.t);
}
offs.sort((x, y) => x - y);
const med = offs.length ? offs[Math.floor(offs.length / 2)] : NaN;
check('audio–video sync at tile collapses', Math.abs(med) < 1 / FPS, `median onset offset ${(med * 1000).toFixed(1)} ms over ${offs.length} collapses`);

// ---- QC stills + sheet
const times = [0, 2, 5, 10, 15, 20, 25, 30, 35, 39, 41, 43, 44.5];
const stills = [];
for (const t of times) {
  const n = Math.min(FRAMES - 1, Math.round(t * FPS));
  const p = path.join(qcDir, `qc_${String(t).replace('.', '_').padStart(4, '0')}s.jpg`);
  sh('ffmpeg', ['-y', '-v', 'error', '-i', file, '-vf', `select=eq(n\\,${n})`, '-vsync', '0', '-frames:v', '1', '-q:v', '2', p]);
  stills.push(p);
}
const sel = times.map((t) => `eq(n\\,${Math.min(FRAMES - 1, Math.round(t * FPS))})`).join('+') + `+eq(n\\,${FRAMES - 1})`;
sh('ffmpeg', ['-y', '-v', 'error', '-i', file, '-vf', `select='${sel}',scale=270:480,tile=7x2:padding=6:color=0x202020`, '-vsync', '0', '-frames:v', '1', '-q:v', '3', path.join(qcDir, 'contact_sheet.jpg')]);

// ---- report
const S = info.stats;
const allOk = checks.every((c) => c.ok);
const report = {
  file: path.relative(ROOT, file), sizeMB: +(fs.statSync(file).size / 1048576).toFixed(2), seed: info.seed, checksum: info.checksum,
  resolution: `${v.width}x${v.height}`, fps: 60, frames: +v.nb_read_frames, videoDuration: +v.duration, audio: { I, TP },
  survivors: S.survivors, winner: S.winner, goldSurvives: S.goldAlive, checks, passed: allOk,
};
fs.writeFileSync(path.join(outDir, 'verification-report.json'), JSON.stringify(report, null, 2));
const md = [
  '# THE LAST SAFE TILE: verification report', '',
  `File: \`${report.file}\` (${report.sizeMB} MB)`, '',
  '| Property | Value |', '|---|---|',
  `| Resolution | ${v.width} × ${v.height} (9:16) |`, `| Frame rate | ${v.r_frame_rate} |`, `| Frames | ${v.nb_read_frames} |`,
  `| Video duration | ${(+v.duration).toFixed(3)} s |`, `| Video | ${v.codec_name} ${v.profile}, ${v.pix_fmt} |`,
  `| Audio | ${a.codec_name} ${a.sample_rate} Hz stereo, ${I} LUFS, true peak ${TP} dBTP |`,
  `| Seed | ${info.seed} (simulation checksum ${info.checksum}) |`,
  `| Survivors | ${S.survivors} |`, `| Winner | ${S.winner ? `${S.winner.family} ball #${S.winner.id} (${S.winner.color})` : 'none'} |`,
  `| Gold ball | ${S.goldAlive ? 'survives' : `falls at ${S.goldFallT.toFixed(2)} s`} |`,
  `| Balls alive at 10 / 20 / 30 / 39 / 43 s | ${S.alive10} / ${S.alive20} / ${S.alive30} / ${S.alive39} / ${S.alive43} |`,
  `| Near misses (escapes) | ${S.nearMisses} (${S.escapes}) |`, '',
  '## Checks', '', ...checks.map((c) => `- ${c.ok ? '✅' : '❌'} **${c.name}**: ${c.detail}`), '',
  `Overall: **${allOk ? 'PASSED' : 'FAILED'}**`, '',
  'QC stills: `output/qc/` (0, 2, 5, 10, 15, 20, 25, 30, 35, 39, 41, 43, 44.5 s) and `output/qc/contact_sheet.jpg`.',
];
fs.writeFileSync(path.join(outDir, 'verification-report.md'), md.join('\n') + '\n');
console.log(`\n${allOk ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} → output/verification-report.md`);
process.exit(allOk ? 0 : 1);
