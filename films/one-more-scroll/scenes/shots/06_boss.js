// shots/06_boss.js — SCENE 06: the boss. Shot / reverse shot: the boss gets lower and closer each time, Jeff stays flat.
// Signature beat: the desk SLAM freezes time — papers, pens and coffee hang in the air while only Jeff blinks.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, shake, alpha, shade, mix, seg, circle, ring, rr, poly, linGrad, radGrad, glow, text, FONTS } from '/engine/core.js';
import { drawFigure, bigFace, POSES, blendPose, breathe, walkPose, posesAt, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bossOffice, bossDesk, BOSSO } from '../sets/office.js';
import { P, mouth, blinkAt, gT } from '../_kit.js';
import { focus } from './02_scroll.js';
import { jeff, BOSS, BOSS_S } from '../cast.js';

const J = jeff(0.75), D = 0.6, BS = 1.5 * BOSS_S, JS = 1.5, BX = 1330, JX = 640;
const RIMB = '#f4f6ff', RIMJ = '#dfe6f0';
const bossSeat = BOSSO.GY + 6;
// boss behind the desk (desk drawn after him so it hides his legs), Jeff standing in front
function room(g, t, cam, o = {}) {
  const G = o.G ?? 0;
  bossOffice(g, t, cam, { heat: o.heat || 0, fall: o.fall || 0 });
  layer(g, cam, D, (g) => {
    if (o.door != null) { g.fillStyle = '#1a1612'; g.fillRect(150, BOSSO.GY - 500, 240, 500); g.fillStyle = '#e8eef4'; g.fillRect(162, BOSSO.GY - 488, 216 * o.door, 488); glow(g, 270, BOSSO.GY - 250, 400, '#e8eef4', 0.25 * o.door); g.fillStyle = '#5a4a3a'; g.fillRect(162 + 216 * o.door, BOSSO.GY - 488, 216 * (1 - o.door), 488); }
    const bp = o.bossPose || posesAt(t, [[0, P.sitBoss]], 0.3);
    drawFigure(g, { x: BX, y: o.bossStand ? BOSSO.GY : bossSeat, s: BS, facing: -1, outfit: BOSS, pose: breathe(bp, t, o.bossBreath ?? 1.4, 2), expr: o.bossExpr || 'angry', talk: mouth('BOSS', G), face: { browW: 1.8, ...(o.bossFace || {}) }, rim: { color: RIMB, dir: [0.7, -0.7], w: 4.5 }, blink: blinkAt(t, 3.1) });
    if (o.jeff !== false) drawFigure(g, { x: o.jx ?? JX, y: BOSSO.GY, s: JS, facing: o.jFacing ?? 1, outfit: J, pose: o.jPose || breathe(P.slouchStand, t, 0.5), expr: o.jExpr || 'deadpan', talk: mouth('JEFF', G), face: { lid: 0.72, bags: 1 }, rim: { color: RIMJ, dir: [0.7, -0.6], w: 4 }, blink: o.jBlink ?? blinkAt(t, 2.6, 1) });
  });
  bossDesk(g, cam, { jump: o.jump || 0 });
}

