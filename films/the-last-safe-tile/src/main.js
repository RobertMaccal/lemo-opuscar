// Preview app + offline render hooks.
// ?seed=N picks a run; ?render=1 hides the controls and exposes window.renderFrame(f) for export.

import { FRAMES, FPS, DURATION, DEFAULT_SEED } from './config.js';
import { bake } from './simulation.js';
import { createRenderer } from './renderer.js';
import { buildAudioEvents } from './timeline.js';
import { synthesize, master, SR } from './audio.js';

const qs = new URLSearchParams(location.search);
const RENDER = qs.get('render') === '1';
if (RENDER) document.body.classList.add('render');

const canvas = document.getElementById('stage');
const $ = (id) => document.getElementById(id);

let B = null, R = null;
let frame = 0, playing = false, speed = 1, muted = false;
let clockStart = 0, clockOffset = 0;
let audioCtx = null, audioBuf = null, source = null, audioStartCtx = 0;

async function loadFonts() {
  await Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 40px "Space Grotesk"`)));
  await document.fonts.ready;
}

function describe(B) {
  const S = B.stats;
  const w = S.winner ? `${S.winner.family} #${S.winner.id}` : (S.survivors ? `${S.survivors} survivors` : 'none');
  return `seed ${B.seed} · checksum ${B.checksum}\n` +
    `alive @10s ${S.alive10} · @20s ${S.alive20} · @30s ${S.alive30}\n` +
    `alive @39s ${S.alive39} · @43s ${S.alive43}\n` +
    `survivors ${S.survivors} · winner ${w}\n` +
    `gold ${S.goldAlive ? 'survives' : 'falls at ' + S.goldFallT.toFixed(2) + ' s'}\n` +
    `near misses ${S.nearMisses} (escapes ${S.escapes})`;
}

async function load(seed) {
  $('busy')?.classList.add('on');
  await new Promise((r) => setTimeout(r, 30));
  B = bake(seed);
  R = createRenderer(canvas, B);
  audioBuf = null;
  if (!RENDER) {
    $('seed').value = seed;
    $('stats').textContent = describe(B);
    const u = new URL(location.href); u.searchParams.set('seed', seed); history.replaceState(null, '', u);
  }
  window.BAKE_INFO = { seed: B.seed, checksum: B.checksum, stats: B.stats, frames: FRAMES };
  $('busy')?.classList.remove('on');
  seek(0);
}

// ---------- audio (Web Audio playback of the procedurally synthesized mix)
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SR });
  if (!audioBuf) {
    const mix = synthesize(buildAudioEvents(B), { duration: DURATION, seed: B.seed });
    const { L, R: Rr } = master(mix.L, mix.R, { gainDb: 0 });
    audioBuf = audioCtx.createBuffer(2, L.length, SR);
    audioBuf.copyToChannel(L, 0); audioBuf.copyToChannel(Rr, 1);
  }
}
function stopAudio() { if (source) { try { source.stop(); } catch {} source.disconnect(); source = null; } }
function startAudio(t) {
  stopAudio();
  if (muted || !playing) return;
  ensureAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  source = audioCtx.createBufferSource();
  source.buffer = audioBuf; source.loop = true;
  source.playbackRate.value = speed;
  source.connect(audioCtx.destination);
  audioStartCtx = audioCtx.currentTime;
  source.start(0, t % DURATION);
}

// ---------- transport
function currentTime() {
  if (!playing) return clockOffset;
  if (source && audioCtx) return clockOffset + (audioCtx.currentTime - audioStartCtx) * speed;   // audio is the master clock
  return clockOffset + ((performance.now() - clockStart) / 1000) * speed;
}
function seek(f) {
  frame = ((f % FRAMES) + FRAMES) % FRAMES;
  clockOffset = frame / FPS; clockStart = performance.now();
  if (playing) startAudio(clockOffset);
  draw();
}
function setPlaying(p) {
  clockOffset = currentTime(); clockStart = performance.now();
  playing = p;
  if (!RENDER) $('play').textContent = p ? 'Pause' : 'Play';
  if (p) startAudio(clockOffset); else stopAudio();
}
function draw() {
  R.renderFrame(frame);
  if (!RENDER) {
    $('scrub').value = frame;
    $('readout').textContent = `${(frame / FPS).toFixed(2)} s · frame ${frame} / ${FRAMES - 1}`;
  }
}
function tick() {
  if (playing) {
    const f = Math.floor(currentTime() * FPS + 1e-6) % FRAMES;
    if (f !== frame) { frame = f; draw(); }
  }
  requestAnimationFrame(tick);
}

// ---------- in-browser fallback export (real-time WebM; the offline MP4 is frame-perfect)
async function exportWebm() {
  const fps = FPS;
  const vstream = canvas.captureStream(fps);
  ensureAudio();
  const dest = audioCtx.createMediaStreamDestination();
  const tracks = [...vstream.getVideoTracks(), ...dest.stream.getAudioTracks()];
  const rec = new MediaRecorder(new MediaStream(tracks), { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 24e6 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  setPlaying(false); speed = 1; $('speed').value = '1'; seek(0);
  const src = audioCtx.createBufferSource(); src.buffer = audioBuf; src.connect(dest); if (!muted) src.connect(audioCtx.destination);
  rec.start();
  const t0 = audioCtx.currentTime + 0.05; src.start(t0);
  await new Promise((resolve) => {
    const step = () => {
      const t = audioCtx.currentTime - t0;
      if (t >= DURATION) return resolve();
      const f = Math.max(0, Math.floor(t * fps));
      if (f !== frame) { frame = f; draw(); }
      requestAnimationFrame(step);
    };
    step();
  });
  rec.stop(); await done;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
  a.download = `the_last_safe_tile_seed${B.seed}.webm`; a.click();
}

function bindUI() {
  $('play').onclick = () => setPlaying(!playing);
  $('restart').onclick = () => { seek(0); if (!playing) setPlaying(true); };
  $('mute').onclick = () => { muted = !muted; $('mute').textContent = muted ? 'Sound: off' : 'Sound: on'; if (playing) { clockOffset = currentTime(); clockStart = performance.now(); startAudio(clockOffset); } };
  $('loadSeed').onclick = () => { const s = Math.max(1, parseInt($('seed').value, 10) || DEFAULT_SEED); setPlaying(false); load(s); };
  $('randSeed').onclick = () => { setPlaying(false); load(1 + Math.floor(Math.random() * 99999)); };
  $('speed').onchange = () => { clockOffset = currentTime(); clockStart = performance.now(); speed = parseFloat($('speed').value); if (playing) startAudio(clockOffset); };
  $('scrub').oninput = () => { seek(parseInt($('scrub').value, 10)); };
  $('export').onclick = () => exportWebm();
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
    if (e.key === 'r') { seek(0); }
    if (e.key === 'm') $('mute').click();
    if (e.key === 'ArrowRight') { setPlaying(false); seek(frame + 1); }
    if (e.key === 'ArrowLeft') { setPlaying(false); seek(frame - 1); }
  });
}

(async function start() {
  await loadFonts();
  const seed = parseInt(qs.get('seed') || '', 10) || DEFAULT_SEED;
  if (!RENDER) bindUI();
  await load(seed);
  window.renderFrame = (f) => { frame = f; R.renderFrame(f); return true; };
  window.FRAMES = FRAMES;
  window.READY = true;
  if (!RENDER) {
    const f0 = parseInt(qs.get('frame') || '0', 10) || 0;
    seek(f0);
    requestAnimationFrame(tick);
  }
})();
