// The sets: snowy farm exterior, the Stube (kitchen), attic, barn, bedroom, evidence room.
import { THREE, scene, canvasTex, mat, box, cyl, sph, plane, at, group, ink, glow, blob, rng, dotTex, INK, noise } from './engine.js';
import { cowSprite } from './chars.js';

// ---------------- texture painters
function grain(x, w, h, n, a, seed = 1) { const r = rng(seed); x.globalAlpha = a; for (let i = 0; i < n; i++) { x.fillStyle = r() > .5 ? '#fff' : '#000'; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } x.globalAlpha = 1; }
export function planksTex(base, n = 8, o = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    const r = rng(o.seed || 3); x.fillStyle = base; x.fillRect(0, 0, w, h);
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      x.fillStyle = shade(base, (r() - .5) * .16); x.fillRect(i * bw, 0, bw, h);
      x.strokeStyle = shade(base, -.25); x.globalAlpha = .35; x.lineWidth = 2;
      for (let k = 0; k < 4; k++) { x.beginPath(); const gx = i * bw + bw * (.2 + r() * .6); x.moveTo(gx, 0); x.bezierCurveTo(gx + 6, h * .3, gx - 6, h * .6, gx + 3, h); x.stroke(); }
      x.globalAlpha = 1;
      if (o.knots) { x.fillStyle = shade(base, -.3); x.beginPath(); x.ellipse(i * bw + bw * r(), h * r(), 6, 12, 0, 0, 7); x.fill(); }
      if (o.cross) { const y = h * r(); x.strokeStyle = 'rgba(20,15,25,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(i * bw, y); x.lineTo(i * bw + bw, y); x.stroke(); }
    }
    x.strokeStyle = 'rgba(22,18,28,.85)'; x.lineWidth = 4;
    for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * bw, 0); x.lineTo(i * bw, h); x.stroke(); }
    if (o.nails) { x.fillStyle = 'rgba(20,20,25,.7)'; for (let i = 0; i < n; i++) for (const y of [h * .1, h * .9]) { x.beginPath(); x.arc(i * bw + bw / 2, y, 3, 0, 7); x.fill(); } }
    grain(x, w, h, 4000, .05);
  }, { repeat: o.repeat || [1, 1] });
}
function plasterTex(base, o = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h); const r = rng(o.seed || 9);
    for (let i = 0; i < 60; i++) { x.fillStyle = shade(base, (r() - .5) * .08); x.globalAlpha = .5; x.beginPath(); x.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    if (o.cracks) { x.strokeStyle = 'rgba(30,25,35,.5)'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { let px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - .5) * 50; py += r() * 40; x.lineTo(px, py); } x.stroke(); } }
    grain(x, w, h, 5000, .05);
  }, { repeat: o.repeat || [1, 1] });
}
function snowTex() {
  return canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#dfe8f6'; x.fillRect(0, 0, w, h); const r = rng(7);
    for (let i = 0; i < 160; i++) { x.fillStyle = r() > .5 ? 'rgba(170,190,230,.18)' : 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(r() * w, r() * h, 30 + r() * 120, 12 + r() * 40, r() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(255,255,255,${.4 + r() * .6})`; x.fillRect(r() * w, r() * h, 1.5, 1.5); }
  }, { repeat: [14, 14] });
}
function tileTex(base) {
  return canvasTex(256, 256, (x, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const g = x.createRadialGradient(i * s + s * .4, j * s + s * .35, 2, i * s + s / 2, j * s + s / 2, s * .7);
      g.addColorStop(0, shade(base, .25)); g.addColorStop(1, shade(base, -.2)); x.fillStyle = g; x.fillRect(i * s, j * s, s, s);
      x.strokeStyle = 'rgba(20,18,25,.9)'; x.lineWidth = 3; x.strokeRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(i * s + s / 2, j * s + s / 2, s * .25, 3.6, 5.2); x.stroke();
    }
  }, { repeat: [2, 3] });
}
export function shade(h, a) { const c = h.replace('#', ''); const v = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)).map(q => a >= 0 ? q + (255 - q) * a : q * (1 + a)); return `rgb(${v.map(q => Math.max(0, Math.min(255, q | 0))).join(',')})`; }
function labelTex(w, h, draw) { return canvasTex(w, h, draw); }

// ---------------- shared atmosphere: snow particles + dust motes
export function makeSnow(n = 1400, box = [30, 18, 30]) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), r = rng(11), seeds = new Float32Array(n);
  for (let i = 0; i < n; i++) { p[i * 3] = r(); p[i * 3 + 1] = r(); p[i * 3 + 2] = r(); seeds[i] = r(); }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ map: dotTex, size: .09, transparent: true, depthWrite: false, color: 0xeaf2ff, opacity: .95, sizeAttenuation: true });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false;
  pts.userData.update = (t, center, speed = 1, wind = .6) => {
    const a = g.attributes.position.array;
    for (let i = 0; i < n; i++) {
      const fall = (p[i * 3 + 1] - t * (.05 + seeds[i] * .04) * speed) % 1, y = ((fall + 1) % 1);
      const x = ((p[i * 3] + t * .01 * wind + Math.sin(t * .7 + seeds[i] * 30) * .004) % 1 + 1) % 1;
      a[i * 3] = center[0] + (x - .5) * box[0]; a[i * 3 + 1] = center[1] + (y - .35) * box[1]; a[i * 3 + 2] = center[2] + (p[i * 3 + 2] - .5) * box[2];
    }
    g.attributes.position.needsUpdate = true;
  };
  return pts;
}
export function makeDust(n = 300, box = [4, 3, 4], color = 0xffe2b0) {
  const g = new THREE.BufferGeometry(), r = rng(5), base = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) base[i] = r();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ map: dotTex, size: .025, transparent: true, depthWrite: false, color, opacity: .7, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false;
  pts.userData.update = (t, c) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3] = c[0] + (base[i * 3] - .5) * box[0] + Math.sin(t * .3 + i) * .08; a[i * 3 + 1] = c[1] + (((base[i * 3 + 1] + t * .01 * (i % 3 + 1)) % 1) - .5) * box[1]; a[i * 3 + 2] = c[2] + (base[i * 3 + 2] - .5) * box[2] + Math.cos(t * .25 + i) * .08; } g.attributes.position.needsUpdate = true; };
  return pts;
}
export function smokeColumn(color = 0x3a3f55) {
  const gr = new THREE.Group(), r = rng(21), parts = [];
  const tex = canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.6, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, opacity: .6 })); s.userData.seed = r(); gr.add(s); parts.push(s); }
  gr.userData.update = (t, amt = 1) => { parts.forEach((s, i) => { const k = ((t * .08 + i / parts.length) % 1); s.position.set(Math.sin(k * 5 + s.userData.seed * 6) * .4 * k + k * 2.2, k * 7, Math.cos(k * 4 + i) * .3 * k); const sc = .6 + k * 3.2; s.scale.set(sc, sc, 1); s.material.opacity = amt * .7 * Math.sin(Math.PI * Math.min(1, k * 1.2)); }); };
  return gr;
}

// ---------------- EXTERIOR: snow field, forest, farmstead
export function buildExterior() {
  const G = new THREE.Group(); G.name = 'ext';
  // sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x070b22) }, mid: { value: new THREE.Color(0x1a2a63) }, hor: { value: new THREE.Color(0x4a5c9e) }, warm: { value: new THREE.Color(0x6b4a7a) }, day: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform vec3 top, mid, hor, warm; uniform float day;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){ float y = vP.y; vec3 c = mix(hor, mid, smoothstep(0., .25, y)); c = mix(c, top, smoothstep(.25, .8, y));
        c = mix(c, warm, (1.-smoothstep(0., .12, y)) * .45 * smoothstep(-.2, 1., -vP.z));
        vec3 q = floor(vP*420.); float s = step(.9985, h(q)) * smoothstep(.05, .4, y) * (1.-day); c += s * vec3(.9,.95,1.)*1.6;
        gl_FragColor = vec4(c, 1.); }`
  }));
  sky.name = 'sky'; G.add(sky); G.userData.sky = sky;
  // moon
  const moon = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshBasicMaterial({ color: 0xf4f1e3, fog: false }));
  at(moon, -22, 72, -200); moon.lookAt(0, 0, 0); G.add(moon); const mg = glow(0x9fb4ff, 70, .55); mg.position.copy(moon.position); mg.material.fog = false; G.add(mg); G.userData.moon = [moon, mg];
  // ground (gently rolling)
  const gg = new THREE.PlaneGeometry(400, 400, 160, 160); gg.rotateX(-Math.PI / 2);
  const pa = gg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); const d = Math.hypot(x, z + 10); pa.setY(i, d < 30 ? 0 : (noise(x * .05) * noise(z * .04 + 3) * 2.5 + (d - 30) * .02)); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ map: snowTex(), color: 0xffffff })); ground.receiveShadow = true; G.add(ground);
  // forest (pines) — a wall of trees behind the farm (north = -z) and scattered around
  const pineGeo = [new THREE.ConeGeometry(1.6, 3.2, 9), new THREE.ConeGeometry(1.25, 2.6, 9), new THREE.ConeGeometry(.85, 2.0, 9)];
  const pineMat = new THREE.MeshLambertMaterial({ color: 0x1d3a4a }), snowCap = new THREE.MeshLambertMaterial({ color: 0xdde8f8 }), trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a26 });
  const r = rng(42); const trees = [];
  const addTree = (x, z, s) => {
    const t = new THREE.Group();
    const tr = cyl(.16, .22, 1.2, trunkMat, { seg: 8, px: 3 }); tr.position.y = .6; t.add(tr);
    pineGeo.forEach((g, i) => { const m = new THREE.Mesh(g, pineMat); m.position.y = 2.0 + i * 1.35; m.castShadow = true; ink(m, { hull: true, edges: false, px: 3.2 }); t.add(m);
      const c = new THREE.Mesh(new THREE.ConeGeometry(g.parameters.radius * .62, g.parameters.height * .42, 9), snowCap); c.position.y = m.position.y + g.parameters.height * .3; t.add(c); });
    t.position.set(x, 0, z); t.scale.setScalar(s); t.rotation.y = r() * 6; G.add(t); trees.push(t);
  };
  for (let i = 0; i < 150; i++) { const x = -70 + r() * 140, z = -48 - r() * 40; addTree(x, z, .9 + r() * .9); }
  for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = 45 + r() * 50; const x = Math.cos(a) * d, z = Math.sin(a) * d * .8 + 10; if (z < -40) continue; addTree(x, z, .8 + r() * .8); }
  // farmstead at origin: house (west) + barn/stable (east) under one long roof line
  const farm = buildFarm(); G.add(farm); G.userData.farm = farm;
  // footprints: from forest edge (0,-46) to the machine-room door (6.5, -4.2)
  const fp = buildFootprints([[-3, -47], [-2, -36], [1.5, -26], [3, -16], [5.6, -8], [6.4, -4.6]]); G.add(fp); G.userData.prints = fp;
  // signpost
  const sign = new THREE.Group();
  const post = box(.14, 2.2, .14, mat({ color: 0x5a4030 }), { px: 3 }); post.position.set(0, 1.1, -.12); sign.add(post);
  const board = box(1.9, .5, .08, mat({ map: labelTex(512, 136, (x, w, h) => { x.fillStyle = '#7a5a3e'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(20,15,20,.6)'; x.lineWidth = 3; for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(0, i * h / 3); x.lineTo(w, i * h / 3); x.stroke(); } x.fillStyle = '#f1e6cf'; x.font = '900 60px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HINTERKAIFECK', w / 2, h / 2 + 4); }) }), { px: 3 });
  board.position.set(.55, 1.85, 0); board.rotation.z = -.05; sign.add(board);
  const capSnow = box(1.95, .08, .14, mat({ color: 0xeef4ff }), { px: 2.5 }); capSnow.position.set(.55, 2.12, 0); capSnow.rotation.z = -.05; sign.add(capSnow);
  at(sign, -9, 0, 7, .35); G.add(sign); G.userData.sign = sign;
  // memorial cross (the ending) – hidden by default
  const memorial = new THREE.Group();
  const cm = mat({ color: 0x4a3a32 });
  const v = box(.22, 2.6, .18, cm, { px: 3.5 }); v.position.y = 1.3; const hbar = box(1.3, .2, .18, cm, { px: 3.5 }); hbar.position.y = 2.0; memorial.add(v, hbar);
  const roofl = box(.5, .06, .3, mat({ color: 0xeef4ff }), { px: 2.5 }); roofl.position.y = 2.64; memorial.add(roofl);
  memorial.visible = false; at(memorial, 3, 0, -6); G.add(memorial); G.userData.memorial = memorial;
  // lights
  const hemi = new THREE.HemisphereLight(0x7d8fd8, 0x1b2244, 1.25); G.add(hemi);
  const moonL = new THREE.DirectionalLight(0xa8bcff, 1.5); moonL.position.set(-30, 50, -40); moonL.castShadow = true;
  moonL.shadow.mapSize.set(2048, 2048); const sc = moonL.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 160; moonL.shadow.bias = -.0006; moonL.shadow.normalBias = .02;
  G.add(moonL); G.add(moonL.target); G.userData.lights = { hemi, moonL };
  // window light spill onto snow
  const spill = new THREE.PointLight(0xffa24a, 12, 14, 2); spill.position.set(-2.5, 1.8, 4.6); G.add(spill); G.userData.spill = spill;
  const snow = makeSnow(1800, [26, 16, 26]); G.add(snow); G.userData.snow = snow;
  const smoke = smokeColumn(0x2b3048); smoke.position.set(-3, 9.6, -.5); G.add(smoke); G.userData.smoke = smoke;
  scene.add(G); return G;
}
function buildFarm() {
  const F = new THREE.Group();
  const wallT = plasterTex('#e7e2d8', { cracks: true, repeat: [2, 1] }), woodT = planksTex('#6a4a35', 10, { repeat: [3, 1], knots: true }), roofT = planksTex('#3b3138', 12, { repeat: [3, 2] });
  const houseW = 9, houseD = 8, houseH = 5;
  const house = box(houseW, houseH, houseD, mat({ map: wallT }), { px: 4.5 }); house.position.set(-3.5, houseH / 2, 0); F.add(house);
  // timber base band
  const band = box(houseW + .04, .7, houseD + .04, mat({ map: planksTex('#5b4232', 6, { repeat: [4, 1] }) }), { px: 3.5 }); band.position.set(-3.5, .35, 0); F.add(band);
  const barn = box(10, 4.6, 8, mat({ map: woodT }), { px: 4.5 }); barn.position.set(6, 2.3, 0); F.add(barn);
  // long roof: two slanted slabs covering both
  const roofLen = 20.6, slope = .72, half = houseD / 2 + .6, rh = Math.tan(slope) * half;
  for (const sd of [-1, 1]) {
    const slab = new THREE.Group();
    const s = box(roofLen, .3, half / Math.cos(slope) + .2, mat({ map: roofT }), { px: 4.5 }); slab.add(s);
    const sn = box(roofLen + .1, .22, half / Math.cos(slope) + .25, mat({ color: 0xe9f0fb }), { px: 3.5 }); sn.position.y = .25; slab.add(sn);
    slab.position.set(1.2, houseH + rh / 2 + .05, sd * half / 2); slab.rotation.x = sd * slope; F.add(slab);
  }
  // gable triangles
  const triShape = new THREE.Shape(); triShape.moveTo(-houseD / 2, 0); triShape.lineTo(houseD / 2, 0); triShape.lineTo(0, rh); triShape.closePath();
  for (const gx of [-8.05, 11.05]) { const tg = new THREE.Mesh(new THREE.ShapeGeometry(triShape), mat({ map: gx < 0 ? wallT : woodT, side: THREE.DoubleSide })); tg.position.set(gx, houseH, 0); tg.rotation.y = Math.PI / 2; ink(tg, { px: 4 }); F.add(tg); }
  // gable vent (attic window) on west gable
  const vent = box(.06, .7, .9, mat({ color: 0x0b0d16 }), { px: 3 }); vent.position.set(-8.1, houseH + 1.4, 0); F.add(vent); F.userData.vent = vent;
  // chimney
  const ch = box(.9, 2.4, .9, mat({ map: plasterTex('#9c8f86') }), { px: 4 }); ch.position.set(-3, houseH + rh + .3, -.5); F.add(ch);
  // windows (front face z=+4)
  const winLit = mat({ color: 0x241c22, emissive: 0xffa448, ei: 1.05 }), winDark = mat({ color: 0x0c1020 });
  F.userData.windows = [];
  const mkWin = (x, y, z, ry = 0) => {
    const w = new THREE.Group(); const glass = box(1.1, 1.3, .08, winDark, { px: 3.5 }); w.add(glass);
    for (const [ww, hh, xx, yy] of [[1.3, .12, 0, .7], [1.3, .12, 0, -.7], [.12, 1.4, .6, 0], [.12, 1.4, -.6, 0], [.06, 1.3, 0, 0], [1.1, .06, 0, 0]]) { const f = box(ww, hh, .14, mat({ color: 0x3c2c26 }), { px: 2.6 }); f.position.set(xx, yy, .03); w.add(f); }
    const sill = box(1.4, .1, .3, mat({ color: 0xeef4ff }), { px: 2.6 }); sill.position.set(0, -.78, .12); w.add(sill);
    for (const sd of [-1, 1]) { const sh = box(.55, 1.4, .06, mat({ color: 0x3f5a4a }), { px: 2.6 }); sh.position.set(sd * .95, 0, .02); w.add(sh); }
    at(w, x, y, z, ry); F.add(w); F.userData.windows.push({ g: w, glass, lit: winLit, dark: winDark }); return w;
  };
  mkWin(-6, 2.8, 4.02); mkWin(-3.4, 2.8, 4.02); mkWin(-.8, 2.8, 4.02); mkWin(-6, 2.8, -4.02, Math.PI);
  // front door (house) and barn door
  const door = box(1.2, 2.2, .12, mat({ map: planksTex('#4b3326', 4) }), { px: 3.5 }); door.position.set(-1.3 + -1, 1.1, 4.05); F.add(door);
  const bdL = box(1.8, 3.4, .14, mat({ map: planksTex('#5a3628', 5, { nails: true }) }), { px: 4 }), bdR = bdL.clone();
  const bpL = new THREE.Group(); bdL.position.x = .9; bpL.add(bdL); bpL.position.set(4.2, 1.7, 4.08); F.add(bpL);
  const bpR = new THREE.Group(); bdR.position.x = -.9; bpR.add(bdR); bpR.position.set(7.8, 1.7, 4.08); F.add(bpR);
  F.userData.barnDoor = [bpL, bpR];
  const bglow = plane(3.5, 3.3, mat({ color: 0x1a0e08, emissive: 0xff9a40, ei: .9, emap: canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(w * .3, h * .3, 4, w * .4, h * .45, w * .8); g.addColorStop(0, '#fff'); g.addColorStop(.6, '#a85a20'); g.addColorStop(1, '#2a0e04'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) })); bglow.position.set(6, 1.7, 4.03); bglow.visible = false; F.add(bglow); F.userData.barnGlow = bglow;
  // machine-room side door (where the footprints end) on north face (z=-4)
  const md = box(1.0, 2.0, .12, mat({ map: planksTex('#463026', 4) }), { px: 3.5 }); md.position.set(6.4, 1.0, -4.07); F.add(md); F.userData.mdoor = md;
  // woodpile, fence posts
  for (let i = 0; i < 9; i++) { const p = box(.12, 1.1, .12, mat({ color: 0x4a3a30 }), { px: 2.6 }); p.position.set(-12 + i * 2.6, .55, 9); F.add(p); }
  const rail = box(21, .1, .08, mat({ color: 0x4a3a30 }), { px: 2.6 }); rail.position.set(-1.6, .9, 9); F.add(rail);
  const pile = box(2.4, 1.2, 1, mat({ map: planksTex('#7a5a40', 10, { cross: true }) }), { px: 3.5 }); pile.position.set(-9.4, .6, -2); F.add(pile);
  return F;
}
function buildFootprints(pts) {
  const tex = canvasTex(128, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const g = x.createRadialGradient(64, 150, 6, 64, 150, 70); g.addColorStop(0, 'rgba(70,90,160,.95)'); g.addColorStop(.7, 'rgba(110,130,200,.6)'); g.addColorStop(1, 'rgba(160,180,230,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(64, 150, 40, 90, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(60,78,150,.9)'; x.beginPath(); x.ellipse(64, 70, 30, 30, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 5; x.beginPath(); x.ellipse(64, 150, 40, 88, 0, 3.4, 5.9); x.stroke();
  });
  const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const geo = new THREE.PlaneGeometry(.28, .52); geo.rotateX(-Math.PI / 2);
  const G = new THREE.Group(); G.userData.list = [];
  // walk along polyline
  let total = 0; const segs = [];
  for (let i = 0; i < pts.length - 1; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(L); total += L; }
  const step = .62; let k = 0;
  for (let d = 0; d < total; d += step, k++) {
    let acc = 0, i = 0; while (i < segs.length - 1 && acc + segs[i] < d) { acc += segs[i]; i++; }
    const f = (d - acc) / segs[i], a = pts[i], b = pts[i + 1];
    const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f, ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const side = k % 2 ? 1 : -1, ox = Math.cos(ang) * .16 * side, oz = -Math.sin(ang) * .16 * side;
    const s = new THREE.Mesh(geo, m); s.position.set(x + ox, .035, z + oz); s.rotation.y = ang + Math.PI; G.add(s); G.userData.list.push({ m: s, d: d / total });
  }
  return G;
}

// ---------------- INTERIOR: the Stube (living room/kitchen) — room spans x -3..3, z -2.5..2.5, y 0..2.8
export function buildKitchen() {
  const G = new THREE.Group(); G.name = 'kitchen';
  const wallT = planksTex('#8a5f3e', 9, { repeat: [2, 1], knots: true }), floorT = planksTex('#5e4030', 7, { repeat: [3, 3], cross: true }), ceilT = planksTex('#4a3428', 8, { repeat: [3, 2] });
  const floor = plane(6, 5, mat({ map: floorT })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const ceil = plane(6, 5, mat({ map: ceilT })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.8; G.add(ceil); G.userData.ceil = ceil;
  const back = box(6, 2.8, .1, mat({ map: wallT }), { px: 4 }); back.position.set(0, 1.4, -2.55); G.add(back);
  const left = box(.1, 2.8, 5, mat({ map: wallT }), { px: 4 }); left.position.set(-3.05, 1.4, 0); G.add(left);
  const right = box(.1, 2.8, 5, mat({ map: wallT }), { px: 4 }); right.position.set(3.05, 1.4, 0); G.add(right);
  const front = box(6, 2.8, .1, mat({ map: wallT }), { px: 4 }); front.position.set(0, 1.4, 2.55); G.add(front); G.userData.front = front;
  // ceiling beams
  for (let i = -2; i <= 2; i++) { const b = box(.22, .22, 5, mat({ color: 0x3b2a22 }), { px: 3.5 }); b.position.set(i * 1.3, 2.68, 0); G.add(b); }
  // wainscot band
  const wain = box(6, .08, .12, mat({ color: 0x3f2b22 }), { px: 3 }); wain.position.set(0, 1.0, -2.48); G.add(wain);
  // window on back wall (night)
  const winG = new THREE.Group();
  const pane = box(1.0, 1.1, .05, mat({ color: 0x1c2a5c, emissive: 0x2a3d86, ei: .9 }), { px: 3 }); winG.add(pane);
  for (const [w, h, x, y] of [[1.2, .1, 0, .6], [1.2, .1, 0, -.6], [.1, 1.3, .55, 0], [.1, 1.3, -.55, 0], [.05, 1.1, 0, 0], [1.0, .05, 0, 0]]) { const f = box(w, h, .1, mat({ color: 0xd9d0c0 }), { px: 2.5 }); f.position.set(x, y, .03); winG.add(f); }
  at(winG, -1.6, 1.7, -2.48); G.add(winG); G.userData.window = pane;
  // tile stove (Kachelofen) in back-right corner
  const stove = box(1.1, 1.7, 1.1, mat({ map: tileTex('#3f6e5a') }), { px: 4 }); stove.position.set(2.3, .85, -1.8); G.add(stove);
  const stoveTop = box(1.2, .14, 1.2, mat({ color: 0x2c3a33 }), { px: 3 }); stoveTop.position.set(2.3, 1.75, -1.8); G.add(stoveTop);
  const fireDoor = box(.4, .3, .06, mat({ color: 0x1a1010, emissive: 0xff6a20, ei: 1.6 }), { px: 3 }); fireDoor.position.set(2.3, .45, -1.23); G.add(fireDoor); G.userData.fireDoor = fireDoor;
  const bench = box(.4, .45, 1.1, mat({ color: 0x5a4030 }), { px: 3 }); bench.position.set(1.55, .23, -1.8); G.add(bench);
  // table + benches + chairs
  const tableT = planksTex('#9a7050', 5);
  const top = box(2.2, .1, 1.1, mat({ map: tableT }), { px: 4 }); top.position.set(-.4, .82, -.2); G.add(top);
  for (const [x, z] of [[-1.35, -.65], [.55, -.65], [-1.35, .25], [.55, .25]]) { const l = box(.1, .78, .1, mat({ color: 0x5a3e2e }), { px: 3 }); l.position.set(x, .39, z); G.add(l); }
  const benchB = box(2.2, .08, .35, mat({ map: tableT }), { px: 3 }); benchB.position.set(-.4, .48, -1.1); G.add(benchB);
  const chair = new THREE.Group(); const cs = box(.45, .06, .45, mat({ color: 0x6a4a36 }), { px: 3 }); cs.position.y = .48; chair.add(cs);
  const cb = box(.45, .6, .06, mat({ color: 0x6a4a36 }), { px: 3 }); cb.position.set(0, .8, -.2); chair.add(cb);
  for (const [x, z] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) { const l = box(.05, .48, .05, mat({ color: 0x4a3426 }), { px: 2.5 }); l.position.set(x, .24, z); chair.add(l); }
  at(chair, 1.15, 0, -.2, -Math.PI / 2); G.add(chair); G.userData.chair = chair;
  // tableware: bread basket, plates, mug
  const basket = cyl(.22, .17, .14, mat({ color: 0xa07040 }), { px: 3 }); basket.position.set(-.6, .94, -.25); G.add(basket);
  const bread = sph(.15, mat({ color: 0xc8894a }), { seg: 16, px: 3 }); bread.scale.set(1.2, .6, .9); bread.position.set(-.6, 1.02, -.25); G.add(bread); G.userData.bread = bread;
  const crumbs = new THREE.Group(); const cr = rng(8); for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(.012 + cr() * .01, 6, 4), mat({ color: 0xb07a40 })); c.position.set(-.6 + (cr() - .5) * .5, .875, -.25 + (cr() - .5) * .4); crumbs.add(c); } crumbs.visible = false; G.add(crumbs); G.userData.crumbs = crumbs;
  for (const x of [-1.2, -.1, .4]) { const pl = cyl(.15, .12, .03, mat({ color: 0xe8e2d4 }), { px: 2.5 }); pl.position.set(x, .885, -.05); G.add(pl); }
  const mug = cyl(.06, .06, .12, mat({ color: 0x3f5a8a }), { px: 2.5 }); mug.position.set(.25, .93, .1); G.add(mug);
  const knife = new THREE.Group(); const kb = box(.22, .01, .04, mat({ color: 0xcfd6de }), { px: 2 }); const kh = box(.1, .025, .035, mat({ color: 0x3a2a20 }), { px: 2 }); kh.position.x = -.15; knife.add(kb, kh); at(knife, -.25, .885, -.45, .4); G.add(knife);
  // hanging oil lamp
  const lamp = new THREE.Group();
  const chain = cyl(.01, .01, .7, mat({ color: 0x222 }), { px: 2, edges: false }); chain.position.y = .35; lamp.add(chain);
  const shadeM = cyl(.08, .3, .18, mat({ color: 0x2f4a3c }), { px: 3 }); lamp.add(shadeM);
  const globe = sph(.11, mat({ color: 0xffe0a0, emissive: 0xffc070, ei: 1.3 }), { px: 3 }); globe.position.y = -.12; lamp.add(globe);
  lamp.position.set(-.4, 2.0, -.2); G.add(lamp); G.userData.lamp = lamp;
  const lampL = new THREE.PointLight(0xffa552, 22, 10, 1.5); lampL.position.set(-.4, 1.75, -.2); lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); lampL.shadow.bias = -.002; lampL.shadow.radius = 4; G.add(lampL); G.userData.lampL = lampL;
  const lampGlow = glow(0xffb060, 1.4, .8); lampGlow.position.set(-.4, 1.88, -.2); G.add(lampGlow); G.userData.lampGlow = lampGlow;
  const fireL = new THREE.PointLight(0xff6a2a, 2.5, 4, 2); fireL.position.set(2.3, .5, -1.0); G.add(fireL); G.userData.fireL = fireL;
  const amb = new THREE.HemisphereLight(0x7b8bcf, 0x3a2420, .55); G.add(amb); G.userData.amb = amb;
  const moonIn = new THREE.SpotLight(0x8aa0ff, 6, 8, .5, .6, 1); moonIn.position.set(-1.6, 2.2, -3.4); moonIn.target.position.set(-.8, 0, .4); G.add(moonIn, moonIn.target);
  // wall props: key board, clock, calendar, corner shelf with crucifix, pantry shelf w/ ham
  const kb2 = new THREE.Group();
  const kbBoard = box(.7, .3, .04, mat({ map: planksTex('#7a5232', 3) }), { px: 3 }); kb2.add(kbBoard);
  G.userData.keys = [];
  for (let i = 0; i < 3; i++) { const hook = cyl(.012, .012, .06, mat({ color: 0x222 }), { px: 1.8, edges: false }); hook.rotation.x = Math.PI / 2; hook.position.set(-.22 + i * .22, .05, .04); kb2.add(hook);
    const key = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 8, 16), mat({ color: 0x8a7a50 })); ring.position.y = -.03; const shaft = box(.012, .12, .01, mat({ color: 0x8a7a50 }), { px: 1.6 }); shaft.position.y = -.12; const bit = box(.035, .025, .01, mat({ color: 0x8a7a50 }), { px: 1.6 }); bit.position.set(.02, -.17, 0); key.add(ring, shaft, bit); ink(ring, { hull: true, edges: false, px: 1.8 });
    key.position.set(-.22 + i * .22, .05, .07); kb2.add(key); G.userData.keys.push(key); }
  // dust outline where the missing key hung
  const ghost = plane(.06, .2, new THREE.MeshBasicMaterial({ color: 0x3a2618, transparent: true, opacity: .55 })); ghost.position.set(0, -.07, .025); kb2.add(ghost);
  at(kb2, 3.0, 1.55, .9, -Math.PI / 2); G.add(kb2); G.userData.keyboard = kb2;
  // clock
  const clock = new THREE.Group(); const cf = cyl(.22, .22, .06, mat({ color: 0x4a3426 }), { px: 3 }); cf.rotation.x = Math.PI / 2; clock.add(cf);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.18, 32), mat({ map: canvasTex(256, 256, (x, w) => { x.fillStyle = '#efe6d2'; x.fillRect(0, 0, w, w); x.fillStyle = '#222'; x.font = '700 30px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; x.fillText(['I','II','III','IIII','V','VI','VII','VIII','IX','X','XI','XII'][i - 1], 128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); } }) }));
  face.position.z = .035; clock.add(face);
  const hh = box(.015, .1, .01, mat({ color: 0x111 }), { ink: false }), mh = box(.01, .15, .01, mat({ color: 0x111 }), { ink: false });
  const hp = new THREE.Group(); hh.position.y = .05; hp.add(hh); hp.position.z = .045; const mp = new THREE.Group(); mh.position.y = .07; mp.add(mh); mp.position.z = .05; clock.add(hp, mp);
  G.userData.clockHands = [hp, mp];
  at(clock, .9, 2.1, -2.48); G.add(clock);
  // calendar
  const calT = canvasTex(256, 340, (x, w, h) => { x.fillStyle = '#f3ecdc'; x.fillRect(0, 0, w, h); x.fillStyle = '#b3262d'; x.fillRect(0, 0, w, 84); x.fillStyle = '#fff'; x.font = '900 52px Montserrat'; x.textAlign = 'center'; x.fillText('MÄRZ', w / 2, 62); x.fillStyle = '#b3262d'; x.font = '800 34px Montserrat'; x.fillText('FREITAG', w / 2, 130); x.fillStyle = '#1a1520'; x.font = '900 150px Montserrat'; x.fillText('31', w / 2, 280); x.font = '700 30px Montserrat'; x.fillText('1922', w / 2, 326); });
  const cal = box(.34, .45, .02, mat({ map: calT }), { px: 3 }); at(cal, -2.98, 1.65, -1.2, Math.PI / 2); G.add(cal); G.userData.calendar = cal;
  // corner shelf (Herrgottswinkel)
  const shelf = box(.5, .05, .5, mat({ color: 0x5a3e2e }), { px: 2.5 }); shelf.position.set(-2.8, 2.0, -2.3); shelf.rotation.y = Math.PI / 4; G.add(shelf);
  const crossV = box(.04, .32, .03, mat({ color: 0x3a2a20 }), { px: 2.2 }), crossH = box(.18, .04, .03, mat({ color: 0x3a2a20 }), { px: 2.2 }); crossV.position.set(-2.78, 2.2, -2.28); crossH.position.set(-2.78, 2.26, -2.28); crossV.rotation.y = crossH.rotation.y = Math.PI / 4; G.add(crossV, crossH);
  // pantry shelf with hanging ham, right side front
  const pantry = new THREE.Group();
  const ps = box(1.0, .05, .4, mat({ color: 0x5a3e2e }), { px: 2.5 }); ps.position.y = 1.9; pantry.add(ps);
  const ham = sph(.17, mat({ color: 0x8a3b2c }), { px: 3 }); ham.scale.set(.8, 1.4, .8); ham.position.set(.1, 1.45, 0); pantry.add(ham);
  const hamCut = new THREE.Mesh(new THREE.CircleGeometry(.12, 20), mat({ color: 0xd88a7a })); hamCut.position.set(.1, 1.36, .14); hamCut.rotation.x = -.3; pantry.add(hamCut); hamCut.visible = false; pantry.userData.cut = hamCut;
  const string = cyl(.005, .005, .25, mat({ color: 0x222 }), { px: 1.5, edges: false }); string.position.set(.1, 1.78, 0); pantry.add(string);
  for (let i = 0; i < 3; i++) { const jar = cyl(.07, .07, .18, mat({ color: [0x8aa0b0, 0xc0a060, 0x9a6a50][i] }), { px: 2.4 }); jar.position.set(-.35 + i * .16, 2.02, 0); pantry.add(jar); }
  at(pantry, 2.7, 0, 1.2, -Math.PI / 2); G.add(pantry); G.userData.pantry = pantry;
  // door (front-left) for maid exit
  const doorG = new THREE.Group(); const dr = box(.9, 2.0, .08, mat({ map: planksTex('#5a3a2a', 4) }), { px: 3.5 }); dr.position.x = .45; doorG.add(dr); doorG.position.set(-2.4, 1.0, 2.5); G.add(doorG); G.userData.door = doorG;
  const dust = makeDust(350, [5, 2.6, 4.4]); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// ---------------- ATTIC: rafters over floorboards; trapdoor at (0,0,1.4)
export function buildAttic() {
  const G = new THREE.Group(); G.name = 'attic';
  const fl = planksTex('#6b4c38', 8, { repeat: [4, 4], cross: true });
  const floor = new THREE.Group();
  // floor with a hole for the trapdoor
  const f1 = box(8, .1, 4.0, mat({ map: fl }), { px: 3.5 }); f1.position.set(0, -.05, -1.2); floor.add(f1);
  const f2 = box(8, .1, 2.0, mat({ map: fl }), { px: 3.5 }); f2.position.set(0, -.05, 2.6); floor.add(f2);
  const f3 = box(3.6, .1, .8, mat({ map: fl }), { px: 3.5 }); f3.position.set(-2.2, -.05, 1.2); floor.add(f3);
  const f4 = box(3.6, .1, .8, mat({ map: fl }), { px: 3.5 }); f4.position.set(2.2, -.05, 1.2); floor.add(f4);
  G.add(floor);
  // hole interior glow (kitchen below)
  const below = plane(.8, .8, mat({ color: 0x120c0a, emissive: 0x7a3a14, ei: .9 })); below.rotation.x = -Math.PI / 2; below.position.set(0, -1.2, 1.2); G.add(below); G.userData.below = below;
  // ladder rails
  for (const sx of [-.28, .28]) { const r = box(.07, 1.6, .07, mat({ color: 0x5a4030 }), { px: 3 }); r.position.set(sx, -.2, 1.45); r.rotation.x = -.25; G.add(r); }
  // trapdoor leaf (open, leaning)
  const leaf = box(.8, .06, .8, mat({ map: planksTex('#5a3c2c', 4) }), { px: 3.2 }); leaf.position.set(0, .36, 1.95); leaf.rotation.x = 1.15; G.add(leaf);
  // rafters: A-frames along x
  const rafM = mat({ color: 0x4a3328 });
  for (let i = -4; i <= 4; i++) {
    for (const sd of [-1, 1]) { const r = box(.16, 4.4, .16, rafM, { px: 3.5 }); r.position.set(i * .95, 1.55, sd * 1.45); r.rotation.x = sd * .78; G.add(r); }
    const tie = box(.12, .12, 4.2, rafM, { px: 3 }); tie.position.set(i * .95, 2.2, 0); G.add(tie);
  }
  const ridge = box(8.6, .18, .18, rafM, { px: 3.5 }); ridge.position.set(0, 3.15, 0); G.add(ridge);
  // roof boards (underside) – two slanted planes, slightly gappy to let moonlight in
  const rb = planksTex('#3a2a24', 14, { repeat: [3, 1] });
  G.userData.roof = []; for (const sd of [-1, 1]) { const p = box(8.6, .06, 4.6, mat({ map: rb }), { px: 3.5, cast: true }); p.position.set(0, 1.62, sd * 1.62); p.rotation.x = sd * (Math.PI / 2 - .78); G.add(p); G.userData.roof.push(p); }
  // gable walls with a vent
  const gab = plasterTex('#5c4a40');
  const shape = new THREE.Shape(); shape.moveTo(-3.2, 0); shape.lineTo(3.2, 0); shape.lineTo(0, 3.2); shape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-.25, 1.4); hole.lineTo(.25, 1.4); hole.lineTo(.25, 2.1); hole.lineTo(-.25, 2.1); hole.closePath(); shape.holes.push(hole);
  for (const gx of [-4.1, 4.1]) { const g = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat({ map: gab, side: THREE.DoubleSide })); g.position.set(gx, 0, 0); g.rotation.y = Math.PI / 2; ink(g, { px: 3.5 }); g.castShadow = true; G.add(g); }
  // hay heaps, chest, crates, sacks
  const hayM = mat({ color: 0xb08a48 });
  for (const [x, z, s] of [[-2.8, -.9, 1.1], [-2.2, -1.4, .8], [2.6, -1.1, 1.2], [3.1, .4, .7]]) { const h = sph(.8, hayM, { seg: 14, px: 3.5 }); h.scale.set(s * 1.3, s * .55, s); h.position.set(x, 0, z); G.add(h); }
  const chest = box(1.0, .55, .55, mat({ map: planksTex('#5a3828', 4, { nails: true }) }), { px: 3.5 }); chest.position.set(-1.0, .28, -1.5); G.add(chest);
  const crate = box(.6, .6, .6, mat({ map: planksTex('#7a5a40', 4, { cross: true }) }), { px: 3.5 }); crate.position.set(1.4, .3, -1.6); crate.rotation.y = .3; G.add(crate);
  const crate2 = crate.clone(); crate2.position.set(1.7, .9, -1.5); crate2.rotation.y = -.2; G.add(crate2);
  for (const [x, z] of [[-3.3, 1.8], [-2.9, 2.2]]) { const s = sph(.3, mat({ color: 0x8a7a60 }), { seg: 12, px: 3 }); s.scale.set(1, 1.3, .9); s.position.set(x, .35, z); G.add(s); }
  // the hiding place: in the low eaves corner, behind two boards leaning against the roof slope
  const loose = new THREE.Group();
  const lb1 = box(.95, .05, .24, mat({ map: planksTex('#6b4c38', 1) }), { px: 3 }), lb2 = lb1.clone(); loose.add(lb1, lb2);
  loose.position.set(-3.0, 0, -2.3); G.add(loose); G.userData.loose = [lb1, lb2];
  const mattock = new THREE.Group();
  const handle = cyl(.03, .035, .95, mat({ color: 0x8a5a32 }), { px: 2.8 }); handle.rotation.z = Math.PI / 2; mattock.add(handle);
  const head = box(.1, .07, .44, mat({ color: 0x55575f }), { px: 2.8 }); head.position.x = .44; mattock.add(head);
  const blade = box(.07, .03, .16, mat({ color: 0x6a6c74 }), { px: 2.4 }); blade.position.set(.44, -.01, -.29); blade.rotation.y = .3; mattock.add(blade);
  const stain = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), mat({ color: 0x3a1210 })); stain.rotation.x = -Math.PI / 2; stain.position.set(.44, .03, 0); mattock.add(stain);
  mattock.position.set(-3.0, .03, -2.7); mattock.rotation.y = .15; G.add(mattock); G.userData.mattock = mattock;
  // lights: lantern (moves with Andreas), moonlight shaft through west vent
  const lant = new THREE.PointLight(0xffa04a, 20, 9, 1.5); lant.castShadow = true; lant.shadow.mapSize.set(1024, 1024); lant.shadow.bias = -.002; lant.position.set(0, .9, 1.3); G.add(lant); G.userData.lant = lant;
  const moon = new THREE.SpotLight(0x7f97ff, 22, 12, .22, .6, 1); moon.position.set(-4.6, 1.75, 0); moon.target.position.set(-2.6, 0, .8); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); G.add(moon, moon.target); G.userData.moon = moon;
  const beamTex = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); const g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, w, h); });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.22, .6, 2.6, 16, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, color: 0x8aa2ff, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.set(-3.5, 1.1, .3); beam.rotation.z = Math.PI / 2 - .45; beam.rotation.x = .25; G.add(beam); G.userData.beam = beam;
  const amb = new THREE.HemisphereLight(0x5a6ac0, 0x2a1a14, .6); G.add(amb); G.userData.amb = amb;
  const dust = makeDust(500, [7, 3, 4], 0xffe6c0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// ---------------- BARN / STABLE: x -4..4, z -3..3, big door at z=+3
export function buildBarn() {
  const G = new THREE.Group(); G.name = 'barn';
  const wall = planksTex('#5e4232', 10, { repeat: [3, 1], nails: true, knots: true });
  const floor = plane(9, 7, mat({ map: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#5a4a3a'; x.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 900; i++) { x.strokeStyle = `rgba(${200 + r() * 40},${160 + r() * 40},${80 + r() * 30},.7)`; x.lineWidth = 2; const px = r() * w, py = r() * h, a = r() * 6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 20, py + Math.sin(a) * 20); x.stroke(); } }, { repeat: [3, 3] }) }));
  floor.rotation.x = -Math.PI / 2; G.add(floor);
  for (const [w, d, x, z] of [[9, .12, 0, -3.5], [.12, 7, -4.5, 0], [.12, 7, 4.5, 0]]) { const b = box(w, 4, d, mat({ map: wall }), { px: 4 }); b.position.set(x, 2, z); G.add(b); }
  // front wall with door opening (door 2.6 wide)
  for (const sx of [-1, 1]) { const b = box(3.2, 4, .12, mat({ map: wall }), { px: 4 }); b.position.set(sx * 2.9, 2, 3.5); G.add(b); }
  const lintel = box(2.6, .9, .12, mat({ map: wall }), { px: 4 }); lintel.position.set(0, 3.55, 3.5); G.add(lintel);
  const dL = new THREE.Group(), dR = new THREE.Group();
  const leafM = mat({ map: planksTex('#4e3022', 5, { nails: true }) });
  const lL = box(1.3, 3.1, .1, leafM, { px: 4 }); lL.position.x = .65; dL.add(lL); dL.position.set(-1.3, 1.55, 3.5);
  const lR = box(1.3, 3.1, .1, leafM, { px: 4 }); lR.position.x = -.65; dR.add(lR); dR.position.set(1.3, 1.55, 3.5);
  for (const l of [lL, lR]) { const zb = box(1.2, .12, .04, mat({ color: 0x2e1e16 }), { px: 2.5 }); zb.position.set(0, 0, .07); zb.rotation.z = .9; l.add(zb); }
  G.add(dL, dR); G.userData.doors = [dL, dR];
  // outside light plane (moonlit snow) beyond door
  const outside = plane(14, 7, mat({ color: 0x2a3a70, emissive: 0x5a70c0, ei: .8 })); outside.position.set(0, 2.2, 7.5); outside.rotation.y = Math.PI; G.add(outside); G.userData.outside = outside;
  // roof beams
  for (let i = -3; i <= 3; i++) { const b = box(.2, .2, 7, mat({ color: 0x3b2a22 }), { px: 3.5 }); b.position.set(i * 1.3, 3.9, 0); G.add(b); }
  const ceil = plane(9, 7, mat({ map: planksTex('#3a2a24', 12, { repeat: [3, 2] }) })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4; G.add(ceil);
  // stalls (left side) with cows
  const cowT = cowSprite(); G.userData.cows = [];
  for (let i = 0; i < 3; i++) {
    const z = -2.4 + i * 1.7;
    const rail = box(.08, .08, 1.5, mat({ color: 0x6a4a36 }), { px: 2.8 }); rail.position.set(-2.2, 1.0, z + .6); G.add(rail);
    const div = box(2.2, 1.2, .08, mat({ map: planksTex('#6a4a36', 5) }), { px: 3 }); div.position.set(-3.4, .6, z - .25); G.add(div);
    const cow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.33), new THREE.MeshLambertMaterial({ map: cowT, alphaTest: .4, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: cowT, emissiveIntensity: .12 }));
    cow.position.set(-3.3, .72, z + .6); cow.rotation.y = Math.PI / 2 * (i % 2 ? 1 : 1); cow.scale.x = i % 2 ? -1 : 1; G.add(cow); G.userData.cows.push(cow);
    const trough = box(.5, .35, 1.3, mat({ map: planksTex('#5a3c2c', 3) }), { px: 3 }); trough.position.set(-2.0, .18, z + .6); G.add(trough);
    const hayIn = sph(.4, mat({ color: 0xc09a50 }), { seg: 10, px: 2.5 }); hayIn.scale.set(.5, .25, 1.4); hayIn.position.set(-2.0, .38, z + .6); G.add(hayIn);
  }
  // hay bales + loose hay (right side)
  const baleM = mat({ map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#c4a057'; x.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 500; i++) { x.strokeStyle = `rgba(${150 + r() * 80},${110 + r() * 60},40,.8)`; x.lineWidth = 2; const px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 18, py + (r() - .5) * 6); x.stroke(); } x.strokeStyle = '#5a3c20'; x.lineWidth = 6; x.beginPath(); x.moveTo(w * .3, 0); x.lineTo(w * .3, h); x.moveTo(w * .7, 0); x.lineTo(w * .7, h); x.stroke(); }) });
  for (const [x, y, z, ry] of [[3.4, .35, -2.6, 0], [3.4, .35, -1.6, .05], [3.4, 1.05, -2.1, -.05], [2.4, .35, -2.7, .4]]) { const b = box(1.1, .7, .9, baleM, { px: 3.5 }); b.position.set(x, y, z); b.rotation.y = ry; G.add(b); }
  const fork = new THREE.Group(); const fh = cyl(.025, .025, 1.6, mat({ color: 0x7a5a3a }), { px: 2.5 }); fh.position.y = .8; fork.add(fh); for (const dx of [-.06, 0, .06]) { const tine = cyl(.008, .008, .3, mat({ color: 0x555 }), { px: 1.8, edges: false }); tine.position.set(dx, 1.72, 0); fork.add(tine); }
  fork.position.set(3.0, 0, .6); fork.rotation.z = .25; G.add(fork);
  // hanging lantern
  const lan = new THREE.Group(); const lg = sph(.1, mat({ color: 0xffe0a0, emissive: 0xffb050, ei: 2.4 }), { px: 3 }); lan.add(lg); const lt = cyl(.04, .1, .08, mat({ color: 0x2a2a2a }), { px: 2.5 }); lt.position.y = .12; lan.add(lt);
  lan.position.set(1.2, 2.6, .2); G.add(lan); G.userData.lantern = lan;
  const L = new THREE.PointLight(0xffa04a, 24, 11, 1.5); L.position.set(1.2, 2.45, .2); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -.002; G.add(L); G.userData.L = L;
  const gl = glow(0xffb060, 1.2, .8); gl.position.copy(lan.position); G.add(gl); G.userData.glow = gl;
  const amb = new THREE.HemisphereLight(0x6070b0, 0x2a1d14, .7); G.add(amb); G.userData.amb = amb;
  const day = new THREE.SpotLight(0xdfe6ff, 0, 14, .7, .5, 1); day.position.set(0, 2.2, 6); day.target.position.set(0, .5, -1); G.add(day, day.target); G.userData.day = day;
  const dust = makeDust(400, [8, 3.6, 6], 0xffe0b0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// ---------------- BEDROOM: crib + bed + moonlit window; x -2..2, z -2..2
export function buildBedroom() {
  const G = new THREE.Group(); G.name = 'bedroom';
  const wallT = plasterTex('#7a6a80', { repeat: [2, 1] });
  const floor = plane(4.4, 4.4, mat({ map: planksTex('#4e3a2e', 6, { repeat: [2, 2] }) })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  for (const [w, d, x, z] of [[4.4, .1, 0, -2.2], [.1, 4.4, -2.2, 0], [.1, 4.4, 2.2, 0]]) { const b = box(w, 2.6, d, mat({ map: wallT }), { px: 4 }); b.position.set(x, 1.3, z); G.add(b); }
  const ceil = plane(4.4, 4.4, mat({ color: 0x3a3040 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.6; G.add(ceil);
  // window
  const win = new THREE.Group(); const pane = box(.8, .9, .05, mat({ color: 0x24346a, emissive: 0x3c54a8, ei: 1 }), { px: 3 }); win.add(pane);
  for (const [w, h, x, y] of [[1, .08, 0, .5], [1, .08, 0, -.5], [.08, 1.08, .45, 0], [.08, 1.08, -.45, 0], [.05, .9, 0, 0], [.8, .05, 0, 0]]) { const f = box(w, h, .1, mat({ color: 0xd0c8b8 }), { px: 2.5 }); f.position.set(x, y, .03); win.add(f); }
  at(win, .6, 1.6, -2.14); G.add(win);
  // crib with slats
  const crib = new THREE.Group(); const cm = mat({ color: 0xcaa880 });
  const base = box(1.2, .08, .7, cm, { px: 3 }); base.position.y = .45; crib.add(base);
  for (const sx of [-.6, .6]) for (const sz of [-.35, .35]) { const p = box(.07, .95, .07, cm, { px: 2.8 }); p.position.set(sx, .47, sz); crib.add(p); }
  for (const sz of [-.35, .35]) { const rail = box(1.2, .06, .06, cm, { px: 2.6 }); rail.position.set(0, .92, sz); crib.add(rail); for (let i = 0; i < 9; i++) { const s = box(.035, .45, .035, cm, { px: 2 }); s.position.set(-.5 + i * .125, .68, sz); crib.add(s); } }
  const blanket = box(1.05, .14, .6, mat({ color: 0x8fa9c8 }), { px: 3 }); blanket.position.set(.1, .55, 0); crib.add(blanket);
  const pillow = box(.3, .12, .45, mat({ color: 0xece6da }), { px: 2.6 }); pillow.position.set(-.38, .56, 0); crib.add(pillow);
  const toy = new THREE.Group(); const tb = sph(.08, mat({ color: 0x9a6a40 }), { px: 2.4 }); tb.scale.set(1.3, 1, 1); toy.add(tb); const th = sph(.055, mat({ color: 0x9a6a40 }), { px: 2.4 }); th.position.set(.1, .07, 0); toy.add(th); toy.position.set(.4, .68, .12); crib.add(toy);
  crib.position.set(.4, 0, -1.4); G.add(crib); G.userData.crib = crib;
  // mobile above crib
  const mob = new THREE.Group(); const bar = box(.5, .02, .02, mat({ color: 0x333 }), { px: 1.8 }); mob.add(bar);
  for (let i = 0; i < 4; i++) { const s = sph(.05, mat({ color: [0xe0b040, 0xc05a5a, 0x5a8ac0, 0xe8e0d0][i] }), { px: 2 }); s.position.set(-.22 + i * .15, -.2 - (i % 2) * .08, 0); mob.add(s); }
  mob.position.set(.4, 1.7, -1.4); G.add(mob); G.userData.mobile = mob;
  // maid's bed (right)
  const bed = box(1.0, .45, 2.0, mat({ color: 0x5a4434 }), { px: 3.5 }); bed.position.set(-1.5, .23, -.9); G.add(bed);
  const sheet = box(.95, .14, 1.6, mat({ color: 0xd8d0c4 }), { px: 3 }); sheet.position.set(-1.5, .52, -.7); G.add(sheet);
  // door (open, light spill)
  const door = box(.9, 2.0, .06, mat({ map: planksTex('#4a3428', 4) }), { px: 3.5 }); door.position.set(1.6, 1.0, 1.7); door.rotation.y = -1.0; G.add(door);
  const moonL = new THREE.SpotLight(0x8098ff, 14, 9, .55, .6, 1); moonL.position.set(.6, 2.0, -3.2); moonL.target.position.set(.3, 0, -.6); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); G.add(moonL, moonL.target);
  const amb = new THREE.HemisphereLight(0x5a66b0, 0x1a1420, .65); G.add(amb);
  const candle = new THREE.PointLight(0xff9a40, 1.6, 4, 2); candle.position.set(1.4, 1.0, 1.4); G.add(candle); G.userData.candle = candle;
  const dust = makeDust(200, [4, 2.4, 4], 0xbfd0ff); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}

// ---------------- EVIDENCE ROOM: corkboard wall with ~100 suspect cards + desk with case file
export function buildEvidence() {
  const G = new THREE.Group(); G.name = 'evidence';
  const wall = box(9, 5, .1, mat({ map: plasterTex('#2c3446') }), { px: 4 }); wall.position.set(0, 2.5, -.6); G.add(wall);
  const cork = box(6.4, 3.4, .08, mat({ map: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#9a7048'; x.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},30,.5)`; x.fillRect(r() * w, r() * h, 2, 2); } }) }), { px: 4 }); cork.position.set(0, 2.5, -.5); G.add(cork);
  const r = rng(77); const cards = [];
  const cardTex = i => canvasTex(128, 160, (x, w, h) => {
    x.fillStyle = '#efe7d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2a35'; x.fillRect(10, 10, w - 20, 100);
    x.fillStyle = '#c9c2b2'; x.beginPath(); x.arc(w / 2, 52, 26, 0, 7); x.fill(); x.beginPath(); x.ellipse(w / 2, 112, 40, 30, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#b3262d'; x.font = '900 46px Montserrat'; x.textAlign = 'center'; x.fillText('?', w / 2, 70);
    x.fillStyle = '#333'; x.font = '700 16px Montserrat'; x.fillText('Nr. ' + (i + 1), w / 2, 136); x.fillRect(20, 144, w - 40, 4);
  });
  const texes = Array.from({ length: 12 }, (_, i) => cardTex(i * 9));
  let i = 0;
  for (let row = 0; row < 8; row++) for (let colI = 0; colI < 13; colI++) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(.4, .5), mat({ map: texes[i % 12] }));
    c.position.set(-2.95 + colI * .49 + (r() - .5) * .06, 4.0 - row * .42 + (r() - .5) * .05, -.45 + i * .0001); c.rotation.z = (r() - .5) * .14; G.add(c); cards.push(c);
    const pin = sph(.025, mat({ color: 0xc02828 }), { px: 1.6 }); pin.position.set(c.position.x, c.position.y + .2, -.43); G.add(pin);
    i++;
  }
  G.userData.cards = cards;
  // red strings
  const strM = new THREE.LineBasicMaterial({ color: 0xc02828 });
  for (let k = 0; k < 18; k++) { const a = cards[(r() * cards.length) | 0].position, b = cards[(r() * cards.length) | 0].position; const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, a.y + .2, -.42), new THREE.Vector3(b.x, b.y + .2, -.42)]); G.add(new THREE.Line(g, strM)); }
  // desk + folder
  const desk = box(3, .1, 1.4, mat({ map: planksTex('#4a3428', 6) }), { px: 4 }); desk.position.set(0, .95, 1.2); G.add(desk);
  const folderT = canvasTex(512, 380, (x, w, h) => { x.fillStyle = '#c9a66a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,40,20,.6)'; x.lineWidth = 4; x.strokeRect(14, 14, w - 28, h - 28); x.fillStyle = '#2a2018'; x.font = '800 30px Montserrat'; x.fillText('KRIMINALPOLIZEI', 40, 70); x.font = '900 52px Montserrat'; x.fillText('HINTERKAIFECK', 40, 150); x.font = '700 30px Montserrat'; x.fillText('31.03.1922  ·  6 OPFER', 40, 200); x.fillRect(40, 220, w - 80, 4); });
  const folder = box(.9, .03, .66, mat({ map: folderT }), { px: 3 }); folder.position.set(0, 1.02, 1.2); folder.rotation.y = -.08; G.add(folder); G.userData.folder = folder;
  const stampT = canvasTex(512, 160, (x, w, h) => { x.strokeStyle = '#c3141c'; x.lineWidth = 14; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#c3141c'; x.font = '900 96px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('UNSOLVED', w / 2, h / 2 + 6); });
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(.7, .22), new THREE.MeshLambertMaterial({ map: stampT, transparent: true, depthWrite: false, emissive: 0xff2020, emissiveMap: stampT, emissiveIntensity: .35 }));
  stamp.rotation.x = -Math.PI / 2; stamp.rotation.z = .18; stamp.position.set(.02, 1.04, 1.25); G.add(stamp); G.userData.stamp = stamp;
  const desklamp = new THREE.SpotLight(0xffc27a, 9, 8, .65, .5, 1.2); desklamp.position.set(-.8, 3.2, 2.2); desklamp.target.position.set(0, 1, 1.0); desklamp.castShadow = true; G.add(desklamp, desklamp.target);
  const wallL = new THREE.SpotLight(0xffd8a0, 14, 10, .8, .7, 1.2); wallL.position.set(0, 4.6, 3.4); wallL.target.position.set(0, 2.5, -.5); G.add(wallL, wallL.target);
  const amb = new THREE.HemisphereLight(0x3a4a80, 0x101018, .4); G.add(amb);
  const dust = makeDust(250, [6, 4, 3], 0xffe2b0); G.add(dust); G.userData.dust = dust;
  scene.add(G); G.visible = false; return G;
}
