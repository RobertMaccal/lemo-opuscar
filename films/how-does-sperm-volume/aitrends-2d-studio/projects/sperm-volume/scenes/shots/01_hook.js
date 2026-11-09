// 01_hook.js — s001–s006: the ad, the twist, the 2-5% cylinder, title, "find the factories".
import { E, V, S, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, wordTime, glow, alpha, text, FONTS, seg, circle } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bedroom } from '../sets/rooms.js';
import { C, cylinder, adScreen, label } from '../sets/_kit.js';
import { MAX } from '../cast.js';
const wt = (w, info, d = 0) => (wordTime(w, info.shot.start) ?? info.shot.start + d) - info.shot.start;
const sitPhone = { ...POSES.sit, eF: [26, -128], hF: [40, -150], eB: [14, -128], hB: [36, -146] };

// s001 — "Every ad online promises more sperm volume."  Max on the bed, push into the phone ad
registerShot('s001', { draw(g, t, info) {
  const k = ease.inOut(prog(t, 1.0, 2.4));
  const cam = { z: lerp(1.0, 2.4, k), x: lerp(0, 40, k), y: lerp(0, 110, k) };
  const { GY, M } = bedroom(g, t, cam);
  layer(g, cam, 1, (g) => {
    const x = E.W / 2 - 40;
    drawFigure(g, { x, y: GY, s: 2.1, facing: 1, outfit: MAX, pose: breathe(sitPhone, t), expr: t > 1.2 ? 'awe' : 'neutral', look: [0.6, -0.2], prop: { type: 'phone', glow: '#ffd36b' }, rim: { color: M.rim, dir: [0.4, -1] } });
    glow(g, x + 80, GY - 310, 180, '#ffb35a', 0.4);
  });
  // the phone screen takes over the frame
  const a = ease.out(prog(t, 2.0, 2.8));
  if (a > 0) { g.save(); g.globalAlpha *= a; const w = 760, h = 1240, x = (E.W - w) / 2, y = 250 + (1 - a) * 120; adScreen(g, x, y, w, h, t); g.restore(); }
  FX.dust(g, t, { count: 30, color: '#c9d4ff', a: 0.3 });
} });

// s002 — "Here's the twist..."  the ad glitches and freezes
registerShot('s002', { draw(g, t, info) {
  blurLayer(g, 14, (g) => bedroom(g, t, { z: 1.6, y: -200 })); veil(g, '#05060c', 0.5);
  const gl = ease.in(prog(t, 0.2, info.dur));
  const [sx, sy] = shake(t, 6 * gl, 9);
  g.save(); g.translate(sx, sy); const z = 1 + 0.06 * t; g.translate(E.W / 2, E.H * 0.45); g.scale(z, z); g.translate(-E.W / 2, -E.H * 0.45);
  adScreen(g, (E.W - 760) / 2, 250, 760, 1240, t * (1 - gl * 0.95), { glitch: gl }); g.restore();
  veil(g, '#4060ff', 0.12 * gl, 'soft-light');
} });

// s003 — "it's barely sperm."  giant face, surprised
registerShot('s003', { draw(g, t, info) {
  blurLayer(g, 14, (g) => bedroom(g, t, { z: 1.7, x: -80, y: -260 })); veil(g, '#05060c', 0.35);
  const M = mood('night'), r = 330 * (1 + 0.04 * t), tb = wt('barely', info, 0.3);
  bigFace(g, E.W / 2, E.H * 0.5, r, { outfit: MAX, expr: t < tb ? 'surprised' : 'shocked', look: [0, -0.1], rimColor: M.rim, rimSide: 1, blink: (t % 2.7) > 2.6 });
  FX.rings(g, E.W / 2, E.H * 0.5, t, { count: 2, r0: r * 1.05, r1: r * 1.5, color: '#fff3e0', a: 0.25 * prog(t, tb, tb + 0.2) });
} });

