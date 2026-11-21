// Procedural sound design: pure DSP that renders the whole 45 s mix from the event timeline.
// The same code runs in Node (offline mix for the MP4) and in the browser (Web Audio preview).
// Sound effects only: no music, no narration.

import { makeRng, hash32 } from './seededRandom.js';

export const SR = 48000;

// ---------- voices (mono Float32Array generators)
function env(n, a, d, sr = SR) {      // attack then exponential decay (d = time constant)
  const e = new Float32Array(n), na = Math.max(1, Math.round(a * sr));
  for (let i = 0; i < n; i++) e[i] = i < na ? i / na : Math.exp(-(i - na) / (d * sr));
  return e;
}

function glassClick(rnd, freq, strength) {
  const dur = 0.09, n = Math.round(dur * SR), out = new Float32Array(n);
  const dec = 0.012 + 0.01 * (1 - strength);
  const partials = [[1, 1, dec], [2.76, 0.45, dec * 0.6], [5.4, 0.18, dec * 0.35]];
  for (const [m, a, d] of partials) {
    if (freq * m > 14000) continue;                      // stay well below Nyquist / codec low-pass
    const w = 2 * Math.PI * freq * m / SR, ph = rnd() * 6.283;
    for (let i = 0; i < n; i++) out[i] += a * Math.sin(w * i + ph) * Math.exp(-i / (d * SR));
  }
  // transient: 1.5 ms of high-passed noise, harder hits are brighter
  const nt = Math.round(0.0015 * SR); let lp = 0;
  for (let i = 0; i < nt; i++) { const x = rnd() * 2 - 1; lp += 0.45 * (x - lp); out[i] += lp * 0.7 * strength * (1 - i / nt); }
  return out;
}

function railTock(rnd, strength) {
  const n = Math.round(0.08 * SR), out = new Float32Array(n);
  const f = 620 + 120 * rnd();
  for (let i = 0; i < n; i++) out[i] = Math.sin(2 * Math.PI * f * i / SR) * Math.exp(-i / (0.014 * SR)) + 0.4 * Math.sin(2 * Math.PI * f * 2.3 * i / SR) * Math.exp(-i / (0.007 * SR));
  return out.map((v) => v * (0.5 + 0.5 * strength));
}

function chirp(f0, f1, dur, harm = 0.18, a = 0.003, d = 0.03) {
  const n = Math.round(dur * SR), out = new Float32Array(n), e = env(n, a, d);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, f = f0 * Math.pow(f1 / f0, u);
    ph += 2 * Math.PI * f / SR;
    out[i] = (Math.sin(ph) + harm * Math.sin(3 * ph)) * e[i];
  }
  return out;
}

// state-variable filter, time-varying cutoff
function svf(input, cutoffFn, q, mode) {
  const out = new Float32Array(input.length);
  let low = 0, band = 0;
  for (let i = 0; i < input.length; i++) {
    const fc = Math.min(SR * 0.22, cutoffFn(i / SR));
    const f = 2 * Math.sin(Math.PI * fc / SR);
    const high = input[i] - low - q * band;
    band += f * high; low += f * band;
    out[i] = mode === 'low' ? low : mode === 'band' ? band : high;
  }
  return out;
}

function noise(rnd, n) { const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = rnd() * 2 - 1; return o; }

function crack(rnd, weight) {
  const n = Math.round(0.07 * SR);
  const nz = noise(rnd, n);
  const e = env(n, 0.0005, 0.009);
  const b = svf(nz, () => 2600 + 900 * rnd(), 0.7, 'band');
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b[i] * e[i] * 2.2;
  // second micro-fracture
  const off = Math.round((0.011 + 0.01 * rnd()) * SR);
  for (let i = off; i < n; i++) out[i] += b[i - off] * e[i - off] * 1.1;
  // body: tight low knock, more with weight
  for (let i = 0; i < n; i++) out[i] += Math.sin(2 * Math.PI * 180 * i / SR) * Math.exp(-i / (0.01 * SR)) * 0.5 * weight;
  return out;
}

