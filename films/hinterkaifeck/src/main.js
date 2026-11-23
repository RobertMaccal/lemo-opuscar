// The film: window.render(t). Shots configure one shared three.js scene; dissolves blend two shots.
import * as E from './engine.js';
import { THREE, scene } from './engine.js';
import * as S from './sets.js';
import { Char } from './chars.js';
import { drawCaptions } from './captions.js';
import { makeShots } from './shots.js';
import { makeThumb } from './thumb.js';

await document.fonts.load('900 76px Montserrat'); await document.fonts.load('700 30px Montserrat'); await document.fonts.ready;
E.init();
const q = new URLSearchParams(location.search);

const SETS = { ext: S.buildExterior(), kitchen: S.buildKitchen(), attic: S.buildAttic(), barn: S.buildBarn(), bedroom: S.buildBedroom(), evidence: S.buildEvidence() };
// cast
const C = {};
for (const k of ['andreas', 'wife', 'viktoria', 'girl', 'josef', 'oldmaid', 'newmaid', 'neighbor', 'neighbor2', 'neighbor3', 'worker']) { C[k] = new Char(k, 1.7); scene.add(C[k].g); C[k].g.visible = false; }
// shared props
const P = {};
{ // shadow-man silhouettes (standing / seated)
  const sil = (draw) => E.canvasTex(256, 512, (x, w, h) => { x.filter = 'blur(6px)'; x.fillStyle = '#000'; draw(x, w, h); });
  const stand = sil((x, w, h) => { x.beginPath(); x.arc(128, 90, 52, 0, 7); x.fill(); x.beginPath(); x.moveTo(60, 160); x.quadraticCurveTo(128, 130, 196, 160); x.lineTo(210, 360); x.lineTo(180, 500); x.lineTo(76, 500); x.lineTo(46, 360); x.closePath(); x.fill(); x.fillRect(196, 170, 22, 200); });
  const seat = sil((x, w, h) => { x.beginPath(); x.arc(110, 150, 50, 0, 7); x.fill(); x.beginPath(); x.moveTo(50, 210); x.quadraticCurveTo(110, 190, 170, 210); x.lineTo(180, 380); x.lineTo(250, 385); x.lineTo(250, 430); x.lineTo(60, 430); x.closePath(); x.fill(); x.fillRect(220, 420, 22, 90); x.fillRect(60, 420, 20, 90); });
  const mk = t => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: .75, depthWrite: false })); m.visible = false; scene.add(m); return m; };
  P.shadow = mk(stand); P.seatShadow = mk(seat);
  // newspaper on snow
  const npT = E.canvasTex(512, 640, (x, w, h) => { x.fillStyle = '#e9e1cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1520'; x.font = '900 84px Montserrat'; x.textAlign = 'center'; x.fillText('MÜNCHEN', w / 2, 100); x.fillRect(30, 120, w - 60, 8); x.font = '700 26px Montserrat'; x.fillText('MÄRZ 1922', w / 2, 160); x.fillRect(30, 172, w - 60, 3);
    x.globalAlpha = .55; for (let i = 0; i < 26; i++) { x.fillRect(30 + (i % 2) * 230, 200 + (i >> 1) * 32, 200 * (.6 + .4 * Math.abs(Math.sin(i * 7.1))), 10); } x.globalAlpha = 1; x.fillStyle = '#b3262d'; x.fillRect(30, 600, w - 60, 10); });
  const np = new THREE.Group(); const sheet = new THREE.Mesh(new THREE.PlaneGeometry(.46, .58), E.mat({ map: npT, side: THREE.DoubleSide })); sheet.rotation.x = -Math.PI / 2; np.add(sheet); E.ink(sheet, { px: 3 });
  const flap = new THREE.Group(); const fs = new THREE.Mesh(new THREE.PlaneGeometry(.46, .3), E.mat({ color: 0xe2dac4, side: THREE.DoubleSide })); fs.position.y = .15; flap.add(fs); E.ink(fs, { px: 2.6 }); flap.position.set(0, .005, -.29); np.add(flap); np.userData.flap = flap;
  np.visible = false; scene.add(np); P.paper = np;
  // falling ceiling dust bursts
  const n = 600, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const dm = new THREE.PointsMaterial({ map: E.dotTex, size: .035, transparent: true, depthWrite: false, color: 0xd8c4a0, opacity: .9 });
  const pts = new THREE.Points(g, dm); pts.frustumCulled = false; pts.visible = false; scene.add(pts); const r = E.rng(3), seeds = Array.from({ length: n }, () => [r(), r(), r(), r()]);
  pts.userData.update = (T, bursts, origin, spread = 2.2) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { const s = seeds[i], b = bursts[i % bursts.length], age = T - b - s[3] * .25; const ok = age > 0 && age < 2.2;
      a[i * 3] = origin[0] + (s[0] - .5) * spread + Math.sin(age * 3 + i) * .03; a[i * 3 + 1] = ok ? origin[1] - age * age * .9 - age * .15 : -99; a[i * 3 + 2] = origin[2] + (s[1] - .5) * spread * .6 + (i % bursts.length) * .35; } g.attributes.position.needsUpdate = true; };
  P.dustFall = pts;
  // attic day backdrop (demolition)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshBasicMaterial({ color: 0xc9d4e4 })); sky.position.set(0, 6, 9); sky.rotation.y = Math.PI; sky.visible = false; scene.add(sky); P.daySky = sky;
}
// day/night environment for the exterior
const ext = SETS.ext.userData;
export function envExt(mode) {
  const sky = ext.sky.material.uniforms, L = ext.lights;
  if (mode === 'day') {
    sky.top.value.set(0x8794ad); sky.mid.value.set(0xaab4c8); sky.hor.value.set(0xd6dbe4); sky.warm.value.set(0xd8d4d6); sky.day.value = 1;
    L.hemi.color.set(0xdfe6f2); L.hemi.groundColor.set(0x8a8c96); L.hemi.intensity = 1.6; L.moonL.color.set(0xf2f0ea); L.moonL.intensity = 1.1;
    scene.fog = new THREE.FogExp2(0xc4cad6, .012); ext.moon.forEach(m => m.visible = false); ext.spill.intensity = 0;
  } else if (mode === 'dusk') {
    sky.top.value.set(0x1c2350); sky.mid.value.set(0x55507e); sky.hor.value.set(0xd08a6a); sky.warm.value.set(0xe0906a); sky.day.value = .7;
    L.hemi.color.set(0x9a90c8); L.hemi.groundColor.set(0x40304a); L.hemi.intensity = 1.2; L.moonL.color.set(0xffb890); L.moonL.intensity = 1.0;
    scene.fog = new THREE.FogExp2(0x6a5a80, .012); ext.moon.forEach(m => m.visible = false); ext.spill.intensity = 10;
  } else {
    sky.top.value.set(0x050820); sky.mid.value.set(0x15235a); sky.hor.value.set(0x40528f); sky.warm.value.set(0x5a3f70); sky.day.value = 0;
    L.hemi.color.set(0x7d8fd8); L.hemi.groundColor.set(0x1b2244); L.hemi.intensity = 1.45; L.moonL.color.set(0xa8bcff); L.moonL.intensity = 1.5;
    scene.fog = new THREE.FogExp2(0x1b2652, .016); ext.moon.forEach(m => m.visible = true); ext.spill.intensity = 12;
  }
}
// a frame helper passed to every shot
const TINT = { ext: 0x9eacdc, kitchen: 0xffe6cc, attic: 0xffd9b8, barn: 0xffd6b0, bedroom: 0x9aa6d8, evidence: 0xffe2c0 };
const H = {
  E, THREE, C, P, SETS, scene,
  show(name) { for (const c of Object.values(C)) c.tint(TINT[name]); for (const [k, g] of Object.entries(SETS)) g.visible = k === name; scene.fog = null; for (const c of Object.values(C)) { c.g.visible = false; c.g.rotation.set(0, 0, 0); c.mesh.position.y = c.s.h / 2; } for (const p of Object.values(P)) p.visible = false; },
  use(...names) { for (const n of names) C[n].g.visible = true; return names.map(n => C[n]); },
  envExt,
  windows(lit) { ext.farm.userData.windows.forEach((w, i) => { const on = typeof lit === 'function' ? lit(i) : lit; w.glass.material = on ? w.lit : w.dark; }); },
};

