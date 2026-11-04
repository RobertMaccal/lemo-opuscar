// Pixel characters and creatures, drawn pixel by pixel; one frame per pose (poses are data), packed into atlases.
// Sprites stay flat and stepped; the scenes light them and move the camera smoothly.
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

const R = (cols, dz = .22) => ramp(cols, dz);
const INK = hex('#1c1216');
const C = {
  skin: R(['#a8674e', '#d39373', '#efbf9b', '#ffdcc0']),
  hair: R(['#120c10', '#21171c', '#33252a', '#4a3a3c']),
  straw: R(['#7a5426', '#b88a42', '#ddb868', '#f4dc9a']),
  band: R(['#3a1e14', '#5e3020']),
  verm: R(['#6e1a10', '#a8281a', '#d8422a', '#f2683e', '#ff9468']),   // the hero's one saturated colour
  navy: R(['#121426', '#1f2440', '#30395e', '#46517e']),
  sock: R(['#a9a9b4', '#d8d8e0', '#f4f4f8']),
  shoe: R(['#262630', '#55555f', '#9a9aa6', '#d6d6de']),
  cage: R(['#1b4a26', '#2f7a3a', '#4fae4e', '#8ee07a']),
  pole: R(['#5a4420', '#8f7034', '#c4a456', '#e6cc80']),
  mesh: R(['#b8c2c8', '#e6eef2', '#ffffff']),
  paper: R(['#b8b0a0', '#e2dccc', '#fbf7ec']),
  chair: R(['#1c1a20', '#34303a', '#4e4856']),
  glass: R(['#7a7a90', '#b8b8cc']),
};

// —— generic atlas ——
export function atlas(FW, FH, table, draw, o = {}) {
  const names = Object.keys(table), n = names.length;
  const P = new PX(FW * n, FH), E = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH), e1 = new PX(FW, FH);
    draw(p1, e1, table[k]); if (o.outline !== false) p1.outline(o.k ?? .3, o.tint);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c, c[3]); const e = e1.get(x, y); if (e) E.set(i * FW + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done());
  for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return { tex, em, names, n, FW, FH, canvas: P.c };
}
// Sprite object: lit billboard + ground contact shadow
export function sprite(A, spx, o = {}) {
  const mesh = billboard(A.tex, A.FW * spx, A.FH * spx, { em: A.em, emCol: o.emCol ?? '#ffffff', emI: o.emI ?? 1.6, shadow: o.shadow ?? true });
  if (o.cap !== false) {   // cap the light a sprite receives so a lamp next to it can't burn out the pixels
    mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight = min(outgoingLight, diffuseColor.rgb * ${(o.capK ?? 1.45).toFixed(2)} + totalEmissiveRadiance);\n#include <opaque_fragment>`); };
    mesh.material.customProgramCacheKey = () => 'cap' + (o.capK ?? 1.45);
  }
  const root = new THREE.Group(); root.add(mesh); root.userData.char = o.name || 'sprite';
  let sh = null; if (o.blob !== false) { sh = blob(o.blobR ?? A.FW * spx * .3, o.blobA ?? .45); sh.position.y = .012; root.add(sh); }
  return {
    root, mesh, A, blob: sh, spx,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error('frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
    // a pixel of the frame (x right, y down) → world position (depends on root position, rotation, flip)
    at(px, py, flip = false, dz = .02) { const v = new THREE.Vector3((px - A.FW / 2) * spx * (flip ? -1 : 1), (A.FH - py) * spx, dz); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y); return v.multiply(root.scale).add(root.position); },
  };
}