// s004 — "Sperm make up only about two to five percent of the total."  the cylinder: a cream sliver + a big "?"
registerShot('s004', { draw(g, t, info) {
  UI.blueprint(g); const cx = E.W / 2, yb = 1380, w = 360, h = 980;
  const cam = 1 + 0.04 * t; g.save(); g.translate(cx, E.H * 0.5); g.scale(cam, cam); g.translate(-cx, -E.H * 0.5);
  const tS = wt('sperm', info, 0.1), tN = wt('two', info, 1.2), tT = wt('total', info, 2.6);
  const fill = ease.out(prog(t, tS, tS + 0.8));
  cylinder(g, cx, yb, w, h, { sperm: fill }, { t, a: ease.out(prog(t, 0, 0.4)) });
  // dashed "everything else" outline
  const qa = ease.out(prog(t, tT - 0.3, tT + 0.3));
  if (qa > 0) { g.save(); g.setLineDash([16, 14]); g.strokeStyle = alpha(C.cream, 0.5 * qa); g.lineWidth = 3; g.strokeRect(cx - w / 2 + 22, yb - h + 30, w - 44, h - 110); g.restore();
    text(g, '?', cx, yb - h * 0.55, { size: 300 * (0.8 + 0.2 * ease.outBack(qa)), color: C.cream, alpha: qa, glow: 30, glowColor: alpha(C.bp, 0.8) }); }
  g.restore();
  const la = ease.outBack(prog(t, tN, tN + 0.35));
  if (la > 0) { seg(g, [[cx + w / 2 + 10, yb - 30], [cx + w / 2 + 70, yb - 120]], 3, C.gold); text(g, '2–5%', cx + w / 2 + 40, yb - 170, { size: 84 * la, color: C.gold, font: FONTS.ui, weight: 900, glow: 20, glowColor: alpha(C.gold, 0.6) }); label(g, 'SPERM', cx + w / 2 + 40, yb - 105, la, { size: 30 }); }
  label(g, 'TYPICAL: ~1.5–5 mL', cx, yb - h - 60, ease.out(prog(t, 0.3, 0.8)), { size: 32, color: alpha(C.bp, 1) });
} });

// s005 — title card over the night window
registerShot('s005', { draw(g, t, info) {
  const cam = { z: 1.05 - 0.04 * ease.inOut(t / info.dur), y: -30 * t };
  blurLayer(g, 8, (g) => bedroom(g, t, cam, { bed: false })); veil(g, '#070814', 0.45);
  layer(g, cam, 1, (g) => { drawFigure(g, { x: E.W / 2, y: E.H * 0.68, s: 1.4, facing: 1, outfit: MAX, pose: breathe(POSES.stand, t), expr: 'thinking', look: [0.3, -0.8], rim: { color: '#a9b8ff', dir: [0, -1] } }); });
  FX.dust(g, t, { count: 40, color: '#c9d4ff', a: 0.35 });
  UI.titleCard(g, t, { lines: ['HOW DOES', 'SPERM VOLUME', 'ACTUALLY INCREASE?'], dur: info.dur, y: E.H * 0.3 });
} });

// s006 — "First, find the factories."  flashlight click, beam becomes a scan line
registerShot('s006', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.08 * ease.inOut(t / info.dur), x: -40 };
  const { GY, M } = bedroom(g, t, cam); const tf = wt('find', info, 0.3), tF = wt('factories', info, 0.9);
  layer(g, cam, 1, (g) => { drawFigure(g, { x: E.W / 2 - 120, y: GY, s: 1.8, facing: 1, outfit: MAX, pose: breathe(posesAt(t, [[0, POSES.stand], [tf - 0.2, POSES.point]]), t), expr: t > tf ? 'determined' : 'thinking', prop: t > tf ? { type: 'flashlight' } : null, rim: { color: M.rim, dir: [0.3, -1] } }); });
  if (t > tf) FX.lightCone(g, E.W / 2 + 20, GY - 300, { angle: -0.15, spread: 0.35, len: 900, color: '#fff0c8', a: 0.25 });
  // scan line sweeping down after "factories"
  const sp = ease.inOut(prog(t, tF, info.dur + 0.1));
  if (sp > 0) { const y = lerp(-40, E.H + 40, sp); g.save(); g.beginPath(); g.rect(0, 0, E.W, y); g.clip(); UI.blueprint(g); g.restore(); seg(g, [[0, y], [E.W, y]], 6, C.bp); glow(g, E.W / 2, y, 500, C.bp, 0.35); }
  FX.dust(g, t, { count: 30, color: '#c9d4ff', a: 0.3 });
} });
