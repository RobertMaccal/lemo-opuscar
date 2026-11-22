// shots/01_world.js — SCENE 01: Earth → clouds → city → one window → Jeff (one continuous descent, hidden cuts).
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, rng, noise, alpha, shade, mix, seg, circle, rr, poly, linGrad, radGrad, glow, backdrop } from '/engine/core.js';
import { drawFigure } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { bedroom, bedClock, blanket, heldPhone, rigPt, BED } from '../sets/bedroom.js';
import { P, PHONE, mouth, blinkAt, gT } from '../_kit.js';
import { jeff, jeffHome } from '../cast.js';

// ---------- s01: Earth from space (3D) ----------
function fbm(x, y, seed) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 5; i++) { v += a * noise(x * f + 31.7 * i, seed + i) * (0.6 + 0.4 * noise(y * f + 11.3 * i, seed + 7 + i)); a *= 0.5; f *= 2.1; } return v; }
registerShot('s01', { kind: '3d',
  init(T, info) {
    const THREE = T.THREE, st = T.stage({ mood: 'void', sky: '#010208', fog: false, ambient: 0.05, keyColor: '#fff4e0', keyIntensity: 3.2, keyPos: [40, 10, 10], bloom: 0.8, bloomThreshold: 0.6 });
    st.hemi.intensity = 0.06;
    const W = 1024, H = 512, land = new Float32Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = i / W, v = j / H; land[j * W + i] = fbm(u * 6.0 + Math.sin(v * 3.1) * 0.6, v * 6.0, 4) + 0.16 - Math.abs(v - 0.5) * 0.25; }
    const day = T.canvasTex(W, H, (g) => { const im = g.createImageData(W, H); for (let k = 0; k < W * H; k++) { const l = land[k], v = Math.floor(k / W) / H, ice = Math.abs(v - 0.5) > 0.43; const c = ice ? [220, 230, 240] : l > 0.05 ? [40 + l * 120, 70 + l * 60, 40] : [10, 30 + (l + 0.5) * 40, 70 + (l + 0.5) * 80]; im.data.set([c[0], c[1], c[2], 255], k * 4); } g.putImageData(im, 0, 0); });
    const r = rng(7), lights = T.canvasTex(W, H, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); for (let n = 0; n < 26000; n++) { const i = Math.floor(r() * W), j = Math.floor(H * 0.12 + r() * H * 0.76), l = land[j * W + i]; if (l < 0.07 || r() > (l - 0.05) * 6) continue; const b = r(); g.fillStyle = b > 0.9 ? '#fff2c8' : b > 0.5 ? '#ffb25a' : '#ff8a3a'; g.globalAlpha = 0.5 + b * 0.5; g.fillRect(i, j, b > 0.93 ? 2 : 1, 1); } g.globalAlpha = 1; });
    const clouds = T.canvasTex(W, H, (g) => { const im = g.createImageData(W, H); for (let k = 0; k < W * H; k++) { const i = k % W, j = Math.floor(k / W), c = fbm(i / W * 9 + 3, j / H * 9, 19); const a = clamp((c - 0.1) * 2.2) * 200; im.data.set([255, 255, 255, a], k * 4); } g.putImageData(im, 0, 0); });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 64), new THREE.MeshStandardMaterial({ map: day, emissiveMap: lights, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 2.4, roughness: 0.85, metalness: 0 }));
    const cl = new THREE.Mesh(new THREE.SphereGeometry(6.06, 96, 64), new THREE.MeshStandardMaterial({ map: clouds, transparent: true, opacity: 0.55, depthWrite: false, roughness: 1 }));
    const atm = new THREE.Mesh(new THREE.SphereGeometry(6.35, 64, 48), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      uniforms: { sun: { value: new THREE.Vector3(40, 10, 10).normalize() } },
      vertexShader: 'varying vec3 n; varying vec3 w; void main(){ n = normalize(normalMatrix*normal); w = normalize((modelMatrix*vec4(position,1.)).xyz); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 sun; varying vec3 n; varying vec3 w; void main(){ float rim = pow(1.0 - abs(n.z), 3.0); float lit = clamp(dot(w, sun)*0.8+0.35, 0.05, 1.0); gl_FragColor = vec4(vec3(0.25,0.5,1.0)*rim*lit*1.6, rim*lit); }' }));
    const g = new THREE.Group(); g.add(earth, cl, atm); g.rotation.z = 0.35; st.add(g);
    const sp = new Float32Array(3 * 2500); for (let i = 0; i < 2500; i++) { const a = r() * 6.283, b = Math.acos(2 * r() - 1), d = 200 + r() * 100; sp.set([d * Math.sin(b) * Math.cos(a), d * Math.cos(b), d * Math.sin(b) * Math.sin(a)], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); st.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#cfd8ff', size: 1.1, sizeAttenuation: false })));
    return { stage: st, earth, cl, g };
  },
  draw(s, t, info, T) {
    const k = ease.inOut(clamp(t / info.dur));
    s.earth.rotation.y = 1.7 + t * 0.035; s.cl.rotation.y = 1.7 + t * 0.045;
    const d = lerp(34, 9.2, ease.in(clamp(t / info.dur)) * 0.85 + k * 0.15);
    s.stage.camera.position.set(-d * 0.35, d * 0.18 + 1.2 * k, d); s.stage.camera.lookAt(lerp(0, -1.4, k), lerp(0, 1.2, k), 0);
    s.stage.camera.fov = lerp(30, 38, k); s.stage.camera.updateProjectionMatrix();
  },
  overlay(g, t, info) { const a = clamp(t / 0.8); if (a < 1) veil(g, '#000', 1 - a); const w = prog(t, info.dur - 0.7, info.dur); if (w > 0) veil(g, '#cfd8ff', w * 0.5, 'lighter'); },
});

