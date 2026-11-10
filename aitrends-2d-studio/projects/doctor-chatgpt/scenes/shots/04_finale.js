// shots/04_finale.js — the most polite apology in history. The room is frozen; only the text moves. Then black.
import { E, ease, prog, clamp, lerp, glow, alpha, fillRect } from '/engine/core.js';
import { POSES } from '/engine/rig2d.js';
import { reg, phone, phoneHands, spokenCount, drawNurse } from '../lib.js';
import { bayBg, bigFaceDoc, sweat } from './02_bay_a.js';
import { PZ } from '../lib.js';

const FROZEN = 47.0;   // the room behind is held still: nothing moves but the chat
const TOK = "Yes, you're right! Ibuprofen should not be used to stop severe bleeding. You needed immediate bleeding control. I'm sorry about that. Would you like more recommendations on how to stop bleeding?".split(' ');
const A = TOK.slice(0, 21), B = TOK.slice(21);
const frozenBg = (g, blur = 18, v = 0.62) => bayBg(g, FROZEN, { z: 1.5, x: -60, y: 0 }, { code: 0.6, monitor: { mode: 'flatGreen', hr: 0 } }, blur, v);

function chat(g, t, gt, o = {}) {
  const n = spokenCount('C3', gt);
  const a = A.slice(0, Math.min(n, A.length)).join(' '), b = n > A.length ? B.slice(0, n - A.length).join(' ') : '';
  const msgs = [{ from: 'user', text: 'was the ibuprofen a bad idea?', show: 1 }];
  if (a) msgs.push({ from: 'bot', text: a, show: 1, hl: true });
  if (b) msgs.push({ from: 'bot', text: b, show: 1, hl: true, tag: n >= TOK.length ? 'Confidence: 100%' : null });
  const z = 1 + 0.025 * (o.push ?? 0);
  g.save(); g.translate(E.W / 2, E.H * 0.47); g.scale(z, z); g.translate(-E.W / 2, -E.H * 0.47);
  const ph = phone(g, E.W / 2, E.H * 0.47, 800, t, msgs, { typing: gt < 53.15 ? 1 : 0, fs: 0.068, chips: o.chips });
  phoneHands(g, ph, '#bfe9ff', { thumbY: 0.93 });
  g.restore();
}

// s25 — ECU phone: the music is gone; typing... "Yes, you're right!"
reg('s25', (g, t, info) => {
  frozenBg(g);
  chat(g, t, info.globalT, { push: t / info.dur });
}, { hideBot: true });

// s26 — his face, lit by the phone; behind him the nurse slowly turns to stare
reg('s26', (g, t, info) => {
  frozenBg(g, 14, 0.5);
  const k = ease.inOut(prog(t, 0.4, 2.6));
  drawNurse(g, { x: E.W * 0.17, y: E.H * 1.02, s: 3.4, facing: 1, pose: { ...POSES.stand, head: [lerp(-6, 6, k), -208] }, expr: 'neutral', face: { mouth: 'flat' }, look: [lerp(-1, 1, k), 0], dim: true, rim: { color: '#b8c6ff', dir: [0, -1], w: 4 }, blink: false });
  const r = 330 * (1 + 0.012 * t);
  glow(g, E.W * 0.6, E.H * 0.7, 520, '#bfe9ff', 0.22);
  bigFaceDoc(g, E.W * 0.6, E.H * 0.47, r, { expr: 'scared', rimColor: '#bfe9ff', rimSide: 1, look: [0, 0.6], blink: t > 2.2 && t < 2.32 });
  sweat(g, E.W * 0.6 - r * 0.78, E.H * 0.47 - r * 0.4, r, t * 0.6, 0.9);
});

// s27 — "Would you like more recommendations on how to stop bleeding?"
reg('s27', (g, t, info) => {
  frozenBg(g);
  const gt = info.globalT;
  chat(g, t, gt, { push: 1 + t / info.dur, chips: { items: ['Yes, please!', 'More tips'], show: clamp((gt - 64.05) / 0.25) } });
}, { hideBot: true });

// s28 — tiny silent reaction
reg('s28', (g, t, info) => {
  frozenBg(g, 14, 0.5);
  glow(g, E.W / 2, E.H * 0.7, 520, '#bfe9ff', 0.22);
  bigFaceDoc(g, E.W / 2, E.H * 0.47, 360, { expr: 'scared', rimColor: '#bfe9ff', rimSide: 1, look: t < 0.3 ? [0, 0.6] : [0.7, 0.1], blink: false });
});

// s29 — cut to black
reg('s29', (g) => { fillRect(g, -E.W, -E.H, E.W * 3, E.H * 3, '#000'); });
