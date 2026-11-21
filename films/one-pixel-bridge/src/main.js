// main.js — wires simulation, camera, renderer and audio together; exposes the deterministic render API.
//   window.renderFrame(n)  draws frame n (0…2699) — frame n is always simulation time n/60 s
//   window.render(t)       same, by time in seconds (page contract used by the exporter)
//   window.renderAudio()   offline-renders the full 45 s soundtrack, returns base64 16-bit PCM WAV
import { simulate, stats, FPS, FRAMES, DUR } from './physics.js';
import { buildCamera, VW, VH } from './camera.js';
import { createRenderer } from './renderer.js';
import { buildCues, renderOffline, createLive } from './audio.js';

export const DEFAULT_SEED = 6783;
const q = new URLSearchParams(location.search);
const seed = Number.isFinite(+q.get('seed')) && q.get('seed') ? +q.get('seed') : DEFAULT_SEED;
const exportMode = q.has('export');
if (exportMode) document.body.classList.add('export');

const canvas = document.getElementById('c');
canvas.width = VW; canvas.height = VH;
const ctx = canvas.getContext('2d', { alpha: false });

const t0 = performance.now();
const sim = simulate(seed);
const cam = buildCamera(sim);
const draw = createRenderer(sim, cam);
const cueData = buildCues(sim, cam);
const st = stats(sim);
console.log(`seed ${seed}: simulated ${FRAMES} frames in ${(performance.now() - t0).toFixed(0)} ms`, st);

window.SEED = seed; window.STATS = st; window.DUR = DUR; window.FPS = FPS; window.FRAMES = FRAMES;
window.renderFrame = n => draw(ctx, n);
window.render = t => draw(ctx, Math.round(t * FPS));
window.EV = cueData.cues;
window.renderAudio = async () => {
  const buf = await renderOffline(cueData, OfflineAudioContext, 48000);
  const L = buf.getChannelData(0), Rc = buf.getChannelData(1), n = L.length;
  const out = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, 48000, true); out.setUint32(28, 48000 * 4, true);
  out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.max(-1, Math.min(1, L[i])), b = Math.max(-1, Math.min(1, Rc[i])); peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rc[i]));
    out.setInt16(44 + i * 4, a * 32767, true); out.setInt16(46 + i * 4, b * 32767, true);
  }
  const bytes = new Uint8Array(out.buffer); let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { wav: btoa(s), peak };
};

await document.fonts.load('800 50px Inter'); await document.fonts.load('700 50px Inter'); await document.fonts.load('600 30px Inter');
draw(ctx, 0);
window.READY = true;

// ---------------- interactive preview ----------------
if (!exportMode) {
  const $ = id => document.getElementById(id);
  const live = createLive(cueData);
  let playing = false, frame = 0, wall0 = 0, frame0 = 0;
  $('seed').value = seed;
  $('stats').textContent = `seed ${seed} · survivors @10s ${st.a10} · @19s ${st.a19} · @29s ${st.a29} · @37s ${st.a37} · final ${st.final}` + (st.goldFinish ? ` · gold finishes ${st.goldT.toFixed(2)} s` : ' · gold falls');
  const scrub = $('scrub'); scrub.max = FRAMES - 1;
  const show = () => { draw(ctx, frame); scrub.value = frame; $('time').textContent = (frame / FPS).toFixed(2).padStart(5, '0') + ' s'; };
  const play = () => { playing = true; wall0 = performance.now(); frame0 = frame; live.start(frame / FPS); $('play').textContent = '❚❚'; requestAnimationFrame(tick); };
  const pause = () => { playing = false; live.stop(); $('play').textContent = '▶'; };
  function tick(now) {
    if (!playing) return;
    frame = frame0 + Math.floor((now - wall0) / 1000 * FPS);
    if (frame >= FRAMES) { frame = 0; frame0 = 0; wall0 = now; live.start(0); }   // loop
    show(); requestAnimationFrame(tick);
  }
  $('play').onclick = () => playing ? pause() : play();
  scrub.oninput = () => { frame = +scrub.value; if (playing) { wall0 = performance.now(); frame0 = frame; live.start(frame / FPS); } show(); };
  $('mute').onclick = () => { live.setMuted(!live.muted); $('mute').textContent = live.muted ? '🔇' : '🔊'; if (playing && !live.muted) live.start(frame / FPS); };
  $('go').onclick = () => { location.search = '?seed=' + encodeURIComponent($('seed').value); };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'number') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.key === 'm' || e.key === 'M') $('mute').click();
    if (e.key === 'ArrowRight') { frame = Math.min(FRAMES - 1, frame + (e.shiftKey ? 60 : 1)); if (playing) { wall0 = performance.now(); frame0 = frame; live.start(frame / FPS); } show(); }
    if (e.key === 'ArrowLeft') { frame = Math.max(0, frame - (e.shiftKey ? 60 : 1)); if (playing) { wall0 = performance.now(); frame0 = frame; live.start(frame / FPS); } show(); }
  });
  show();
}