function whoosh(rnd, dur, weight) {
  const n = Math.round(dur * SR);
  const nz = noise(rnd, n);
  const lp = svf(nz, (t) => 1700 * Math.pow(0.11, t / dur) + 90, 0.9, 'low');
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const e = Math.min(1, u / 0.06) * Math.pow(1 - u, 1.6);
    out[i] = lp[i] * e * 1.4;
  }
  // low thump that grows as the arena shrinks
  if (weight > 0) {
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 46 + 70 * Math.exp(-t / 0.05);
      ph += 2 * Math.PI * f / SR;
      out[i] += Math.sin(ph) * Math.exp(-t / 0.11) * 0.9 * weight;
    }
  }
  return out;
}

function fallTone(rnd, count) {
  const dur = 0.62, n = Math.round(dur * SR), out = new Float32Array(n);
  const f0 = 820 + 160 * rnd(), f1 = 150 + 30 * rnd();
  const voices = Math.min(3, count);
  for (let v = 0; v < voices; v++) {
    const det = 1 + (v - (voices - 1) / 2) * 0.018;
    let ph = rnd() * 6.283;
    for (let i = 0; i < n; i++) {
      const u = i / n, t = i / SR;
      const f = (f0 * Math.pow(f1 / f0, Math.pow(u, 0.75))) * det * (1 + 0.006 * Math.sin(2 * Math.PI * 7 * t));
      ph += 2 * Math.PI * f / SR;
      const e = Math.min(1, t / 0.008) * Math.pow(1 - u, 1.3) * Math.exp(-t / 0.35);
      out[i] += (Math.sin(ph) + 0.12 * Math.sin(2 * ph)) * e / Math.sqrt(voices);
    }
  }
  return out;
}

function bell(freq, dur, amp = 1) {
  const n = Math.round(dur * SR), out = new Float32Array(n);
  const partials = [[1, 1, 1.2], [2.0, 0.5, 0.8], [2.76, 0.28, 0.5], [4.07, 0.14, 0.3], [5.43, 0.07, 0.18]];
  for (const [m, a, d] of partials) {
    if (freq * m > 14000) continue;
    const w = 2 * Math.PI * freq * m / SR;
    for (let i = 0; i < n; i++) out[i] += a * Math.sin(w * i) * Math.exp(-i / (d * SR)) * Math.min(1, i / (0.002 * SR));
  }
  return out.map((v) => v * amp);
}

function shimmer(rnd, dur) {
  // reverse shimmer: rising swarm of high partials into the loop point
  const n = Math.round(dur * SR), out = new Float32Array(n);
  const parts = 14;
  for (let k = 0; k < parts; k++) {
    const f = 1800 + 6200 * rnd(), ph0 = rnd() * 6.283, a = 0.3 + 0.7 * rnd();
    const w = 2 * Math.PI * f / SR;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      out[i] += a * Math.sin(w * i + ph0) * Math.pow(u, 2.4) * (0.6 + 0.4 * Math.sin(2 * Math.PI * (9 + k) * i / SR));
    }
  }
  const nz = svf(noise(rnd, n), (t) => 2000 + 9000 * (t / dur), 0.6, 'band');
  for (let i = 0; i < n; i++) {
    const u = i / n;
    out[i] = out[i] / parts * 0.9 + nz[i] * Math.pow(u, 3) * 0.5;
    if (n - i < 0.006 * SR) out[i] *= (n - i) / (0.006 * SR);   // de-click at the loop point
  }
  return out;
}

function pulse(rnd, freq, dur, amp) {
  const n = Math.round(dur * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = freq * (1 + 0.6 * Math.exp(-t / 0.02));
    ph += 2 * Math.PI * f / SR;
    out[i] = Math.sin(ph) * Math.exp(-t / (dur * 0.3)) * Math.min(1, t / 0.002) * amp;
  }
  return out;
}

// ---------- mixing
function place(bus, sig, t, gain, pan) {
  const start = Math.round(t * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4) * gain, gr = Math.sin((pan + 1) * Math.PI / 4) * gain;
  const L = bus.L, R = bus.R, n = L.length;
  for (let i = 0; i < sig.length; i++) {
    const j = start + i;
    if (j < 0) continue;
    if (j >= n) break;
    L[j] += sig[i] * gl; R[j] += sig[i] * gr;
  }
}