// ---------- s02: dive through the clouds (2D) ----------
registerShot('s02', { draw(g, t, info) {
  const k = t / info.dur, z = 1 + ease.in(k) * 2.5;
  // city far below: clustered lights along a street grid, growing as we fall
  layer(g, { z: 0.7 + k * 1.1 }, 1, (g) => {
    g.fillStyle = '#03050c'; g.fillRect(-2000, -2000, 6000, 6000);
    const r = rng(5); g.save(); g.globalCompositeOperation = 'lighter';
    for (let n = 0; n < 2600; n++) { const gx = Math.round((r() - 0.5) * 44), gy = Math.round((r() - 0.5) * 30), along = r() < 0.5, u = (r() - 0.5);
      const x = E.W / 2 + (along ? gx * 80 + u * 80 : gx * 80) , y = E.H / 2 + (along ? gy * 80 : gy * 80 + u * 80);
      const d = Math.hypot(x - E.W / 2, y - E.H / 2) / 1400; if (r() < d) continue;
      circle(g, x, y, 1.6 + r() * 3, alpha(r() > 0.85 ? '#fff2c8' : '#ffa850', 0.45 + r() * 0.5)); }
    glow(g, E.W / 2, E.H / 2, 1100, '#ff9a40', 0.22);
    g.restore();
  });
  // cloud layers rushing past the lens: dark puffs with gaps, thinning as we break through
  const R = rng(11);
  for (let i = 0; i < 22; i++) {
    const depth = (R() + k * 1.3) % 1.3, sc = 0.5 + depth * depth * 4.2, a = clamp(1.1 - Math.abs(depth - 0.85) * 1.6) * (1 - k * 0.75);
    const ang = R() * 6.28, rad = (0.25 + R() * 0.7) * E.W * sc * 0.55, cx = E.W / 2 + Math.cos(ang) * rad, cy = E.H / 2 + Math.sin(ang) * rad * 0.6;
    g.fillStyle = radGrad(g, cx, cy, 0, 380 * sc, [alpha(mix('#4a5688', '#8a96c4', R()), 0.6 * a), alpha('#232c52', 0.35 * a), alpha('#232c52', 0)]);
    g.beginPath(); g.ellipse(cx, cy, 460 * sc, 260 * sc, R() * 0.4, 0, Math.PI * 2); g.fill();
  }
  veil(g, '#8a96c4', (1 - prog(t, 0.0, 0.45)) * 0.7);
  FX.speedLines(g, t, { count: 26, color: '#dfe6ff', a: 0.1, inner: 320 });
} });