// ======================= Young Satoshi (≈9) =======================
// 40×60 frame, faces right (3/4). p: {step 0..3|null, bob, pose:'stand'|'kneel'|'write'|'sit', net:'up'|'hold'|'down'|'swing'|'none', look:-1..1 (head up), mood:'happy'|'calm'|'sad'|'smile', blink, pen}
export const BOY_W = 40, BOY_H = 60;
function drawBoy(P, E, p) {
  const crouch = p.pose === 'kneel' ? 12 : p.pose === 'write' ? 11 : 0, by = (p.bob || 0) + crouch;
  const look = p.look || 0;
  // —— Net: drawn first (behind) for hold/up; 'down' and 'swing' in front ——
  const net = p.net ?? 'hold';
  const hand = p.pose === 'write' ? [24, 44] : p.pose === 'kneel' ? [25, 40 + 0] : [26, 38 + (p.bob || 0)];
  function pole(x0, y0, x1, y1) { P.line(x0, y0, x1, y1, C.pole(.65, 0, 0)); P.line(x0 + 1, y0, x1 + 1, y1, C.pole(.3, 0, 0)); }
  function hoop(cx, cy, rx, ry) {
    for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; P.set(Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), C.mesh(.25, 0, 0)); }
    for (let y = Math.floor(cy - ry + 1); y < cy + ry; y++) for (let x = Math.floor(cx - rx + 1); x < cx + rx; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy < .8 && (x + y) % 2 === 0) P.set(x, y, C.mesh(.75, 0, 0), 255); }
    // net bag hangs below the hoop
    for (let k = 0; k < 6; k++) for (let x = Math.floor(cx - rx + 2 + k * .6); x < cx + rx - 2 - k * .6; x++) if ((x + k) % 2 === 0) P.set(x, Math.round(cy + ry + k), C.mesh(.6, 0, 0));
  }
  if (net === 'hold' || net === 'up') {
    const tip = net === 'up' ? [33, 6] : [31, 9];
    pole(hand[0], hand[1] - crouch * 0, tip[0], tip[1]); hoop(tip[0] + 1, tip[1] - 4, 5, 3.5);
  }
  // —— Legs ——
  if (p.pose === 'stand' || !p.pose) {
    const st = p.step ?? -1;
    const L = st < 0 ? [[16, 0, 0], [21, 0, 1]] : [[[13, 0, 0], [23, -1, 1]], [[17, -1, 0], [20, 0, 1]], [[23, -1, 0], [13, 0, 1]], [[20, 0, 0], [17, -1, 1]]][st];
    L.forEach(([lx, ly, front]) => {
      const sh = front ? .62 : .4;
      for (let y = 47; y < 55 + ly; y++) for (let x = lx; x < lx + 3; x++) P.set(x, y, C.skin(sh - (x === lx ? .2 : 0), x, y));
      for (let y = 53 + ly; y < 56 + ly; y++) for (let x = lx; x < lx + 3; x++) P.set(x, y, C.sock(.6 - (x === lx ? .2 : 0), x, y));
      P.rect(lx, 56 + ly, 5, 2, C.shoe(front ? .85 : .6, 0, 0)); P.rect(lx, 58 + ly, 5, 1, C.shoe(.1, 0, 0));
    });
  } else if (p.pose === 'kneel') {
    // squatting: knees up front, feet under
    P.rect(13, 54, 6, 3, C.skin(.4, 0, 0)); P.rect(19, 51, 6, 3, C.skin(.62, 0, 0)); P.rect(23, 54, 3, 3, C.skin(.55, 0, 0));
    P.rect(12, 57, 6, 2, C.shoe(.6, 0, 0)); P.rect(22, 57, 6, 2, C.shoe(.85, 0, 0)); P.rect(12, 59, 16, 1, C.shoe(.1, 0, 0));
  } else if (p.pose === 'write') {
    // sitting cross-legged on a rock, knees forward
    P.rect(12, 55, 16, 3, C.skin(.5, 0, 0)); P.rect(12, 55, 16, 1, C.skin(.7, 0, 0));
    P.rect(25, 56, 5, 3, C.shoe(.85, 0, 0)); P.rect(9, 56, 4, 3, C.shoe(.55, 0, 0));
  }
  // —— Shorts ——
  const sTop = 40 + by, sBot = p.pose === 'stand' || !p.pose ? 47 + (p.bob || 0) : 55;
  P.poly([[14, sTop], [25, sTop], [26, sBot], [14, sBot]], (x, y) => C.navy(.62 - (x - 14) * .03 + (y === sTop ? .2 : 0), x, y));
  if (!p.pose || p.pose === 'stand') P.rect(19, sBot - 2, 1, 2, C.navy(.1, 0, 0));
  // —— T-shirt ——
  const top = 28 + by;
  P.poly([[14, top], [25, top], [26, top + 12], [13, top + 12]], (x, y) => { const s = (x - 13) / 13; let v = .45 + s * .35 + (y - top < 2 ? .1 : 0); if ((x + y) % 7 === 0 && y > top + 6) v -= .12; return C.verm(v, x, y); });
  P.rect(14, top + 12, 12, 1, C.verm(.15, 0, 0));
  // bug-cage strap across the chest + cage on the back hip
  for (let k = 0; k < 11; k++) P.set(23 - k, top + 1 + k, C.band(.8, 0, 0));
  const cx = 8, cy = top + 10;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) { const edge = x === 0 || x === 5 || y === 0 || y === 5; P.set(cx + x, cy + y, edge ? C.cage(.9 - y * .08, 0, 0) : (x % 2 ? C.cage(.45, 0, 0) : C.cage(.2, 0, 0))); }
  if (p.cageGlow) { E.set(cx + 2, cy + 2, [180, 255, 160]); E.set(cx + 3, cy + 3, [150, 230, 140]); P.set(cx + 2, cy + 2, [200, 255, 170]); }
  // —— Back arm (far side) ——
  P.rect(12, top + 2, 2, 7, C.skin(.35, 0, 0));
  // —— Front arm ——
  if (p.pose === 'write') {
    P.rect(22, top + 2, 3, 3, C.verm(.75, 0, 0)); P.rect(23, top + 5, 2, 5, C.skin(.6, 0, 0));
    // notebook held on the knee + pencil
    P.rect(19, 51, 9, 6, C.paper(.75, 0, 0)); P.rect(19, 51, 9, 1, C.paper(.95, 0, 0)); P.rect(19, 56, 9, 1, C.paper(.3, 0, 0));
    for (let k = 0; k < 3; k++) P.rect(20, 52 + k * 1.5 | 0, 5 + (k % 2), 1, hex('#8a8a9a'));
    const px = 24 + (p.pen || 0); P.rect(px, 47, 2, 2, C.skin(.7, 0, 0)); P.line(px + 1, 46, px + 3, 50, hex('#e8b030')); P.set(px + 3, 51, INK);
  } else if (p.pose === 'kneel') {
    P.rect(22, top + 2, 3, 3, C.verm(.75, 0, 0)); P.line(24, top + 5, 26, top + 9, C.skin(.6, 0, 0)); P.line(25, top + 5, 27, top + 9, C.skin(.45, 0, 0));
    // net lying on the ground behind him
  } else {
    P.rect(23, top + 1, 3, 3, C.verm(.75, 0, 0));   // short sleeve
    if (net === 'down') { P.line(25, top + 4, 26, top + 9, C.skin(.6, 0, 0)); P.line(26, top + 4, 27, top + 9, C.skin(.45, 0, 0)); }
    else if (net === 'none' && p.mood === 'smile') { P.rect(24, top + 4, 2, 6, C.skin(.6, 0, 0)); }
    else { P.line(25, top + 4, 26, top + 9, C.skin(.6, 0, 0)); P.line(26, top + 4, 27, top + 10, C.skin(.45, 0, 0)); }
  }
  if (net === 'down') {   // pole slants down toward the ground in front of him
    pole(26, top + 10, 37, 58); P.rect(35, 57, 5, 2, C.mesh(.5, 0, 0)); P.set(36, 56, C.mesh(.8, 0, 0)); P.set(38, 56, C.mesh(.8, 0, 0));
  }
  // —— Head ——
  const hx = 20 + (p.pose === 'kneel' ? 3 : p.pose === 'write' ? 1 : 0), hy = 22 + by - look;
  P.ellipse(hx - 1, hy, 5.5, 5.5, (x, y, dx, dy) => C.hair(.5 - dy * .2, x, y));   // back of the head: hair
  const fx = hx + 1.5, fy = hy + .8;
  P.ellipse(fx, fy, 4.6, 4.8, (x, y, dx, dy) => C.skin(.64 - dx * .08 - dy * .28 + (dx > .6 ? -.15 : 0), x, y));
  // hair at the temple, ear
  for (let y = Math.floor(fy - 3); y < fy + 2; y++) P.set(Math.floor(fx - 4), y, C.hair(.4, 0, 0));
  P.set(Math.floor(fx - 3), Math.round(fy + 1), C.skin(.4, 0, 0));
  // eyes, brows, mouth by mood
  const ey = Math.round(fy) + (p.pose === 'kneel' || p.pose === 'write' ? 1 : 0), e1 = Math.round(fx + 2), e2 = Math.round(fx - 1);
  const mood = p.mood || 'happy';
  if (p.blink) { P.set(e1, ey, C.skin(.2, 0, 0)); P.set(e2, ey, C.skin(.2, 0, 0)); }
  else if (mood === 'smile') { P.set(e1 - 1, ey, INK); P.set(e1, ey - 1, INK); P.set(e1 + 1, ey, INK); P.set(e2 - 1, ey, INK); P.set(e2, ey - 1, INK); }
  else { P.set(e1, ey, INK); P.set(e1, ey - 1, INK); P.set(e2, ey, INK); P.set(e2, ey - 1, INK); if (mood !== 'sad') P.set(e1, ey - 1, hex('#5a4450')); }
  if (mood === 'sad') { P.set(e1 - 1, ey - 3, C.hair(.5, 0, 0)); P.set(e1, ey - 2, C.hair(.5, 0, 0)); P.set(e2, ey - 2, C.hair(.5, 0, 0)); P.set(e2 + 1, ey - 3, C.hair(.5, 0, 0)); }
  const my = ey + 3;
  if (mood === 'happy' || mood === 'smile') { P.set(e1, my, hex('#8a3a30')); P.set(e1 - 1, my + 1, hex('#8a3a30')); P.set(e1 - 2, my, hex('#8a3a30')); }
  else if (mood === 'sad') { P.set(e1 - 1, my, hex('#7a3a34')); P.set(e1, my + 1, hex('#7a3a34')); }
  else P.rect(e1 - 1, my, 2, 1, hex('#8a4a40'));
  if (mood !== 'sad') { P.set(e1 + 1, ey + 2, hex('#f08a78')); P.set(e2 - 1, ey + 2, hex('#f08a78')); }
  P.set(Math.round(fx + 4.5), ey + 1, C.skin(.45, 0, 0));
  // —— Straw hat: crown + wide brim + band ——
  const hy0 = Math.round(hy - 4.5);
  P.ellipse(hx + .5, hy0 - 1.5, 4.8, 3.6, (x, y, dx, dy) => C.straw(.68 - dx * .2 - dy * .25 + ((x + y) % 3 === 0 ? -.08 : 0), x, y));
  P.rect(Math.round(hx - 4), hy0, 10, 1, C.band(.5, 0, 0));
  for (let x = Math.round(hx - 9); x <= hx + 10; x++) { const u = (x - hx) / 9.5; const yy = hy0 + 1 + (Math.abs(u) > .8 ? 1 : 0); P.set(x, yy, C.straw(.6 - u * .2, x, yy)); P.set(x, yy + 1, C.straw(.25, x, yy)); }
  if (net === 'swing') { pole(26, top + 4, 38, top - 10); hoop(37, top - 16, 3, 5); }
}
export const BOY = {
  idle0: { pose: 'stand' }, idle1: { pose: 'stand', bob: 1 }, blink: { pose: 'stand', blink: 1 },
  w0: { pose: 'stand', step: 0 }, w1: { pose: 'stand', step: 1, bob: -1 }, w2: { pose: 'stand', step: 2 }, w3: { pose: 'stand', step: 3, bob: -1 },
  up: { pose: 'stand', net: 'up', look: 1 },
  kneel: { pose: 'kneel', net: 'ground', look: 0, mood: 'happy' }, kneelB: { pose: 'kneel', net: 'ground', look: 0, mood: 'happy', blink: 1 },
  write0: { pose: 'write', net: 'none', pen: 0 }, write1: { pose: 'write', net: 'none', pen: 1 }, writeL: { pose: 'write', net: 'none', pen: 0, look: 1 },
  calm: { pose: 'stand', mood: 'calm', look: 1 }, lower: { pose: 'stand', net: 'down', mood: 'calm', look: 1 }, sad: { pose: 'stand', net: 'down', mood: 'sad', look: 1 },
  smile: { pose: 'stand', net: 'hold', mood: 'smile' }, smileUp: { pose: 'stand', net: 'hold', mood: 'smile', look: 1 }, lookUp: { pose: 'stand', net: 'hold', mood: 'happy', look: 2 },
};
export const BOY_SPX = 1 / 32;
export const makeBoy = (extra = {}) => sprite(atlas(BOY_W, BOY_H, { ...BOY, ...extra }, drawBoy), BOY_SPX, { name: 'boy', blobR: .34 });

