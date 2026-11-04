// Set 5: the imagined world of the game — an original fantasy valley: a village plaza, a great tree, a river to the sea, original creatures
// (puff-seeds, pebble snails, lantern moths, glow-beetles) and small adventurers. Shots: world (green bloom, empty square + tumbleweed),
// secret (a pink glow hidden in the grass), rush (kids pour in), phenom (two kids link up), lights (night map), coast (dawn sea), kids (shrink back).
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, spriteMats, billboard, glow, mulberry, cobbles } from './px.js';
import { mat, mesh, house, mats } from './kit.js';
import { sky, sea, particles } from './fx.js';
import { makeKid, glowAtlas, creatureAtlases, sprite, atlas } from './chars.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';
import { T } from './timeline.js';
import { canopy, grassTuft, flowers, ridgeTex } from './art.js';

const riverX = z => 8.5 + 1.4 * Math.sin(z * .15);
const SEA_Z = -21;
const paths = [[0, 0, -14, 7], [0, 0, 9, 3], [0, 0, 2, 14], [0, 0, -6, -12], [0, 0, 12, -10]];   // plaza → out
const distPath = (x, z) => { let d = 1e9; for (const [ax, az, bx, bz] of paths) { const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return d; };

export function buildWorld() {
  const scene = new THREE.Scene(); const R = mulberry(17);
  const U = { time: { value: 0 } };
  const SKY = sky({ top: '#3f86e0', mid: '#8cc4f4', hor: '#fff0d0', moonDir: new THREE.Vector3(.4, .35, -.8), moonCol: '#fff4d0', moonI: 1.1 }); scene.add(SKY.mesh);
  scene.fog = new THREE.FogExp2('#d8ecf0', .012);
  const sun = new THREE.DirectionalLight('#fff0c8', 2.8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#c8e4ff', '#4a6a3a', 1.05); scene.add(hemi);
  const SUN_OFF = new THREE.Vector3(14, 20, 10);
  // —— ground ——
  const GX0 = -30, GX1 = 30, GZ0 = -24, GZ1 = 20, GW = GX1 - GX0, GD = GZ1 - GZ0, gp = 12;
  const G = ramp(['#1e5a2a', '#2a7232', '#3a8a3a', '#56a444', '#7cc054', '#a8d86a'], .35), D = ramp(['#7a5a34', '#9a7848', '#b8965e', '#d2b47a'], .35), S = ramp(['#c8b080', '#dcc896', '#efe0b0', '#fff2cc'], .35), C = ramp(['#6a6870', '#8a8890', '#a8a6aa', '#c4c2c4'], .35);
  const gc = new PX(GW * gp, GD * gp);
  gc.fill((x, y) => { const wx = GX0 + x / gp, wz = GZ0 + y / gp, n = fbm(x * .2, y * .2, 3);
    if (wz < SEA_Z + .5) return null;
    if (Math.abs(wx - riverX(wz)) < 1.1) return null;
    if (wz < SEA_Z + 3 + fbm(wx * .3, 0, 5) * 1.5) return S(.45 + n * .4, x, y);
    const pr = Math.hypot(wx, wz); if (pr < 3.2) { const ring = Math.abs(pr - 2.2) < .12; return C(ring ? .25 : .5 + (h2(x >> 2, y >> 2, 2) - .5) * .4 - ((x % 6 === 0 || y % 6 === 0) ? .2 : 0), x, y); }
    if (distPath(wx, wz) < .7 + (fbm(wx, wz, 7) - .5) * .4) return D(.45 + n * .4, x, y);
    let v = .35 + n * .45 + (fbm(wx * .1, wz * .1, 9) - .5) * .35; if (h2(x, y, 4) > .93) v += .2;
    if (h2(x, y, 8) > .992) return hex(['#ffffff', '#ffd84a', '#ff8ac8', '#8ad8ff'][(h2(x, y, 9) * 4) | 0]);
    return G(v, x, y); });
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshStandardMaterial({ map: texOf(gc.done()), roughness: .95, alphaTest: .5 }));
  gnd.rotation.x = -Math.PI / 2; gnd.position.set(0, 0, (GZ0 + GZ1) / 2); gnd.receiveShadow = true; scene.add(gnd);
  // river + sea (pixel water)
  const RIV = sea(10, { ppm: 12, deep: '#1e6a8a', shallow: '#4aaac8', crest: '#e0fbff' });
  { const g = new THREE.PlaneGeometry(2.6, GD, 1, 80), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = -p.getY(i) + (GZ0 + GZ1) / 2; p.setX(i, p.getX(i) + riverX(z)); } RIV.mesh.geometry = g; RIV.mesh.position.set(0, -.06, (GZ0 + GZ1) / 2); scene.add(RIV.mesh); }
  const SEA = sea(400, { ppm: 8, deep: '#0e3a6a', shallow: '#2a7aaa', crest: '#d8f4ff' }); SEA.mesh.position.set(0, -.08, SEA_Z - 190); scene.add(SEA.mesh);
  const bedM = new THREE.MeshStandardMaterial({ color: '#1a3a3a' }); const bed = new THREE.Mesh(new THREE.PlaneGeometry(GW, 6), bedM); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -.3, SEA_Z - 1); scene.add(bed);
  // bridge
  { const MM = mats(); const bz = 3.5, bx = riverX(bz); scene.add(mesh(new THREE.BoxGeometry(3.2, .14, 1.3).translate(bx, .12, bz), MM.plank)); }
  // —— plaza: well + lantern posts ——
  const MM = mats();
  const stoneM = mat((() => { const P = new PX(32, 32), Rs = ramp(['#6a6a74', '#8a8a92', '#a8a8ae', '#c8c8cc']); P.fill((x, y) => Rs(.5 + (h2(x >> 2, y >> 1, 3) - .5) * .4 - (y % 8 === 0 || (x + (y >> 3) * 4) % 8 === 0 ? .3 : 0), x, y)); return P.done(); })());
  scene.add(mesh(new THREE.CylinderGeometry(.8, .9, .5, 14).translate(0, .25, 0), stoneM)); scene.add(mesh(new THREE.CylinderGeometry(.18, .22, 1.0, 8).translate(0, .5, 0), stoneM));
  const spray = particles(60, (i, t, o) => { const k = ((t * .9 + i / 60) % 1), a = i * 2.4; o.x = Math.cos(a) * k * .55; o.y = 1.05 + k * .5 - k * k * 1.0; o.z = Math.sin(a) * k * .55; o.a = .8 * (1 - k); o.s = .03; o.r = 1.4; o.g = 1.8; o.b = 2.2; }, { soft: 1 }); scene.add(spray);
  const wellWater = new THREE.Mesh(new THREE.CircleGeometry(.6, 16), new THREE.MeshStandardMaterial({ color: '#4aaac8', emissive: '#2a6a8a', emissiveIntensity: .4 })); wellWater.rotation.x = -Math.PI / 2; wellWater.position.y = .48; wellWater.scale.setScalar(1.25); scene.add(wellWater);
  // —— houses ring (colourful roofs) ——
  const roofs = ['roof', 'roof2', 'roof3'], walls = ['wall', 'wall3', 'wall2'];
  const homes = [];
  [[-6, -4.5, .5], [-7, 2.5, 1.4], [-3, 6.5, 3], [4.5, 6.8, -2.8], [6, -5.5, -.6], [2.5, -8, 0], [-11, -7, .3], [-12, 4, 1.3]].forEach(([x, z, ry], i) => {
    const h = house({ x, z, w: 3.4 + (i % 2), d: 3, h: 2.5, wall: walls[i % 3], roof: roofs[i % 3], chimney: i % 2 === 0, door: .6, windows: [[-.8, 1.3], [.8, 1.3]], ry });
    h.userData.windows.forEach(w => w.material = w.material.clone()); scene.add(h); homes.push(h);
  });
  // —— trees: great tree by the plaza (pink blossom), round trees, pines on the hills ——
  const canG = [0, 1, 2].map(i => texOf(canopy(150, 104, 31 + i * 5, { n: 9, cols: ['#0e3a1e', '#1a5a2a', '#2a7a32', '#46983e', '#6eb84e', '#9cd466', '#cff08a'] })));
  const canP = [0, 1].map(i => texOf(canopy(150, 104, 51 + i * 9, { n: 10, cols: ['#5a1e3a', '#8a2e5a', '#b84a7a', '#e06a9a', '#f49ac0', '#ffc8dc', '#fff0f6'] })));
  const barkM = mat((() => { const P = new PX(32, 32), Rb = ramp(['#2a1a12', '#4a3020', '#6a4a30', '#8a6440']); P.fill((x, y) => Rb(.4 + fbm(x * .3, y * .06, 3) * .5 - (Math.abs(Math.sin(x * .9)) < .15 ? .25 : 0), x, y)); return P.done(); })());
  const swayMat = (m, amp) => { m.onBeforeCompile = sh => { sh.uniforms.uTime = U.time; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n vec4 wq = modelMatrix * vec4(position,1.);\n#ifdef USE_INSTANCING\n wq = modelMatrix * instanceMatrix * vec4(position,1.);\n#endif\n transformed.x += sin(uTime * 1.9 + wq.x * .5 + wq.z * .3) * ${amp.toFixed(3)} * max(position.y, 0.);`); }; m.customProgramCacheKey = () => 'wsway' + amp; return m; };
  function tree(x, z, r, hgt, texs, cs, n = 3) {
    const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(r * .75, r, hgt, 9).translate(0, hgt / 2, 0), barkM));
    for (let k = 0; k < n; k++) { const s = cs * (.8 + R() * .4), c = billboard(texs[k % texs.length], s, s * .69, { ay: .5 }); swayMat(c.material, .03); c.position.set((R() - .5) * s * .5, hgt * .85 + (R() - .3) * 1.2, (R() - .5)); g.add(c); }
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  const BIG = new THREE.Vector3(-3.4, 0, -2.8);
  tree(BIG.x, BIG.z, .7, 6.5, canP, 6.5, 6);
  for (let i = 0; i < 70; i++) { const x = GX0 + 2 + R() * (GW - 4), z = SEA_Z + 5 + R() * (GZ1 - SEA_Z - 6); if (Math.hypot(x, z) < 9 || distPath(x, z) < 1.6 || Math.abs(x - riverX(z)) < 2.2 || (z < -7 && x > -5 && x < 11) || Math.hypot(x + 1.6, z + 5.2) < 3) continue; tree(x, z, .28, 4 + R() * 2.5, R() > .85 ? canP : canG, 4 + R() * 1.5, 3); }
  // grass, flowers, tall grass patch (the secret hides in it)
  function scatter(canvas, wM, hM, n, place, amp = .12) {
    const S = spriteMats(texOf(canvas), null); swayMat(S.m, amp);
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(wM, hM).translate(0, hM / 2, 0), S.m, n); im.castShadow = true; im.customDepthMaterial = S.depth;
    const o = new THREE.Object3D(); for (let i = 0; i < n; i++) { const [x, z, s] = place(i); o.position.set(x, 0, z); o.rotation.set(0, (R() - .5) * .5, 0); o.scale.set(s, s, s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    scene.add(im); return im;
  }
  const free = (m = 1) => { for (let k = 0; k < 50; k++) { const x = GX0 + R() * GW, z = SEA_Z + 3 + R() * (GZ1 - SEA_Z - 3); if (Math.hypot(x, z) > 3.6 && distPath(x, z) > m && Math.abs(x - riverX(z)) > 1.6) return [x, z]; } return [0, -60]; };
  [grassTuft(18, 12, 3, ['#1e5a24', '#2e7a2e', '#4a9a3a', '#6cba4a', '#98d860']), grassTuft(20, 14, 6, ['#1e5a24', '#2e7a2e', '#4a9a3a', '#6cba4a', '#98d860'])].forEach(c => scatter(c, .7, .47, 260, () => { const [x, z] = free(); return [x, z, .8 + R() * .7]; }));
  [flowers(16, 12, 4), flowers(16, 12, 7)].forEach(c => scatter(c, .5, .38, 160, () => { const [x, z] = free(); return [x, z, 1 + R() * .6]; }, .16));
  const SECRET = new THREE.Vector3(-1.6, .32, -5.4);
  scatter(grassTuft(20, 16, 11, ['#1a4a20', '#2a6a2a', '#3e8a34', '#5aa844', '#86c85a']), 1.0, .9, 60, () => { const a = R() * 6.28, r = Math.sqrt(R()) * 1.3; return [SECRET.x + Math.cos(a) * r, SECRET.z + Math.sin(a) * r * .8, .8 + R() * .5]; }, .2);
  // hills
  [['#5a8a6a', '#7aa888', 30, 70, 14, 4, .012, 'L'], ['#6a9a7a', '#8ab898', 34, 80, 20, 7, .008, 'L']].forEach(([c, h, xoff, w, hh, s, f]) => {
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh).translate(0, hh / 2, 0), new THREE.MeshBasicMaterial({ map: texOf(ridgeTex(w * 3, hh * 3, c, h, s + sx, { f })), transparent: true, alphaTest: .5, fog: true })); m.position.set(sx * xoff, -.5, 0); m.rotation.y = -sx * Math.PI / 2; scene.add(m); }
  });
  // —— creatures ——
  const CA = creatureAtlases(), GA = glowAtlas();
  const mk = (A, spx, n) => [...Array(n)].map(() => { const tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true; const s = sprite({ ...A, tex, em }, spx, { blob: true, blobR: .18, capK: 1.6 }); scene.add(s.root); return s; });
  const puffs = mk(CA.puff, 1 / 40, 7), snails = mk(CA.snail, 1 / 44, 4), moths = mk(CA.moth, 1 / 40, 6), glows = mk(GA, 1 / 50, 5);
  const PU = puffs.map(() => free(1.2)), SN = snails.map(() => free(.9)), MO = moths.map(() => [R() * 24 - 12, R() * 20 - 10]), GL = glows.map(() => [R() * 20 - 10, R() * 16 - 8]);
  // the hidden secret: a pink glow in the tall grass (the creature itself is never drawn)
  const secret = glow('#ff7ad0', 1.8, 1.4); secret.position.copy(SECRET).add(new THREE.Vector3(0, .45, 0)); secret.material.depthTest = false; secret.renderOrder = 5; scene.add(secret);
  const SP = [...Array(40)].map(() => [R(), R(), R()]);
  const sparks = particles(SP.length, (i, t, o) => { const s = SP[i], a = s[0] * 6.28 + t * (1 + s[1]), r = .2 + s[1] * .5; o.x = SECRET.x + Math.cos(a) * r; o.y = SECRET.y + ((s[2] + t * .3) % 1) * 1.2; o.z = SECRET.z + Math.sin(a) * r * .6; o.a = U.secret * (.5 + .5 * Math.sin(t * 9 + s[0] * 30)); o.s = .03; o.r = 2.2; o.g = 1.1; o.b = 2.0; }, { soft: 1 });
  scene.add(sparks); U.secret = 0;
  // tumbleweed (sales were modest)
  const twP = new PX(20, 20); for (let k = 0; k < 160; k++) { const a = k * 2.4, r = 3 + (k % 7); twP.set(10 + Math.cos(a) * r * .9, 10 + Math.sin(a) * r * .9, ['#8a6a3a', '#b08a4a', '#6a4a2a'][k % 3]); } twP.outline(.3);
  const tumble = billboard(texOf(twP.done()), .7, .7, { ay: .5 }); scene.add(tumble);
  // —— kids ——
  const kidA = [0, 1, 2].map(k => makeKid(k, true).A);
  const mkKid = k => { const A = kidA[k % 3], tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true; const s = sprite({ ...A, tex, em }, 1 / 30, { blobR: .28 }); scene.add(s.root); return s; };
  const kids = [...Array(16)].map((_, i) => mkKid(i));
  const KR = kids.map((_, i) => { const p = paths[i % paths.length]; return { p, ph: R(), sp: .8 + R() * .4 }; });
  const pair = [mkKid(0), mkKid(1)];   // the two who link up under the great tree
  const arcG = glow('#7af0e0', .5, 1.4); scene.add(arcG);
  const ARC = [...Array(30)].map((_, i) => i);
  const arc = particles(ARC.length, (i, t, o) => { const k = ((t * .7 - i * .02) % 1 + 1) % 1, a = pairPos(0), b = pairPos(1); o.x = lerp(a.x, b.x, k); o.y = 1.0 + Math.sin(k * Math.PI) * 1.1; o.z = lerp(a.z, b.z, k); o.a = U.arc * (1 - i / 30); o.s = .05; o.r = 1.2; o.g = 2.6; o.b = 2.2; }, { soft: 1 });
  scene.add(arc); U.arc = 0;
  const pairPos = k => new THREE.Vector3(BIG.x + (k ? 1.3 : -.2), 0, BIG.z + 1.4);
  // —— night lights: windows + lanterns + far lights pop on (515 million) ——
  const NL = 1400, LT = [...Array(NL)].map((_, i) => { const a = R() * 6.28, r = 4 + Math.pow(R(), .6) * 26; return [Math.cos(a) * r, .3 + R() * .6, Math.sin(a) * r * .8 + 2, Math.pow(i / NL, .7)]; });
  const nightL = particles(NL, (i, t, o) => { const L = LT[i]; o.x = L[0]; o.y = L[1]; o.z = Math.max(SEA_Z + 3, L[2]); o.a = U.lights > L[3] ? 2.0 : 0; o.s = .38; o.r = 2.4; o.g = 1.6; o.b = .7; }, { soft: 1 });
  scene.add(nightL); U.lights = 0;
  // air: petals + motes
  const PE = [...Array(90)].map(() => [R() * 30 - 15, R() * 6, R() * 24 - 12, R() * 9]);
  const petals = particles(PE.length, (i, t, o) => { const p = PE[i]; o.x = p[0] + ((t * .6 + p[3]) % 12) - 6; o.y = ((p[1] - t * .25) % 6 + 6) % 6; o.z = p[2] + Math.sin(t + p[3]) * .5; o.a = U.petals; o.s = .045; o.r = 1.6; o.g = .9; o.b = 1.2; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(petals); U.petals = 1;
  const fill = new THREE.PointLight('#fff2dc', 1.2, 8, 2); scene.add(fill);

  // —— cameras (per shot, u = 0..1 through the shot) ——
  const CAM = {
    world: { p: track([[0, [0, 26, .3]], [.3, [2, 16, 9]], [1, [3.5, 9.5, 12]]]), l: track([[0, [0, 0, 0]], [.3, [0, .2, 0]], [1, [0, .3, -.5]]]), fov: [40, 38] },
    secret: { p: track([[0, [1.2, 4.2, 2.4]], [1, [-.3, 3.0, -1.4]]]), l: track([[0, [-1.2, .4, -4.2]], [1, [SECRET.x, SECRET.y + .3, SECRET.z]]]), fov: [36, 32] },
    rush: { p: track([[0, [2, 5, 9]], [1, [1, 11, 14]]]), l: track([[0, [0, .5, 0]], [1, [0, .3, -1]]]), fov: [38, 42] },
    phenom: { p: track([[0, [1.2, 4.0, 4.4]], [1, [-.4, 6.5, 7.5]]]), l: track([[0, [BIG.x + .6, .9, BIG.z + 1.4]], [1, [BIG.x + .5, 1.0, BIG.z + 1.0]]]), fov: [34, 38] },
    lights: { p: track([[0, [0, 34, 6]], [1, [0, 40, 9]]]), l: track([[0, [0, 0, -1]], [1, [0, 0, -1]]]), fov: [42, 44] },
    coast: { p: track([[0, [3, 5.0, -13]], [1, [3.5, 8.5, -9.5]]]), l: track([[0, [3, 1.0, -60]], [1, [3, 0, -60]]]), fov: [46, 48] },
    kids: { p: track([[0, [-6, 6, 10]], [.65, [3, 7.5, 11]], [.82, [3, 11, 14]], [1, [2, 22, 16]]]), l: track([[0, [-2, .5, 0]], [.65, [1, .5, -1]], [1, [0, 0, -2]]]), fov: [38, 40] },
  };
  const K = {
    day: { sun: '#fff0c8', si: 2.8, sky: ['#3f86e0', '#8cc4f4', '#fff0d0'], fog: '#d8ecf0', fd: .012, hemi: 1.05, exp: 1.12 },
    gold: { sun: '#ffc070', si: 2.6, sky: ['#4a70c0', '#e0a8a0', '#ffd090'], fog: '#f0d8b8', fd: .012, hemi: .9, exp: 1.12 },
    night: { sun: '#6a80c8', si: .35, sky: ['#060a20', '#141c44', '#2a3060'], fog: '#141a34', fd: .01, hemi: .3, exp: 1.25 },
    dawn: { sun: '#ffb07a', si: 2.2, sky: ['#5a6ab0', '#f0a8a8', '#ffe0b0'], fog: '#f0d0c4', fd: .009, hemi: .85, exp: 1.12 },
  };
  function update(t, shot, camera, post, renderer) {
    const id = shot.id, u = seg(t, shot.a, shot.b); U.time.value = t;
    const key = { secret: K.gold, lights: K.night, coast: K.dawn }[id] || K.day;
    sun.color.set(key.sun); sun.intensity = key.si; SKY.u.top.value.set(key.sky[0]); SKY.u.mid.value.set(key.sky[1]); SKY.u.hor.value.set(key.sky[2]);
    scene.fog.color.set(key.fog); scene.fog.density = key.fd; hemi.intensity = key.hemi;
    // camera
    const C = CAM[id] || CAM.world; camera.position.set(...C.p(u)); camera.lookAt(...C.l(u)); camera.fov = lerp(C.fov[0], C.fov[1], u);
    if (id === 'lights') { camera.up.set(0, 0, -1); camera.lookAt(...C.l(u)); } else camera.up.set(0, 1, 0);
    // water
    for (const W of [RIV, SEA]) { W.u.t.value = t; W.u.camPos.value.copy(camera.position); W.u.fogColor.value.copy(scene.fog.color); W.u.fogDensity.value = scene.fog.density; W.setLights([{ p: new THREE.Vector3(10, 8, -60), c: sun.color, i: id === 'coast' ? 1.4 : .7 }]); }
    // windows + night lights
    const night = id === 'lights' ? 1 : 0;
    U.lights = id === 'lights' ? ss(seg(t, shot.a + .3, T.games + 2.2)) : 0;
    homes.forEach((h, i) => h.userData.windows.forEach(w => w.material.emissiveIntensity = night * (U.lights > i / 12 ? 2.4 : 0)));
    nightL.visible = night > 0; nightL.userData.update(t);
    // creatures wander
    puffs.forEach((p, i) => { const [x, z] = PU[i], b = Math.abs(Math.sin(t * 3 + i)); p.root.position.set(x + Math.sin(t * .4 + i) * .8, b * .25, z + Math.cos(t * .3 + i) * .5); p.frame(b > .7 ? 'b1' : 'b0'); p.face(camera); });
    snails.forEach((p, i) => { const [x, z] = SN[i]; p.root.position.set(x + t * .05 % 2, 0, z); p.frame(Math.floor(t * 2 + i) % 2 ? 's1' : 's0'); p.face(camera); });
    moths.forEach((p, i) => { const [x, z] = MO[i]; p.root.position.set(x + Math.sin(t * .5 + i) * 1.5, 1.4 + Math.sin(t * 1.3 + i) * .4, z + Math.cos(t * .4 + i)); p.frame(Math.floor(t * 8 + i) % 2 ? 'f1' : 'f0'); p.face(camera); });
    glows.forEach((p, i) => { const [x, z] = GL[i]; p.root.position.set(x + Math.sin(t * .7 + i * 2) * 1.2, .9 + Math.sin(t * 2 + i) * .3, z + Math.cos(t * .6 + i) * .9); p.frame(['f0', 'f1', 'f2'][Math.floor(t * 18 + i) % 3]); p.face(camera); });
    // kids: none in the empty square; stream in for rush; wander for kids/phenom/coast
    const kidOn = id === 'rush' || id === 'kids' || id === 'phenom' || id === 'coast' || (id === 'world' && u < .25);
    kids.forEach((k, i) => {
      const r = KR[i]; k.root.visible = kidOn && !(id === 'coast' && i > 5);
      if (!k.root.visible) return;
      const [ax, az, bx, bz] = r.p; let f;
      if (id === 'rush') f = 1 - clamp((t - T.rushIn) * .2 * r.sp + r.ph * .2);   // from the path ends toward the plaza
      else f = (r.ph + t * .02 * r.sp) % 1;
      const x = lerp(ax, bx, f) + (i % 3 - 1) * .5, z = lerp(az, bz, f) + ((i >> 2) % 3 - 1) * .4;
      k.root.position.set(x, 0, z); k.frame(['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9 + i) % 4]); k.face(camera, id === 'rush' ? bx > ax : bx < ax);
    });
    pair.forEach((k, i) => { k.root.visible = id === 'phenom' || id === 'kids'; k.root.position.copy(pairPos(i)); k.frame(Math.floor(t * 1.5 + i) % 2 ? 'i1' : 'i0'); k.face(camera, i === 1); });
    U.arc = id === 'phenom' || id === 'kids' ? 1 : 0; arc.visible = U.arc > 0; arc.userData.update(t);
    const ak = (t * .7 % 1), a0 = pairPos(0), b0 = pairPos(1); arcG.visible = arc.visible; arcG.position.set(lerp(a0.x, b0.x, ak), 1.0 + Math.sin(ak * Math.PI) * 1.1, lerp(a0.z, b0.z, ak));
    // the secret's glow
    U.secret = id === 'secret' ? ss(seg(t, T.secret, T.secret + 1.0)) : 0;
    secret.visible = U.secret > 0; secret.material.color.set('#ff7ad0').multiplyScalar(U.secret * (1 + .25 * Math.sin(t * 6))); secret.scale.setScalar(1 + .15 * Math.sin(t * 3)); sparks.userData.update(t); sparks.visible = secret.visible;
    // tumbleweed through the empty square
    const tw = seg(t, T.tumble, T.tumble + 3.4); tumble.visible = id === 'world' && tw > 0 && tw < 1;
    tumble.position.set(lerp(-7, 7, tw), .35 + Math.abs(Math.sin(tw * 18)) * .3, 1.5); tumble.rotation.z = -tw * 20; tumble.lookAt(camera.position.x, tumble.position.y, camera.position.z); tumble.rotateZ(-tw * 20);
    spray.userData.update(t);
    petals.userData.update(t); U.petals = night ? 0 : 1;
    fill.position.set(camera.position.x * .3, 2.5, camera.position.z * .3 + 2); fill.intensity = night ? 0 : 1.0;
    // sun + shadows around the look target
    const lt = new THREE.Vector3(...C.l(u)); sun.target.position.copy(lt); sun.position.copy(lt).add(SUN_OFF);
    // post: the world starts as the 4-shade screen and blooms into colour; the kids shot shrinks back into it
    const V = post.vig.uniforms;
    V.gb.value = id === 'world' ? 1 - ss(seg(t, shot.a + .2, shot.a + 1.8)) : id === 'kids' ? ss(seg(t, T.shrink + .2, shot.b - .1)) : 0;
    renderer.toneMappingExposure = key.exp; post.bloom.strength = night ? .9 : .55; post.bloom.threshold = night ? .6 : .82;
    V.amt.value = .5; V.sat.value = 1.22; V.warm.value = id === 'coast' ? .16 : .08; V.contrast.value = .22;
    const fp = id === 'secret' ? SECRET : id === 'phenom' ? pairPos(0).clone().setY(.9) : lt;
    post.dof.focus = camera.position.distanceTo(fp); post.dof.aper = id === 'secret' || id === 'phenom' ? 120 : 260; post.dof.maxCoc = 20;
    if (id !== 'lights' && id !== 'secret') { post.dof.tiltAmt = 14; post.dof.tiltC = id === 'phenom' ? .42 : .45; post.dof.tiltW = .1; }
  }
  return { scene, update };
}