// ---------- s03: the city at night (3D fly-down) ----------
registerShot('s03', { kind: '3d',
  init(T, info) {
    const THREE = T.THREE, st = T.stage({ mood: 'night', fog: [40, 190], fogColor: '#0a0e22', ambient: 0.35, keyColor: '#9fb0ff', keyIntensity: 0.6, keyPos: [-30, 60, -40], bloom: 0.5, bloomThreshold: 0.8, fov: 40 });
    const r = rng(17), wallC = ['#1c2038', '#232846', '#1a1c30', '#262a40', '#20243c'];
    const texs = [0, 1, 2, 3, 4, 5].map(v => T.canvasTex(128, 256, (g, W, H) => { g.fillStyle = wallC[v % 5]; g.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) for (let j = 0; j < 14; j++) { const b = r(); g.fillStyle = b < 0.32 ? (b < 0.06 ? '#9fd8ff' : b < 0.12 ? '#fff0c8' : '#ffb85a') : '#0c0e1a'; g.fillRect(8 + i * 20, 8 + j * 18, 12, 11); } }));
    const mats = texs.map(tx => new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.7, roughness: 1 }));
    const roof = new THREE.MeshStandardMaterial({ color: '#141626', roughness: 1 });
    const N = 9, step = 16;
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
      if (i === 0 && j === 0) continue;
      const h = 8 + Math.pow(r(), 2.2) * (Math.abs(i) + Math.abs(j) < 6 ? 70 : 34), w = 7 + r() * 5, d = 7 + r() * 5, m = mats[Math.floor(r() * mats.length)];
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [m, m, roof, roof, m, m]); b.position.set(i * step, h / 2, j * step); st.add(b);
      if (r() < 0.15) { const lt = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a2a' })); lt.position.set(i * step, h + 1, j * step); st.add(lt); }
    }
    // Jeff's building at the centre: one warm window, front faces +z
    const jt = T.canvasTex(256, 512, (g, W, H) => { g.fillStyle = '#20243c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) for (let j = 0; j < 12; j++) { const target = i === 2 && j === 7; g.fillStyle = target ? '#ffc472' : r() < 0.18 ? '#ffb85a' : '#0c0e1a'; g.fillRect(18 + i * 46, 14 + j * 41, 30, 28); } });
    const jm = new THREE.MeshStandardMaterial({ map: jt, emissiveMap: jt, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.9, roughness: 1 });
    const jb = new THREE.Mesh(new THREE.BoxGeometry(10, 36, 10), [mats[1], mats[2], roof, roof, jm, mats[3]]); jb.position.set(0, 18, 0); st.add(jb);
    // ground + streets
    const ground = T.ground(600, 600, '#090b16'); st.add(ground);
    const streetM = new THREE.MeshBasicMaterial({ color: '#2a2a30' });
    for (let i = -N; i <= N + 1; i++) { const s1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 600), streetM); s1.rotation.x = -Math.PI / 2; s1.position.set(i * step - step / 2, 0.02, 0); st.add(s1); const s2 = s1.clone(); s2.rotation.z = Math.PI / 2; s2.position.set(0, 0.02, i * step - step / 2); st.add(s2); }
    // street lamps (sodium) and cars (head/tail lights)
    const lampM = new THREE.MeshBasicMaterial({ color: '#ffb35c' });
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j += 1) { if (r() < 0.6) continue; const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 4), lampM); l.position.set(i * step - step / 2 + 2.4, 3.2, j * step); st.add(l); }
    const cars = []; const hm = new THREE.MeshBasicMaterial({ color: '#fff4dc' }), tm = new THREE.MeshBasicMaterial({ color: '#ff3a2a' });
    for (let n = 0; n < 160; n++) { const along = r() < 0.5, lane = Math.floor((r() - 0.5) * 2 * (N + 1)) * step - step / 2 + (r() < 0.5 ? -0.9 : 0.9), dir = r() < 0.5 ? 1 : -1; const c = new THREE.Mesh(new THREE.BoxGeometry(along ? 0.5 : 1.6, 0.35, along ? 1.6 : 0.5), dir > 0 ? hm : tm); st.add(c); cars.push({ c, along, lane, dir, off: r() * 300, sp: 6 + r() * 6 }); }
    return { stage: st, cars };
  },
  draw(s, t, info, T) {
    for (const c of s.cars) { const p = ((c.off + t * c.sp * c.dir) % 300 + 300) % 300 - 150; if (c.along) c.c.position.set(c.lane, 0.3, p); else c.c.position.set(p, 0.3, c.lane); }
    T.dolly(s.stage.camera, t, [
      [0, { pos: [0.5, 170, 6], look: [0, 0, 0], fov: 40 }],
      [2.6, { pos: [8, 92, 70], look: [0, 10, 0], fov: 42 }],
      [5.6, { pos: [9, 30, 52], look: [0, 16, 0], fov: 44 }],
      [8.6, { pos: [0.3, 14.2, 13.5], look: [0, 13.9, 5], fov: 44 }],
    ]);
  },
  overlay(g, t, info) { const a = 1 - clamp(t / 0.5); if (a > 0) veil(g, '#9aa6d0', a * 0.5); },
});