// ======================= Seated adults (young Satoshi ≈25, the team) =======================
// 44×58 frame, seated on a chair facing right toward a desk edge at x≈34 (desk itself is 3D). p: {pal, arm:'type'|'type2'|'pen'|'pen2'|'hold'|'rest'|'up', lean, mood, look, blink, glasses, hair:'short'|'long'|'cap'}
export const SIT_W = 44, SIT_H = 58;
export const PALS = {
  satoshi: { top: 'verm', pants: R(['#1a1a22', '#2c2c38', '#40404e']), hair: 'short', glasses: 1 },
  devA: { top: R(['#16283a', '#244260', '#3a6288', '#5a86ae']), pants: R(['#20201e', '#3a3832', '#56524a']), hair: 'long' },
  devB: { top: R(['#2a3a24', '#465e3a', '#6a8656', '#93ae7a']), pants: R(['#1c1c26', '#30304a', '#484868']), hair: 'cap', glasses: 0 },
  elder: { top: R(['#3a2a20', '#5a4232', '#7a5c46', '#9a7a5e']), pants: R(['#20201e', '#3a3832', '#56524a']), hair: 'short', glasses: 1, beard: 1, hairR: R(['#8a8a90', '#b0b0b6', '#d4d4d8', '#f0f0f2']) },
  devC: { top: R(['#3e3a46', '#5e5868', '#827c8e', '#aaa4b6']), pants: R(['#1a1612', '#30281e', '#4a3e2e']), hair: 'short', glasses: 1, beard: 1 },
};
function drawSit(P, E, p) {
  const pal = PALS[p.pal || 'satoshi'], HAIR = pal.hairR || C.hair, TOP = pal.top === 'verm' ? C.verm : pal.top, lean = p.lean || 0, by = p.bob || 0;
  // chair: seat + back + leg
  P.rect(8, 40, 16, 3, C.chair(.6, 0, 0)); P.rect(8, 40, 16, 1, C.chair(.9, 0, 0)); P.rect(6, 22, 3, 21, C.chair(.45, 0, 0)); P.rect(14, 43, 2, 13, C.chair(.3, 0, 0)); P.rect(9, 55, 12, 2, C.chair(.2, 0, 0));
  // legs: thighs forward, shins down
  P.rect(12, 36 + by, 16, 5, pal.pants(.55, 0, 0)); P.rect(12, 36 + by, 16, 1, pal.pants(.85, 0, 0));
  P.rect(25, 40, 4, 14, pal.pants(.45, 0, 0)); P.rect(25, 54, 7, 3, C.shoe(.3, 0, 0)); P.rect(25, 57, 7, 1, C.shoe(.05, 0, 0));
  // torso
  const tx = 11 + lean, top = 19 + by + (lean > 1 ? 1 : 0);
  P.poly([[tx, top], [tx + 11, top], [tx + 12, 38 + by], [tx - 1, 38 + by]], (x, y) => { const s = (x - tx) / 12; let v = .4 + s * .38 + (y - top < 2 ? .12 : 0); if ((x * 3 + y) % 9 === 0) v -= .1; return TOP(v, x, y); });
  // arms forward to the desk (hands at x 30–36, y ~ 30)
  const arm = p.arm || 'rest', ax = tx + 8, ay = top + 3;
  const handAt = { type: [33, 31], type2: [34, 30], pen: [32, 30], pen2: [34, 31], hold: [31, 27], rest: [31, 31], up: [27, 16] }[arm];
  P.line(ax, ay, handAt[0] - 2, handAt[1], TOP(.75, 0, 0)); P.line(ax, ay + 1, handAt[0] - 2, handAt[1] + 1, TOP(.5, 0, 0)); P.line(ax - 1, ay + 2, handAt[0] - 3, handAt[1] + 2, TOP(.35, 0, 0));
  P.rect(handAt[0] - 1, handAt[1], 3, 2, C.skin(.62, 0, 0));
  if (arm === 'pen' || arm === 'pen2') { P.line(handAt[0] + 1, handAt[1] - 1, handAt[0] + 3, handAt[1] - 4, hex('#e8b030')); }
  if (arm === 'hold') {   // a small handheld in both hands, screen glowing green (emissive)
    P.rect(handAt[0], handAt[1] - 5, 5, 7, hex('#9a9ca2')); for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const c = [150 - y * 10, 190, 90]; P.set(handAt[0] + 1 + x, handAt[1] - 4 + y, c); E.set(handAt[0] + 1 + x, handAt[1] - 4 + y, c); }
  }
  // head
  const hx = tx + 6 + lean * .6, hy = top - 6 + (lean > 1 ? 1 : 0) - (p.look || 0);
  P.ellipse(hx - 1, hy, 5.6, 5.8, (x, y, dx, dy) => HAIR(.5 - dy * .2, x, y));
  const fx = hx + 1.6, fy = hy + 1;
  P.ellipse(fx, fy, 4.6, 5, (x, y, dx, dy) => C.skin(.62 - dx * .08 - dy * .26 + (dx > .6 ? -.15 : 0), x, y));
  // hair styles
  if (pal.hair === 'short') { for (let x = Math.floor(fx - 4); x <= fx + 3; x++) P.set(x, Math.floor(fy - 4.5), HAIR(.55, 0, 0)); for (let x = Math.floor(fx - 4); x <= fx + 1; x++) P.set(x, Math.floor(fy - 3.5), HAIR(.4, 0, 0)); }
  if (pal.hair === 'long') { for (let y = Math.floor(hy - 2); y < hy + 9; y++) { P.set(Math.floor(hx - 5), y, HAIR(.35, 0, 0)); P.set(Math.floor(hx - 4), y, HAIR(.5, 0, 0)); } for (let x = Math.floor(fx - 4); x <= fx + 3; x++) P.set(x, Math.floor(fy - 4.5), HAIR(.55, 0, 0)); }
  if (pal.hair === 'cap') { P.ellipse(hx, hy - 3.5, 5.5, 3, (x, y) => pal.top(.55, x, y)); P.rect(Math.round(hx + 2), Math.round(hy - 2), 6, 1, pal.top(.3, 0, 0)); }
  P.set(Math.floor(fx - 3), Math.round(fy + 1), C.skin(.4, 0, 0));
  const ey = Math.round(fy), e1 = Math.round(fx + 2), e2 = Math.round(fx - 1), mood = p.mood || 'calm';
  if (p.blink) { P.set(e1, ey, C.skin(.2, 0, 0)); P.set(e2, ey, C.skin(.2, 0, 0)); }
  else if (mood === 'wow') { P.rect(e1, ey - 1, 1, 2, INK); P.rect(e2, ey - 1, 1, 2, INK); P.set(e1 + 1, ey - 1, hex('#ffffff')); P.set(e1, ey - 3, HAIR(.5, 0, 0)); P.set(e2, ey - 3, HAIR(.5, 0, 0)); }
  else if (mood === 'smile') { P.set(e1 - 1, ey, INK); P.set(e1, ey - 1, INK); P.set(e1 + 1, ey, INK); P.set(e2, ey - 1, INK); P.set(e2 - 1, ey, INK); }
  else { P.set(e1, ey, INK); P.set(e1, ey - 1, INK); P.set(e2, ey, INK); P.set(e2, ey - 1, INK); }
  if (pal.glasses) { P.rect(e1 - 1, ey - 2, 3, 1, C.glass(.3, 0, 0)); P.rect(e2 - 1, ey - 2, 3, 1, C.glass(.3, 0, 0)); P.set(e1 - 1, ey + 1, C.glass(.3, 0, 0)); P.set(e1 + 1, ey + 1, C.glass(.3, 0, 0)); P.set(e2 + 1, ey - 1, C.glass(.6, 0, 0)); }
  const my = ey + 3;
  if (mood === 'wow') { P.rect(e1 - 1, my, 2, 2, hex('#6a2a28')); }
  else if (mood === 'smile') { P.set(e1, my, hex('#8a3a30')); P.set(e1 - 1, my + 1, hex('#8a3a30')); P.set(e1 - 2, my, hex('#8a3a30')); }
  else P.rect(e1 - 1, my, 2, 1, hex('#8a4a40'));
  if (pal.beard) for (let x = Math.floor(fx - 2); x <= fx + 3; x++) { P.set(x, Math.round(fy + 4), HAIR(.35, 0, 0)); if (x % 2) P.set(x, Math.round(fy + 3), HAIR(.45, 0, 0)); }
  P.set(Math.round(fx + 4.5), ey + 1, C.skin(.45, 0, 0));
  if (arm === 'up') { P.line(tx + 2, top + 2, tx - 2, top - 8, TOP(.6, 0, 0)); P.rect(tx - 3, top - 10, 2, 2, C.skin(.6, 0, 0)); }
}
export const SIT = {
  sit0: {}, sit1: { bob: 1 }, blink: { blink: 1 },
  lean: { lean: 2, arm: 'rest' }, lean1: { lean: 2, arm: 'rest', bob: 1 },
  wow: { mood: 'wow', look: 1, arm: 'rest' }, wowL: { mood: 'wow', look: 1, arm: 'rest', bob: 1 }, smile: { mood: 'smile', look: 1, arm: 'rest' },
  type0: { arm: 'type', lean: 1 }, type1: { arm: 'type2', lean: 1 },
  pen0: { arm: 'pen', lean: 2 }, pen1: { arm: 'pen2', lean: 2 },
  hold0: { arm: 'hold', lean: 1 }, hold1: { arm: 'hold', lean: 1, bob: 1 },
  stretch: { arm: 'up', mood: 'smile', look: 1 },
};
export const SIT_SPX = 1 / 34;
export function makeSitter(pal, extra = {}) {
  const T = {}; for (const [k, v] of Object.entries({ ...SIT, ...extra })) T[k] = { ...v, pal };
  return sprite(atlas(SIT_W, SIT_H, T, drawSit), SIT_SPX, { name: pal, blobR: .5, blobA: .35 });
}

