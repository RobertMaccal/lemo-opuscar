// shots/05_office.js — SCENE 05: the office. 3D establishing, the weak greeting, the monitor, the time-lapse, Priya.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, shake, alpha, shade, mix, seg, circle, ring, rr, poly, linGrad, radGrad, glow, text, FONTS, measure } from '/engine/core.js';
import { drawFigure, bigFace, POSES, blendPose, breathe, walkPose, posesAt, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { office, deskUnit, monitor, OFFICE } from '../sets/office.js';
import { P, mouth, blinkAt, gT, wallClock } from '../_kit.js';
import { jeff, MARK, DANA, LEO, SAM, PRIYA } from '../cast.js';

const J = jeff(0.75), RIM = '#dfe6f0';
const Lr = (dir = [-0.6, -0.8]) => ({ color: RIM, dir, w: 4 });

// ---------- s35: 3D open-plan office, Jeff walks in ----------
registerShot('s35', { kind: '3d',
  init(T, info) {
    const THREE = T.THREE, st = T.stage({ mood: 'interiorCool', sky: '#8f9aac', fog: [14, 46], fogColor: '#4a5060', ambient: 2.2, keyColor: '#f4f8ff', keyIntensity: 3.0, keyPos: [-4, 12, 8], bloom: 0.4, bloomThreshold: 0.85, fov: 36 });
    st.hemi.color.set('#c8d0e0'); st.hemi.groundColor.set('#6a6e78');
    st.add(T.ground(60, 60, '#8a8c94', T.tiles('#9a9ca4', 10, [6, 6])));
    const back = T.box(60, 6, 0.3, '#9a9ea8', 0, 3, -9); st.add(back);
    for (let i = -3; i <= 3; i++) { const w = T.windowPane(3.2, 2.2, { glowColor: '#c8d4e4', frame: '#3a3e48', cols: 2, rows: 1, power: 0.8 }); w.position.set(i * 4.4, 3.2, -8.8); st.add(w); }
    for (let i = -4; i <= 4; i++) for (let j = -1; j <= 2; j++) { const p = T.box(2.2, 0.06, 0.6, '#e8eef4', i * 3.2, 5.4, j * 3); p.material = T.basic('#f2f6ff'); st.add(p); }
    const r = rng(3), outfits = [MARK, DANA, LEO, SAM];
    const deskM = T.mat('#c8c0b0'), monM = new THREE.MeshBasicMaterial({ color: '#bcd8f0' });
    for (let row = 0; row < 3; row++) for (let c = -3; c <= 3; c++) {
      const x = c * 2.6, z = -5 + row * 3.2; st.add(T.box(1.6, 0.06, 0.8, deskM, x, 0.75, z)); st.add(T.box(0.06, 0.75, 0.7, deskM, x - 0.75, 0.37, z)); st.add(T.box(0.06, 0.75, 0.7, deskM, x + 0.75, 0.37, z));
      const mon = T.box(0.7, 0.42, 0.04, '#16181e', x + 0.2, 1.1, z - 0.2); st.add(mon); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), monM); scr.position.set(x + 0.2, 1.1, z - 0.17); scr.rotation.y = 0; st.add(scr);
      st.add(T.box(1.7, 0.4, 0.04, '#8a94a8', x, 0.95, z + 0.45));
      if (r() < 0.7 && !(row === 2 && c === 0)) { const f = T.figure3D(outfits[Math.floor(r() * 4)], { rim: '#dfe6f0', pose: 'sit', s: 0.95 }); f.position.set(x, 0, z + 0.85); f.rotation.y = Math.PI / 2; st.add(f); }
    }
    const jf = T.figure3D(J, { rim: '#ffffff', pose: 'stand', s: 1 }); st.add(jf);
    return { stage: st, jf };
  },
  draw(s, t, info, T) {
    const x = lerp(-9, -1.2, clamp(t / info.dur)); s.jf.position.set(x, 0, 2.8); s.jf.rotation.y = 0; s.jf.setPose(walkPose(t * 2 * Math.PI * 0.8, { stride: 18, lift: 6, lean: 8, arm: 8 }));
    T.dolly(s.stage.camera, t, [[0, { pos: [-7, 4.2, 10.5], look: [-3, 1.0, 1.5], fov: 38 }], [info.dur, { pos: [-3, 3.4, 8.5], look: [-1, 1.0, 2.2], fov: 36 }]]);
  },
});

