// Engine: renderer, ink outlines, painted canvas textures, post pipeline with dissolves.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { makePost } from '/core/three/post.js';

export const W = 1080, H = 1920;
export const INK = 0x16121c;
export let renderer, post, camera, fill;
export const scene = new THREE.Scene();
const SS = +(new URLSearchParams(location.search).get('ss') || 1);

// ---------- deterministic helpers
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const ei = t => Math.pow(clamp(t), 3);
export const sine = t => .5 - .5 * Math.cos(Math.PI * clamp(t));
export function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
export const noise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

// ---------- renderer + post
export function init() {
  renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W * SS, H * SS, false);
  renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('stage').appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 400);
  fill = new THREE.PointLight(0xc8d2ff, 1.4, 9, 1); fill.position.set(0, .3, 0); camera.add(fill); scene.add(camera);
  post = makePost(renderer, scene, camera, W * SS, H * SS, { ssaa: 1 });
  post.composer.renderToScreen = false;
  post.bloom.strength = .55; post.bloom.radius = .55; post.bloom.threshold = .85;
  post.vig.uniforms.amt.value = .5;
  rtA = new THREE.WebGLRenderTarget(W * SS, H * SS, { type: THREE.HalfFloatType });
  copyQ = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: VS, fragmentShader: `varying vec2 vUv; uniform sampler2D t; void main(){ gl_FragColor = texture2D(t, vUv); }` }));
  finalQ = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { a: { value: null }, b: { value: null }, mixv: { value: 0 }, mode: { value: 0 }, time: { value: 0 }, fade: { value: 1 }, flash: { value: 0 }, grain: { value: .045 }, res: { value: new THREE.Vector2(W * SS, H * SS) }, zoomA: { value: 1 }, zoomB: { value: 1 }, shake: { value: new THREE.Vector2() }, aber: { value: 0 } },
    vertexShader: VS, fragmentShader: FINAL_FS
  }));
}
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const FINAL_FS = `varying vec2 vUv; uniform sampler2D a, b; uniform float mixv, time, fade, flash, grain, zoomA, zoomB, aber; uniform vec2 res, shake;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*37.13) * 43758.5453); }
vec3 samp(sampler2D t, vec2 uv, float z){ uv = (uv - .5)/z + .5 + shake;
  if (aber > 0.) { vec2 d = (uv-.5)*aber; return vec3(texture2D(t, uv+d).r, texture2D(t, uv).g, texture2D(t, uv-d).b); }
  return texture2D(t, uv).rgb; }
void main(){
  vec3 cb = samp(b, vUv, zoomB);
  vec3 c = cb;
  if (mixv > 0.001) { vec3 ca = samp(a, vUv, zoomA); c = mix(cb, ca, mixv); }
  c = mix(c, vec3(1.), flash);
  c *= fade;
  float g = h(floor(vUv*res/1.5)) - .5; c += g * grain * (0.6 + 0.4*(1.-dot(c, vec3(.33))));
  gl_FragColor = vec4(c, 1.);
}`;
let rtA, copyQ, finalQ;

// view = { setup(t) -> configures scene/camera/dof; returns nothing }
// frame: { cur: {view, t}, prev?: {view, t}, mix, fx }
export function renderFrame(fr) {
  const fx = fr.fx || {};
  if (fr.prev && fr.mix > 0.001) {
    fr.prev.view.setup(fr.prev.t, fr.prev.view);
    post.composer.render();
    copyQ.material.uniforms.t.value = post.composer.readBuffer.texture;
    renderer.setRenderTarget(rtA); copyQ.render(renderer);
  }
  fr.cur.view.setup(fr.cur.t, fr.cur.view);
  post.composer.render();
  const u = finalQ.material.uniforms;
  u.a.value = rtA.texture; u.b.value = post.composer.readBuffer.texture;
  u.mixv.value = fr.prev ? fr.mix : 0; u.time.value = fr.time % 10;
  u.fade.value = fx.fade ?? 1; u.flash.value = fx.flash ?? 0; u.zoomA.value = fx.zoomA ?? 1; u.zoomB.value = fx.zoomB ?? 1;
  u.shake.value.set(fx.sx ?? 0, fx.sy ?? 0); u.aber.value = fx.aber ?? 0;
  renderer.setRenderTarget(null); finalQ.render(renderer);
}

