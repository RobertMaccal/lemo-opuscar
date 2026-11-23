// Sets for "The Brides in the Bath": police-station bath room, the father's parlour, Neil's office,
// the dark evidence stage, the Old Bailey, Herne Bay at night. One shared roll-top bathtub model.
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

// =====================================================================================
// STATION — the bath room at Kentish Town police station, 1915 (x: -3.6..3.6, z: -2.8..3, y 0..3.4)
export function buildStation() {
  const G = new THREE.Group(); G.name = 'station';
  const floor = plane(12, 10, mat({ map: checkerTex('#d8cfbd', '#2b2b31', 8, { seed: 2 }), repeat: 0 })); floor.material.map.repeat.set(3, 2.5); floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping; floor.rotation.x = -Math.PI / 2; G.add(floor);
  const tileM = mat({ map: subwayTex('#4f7f6c', { repeat: [3, 1] }) }), plM = mat({ map: plasterTex('#cdbf9f', { stains: true, repeat: [2, 1] }) });
  const wall = (w, x, z, ry) => { const lo = box(w, 1.35, .1, tileM, { px: 3 }); lo.position.set(0, .675, 0); const hi = box(w, 2.15, .1, plM, { px: 3 }); hi.position.set(0, 2.425, 0); const trim = box(w, .07, .16, mat({ color: 0x2e3a34 }), { px: 2.4 }); trim.position.y = 1.36; const g = group(lo, hi, trim); at(g, x, 0, z, ry); G.add(g); return g; };
  wall(7.4, 0, -2.8, 0); wall(6, -3.65, .2, Math.PI / 2); wall(6, 3.65, .2, -Math.PI / 2);
  const ceil = plane(7.4, 6, mat({ color: 0x3a3430 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.5, .2); G.add(ceil);
  // pipes
  for (const y of [2.9, 3.0]) { const p = cyl(.03, .03, 7.3, mat({ color: 0x6b5a48 }), { px: 2 }); p.rotation.z = Math.PI / 2; p.position.set(0, y, -2.7); G.add(p); }
  // window (barred) on the back wall, door frame on the right wall
  windowNight(G, -1.6, 2.15, -2.74, 1.0, 1.3, 0, { bars: true, roofs: true, frame: 0x3b4a42 });
  const moon = spot(G, 0x8ea6ff, 6, [-1.6, 2.6, -3.6], [-.4, 0, .6], .55, .6, false);
  const door = group(); const df = mat({ color: 0x3a2a20 });
  for (const [w, h, x, y] of [[.12, 2.3, -.55, 1.15], [.12, 2.3, .55, 1.15], [1.22, .14, 0, 2.3]]) { const b = box(w, h, .16, df, { px: 2.6 }); b.position.set(x, y, 0); door.add(b); }
  const dark = plane(1, 2.24, new THREE.MeshBasicMaterial({ color: 0x07070a })); dark.position.set(0, 1.12, -.05); door.add(dark);
  at(door, 3.58, 0, 1.2, -Math.PI / 2); G.add(door);
  // the experiment tub, centre; head end at -x, foot end (taps) at +x
  const tub = makeTub({ fill: .74 }); tub.position.set(0, 0, 0); G.add(tub); G.userData.tub = tub;
  // the two other tubs brought to London, along the back wall
  const t2 = makeTub({ water: false, outer: 0x3b3b44 }); t2.position.set(1.6, 0, -2.15); G.add(t2); const t3 = makeTub({ water: false, outer: 0x5a3b30 }); t3.position.set(-1.45, 0, -2.15); t3.rotation.y = .04; G.add(t3);
  G.userData.tubs = [t2, t3];
  // table with notebook, watch, doctor's bag; chair; towel rail; bucket; clock; easel with diagram
  table(G, -2.6, 1.2, 1.1, .7);
  const bag = group(); const bb = box(.36, .22, .18, mat({ color: 0x2a1c18 }), { px: 2.4 }); bb.position.y = .11; bag.add(bb); const hdl = new THREE.Mesh(new THREE.TorusGeometry(.07, .012, 8, 16, Math.PI), mat({ color: 0x2a1c18 })); hdl.position.y = .23; bag.add(hdl); at(bag, -2.75, .785, 1.3, .3); G.add(bag);
  const note = sheet(canvasTex(256, 320, (x, w, h) => { paperBase(x, w, h, '#f0e8d4'); lines(x, 20, 40, w - 40, 10, 26, .5, '#2a3060'); }), .2, .26); note.position.set(-2.35, .79, 1.05); note.rotation.z = .2; G.add(note);
  G.userData.chair = chair(G, -2.4, 2.1, -.5);
  const rail = group(); const rm = mat({ color: 0xb08a48 }); for (const sx of [-.35, .35]) { const l = cyl(.015, .015, 1.0, rm, { px: 1.6 }); l.position.set(sx, .5, 0); rail.add(l); } const bar = cyl(.015, .015, .7, rm, { px: 1.6 }); bar.rotation.z = Math.PI / 2; bar.position.y = .95; rail.add(bar);
  const towel = box(.6, .5, .03, mat({ map: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#efe9de'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8434b'; x.fillRect(0, h * .78, w, h * .07); grain(x, w, h, 800, .08); }) }), { px: 2.2 }); towel.position.set(0, .72, .02); rail.add(towel);
  at(rail, 2.9, 0, 1.9, -Math.PI / 2); G.add(rail);
  const bucket = cyl(.16, .13, .3, mat({ color: 0x6d7378 }), { px: 2.2 }); bucket.position.set(1.3, .15, 1.15); G.add(bucket);
  G.userData.clock = wallClock(G, 1.6, 2.55, -2.73, .3);
  const easel = group(); const em = mat({ color: 0x4a3222 }); for (const sx of [-.45, .45]) { const l = box(.05, 1.9, .05, em, { px: 2 }); l.position.set(sx, .95, 0); l.rotation.z = -sx * .12; easel.add(l); } const lip = box(1.05, .05, .1, em, { px: 2 }); lip.position.set(0, .7, .05); easel.add(lip);
  at(easel, 2.6, 0, -.7, -.85); G.add(easel); G.userData.easel = easel;
  // lights
  G.userData.lamp = gasLamp(G, .2, 2.5, .55, { I: 9, d: 10, rod: .9 });
  G.userData.amb = new THREE.HemisphereLight(0x7f98b8, 0x2a2220, .55); G.add(G.userData.amb);
  G.userData.moon = moon;
  const dust = makeDust(260, [5, 3, 4]); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// PARLOUR — the father's sitting room, December 1914 (x -3..3, z -2.4..3)
export function buildParlour() {
  const G = new THREE.Group(); G.name = 'parlour';
  const floor = plane(10, 8, mat({ map: planksTex('#5a3b28', 10, { repeat: [3, 3] }) })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const rug = plane(3.2, 2.2, mat({ map: canvasTex(512, 352, (x, w, h) => { x.fillStyle = '#5c1e24'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a15a'; x.lineWidth = 10; x.strokeRect(20, 20, w - 40, h - 40); x.strokeStyle = '#2a3a5a'; x.lineWidth = 16; x.strokeRect(46, 46, w - 92, h - 92); x.fillStyle = '#c9a15a'; x.globalAlpha = .5; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(w / 2, h / 2, 40 + i * 30, 20 + i * 18, 0, 0, 7); x.lineWidth = 4; x.strokeStyle = '#c9a15a'; x.stroke(); } x.globalAlpha = 1; grain(x, w, h, 5000, .08); }) })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .004, .9); G.add(rug);
  const wpM = mat({ map: damaskTex('#2f4a3c', '#5f7d5e', { repeat: [4, 2] }) });
  const back = box(8, 3.4, .1, wpM, { px: 3 }); back.position.set(0, 1.7, -2.4); G.add(back);
  for (const sx of [-1, 1]) { const s = box(.1, 3.4, 6, wpM, { px: 3 }); s.position.set(sx * 3.6, 1.7, .5); G.add(s); }
  const dado = box(8, .9, .14, mat({ map: planksTex('#4a3020', 12) }), { px: 2.4 }); dado.position.set(0, .45, -2.33); G.add(dado);
  // fireplace + mantel
  const fp = group(); const stone = mat({ color: 0x3a3236 }), marble = mat({ color: 0xd9d2c6 });
  const surround = box(1.7, 1.25, .3, marble, { px: 3 }); surround.position.y = .625; fp.add(surround);
  const hole = box(.9, .8, .32, mat({ color: 0x0a0606 }), { px: 2.4 }); hole.position.set(0, .45, .02); fp.add(hole);
  const shelf = box(2.0, .08, .42, marble, { px: 2.6 }); shelf.position.set(0, 1.29, .04); fp.add(shelf);
  const fireT = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 100, 4, 64, 90, 70); g.addColorStop(0, '#fff2b0'); g.addColorStop(.4, '#ff9a30'); g.addColorStop(1, 'rgba(120,20,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const fire = new THREE.Mesh(new THREE.PlaneGeometry(.8, .6), new THREE.MeshBasicMaterial({ map: fireT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); fire.position.set(0, .35, .19); fp.add(fire);
  at(fp, -.6, 0, -2.2); G.add(fp);
  const fireL = new THREE.PointLight(0xff9440, 9, 6, 1.5); fireL.position.set(-.6, .5, -1.6); fireL.castShadow = true; G.add(fireL); G.userData.fireL = fireL; G.userData.fire = fire;
  // mantel items: clock, candles, ALICE'S PHOTO (the one that matters, big)
  const alice = frame(portraitTex(['alice'], { y: .06 }), .34, .44, { col: 0x3b2618, border: .045, stand: true, glow: .2 }); alice.position.set(-.25, 1.33 + .27, -2.05); alice.rotation.y = .12; G.add(alice); G.userData.alicePhoto = alice;
  const mclock = box(.3, .34, .14, mat({ color: 0x3a2416 }), { px: 2.4 }); mclock.position.set(-1.15, 1.5, -2.1); G.add(mclock);
  for (const cx of [.12, .3]) { const c = cyl(.025, .025, .22, mat({ color: 0xf0ead8 }), { px: 1.6 }); c.position.set(cx, 1.44, -2.08); G.add(c); const fl = glow(0xffc070, .18, .9); fl.position.set(cx, 1.58, -2.08); G.add(fl); }
  // armchair (wing chair) facing camera, right of the fireplace; seat height .46
  const ac = group(), velvet = mat({ color: 0x6a2a2e });
  const seat = box(.8, .16, .7, velvet, { px: 3 }); seat.position.y = .38; ac.add(seat);
  const backr = box(.8, .9, .16, velvet, { px: 3 }); backr.position.set(0, .9, -.3); ac.add(backr);
  for (const sx of [-1, 1]) { const arm = box(.14, .32, .7, velvet, { px: 2.6 }); arm.position.set(sx * .45, .6, 0); ac.add(arm); const wing = box(.12, .5, .25, velvet, { px: 2.6 }); wing.position.set(sx * .42, 1.12, -.25); ac.add(wing); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = cyl(.03, .02, .3, mat({ color: 0x2a1a10 }), { px: 1.8 }); l.position.set(sx * .34, .15, sz * .28); ac.add(l); }
  at(ac, 1.35, 0, -1.0, -.25); G.add(ac); G.userData.armchair = ac;
  // side table + oil lamp
  const st = group(); const stTop = cyl(.3, .3, .04, mat({ color: 0x3a2416 }), { px: 2.4 }); stTop.position.y = .66; st.add(stTop); const stLeg = cyl(.04, .06, .66, mat({ color: 0x3a2416 }), { px: 2 }); stLeg.position.y = .33; st.add(stLeg);
  const lampB = cyl(.07, .1, .22, mat({ color: 0x8a6a3a }), { px: 2 }); lampB.position.y = .79; st.add(lampB); const chimney = cyl(.045, .06, .26, new THREE.MeshBasicMaterial({ color: 0xffe9b8 }), { px: 1.8 }); chimney.position.y = 1.03; st.add(chimney);
  const lg = glow(0xffc070, .9, .7); lg.position.y = 1.02; st.add(lg);
  at(st, 2.15, 0, -.75); G.add(st);
  const lampL = new THREE.PointLight(0xffc27a, 7, 6, 1.4); lampL.position.set(2.15, 1.15, -.55); lampL.castShadow = true; lampL.shadow.radius = 5; G.add(lampL); G.userData.lampL = lampL;
  // window with curtains (left wall)
  windowNight(G, -3.54, 1.75, .3, 1.0, 1.4, Math.PI / 2, { roofs: true, frame: 0x3a2a20 });
  for (const dz of [-.75, .75]) { const cu = box(.06, 2.2, .45, mat({ color: 0x5a1e24 }), { px: 2.6 }); cu.position.set(-3.48, 1.6, .3 + dz); G.add(cu); }
  // wall pictures
  const art = frame(canvasTex(256, 192, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8a9aa8'); g.addColorStop(1, '#5a6a50'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#3a4a30'; x.beginPath(); x.moveTo(0, h * .7); x.quadraticCurveTo(w / 2, h * .45, w, h * .72); x.lineTo(w, h); x.lineTo(0, h); x.fill(); }), .6, .45, { col: 0xa08040 }); art.position.set(1.4, 2.25, -2.33); G.add(art);
  const amb = new THREE.HemisphereLight(0x5a6aa0, 0x2a1810, .45); G.add(amb); G.userData.amb = amb;
  const dust = makeDust(200, [5, 3, 4], 0xffd8a0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// OFFICE — Neil's desk at night (desk centre at (0, .78, 0); wall at z -1.6)
// map of England & Wales, rough outline (normalised 0..1 in a 300x420 box)
const GB = [[.52, .02], [.6, .06], [.56, .12], [.62, .17], [.58, .24], [.66, .3], [.7, .38], [.76, .46], [.82, .55], [.88, .6], [.86, .66], [.94, .72], [.9, .8], [.82, .84], [.74, .9], [.6, .92], [.46, .94], [.34, .97], [.2, .99], [.14, .95], [.26, .9], [.36, .86], [.3, .8], [.2, .78], [.12, .74], [.22, .68], [.3, .62], [.22, .56], [.3, .5], [.36, .44], [.4, .36], [.36, .3], [.4, .22], [.44, .14]];
export const PLACES = { london: [.78, .82], blackpool: [.44, .46], hernebay: [.9, .8] };
export function buildOffice() {
  const G = new THREE.Group(); G.name = 'office';
  const floor = plane(10, 8, mat({ map: planksTex('#4a3326', 9, { repeat: [3, 3] }) })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const wM = mat({ map: plasterTex('#7d8a74', { stains: true, repeat: [3, 1] }) });
  const back = box(8, 3.4, .1, wM, { px: 3 }); back.position.set(0, 1.7, -1.6); G.add(back);
  for (const sx of [-1, 1]) { const s = box(.1, 3.4, 6, wM, { px: 3 }); s.position.set(sx * 3.4, 1.7, 1.2); G.add(s); }
  const wain = box(8, 1.0, .14, mat({ map: planksTex('#3e2a1e', 14) }), { px: 2.4 }); wain.position.set(0, .5, -1.53); G.add(wain);
  // desk
  const desk = group(); const dtop = box(1.9, .06, .95, mat({ map: planksTex('#4d3020', 7) }), { px: 3 }); dtop.position.y = .78; desk.add(dtop);
  const leather = plane(1.3, .62, mat({ color: 0x2d4a35 })); leather.rotation.x = -Math.PI / 2; leather.position.set(0, .812, .02); desk.add(leather);
  for (const sx of [-1, 1]) { const ped = box(.5, .74, .85, mat({ map: planksTex('#4d3020', 4) }), { px: 2.6 }); ped.position.set(sx * .68, .38, 0); desk.add(ped); }
  G.add(desk);
  // green banker's lamp
  const bl = group(); const base = cyl(.08, .1, .04, mat({ color: 0xb08a48 }), { px: 1.8 }); base.position.y = .83; bl.add(base); const stem = cyl(.012, .012, .3, mat({ color: 0xb08a48 }), { px: 1.4 }); stem.position.y = .98; bl.add(stem);
  const shadeM = new THREE.Mesh(new THREE.CylinderGeometry(.06, .2, .12, 24, 1, true, 0, Math.PI), mat({ color: 0x1f6a40, side: THREE.DoubleSide })); shadeM.rotation.set(0, Math.PI / 2, Math.PI / 2); shadeM.position.y = 1.14; bl.add(shadeM); ink(shadeM, { hull: true, edges: false, px: 2 });
  at(bl, -.6, 0, -.25); G.add(bl);
  const dl = new THREE.SpotLight(0xffd28a, 14, 6, .95, .6, 1.3); dl.position.set(-.6, 1.1, -.2); dl.target.position.set(-.1, .78, .2); dl.castShadow = true; dl.shadow.radius = 5; G.add(dl, dl.target); G.userData.deskLight = dl;
  // the map of England on the wall (pins added in shots)
  const mapT = canvasTex(600, 840, (x, w, h) => {
    paperBase(x, w, h, '#e7dcc0'); x.fillStyle = '#b8c9c2'; x.fillRect(20, 20, w - 40, h - 40);
    x.fillStyle = '#e9dfc2'; x.strokeStyle = '#3a2e22'; x.lineWidth = 5; x.beginPath(); GB.forEach(([a, b], i) => { const px = 40 + a * (w - 80), py = 40 + b * (h - 80); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#3a2e22'; x.font = '900 40px Montserrat'; x.textAlign = 'center'; x.fillText('ENGLAND', w / 2, h - 30);
    x.font = '700 22px Montserrat'; const lab = (k, t, dx = 0, dy = -22) => { const [a, b] = PLACES[k]; x.fillText(t, 40 + a * (w - 80) + dx, 40 + b * (h - 80) + dy); };
    lab('london', 'LONDON', -30, 34); lab('blackpool', 'BLACKPOOL', -60, 6); lab('hernebay', 'HERNE BAY', -40, -30);
    grain(x, w, h, 4000, .06);
  });
  const mapM = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.68), new THREE.MeshLambertMaterial({ map: mapT, emissive: 0xffffff, emissiveMap: mapT, emissiveIntensity: .08 })); mapM.position.set(.95, 1.85, -1.54); ink(mapM, { px: 2.4 }); G.add(mapM); G.userData.map = mapM;
  G.userData.mapAt = (k) => { const [a, b] = PLACES[k]; return new THREE.Vector3(.95 - .6 + (40 + a * 520) / 600 * 1.2, 1.85 + .84 - (40 + b * 760) / 840 * 1.68, -1.52); };
  const pins = {}; for (const k of Object.keys(PLACES)) { const p = sph(.03, mat({ color: 0xc8202a }), { px: 1.8 }); p.position.copy(G.userData.mapAt(k)); p.position.z += .02; G.add(p); pins[k] = p; } G.userData.pins = pins;
  const strM = new THREE.LineBasicMaterial({ color: 0xc8202a });
  const str = (a, b) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([G.userData.mapAt(a).add(new THREE.Vector3(0, 0, .03)), G.userData.mapAt(b).add(new THREE.Vector3(0, 0, .03))]), strM); G.add(l); return l; };
  G.userData.strings = [str('london', 'blackpool'), str('london', 'hernebay')];
  const wall = wallClock(G, -1.5, 2.45, -1.54, .22);
  windowNight(G, -1.6, 1.8, -1.54, .8, 1.1, 0, { roofs: true, frame: 0x2a2a2a }); wall.position.set(2.15, 2.5, -1.54);
  // filing cabinet + files
  const cab = box(.55, 1.3, .55, mat({ color: 0x4a4a42 }), { px: 3 }); cab.position.set(-2.4, .65, -1.2); G.add(cab);
  for (let i = 0; i < 3; i++) { const f = box(.32, .04, .24, mat({ color: [0xc9a66a, 0xb8945a, 0xd0b27a][i] }), { px: 1.8 }); f.position.set(.62, .83 + i * .04, -.2 + i * .01); f.rotation.y = .1 * i; G.add(f); }
  const amb = new THREE.HemisphereLight(0x4a5a90, 0x1a1410, .5); G.add(amb); G.userData.amb = amb;
  const wallSpot = spot(G, 0xffe0a8, 10, [1.2, 3.2, 1.6], [.95, 1.8, -1.5], .45, .6, false); G.userData.wallSpot = wallSpot;
  const dust = makeDust(160, [3, 2.4, 2], 0xffe2b0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// STAGE — the dark evidence stage: black space, glossy floor, spotlights (contents switched by shots)
export function buildStage() {
  const G = new THREE.Group(); G.name = 'stage';
  const fl = plane(80, 80, new THREE.MeshStandardMaterial({ color: 0x101016, roughness: .35, metalness: .0 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; G.add(fl);
  const back = plane(80, 30, new THREE.MeshBasicMaterial({ color: 0x050508 })); back.position.set(0, 10, -30); G.add(back);
  // three tubs in a row with easels + portraits
  const row = group(); G.add(row); G.userData.row = row;
  const brides = [['bessieV', 'BESSIE · 1912', 0x5a3b30], ['alice', 'ALICE · 1913', 0x3b3b44], ['margaret', 'MARGARET · 1914', 0x2f4a44]];
  G.userData.three = brides.map(([k, lab, col], i) => {
    const x = (i - 1) * 2.3, t = makeTub({ outer: col, fill: .72 }); t.position.set(x, 0, 0); t.rotation.y = .0; row.add(t);
    const ea = group(), em = mat({ color: 0x3a2618 }); for (const sx of [-.32, .32]) { const l = box(.04, 1.75, .04, em, { px: 1.8 }); l.position.set(sx, .87, 0); l.rotation.z = -sx * .14; ea.add(l); } const back2 = box(.04, 1.6, .04, em, { px: 1.8 }); back2.position.set(0, .8, -.35); back2.rotation.x = .25; ea.add(back2);
    const lip = box(.8, .04, .08, em, { px: 1.8 }); lip.position.set(0, 1.0, .04); ea.add(lip);
    const ph = frame(portraitTex([k], { label: lab, y: .04 }), .52, .68, { col: 0x2a1a10, glow: .06 }); ph.position.set(0, 1.4, .06); ph.rotation.x = -.06; ea.add(ph);
    at(ea, x, 0, -1.05); row.add(ea);
    const L = spot(G, 0xfff0d8, 0, [x, 4.6, 1.4], [x, .4, -.3], .42, .55, true);
    const cnd = group(); const c = cyl(.03, .03, .22, mat({ color: 0xf2ecdc }), { px: 1.4 }); c.position.y = .11; cnd.add(c); const fl2 = glow(0xffc070, .25, .95); fl2.position.y = .26; cnd.add(fl2); const flame = sph(.02, new THREE.MeshBasicMaterial({ color: 0xfff1c0 }), { ink: false }); flame.position.y = .25; cnd.add(flame); at(cnd, x + .62, 0, .62); row.add(cnd);
    return { tub: t, easel: ea, light: L, candle: cnd, flame: fl2, x };
  });
  // the mugshot wall (height chart) for Smith and for Bessie's height
  const chart = group(); G.add(chart); G.userData.chart = chart;
  const chartT = canvasTex(512, 1024, (x, w, h) => { x.fillStyle = '#a8a294'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1a1512'; x.fillStyle = '#1a1512'; x.font = '800 30px Montserrat'; x.textAlign = 'left';
    for (let i = 0; i <= 84; i++) { const y = h - i / 84 * h; const big = i % 12 === 0, mid = i % 6 === 0; x.lineWidth = big ? 6 : 3; x.beginPath(); x.moveTo(0, y); x.lineTo(big ? w * .55 : mid ? w * .32 : w * .16, y); x.stroke(); if (big && i) x.fillText(`${i / 12} FT`, w * .6, y + 10); } grain(x, w, h, 3000, .05); });
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshLambertMaterial({ map: chartT })); ch.position.set(0, 1.2, -.9); chart.add(ch); ink(ch, { px: 2.4 });   // 7 ft = 2.134 m … scaled so 1 ft = 2.4/7 m
  G.userData.chartScale = 2.4 / 7;
  // tape measure along a tub (Bessie shot)
  const tapeT = canvasTex(1024, 64, (x, w, h) => { x.fillStyle = '#e8c23a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1512'; x.font = '800 30px Montserrat'; for (let i = 0; i <= 60; i++) { const px = i / 60 * w; x.fillRect(px, 0, 3, i % 12 === 0 ? h * .7 : i % 6 === 0 ? h * .45 : h * .25); if (i % 12 === 0 && i) x.fillText(`${i / 12} FT`, px - 60, h - 10); } });
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(1.55, .08), new THREE.MeshLambertMaterial({ map: tapeT, emissive: 0xffffff, emissiveMap: tapeT, emissiveIntensity: .25, side: THREE.DoubleSide })); tape.rotation.x = -Math.PI / 2; G.add(tape); G.userData.tape = tape; ink(tape, { px: 1.6 });
  // endless row of tubs with veils (ending)
  const endless = group(); G.add(endless); G.userData.endless = endless;
  const veilT = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * .3, 10, w / 2, h / 2, w * .6); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,.15)'); x.fillStyle = g; x.beginPath(); x.moveTo(w * .5, 10); x.quadraticCurveTo(w * .95, h * .3, w * .9, h - 10); x.lineTo(w * .1, h - 10); x.quadraticCurveTo(w * .05, h * .3, w * .5, 10); x.fill(); });
  for (let i = 0; i < 16; i++) for (const sx of [-1, 1]) { const t = makeTub({ outer: [0x2f4a44, 0x3b3b44, 0x5a3b30][(i + (sx > 0)) % 3], fill: .72 }); t.position.set(sx * 1.25, 0, -i * 2.6); t.rotation.y = Math.PI / 2; endless.add(t);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(.55, .75), new THREE.MeshBasicMaterial({ map: veilT, transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide })); v.position.set(sx * 1.25 + sx * .1, .9, -i * 2.6 - .5); v.rotation.y = -sx * .4; endless.add(v); }
  G.userData.fog = new THREE.FogExp2(0x07070c, .07);
  G.userData.aisle = [0, 1, 2, 3, 4].map(i => { const L = new THREE.PointLight(0xffe0b8, 0, 10, 1.4); L.position.set(0, 2.0, -1.5 - i * 5); G.add(L); return L; });
  G.userData.top = spot(G, 0xdfe6ff, 0, [0, 6, 2], [0, 0, -1], .5, .6, true);
  const amb = new THREE.HemisphereLight(0x303a5a, 0x08080c, .35); G.add(amb); G.userData.amb = amb;
  const dust = makeDust(300, [6, 4, 5], 0xd8e0ff); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// COURT — No. 1 Court at the Old Bailey (simplified): jury box left, judge bench back, dock right, clock
export function buildCourt() {
  const G = new THREE.Group(); G.name = 'court';
  const oak = mat({ map: planksTex('#5a3a22', 6, { repeat: [2, 1] }) }), oakD = mat({ map: planksTex('#3e2616', 8, { repeat: [3, 1] }) });
  const floor = plane(14, 12, mat({ map: planksTex('#3a2618', 12, { repeat: [3, 3] }) })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const back = box(12, 5, .12, oakD, { px: 3 }); back.position.set(0, 2.5, -3.5); G.add(back);
  for (const sx of [-1, 1]) { const s = box(.12, 5, 9, oakD, { px: 3 }); s.position.set(sx * 5.6, 2.5, .5); G.add(s); }
  // panels
  for (let i = -5; i <= 5; i++) { const p = box(.9, 1.6, .04, oak, { px: 2 }); p.position.set(i * 1.05, 1.0, -3.43); G.add(p); }
  // judge's bench (raised) + royal arms
  const bench = box(4.2, 1.6, 1.0, oak, { px: 3.2 }); bench.position.set(0, .8, -2.7); G.add(bench); const bTop = box(4.4, .08, 1.15, oakD, { px: 2.4 }); bTop.position.set(0, 1.64, -2.7); G.add(bTop);
  const dais = box(4.4, .5, 1.2, oakD, { px: 3 }); dais.position.set(0, .25, -3.2); G.add(dais);
  const arms = new THREE.Mesh(new THREE.CircleGeometry(.5, 40), new THREE.MeshLambertMaterial({ map: canvasTex(256, 256, (x, w) => { x.fillStyle = '#7a1a22'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.fillStyle = '#d9b860'; x.beginPath(); x.moveTo(128, 40); x.lineTo(196, 80); x.lineTo(186, 170); x.lineTo(128, 220); x.lineTo(70, 170); x.lineTo(60, 80); x.closePath(); x.fill(); x.fillStyle = '#7a1a22'; x.font = '900 70px Montserrat'; x.textAlign = 'center'; x.fillText('GR', 128, 160); }) }));
  arms.position.set(0, 3.6, -3.42); G.add(arms); ink(arms, { px: 2.4 });
  G.userData.clock = wallClock(G, -5.52, 2.85, .1, .34, Math.PI / 2);
  // jury box: two stepped rows on the left, facing +x
  const jb = group(); const r1 = box(3.4, .9, .9, oak, { px: 3 }); r1.position.set(0, .45, .6); jb.add(r1); const r2s = box(3.4, .62, 1.0, oakD, { px: 2.4 }); r2s.position.set(0, .31, -.4); jb.add(r2s); const r2 = box(3.4, 1.45, .12, oak, { px: 3 }); r2.position.set(0, .72, .05); jb.add(r2);
  at(jb, -3.6, 0, -.2, Math.PI / 2); G.add(jb); G.userData.jury = jb;
  // the dock on the right with brass rail
  const dock = group(); const dw = box(1.8, 1.1, .12, oak, { px: 3 }); dw.position.set(0, .55, .8); dock.add(dw); for (const sx of [-.9, .9]) { const sw = box(.12, 1.1, 1.6, oak, { px: 3 }); sw.position.set(sx, .55, 0); dock.add(sw); }
  const rail = cyl(.03, .03, 1.8, mat({ color: 0xc9a660 }), { px: 1.8 }); rail.rotation.z = Math.PI / 2; rail.position.set(0, 1.45, .8); dock.add(rail); for (const sx of [-.85, 0, .85]) { const p = cyl(.02, .02, .35, mat({ color: 0xc9a660 }), { px: 1.4 }); p.position.set(sx, 1.27, .8); dock.add(p); }
  at(dock, 3.3, 0, .4, -.5); G.add(dock); G.userData.dock = dock;
  // windows high up, light shafts
  for (const x of [-3, 0, 3]) windowNight(G, x, 4.2, -3.42, .9, .7, 0, { top: '#c8c4b8', bot: '#e8e2d0', frame: 0x3a2616 });
  const sun = spot(G, 0xfff0d0, 22, [0, 7, -6], [0, 0, 1], .6, .5, true); G.userData.sun = sun;
  G.userData.dockL = spot(G, 0xffe8c8, 0, [1.6, 4.8, 3.2], [3.3, 1.2, .4], .4, .5, true);
  const fill = new THREE.HemisphereLight(0xd8d0c0, 0x3a2a1c, .9); G.add(fill); G.userData.amb = fill;
  const dust = makeDust(300, [8, 4, 6], 0xfff0d0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// SEASIDE — Herne Bay at night, 1912: a terrace of houses facing the promenade and the sea
export function buildSeaside() {
  const G = new THREE.Group(); G.name = 'seaside';
  const road = plane(60, 30, mat({ map: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#2b2a30'; x.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${120 + r() * 60},${120 + r() * 60},${140 + r() * 60},.22)`; x.beginPath(); x.ellipse(r() * w, r() * h, 10 + r() * 14, 6 + r() * 8, 0, 0, 7); x.fill(); } }, { repeat: [10, 5] }) })); road.rotation.x = -Math.PI / 2; road.position.z = 3; G.add(road);
  const pave = box(40, .15, 2.4, mat({ map: checkerTex('#77736e', '#5a5753', 8, { repeat: [20, 1] }) }), { px: 2.4 }); pave.position.set(0, .075, -2.2); G.add(pave);
  const houses = [], r = rng(12);
  for (let i = -3; i <= 3; i++) {
    const h = group(), wcol = ['#d8cdb5', '#c9b8a0', '#d6c9b8', '#c2c6c8'][(i + 3) % 4], hw = 3.2;
    const body = box(hw, 7.2, 4, mat({ map: plasterTex(wcol, { stains: true, repeat: [1, 2], seed: 20 + i }) }), { px: 3.2 }); body.position.set(0, 3.6, -5.4); h.add(body);
    const roof = box(hw + .1, .3, 4.3, mat({ color: 0x2a2630 }), { px: 2.4 }); roof.position.set(0, 7.3, -5.4); h.add(roof);
    const chim = box(.5, 1.2, .5, mat({ color: 0x6a4a3a }), { px: 2.4 }); chim.position.set(hw * .3, 8, -6); h.add(chim);
    // bay window ground floor + two upstairs windows + door
    const bay = box(1.6, 2.0, .7, mat({ color: 0xe8e0d0 }), { px: 2.8 }); bay.position.set(-.6, 1.3, -3.1); h.add(bay);
    const wins = [];
    const mkW = (x, y, z, w, hh) => { const g2 = mat({ color: 0x0c1022 }); const gl = box(w, hh, .06, g2, { px: 2.4 }); gl.position.set(x, y, z); h.add(gl); const fr = box(.06, hh, .08, mat({ color: 0xece6d8 }), { px: 1.8 }); fr.position.set(x, y, z + .03); h.add(fr); wins.push(gl); return gl; };
    mkW(-.6, 1.35, -2.74, 1.3, 1.3); mkW(-.7, 4.6, -3.36, .9, 1.4); mkW(.8, 4.6, -3.36, .9, 1.4);
    const door = box(.8, 1.9, .08, mat({ color: ['#2a3a5a', '#5a1e24', '#2a4a3a'][(i + 3) % 3] }), { px: 2.4 }); door.position.set(.95, 1.1, -3.36); h.add(door);
    at(h, i * 3.3, 0, 0); G.add(h); houses.push({ g: h, wins });
  }
  G.userData.houses = houses;
  const litM = mat({ color: 0x2a1e18, emissive: 0xffb456, ei: 1.15 });
  G.userData.lightWindow = (hi, wi) => { houses[hi].wins[wi].material = litM; };
  // gas street lamps
  for (const x of [-6.5, 0, 6.5]) { const post = cyl(.06, .08, 3.2, mat({ color: 0x1e2a24 }), { px: 2 }); post.position.set(x, 1.6, .9); G.add(post); const head = box(.3, .4, .3, new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), { px: 2 }); head.position.set(x, 3.35, .9); G.add(head); const gl = glow(0xffc070, 1.8, .5); gl.position.set(x, 3.35, .9); G.add(gl);
    const L = new THREE.PointLight(0xffc27a, 8, 7, 1.5); L.position.set(x, 3.2, 1.0); G.add(L); }
  // promenade railing + sea + moon + pier
  for (let i = -20; i <= 20; i++) { const p = cyl(.03, .03, 1.0, mat({ color: 0xe2e2e2 }), { px: 1.4 }); p.position.set(i * .8, .5, 7.2); G.add(p); }
  const top = cyl(.03, .03, 32, mat({ color: 0xe2e2e2 }), { px: 1.4 }); top.rotation.z = Math.PI / 2; top.position.set(0, 1.0, 7.2); G.add(top);
  const sea = plane(200, 80, new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, vertexShader: `varying vec2 vU; varying vec3 vW; void main(){ vU = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float t; varying vec2 vU; varying vec3 vW; void main(){ float d = abs(vW.x + 10.); float glint = smoothstep(.75, 1., sin(vW.z*3. + t*1.5 + sin(vW.x*1.7)*2.)*.5+.5) * exp(-d*.12) * .9; vec3 c = mix(vec3(.04,.06,.14), vec3(.1,.14,.3), clamp((vW.z-8.)/40., 0., 1.)); gl_FragColor = vec4(c + vec3(.75,.8,1.)*glint, 1.); }` }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -.3, 48); G.add(sea); G.userData.sea = sea;
  const sky = plane(300, 120, new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#050a22'); g.addColorStop(.7, '#1a2a5c'); g.addColorStop(1, '#3a4a7a'); x.fillStyle = g; x.fillRect(0, 0, w, h); const r2 = rng(9); for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(255,255,255,${r2() * .8})`; x.fillRect(r2() * w, r2() * h * .6, 1.5, 1.5); } }) }));
  sky.position.set(0, 40, 90); sky.rotation.y = Math.PI; G.add(sky); const skyB = sky.clone(); skyB.position.set(0, 40, -40); skyB.rotation.y = 0; G.add(skyB);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshBasicMaterial({ color: 0xf2f0e0 })); moon.position.set(-10, 16, 85); moon.rotation.y = Math.PI; G.add(moon); const mg = glow(0xc8d4ff, 22, .5); mg.position.copy(moon.position); G.add(mg);
  const pier = group(); for (let i = 0; i < 30; i++) { const p = box(.2, 3, .2, mat({ color: 0x15151c }), { ink: false }); p.position.set(14, .5, 12 + i * 1.5); pier.add(p); } const deck = box(2, .2, 46, mat({ color: 0x15151c }), { ink: false }); deck.position.set(14, 2, 34); pier.add(deck); G.add(pier);
  const moonL = new THREE.DirectionalLight(0x9fb0ff, 1.1); moonL.position.set(-10, 16, 40); moonL.target.position.set(0, 0, -4); moonL.castShadow = true; moonL.shadow.camera.left = -20; moonL.shadow.camera.right = 20; moonL.shadow.camera.top = 15; moonL.shadow.camera.bottom = -5; moonL.shadow.mapSize.set(2048, 2048); G.add(moonL, moonL.target);
  const amb = new THREE.HemisphereLight(0x5a6aa8, 0x101018, .8); G.add(amb);
  scene.add(G); G.visible = false; return G;
}