// ---------- the office floor in 2D (shared) ----------
function floor2D(g, t, cam, o = {}) {
  const { GY } = office(g, t, cam, o);
  layer(g, cam, 0.8, (g) => { const s = 1.05; for (const [x, who, sd] of [[220, DANA, 1], [700, null, 0], [1460, LEO, 3]]) deskUnit(g, x, GY - 50, s, who, t, { seed: sd, alpha: o.ghost ? 0.9 : 1 }); });
  return { GY };
}
// ---------- s36: "Morning, Jeff!" — "...morning." ----------
registerShot('s36', { draw(g, t, info) {
  const G = gT('s36', t), cam = { z: 1.22, x: -40 + t * 8, y: 30 };
  const { GY } = floor2D(g, t, cam);
  layer(g, cam, 1, (g) => {
    const wave = t > 0.2 && t < 1.8;
    deskUnit(g, 1200, GY, 1.35, MARK, t, { pose: wave ? blendPose(POSES.sit, { ...POSES.sit, eF: [30, -150], hF: [36, -190] }, 0.5 + 0.5 * Math.sin(t * 9)) : POSES.sit, expr: 'happy', talk: mouth('MARK', G), seed: 2 });
    const x = lerp(260, 820, ease.out(prog(t, 0, 2.0))), walking = t < 2.0;
    const lift = ease.inOut(prog(t, 2.0, 2.3)) * (1 - ease.inOut(prog(t, 3.4, 3.8)));
    drawFigure(g, { x, y: GY, s: 1.55, facing: 1, outfit: J, pose: walking ? walkPose(t * 2 * Math.PI * 0.8, { stride: 18, lift: 6, lean: 8, arm: 7 }) : blendPose(P.slouchStand, P.twoFinger, lift), expr: 'exhausted', talk: mouth('JEFF', G), face: { lid: 0.7, bags: 1 }, look: [1, 0], rim: Lr() });
  });
} });

// ---------- s37: he sits, presses the power button, the monitor boots ----------
registerShot('s37', { draw(g, t, info) {
  const cam = { z: 1.9, x: 120, y: 160 };
  const { GY } = office(g, t, cam);
  const sit = ease.inOut(prog(t, 0, 0.6)), press = Math.sin(clamp(prog(t, 0.9, 1.4)) * Math.PI), boot = prog(t, 1.4, 2.2);
  layer(g, cam, 1, (g) => {
    const pose = blendPose(blendPose(P.slouchStand, P.sitDesk, sit), { ...P.sitDesk, eF: [44, -140], hF: [96, -150] }, press);
    drawFigure(g, { x: 860, y: GY, s: 1.5, facing: 1, outfit: J, pose: breathe(pose, t, 0.5), expr: 'exhausted', face: { lid: 0.7, bags: 1 }, rim: Lr() });
    const top = GY - 150 * 1.5; rr(g, 860 - 60, top, 380, 18, 4); g.fillStyle = '#8a8478'; g.fill(); g.fillStyle = '#5a5650'; g.fillRect(1180, top + 18, 24, GY - top);
    monitor(g, 1030, top, 1.3, { on: boot > 0 ? (boot < 0.4 ? 0.3 : 1) : 0, col: boot < 0.5 ? '#5a7aff' : '#bcd8f0', rows: boot > 0.6 });
    if (boot > 0.1 && boot < 0.6) text(g, '◦', 1030, top - 150, { size: 40, color: '#fff', font: FONTS.ui });
    circle(g, 1125, top - 75, 5, boot > 0 ? '#5fd39a' : '#2a2a30');
  });
} });