function reverb(L, R) {
  // small Schroeder room (4 combs + 2 allpasses per side), returns wet
  const combs = [1557, 1617, 1491, 1422], aps = [225, 556];
  const proc = (x, spread) => {
    const out = new Float32Array(x.length);
    for (const d0 of combs) {
      const d = d0 + spread, buf = new Float32Array(d); let idx = 0, lp = 0;
      for (let i = 0; i < x.length; i++) {
        const y = buf[idx];
        lp = y * 0.6 + lp * 0.4;
        buf[idx] = x[i] + lp * 0.8;
        idx = (idx + 1) % d;
        out[i] += y * 0.25;
      }
    }
    for (const d0 of aps) {
      const d = d0 + spread, buf = new Float32Array(d); let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const bo = buf[idx], v = out[i];
        const y = -v + bo;
        buf[idx] = v + bo * 0.5;
        idx = (idx + 1) % d;
        out[i] = y;
      }
    }
    return out;
  };
  return { L: proc(L, 0), R: proc(R, 23) };
}

export function master(L, R, { gainDb = 0, ceilingDb = -1.5 } = {}) {
  const n = L.length, g = Math.pow(10, gainDb / 20), ceil = Math.pow(10, ceilingDb / 20);
  // DC/rumble high-pass (one pole, ~28 Hz)
  const a = Math.exp(-2 * Math.PI * 28 / SR);
  let xl = 0, yl = 0, xr = 0, yr = 0;
  for (let i = 0; i < n; i++) {
    const l = L[i] * g, r = R[i] * g;
    yl = a * (yl + l - xl); xl = l; L[i] = yl;
    yr = a * (yr + r - xr); xr = r; R[i] = yr;
  }
  // tame near-Nyquist energy (keeps inter-sample and post-codec peaks under control): 4-pole low-pass ~15 kHz
  const c = 1 - Math.exp(-2 * Math.PI * 15000 / SR);
  const zl = [0, 0, 0, 0], zr = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    let l = L[i], r = R[i];
    for (let k = 0; k < 4; k++) { zl[k] += c * (l - zl[k]); l = zl[k]; zr[k] += c * (r - zr[k]); r = zr[k]; }
    L[i] = l; R[i] = r;
  }
  // gentle bus compressor (2:1 above -16 dBFS, RMS detector)
  const th = Math.pow(10, -16 / 20);
  let rms = 0;
  const atk = Math.exp(-1 / (0.005 * SR)), rel = Math.exp(-1 / (0.12 * SR));
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    rms = p > rms ? atk * rms + (1 - atk) * p : rel * rms + (1 - rel) * p;
    if (rms > th) { const gr = Math.pow(rms / th, -0.5); L[i] *= gr; R[i] *= gr; }
  }
  // look-ahead peak limiter (3 ms) with smooth release: no clipping
  const la = Math.round(0.003 * SR), relL = Math.exp(-1 / (0.06 * SR));
  const peak = new Float32Array(n);
  for (let i = 0; i < n; i++) peak[i] = Math.max(Math.abs(L[i]), Math.abs(R[i]));
  // sliding max over the look-ahead window
  const need = new Float32Array(n);
  const dq = [];
  for (let i = n - 1; i >= 0; i--) {
    while (dq.length && peak[dq[dq.length - 1]] <= peak[i]) dq.pop();
    dq.push(i);
    while (dq[0] > i + la) dq.shift();
    need[i] = peak[dq[0]];
  }
  // gain curve: instant drop at window start, smooth release, then a box filter turns the drop into a 3 ms ramp
  const gc = new Float32Array(n);
  let gain = 1;
  for (let i = 0; i < n; i++) {
    const target = need[i] > ceil ? ceil / need[i] : 1;
    gain = target < gain ? target : relL * gain + (1 - relL) * target;
    gc[i] = gain;
  }
  let acc = la + 1;                       // trailing window [i-la, i], samples before 0 count as gain 1
  for (let i = 0; i < n; i++) {
    acc += gc[i] - (i - la - 1 >= 0 ? gc[i - la - 1] : 1);
    const sm = acc / (la + 1);
    L[i] *= sm; R[i] *= sm;
  }
  for (let i = 0; i < n; i++) { L[i] = Math.max(-ceil, Math.min(ceil, L[i])); R[i] = Math.max(-ceil, Math.min(ceil, R[i])); }
  return { L, R };
}

