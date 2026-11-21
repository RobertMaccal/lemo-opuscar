// audio.js — procedural sound design (Web Audio API). No samples, no network.
// The same code drives the live preview (AudioContext) and the export (OfflineAudioContext), from one cue list
// derived from the simulation's event log, so every sound sits on the frame that caused it.
import { FPS, FRAMES, N, R, GOLD, GUSTS, WARN, SWEEPERS, Y_FINISH, width, centerX, sweeperState, wind, hash, mulberry32 } from './physics.js';
import { VW, VH } from './camera.js';

const clamp = (x, a, b) => x < a ? a : x > b ? b : x;

// ---------- 1. cue list (event prioritisation happens here) ----------
export function buildCues(sim, cam) {
  const { events, rec, alive } = sim, cues = [];
  const scr = (x, y, t) => {                       // screen position + visibility weight at time t
    const f = clamp(Math.round(t * FPS), 0, FRAMES - 1), Z = cam[f * 4 + 2];
    const sx = VW / 2 + (x - cam[f * 4]) * Z, sy = VH / 2 - (y - cam[f * 4 + 1]) * Z;
    const on = sx > -40 && sx < VW + 40 && sy > -40 && sy < VH + 40;
    return { pan: clamp((sx / VW) * 2 - 1, -1, 1) * 0.7, vis: on ? 1 : 0.18, Z };
  };
  cues.push({ t: 0.0, type: 'start' });
  // collisions: 1/30 s buckets, at most 2 per bucket, ranked by impulse × visibility (gold counts double)
  const buckets = new Map();
  for (const e of events) {
    if (e.type !== 'hit' && e.type !== 'sweep') continue;
    const s = scr(e.x, e.y, e.t), gold = e.a === GOLD || e.b === GOLD || e.id === GOLD;
    const pr = e.j * s.vis * (gold ? 2 : 1);
    if (pr < 30) continue;
    const k = Math.floor(e.t * 30), arr = buckets.get(k) || [];
    arr.push({ t: e.t, type: e.type === 'sweep' ? 'clank' : 'click', j: e.j, pan: s.pan, vis: s.vis, gold, seed: (e.a ?? e.id) * 131 + (e.b ?? 7), pr });
    buckets.set(k, arr);
  }
  for (const arr of buckets.values()) { arr.sort((a, b) => b.pr - a.pr); cues.push(...arr.slice(0, 2)); }
  // eliminations: grouped in 90 ms windows so a wave of falls reads as one gesture, not noise
  const falls = events.filter(e => e.type === 'fall');
  let grp = null;
  for (const e of falls) {
    const s = scr(e.x, e.y, e.t);
    if (grp && e.t - grp.t < 0.09) { grp.n++; grp.vis = Math.max(grp.vis, s.vis); grp.pan = (grp.pan + s.pan) / 2; continue; }
    grp = { t: e.t, type: 'fall', n: 1, pan: s.pan, vis: s.vis, seed: e.id, last: false }; cues.push(grp);
  }
  if (grp && alive[FRAMES - 1] <= 1) grp.last = true;
  // gusts
  for (const g of GUSTS) if (g.p >= 250) cues.push({ t: g.t - 0.15, type: 'gust', d: g.d, p: g.p, pan: g.dir * -0.4 });
  // sweeper passes (a whoosh each time it crosses the centreline while on screen)
  for (let si = 0; si < SWEEPERS.length; si++) {
    let prev = null;
    for (let f = 0; f < FRAMES; f++) {
      const t = f / FPS, s = sweeperState(SWEEPERS[si], t), sc = scr(s.cx, s.cy, t);
      if (prev !== null && Math.sign(prev) !== Math.sign(s.off) && sc.vis === 1) cues.push({ t, type: 'sweeper', pan: sc.pan, dir: Math.sign(s.vel) });
      prev = s.off;
    }
  }
  // bridge narrowing: when the field reaches each new, narrower stage
  const stages = [400, 300, 225, 150, 88, 40, 8];
  let si = 0;
  for (let f = 0; f < FRAMES && si < stages.length; f++) {
    let lead = -1e9; for (let i = 0; i < N; i++) { const o = (f * N + i) * 4, st = rec[o + 3] | 0; if (st === 0) lead = Math.max(lead, rec[o + 1]); }
    if (lead > -1e8 && lead < Y_FINISH && width(lead + 250) <= stages[si]) { cues.push({ t: f / FPS, type: 'narrow', stage: si }); si++; }
  }
  // near misses: the gold ball's, and anyone's once the field is small
  for (const e of sim.nearMisses) {
    const f = Math.round(e.t * FPS); if (e.id !== GOLD && alive[f] > 6) continue;
    const s = scr(e.x, e.y, e.t); if (s.vis < 1) continue;
    cues.push({ t: e.t0 + Math.min(0.25, (e.t - e.t0) * 0.5), type: 'save', pan: s.pan, gold: e.id === GOLD, peak: e.peak });
  }
  const fin = events.find(e => e.type === 'finish' && e.id === GOLD) || events.find(e => e.type === 'finish');
  if (fin) cues.push({ t: fin.t, type: 'chime', gold: fin.id === GOLD });
  cues.sort((a, b) => a.t - b.t);
  return { cues, finishT: fin ? fin.t : 44.5 };
}

