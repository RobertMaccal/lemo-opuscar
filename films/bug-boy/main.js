// The Boy Who Caught Bugs — page contract: window.DUR, render(t), READY, EV, TEXTS
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, SHOTS, XF, shotAt } from './timeline.js';
import { drawOverlay, overlayReady, textsAt, EVENTS } from './ui.js';

const W = innerWidth || 1080, H = innerHeight || 1920, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(36, W / H, .02, 900);

const ONLY = Q.get('only');
const need = ONLY ? new Set(ONLY.split(',')) : new Set(SHOTS.map(s => s.set));
const builders = {
  country: () => import('./country.js').then(m => m.buildCountry()),
  room: () => import('./room.js').then(m => m.buildRoom()),
  tunnel: () => import('./tunnel.js').then(m => m.buildTunnel()),
  studio: () => import('./studio.js').then(m => m.buildStudio()),
  world: () => import('./world.js').then(m => m.buildWorld()),
};
const sets = {};
for (const k of Object.keys(builders)) if (need.has(k)) sets[k] = await builders[k]();
const first = Object.values(sets)[0];
const post = makePost(renderer, first.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
await overlayReady();

const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sg = snap.getContext('2d');
const _v = new THREE.Vector3();
function renderSet(id, shot, t) {
  const S = sets[id]; if (!S) { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); return false; }
  post.dof.scene = S.scene;
  // defaults each set may override
  V.fade.value = 1; V.gb.value = 0; V.amt.value = .55; V.warm.value = .08; V.sat.value = 1.08; V.contrast.value = .18;
  post.bloom.strength = .5; post.bloom.radius = .7; post.bloom.threshold = .82; renderer.toneMappingExposure = 1.1;
  post.dof.tiltAmt = 0; post.dof.tiltC = .5; post.dof.tiltW = .09; post.dof.tiltF = .3;
  camera.near = .05; camera.far = 900;
  S.update(t, shot, camera, post, renderer);
  camera.updateProjectionMatrix();
  if (post.dof.track) {   // tilt band follows a subject's projected height
    camera.updateMatrixWorld(); _v.copy(post.dof.track).project(camera); post.dof.tiltC = Math.min(.8, Math.max(.2, _v.y * .5 + .5)); post.dof.track = null;
  }
  if (Q.has('nodof')) post.dof.maxCoc = 0;
  post.composer.render();
  return true;
}
window.DUR = DUR;
window.EV = EVENTS;
window.TEXTS = textsAt;
window.render = t => {
  const shot = shotAt(t);
  // cross-dissolve: render the outgoing shot first, keep it, then the incoming one, and blend the kept frame on top
  const x = XF.find(x => t >= x.t - x.d && t < x.t + x.d);
  let blend = null;
  if (x && !Q.has('noxf')) {
    const a = t < x.t ? shot : shotAt(x.t - 1e-3), b = t < x.t ? shotAt(x.t + 1e-3) : shot;
    const k = (t - (x.t - x.d)) / (2 * x.d), ks = k * k * (3 - 2 * k);
    renderSet(a.set, { ...a, xf: 'out', xk: ks }, t); sg.clearRect(0, 0, W, H); sg.drawImage(renderer.domElement, 0, 0, W, H);
    renderSet(b.set, { ...b, xf: 'in', xk: ks }, t);
    blend = 1 - ks;
  } else renderSet(shot.set, shot, t);
  drawOverlay(t, shot, blend != null ? { img: snap, a: blend } : null);
};
window.READY = true;
