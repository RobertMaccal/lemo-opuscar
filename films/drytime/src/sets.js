// Sets for "Hung Out to Dry": the hospital grounds (pool, lawn, facade with the doctor's window and the balcony), the doctor's office.
import { THREE, scene, canvasTex, mat, box, cyl, sph, plane, at, group, ink, glow, rng, dotTex, INK, noise } from './engine.js';
import { Char } from './chars.js';

// ---------------- texture painters
function grain(x, w, h, n, a, seed = 1) { const r = rng(seed); x.globalAlpha = a; for (let i = 0; i < n; i++) { x.fillStyle = r() > .5 ? '#fff' : '#000'; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } x.globalAlpha = 1; }
export function shade(h, a) { const c = h.replace('#', ''); const v = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)).map(q => a >= 0 ? q + (255 - q) * a : q * (1 + a)); return `rgb(${v.map(q => Math.max(0, Math.min(255, q | 0))).join(',')})`; }
export function planksTex(base, n = 8, o = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(o.seed || 3); x.fillStyle = base; x.fillRect(0, 0, w, h); const bw = w / n;
    for (let i = 0; i < n; i++) {
      x.fillStyle = shade(base, (r() - .5) * .16); x.fillRect(i * bw, 0, bw, h);
      x.strokeStyle = shade(base, -.25); x.globalAlpha = .35; x.lineWidth = 2;
      for (let k = 0; k < 4; k++) { x.beginPath(); const gx = i * bw + bw * (.2 + r() * .6); x.moveTo(gx, 0); x.bezierCurveTo(gx + 6, h * .3, gx - 6, h * .6, gx + 3, h); x.stroke(); }
      x.globalAlpha = 1;
      if (o.cross) { const y = h * r(); x.strokeStyle = 'rgba(20,15,25,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(i * bw, y); x.lineTo(i * bw + bw, y); x.stroke(); }
    }
    x.strokeStyle = 'rgba(22,18,28,.85)'; x.lineWidth = 4; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * bw, 0); x.lineTo(i * bw, h); x.stroke(); }
    grain(x, w, h, 4000, .05);
  }, { repeat: o.repeat || [1, 1] });
}
function plasterTex(base, o = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h); const r = rng(o.seed || 9);
    for (let i = 0; i < 60; i++) { x.fillStyle = shade(base, (r() - .5) * .1); x.globalAlpha = .5; x.beginPath(); x.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    if (o.stains) { for (let i = 0; i < 6; i++) { const sx = r() * w; const g = x.createLinearGradient(sx, 0, sx, h); g.addColorStop(0, 'rgba(70,55,40,.22)'); g.addColorStop(1, 'rgba(70,55,40,0)'); x.fillStyle = g; x.fillRect(sx, 0, 8 + r() * 26, h * (.3 + r() * .5)); } }
    grain(x, w, h, 5000, .05);
  }, { repeat: o.repeat || [1, 1] });
}
function subwayTex(base, o = {}) {   // glazed wall tiles
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(o.seed || 4), tw = 64, th = 32; x.fillStyle = '#1b1a1e'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < h / th; j++) for (let i = -1; i < w / tw + 1; i++) {
      const ox = (j % 2) * tw / 2, X = i * tw + ox, Y = j * th;
      const g = x.createLinearGradient(X, Y, X, Y + th); g.addColorStop(0, shade(base, .18 + (r() - .5) * .08)); g.addColorStop(1, shade(base, -.12 + (r() - .5) * .08));
      x.fillStyle = g; x.fillRect(X + 2, Y + 2, tw - 4, th - 4);
      x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(X + 6, Y + 5, tw * .4, 3);
    }
    grain(x, w, h, 3000, .04);
  }, { repeat: o.repeat || [1, 1] });
}
function checkerTex(a = '#d9d2c4', b = '#2a2a30', n = 8, o = {}) {
  return canvasTex(512, 512, (x, w, h) => { const s = w / n, r = rng(o.seed || 5);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = shade((i + j) % 2 ? a : b, (r() - .5) * .1); x.fillRect(i * s, j * s, s, s); }
    x.strokeStyle = 'rgba(15,12,18,.8)'; x.lineWidth = 3; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); }
    grain(x, w, h, 6000, .06);
  }, { repeat: o.repeat || [1, 1] });
}
function damaskTex(base, fig, o = {}) {   // Edwardian wallpaper
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = fig; x.globalAlpha = .55;
    const motif = (cx, cy, s) => { x.beginPath(); x.moveTo(cx, cy - s); x.bezierCurveTo(cx + s * .8, cy - s * .6, cx + s * .5, cy + s * .2, cx, cy + s); x.bezierCurveTo(cx - s * .5, cy + s * .2, cx - s * .8, cy - s * .6, cx, cy - s); x.fill();
      x.beginPath(); x.arc(cx, cy, s * .22, 0, 7); x.fillStyle = base; x.fill(); x.fillStyle = fig; };
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) motif(i * 128 + (j % 2) * 64 + 32, j * 128 + 64, 46);
    x.globalAlpha = .25; x.strokeStyle = fig; x.lineWidth = 3; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 64 + 32, 0); x.lineTo(i * 64 + 32, h); x.stroke(); }
    x.globalAlpha = 1; grain(x, w, h, 5000, .05);
  }, { repeat: o.repeat || [1, 1] });
}
function brickTex(base, o = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(o.seed || 8), bw = 96, bh = 40; x.fillStyle = '#2b2624'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < h / bh; j++) for (let i = -1; i < w / bw + 1; i++) { const X = i * bw + (j % 2) * bw / 2, Y = j * bh; x.fillStyle = shade(base, (r() - .5) * .3); x.fillRect(X + 3, Y + 3, bw - 6, bh - 6); }
    grain(x, w, h, 6000, .07);
  }, { repeat: o.repeat || [1, 1] });
}
export const labelTex = canvasTex;