// ---------- 2. synthesis ----------
function noiseBuffer(ctx, seconds, seed) {
  const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), r = mulberry32(seed);
  for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
  return buf;
}
function impulse(ctx, seconds, seed) {
  const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate), r = mulberry32(seed);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) { const x = i / n; d[i] = (r() * 2 - 1) * Math.pow(1 - x, 3.2) * (i < 40 ? i / 40 : 1); } }
  return buf;
}

export function createEngine(ctx) {
  const master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.18;
  const out = ctx.createGain(); out.gain.value = 0.85;
  master.connect(comp); comp.connect(out); out.connect(ctx.destination);
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 2.6, 77);
  const verbIn = ctx.createGain(); verbIn.gain.value = 1; verbIn.connect(verb); verb.connect(master);
  const noise = noiseBuffer(ctx, 3, 4242);
  const E = { ctx, master, out, verbIn, noise };

  const voice = (when, pan, gain, wet) => {          // per-sound output: panner → master (+ reverb send)
    const g = ctx.createGain(); g.gain.value = gain;
    const p = ctx.createStereoPanner(); p.pan.value = pan || 0;
    g.connect(p); p.connect(master);
    if (wet) { const s = ctx.createGain(); s.gain.value = wet; p.connect(s); s.connect(verbIn); }
    return g;
  };
  const env = (param, when, a, peak, d, floor = 0.0001) => {
    param.setValueAtTime(floor, when); param.linearRampToValueAtTime(peak, when + a); param.exponentialRampToValueAtTime(floor, when + a + d);
  };
  const osc = (type, f, when, dur, dest) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, when); o.connect(dest); o.start(when); o.stop(when + dur + 0.05); return o; };
  const noiseSrc = (when, dur, dest, offset = 0) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.connect(dest); s.start(when, offset % 2.9); s.stop(when + dur + 0.05); return s; };

  E.play = (c, when) => {
    switch (c.type) {
      case 'start': {                                   // futuristic pulse: sub drop + bright bloom + air
        const v = voice(when, 0, 0.55, 0.35);
        const g1 = ctx.createGain(); g1.connect(v); env(g1.gain, when, 0.005, 0.9, 0.55);
        const o1 = osc('sine', 140, when, 0.6, g1); o1.frequency.exponentialRampToValueAtTime(48, when + 0.5);
        const g2 = ctx.createGain(); g2.connect(v); env(g2.gain, when, 0.01, 0.22, 0.7);
        const o2 = osc('triangle', 660, when, 0.8, g2); o2.frequency.exponentialRampToValueAtTime(1320, when + 0.12);
        osc('sine', 990, when, 0.8, g2).frequency.exponentialRampToValueAtTime(1980, when + 0.12);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(400, when); bp.frequency.exponentialRampToValueAtTime(5000, when + 0.4);
        const g3 = ctx.createGain(); bp.connect(g3); g3.connect(v); env(g3.gain, when, 0.02, 0.18, 0.45); noiseSrc(when, 0.6, bp);
        break;
      }
      case 'click': case 'clank': {                     // glassy click, pitch and level from the impulse
        const k = clamp((c.j - 18) / 260, 0, 1), lvl = (0.05 + 0.32 * Math.pow(k, 0.7)) * c.vis * (c.gold ? 1.4 : 1);
        const v = voice(when, c.pan, lvl, 0.18), base = (c.type === 'clank' ? 1300 : 1900) + 1100 * hash(c.seed) + 700 * k;
        const g = ctx.createGain(); g.connect(v); env(g.gain, when, 0.0015, 1, 0.05 + 0.07 * k);
        osc('sine', base, when, 0.2, g);
        const g2 = ctx.createGain(); g2.connect(v); env(g2.gain, when, 0.001, 0.45, 0.035 + 0.04 * k);
        osc('sine', base * 2.76, when, 0.15, g2);
        if (c.type === 'clank') { const g3 = ctx.createGain(); g3.connect(v); env(g3.gain, when, 0.002, 0.5, 0.12); osc('triangle', base * 0.31, when, 0.2, g3); }
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000; const g4 = ctx.createGain(); hp.connect(g4); g4.connect(v);
        env(g4.gain, when, 0.0008, 0.35, 0.008); noiseSrc(when, 0.03, hp, hash(c.seed + 1) * 2);
        break;
      }
      case 'fall': {                                    // descending electronic tone + airy drop
        const n = Math.min(c.n, 6), lvl = (0.26 + 0.06 * Math.min(4, n - 1)) * (0.35 + 0.65 * c.vis) * (c.last ? 1.4 : 1);
        const v = voice(when, c.pan, lvl, 0.3), f0 = 760 + 260 * hash(c.seed * 7 + 3), dur = c.last ? 0.75 : 0.42;
        for (let k = 0; k < Math.min(n, 3); k++) {
          const g = ctx.createGain(); g.connect(v); env(g.gain, when + k * 0.018, 0.006, 0.5 / (1 + k * 0.4), dur);
          const o = osc('triangle', f0 * (1 + k * 0.19), when + k * 0.018, dur + 0.1, g); o.frequency.exponentialRampToValueAtTime(f0 * (1 + k * 0.19) * 0.28, when + dur);
        }
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(2600, when); bp.frequency.exponentialRampToValueAtTime(350, when + dur);
        const g2 = ctx.createGain(); bp.connect(g2); g2.connect(v); env(g2.gain, when, 0.01, 0.35, dur); noiseSrc(when, dur + 0.1, bp, hash(c.seed) * 2);
        break;
      }
      case 'gust': {                                    // a swell of air across the stereo field
        const lvl = 0.07 + 0.13 * clamp((c.p - 250) / 250, 0, 1), dur = c.d + 1.2;
        const v = voice(when, 0, lvl, 0.25);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
        bp.frequency.setValueAtTime(300, when); bp.frequency.exponentialRampToValueAtTime(1500, when + 0.6); bp.frequency.exponentialRampToValueAtTime(500, when + dur);
        const p = ctx.createStereoPanner(); p.pan.setValueAtTime(c.pan, when); p.pan.linearRampToValueAtTime(-c.pan, when + dur);
        const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 3000;
        const g = ctx.createGain(); bp.connect(soft); soft.connect(g); g.connect(p); p.connect(v);
        g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(1, when + 0.55); g.gain.setValueAtTime(1, when + c.d); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        noiseSrc(when, dur, bp, 1.3);
        break;
      }
      case 'sweeper': {                                 // quiet mechanical whoosh
        const v = voice(when - 0.12, c.pan, 0.12, 0.2);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(700, when - 0.12); bp.frequency.exponentialRampToValueAtTime(2400, when); bp.frequency.exponentialRampToValueAtTime(800, when + 0.22);
        const g = ctx.createGain(); bp.connect(g); g.connect(v); g.gain.setValueAtTime(0.0001, when - 0.12); g.gain.exponentialRampToValueAtTime(1, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.25);
        noiseSrc(when - 0.12, 0.4, bp, 0.7);
        const g2 = ctx.createGain(); g2.connect(v); env(g2.gain, when - 0.1, 0.1, 0.25, 0.2); osc('sawtooth', 95, when - 0.1, 0.35, g2).frequency.linearRampToValueAtTime(120, when + 0.2);
        break;
      }
      case 'narrow': {                                  // mechanical tension: a low servo strain
        const v = voice(when, 0, 0.16 + c.stage * 0.015, 0.3);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 9; lp.frequency.setValueAtTime(180, when); lp.frequency.exponentialRampToValueAtTime(900, when + 0.7);
        const g = ctx.createGain(); lp.connect(g); g.connect(v); env(g.gain, when, 0.08, 0.8, 0.8);
        const base = 55 + c.stage * 4;
        osc('sawtooth', base, when, 0.95, lp); osc('sawtooth', base * 1.012, when, 0.95, lp);
        const g2 = ctx.createGain(); g2.connect(v); env(g2.gain, when + 0.05, 0.05, 0.12, 0.5);
        osc('square', 180, when + 0.05, 0.6, g2).frequency.exponentialRampToValueAtTime(260 + c.stage * 20, when + 0.5);
        break;
      }
      case 'save': {                                    // restrained high accent
        const v = voice(when, c.pan, c.gold ? 0.2 : 0.11, 0.4);
        const g = ctx.createGain(); g.connect(v); env(g.gain, when, 0.003, 1, 0.22);
        osc('sine', 3520, when, 0.3, g); osc('sine', 5280, when, 0.3, g).detune.value = 6;
        const g2 = ctx.createGain(); g2.connect(v); env(g2.gain, when, 0.002, 0.4, 0.12); osc('triangle', 1760, when, 0.2, g2);
        break;
      }
      case 'chime': {                                   // clean golden chime with a long resonant decay
        const v = voice(when, 0, 0.42, 0.55);
        const notes = [[784, 0], [1175, 0.11], [1568, 0.22]];
        for (const [f0, dt] of notes) for (const [ratio, amp, dec] of [[1, 1, 3.2], [2.0, 0.4, 2.2], [2.76, 0.28, 1.6], [5.4, 0.12, 0.9], [8.93, 0.05, 0.5]]) {
          const g = ctx.createGain(); g.connect(v); env(g.gain, when + dt, 0.004, amp * (dt ? 0.7 : 1), dec);
          osc('sine', f0 * ratio, when + dt, dec + 0.1, g);
        }
        break;
      }
    }
  };

  // continuous beds: wind (follows the simulated wind) and the final-act rumble
  E.beds = (when, fromT, finishT) => {
    const dur = 45 - fromT; if (dur <= 0) return;
    const rate = 30, n = Math.max(2, Math.ceil(dur * rate));
    const wg = new Float32Array(n), wf = new Float32Array(n), rg = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = fromT + i / rate, a = Math.abs(wind(t));
      wg[i] = 0.012 + 0.11 * Math.pow(clamp(a / 480, 0, 1), 1.5);
      wf[i] = 300 + 900 * clamp(a / 480, 0, 1);
      const r = clamp((t - 29) / 6, 0, 1) * (1 - clamp((t - finishT) / 0.9, 0, 1));
      rg[i] = 0.0001 + 0.075 * r * (t > 36.5 ? 1.2 : 1);
    }
    const end = when + dur;
    const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.Q.value = 0.6; lp.frequency.setValueCurveAtTime(wf, when, dur);
    const g = ctx.createGain(); g.gain.setValueCurveAtTime(wg, when, dur);
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 2200;
    lp.connect(soft); soft.connect(g); g.connect(master); noiseSrc(when, dur, lp, 0.2);
    // rumble: sub sine + filtered noise
    const rgN = ctx.createGain(); rgN.gain.setValueCurveAtTime(rg, when, dur); rgN.connect(master);
    const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 90; const ng = ctx.createGain(); ng.gain.value = 0.5; lp2.connect(ng); ng.connect(rgN); noiseSrc(when, dur, lp2, 2.1);
    const sub = ctx.createGain(); sub.gain.value = 0.35; sub.connect(rgN); osc('sine', 41, when, dur, sub);
    const sub2 = ctx.createGain(); sub2.gain.value = 0.25; sub2.connect(rgN); osc('sine', 61.5, when, dur, sub2);
    void end;
  };
  return E;
}