// ======================= Fantasy-world kids (tiny adventurers) =======================
const KID_PAL = [
  { top: R(['#123a5a', '#1e5a86', '#3a86b4', '#6ab0d8']), hat: R(['#7a1a2a', '#b02a3a', '#d8506a']), hair: C.hair },
  { top: R(['#4a3a10', '#7a6420', '#b09038', '#dcc060']), hat: null, hair: R(['#3a2010', '#6a3a1e', '#9a5a30']) },
  { top: R(['#2a4a1e', '#3e6e2a', '#5e9a3e', '#8ac45a']), hat: R(['#2a2a46', '#40407a', '#6060a8']), hair: C.hair },
];
function drawKid(P, E, p) {
  const k = KID_PAL[p.kid || 0], by = p.bob || 0, st = p.step ?? -1;
  const L = st < 0 ? [[10, 0], [14, 0]] : [[[8, 0], [16, -1]], [[11, -1], [13, 0]], [[16, -1], [8, 0]], [[13, 0], [11, -1]]][st];
  L.forEach(([lx, ly], i) => { P.rect(lx, 30 + ly, 3, 5, C.navy(i ? .6 : .35, 0, 0)); P.rect(lx, 35 + ly, 4, 2, C.shoe(.4, 0, 0)); });
  P.poly([[8, 19 + by], [17, 19 + by], [18, 30 + by], [7, 30 + by]], (x, y) => k.top(.4 + (x - 7) / 11 * .4, x, y));
  P.ellipse(13, 13 + by, 5, 5, (x, y, dx, dy) => k.hair(.5 - dy * .2, x, y));
  P.ellipse(14.5, 14 + by, 3.8, 4, (x, y, dx, dy) => C.skin(.62 - dy * .25, x, y));
  P.set(16, 14 + by, INK); P.set(16, 13 + by, INK); P.set(13, 14 + by, INK); P.set(13, 13 + by, INK);
  if (k.hat) { P.ellipse(13, 9 + by, 5.5, 2.6, (x, y) => k.hat(.6, x, y)); P.rect(15, 10 + by, 5, 1, k.hat(.25, 0, 0)); }
  if (p.hold) { P.rect(17, 22 + by, 4, 6, hex('#9a9ca2')); P.rect(18, 23 + by, 2, 2, [150, 200, 100]); E.set(18, 23 + by, [150, 200, 100]); E.set(19, 23 + by, [150, 200, 100]); }
  else P.rect(17, 22 + by, 2, 5, C.skin(.55, 0, 0));
}
export function makeKid(kid, hold = false) {
  const T = {}; for (const [n, v] of Object.entries({ i0: {}, i1: { bob: 1 }, w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 } })) T[n] = { ...v, kid, hold };
  return sprite(atlas(26, 38, T, drawKid), 1 / 30, { name: 'kid' + kid, blobR: .3 });
}