// ---------- ink outlines
const lineMats = [];
export function lineMat(px = 4.2, color = INK) {
  const m = new LineMaterial({ color, linewidth: px * SS, worldUnits: false, alphaToCoverage: false });
  m.resolution.set(W * SS, H * SS); lineMats.push(m); return m;
}
const hullMat = (px, color) => new THREE.ShaderMaterial({
  uniforms: { px: { value: px * SS }, res: { value: new THREE.Vector2(W * SS, H * SS) }, col: { value: new THREE.Color(color) } },
  vertexShader: `uniform float px; uniform vec2 res; void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position,1.);
    vec3 n = normalize(normalMatrix * normal); vec2 d = (projectionMatrix * vec4(n,0.)).xy; float l = length(d); if (l > 1e-5) d /= l;
    c.xy += d * px * 2. / res * c.w; gl_Position = c; }`,
  fragmentShader: `uniform vec3 col; void main(){ gl_FragColor = vec4(col,1.); }`,
  side: THREE.BackSide
});
const hullCache = new Map();
// ink(mesh, {edges, hull, px, angle})
export function ink(mesh, o = {}) {
  const px = o.px ?? 4.2, geo = mesh.geometry;
  if (o.edges !== false) {
    const eg = new THREE.EdgesGeometry(geo, o.angle ?? 35);
    const lg = new LineSegmentsGeometry().fromEdgesGeometry(eg);
    const l = new LineSegments2(lg, lineMat(o.epx ?? px * 2.0, o.color ?? INK)); l.raycast = () => {}; mesh.add(l);
  }
  if (o.hull) {
    let g = hullCache.get(geo);
    if (!g) { g = geo.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); g = mergeVertices(g, 1e-3); g.computeVertexNormals(); hullCache.set(geo, g); }
    const h = new THREE.Mesh(g, hullMat(px, o.color ?? INK)); mesh.add(h);
  }
  return mesh;
}

// ---------- painted textures
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}
export function col(hex) { return new THREE.Color(hex); }
export function mat(o = {}) {
  const m = new THREE.MeshLambertMaterial({ color: o.color ?? 0xffffff, map: o.map ?? null, side: o.side ?? THREE.FrontSide });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; if (o.emap) m.emissiveMap = o.emap; }
  if (o.transparent) { m.transparent = true; m.opacity = o.opacity ?? 1; m.depthWrite = o.depthWrite ?? false; }
  return m;
}
export function box(w, h, d, m, o = {}) {
  const ms = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); ms.castShadow = o.cast ?? true; ms.receiveShadow = true;
  if (o.ink !== false) ink(ms, o); return ms;
}
export function cyl(rt, rb, h, m, o = {}) {
  const ms = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 20, 1, o.open ?? false), m); ms.castShadow = o.cast ?? true; ms.receiveShadow = true;
  if (o.ink !== false) ink(ms, { hull: true, edges: o.edges ?? true, angle: 50, ...o }); return ms;
}
export function sph(r, m, o = {}) {
  const ms = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg ?? 24, o.seg2 ?? 16), m); ms.castShadow = o.cast ?? true; ms.receiveShadow = true;
  if (o.ink !== false) ink(ms, { hull: true, edges: false, ...o }); return ms;
}
export function plane(w, h, m, o = {}) {
  const ms = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); ms.receiveShadow = true;
  if (o.ink) ink(ms, o); return ms;
}
export function at(obj, x, y, z, ry = 0, rx = 0, rz = 0) { obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj; }
export function group(...kids) { const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; }

// soft round sprite for snow / dust / glow
export const dotTex = canvasTex(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
export const glowTex = canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
export function glow(color, size, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1); return s;
}
export function blob(r = .5, op = .45) {
  const t = canvasTex(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: op, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .01; return m;
}

// camera helper: pos/target arrays, fov, roll
const _t = new THREE.Vector3();
export function cam(p, tg, fov = 40, roll = 0) {
  camera.position.set(p[0], p[1], p[2]); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(tg[0], tg[1], tg[2]);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
}
export function focusOn(p, aper = 6, maxCoc = 16) {
  _t.set(p[0], p[1], p[2]); post.dof.focus = Math.max(.1, camera.position.distanceTo(_t)); post.dof.aper = aper * 9 * Math.min(1, post.dof.focus / 2.5); post.dof.maxCoc = maxCoc * 1.4;
}
// keyframed path: keys [[u, [x,y,z]], ...] with u in 0..1; eased by ease fn over u
export function path(keys, ease = sine) {
  return u => {
    u = ease(clamp(u));
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [u0, a] = keys[i], [u1, b] = keys[i + 1];
      if (u <= u1) { const f = (u - u0) / (u1 - u0); return a.map((v, j) => lerp(v, b[j], f)); }
    }
    return keys[keys.length - 1][1];
  };
}
// handheld drift (small, smooth)
export function drift(t, amt = .02, seed = 1) { return [noise(t * .5 + seed) * amt, noise(t * .43 + seed * 7) * amt * .7, noise(t * .37 + seed * 3) * amt * .5]; }
export const add3 = (a, b) => a.map((v, i) => v + b[i]);
export { THREE };