// ---------------- atmosphere
export function makeDust(n = 300, boxS = [4, 3, 4], color = 0xffe2b0) {
  const g = new THREE.BufferGeometry(), r = rng(5), base = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) base[i] = r();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ map: dotTex, size: .022, transparent: true, depthWrite: false, color, opacity: .65, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false;
  pts.userData.update = (t, c) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3] = c[0] + (base[i * 3] - .5) * boxS[0] + Math.sin(t * .3 + i) * .08; a[i * 3 + 1] = c[1] + (((base[i * 3 + 1] + t * .01 * (i % 3 + 1)) % 1) - .5) * boxS[1]; a[i * 3 + 2] = c[2] + (base[i * 3 + 2] - .5) * boxS[2] + Math.cos(t * .25 + i) * .08; } g.attributes.position.needsUpdate = true; };
  return pts;
}
// rising bubbles in the tub
export function makeBubbles(n = 70) {
  const g = new THREE.BufferGeometry(), r = rng(31), seed = Array.from({ length: n }, () => [r(), r(), r(), r()]);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const tex = canvasTex(64, 64, (x) => { x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 5; x.beginPath(); x.arc(32, 32, 24, 0, 7); x.stroke(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(24, 22, 6, 0, 7); x.fill(); });
  const m = new THREE.PointsMaterial({ map: tex, size: .035, transparent: true, depthWrite: false, color: 0xe8fbff });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false;
  // amt 0..1 controls how many are alive; src = [x,y,z] origin; top = water surface y
  pts.userData.update = (t, src, top, amt = 1, spread = .14) => { const a = g.attributes.position.array;
    for (let i = 0; i < n; i++) { const s = seed[i], life = ((t * (.55 + s[3] * .6) + s[2]) % 1), on = s[0] < amt;
      a[i * 3] = src[0] + (s[1] - .5) * spread + Math.sin(t * 4 + i) * .01; a[i * 3 + 1] = on ? Math.min(top - .005, src[1] + life * (top - src[1])) : -99; a[i * 3 + 2] = src[2] + (s[0] - .5) * spread * .7; }
    g.attributes.position.needsUpdate = true; };
  return pts;
}

// ---------------- the roll-top bathtub (rounded-rectangle bowl, rolled rim, claw feet, water)
const SE = (a, b, n = 3.2, k = 56) => Array.from({ length: k }, (_, i) => { const t = i / k * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); return [a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; });
function bowlGeo(L, W, H, k = 56) {
  // rings from rim (y=H) down to floor (y=0); the bowl narrows and rounds toward the bottom
  const rings = 9, pos = [], idx = [];
  for (let j = 0; j <= rings; j++) { const v = j / rings, y = H * (1 - v), sc = 1 - .2 * Math.pow(v, 1.6), sq = 1 - .08 * v;
    for (const [px, pz] of SE(L / 2 * sc, W / 2 * sc * sq, 3.2 - v * .6, k)) pos.push(px, y, pz); }
  for (let j = 0; j < rings; j++) for (let i = 0; i < k; i++) { const a = j * k + i, b = j * k + (i + 1) % k, c = a + k, d = b + k; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
export const TUB = { L: 1.55, W: .74, H: .6, foot: .1 };   // 5 ft long
const waterVS = `varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const waterFS = `uniform float t, rip, ripT, calm, op; uniform vec2 rc; uniform vec3 deep, shallow, hi; varying vec2 vP; varying vec3 vW;
void main(){ vec2 p = vP; float d = length(p - rc);
  float ring = rip * sin(d * 48. - (t - ripT) * 9.) * exp(-d * 3.) * exp(-max(0., t - ripT) * 1.1) * step(0., t - ripT);
  float idle = (sin(p.x * 13. + t * 1.3) * sin(p.y * 17. - t * 1.1)) * .5 * (1. - calm);
  float h = ring + idle * .25;
  float edge = smoothstep(.0, .5, length(p * vec2(1.4, 2.6)));
  vec3 c = mix(shallow, deep, .45 + edge * .4 + h * .3);
  float spec = smoothstep(.55, .95, sin((p.x + p.y * .6) * 22. + h * 6. + t * .6) * .5 + .5) * (.25 + abs(h) * 1.6);
  c += hi * spec * .5;
  gl_FragColor = vec4(c, op); }`;
export function makeTub(o = {}) {
  const G = new THREE.Group(), { L, W, H, foot } = TUB;
  const outerM = mat({ color: o.outer ?? 0x4f7466 }), enamel = mat({ color: 0xdcd8ce });
  const bowl = new THREE.Mesh(bowlGeo(L, W, H), outerM); bowl.position.y = foot; bowl.castShadow = true; bowl.receiveShadow = true; G.add(bowl); ink(bowl, { hull: true, edges: false, px: 4 });
  const inner = new THREE.Mesh(bowlGeo(L * .93, W * .88, H * .97), new THREE.MeshLambertMaterial({ color: 0xdcd8ce, side: THREE.BackSide })); inner.position.y = foot + H * .04; inner.receiveShadow = true; G.add(inner);
  const floorS = new THREE.Shape(SE(L * .93 * .4, W * .88 * .4 * .92, 2.6).map(([a, b]) => new THREE.Vector2(a, b)));
  const fl = new THREE.Mesh(new THREE.ShapeGeometry(floorS), enamel); fl.rotation.x = -Math.PI / 2; fl.position.y = foot + H * .04 + .005; G.add(fl);
  // rolled rim
  const rimPts = SE(L / 2 * .985, W / 2 * .985, 3.2, 72).map(([a, b]) => new THREE.Vector3(a, 0, b));
  const rimC = new THREE.CatmullRomCurve3(rimPts, true);
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimC, 140, .038, 10, true), mat({ color: 0xc9c3b7 })); rim.position.y = foot + H; rim.castShadow = true; G.add(rim); ink(rim, { hull: true, edges: false, px: 3.2 });
  // claw feet
  const footM = mat({ color: o.feet ?? 0xb79a52 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = group(); const ball = sph(.045, footM, { px: 2.2 }); ball.position.y = .045; f.add(ball);
    const leg = cyl(.03, .05, .1, footM, { px: 2.2 }); leg.position.y = .1; f.add(leg); f.position.set(sx * L * .36, 0, sz * W * .32); G.add(f); }
  // taps at the foot end (+x)
  const brass = mat({ color: 0xc9a660 });
  for (const sz of [-.09, .09]) { const tp = cyl(.018, .018, .14, brass, { px: 2 }); tp.position.set(L / 2 - .05, foot + H + .07, sz); G.add(tp); const hd = sph(.03, brass, { px: 2 }); hd.position.set(L / 2 - .05, foot + H + .15, sz); G.add(hd); }
  const spout = cyl(.02, .02, .16, brass, { px: 2 }); spout.rotation.z = Math.PI / 2; spout.position.set(L / 2 - .1, foot + H + .1, 0); G.add(spout);
  // water
  const wy = foot + H * (o.fill ?? .72);
  const wShape = new THREE.Shape(SE(L * .93 / 2 * .97, W * .88 / 2 * .96, 3.0).map(([a, b]) => new THREE.Vector2(a, b)));
  const wm = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, rip: { value: 0 }, ripT: { value: -9 }, rc: { value: new THREE.Vector2() }, calm: { value: 0 }, op: { value: .84 },
    deep: { value: new THREE.Color(0x0e3b40) }, shallow: { value: new THREE.Color(0x4f9a95) }, hi: { value: new THREE.Color(0xeaffff) } }, vertexShader: waterVS, fragmentShader: waterFS, transparent: true, depthWrite: false });
  const water = new THREE.Mesh(new THREE.ShapeGeometry(wShape, 24), wm); water.rotation.x = -Math.PI / 2; water.position.y = wy; water.renderOrder = 5; G.add(water);
  water.visible = o.water !== false;
  G.userData = { water, wy, rimY: foot + H, L, W,
    setWater(T, o2 = {}) { const u = wm.uniforms; u.t.value = T; u.rip.value = o2.rip ?? 0; u.ripT.value = o2.ripT ?? -9; u.rc.value.set(o2.rx ?? 0, o2.rz ?? 0); u.calm.value = o2.calm ?? 0; u.op.value = o2.op ?? .84; } };
  return G;
}

// ---------------- framed photo / paper props (canvas-drawn), all built to be framed whole
// sepia portrait of one or two characters, drawn with the real rig
export function portraitTex(keys, o = {}) {
  const W = o.w ?? 400, Hh = o.h ?? 520;
  return canvasTex(W, Hh, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h * .4, 20, w / 2, h / 2, h * .7); g.addColorStop(0, o.bg0 ?? '#d9c7a4'); g.addColorStop(1, o.bg1 ?? '#7d6448'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    keys.forEach((k, i) => { const c = new Char(k, .6); c.draw({ eyes: o.eyes ?? 'dot', mouth: o.mouth ?? (k.startsWith('smith') ? 'flat' : 'smile'), look: [0, 0], blink: 0, ...(o.pose || {}) }, 1.3);
      const sw = w * (keys.length > 1 ? .62 : .9), sh = sw * 1000 / 600, sx = keys.length > 1 ? (i ? w * .44 : -w * .06) : w * .05, sy = h * (o.y ?? .08);
      x.drawImage(c.cv, sx, sy, sw, sh); });
    // sepia tone + vignette
    const id = x.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; d[i] = Math.min(255, l * 1.08 + 18); d[i + 1] = l * .94 + 8; d[i + 2] = l * .74; }
    x.putImageData(id, 0, 0);
    const v = x.createRadialGradient(w / 2, h / 2, h * .25, w / 2, h / 2, h * .72); v.addColorStop(0, 'rgba(40,25,10,0)'); v.addColorStop(1, 'rgba(40,25,10,.65)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
    grain(x, w, h, 3000, .08);
    if (o.label) { x.fillStyle = 'rgba(245,238,220,.92)'; x.fillRect(w * .1, h * .86, w * .8, h * .1); x.strokeStyle = '#2a2018'; x.lineWidth = 3; x.strokeRect(w * .1, h * .86, w * .8, h * .1);
      x.fillStyle = '#2a1c14'; x.font = `800 ${Math.round(h * .055)}px Montserrat`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.label, w / 2, h * .912); }
  });
}
// a picture frame (stand-up or wall) with a texture; size = photo area
export function frame(tex, w, h, o = {}) {
  const G = new THREE.Group(), b = o.border ?? .05;
  const fr = box(w + b * 2, h + b * 2, .035, mat({ color: o.col ?? 0x5a3a24 }), { px: 3 }); G.add(fr);
  const ph = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: o.glow ?? .12 })); ph.position.z = .019; G.add(ph); G.userData.photo = ph;
  if (o.stand) { const leg = box(.03, h * .8, .03, mat({ color: o.col ?? 0x5a3a24 }), { px: 2 }); leg.position.set(0, -h * .1, -.12); leg.rotation.x = .5; G.add(leg); }
  return G;
}
// paper sheet lying flat (or standing) with a canvas texture
export function sheet(tex, w, h, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: o.glow ?? .1 }));
  m.receiveShadow = true; ink(m, { px: o.px ?? 2.4 }); if (o.flat !== false) m.rotation.x = -Math.PI / 2; return m;
}
const paperBase = (x, w, h, col = '#ece3cc') => { x.fillStyle = col; x.fillRect(0, 0, w, h); const g = x.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,20,.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h); grain(x, w, h, 4000, .05); };
const lines = (x, x0, y0, w, n, gap, a = .45, col = '#2a2018') => { x.globalAlpha = a; x.fillStyle = col; const r = rng(n * 7 + y0); for (let i = 0; i < n; i++) x.fillRect(x0, y0 + i * gap, w * (.6 + r() * .4), gap * .28); x.globalAlpha = 1; };
export function newspaperTex(head, sub, o = {}) {
  return canvasTex(768, 1024, (x, w, h) => {
    paperBase(x, w, h, '#e9e0c8'); x.fillStyle = '#1a1512'; x.textAlign = 'center';
    x.font = '900 60px Montserrat'; x.fillText('NEWS OF THE WORLD', w / 2, 96); x.fillRect(30, 116, w - 60, 8); x.font = '700 24px Montserrat'; x.fillText(o.date ?? 'LONDON · DECEMBER 1914 · ONE PENNY', w / 2, 152); x.fillRect(30, 166, w - 60, 3);
    x.fillStyle = o.headCol ?? '#1a1512'; x.font = `900 ${o.hs ?? 76}px Montserrat`; const hl = head.split('\n'); hl.forEach((l, i) => x.fillText(l, w / 2, 250 + i * (o.hs ?? 76) * 1.05));
    const yb = 250 + hl.length * (o.hs ?? 76) * 1.05; x.fillStyle = '#1a1512'; x.font = '700 30px Montserrat'; x.fillText(sub, w / 2, yb + 10); x.fillRect(30, yb + 34, w - 60, 3);
    // illustration box
    x.fillStyle = '#cfc4a8'; x.fillRect(50, yb + 60, w * .5, 330); x.strokeStyle = '#1a1512'; x.lineWidth = 4; x.strokeRect(50, yb + 60, w * .5, 330);
    if (o.art) o.art(x, 50, yb + 60, w * .5, 330);
    lines(x, w * .58, yb + 66, w * .36, 15, 22); lines(x, 50, yb + 420, w * .42, 14, 22); lines(x, w * .52, yb + 420, w * .42, 14, 22);
  });
}
export function tubSketch(x, X, Y, W, H, o = {}) {   // little engraving of a roll-top tub
  x.save(); x.translate(X + W / 2, Y + H * .62); x.strokeStyle = o.col ?? '#1a1512'; x.lineWidth = o.lw ?? 5; x.fillStyle = o.fill ?? '#efe7d2';
  const a = W * .38, b = H * .22; x.beginPath(); x.moveTo(-a, -b * .3); x.quadraticCurveTo(-a, b * 1.3, 0, b * 1.3); x.quadraticCurveTo(a, b * 1.3, a, -b * .3); x.closePath(); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(0, -b * .3, a, b * .45, 0, 0, 7); x.stroke(); x.fillStyle = '#7fb0b0'; x.beginPath(); x.ellipse(0, -b * .2, a * .9, b * .32, 0, 0, 7); x.fill();
  for (const sx of [-.7, .7]) { x.beginPath(); x.moveTo(a * sx, b * 1.05); x.lineTo(a * sx * 1.1, b * 1.6); x.stroke(); }
  x.restore();
}

// ---------------- shared lights helper
const spot = (G, col, I, pos, tgt, ang = .6, pen = .5, sh = true) => { const s = new THREE.SpotLight(col, I, 0, ang, pen, 1.3); s.position.set(...pos); s.target.position.set(...tgt); s.castShadow = sh; if (sh) { s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -.0006; s.shadow.radius = 4; } G.add(s, s.target); return s; };
function gasLamp(G, x, y, z, o = {}) {   // hanging gas pendant with glass globe and glow
  const brass = mat({ color: 0xb08a48 });
  const rod = cyl(.012, .012, o.rod ?? .9, brass, { px: 1.6 }); rod.position.set(x, y + (o.rod ?? .9) / 2 + .12, z); G.add(rod);
  const cap = cyl(.05, .09, .06, brass, { px: 2 }); cap.position.set(x, y + .12, z); G.add(cap);
  const globe = sph(.11, new THREE.MeshBasicMaterial({ color: 0xfff1cf }), { px: 2.2 }); globe.position.set(x, y, z); globe.castShadow = false; G.add(globe);
  const gl = glow(0xffcf80, o.glow ?? 1.6, .55); gl.position.set(x, y, z); G.add(gl);
  const L = new THREE.PointLight(0xffc887, o.I ?? 14, o.d ?? 11, 1.4); L.position.set(x, y - .15, z); L.castShadow = o.shadow ?? true; if (L.castShadow) { L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -.002; L.shadow.radius = 5; } G.add(L);
  return { L, globe, gl, parts: [rod, cap, globe, gl] };
}
function windowNight(G, x, y, z, w, h, ry = 0, o = {}) {
  const g = group(); const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(256, 384, (c, W, Hh) => { const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, o.top ?? '#0d1638'); gr.addColorStop(1, o.bot ?? '#2c3f78'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); const r = rng(3); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${r() * .7})`; c.fillRect(r() * W, r() * Hh * .7, 2, 2); }
    if (o.roofs) { c.fillStyle = '#0a0d1c'; let px = 0; c.beginPath(); c.moveTo(0, Hh); while (px < W) { const hh = Hh * (.62 + r() * .2); c.lineTo(px, hh); c.lineTo(px + 40, hh); px += 40; if (r() > .6) { c.fillRect(px - 20, hh - 30, 10, 30); } } c.lineTo(W, Hh); c.fill(); } }) }));
  g.add(sky);
  const fm = mat({ color: o.frame ?? 0xe8e2d4 });
  for (const [ww, hh, xx, yy] of [[w + .12, .08, 0, h / 2], [w + .12, .08, 0, -h / 2], [.08, h, -w / 2, 0], [.08, h, w / 2, 0], [.05, h, 0, 0], [w, .05, 0, h * .1]]) { const f = box(ww, hh, .08, fm, { px: 2.4 }); f.position.set(xx, yy, .03); g.add(f); }
  if (o.bars) for (let i = 1; i < 6; i++) { const b = cyl(.012, .012, h, mat({ color: 0x222228 }), { px: 1.4 }); b.position.set(-w / 2 + i * w / 6, 0, .07); g.add(b); }
  at(g, x, y, z, ry); G.add(g); return g;
}
function wallClock(G, x, y, z, r = .26, ry = 0) {
  const g = group(); const face = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mat({ map: canvasTex(256, 256, (c, w) => { c.fillStyle = '#f2ead6'; c.fillRect(0, 0, w, w); c.fillStyle = '#1a1512'; c.font = '700 26px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const n = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillText(n[i], 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); }
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; c.fillRect(128 + Math.sin(a) * 118 - 1, 128 - Math.cos(a) * 118 - 1, 3, 3); } }) }));
  g.add(face); const rimm = new THREE.Mesh(new THREE.TorusGeometry(r, .028, 10, 48), mat({ color: 0x4a3020 })); g.add(rimm); ink(rimm, { hull: true, edges: false, px: 2.4 });
  const hm = new THREE.MeshBasicMaterial({ color: 0x15110f });
  const hand = (len, wd) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, len), hm); m.position.y = len / 2 - .02; p.add(m); p.position.z = .01; g.add(p); return p; };
  const hh = hand(r * .55, .028), mh = hand(r * .82, .018);
  g.userData.set = (min) => { mh.rotation.z = -min / 60 * Math.PI * 2; hh.rotation.z = -min / 720 * Math.PI * 2; };
  at(g, x, y, z, ry); G.add(g); return g;
}
function chair(G, x, z, ry = 0, o = {}) {   // wooden chair; seat height .46
  const g = group(), wood = mat({ color: o.col ?? 0x5a3a26 });
  const seat = box(.46, .05, .44, wood, { px: 2.4 }); seat.position.y = .46; g.add(seat);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(.04, .46, .04, wood, { px: 2 }); l.position.set(sx * .2, .23, sz * .19); g.add(l); }
  const back = box(.46, .5, .04, wood, { px: 2.4 }); back.position.set(0, .74, -.2); g.add(back);
  at(g, x, 0, z, ry); G.add(g); return g;
}
function table(G, x, z, w, d, hgt = .76, o = {}) {
  const g = group(), wood = mat({ map: planksTex(o.col ?? '#5a3d2a', 6) });
  const top = box(w, .05, d, wood, { px: 3 }); top.position.y = hgt; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(.06, hgt, .06, mat({ color: 0x3e2a1c }), { px: 2 }); l.position.set(sx * (w / 2 - .06), hgt / 2, sz * (d / 2 - .06)); g.add(l); }
  at(g, x, 0, z); G.add(g); return g;
}