// ======================= Insects & creatures =======================
// Rhinoceros-type beetle seen from the high 3/4 (head right). p: {open 0..2 (wings), leg 0/1, dew}
function drawBeetle(P, E, p) {
  const B = R(['#1a0e0a', '#33190f', '#552a16', '#7c4422', '#b07040']), L = R(['#100806', '#2a160e']);
  const W = R(['#7a6a50', '#c8b890', '#f0e6c8']);
  const leg = p.leg || 0;
  // legs
  for (const [x, dy] of [[9, 0], [13, 1], [17, 0]]) { P.line(x, 13, x - 2 + leg, 16, L(.5, 0, 0)); P.line(x, 9, x - 2 - leg, 6, L(.5, 0, 0)); }
  const o = p.open || 0;
  if (o > 0) {   // membrane wings unfolding behind the shell
    const spread = o === 1 ? 4 : 8;
    P.poly([[12, 10], [2, 10 - spread], [0, 12 - spread], [10, 12]], (x, y) => W(.55 + (x % 3 === 0 ? .2 : 0), x, y));
    P.poly([[12, 12], [2, 12 + spread], [0, 10 + spread], [10, 11]], (x, y) => W(.45 + (y % 3 === 0 ? .2 : 0), x, y));
  }
  // shell (elytra) — splits when open
  const sp = o === 2 ? 3 : o;
  P.ellipse(11, 11 - sp * .6, 7, 3.4, (x, y, dx, dy) => B(.58 - dy * .35 - dx * .15 + (dy < -.4 && dx < 0 ? .3 : 0), x, y));
  if (sp) P.ellipse(11, 11 + sp * .6, 7, 3.4, (x, y, dx, dy) => B(.45 - dy * .2 - dx * .15, x, y));
  P.line(5, 11, 17, 11, B(.15, 0, 0));
  // pronotum + head + horn
  P.ellipse(19, 11, 3.2, 3, (x, y, dx, dy) => B(.6 - dy * .3 - dx * .2, x, y));
  P.line(21, 11, 24, 8, B(.55, 0, 0)); P.line(24, 8, 25, 7, B(.8, 0, 0)); P.set(22, 9, B(.3, 0, 0));
  P.set(10, 9, B(.99, 0, 0)); P.set(11, 9, B(.85, 0, 0)); P.set(18, 9, B(.95, 0, 0));
  if (p.dew) { P.set(13, 8, [220, 245, 255]); E.set(13, 8, [200, 235, 255]); P.set(14, 8, [160, 210, 240]); }
}
export function beetleAtlas() { return atlas(28, 22, { b0: {}, b1: { leg: 1 }, dew: { dew: 1 }, open1: { open: 1 }, open2: { open: 2 }, open2b: { open: 2, leg: 1 } }, drawBeetle, { k: .35 }); }

