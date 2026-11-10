// thumb.js — Reels cover (1080x1920). Key content sits inside the centre 1080x1440 so the profile-grid crop keeps it.
import { E, registerShot, glow, alpha, text, measure, rr, seg, circle, ring, poly, FONTS } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bayBg, bigFaceDoc, sweat } from '/projects/doctor-chatgpt/scenes/shots/02_bay_a.js';
import { phone, phoneHands } from '/projects/doctor-chatgpt/scenes/lib.js';
import { NURSE } from '/projects/doctor-chatgpt/scenes/cast.js';

registerShot('thumb', { draw(g) {
  const t = 0.4;
  bayBg(g, 33.0, { z: 1.55, x: 40, y: -60 }, { code: 1, monitor: { mode: 'green', hr: 160 } }, 18, 0.42);
  // split light: alarm red on the nurse's side, monitor green on the doctor's
  glow(g, 120, 980, 760, '#ff2a3a', 0.32); glow(g, 1000, 900, 760, '#2aff6a', 0.22);
  // nurse: horrified (front-view angry brows are drawn with the 'worried' brow shape)
  bigFace(g, 255, 905, 200, { outfit: NURSE, expr: 'shocked', rimColor: '#ff6a78', rimSide: -1, tilt: -0.12, look: [0.9, 0.2] });
  FX.rings(g, 255, 905, 0.3, { count: 2, r0: 215, r1: 290, a: 0.5, color: '#ff8a96' });
  // doctor: wildly overconfident grin
  bigFaceDoc(g, 770, 985, 270, { expr: 'joy', rimColor: '#7dff9a', rimSide: 1, tilt: 0.08 });
  FX.sparkle(g, 1000, 760, 46, '#ffffff', 0.9); FX.sparkle(g, 950, 700, 26, '#ffffff', 0.7);
  // the phone with the terrible advice
  const ph = phone(g, 430, 1395, 345, t, [{ from: 'user', text: 'How do I stop severe bleeding?!', show: 1 }, { from: 'bot', text: "Give him ibuprofen! You're doing amazing!", show: 1, hl: true, tag: 'Confidence: 100%' }], { tilt: -0.06, fs: 0.082, glow: 1.4 });
  phoneHands(g, ph, '#bfe9ff');
  // one fat red arrow at the bot's answer
  const ax0 = [985, 1745], ax1 = [668, 1598], ang = Math.atan2(ax1[1] - ax0[1], ax1[0] - ax0[0]);
  const head = (c, w) => { seg(g, [ax0, [ax1[0] - Math.cos(ang) * 40, ax1[1] - Math.sin(ang) * 40]], w, c); poly(g, [ax1, [ax1[0] - Math.cos(ang - 0.55) * (60 + w), ax1[1] - Math.sin(ang - 0.55) * (60 + w)], [ax1[0] - Math.cos(ang + 0.55) * (60 + w), ax1[1] - Math.sin(ang + 0.55) * (60 + w)]], c); };
  head('#05070d', 34); head('#ff2236', 22);
  // headline
  const H = (str, y, size, color, glowC) => { const s = Math.min(size, (E.W * 0.92) / (measure(g, str, size) / size)); text(g, str, E.W / 2, y, { size: s, color, stroke: s * 0.17, strokeColor: '#05070d', glow: glowC ? 34 : 0, glowColor: glowC || '#000', spacing: 2 }); };
  H('DOCTOR,', 330, 128, '#ffffff');
  H('ARE YOU USING', 455, 104, '#ffffff');
  rr(g, 70, 515, 940, 180, 30); g.fillStyle = '#ffd23f'; g.fill();
  text(g, 'CHATGPT?!', E.W / 2, 610, { size: 158, color: '#0b0d16', spacing: 3 });
  // discreet satire tag (inside the grid-safe area)
  const tag = 'FICTIONAL SATIRE', ts = 30, tw = measure(g, tag, ts, FONTS.ui, 900) + 50;
  rr(g, E.W / 2 - tw / 2, 173, tw, 54, 27); g.fillStyle = 'rgba(8,10,18,.75)'; g.fill(); g.strokeStyle = 'rgba(255,212,126,.6)'; g.lineWidth = 2; g.stroke();
  text(g, tag, E.W / 2, 201, { size: ts, color: '#ffd47e', font: FONTS.ui, weight: 900, spacing: 3 });
} });