// events: [{t, type, ...}] (see timeline.js). Returns stereo Float32Arrays (pre-master).
export function synthesize(events, { duration = 45, seed = 1 } = {}) {
  const n = Math.round(duration * SR);
  const dry = { L: new Float32Array(n), R: new Float32Array(n) };
  const send = { L: new Float32Array(n), R: new Float32Array(n) };
  for (let k = 0; k < events.length; k++) {
    const e = events[k];
    const rnd = makeRng(hash32(seed, 7, k, Math.round(e.t * 1000)));
    const pan = Math.max(-0.8, Math.min(0.8, e.pan || 0));
    const put = (sig, g, wet = 0.15, t = e.t) => { place(dry, sig, t, g, pan); if (wet > 0) place(send, sig, t, g * wet, pan); };
    switch (e.type) {
      case 'collide': {
        const s = e.strength;
        put(glassClick(rnd, 2300 + 2600 * (e.pitch ?? rnd()) * (0.8 + 0.4 * s), s), 0.05 + 0.16 * s, 0.12);
        break;
      }
      case 'rail': put(railTock(rnd, e.strength), 0.035 + 0.07 * e.strength, 0.1); break;
      case 'warn': put(chirp(880, 1500, 0.075, 0.25, 0.002, 0.022), 0.1 * (e.gain ?? 1), 0.2); break;
      case 'crit': {
        put(chirp(1650, 2100, 0.06, 0.35, 0.001, 0.016), 0.12 * (e.gain ?? 1), 0.2);
        put(chirp(1650, 2100, 0.06, 0.35, 0.001, 0.016), 0.07 * (e.gain ?? 1), 0.2, e.t + 0.05);
        break;
      }
      case 'collapse': {
        const w = e.weight;   // 0 early .. 1 at the end
        put(crack(rnd, w), 0.32 + 0.08 * w, 0.18);
        put(whoosh(rnd, 0.32 + 0.12 * w, w), 0.3 + 0.12 * w, 0.25, e.t + 0.004);
        break;
      }
      case 'fall': put(fallTone(rnd, e.count), (0.12 + 0.05 * Math.log2(e.count + 1)) * (e.gain ?? 1), 0.35); break;
      case 'accent': {   // isolated tension accents (final tiles)
        put(pulse(rnd, e.freq || 70, 0.32, 1), 0.38 * (e.gain ?? 1), 0.3);
        put(chirp(e.hi || 1240, (e.hi || 1240) * 0.98, 0.05, 0.1, 0.001, 0.02), 0.06 * (e.gain ?? 1), 0.4);
        break;
      }
      case 'victory': {
        const chord = e.gold ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99, 1046.5];
        chord.forEach((f, i) => put(bell(f, 2.2, 1 / (1 + i * 0.25)), 0.11, 0.55, e.t + i * 0.035));
        put(pulse(rnd, 98, 0.6, 1), 0.25, 0.3);
        break;
      }
      case 'shimmer': put(shimmer(rnd, e.dur), 0.22, 0.35); break;
      case 'open': put(pulse(rnd, 160, 0.4, 1), 0.2, 0.25); put(glassClick(rnd, 3100, 0.8), 0.1, 0.3); break;
      default: break;
    }
  }
  const wet = reverb(send.L, send.R);
  for (let i = 0; i < n; i++) { dry.L[i] += wet.L[i] * 0.6; dry.R[i] += wet.R[i] * 0.6; }
  return dry;
}

export function toWav16(L, R) {
  const n = L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 4, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    v.setInt16(o, Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), true);
    v.setInt16(o + 2, Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), true);
    o += 4;
  }
  return buf;
}