// ---------- s04: the facade, one warm window, push through ----------
registerShot('s04', { draw(g, t, info) {
  const k = ease.in(clamp(t / info.dur)), tx = 960, ty = 560, z = 1 + k * 7.5;
  const cam = { z, x: (tx - E.W / 2) * (1 - 1 / z) * 1.0, y: (ty - E.H / 2) * (1 - 1 / z) };
  layer(g, cam, 1, (g) => {
    g.fillStyle = '#1e2238'; g.fillRect(-2000, -2000, 6000, 6000);
    const r = rng(33);
    for (let i = -6; i <= 6; i++) for (let j = -5; j <= 5; j++) {
      const x = tx + i * 230 - 70, y = ty + j * 210 - 60, target = i === 0 && j === 0, lit = target || r() < 0.22, tv = !target && r() < 0.08;
      g.fillStyle = '#121424'; g.fillRect(x - 10, y - 10, 160, 140);
      const c = target ? '#ffc472' : tv ? '#7fb8ff' : lit ? '#ffb05a' : '#0b0d18';
      g.fillStyle = linGrad(g, 0, y, 0, y + 120, [c, shade(c, lit ? -0.35 : 0)]); g.fillRect(x, y, 140, 120);
      if (lit) glow(g, x + 70, y + 60, 140, c, 0.18);
      seg(g, [[x + 70, y], [x + 70, y + 120]], 6, '#121424'); seg(g, [[x, y + 50], [x + 140, y + 50]], 6, '#121424');
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 14, y + 128, 168, 10);
      if (target) { // silhouette of Jeff in bed, lit by the phone, inside the window
        g.fillStyle = 'rgba(20,14,24,.85)'; g.fillRect(x + 6, y + 84, 128, 30); circle(g, x + 108, y + 78, 10, 'rgba(20,14,24,.9)'); glow(g, x + 100, y + 70, 30, PHONE, 0.7);
      }
    }
  });
  FX.rain(g, t, { count: 40, a: 0.08, color: '#cfd8ff' });
  const w = prog(t, info.dur - 0.35, info.dur); if (w > 0) veil(g, '#ffc472', w * 0.6, 'lighter');
} });

// ---------- s05: inside — Jeff in bed, phone light ----------
export function jeffInBed(g, t, cam, o = {}) {
  const s = o.s || 1.7, x = o.x ?? 1120, y = o.y ?? BED.matY - 12 + 100 * s;
  const fig = { x, y, s, facing: -1, rot: -Math.PI / 2, outfit: o.work ? jeff(o.mess || 0) : jeffHome(o.mess || 0), pose: o.pose || P.lieHold, expr: o.expr || 'neutral', look: o.look || [0, -1], blink: o.blink ?? blinkAt(t, 3.6, 1), talk: o.talk || 0, face: o.face || null,
    rim: { color: o.rimC || '#9fe3ff', dir: o.rimDir || [0.2, -1], w: 4 }, shadow: false };
  layer(g, cam, 1, (g) => drawFigure(g, fig));
  const head = rigPt(fig, fig.pose.head), hand = rigPt(fig, fig.pose.hF);
  if (o.phone !== false) layer(g, cam, 1, (g) => heldPhone(g, lerp(hand[0], head[0], 0.25), hand[1] - 18, o.phoneAng ?? 0.08, { on: o.phoneOn ?? 1, col: o.phoneCol }));
  if (o.blanket !== false) blanket(g, cam, BED.x0 + 40, x + 40 * s, { bump: 6 });
  return { head, hand, fig };
}
registerShot('s05', { draw(g, t, info) {
  const k = ease.out(clamp(t / info.dur)), cam = { z: lerp(1.75, 1.55, k), x: lerp(260, 200, k), y: lerp(-20, 0, k) };
  bedroom(g, t, cam, { lamp: 1 });
  const j = jeffInBed(g, t, cam, { expr: 'neutral' });
  bedClock(g, cam, '12:00 AM');
  FX.dust(g, t, { count: 30, color: '#cfe0ff', a: 0.25 });
  const a = 1 - clamp(t / 0.5); if (a > 0) veil(g, '#ffc472', a * 0.6, 'lighter');
} });