// ---------- s43: wide — the door opens, Jeff enters ----------
registerShot('s43', { draw(g, t, info) {
  const cam = { z: lerp(1.1, 1.16, t / info.dur), x: -40, y: 20 };
  const door = ease.inOut(prog(t, 0.2, 0.8)), x = lerp(270, JX, ease.out(prog(t, 0.7, 3.0)));
  room(g, t, cam, { door, jx: x, jPose: t > 0.7 && t < 3.0 ? walkPose(t * 2 * Math.PI * 0.75, { stride: 16, lift: 5, lean: 10, arm: 6 }) : P.slouchStand, bossExpr: 'angry', bossPose: P.sitBoss });
  FX.dust(g, t, { count: 30, color: '#fff4e6', a: 0.3 });
} });
// ---------- s44: boss medium, low angle — "Jeff! Do you have any idea…" ----------
registerShot('s44', { draw(g, t, info) {
  const G = gT('s44', t), cam = { ...focus(BX - 40, 560, lerp(2.0, 2.15, t / info.dur), D), r: -0.015 };
  room(g, t, cam, { G, jeff: false, bossPose: posesAt(t, [[0, P.sitBoss], [0.3, POSES.point], [1.6, POSES.explain]], 0.25), bossExpr: 'angry' });
} });
// ---------- s45: Jeff, flat, barely reacts ----------
const jeffMed = (id, o = {}) => registerShot(id, { draw(g, t, info) {
  const G = gT(id, t), cam = focus(JX + 40, 600, lerp(2.3, 2.38, t / info.dur), D);
  room(g, t, cam, { G, jExpr: o.expr || 'deadpan', bossPose: P.sitBoss, heat: o.heat || 0 });
} });
jeffMed('s45');
// ---------- s46: boss medium-close, big gestures — "terrible… looking like you're dead!" ----------
registerShot('s46', { draw(g, t, info) {
  const G = gT('s46', t), cam = { ...focus(BX - 20, 520, lerp(2.6, 2.8, t / info.dur), D), r: -0.02 };
  room(g, t, cam, { G, jeff: false, bossPose: posesAt(t, [[0, P.sitBoss], [0.4, POSES.explain], [2.0, P.armsWide], [3.6, POSES.point], [5.0, POSES.shrug]], 0.3), bossExpr: t > 3.4 ? 'furious' : 'angry', heat: 0.2 });
} });
// ---------- close-ups: giant faces against the blurred office ----------
function bossClose(g, t, G, o = {}) {
  blurLayer(g, o.blur ?? 7, (g) => bossOffice(g, t, focus(o.bgX ?? 700, 420, 1.7, D), { fall: o.fall || 0, heat: o.heat || 0 }));
  veil(g, '#1a1010', 0.25);
  const r = o.r || 330, [sx, sy] = o.shake ? shake(t, o.shake, 18) : [0, 0];
  bigFace(g, (o.cx ?? E.W * 0.66) + sx, (o.cy ?? E.H * 0.6) + sy, r, { outfit: BOSS, expr: o.expr || 'angry', talk: mouth('BOSS', G), tilt: o.tilt || 0, rimColor: RIMB, rimSide: 1, headColor: o.red ? mix('#0e0b12', '#5a0e12', o.red) : undefined, face: { browW: 1.9, ...(o.face || {}) }, blink: blinkAt(t, 3.3) });
  // heavy eyebrows (the boss's acting tool) over the bigFace
}
function jeffClose(g, t, G, o = {}) {
  blurLayer(g, 8, (g) => bossOffice(g, t, focus(1400, 400, 1.9, D), { heat: o.heat || 0 }));
  veil(g, '#101018', 0.3);
  const r = 300;
  bigFace(g, E.W * 0.34, E.H * 0.6, r, { outfit: J, expr: 'deadpan', talk: mouth('JEFF', G), rimColor: RIMJ, rimSide: -1, face: { lid: 0.62, bags: 1, mouth: 'flat' }, look: [0.6, 0], blink: blinkAt(t, 2.4, 0.3) });
}
// ---------- s47: boss close; the sales chart falls behind him — "The sales are going down…" ----------
registerShot('s47', { draw(g, t, info) {
  const G = gT('s47', t), fall = ease.inOut(prog(t, 0.6, 2.4));
  bossClose(g, t, G, { fall, blur: 3, bgX: 520, cx: E.W * 0.7, r: 320 + t * 6, expr: t > 4.0 ? 'furious' : 'angry', heat: 0.25 });
} });
// ---------- s48: "Whatever, boss…" ----------
registerShot('s48', { draw(g, t, info) { jeffClose(g, t, gT('s48', t), { heat: 0.2 }); } });
// ---------- s49: the boss boils ----------
registerShot('s49', { draw(g, t, info) {
  const G = gT('s49', t), k = ease.in(clamp(t / info.dur));
  bossClose(g, t, G, { r: 330 + k * 120, cx: E.W * 0.6, cy: E.H * 0.62, red: k, shake: 3 + k * 8, expr: 'furious', heat: 0.3 + k * 0.4, face: { mouth: 'flat' } });
  if (k > 0.3) for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; g.fillStyle = alpha('#d8d8e0', 0.5 * (1 - ph)); g.beginPath(); g.ellipse(E.W * 0.6 + (i - 1) * 220, E.H * 0.2 - ph * 140, 40 + ph * 40, 24 + ph * 20, 0, 0, Math.PI * 2); g.fill(); }
} });
// ---------- s50: SLAM — time freezes ----------
registerShot('s50', { draw(g, t, info) {
  const hit = 0.12, fz0 = 0.32, fz1 = 1.9, frozen = t > fz0 && t < fz1;
  const tw = t < fz0 ? t : t < fz1 ? fz0 : fz0 + (t - fz1);   // world time stops while frozen
  const jump = tw < hit ? 0 : Math.max(0, Math.sin(clamp((tw - hit) / 0.6) * Math.PI)) * 1.0;
  const [sx, sy] = t > hit && t < fz0 + 0.1 ? shake(t, 14, 30) : t > fz1 ? shake(t, 6 * (1 - prog(t, fz1, fz1 + 0.4)), 30) : [0, 0];
  const cam = { ...focus(1040 + sx, 560 + sy, frozen ? lerp(1.55, 1.68, prog(t, fz0, fz1)) : 1.55, D), r: frozen ? lerp(0, 0.025, prog(t, fz0, fz1)) : 0 };
  room(g, t, cam, { bossStand: true, bossPose: tw < hit ? blendPose(P.sitBoss, P.slam, tw / hit) : P.slam, bossExpr: 'shout', bossBreath: frozen ? 0 : 1.4, jump, heat: 0.45, jExpr: 'deadpan', jBlink: frozen && t > 1.0 && t < 1.22 });
  if (frozen) {
    veil(g, '#7fb8ff', 0.16, 'multiply'); veil(g, '#4a6aa0', 0.08, 'lighter');
    layer(g, cam, D, (g) => { FX.drops(g, t, { area: [BOSSO.deskX - 120, BOSSO.deskTop - 260, 240, 200], count: 26, rMin: 3, rMax: 11, color: '#b8865a', drift: 2 }); FX.rings(g, BOSSO.deskX - 120, BOSSO.deskTop, t - fz0, { count: 3, r0: 30, r1: 260, color: '#cfe0ff', a: 0.4, speed: 0.6, w: 3 }); });
    text(g, 'FREEZE', E.W - 120, 210, { size: 30, font: FONTS.ui, weight: 900, color: alpha('#cfe0ff', 0.6), align: 'right', spacing: 8 });
  }
  if (t > hit && t < hit + 0.25) { const k = (t - hit) / 0.25; layer(g, cam, D, (g) => FX.rings(g, BX - 120, BOSSO.deskTop, k * 0.6, { count: 2, r0: 20, r1: 340, color: '#ffffff', a: 0.8 * (1 - k), speed: 1, w: 8 })); FX.speedLines(g, t, { cx: E.W * 0.6, cy: E.H * 0.6, count: 50, a: 0.4 * (1 - k) }); }
} });
// ---------- s51: boss extreme close-up — "ARE YOU EVEN LISTENING TO ME, JEFF?!" ----------
registerShot('s51', { draw(g, t, info) {
  const G = gT('s51', t);
  bossClose(g, t, G, { r: 520 + t * 10, cx: E.W * 0.55, cy: E.H * 0.72, tilt: -0.05 + Math.sin(t * 2) * 0.02, red: 0.75, shake: 5, expr: 'shout', heat: 0.6, blur: 10 });
} });
// ---------- s52: "Yeah… whatever, boss." (same framing as s48 — the deadpan) ----------
registerShot('s52', { draw(g, t, info) { jeffClose(g, t, gT('s52', t), { heat: 0.4 }); } });
// ---------- s53: the boss stands and points — "GET OUT!" ----------
registerShot('s53', { draw(g, t, info) {
  const G = gT('s53', t), up = ease.out(prog(t, 0, 0.3)), cam = { ...focus(BX - 160, 470, 1.9, D), r: 0.02 };
  room(g, t, cam, { G, bossStand: up > 0.5, bossPose: blendPose(P.sitBoss, P.pointDoor, up), bossExpr: 'shout', heat: 0.5, jeff: false });
} });
// ---------- s54: Jeff turns and shuffles out; the boss fumes; the door clicks ----------
registerShot('s54', { draw(g, t, info) {
  const cam = { z: 1.12, x: -40, y: 20 }, x = lerp(JX, 250, ease.inOut(prog(t, 0.3, 2.2))), door = 1 - ease.inOut(prog(t, 2.0, 2.4));
  room(g, t, cam, { door: t > 0.2 ? door : 0, jx: x, jeff: t < 2.15, jFacing: -1, jPose: t > 0.3 && t < 2.2 ? walkPose(t * 2 * Math.PI * 0.75, { stride: 16, lift: 5, lean: 10, arm: 6 }) : P.slouchStand, bossStand: true, bossPose: posesAt(t, [[0, P.pointDoor], [0.8, P.armsWide], [1.8, POSES.crossArms]], 0.4), bossExpr: 'furious', heat: 0.35 });

} });