// ---------- s38: over the shoulder on the screen — slow typing ----------
registerShot('s38', { draw(g, t, info) {
  g.fillStyle = '#20232c'; g.fillRect(0, 0, E.W, E.H);
  const z = 1 + t * 0.02, sx = 360, sy = 120, sw = 1300, sh = 760;
  g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  rr(g, sx - 30, sy - 30, sw + 60, sh + 60, 24); g.fillStyle = '#121419'; g.fill(); g.fillStyle = '#eef2f6'; g.fillRect(sx, sy, sw, sh);
  g.fillStyle = '#1f6f4a'; g.fillRect(sx, sy, sw, 50); text(g, 'Q3_sales_FINAL_v7.xlsx', sx + 24, sy + 26, { size: 24, font: FONTS.ui, weight: 900, color: '#fff', align: 'left' });
  for (let i = 0; i <= 14; i++) seg(g, [[sx, sy + 90 + i * 44], [sx + sw, sy + 90 + i * 44]], 1.5, '#c8ced6');
  for (let j = 0; j <= 7; j++) seg(g, [[sx + 60 + j * 170, sy + 90], [sx + 60 + j * 170, sy + sh]], 1.5, '#c8ced6');
  const r = rng(2); for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) if (r() < 0.8) text(g, String(Math.floor(r() * 9000 + 1000)), sx + 210 + j * 170, sy + 112 + i * 44, { size: 20, font: FONTS.ui, weight: 800, color: '#5a6270', align: 'right' });
  const typed = ['', 'q', 'q3', 'q3 ', 'q3 s', 'q3 sa', 'q3 s', 'q3 ', 'q3 s', 'q3 sa', 'q3 sal'][Math.min(10, Math.floor(t * 3.2))];
  g.strokeStyle = '#1f6f4a'; g.lineWidth = 4; g.strokeRect(sx + 60 + 170, sy + 90 + 44 * 9, 170, 44);
  text(g, typed + ((t * 2) % 1 < 0.5 ? '|' : ''), sx + 240, sy + 112 + 44 * 9, { size: 24, font: FONTS.ui, weight: 800, color: '#111', align: 'left' });
  g.restore();
  glow(g, E.W / 2, E.H / 2, 900, '#bcd8f0', 0.12);
  blurLayer(g, 10, (g) => { circle(g, 180, 900, 300, '#0e0b12'); g.fillStyle = '#e4e2ea'; g.beginPath(); g.ellipse(80, 1300, 500, 300, 0, 0, Math.PI * 2); g.fill(); for (const [a, l] of [[-2.2, 1.3], [-1.9, 1.45], [-1.6, 1.3]]) { g.fillStyle = '#0e0b12'; g.beginPath(); g.moveTo(180 + Math.cos(a - 0.1) * 270, 900 + Math.sin(a - 0.1) * 270); g.lineTo(180 + Math.cos(a) * 300 * l, 900 + Math.sin(a) * 300 * l); g.lineTo(180 + Math.cos(a + 0.1) * 270, 900 + Math.sin(a + 0.1) * 270); g.fill(); } });
} });

// ---------- s39: time-lapse 9 → 11, everyone blurs around a frozen Jeff ----------
registerShot('s39', { draw(g, t, info) {
  const k = ease.inOut(prog(t, 0.1, info.dur - 0.2)), h = lerp(9, 11, k), cam = { z: 1.15, x: 0, y: 20 };
  const { GY } = office(g, t, cam, { hours: h, sec: (t * 600) % 60 });
  layer(g, cam, 0.8, (g) => { for (const [x, who, sd] of [[220, DANA, 1], [700, SAM, 4], [1460, LEO, 3]]) for (let gh = 0; gh < 4; gh++) { const tt = t * 7 + gh * 0.37 + sd; deskUnit(g, x + Math.sin(tt) * 30, GY - 50, 1.05, who, tt, { pose: [POSES.sit, POSES.sitBack, P.sitDesk, P.sitPhone][Math.floor(tt) % 4], alpha: 0.28, seed: sd }); } });
  layer(g, cam, 1, (g) => {
    for (let gh = 0; gh < 5; gh++) { const ph = (t * 1.6 + gh * 0.2) % 1; drawFigure(g, { x: lerp(-100, 2000, ph), y: GY, s: 1.5, facing: 1, outfit: gh % 2 ? MARK : PRIYA, pose: walkPose(t * 30 + gh, { run: true }), alpha: 0.3, rim: Lr() }); }
    deskUnit(g, 960, GY, 1.35, J, t, { pose: P.sitDesk, expr: 'exhausted', seed: 0 });
  });
  FX.speedLines(g, t, { count: 24, a: 0.08, inner: 400 });
} });