// Glow-beetle: the imagined creature (round, teal glowing wing cases). Drawn bright into the emissive layer too.
function drawGlow(P, E, p) {
  const G = R(['#0a3a3a', '#138a84', '#3ad6c4', '#9afff0', '#ffffff']), B = R(['#14182a', '#2a3050', '#485080']);
  const f = p.f || 0;
  // wings (flutter frames)
  const wy = f === 0 ? -3 : f === 1 ? -1 : 1;
  for (const s of [-1, 1]) P.ellipse(7 + s * 1, 5 + wy * s * .3, 4, 2.2, (x, y) => { const c = [190, 250, 255]; E.set(x, y, [120, 220, 230]); return c; });
  P.ellipse(8, 8, 5.2, 4.2, (x, y, dx, dy) => { const c = G(.7 - dy * .3 - dx * .1 + (dx < -.2 && dy < -.2 ? .25 : 0), x, y); E.set(x, y, c); return c; });
  P.line(8, 4, 8, 12, G(.35, 0, 0));
  P.ellipse(13, 8, 2.4, 2.2, (x, y) => B(.6, x, y));
  P.set(14, 7, [255, 255, 255]); E.set(14, 7, [255, 255, 255]);
  P.line(14, 6, 16, 3, B(.8, 0, 0)); P.set(16, 3, [180, 255, 240]); E.set(16, 3, [180, 255, 240]);
  P.line(15, 6, 17, 5, B(.8, 0, 0)); P.set(17, 5, [180, 255, 240]); E.set(17, 5, [180, 255, 240]);
}
export function glowAtlas() { return atlas(20, 14, { f0: { f: 0 }, f1: { f: 1 }, f2: { f: 2 } }, drawGlow, { k: .25, tint: [10, 40, 50] }); }