// ---------- 3. offline render (export) ----------
export async function renderOffline(cueData, OfflineCtx, sampleRate = 48000) {
  const ctx = new OfflineCtx(2, Math.round(45 * sampleRate), sampleRate);
  const E = createEngine(ctx);
  E.beds(0, 0, cueData.finishT);
  for (const c of cueData.cues) E.play(c, Math.max(0, c.t));
  // a clean end for the loop: fade the master out over the last half second
  E.out.gain.setValueAtTime(0.85, 44.35); E.out.gain.linearRampToValueAtTime(0.0001, 44.97);
  return ctx.startRendering();
}

// ---------- 4. live preview ----------
export function createLive(cueData) {
  let ctx = null, E = null, timer = null, startWall = 0, fromT = 0, idx = 0, muted = false;
  const LOOK = 0.25;
  function stop() { if (timer) clearInterval(timer); timer = null; if (ctx) { ctx.close(); ctx = null; } }
  function start(t) {
    stop(); if (muted) return;
    ctx = new AudioContext({ latencyHint: 'interactive' }); E = createEngine(ctx);
    fromT = t; startWall = ctx.currentTime + 0.05;
    E.beds(startWall, fromT, cueData.finishT);
    idx = cueData.cues.findIndex(c => c.t >= t); if (idx < 0) idx = cueData.cues.length;
    const pump = () => {
      if (!ctx) return; const now = ctx.currentTime - startWall + fromT;
      while (idx < cueData.cues.length && cueData.cues[idx].t < now + LOOK) {
        const c = cueData.cues[idx++]; const when = startWall + (c.t - fromT); if (when >= ctx.currentTime - 0.02) E.play(c, Math.max(ctx.currentTime, when));
      }
    };
    pump(); timer = setInterval(pump, 50);
  }
  return { start, stop, setMuted(m) { muted = m; if (m) stop(); }, get muted() { return muted; } };
}