// ---------------- shared bits
function grassTex() { return canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#6fa04a'; x.fillRect(0, 0, w, h); const r = rng(14); for (let i = 0; i < 2600; i++) { x.fillStyle = r() > .5 ? 'rgba(140,190,90,.5)' : 'rgba(70,120,50,.45)'; x.fillRect(r() * w, r() * h, 2, 6 + r() * 6); } }, { repeat: [24, 24] }); }
function tilesTex(a = '#eef3f2', b = '#d9e6e6', n = 8, o = {}) { return canvasTex(512, 512, (x, w, h) => { const s = w / n, r = rng(o.seed || 6); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = shade((i + j) % 2 && o.check ? b : a, (r() - .5) * .05); x.fillRect(i * s, j * s, s, s); } x.strokeStyle = o.grout || 'rgba(120,150,150,.55)'; x.lineWidth = 3; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); } grain(x, w, h, 3000, .03); }, { repeat: o.repeat || [1, 1] }); }
function stripeTex(c1, c2, n = 8) { return canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? c2 : c1; x.fillRect(i * w / n, 0, w / n, h); } }); }
export function makeDrips(n = 60) {   // falling water drops (from a point or a line) + used on the balcony
  const g = new THREE.BufferGeometry(), r = rng(51), seed = Array.from({ length: n }, () => [r(), r(), r()]);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const tex = canvasTex(64, 64, (x) => { x.fillStyle = '#d9f4ff'; x.strokeStyle = '#17121c'; x.lineWidth = 5; x.beginPath(); x.moveTo(32, 6); x.quadraticCurveTo(54, 40, 32, 58); x.quadraticCurveTo(10, 40, 32, 6); x.fill(); x.stroke(); });
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: tex, size: .05, transparent: true, alphaTest: .3, color: 0xffffff })); pts.frustumCulled = false;
  pts.userData.update = (t, a, b, floorY) => { const p = g.attributes.position.array;
    for (let i = 0; i < n; i++) { const [s0, s1, s2] = seed[i], life = ((t * (.9 + s2 * .5) + s1) % 1), x0 = a[0] + (b[0] - a[0]) * s0, z0 = a[2] + (b[2] - a[2]) * s0, y0 = a[1] + (b[1] - a[1]) * s0;
      p[i * 3] = x0; p[i * 3 + 2] = z0; p[i * 3 + 1] = y0 - (y0 - floorY) * life * life; } g.attributes.position.needsUpdate = true; };
  return pts;
}