const THUMB = q.has('thumb') ? makeThumb(H) : null;
const SHOTS = THUMB ? [THUMB.shot] : makeShots(H);
const DUR = 87.5;
const FROM = +(q.get('from') || 0), TO = +(q.get('to') || DUR);
window.DUR = TO - FROM;
const ov = document.getElementById('ov').getContext('2d');
const shotAt = T => { let i = 0; while (i < SHOTS.length - 1 && T >= SHOTS[i + 1].t0) i++; return i; };
window.SHOTS = SHOTS.map(s => ({ t0: s.t0, name: s.name }));
window.render = (T) => {
  T = Math.min(T + FROM, DUR - 1e-4);
  const i = shotAt(T), s = SHOTS[i], prev = SHOTS[i - 1];
  const tr = s.tr ?? 'dis', D = s.dur ?? (tr === 'dis' ? .3 : tr === 'long' ? .6 : 0);
  const view = sh => ({ setup: (t) => { H.show(sh.set); sh.fn(t - sh.t0, t, sh); if (window.DBGCAM) { E.cam(window.DBGCAM[0], window.DBGCAM[1], window.DBGCAM[2] || 50); E.post.dof.maxCoc = 0; } } });
  let fr = { cur: { view: view(s), t: T }, time: T, fx: {} };
  const into = T - s.t0;
  if (prev && (tr === 'dis' || tr === 'long') && into < D) { fr.prev = { view: view(prev), t: T }; fr.mix = 1 - E.ss(into / D); }
  if (tr === 'whip' && into < .22) { const k = 1 - into / .22; fr.fx.zoomB = 1 + k * k * .35; fr.fx.aber = k * .012; }
  if (tr === 'flash' && into < .25) fr.fx.flash = (1 - into / .25) * .55;
  if (tr === 'black' && into < .35) fr.fx.fade = E.ss(into / .35);
  const nxt = SHOTS[i + 1];
  if (nxt && nxt.tr === 'black' && T > nxt.t0 - .3) fr.fx.fade = Math.min(fr.fx.fade ?? 1, E.ss((nxt.t0 - T) / .3));
  if (s.fx) Object.assign(fr.fx, s.fx(T - s.t0, T));
  if (!THUMB && T > DUR - 1.4) fr.fx.fade = Math.min(fr.fx.fade ?? 1, E.ss((DUR - T) / 1.4));
  E.renderFrame(fr);
  if (THUMB) { if (!q.has('nocap')) THUMB.overlay(ov); else ov.clearRect(0, 0, 1080, 1920); }
  else if (!q.has('nocap')) drawCaptions(ov, T);
};
window.READY = true;