// ---------- s40: his head sinks to the keyboard — jjjjjjjj ----------
registerShot('s40', { draw(g, t, info) {
  const cam = { z: 2.1, x: 200, y: 150 };
  const { GY } = office(g, t, cam, { hours: 11.1 });
  const sink = ease.in(prog(t, 0.2, 1.4));
  layer(g, cam, 1, (g) => {
    const top = GY - 150 * 1.5;
    drawFigure(g, { x: 860, y: GY, s: 1.5, facing: 1, outfit: J, pose: blendPose(P.sitDesk, P.sitSink, sink), expr: 'sleepy', face: { lid: 1, bags: 1 }, rim: Lr() });
    rr(g, 800, top, 420, 18, 4); g.fillStyle = '#8a8478'; g.fill(); rr(g, 900, top - 8, 140, 10, 3); g.fillStyle = '#2a2c34'; g.fill();
    monitor(g, 1110, top, 1.45, { on: 1, rows: false });
    const n = Math.floor(Math.max(0, t - 1.35) * 22), str = 'j'.repeat(Math.min(n, 26));
    g.save(); g.beginPath(); g.rect(1110 - 150, top - 255, 300, 180); g.clip(); text(g, str, 1110 - 140, top - 160, { size: 26, font: FONTS.ui, weight: 900, color: '#1a2a40', align: 'left' }); g.restore();
    if (t > 1.4) text(g, 'z', 1000 + Math.sin(t * 3) * 6, top - 200 - (t - 1.4) * 40, { size: 34, color: alpha('#eef3ff', clamp(1 - (t - 1.4))), font: FONTS.title });
  });
} });

// ---------- s41: Priya taps his shoulder — "the boss needs you" ----------
registerShot('s41', { draw(g, t, info) {
  const G = gT('s41', t), cam = { z: 1.6, x: 60, y: 120 };
  const { GY } = office(g, t, cam, { hours: 11.3 });
  const turn = ease.inOut(prog(t, 4.2, 4.9)), wake = ease.out(prog(t, 0, 0.4));
  layer(g, cam, 1, (g) => {
    const top = GY - 150 * 1.5;
    drawFigure(g, { x: lerp(560, 640, ease.out(prog(t, 0, 0.5))), y: GY, s: 1.55, facing: 1, outfit: PRIYA, pose: posesAt(t, [[0, 'shoulderTap' in P ? P.shoulderTap : POSES.reach], [0.6, POSES.relaxed], [1.0, POSES.talk], [3.2, POSES.relaxed]], 0.3), expr: 'smile', talk: mouth('PRIYA', G), rim: Lr([0.6, -0.8]), blink: blinkAt(t, 2.8) });
    drawFigure(g, { x: 900, y: GY, s: 1.5, facing: turn > 0.5 ? -1 : 1, outfit: J, pose: blendPose(P.sitSink, P.sitDesk, wake), expr: turn > 0.5 ? 'deadpan' : 'exhausted', face: { lid: 0.72, bags: 1 }, look: turn > 0 && turn < 0.5 ? [-1, 0] : [0.4, 0], rim: Lr() });
    rr(g, 840, top, 420, 18, 4); g.fillStyle = '#8a8478'; g.fill(); monitor(g, 1150, top, 1.4, { on: 1 });
    if (t < 0.5) FX.rings(g, 700, GY - 280, t, { count: 2, r0: 10, r1: 60, color: '#ffffff', a: 0.6, speed: 3, w: 3 });
  });
} });

// ---------- s42: he stands and shuffles toward the boss's door ----------
registerShot('s42', { draw(g, t, info) {
  const cam = { z: 1.2, x: 80 + t * 30, y: 30 };
  const { GY } = office(g, t, cam, { hours: 11.35 });
  layer(g, cam, 0.8, (g) => {   // the boss office door at the far right, glowing
    g.fillStyle = '#2a2420'; g.fillRect(1600, GY - 500, 240, 500); g.fillStyle = '#5a4a3a'; g.fillRect(1612, GY - 488, 216, 488); rr(g, 1650, GY - 420, 140, 40, 4); g.fillStyle = '#c8a03a'; g.fill(); text(g, 'MANAGER', 1720, GY - 400, { size: 20, font: FONTS.ui, weight: 900, color: '#2a2420' }); circle(g, 1800, GY - 250, 8, '#c8a03a');
  });
  layer(g, cam, 1, (g) => {
    const up = ease.inOut(prog(t, 0, 0.6)), walking = t > 0.6, x = 900 + Math.max(0, t - 0.6) * 190;
    drawFigure(g, { x, y: GY, s: 1.5, facing: 1, outfit: J, pose: walking ? walkPose((t - 0.6) * 2 * Math.PI * 0.75, { stride: 16, lift: 5, lean: 10, arm: 6 }) : blendPose(P.sitDesk, P.slouchStand, up), expr: 'deadpan', face: { lid: 0.72, bags: 1 }, rim: Lr() });
  });
} });
