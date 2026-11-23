// The film: window.render(t). Shots configure one shared three.js scene; dissolves blend two shots.
import * as E from './engine.js';
import { THREE, scene } from './engine.js';
import * as S from './sets.js';
import { Char } from './chars.js';
import { drawCaptions } from './captions.js';
import { makeShots } from './shots.js';
import { makeThumb } from './thumb.js';

await document.fonts.load('900 76px Montserrat'); await document.fonts.load('700 30px Montserrat'); await document.fonts.load('800 30px Montserrat'); await document.fonts.ready;
E.init();
const q = new URLSearchParams(location.search);

const SETS = { station: S.buildStation(), parlour: S.buildParlour(), office: S.buildOffice(), stage: S.buildStage(), court: S.buildCourt(), seaside: S.buildSeaside() };
const C = {};
for (const k of ['neil', 'spils', 'diver', 'father', 'smith', 'smithB', 'alice', 'margaret', 'bessie', 'pc1', 'pc2', 'judge', 'juror1', 'juror2', 'juror3']) { C[k] = new Char(k, 1.7); scene.add(C[k].g); C[k].g.visible = false; }
// extra jurors (instances share the 3 juror looks)
for (let i = 0; i < 9; i++) { const k = 'j' + i; C[k] = new Char(['juror1', 'juror2', 'juror3'][i % 3], .9); scene.add(C[k].g); C[k].g.visible = false; }

const TINT = { station: 0xffe8d0, parlour: 0xffdcb8, office: 0xf2e4cc, stage: 0xdfe2f2, court: 0xfff0dc, seaside: 0xb4bfe6 };
const P = {};   // loose props created in shots.js
const H = {
  E, THREE, C, P, SETS, scene, S,
  show(name) {
    for (const c of Object.values(C)) { c.tint(TINT[name]); c.g.visible = false; c.g.rotation.set(0, 0, 0); c.mesh.position.set(0, c.s.h * .482, 0); c.mesh.rotation.set(0, 0, 0); c.shadow.visible = true; c.baseRot = 0; }
    for (const [k, g] of Object.entries(SETS)) g.visible = k === name;
    scene.fog = name === 'stage' ? SETS.stage.userData.fog : null;
    for (const p of Object.values(P)) p.visible = false;
  },
  use(...names) { for (const n of names) C[n].g.visible = true; return names.map(n => C[n]); },
};

const ALL = makeShots(H);
const THUMB = q.has('thumb') ? makeThumb(H) : null;
const SHOTS = THUMB ? [THUMB.shot] : ALL;
const DUR = 94.6;
const FROM = +(q.get('from') || 0), TO = +(q.get('to') || DUR);
window.DUR = TO - FROM;
const ov = document.getElementById('ov').getContext('2d');
const shotAt = T => { let i = 0; while (i < SHOTS.length - 1 && T >= SHOTS[i + 1].t0) i++; return i; };
window.SHOTS = SHOTS.map(s => ({ t0: s.t0, name: s.name, set: s.set }));
let curShot = null;
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
  if (!THUMB && T > DUR - 1.6) fr.fx.fade = Math.min(fr.fx.fade ?? 1, E.ss((DUR - T) / 1.6));
  E.renderFrame(fr); curShot = s;
  if (THUMB) { if (!q.has('nocap')) THUMB.overlay(ov); else ov.clearRect(0, 0, 1080, 1920); }
  else if (!q.has('nocap')) drawCaptions(ov, T); else ov.clearRect(0, 0, 1080, 1920);
};

// ---- framing QC: after render(t), report anything named in shot.keep (props) and every visible character
// that is cut by the frame edge. Characters: the head must be fully inside; the body is reported if feet are
// out of frame while the head is inside the lower half (a "floating" crop).
const _b = new THREE.Box3(), _b2 = new THREE.Box3(), _v = new THREE.Vector3();
function screenBox(obj) {
  _b.makeEmpty(); obj.updateMatrixWorld(true);
  obj.traverseVisible(o => { if (!o.isMesh || o.isLineSegments2 || (o.material && o.material.side === THREE.BackSide && o.material.isShaderMaterial)) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _b2.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); _b.union(_b2); });
  if (_b.isEmpty()) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
  for (let k = 0; k < 8; k++) { _v.set(k & 1 ? _b.max.x : _b.min.x, k & 2 ? _b.max.y : _b.min.y, k & 4 ? _b.max.z : _b.min.z).project(E.camera); if (_v.z > 1) behind = true; x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y); }
  return { x0: (x0 + 1) / 2, x1: (x1 + 1) / 2, y0: (1 - y1) / 2, y1: (1 - y0) / 2, behind };
}
window.CHECK = () => {
  const s = curShot, out = [];
  const inside = (b, m = .01) => b && b.x0 >= m && b.x1 <= 1 - m && b.y0 >= m && b.y1 <= 1 - m;
  for (const [name, obj] of Object.entries(s.keep ? s.keep() : {})) { if (!obj || !obj.visible) continue; const b = screenBox(obj); if (!inside(b, .015)) out.push(`prop ${name} cut ${b ? [b.x0, b.y0, b.x1, b.y1].map(v => v.toFixed(2)).join(',') : 'none'}`); }
  for (const [k, c] of Object.entries(C)) { if (!c.g.visible || (s.ignore && s.ignore.includes(k))) continue;
    const head = c.worldOf(300, c.s.baby ? 400 : 330), r = c.s.h * .19 * c.g.scale.y;
    const hp = head.clone().project(E.camera); const hb = { x0: (hp.x + 1) / 2 - r / 2, x1: (hp.x + 1) / 2 + r / 2 };
    const top = head.clone().add(new THREE.Vector3(0, r, 0)).project(E.camera), bot = head.clone().add(new THREE.Vector3(0, -r, 0)).project(E.camera);
    const hy0 = (1 - top.y) / 2, hy1 = (1 - bot.y) / 2, hx = (hp.x + 1) / 2;
    const vis = hx > -.1 && hx < 1.1 && hy1 > 0 && hy0 < 1;
    if (vis && (hy0 < .0 || hy1 > 1 || hx < .04 || hx > .96)) out.push(`char ${k} head cut (x ${hx.toFixed(2)} y ${hy0.toFixed(2)}..${hy1.toFixed(2)})`);
  }
  return { shot: s.name, issues: out };
};
window.READY = true;