// =====================================================================================
// GROUNDS — the hospital garden: pool (x -4.5..4.5, z -2.5..1.5, water y -.18), deck, lawn, trees, the facade at z = -8
export const POOL = { x0: -4.5, x1: 4.5, z0: -2.5, z1: 1.5, wy: -.18, floor: -1.8 };
const poolWaterFS = `uniform float t; uniform vec3 rip[4]; uniform float op; varying vec2 vP; varying vec3 vW;
float caust(vec2 p){ p *= 2.2; float c = 0.; for (int i = 0; i < 3; i++) { p = vec2(p.x + sin(p.y * 1.7 + t * .6), p.y + sin(p.x * 1.3 - t * .5)); c += abs(sin(p.x * 2.1) * sin(p.y * 2.3)); } return c / 3.; }
void main(){ vec2 p = vW.xz; float h = 0.;
  for (int i = 0; i < 4; i++) { float d = length(p - rip[i].xy), a = t - rip[i].z; if (a > 0. && a < 6.) h += sin(d * 9. - a * 7.) * exp(-d * .9) * exp(-a * .7) * step(d, a * 1.6); }
  float c = caust(p + h * .3);
  vec3 col = mix(vec3(.04,.42,.56), vec3(.18,.7,.8), c * .55 + h * .25);
  float spec = smoothstep(.72, .98, c + h * .35) * .7;
  col += vec3(1.) * spec;
  gl_FragColor = vec4(col, op); }`;