// Lantern moth (amber), puff-seed (white fluff), pebble snail (mossy shell): original fantasy-world creatures
function drawMoth(P, E, p) {
  const A = R(['#5a2a0a', '#a85a14', '#f0a030', '#ffd27a', '#fff2c8']), f = p.f || 0, sp = f ? 3 : 6;
  for (const s of [-1, 1]) P.poly([[9, 8], [9 + s * sp, 2], [9 + s * (sp + 3), 5], [9 + s * (sp + 1), 11]], (x, y) => A(.45 + (Math.abs(x - 9) < 3 ? .2 : 0), x, y));
  P.ellipse(9, 9, 1.6, 4, (x, y) => { const c = A(.95, x, y); E.set(x, y, c); return c; });
  P.set(9, 13, [255, 240, 200]); E.set(9, 13, [255, 230, 180]); P.set(8, 4, A(.2, 0, 0)); P.set(10, 4, A(.2, 0, 0));
}
function drawPuff(P, E, p) {
  const W = R(['#9aa6b4', '#d4dce6', '#ffffff']), b = p.b || 0;
  P.ellipse(8, 9 - b, 6, 5.5 - b * .5, (x, y, dx, dy) => W(.75 - dy * .3 + ((x * 3 + y) % 5 === 0 ? -.25 : 0), x, y));
  P.set(10, 9 - b, INK); P.set(7, 9 - b, INK); P.rect(8, 11 - b, 2, 1, hex('#e08a90'));
  P.line(8, 3 - b, 7, 0, hex('#6a9a4a')); P.set(6, 0, hex('#8acc5a')); P.set(8, 0, hex('#8acc5a'));
  P.rect(5, 14, 2, 1, W(.3, 0, 0)); P.rect(10, 14, 2, 1, W(.3, 0, 0));
}
function drawSnail(P, E, p) {
  const S = R(['#3a3a40', '#5e5e66', '#8a8a92', '#b4b4bc']), M = R(['#1e4a1e', '#3a7a30', '#6aae48']), K = R(['#8a7a5a', '#c0ae84', '#e6d6ae']);
  const s = p.s || 0;
  P.rect(3 + s, 11, 14, 3, K(.6, 0, 0)); P.rect(15 + s, 7, 3, 5, K(.7, 0, 0)); P.set(16 + s, 5, K(.5, 0, 0)); P.set(18 + s, 5, K(.5, 0, 0)); P.set(17 + s, 8, INK);
  P.ellipse(8, 8, 6, 5, (x, y, dx, dy) => { const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); return S(.5 + .3 * Math.sin(a * 2 + r * 6) - dy * .2, x, y); });
  for (let x = 4; x < 12; x++) if (x % 2) P.set(x, 3 + (x % 3 === 0 ? 0 : 1), M(.6, x, 0));
}
export function creatureAtlases() {
  return {
    moth: atlas(19, 15, { f0: { f: 0 }, f1: { f: 1 } }, drawMoth, { k: .3 }),
    puff: atlas(16, 16, { b0: { b: 0 }, b1: { b: 1 } }, drawPuff, { k: .35 }),
    snail: atlas(20, 16, { s0: { s: 0 }, s1: { s: 1 } }, drawSnail, { k: .35 }),
  };
}

