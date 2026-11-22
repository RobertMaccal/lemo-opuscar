// The master timeline: scene times, the shared light-state table, sound/cue events.
import { mulberry } from './rng.js';

export const DUR = 40, FPS = 30, BEAT = 0.8;   // 75 bpm
export const T = {
  hook: 0, textClock: [0.6, 4.6], textAsleep: [1.8, 5.4],
  lightsOut: 5.0, oneLeft: 12.6, textRemain: [13.6, 17.0],
  push: 14.6, enter: 18.8,                    // exterior → interior handoff (glass fills the frame)
  place: [19.2, 20.8], lamp: [21.6, 23.2],
  macro: 25.0, pressS: 27.2, pressW: 29.6, lookUp: [30.4, 31.2],
  reach: 31.3, flicker: [32.0, 32.8], dark: [32.8, 34.4], lookOut: [32.9, 33.6], relight: 34.4,
  exit: 35.8, textEnd: [36.4, 40.0], hold: 39.2,
};

// ---- the main building: 9 floors x 6 columns ----
export const B = { x0: 80, x1: 280, roof: 180, ground: 540, gfTop: 500, floorH: 34 };
export const colX = c => 105 + 30 * c;
export const floorTop = f => B.gfTop - B.floorH * f;      // f = 1..9
export const H_WIN = { f: 6, c: 3 };                        // his window: floor 6 (arched row), column 3
// arched glass: 12 x 21 rect + radius-6 arch on top
export const archGlass = c => ({ x: colX(c) - 6, y: floorTop(6) + 9, w: 12, h: 21, r: 6, cx: colX(c) });
export const gridGlass = (f, c) => ({ x: colX(c) - 9, y: floorTop(f) + 7, w: 18, h: 20 });
export const HG = archGlass(3);                              // x 189..201, y 305..326
export const H_CENTER = [HG.x + HG.w / 2, HG.y + HG.h / 2]; // 195, 315.5

// vignettes: the six little moments (window id → [type, off time])
const VIG = { '2_1': ['reader', 6.4], '4_0': ['tv', 7.2], '3_4': ['couple', 8.8], '5_5': ['cat', 9.6], '7_1': ['kitchen', 10.4], '8_4': ['desk', 12.0] };
const GENERIC = ['shelf', 'plant', 'curtain', 'person', 'bulb', 'shelf', 'curtain', 'plant', 'person2'];
const CURT = ['r2', 'g2', 'k2', 'r1', 'p3', 'b3', 'g3'];

export const WINDOWS = [];
{
  const R = mulberry(731);
  const taken = Object.values(VIG).map(v => v[1]);
  const pick = () => { for (let k = 0; k < 400; k++) { const t = 5.25 + R() * 7.6; if (taken.every(u => Math.abs(u - t) > 0.17)) { taken.push(t); return t; } } return 12.8; };
  for (let f = 1; f <= 9; f++) for (let c = 0; c < 6; c++) {
    const id = `${f}_${c}`, isH = f === H_WIN.f && c === H_WIN.c;
    const v = VIG[id];
    let lit = isH || !!v || R() < 0.62;
    const w = { id, f, c, arched: f === 6, isH, lit0: lit, off: Infinity, type: v ? v[0] : GENERIC[Math.floor(R() * GENERIC.length)], curtain: CURT[Math.floor(R() * CURT.length)], seed: Math.floor(R() * 1e6) };
    if (v) w.off = v[1]; else if (lit && !isH) w.off = pick();
    if (isH) w.type = 'him';
    WINDOWS.push(w);
  }
}
export const WIN = Object.fromEntries(WINDOWS.map(w => [w.id, w]));

// flanking buildings and the distant skyline lights
export const FLANK = [];
{ const R = mulberry(99); for (let i = 0; i < 14; i++) FLANK.push({ lit: R() < .45, off: 5.4 + R() * 7.3, seed: i }); }
export const FAR = [];
{ const R = mulberry(4242); for (let i = 0; i < 60; i++) FAR.push({ x: Math.floor(R() * 360), y: 330 + Math.floor(R() * 190), off: R() < .15 ? 4 + R() * 1 : 5.2 + R() * 7.6, flick: R() < .1 }); }

// ---- the shared light-state table: real windows and their miniature twins read the same entries ----
const FLICK = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0];   // 15 Hz steps over 0.8 s
export function hLight(t) {           // his window = his desk lamp = the tiny window in his model
  if (t < T.flicker[0]) return 1;
  if (t < T.flicker[1]) return FLICK[Math.min(11, Math.floor((t - T.flicker[0]) * 15))];
  if (t < T.relight) return 0;
  return 1;
}
export const SHARED = {
  S1: { off: T.pressS },   // the spire building's window ↔ the spire model
  W1: { off: T.pressW },   // the water-tower building's window ↔ the water-tower model
};
// 1 lit, .5 the frame-and-a-half afterglow of a bulb, 0 dark
export const level = (off, t) => t < off ? 1 : t < off + 0.07 ? 0.5 : 0;
export function winLevel(w, t) { if (w.isH) return hLight(t); if (!w.lit0) return 0; return level(w.off, t); }
export const sharedLevel = (id, t) => level(SHARED[id].off, t);
export const miniLamp = t => t < T.lamp[1] ? 0 : 1;            // the tiny streetlamp he sets

// ---- reading-time cards ----
export const CARDS = [
  { id: 'clock', text: '3:00 AM', t0: T.textClock[0], t1: T.textClock[1], y: 64, scale: 2 },
  { id: 'asleep', text: 'EVERYONE WAS ASLEEP.', t0: T.textAsleep[0], t1: T.textAsleep[1], y: 90, scale: 1 },
  { id: 'remain', text: 'BUT ONE LIGHT REMAINED.', t0: T.textRemain[0], t1: T.textRemain[1], y: 76, scale: 1 },
  { id: 'end', text: 'SOME LIGHTS ARE WORTH KEEPING ON.', t0: T.textEnd[0], t1: T.textEnd[1], y: 76, scale: 1 },
];