export function buildGrounds() {
  const G = new THREE.Group(); G.name = 'grounds';
  const { x0, x1, z0, z1, wy, floor } = POOL;
  const grassM = mat({ map: grassTex() });   // lawn around the paved area (x -8..8, z -8..5.2) — never over the pool
  for (const [ax, bx, az, bz] of [[-70, -8, -70, 70], [8, 70, -70, 70], [-8, 8, 5.2, 70], [-8, 8, -70, -8]]) { const l = plane(bx - ax, bz - az, grassM); l.rotation.x = -Math.PI / 2; l.position.set((ax + bx) / 2, -.02, (az + bz) / 2); G.add(l); }
  // deck slabs around the pool hole (deck top y = 0)
  const deckM = mat({ map: tilesTex('#ece6da', '#e2dccd', 8, { repeat: [5, 5], grout: 'rgba(150,140,120,.5)' }) });
  const slab = (ax, bx, az, bz) => { const b = box(bx - ax, .3, bz - az, deckM, { px: 3, ink: false }); b.position.set((ax + bx) / 2, -.15, (az + bz) / 2); G.add(b); return b; };
  slab(-8, 8, z1, 5.2); slab(-8, 8, -7.95, z0); slab(-8, x0, z0, z1); slab(x1, 8, z0, z1);
  // coping (rounded white edge) — inked
  const copM = mat({ color: 0xf6f4ee });
  const cop = (w, d, x, z) => { const b = box(w, .07, d, copM, { px: 2.6 }); b.position.set(x, .035, z); G.add(b); };
  cop(x1 - x0 + .6, .3, 0, z1 + .15); cop(x1 - x0 + .6, .3, 0, z0 - .15); cop(.3, z1 - z0, x0 - .15, (z0 + z1) / 2); cop(.3, z1 - z0, x1 + .15, (z0 + z1) / 2);
  // basin walls + floor (aqua tiles, lane lines)
  const wallM = new THREE.MeshLambertMaterial({ map: tilesTex('#bfe6ea', '#a9dbe0', 8, { repeat: [6, 1.5], grout: 'rgba(60,120,140,.45)' }) });
  const bw = (w, h, x, y, z, ry) => { const p = plane(w, h, wallM); p.position.set(x, y, z); p.rotation.y = ry; G.add(p); };
  const dh = -floor; bw(x1 - x0, dh, 0, floor / 2, z0, 0); bw(x1 - x0, dh, 0, floor / 2, z1, Math.PI); bw(z1 - z0, dh, x0, floor / 2, (z0 + z1) / 2, Math.PI / 2); bw(z1 - z0, dh, x1, floor / 2, (z0 + z1) / 2, -Math.PI / 2);
  const fl = plane(x1 - x0, z1 - z0, new THREE.MeshLambertMaterial({ map: canvasTex(1024, 456, (x, w, h) => { x.fillStyle = '#a7dbe0'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,120,140,.4)'; x.lineWidth = 2; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } x.fillStyle = '#1f4f7a'; for (const y of [h * .3, h * .7]) { x.fillRect(60, y - 8, w - 120, 16); x.fillRect(40, y - 30, 16, 60); x.fillRect(w - 56, y - 30, 16, 60); } }) }));
  fl.rotation.x = -Math.PI / 2; fl.position.set(0, floor, (z0 + z1) / 2); G.add(fl);
  // water
  const rip = [0, 1, 2, 3].map(() => new THREE.Vector3(0, 0, -99));
  const wm = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, rip: { value: rip }, op: { value: .88 } }, vertexShader: `varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, fragmentShader: poolWaterFS, transparent: true, depthWrite: false });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0, 1, 1), wm); water.rotation.x = -Math.PI / 2; water.position.set(0, wy, (z0 + z1) / 2); water.renderOrder = 5; G.add(water);
  G.userData.water = water;
  G.userData.setWater = (T, rips = []) => { wm.uniforms.t.value = T; for (let i = 0; i < 4; i++) { const r = rips[i]; if (r) rip[i].set(r[0], r[1], r[2]); else rip[i].set(0, 0, -99); } };
  // "DEEP END" painted on the deck by the front edge (right half)
  const deepT = canvasTex(512, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#1f4f7a'; x.font = '900 70px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DEEP END', w / 2, h / 2 + 4); });
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .45), new THREE.MeshLambertMaterial({ map: deepT, transparent: true, depthWrite: false })); deep.rotation.x = -Math.PI / 2; deep.position.set(2.15, .072, z1 + .6); deep.scale.setScalar(.6); G.add(deep); G.userData.deep = deep;
  // pool ladder (shallow end, front edge)
  const chrome = mat({ color: 0xd8dde2 });
  const lad = group(); for (const sx of [-.24, .24]) { const pts = [new THREE.Vector3(sx, -1.2, -.12), new THREE.Vector3(sx, .1, -.12), new THREE.Vector3(sx, .65, -.05), new THREE.Vector3(sx, .7, .25), new THREE.Vector3(sx, .05, .4)]; const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .028, 8), chrome); ink(tb, { hull: true, edges: false, px: 2 }); lad.add(tb); }
  for (let i = 0; i < 3; i++) { const st = box(.48, .03, .1, chrome, { px: 1.6 }); st.position.set(0, -.25 - i * .3, -.12); lad.add(st); }
  at(lad, -3.2, 0, z1 - .02, Math.PI); G.add(lad); lad.rotation.y = 0; lad.position.z = z1 + .02; G.userData.ladder = lad;
  // lifebuoy on a post
  const lb = group(); const post = box(.08, 1.4, .08, mat({ color: 0xf2f0ea }), { px: 2 }); post.position.y = .7; lb.add(post);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.3, .08, 14, 32), new THREE.MeshLambertMaterial({ map: stripeTex('#e8352f', '#f6f4ee', 8) })); ring.position.set(0, 1.0, .08); ink(ring, { hull: true, edges: false, px: 2.6 }); lb.add(ring);
  at(lb, 5.6, 0, 2.3); G.add(lb);
  // CAUTION WET FLOOR sign (A-frame) where Harold slips
  const signT = canvasTex(256, 384, (x, w, h) => { x.fillStyle = '#f5c518'; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 24); x.fill(); x.strokeStyle = '#1c1a14'; x.lineWidth = 10; x.stroke(); x.fillStyle = '#1c1a14'; x.font = '900 46px Montserrat'; x.textAlign = 'center'; x.fillText('CAUTION', w / 2, 70);
    x.beginPath(); x.moveTo(w / 2, 100); x.lineTo(w / 2 + 70, 220); x.lineTo(w / 2 - 70, 220); x.closePath(); x.lineWidth = 10; x.stroke(); x.font = '900 70px Montserrat'; x.fillText('!', w / 2, 205); x.font = '800 36px Montserrat'; x.fillText('WET', w / 2, 290); x.fillText('FLOOR', w / 2, 336); });
  const sign = group(); for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.42, .64), new THREE.MeshLambertMaterial({ map: signT, side: THREE.DoubleSide })); p.position.set(0, .3, sd * .1); p.rotation.x = sd * .3; ink(p, { px: 2 }); sign.add(p); }
  at(sign, 1.25, 0, z1 + .95, .25); G.add(sign); G.userData.sign = sign;
  // loungers (seat height .42) + umbrella
  const lounger = (x, z, ry, col) => { const g = group(), fr = mat({ color: 0xf2f0ea }), cush = mat({ map: stripeTex(col, '#f6f4ee', 10) });
    const seat = box(.62, .08, 1.3, cush, { px: 2.2 }); seat.position.set(0, .42, .1); g.add(seat); const back = box(.62, .08, .8, cush, { px: 2.2 }); back.position.set(0, .7, -.78); back.rotation.x = -.95; g.add(back);
    for (const sx of [-.28, .28]) for (const sz of [-.45, .65]) { const l = box(.05, .4, .05, fr, { px: 1.6 }); l.position.set(sx, .2, sz); g.add(l); }
    at(g, x, 0, z, ry); G.add(g); return g; };
  G.userData.loungers = [lounger(-7.0, 4.3, 0, '#3f8fc0'), lounger(-5.2, 4.35, -.05, '#e0663a'), lounger(5.0, 4.4, .1, '#3f8fc0')];
  const umb = group(); const pole = cyl(.03, .03, 2.3, mat({ color: 0xf2f0ea }), { px: 1.8 }); pole.position.y = 1.15; umb.add(pole);
  const can = new THREE.Mesh(new THREE.ConeGeometry(1.25, .45, 12, 1, true), new THREE.MeshLambertMaterial({ map: stripeTex('#e0663a', '#f6f4ee', 12), side: THREE.DoubleSide })); can.position.y = 2.35; ink(can, { hull: true, edges: false, px: 2.6 }); umb.add(can);
  at(umb, -6.15, 0, 4.9); G.add(umb);
  // hedges + trees
  const hedgeM = mat({ color: 0x3f7a3a });
  const hedge = (w, d, x, z, h = 1.0) => { const b = box(w, h, d, hedgeM, { px: 3 }); b.position.set(x, h / 2, z); G.add(b); };
  hedge(.8, 12, -8.6, -1.5); hedge(.8, 12, 8.6, -1.5); hedge(6.5, .8, -5.6, 7.4); hedge(6.5, .8, 5.6, 7.4);
  const tree = (x, z, s = 1, col = 0x4f8f3e) => { const g = group(); const tr = cyl(.14 * s, .2 * s, 2.2 * s, mat({ color: 0x6a4a32 }), { px: 2.4 }); tr.position.y = 1.1 * s; g.add(tr);
    for (const [dx, dy, dz, r] of [[0, 3.0, 0, 1.25], [.7, 2.5, .2, .9], [-.7, 2.6, -.1, .95], [.1, 3.6, .1, .85]]) { const c = sph(r * s, mat({ color: col }), { px: 3 }); c.position.set(dx * s, dy * s, dz * s); g.add(c); }
    at(g, x, 0, z); G.add(g); return g; };
  [[-10.5, -4, 1.1], [10.8, -3.5, 1.15], [-11, 3.5, 1], [11.2, 4, 1.05], [-13, 9, 1.2], [13, 9.5, 1.2], [-6.5, 9.5, 1.1], [6.8, 10, 1], [0, 15.5, 1.25]].forEach(([x, z, s], i) => tree(x, z, s, [0x4f8f3e, 0x5a9a45, 0x467f38][i % 3]));
  // ---------- the facade (front face z = -8): cream plaster, mint trim, windows; the doctor's window is a real opening
  const plM = mat({ map: plasterTex('#efe6d0', { stains: true, repeat: [6, 2] }) }), trimM = mat({ color: 0x8fbfa8 });
  const FZ = -8, FD = 4, FH = 9.4, hole = { x0: -2.75, x1: -1.25, y0: 3.85, y1: 5.45 };
  const wall = (ax, bx, ay, by) => { const b = box(bx - ax, by - ay, FD, plM, { px: 3.2 }); b.position.set((ax + bx) / 2, (ay + by) / 2, FZ - FD / 2); G.add(b); };
  wall(-22, hole.x0, 0, FH); wall(hole.x1, 22, 0, FH); wall(hole.x0, hole.x1, 0, hole.y0); wall(hole.x0, hole.x1, hole.y1, FH);
  for (const y of [3.4, 6.6]) { const b = box(44, .14, .2, trimM, { px: 2.4 }); b.position.set(0, y, FZ + .08); G.add(b); }
  const roof = box(45, .5, 5.2, mat({ color: 0xa85a40 }), { px: 3.2 }); roof.position.set(0, FH + .25, FZ - 2); G.add(roof);
  const cornice = box(44.4, .3, .5, mat({ color: 0xf6f0e2 }), { px: 2.6 }); cornice.position.set(0, FH - .1, FZ + .15); G.add(cornice);
  // windows: 3 floors, every 2.6 m (skip the doctor's opening and the balcony door)
  const glassM = mat({ color: 0x2f4a5a }), frM = mat({ color: 0xf8f6f0 });
  const win = (x, y, w = 1.2, h = 1.5) => { const fr = box(w + .16, h + .16, .12, frM, { px: 2.4 }); fr.position.set(x, y, FZ + .04); G.add(fr); const gl = box(w, h, .14, glassM, { px: 2 }); gl.position.set(x, y, FZ + .05); G.add(gl);
    const bar = box(.05, h, .16, frM, { px: 1.4, ink: false }); bar.position.set(x, y, FZ + .06); G.add(bar); const sill = box(w + .3, .08, .25, frM, { px: 1.8 }); sill.position.set(x, y - h / 2 - .1, FZ + .12); G.add(sill); };
  for (let i = -7; i <= 7; i++) { const x = i * 2.6 - 2.0; for (const y of [1.7, 4.65, 7.8]) { if (y === 4.65 && (i === 0 || i === 2)) continue; if (y === 1.7 && i === 1) continue; win(x, y); } }
  // entrance (ground floor, i = 1 → x 0.6) with a sign
  const door = box(1.6, 2.4, .2, mat({ color: 0x5e8f7a }), { px: 3 }); door.position.set(.6, 1.2, FZ + .05); G.add(door);
  const signH = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .42), new THREE.MeshLambertMaterial({ map: canvasTex(768, 124, (x, w, h) => { x.fillStyle = '#f6f2e6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2f5a4a'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = '#2f5a4a'; x.font = '900 58px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HOSPITAL', w / 2, h / 2 + 3); }) })); signH.position.set(.6, 2.75, FZ + .08); ink(signH, { px: 2 }); G.add(signH);
  // the doctor's window: frame, half-raised blind, glass; a small lit room behind
  const room = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.6), new THREE.MeshLambertMaterial({ color: 0xd8c8a8, side: THREE.BackSide })); room.position.set((hole.x0 + hole.x1) / 2, 4.65, FZ - FD - .2); room.scale.set(1, 1, 1.6); G.add(room);
  const roomFill = box(2.4, 2.4, .1, mat({ map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#cdb98f'; x.fillRect(0, 0, w, h); x.fillStyle = '#6a4a32'; x.fillRect(20, 30, 110, 200); x.fillStyle = '#b8443a'; for (let i = 0; i < 7; i++) x.fillRect(28 + i * 14, 40, 10, 50); x.fillStyle = '#3f6a8a'; for (let i = 0; i < 7; i++) x.fillRect(28 + i * 14, 110, 10, 50); x.fillStyle = '#f2ecdc'; x.fillRect(160, 60, 70, 54); x.strokeStyle = '#6a4a32'; x.lineWidth = 6; x.strokeRect(160, 60, 70, 54); }) }), { px: 2, ink: false }); roomFill.position.set((hole.x0 + hole.x1) / 2, 4.6, FZ - 1.6); G.add(roomFill);
  const roomL = new THREE.PointLight(0xffe2b0, 3, 4, 1.5); roomL.position.set((hole.x0 + hole.x1) / 2, 5.0, FZ - .9); G.add(roomL);
  const hw = hole.x1 - hole.x0, hh = hole.y1 - hole.y0, hc = [(hole.x0 + hole.x1) / 2, (hole.y0 + hole.y1) / 2];
  for (const [w, h, x, y] of [[hw + .2, .12, hc[0], hole.y1], [hw + .2, .12, hc[0], hole.y0], [.12, hh, hole.x0, hc[1]], [.12, hh, hole.x1, hc[1]], [.05, hh, hc[0], hc[1]]]) { const f = box(w, h, .14, frM, { px: 2.2 }); f.position.set(x, y, FZ + .03); G.add(f); }
  const blind = box(hw - .1, .5, .04, mat({ map: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#efe8d2'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,100,70,.5)'; x.lineWidth = 3; for (let i = 0; i < h; i += 10) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }) }), { px: 2 }); blind.position.set(hc[0], hole.y1 - .32, FZ - .05); G.add(blind);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(hw, hh), new THREE.MeshLambertMaterial({ color: 0xbfe0ff, transparent: true, opacity: .18, depthWrite: false })); glass.position.set(hc[0], hc[1], FZ + .01); G.add(glass);
  const sillD = box(hw + .4, .1, .3, frM, { px: 2 }); sillD.position.set(hc[0], hole.y0 - .08, FZ + .12); G.add(sillD);
  G.userData.docWin = { x: hc[0], y: hc[1], z: FZ, floorY: hole.y0 - 1.05 };
  // the balcony (2nd floor, x 1.8..4.6): slab, railing, French door, washing line with towels
  const BX = 3.2, BY = 3.62, BZ0 = FZ, BZ1 = FZ + 1.5;
  const bslab = box(3.2, .18, 1.5, mat({ color: 0xece4d2 }), { px: 3 }); bslab.position.set(BX, BY - .09, (BZ0 + BZ1) / 2); G.add(bslab);
  const bdoor = box(1.4, 2.2, .12, glassM, { px: 2.4 }); bdoor.position.set(BX, BY + 1.1, FZ + .04); G.add(bdoor); const bdf = box(1.56, 2.36, .1, frM, { px: 2.4 }); bdf.position.set(BX, BY + 1.12, FZ + .02); G.add(bdf);
  const railM = mat({ color: 0xf6f4ee });
  const rtop = box(3.2, .07, .07, railM, { px: 1.8 }); rtop.position.set(BX, BY + 1.0, BZ1 - .04); G.add(rtop);
  for (const sx of [-1, 1]) { const rs = box(.07, .07, 1.5, railM, { px: 1.8 }); rs.position.set(BX + sx * 1.565, BY + 1.0, (BZ0 + BZ1) / 2); G.add(rs); }
  for (let i = 0; i <= 12; i++) { const b = cyl(.02, .02, 1.0, railM, { px: 1.2, seg: 6 }); b.position.set(BX - 1.55 + i * 3.1 / 12, BY + .5, BZ1 - .04); G.add(b); }
  for (const sx of [-1, 1]) for (let i = 1; i <= 4; i++) { const b = cyl(.02, .02, 1.0, railM, { px: 1.2, seg: 6 }); b.position.set(BX + sx * 1.565, BY + .5, BZ0 + i * .3); G.add(b); }
  const LY = BY + 1.95, LZ = FZ + .95, LXA = BX - 1.35, LXB = BX + 1.35;
  for (const x of [LXA, LXB]) { const p = cyl(.03, .03, 2.0, mat({ color: 0x8a8f96 }), { px: 1.6 }); p.position.set(x, BY + 1.0, LZ); G.add(p); const t = cyl(.025, .025, .3, mat({ color: 0x8a8f96 }), { px: 1.4 }); t.rotation.x = Math.PI / 2; t.position.set(x, LY, LZ); G.add(t); }
  const line = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, LXB - LXA, 6), mat({ color: 0xf0f0f0 })); line.rotation.z = Math.PI / 2; line.position.set(BX, LY - .02, LZ); G.add(line); ink(line, { hull: true, edges: false, px: 1.2 });
  const pin = () => { const g = group(); const a = box(.03, .1, .025, mat({ color: 0xc89a5a }), { px: 1.4 }); g.add(a); return g; };
  const hang = (x, w, h, tex, col = 0xffffff) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, color: col, side: THREE.DoubleSide, transparent: true, alphaTest: .3 })); m.position.set(x, LY - h / 2 - .02, LZ); ink(m, { px: 2 }); G.add(m); for (const sx of [-w * .38, w * .38]) { const p = pin(); p.position.set(x + sx, LY - .01, LZ + .02); G.add(p); } return m; };
  const towelT = (c) => canvasTex(128, 192, (x, w, h) => { x.fillStyle = '#f6f4ee'; x.fillRect(0, 0, w, h); x.fillStyle = c; x.fillRect(0, h * .75, w, h * .08); x.fillRect(0, h * .87, w, h * .04); grain(x, w, h, 900, .06); });
  const sockT = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#d23a3a'; x.beginPath(); x.moveTo(10, 0); x.lineTo(44, 0); x.lineTo(44, 80); x.quadraticCurveTo(62, 90, 60, 112); x.quadraticCurveTo(40, 128, 14, 110); x.lineTo(10, 0); x.fill(); x.fillStyle = '#f6f4ee'; x.fillRect(10, 0, 34, 14); });
  G.userData.laundry = [hang(LXA + .35, .55, .8, towelT('#3f8fc0')), hang(LXA + .85, .14, .28, sockT), hang(LXB - .35, .55, .8, towelT('#e0663a'))];
  G.userData.line = { y: LY, z: LZ, x: BX, xa: LXA, xb: LXB, floor: BY };
  G.userData.pins = [pin(), pin()]; G.userData.pins.forEach(p => { p.visible = false; G.add(p); });
  G.userData.drips = makeDrips(70); G.add(G.userData.drips); G.userData.drips.visible = false;
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(.32, 32), new THREE.MeshLambertMaterial({ color: 0x9fd4e6, transparent: true, opacity: .7, depthWrite: false })); puddle.rotation.x = -Math.PI / 2; puddle.scale.y = .6; puddle.position.set(BX, BY + .005, LZ); puddle.visible = false; G.add(puddle); G.userData.puddle = puddle;
  // sky + clouds + sun
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: canvasTex(64, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4a8ad8'); g.addColorStop(.42, '#8cc4f0'); g.addColorStop(.5, '#d6ecf6'); g.addColorStop(1, '#d6ecf6'); x.fillStyle = g; x.fillRect(0, 0, w, h); }), fog: false })); G.add(sky);
  const cloudT = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#ffffff'; for (const [cx, cy, r] of [[70, 80, 40], [120, 60, 52], [175, 78, 40], [100, 92, 34], [150, 95, 32]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } });
  const clouds = group(); for (const [x, y, z, s] of [[-30, 30, -90, 22], [25, 36, -100, 26], [60, 26, -80, 18], [-70, 34, -70, 20], [0, 44, -120, 30]]) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, fog: false })); c.position.set(x, y, z); c.scale.set(s, s / 2, 1); clouds.add(c); } G.add(clouds); G.userData.clouds = clouds;
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.1); sun.position.set(-14, 22, 14); sun.target.position.set(0, 0, -2); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -10, near: 1, far: 70 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0008; sun.shadow.radius = 3; G.add(sun, sun.target); G.userData.sun = sun;
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6a8a4a, 1.25); G.add(hemi); G.userData.hemi = hemi;
  scene.add(G); G.visible = false; return G;
}

// OFFICE — Dr. Bennett's office (x -3..3, z -2.5..2.5, h 3): desk, two chairs, couch, books, diplomas; window on the back wall
export function buildOffice(viewTex) {
  const G = new THREE.Group(); G.name = 'office';
  const floor = plane(10, 8, mat({ map: planksTex('#7a5234', 9, { repeat: [3, 3] }) })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const rug = plane(3.0, 2.2, mat({ map: canvasTex(512, 376, (x, w, h) => { x.fillStyle = '#3c5a7a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d8c48a'; x.lineWidth = 12; x.strokeRect(22, 22, w - 44, h - 44); x.strokeStyle = '#9a3a3a'; x.lineWidth = 8; x.strokeRect(48, 48, w - 96, h - 96); grain(x, w, h, 5000, .07); }) })); rug.rotation.x = -Math.PI / 2; rug.position.set(-.1, .004, .1); G.add(rug);
  const upM = mat({ map: plasterTex('#c9d8c0', { repeat: [3, 1] }) }), woodM = mat({ map: planksTex('#5a3a24', 12, { repeat: [3, 1] }) });
  const wallB = (w, x, z, ry, holeW = 0) => { const g = group(); const lo = box(w, 1.0, .1, woodM, { px: 3 }); lo.position.y = .5; g.add(lo); const hi = box(w, 2.0, .1, upM, { px: 3 }); hi.position.y = 2.0; g.add(hi); at(g, x, 0, z, ry); G.add(g); return g; };
  // back wall built around the window opening (x .55..2.05, y 1.0..2.5)
  const back = group(); const wx0 = .55, wx1 = 2.05, wy0 = 1.0, wy1 = 2.5;
  const bwall = (ax, bx, ay, by, m) => { const b = box(bx - ax, by - ay, .1, m, { px: 3 }); b.position.set((ax + bx) / 2, (ay + by) / 2, 0); back.add(b); };
  bwall(-3.2, 3.2, 0, 1.0, woodM); bwall(-3.2, wx0, 1.0, 3.0, upM); bwall(wx1, 3.2, 1.0, 3.0, upM); bwall(wx0, wx1, wy1, 3.0, upM);
  at(back, 0, 0, -2.5); G.add(back);
  wallB(5.2, -3.1, 0, Math.PI / 2);
  // right wall with a doorway (z .5..1.5, height 2.15)
  const rw = (z0, z1, y0, y1, m) => { const b = box(.1, y1 - y0, z1 - z0, m, { px: 3 }); b.position.set(3.1, (y0 + y1) / 2, (z0 + z1) / 2); G.add(b); };
  rw(-2.6, .5, 0, 1.0, woodM); rw(-2.6, .5, 1.0, 3.0, upM); rw(1.5, 2.6, 0, 1.0, woodM); rw(1.5, 2.6, 1.0, 3.0, upM); rw(.5, 1.5, 2.15, 3.0, upM);
  const ceil = plane(6.4, 5.2, mat({ color: 0xece6d8 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.0, 0); G.add(ceil);
  // window frame + view
  const frM = mat({ color: 0xf2eee4 });
  for (const [w, h, x, y] of [[1.7, .12, 1.3, wy1], [1.7, .12, 1.3, wy0], [.12, 1.5, wx0, 1.75], [.12, 1.5, wx1, 1.75], [.05, 1.5, 1.3, 1.75], [1.5, .05, 1.3, 1.95]]) { const f = box(w, h, .14, frM, { px: 2.2 }); f.position.set(x, y, -2.47); G.add(f); }
  const view = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), new THREE.MeshBasicMaterial({ map: viewTex })); view.position.set(1.3, 1.75, -3.6); G.add(view); G.userData.view = view;
  const sunIn = new THREE.SpotLight(0xfff0d0, 22, 12, .55, .6, 1.2); sunIn.position.set(2.2, 3.4, -4.0); sunIn.target.position.set(-.4, 0, 1.0); sunIn.castShadow = true; sunIn.shadow.mapSize.set(1024, 1024); sunIn.shadow.radius = 4; G.add(sunIn, sunIn.target);
  // desk (top y .78) facing +z, doctor's chair behind, patient's chair in front-left
  const desk = group(); const top = box(1.8, .07, .9, mat({ map: planksTex('#6a4228', 7) }), { px: 3 }); top.position.y = .76; desk.add(top);
  for (const sx of [-1, 1]) { const ped = box(.5, .72, .82, mat({ map: planksTex('#5a3820', 4) }), { px: 2.6 }); ped.position.set(sx * .62, .36, 0); desk.add(ped); }
  const modesty = box(.7, .5, .04, mat({ color: 0x4a2e1a }), { px: 2 }); modesty.position.set(0, .5, .38); desk.add(modesty);
  at(desk, .45, 0, -.55); G.add(desk); G.userData.desk = desk;
  const plate = box(.36, .09, .06, mat({ map: canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#2c2a26'; x.fillRect(0, 0, w, h); x.fillStyle = '#d9b860'; x.font = '800 30px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DR. BENNETT', w / 2, h / 2 + 2); }) }), { px: 1.6 }); plate.position.set(.25, .84, -.2); plate.rotation.x = -.4; G.add(plate);
  const lamp = group(); const lb2 = cyl(.07, .09, .04, mat({ color: 0xb08a48 }), { px: 1.6 }); lb2.position.y = .81; lamp.add(lb2); const ls = cyl(.012, .012, .32, mat({ color: 0xb08a48 }), { px: 1.2 }); ls.position.y = .97; lamp.add(ls);
  const shd = new THREE.Mesh(new THREE.CylinderGeometry(.06, .18, .14, 20, 1, true), mat({ color: 0x2f6a4a, side: THREE.DoubleSide })); shd.position.y = 1.15; ink(shd, { hull: true, edges: false, px: 2 }); lamp.add(shd); at(lamp, 1.15, 0, -.75); G.add(lamp);
  const dl = new THREE.PointLight(0xffd8a0, 2.2, 3, 1.5); dl.position.set(1.15, 1.05, -.7); G.add(dl);
  const files = box(.32, .06, .25, mat({ color: 0xc9a66a }), { px: 1.6 }); files.position.set(-.1, .82, -.75); files.rotation.y = .15; G.add(files);
  const phone = group(); const pb = box(.22, .08, .18, mat({ color: 0x1e1c1a }), { px: 1.6 }); pb.position.y = .83; phone.add(pb); const ph = box(.26, .05, .07, mat({ color: 0x1e1c1a }), { px: 1.4 }); ph.position.set(0, .9, 0); phone.add(ph); at(phone, -.25, 0, -.55, .3); G.add(phone);
  // the doctor's chair (seat .48) and the patient's chair (seat .46)
  const dch = group(), leather = mat({ color: 0x5a2a22 }); const ds = box(.6, .12, .55, leather, { px: 2.4 }); ds.position.y = .46; dch.add(ds); const db = box(.6, .8, .12, leather, { px: 2.4 }); db.position.set(0, .95, -.25); dch.add(db); const dp = cyl(.04, .04, .4, mat({ color: 0x222 }), { px: 1.4 }); dp.position.y = .2; dch.add(dp);
  at(dch, .45, 0, -1.25); G.add(dch); G.userData.docChair = dch;
  G.userData.patChair = chair(G, -.3, .5, .2, { col: 0x6a4a30 });
  // couch (psychiatrist's chaise) on the left wall, bookshelf, diplomas, plant, coat stand, door on the right wall
  const couch = group(), cm = mat({ color: 0x7a3a2a }); const cs = box(.8, .3, 2.0, cm, { px: 3 }); cs.position.y = .35; couch.add(cs); const cb = box(.8, .5, .3, cm, { px: 3 }); cb.position.set(0, .6, -.9); cb.rotation.x = -.35; couch.add(cb);
  for (const sz of [-.85, .85]) for (const sx of [-.32, .32]) { const l = cyl(.03, .02, .2, mat({ color: 0x2a1a10 }), { px: 1.4 }); l.position.set(sx, .1, sz); couch.add(l); } at(couch, -2.55, 0, .3); G.add(couch);
  const shelf = group(); const sh = box(1.4, 2.3, .38, mat({ map: planksTex('#5a3820', 3) }), { px: 3 }); sh.position.set(0, 1.15, 0); shelf.add(sh);
  const r = rng(8); for (let row = 0; row < 4; row++) { let bx = -.62; while (bx < .6) { const bwid = .05 + r() * .05, bh = .26 + r() * .1; const bk = box(bwid, bh, .26, mat({ color: [0x8a2a2a, 0x2a4a7a, 0x3a6a3a, 0xb08a48, 0x5a3a6a][(r() * 5) | 0] }), { px: 1.2 }); bk.position.set(bx + bwid / 2, .38 + row * .52 + bh / 2, .1); shelf.add(bk); bx += bwid + .01; } }
  at(shelf, -1.55, 0, -2.3); G.add(shelf);
  const dip = (x, y, t1) => { const f = frame(canvasTex(320, 240, (c, w, h) => { c.fillStyle = '#f4ecd6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b08a48'; c.lineWidth = 8; c.strokeRect(12, 12, w - 24, h - 24); c.fillStyle = '#2a2018'; c.font = '800 28px Montserrat'; c.textAlign = 'center'; c.fillText(t1, w / 2, 80); c.font = '600 18px Montserrat'; c.fillText('DOCTOR OF MEDICINE', w / 2, 120); c.fillStyle = '#b3262d'; c.beginPath(); c.arc(w / 2, 175, 22, 0, 7); c.fill(); }), .42, .32, { col: 0x2a1a10 }); f.position.set(x, y, -2.42); G.add(f); };
  dip(-.4, 2.2, 'DIPLOMA'); dip(-.4, 1.62, 'PSYCHIATRY');
  const pot = cyl(.18, .14, .36, mat({ color: 0xb06a40 }), { px: 2 }); pot.position.set(2.6, .18, -2.1); G.add(pot); for (const [dx, dy, s] of [[0, .62, .3], [.15, .5, .22], [-.15, .52, .24]]) { const lf = sph(s, mat({ color: 0x4f8f3e }), { px: 2.2 }); lf.position.set(2.6 + dx, dy, -2.1); G.add(lf); }
  const door = group(); const dslab = box(1.0, 2.15, .08, mat({ map: planksTex('#6a4228', 3) }), { px: 2.6 }); dslab.position.set(.5, 1.075, 0); door.add(dslab);
  const knob = sph(.035, mat({ color: 0xc9a660 }), { px: 1.4 }); knob.position.set(.88, 1.0, .06); door.add(knob);
  const dplate = new THREE.Mesh(new THREE.PlaneGeometry(.5, .14), new THREE.MeshLambertMaterial({ map: canvasTex(320, 90, (c, w, h) => { c.fillStyle = '#d9b860'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2018'; c.font = '800 26px Montserrat'; c.textAlign = 'center'; c.fillText('DR. R. BENNETT', w / 2, 38); c.font = '600 18px Montserrat'; c.fillText('CHIEF PSYCHIATRIST', w / 2, 70); }) })); dplate.position.set(.5, 1.6, .045); door.add(dplate);
  const dplateB = dplate.clone(); dplateB.position.z = -.045; dplateB.rotation.y = Math.PI; door.add(dplateB);
  at(door, 3.04, 0, .5, -Math.PI / 2); G.add(door); G.userData.door = door;
  const outside = plane(2.2, 2.6, new THREE.MeshLambertMaterial({ map: plasterTex('#e8eee4') })); outside.position.set(3.9, 1.3, 1.0); outside.rotation.y = -Math.PI / 2; G.add(outside);
  const amb = new THREE.HemisphereLight(0xf2f0ff, 0x6a5038, 1.15); G.add(amb); G.userData.amb = amb;
  const dust = makeDust(160, [4, 2.6, 3], 0xfff0d0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}