// Dragonfly (side, 3/4 from above) and butterfly: small flying billboards
function drawDragonfly(P, E, p) {
  const B = R(['#0a2a4a', '#1a5a8a', '#3a9ad0', '#8ae0ff']), W = R(['#8aa8b8', '#d8f0ff']), f = p.f || 0;
  P.line(2, 6, 16, 6, B(.55, 0, 0)); P.line(2, 7, 14, 7, B(.3, 0, 0)); P.ellipse(17, 6, 1.8, 1.6, (x, y) => B(.9, x, y));
  const wy = f ? 1 : -1;
  for (const wx of [11, 14]) { P.line(wx, 5, wx - 3, 5 + wy * 4, W(.7, 0, 0)); P.line(wx, 5, wx + 2, 5 + wy * 4, W(.5, 0, 0)); P.line(wx, 7, wx - 3, 7 - wy * 3, W(.4, 0, 0)); }
}
function drawButterfly(P, E, p) {
  const Y = R(['#7a4a0a', '#d89a1a', '#ffd04a', '#fff0a0']), f = p.f || 0, sp = f === 0 ? 6 : f === 1 ? 3 : 1;
  for (const s of [-1, 1]) { P.ellipse(8 + s * sp * .7, 5, sp * .7 + 1, 3.5, (x, y, dx, dy) => Y(.6 - dy * .3 + (Math.abs(dx) > .7 ? -.35 : 0), x, y)); P.ellipse(8 + s * sp * .5, 9, sp * .5 + 1, 2.5, (x, y) => Y(.45, x, y)); }
  P.line(8, 3, 8, 11, INK); P.set(7, 2, INK); P.set(9, 2, INK);
}
export function smallFlyers() {
  return {
    dragonfly: atlas(20, 13, { f0: { f: 0 }, f1: { f: 1 } }, drawDragonfly, { k: .3 }),
    butterfly: atlas(16, 13, { f0: { f: 0 }, f1: { f: 1 }, f2: { f: 2 } }, drawButterfly, { k: .3 }),
  };
}
export { C as COLORS, drawBoy, drawSit };
