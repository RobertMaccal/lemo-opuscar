// Set 1: summer satoyama outside Tokyo — meadow, woods, stream, paddies — and the town that grows over it.
// Shots: leaf (macro → wide), path (lateral track), stream (dive close), change (crane up, transformation), wire (dusk power line), home (leaf again).
import * as THREE from 'three';
import { PPM, texOf, spriteMats, billboard, glow, radialTex, blob, mulberry, h2, woodPlanks, rock, shingles, plaster } from './px.js';
import { mat, mesh, house, mats } from './kit.js';
import { sky, sea, particles, beamCard } from './fx.js';
import { makeBoy, beetleAtlas, smallFlyers, sprite } from './chars.js';
import { clamp, seg, ss, eio, eo, lerp, track, monotone } from '/core/lib.js';
import { T } from './timeline.js';
import { bark, canopy, grassTuft, flowers, bigLeaf, summerGround, townGround, concrete, facade, ridgeTex } from './art.js';

// —— world masks ——
export const streamX = z => 4.6 + 1.4 * Math.sin(z * .16) + 1.1 * Math.sin(z * .05 + 1);
export const pathZ = x => 1.0 + .6 * Math.sin(x * .17) + (x > 6 ? (x - 6) * -.18 : 0);
const PAD = { x0: 8.4, x1: 27, z0: -21, z1: 3.2, cw: 4.6, cd: 3.4 };
const M = {
  stream: (x, z) => Math.abs(x - streamX(z)) - 1.0,
  paddy: (x, z) => { if (x < PAD.x0 || x > PAD.x1 || z < PAD.z0 || z > PAD.z1) return 0; const u = ((x - PAD.x0) % PAD.cw + PAD.cw) % PAD.cw, v = ((z - PAD.z0) % PAD.cd + PAD.cd) % PAD.cd; return (u < .32 || v < .32) ? 2 : 1; },
  path: (x, z) => Math.abs(z - pathZ(x)) / .8,
  shade: (x, z) => (x > -11 && x < 2.6 && z < 0) ? .5 : 0,
};
export const LEAF = new THREE.Vector3(-13.2, .9, 2.55);
const OAK = new THREE.Vector3(-4.2, 0, -.55);
const ROCK = new THREE.Vector3(3.15, 0, -1.7);
const CITY_O = new THREE.Vector2(30, -32);           // the town spreads from the back right
const cityD = (x, z) => clamp(Math.hypot(x - CITY_O.x, z - CITY_O.y) / 60);

export function buildCountry() {
  const scene = new THREE.Scene();
  const R = mulberry(7);
  const U = { time: { value: 0 }, prog: { value: 0 } };   // shared shader uniforms (wind time, town reveal)
  const SKY = sky({ top: '#4f8fd6', mid: '#9cc6ea', hor: '#f6e9c6', moonDir: new THREE.Vector3(.55, .32, -.75), moonCol: '#fff1c8', moonI: 1.2 });
  scene.add(SKY.mesh);
  scene.fog = new THREE.FogExp2('#d6e4cc', .014);

  // —— light: warm low morning sun from the right, cool sky fill ——
  const sun = new THREE.DirectionalLight('#ffe0a8', 2.7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#b8d6ff', '#4a5a2a', 1.0); scene.add(hemi);
  const fill = new THREE.PointLight('#fff2dc', 1.4, 7, 2); scene.add(fill);   // front fill on the boy (billboards only have a front normal)
  const SUN_OFF = new THREE.Vector3(16, 19, 9);

  // —— ground ——
  const GX0 = -34, GX1 = 34, GZ0 = -40, GZ1 = 14, GW = GX1 - GX0, GD = GZ1 - GZ0, gp = 14;
  const toW = (u, v) => [GX0 + u * GW, GZ0 + v * GD];
  const gtex = texOf(summerGround(GW * gp, GD * gp, toW, M));
  const gmat = new THREE.MeshStandardMaterial({ map: gtex, roughness: .95, alphaTest: .5 });
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), gmat); gnd.rotation.x = -Math.PI / 2; gnd.position.set((GX0 + GX1) / 2, 0, (GZ0 + GZ1) / 2); gnd.receiveShadow = true; scene.add(gnd);
  // stream bed + water (pixel ripple shader)
  const bedG = new THREE.PlaneGeometry(4, GD, 1, 80); { const p = bedG.attributes.position; for (let i = 0; i < p.count; i++) { const z = -p.getY(i) + (GZ0 + GZ1) / 2; p.setX(i, p.getX(i) + streamX(z)); } }
  const bed = new THREE.Mesh(bedG, new THREE.MeshStandardMaterial({ color: '#2c4632', roughness: 1 })); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -.35, (GZ0 + GZ1) / 2); scene.add(bed);
  const WATER = sea(10, { ppm: 14, deep: '#2f6e6a', shallow: '#5aa69a', crest: '#d8f6ea' });
  WATER.mesh.geometry = bedG.clone(); WATER.mesh.position.set(0, -.07, (GZ0 + GZ1) / 2); scene.add(WATER.mesh);
  // banks: low stones along the edges
  const stoneM = mat(rock(48, 48, { seed: 3, cols: ['#3a3e36', '#565a4e', '#72766a', '#909486', '#b0b2a4'] }));
  for (let z = GZ0 + 2; z < GZ1; z += .9 + R() * .6) for (const s of [-1, 1]) { if (R() < .35) continue; const r = .16 + R() * .2, g = new THREE.DodecahedronGeometry(r, 0); g.scale(1.3, .6, 1); g.translate(streamX(z) + s * (1.0 + R() * .25), r * .2, z); scene.add(mesh(g, stoneM)); }
  // writing rock
  { const g = new THREE.DodecahedronGeometry(.62, 1); g.scale(1.25, .55, .9); g.translate(ROCK.x, .22, ROCK.z); scene.add(mesh(g, stoneM)); }
  // plank bridge over the stream
  const MM = mats();
  const bz = pathZ(streamX(1)), bx = streamX(bz);
  { const deck = mesh(new THREE.BoxGeometry(3.0, .12, 1.1).translate(bx, .1, bz), MM.plank); scene.add(deck);
    for (const s of [-1, 1]) { const rail = mesh(new THREE.BoxGeometry(3.0, .08, .08).translate(bx, .62, bz + s * .5), MM.beam); scene.add(rail); for (const dx of [-1.4, 0, 1.4]) scene.add(mesh(new THREE.BoxGeometry(.09, .62, .09).translate(bx + dx, .32, bz + s * .5), MM.beam)); } }

  // —— vegetation ——
  const barkM = [bark(48, 48, 3), bark(48, 48, 7)].map(c => mat(c, { rough: .95 }));
  const canTex = [0, 1, 2, 3].map(i => texOf(canopy(150, 104, 11 + i * 7, { n: 8 + i })));
  const swayMat = (m, amp = .06) => { m.onBeforeCompile = sh => { sh.uniforms.uTime = U.time; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n vec4 wp0 = modelMatrix * vec4(position, 1.); \n#ifdef USE_INSTANCING\n wp0 = modelMatrix * instanceMatrix * vec4(position,1.);\n#endif\n float hk = max(position.y, 0.); transformed.x += sin(uTime * 1.7 + wp0.x * .6 + wp0.z * .4) * ${amp.toFixed(3)} * hk + sin(uTime * 3.1 + wp0.z) * ${(amp * .3).toFixed(3)} * hk;`); }; m.customProgramCacheKey = () => 'sway' + amp; return m; };
  const trees = [];
  function tree(x, z, r, hgt, o = {}) {
    const g = new THREE.Group();
    const geo = new THREE.CylinderGeometry(r * .78, r * 1.05, hgt, 10, 3); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + (h2(i % 11, Math.round(y), 5) - .5) * .12; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    geo.translate(0, hgt / 2, 0); g.add(mesh(geo, barkM[o.b ?? 0]));
    const nC = o.canopy ?? 4;
    for (let k = 0; k < nC; k++) {
      const s = (o.cs ?? 5) * (.75 + R() * .5), c = billboard(canTex[(k + (o.b ?? 0)) % 4], s, s * .69, { ay: .5, shadow: true });
      swayMat(c.material, .035); c.position.set((R() - .5) * s * .55, hgt * (o.ch ?? .85) + (R() - .3) * 1.4, (R() - .5) * 1.4); g.add(c);
    }
    g.position.set(x, 0, z); scene.add(g);
    const T0 = { g, h: hgt + 3, d: cityD(x, z), keep: o.keep };
    trees.push(T0); return g;
  }
  const clear = (x, z, m = 1.6) => Math.abs(z - pathZ(x)) > m && M.stream(x, z) > 1.2 && !M.paddy(x, z) && Math.hypot(x - LEAF.x, z - LEAF.z) > 2.2 && Math.hypot(x - OAK.x, z - OAK.z) > 1.4 && Math.hypot(x - ROCK.x, z - ROCK.z) > 1.8;
  // woods: back rows dense, front sparse
  for (let x = -11; x < 2.4; x += 1.6 + R() * 1.4) { const z = -2.4 - R() * 3; if (clear(x, z)) tree(x + R() * .5, z, .26 + R() * .2, 6.5 + R() * 3, { b: R() > .5 ? 1 : 0 }); }
  for (let x = -12; x < 3; x += 2.2 + R() * 1.6) { const z = -6.5 - R() * 4; if (clear(x, z)) tree(x, z, .32 + R() * .22, 8 + R() * 3, { b: 1, cs: 6 }); }
  for (let x = -10; x < 1.5; x += 3.6 + R() * 2.4) { const z = 3.6 + R() * 2.2; if (clear(x, z, 1.8)) tree(x, z, .28 + R() * .15, 8.5, { b: 0, cs: 5.5, ch: .8 }); }
  // meadow + far side: scattered trees, tree lines along the paddies and back hills
  [[-21, -7], [-24, -2], [-27, -12], [-9.5, -14], [-19, -16]].forEach(([x, z]) => tree(x, z, .3, 7, { cs: 5.5 }));
  for (let x = 7; x < 30; x += 2.6 + R() * 2) tree(x, -24 - R() * 3, .3, 7 + R() * 2, { cs: 5 });
  for (let z = -18; z < 6; z += 3 + R() * 2) tree(28.5 + R(), z, .3, 7, { cs: 5 });
  for (let x = -30; x < 30; x += 2.2 + R() * 1.4) tree(x, -31 - R() * 6, .35, 9 + R() * 3, { cs: 6.5, b: 1 });
  // the oak with the beetle (stays)
  tree(OAK.x, OAK.z, .5, 10, { b: 0, cs: 6.5, canopy: 5, keep: true });

  // grass tufts, flowers, ferns: instanced, wind sway in the vertex shader
  function scatter(canvas, wM, hM, n, place, amp = .12) {
    const tex = texOf(canvas), S = spriteMats(tex, null); swayMat(S.m, amp);
    const geo = new THREE.PlaneGeometry(wM, hM).translate(0, hM / 2, 0);
    const im = new THREE.InstancedMesh(geo, S.m, n); im.castShadow = true; im.customDepthMaterial = S.depth; im.customDistanceMaterial = S.dist;
    const o = new THREE.Object3D(); const rec = [];
    for (let i = 0; i < n; i++) { const [x, z, s] = place(i); o.position.set(x, 0, z); o.rotation.set(0, (R() - .5) * .6, 0); o.scale.set(s * (R() > .5 ? 1 : -1), s, s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); rec.push([x, z, s]); }
    im.userData.rec = rec; scene.add(im); return im;
  }
  const offPath = (x0, x1, z0, z1, m = .9) => { for (let k = 0; k < 60; k++) { const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0); if (clear(x, z, m)) return [x, z]; } return [x0, z0 - 40]; };
  const grassIM = [grassTuft(18, 12, 4), grassTuft(20, 14, 9), grassTuft(16, 11, 13)].map(c => scatter(c, .7, .47, 260, () => { const [x, z] = offPath(-30, 30, -26, 10, .8); return [x, z, .8 + R() * .8]; }));
  const flowerIM = [flowers(16, 12, 5), flowers(16, 12, 8)].map(c => scatter(c, .5, .38, 110, () => { const [x, z] = offPath(-30, -9, -10, 10, .9); return [x, z, .9 + R() * .6]; }, .16));
  // bushes along path and stream (canopy texture, low)
  const bushes = [];
  for (let i = 0; i < 46; i++) { const [x, z] = offPath(-28, 27, -20, 9, 1.4); const s = 1.1 + R() * 1.4, b = billboard(canTex[i % 4], s, s * .69, { ay: .1 }); swayMat(b.material, .05); b.position.set(x, 0, z); scene.add(b); bushes.push({ b, d: cityD(x, z) }); }

  // —— the hero leaf on a bush by the path; the beetle on it ——
  const bush = new THREE.Group(); scene.add(bush);
  for (let k = 0; k < 4; k++) { const s = 1.05 + k * .12, b = billboard(canTex[(k + 1) % 4], s, s * .69, { ay: .05 }); swayMat(b.material, .04); b.position.set(LEAF.x - .25 + k * .18, 0, LEAF.z - .35 - k * .12); bush.add(b); }
  const leafG = new THREE.PlaneGeometry(.46, .26, 16, 6); { const p = leafG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -x * x * .9 - Math.abs(y) * .18 + y * y * .6); } leafG.computeVertexNormals(); }
  const leafM = new THREE.MeshStandardMaterial({ map: texOf(bigLeaf(84, 46)), alphaTest: .5, side: THREE.DoubleSide, roughness: .55 });
  const leaf = new THREE.Mesh(leafG, leafM); leaf.castShadow = true; leaf.receiveShadow = true;
  leaf.position.copy(LEAF); leaf.rotation.set(-Math.PI / 2 + .5, 0, .35); scene.add(leaf);
  const leafStem = mesh(new THREE.CylinderGeometry(.008, .012, .5).translate(0, -.25, 0), barkM[0]); leafStem.position.copy(LEAF).add(new THREE.Vector3(-.2, -.02, .03)); leafStem.rotation.z = .5; 
  const BA = beetleAtlas();
  const beetle = sprite(BA, 1 / 300, { name: 'beetle', blob: false, emI: 1.2, capK: 1.6 });
  scene.add(beetle.root);
  const beetleOnLeaf = LEAF.clone().add(new THREE.Vector3(.02, .03, .02));
  const dew = glow('#eaffff', .022, .9); scene.add(dew);
  const dewDot = new THREE.Mesh(new THREE.SphereGeometry(.0065, 8, 6), new THREE.MeshStandardMaterial({ color: '#dff8ff', emissive: '#bfefff', emissiveIntensity: .8, roughness: .1, transparent: true, opacity: .85 })); scene.add(dewDot);
  // the second beetle, on the oak trunk (shot 2)
  const beetle2 = sprite(BA, 1 / 105, { name: 'beetle2', blob: false, capK: 1.6 }); scene.add(beetle2.root);

  // —— far hills, farmhouse ——
  [['#7f9c86', '#9ab4a0', -60, 70, 22, 3, .010], ['#91ad98', '#acc4ae', -78, 110, 30, 9, .007]].forEach(([c, h, z, w, hh, s, f]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, hh).translate(0, hh / 2, 0), new THREE.MeshBasicMaterial({ map: texOf(ridgeTex(w * 4, hh * 4, c, h, s, { f })), transparent: true, alphaTest: .5, fog: true })); m.position.set(0, -1, z); scene.add(m);
  });
  const farm = house({ x: 17, z: -25.5, w: 6, d: 4.2, h: 2.8, wall: 'wall3', roof: 'roof3', door: 1.2, chimney: false, windows: [[-1.6, 1.4], [1.6, 1.4]] });
  farm.userData.windows.forEach(w => w.material = w.material.clone()); scene.add(farm);
  farm.userData.windows.forEach(w => w.material.emissiveIntensity = 0);

  // —— the town (revealed by U.prog) ——
  const town = new THREE.Group(); scene.add(town);
  const revealMat = (m, key) => {   // pixel-quantised reveal front from the town origin
    m.onBeforeCompile = sh => {
      sh.uniforms.uProg = U.prog;
      sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
      sh.fragmentShader = 'uniform float uProg; varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n vec2 q = floor(vWp.xz * 2.) / 2.; float dd = clamp(length(q - vec2(${CITY_O.x.toFixed(1)}, ${CITY_O.y.toFixed(1)})) / 60., 0., 1.); float nn = fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453) * .05; if (dd + nn > uProg * 1.25) discard;`);
    };
    m.customProgramCacheKey = () => 'reveal' + key; return m;
  };
  // town ground over the paddies and the back fields
  { const TX0 = 6, TX1 = 34, TZ0 = -40, TZ1 = 4.5, tw = TX1 - TX0, td = TZ1 - TZ0;
    const tt = texOf(townGround(tw * 12, td * 12, (u, v) => [TX0 + u * tw, TZ0 + v * td]));
    const m = revealMat(new THREE.MeshStandardMaterial({ map: tt, roughness: .9 }), 'tg');
    const p = new THREE.Mesh(new THREE.PlaneGeometry(tw, td), m); p.rotation.x = -Math.PI / 2; p.position.set((TX0 + TX1) / 2, .025, (TZ0 + TZ1) / 2); p.receiveShadow = true; town.add(p); }
  // road crossing the valley + its bridge, revealed too
  const ROADZ = -6.2;
  { const P = 12, len = 68, c = document.createElement('canvas'); c.width = len * P; c.height = 3.2 * P | 0; const x = c.getContext('2d');
    x.fillStyle = '#3c3c44'; x.fillRect(0, 0, c.width, c.height); for (let i = 0; i < c.width; i += 2) for (let j = 0; j < c.height; j += 2) if (h2(i, j, 4) > .8) { x.fillStyle = h2(i, j, 5) > .5 ? '#4a4a54' : '#30303a'; x.fillRect(i, j, 2, 2); }
    x.fillStyle = '#d8d4c0'; for (let i = 0; i < c.width; i += 36) x.fillRect(i, c.height / 2 - 1, 18, 2); x.fillStyle = '#8a8680'; x.fillRect(0, 0, c.width, 3); x.fillRect(0, c.height - 3, c.width, 3);
    const t = texOf(c); const m = revealMat(new THREE.MeshStandardMaterial({ map: t, roughness: .85, polygonOffset: true, polygonOffsetFactor: -2 }), 'road');
    const road = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.2), m); road.rotation.x = -Math.PI / 2; road.position.set(0, .04, ROADZ); road.receiveShadow = true; town.add(road);
    const deck = mesh(new THREE.BoxGeometry(3.6, .3, 3.4).translate(streamX(ROADZ), .05, ROADZ), mat(concrete(48, 48, 5))); deck.material = revealMat(deck.material.clone(), 'deck'); town.add(deck); }
  // buildings: danchi slabs + houses, rising from the ground
  const buildings = [];
  const facM = [0, 1, 2].map(i => { const f = facade(96, 84, 3 + i, { wall: [['#7a766e', '#96928a', '#b0aca2', '#c8c4b8'], ['#8a8274', '#a69c8a', '#c0b6a2', '#d6ccb6'], ['#6e7478', '#8a9094', '#a6acae', '#c0c6c6']][i] }); const m = new THREE.MeshStandardMaterial({ map: texOf(f.c, { repeat: [1, 1] }), emissiveMap: texOf(f.e, { repeat: [1, 1] }), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: .9 }); m.userData.tile = 96 / 24; return m; });
  const roofM = mat(concrete(48, 48, 9, ['#4a4a50', '#5c5c62', '#6e6e74', '#808086']));
  function slab(x, z, w, d, h, k, ry = 0) {
    const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), facM[k]); g.add(b);
    const r = mesh(new THREE.BoxGeometry(w + .2, .25, d + .2).translate(0, h + .12, 0), roofM); g.add(r);
    g.position.set(x, 0, z); g.rotation.y = ry; town.add(g); buildings.push({ g, h: h + .5, d: cityD(x, z) }); return g;
  }
  [[15, -14, 12, 3.6, 7.5, 0], [16, -20, 12, 3.6, 9, 1], [24, -12, 3.6, 12, 8.4, 2, 0], [12, -30, 14, 3.6, 10.5, 2], [26, -26, 10, 3.6, 12, 0], [22, -2, 8, 3.2, 6, 1], [-8, -34, 12, 3.6, 9, 1], [4, -36, 14, 3.6, 11, 0], [-22, -30, 10, 3.6, 8, 2], [32, -6, 3.6, 10, 9, 1]].forEach(([x, z, w, d, h, k]) => slab(x, z, w, d, h, k));
  const homes = [];
  [[11, -6.8], [14.5, -8.9], [18.4, -7.3], [10.2, -24], [-15, -14], [-19, -17], [-12, -18.5], [20, 1.4]].forEach(([x, z], i) => {
    const hh = house({ x, z, w: 3.6, d: 3, h: 2.4, wall: ['wall2', 'wall3', 'wall2'][i % 3], roof: ['roof2', 'roof', 'roof2'][i % 3], chimney: false, windows: [[-.8, 1.2], [.8, 1.2]], door: false });
    hh.userData.windows.forEach(w => w.material = w.material.clone()); town.add(hh); buildings.push({ g: hh, h: 6, d: cityD(x, z) }); homes.push(hh);
  });
  // utility poles along the road + sagging wires
  const poleM = mat(concrete(24, 24, 11, ['#4a4844', '#5e5c56', '#74726a', '#8a887e']));
  const poles = [], PZ = ROADZ - 2.1, PTOP = 7.2;
  for (let x = -30; x <= 30; x += 8.5) {
    const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.11, .16, PTOP, 8).translate(0, PTOP / 2, 0), poleM));
    g.add(mesh(new THREE.BoxGeometry(1.8, .1, .1).translate(0, PTOP - .45, 0), poleM)); g.add(mesh(new THREE.BoxGeometry(1.2, .08, .08).translate(0, PTOP - 1.1, 0), poleM));
    const tr = mesh(new THREE.CylinderGeometry(.22, .22, .7, 8).translate(.32, PTOP - 1.9, 0), poleM); g.add(tr);
    g.position.set(x, 0, PZ); town.add(g); poles.push({ g, x, d: cityD(x, PZ) });
  }
  const wireM = new THREE.MeshBasicMaterial({ color: '#1e1c22', fog: true });
  const wires = [];
  for (let i = 0; i < poles.length - 1; i++) for (const [dx, dy] of [[-.8, -.4], [0, -.4], [.8, -.4], [-.5, -1.06], [.5, -1.06]]) {
    const a = new THREE.Vector3(poles[i].x, PTOP + dy, PZ + dx * .02 + dx), b = new THREE.Vector3(poles[i + 1].x, PTOP + dy, PZ + dx);
    a.z = PZ; b.z = PZ; a.x += 0; const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push(new THREE.Vector3(lerp(a.x, b.x, u), a.y - Math.sin(u * Math.PI) * .55, PZ + dx * .25)); }
    const w = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .016, 4), wireM); w.castShadow = true; town.add(w); wires.push({ w, i });
  }
  // street lamps (dusk)
  const lamps = [];
  for (let x = -24; x <= 24; x += 12) { const lp = new THREE.PointLight('#ffb866', 0, 9, 1.6); lp.position.set(x + 4, 4.6, ROADZ + 1.8); town.add(lp); const gl = glow('#ffc47a', 1.1, 0); gl.position.copy(lp.position); town.add(gl); lamps.push({ lp, gl }); }

  // —— air: dust motes in the sun, falling leaves, pollen; dragonfly and butterflies ——
  const DM = [...Array(160)].map(() => [-24 + R() * 40, R() * 5, -8 + R() * 14, R() * 20]);
  const motes = particles(DM.length, (i, t, o) => { const d = DM[i]; o.x = d[0] + Math.sin(t * .23 + d[3]) * .5 + t * .05; o.y = ((d[1] + t * .08 + Math.sin(t * .5 + d[3]) * .2) % 5 + 5) % 5; o.z = d[2] + Math.cos(t * .19 + d[3]) * .4; o.a = (.35 + .35 * Math.sin(t * 1.3 + d[3] * 3)) * U.motes; o.s = .035; o.r = 1.6; o.g = 1.4; o.b = .9; }, { soft: 1 });
  scene.add(motes); U.motes = 1;
  const FL = [...Array(26)].map(() => [-14 + R() * 16, 4 + R() * 4, -4 + R() * 8, R() * 10, .4 + R() * .5]);
  const leafTex = texOf((() => { const c = document.createElement('canvas'); c.width = 4; c.height = 3; const x = c.getContext('2d'); x.fillStyle = '#7aa83a'; x.fillRect(0, 0, 4, 3); x.fillStyle = '#a8cc4a'; x.fillRect(1, 0, 2, 1); return c; })());
  const fallers = FL.map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.09, .065), new THREE.MeshStandardMaterial({ map: leafTex, side: THREE.DoubleSide, roughness: .8 })); scene.add(m); return m; });
  const SF = smallFlyers();
  const dragon = sprite(SF.dragonfly, 1 / 110, { name: 'dragonfly', blob: false, capK: 1.8 }); scene.add(dragon.root);
  const flies = [0, 1].map(() => { const s = sprite(SF.butterfly, 1 / 120, { name: 'butterfly', blob: false, capK: 1.8 }); scene.add(s.root); return s; });
  // sun shafts through the canopy (beam cards)
  const sunDir = SUN_OFF.clone().normalize().negate();
  const shafts = [[-7.5, -1.2, 1], [-2.2, -.4, .8], [-9.8, .8, .7], [.6, -1.8, .7]].map(([x, z, k]) => { const top = new THREE.Vector3(x, 0, z).addScaledVector(sunDir, -12); const b = beamCard(12.8, .9, 2.0, '#ffe6a8', { k: .3 * k, fall: .5 }); scene.add(b); return { b, top, k }; });
  const SUNP = new THREE.Vector3(60, 22, -70);

  // —— the boy ——
  const boy = makeBoy(); scene.add(boy.root);

  // —— helpers ——
  const v3 = (a) => new THREE.Vector3(...a);
  function walkFrame(t, fps = 8) { return ['w0', 'w1', 'w2', 'w3'][Math.floor(t * fps) % 4]; }
  function idle(t, base = 'idle') { const b = Math.floor(t * 1.6) % 2; return (t % 3.7) < .12 ? 'blink' : b ? 'idle1' : 'idle0'; }
  const cam = { p: new THREE.Vector3(), l: new THREE.Vector3() };

  // camera tracks per shot (absolute times)
  const LK = LEAF.clone();
  const C_leaf = { p: track([[0, [LK.x + .08, LK.y + .3, LK.z + .5]], [1.8, [LK.x + .09, LK.y + .36, LK.z + .62]], [5.6, [-12.8, 10.5, 15.5]]]), l: track([[0, [LK.x, LK.y + .02, LK.z]], [1.8, [LK.x, LK.y + .02, LK.z]], [5.6, [-14.4, .2, -5.5]]]) };
  const C_path = { p: track([[5.6, [-7.0, 4.4, 8.4]], [8.4, [-4.0, 3.6, 7.0]], [10.6, [-3.2, 2.6, 5.2]]]), l: track([[5.6, [-6.6, .8, .6]], [8.4, [-4.4, .7, -.1]], [10.6, [-4.3, .8, -.3]]]) };
  const C_stream = { p: track([[10.6, [7.6, 4.6, 6.4]], [13.0, [5.8, 3.0, 4.2]], [16.0, [4.6, 1.9, 2.6]]]), l: track([[10.6, [4.4, .3, -2.2]], [13.0, [3.6, .55, -1.9]], [16.0, [3.25, .7, -1.75]]]) };
  const C_change = { p: track([[16.0, [4.4, 2.2, 2.4]], [18.0, [3.0, 5.5, 6.2]], [24.2, [-2.0, 19, 21]]]), l: track([[16.0, [3.6, .9, -1.4]], [18.0, [5.0, 1.0, -4.0]], [24.2, [9.0, 1.0, -12]]]) };
  const C_wire = { p: track([[24.2, [12.6, 2.2, -1.2]], [28.0, [3.8, 4.2, -2.6]]]), l: track([[24.2, [10.0, 7.0, -8.3]], [28.0, [-1.0, 7.2, -8.3]]]) };
  const C_home = { p: track([[55.6, [LK.x + .09, LK.y + .36, LK.z + .62]], [57.4, [LK.x - .2, LK.y + .5, LK.z + 1.25]], [60.0, [LK.x - .32, LK.y + .62, LK.z + 1.6]]]), l: track([[55.6, [LK.x, LK.y + .02, LK.z]], [57.4, [LK.x - .35, LK.y + .2, LK.z - .1]], [60.0, [LK.x - .35, LK.y + .28, LK.z - .1]]]) };
  const CAMS = { leaf: C_leaf, path: C_path, stream: C_stream, change: C_change, wire: C_wire, home: C_home };

  // light keys (morning → hazy noon → dusk; home = golden late afternoon)
  const K = {
    morning: { sun: '#ffe0a8', si: 2.7, sky: ['#4f8fd6', '#9cc6ea', '#f6e9c6'], fog: '#d6e4cc', fd: .014, hemi: ['#b8d6ff', '#4a5a2a', 1.0], exp: 1.1 },
    haze: { sun: '#f2eadc', si: 1.7, sky: ['#7d97b4', '#b4c2cc', '#e2ddd0'], fog: '#c8ccc6', fd: .018, hemi: ['#c4ccd8', '#4a4a44', 1.05], exp: 1.08 },
    dusk: { sun: '#ff9a5a', si: 1.6, sky: ['#2c3a6e', '#a0628a', '#ffb070'], fog: '#b88a86', fd: .016, hemi: ['#8a86b8', '#3a2a2a', .75], exp: 1.15 },
    gold: { sun: '#ffc87a', si: 2.9, sky: ['#5c88c8', '#b8c8dc', '#ffd8a0'], fog: '#e8dcb8', fd: .013, hemi: ['#d6d0e8', '#5a5a2a', 1.0], exp: 1.12 },
  };
  const _c1 = new THREE.Color(), _c2 = new THREE.Color();
  function applyKey(a, b, k) {
    const mixC = (x, y) => _c1.set(x).lerp(_c2.set(y), k).clone();
    sun.color.copy(mixC(a.sun, b.sun)); sun.intensity = lerp(a.si, b.si, k);
    SKY.u.top.value.copy(mixC(a.sky[0], b.sky[0])); SKY.u.mid.value.copy(mixC(a.sky[1], b.sky[1])); SKY.u.hor.value.copy(mixC(a.sky[2], b.sky[2]));
    scene.fog.color.copy(mixC(a.fog, b.fog)); scene.fog.density = lerp(a.fd, b.fd, k);
    hemi.color.copy(mixC(a.hemi[0], b.hemi[0])); hemi.groundColor.copy(mixC(a.hemi[1], b.hemi[1])); hemi.intensity = lerp(a.hemi[2], b.hemi[2], k);
    return lerp(a.exp, b.exp, k);
  }

  function update(t, shot, camera, post, renderer) {
    U.time.value = t; const id = shot.id;
    // —— town progress: grows during the change shot, complete at dusk, absent in memory shots ——
    const prog = id === 'change' ? ss(seg(t, T.changeStart, T.changeEnd)) : id === 'wire' ? 1 : 0;
    U.prog.value = prog;
    const dusk = id === 'wire' ? 1 : 0;
    for (const tr of trees) { if (tr.keep) continue; const k = clamp((prog * 1.25 - tr.d) * 5); tr.g.visible = k < .999; tr.g.position.y = -tr.h * eio(k); }
    for (const b of bushes) { const k = clamp((prog * 1.25 - b.d) * 5); b.b.visible = k < .999; b.b.scale.setScalar(1 - k); }
    for (const b of buildings) { const k = clamp((prog * 1.25 - b.d - .02) * 4.5); b.g.visible = k > .001; b.g.position.y = -b.h * (1 - eo(k)); }
    for (const p of poles) { const k = clamp((prog * 1.25 - p.d) * 5); p.g.visible = k > .001; p.g.scale.y = eo(k); }
    for (const w of wires) { const k = Math.min(poles[w.i].g.scale.y, poles[w.i + 1].g.scale.y); w.w.visible = poles[w.i].g.visible && poles[w.i + 1].g.visible && k > .98; }
    town.visible = prog > 0;
    facM.forEach(m => m.emissiveIntensity = dusk * 1.6);
    homes.forEach(h => h.userData.windows.forEach(w => w.material.emissiveIntensity = dusk * 2.0));
    lamps.forEach((L, i) => { L.lp.intensity = dusk * 9; L.gl.material.color.set('#ffc47a').multiplyScalar(dusk * 1.1); });
    farm.userData.windows.forEach(w => w.material.emissiveIntensity = 0);
    for (const im of grassIM.concat(flowerIM)) im.visible = true;

    // —— light key ——
    let exp;
    if (id === 'change') exp = applyKey(K.morning, K.haze, ss(seg(t, T.changeStart + 1, T.changeEnd)));
    else if (id === 'wire') exp = applyKey(K.dusk, K.dusk, 0);
    else if (id === 'home') exp = applyKey(K.gold, K.gold, 0);
    else exp = applyKey(K.morning, K.morning, 0);
    U.motes = id === 'wire' ? 0 : id === 'change' ? 1 - prog * .7 : 1;

    // —— camera ——
    const C = CAMS[id] || C_leaf; cam.p.set(...C.p(t)); cam.l.set(...C.l(t));
    camera.position.copy(cam.p); camera.lookAt(cam.l);
    camera.fov = id === 'leaf' ? lerp(30, 40, ss(seg(t, 1.8, 5.6))) : id === 'home' ? lerp(30, 34, ss(seg(t, 55.6, 60))) : id === 'change' ? lerp(36, 42, ss(seg(t, 16, 24.2))) : 36;
    camera.near = (id === 'leaf' && t < 2.5) || id === 'home' ? .02 : .1;

    // —— the boy ——
    let bp = null, fr = 'idle0', flip = false;
    if (id === 'leaf') { const x = -18.6 + 1.05 * (t - T.boyIn); bp = [x, 0, pathZ(x)]; fr = t > T.boyIn ? walkFrame(t) : 'idle0'; boy.root.visible = t > T.boyIn - .5; }
    else if (id === 'path') { const x = Math.min(-4.95, -8.3 + 1.2 * (t - 5.6)); bp = [x, 0, pathZ(x) - .05]; fr = t < T.kneel ? walkFrame(t) : (t % 2.6 < .12 ? 'kneelB' : 'kneel'); }
    else if (id === 'stream') { bp = [ROCK.x - .05, .32, ROCK.z + .32]; fr = t < T.write ? 'writeL' : (Math.floor(t * 5) % 2 ? 'write1' : 'write0'); }
    else if (id === 'change') { bp = [ROCK.x + .5, 0, ROCK.z + .55]; fr = t < 17.2 ? 'idle0' : t < T.netLower ? (t % 3 < .12 ? 'blink' : 'calm') : 'lower'; flip = false; }
    else if (id === 'home') { bp = [LEAF.x - .62, 0, LEAF.z - .2]; fr = t < T.smile ? idle(t) : t < T.fly + .3 ? 'smile' : 'smileUp'; }
    boy.root.visible = !!bp && (id !== 'leaf' || t > T.boyIn - .5);
    if (bp) { boy.root.position.set(...bp); boy.frame(fr); boy.face(camera, flip); fill.position.set(bp[0] + .3, bp[1] + 1.6, bp[2] + 1.8); fill.intensity = id === 'wire' ? 0 : 1.4; }

    // —— beetle on the leaf: still, dew slides; at the end it opens its wings and flies to the sun ——
    beetle.root.visible = id === 'leaf' || id === 'home';
    if (beetle.root.visible) {
      let bpos = beetleOnLeaf.clone(), bf = Math.floor(t * 3) % 7 === 0 ? 'b1' : 'b0';
      if (id === 'leaf' && t < T.dewDrop) bf = 'dew';
      if (id === 'home') {
        const u = t - T.fly;
        if (u > -.9 && u < 0) bf = u < -.45 ? 'open1' : 'open2';
        if (u >= 0) { bf = Math.floor(t * 18) % 2 ? 'open2' : 'open2b'; const k = u; bpos.add(new THREE.Vector3(k * .55 + Math.sin(k * 9) * .03, k * .55 + k * k * .5, -k * .45)); }
      }
      beetle.root.position.copy(bpos); beetle.frame(bf); beetle.face(camera);
      beetle.root.scale.setScalar(1);
    }
    // dew: a drop rolls off the beetle's back, down the leaf, hangs on the edge and falls
    const dk = id === 'leaf' ? t : -1;
    const dewOn = dk >= 0 && dk < T.dewDrop + .6;
    dew.visible = dewDot.visible = dewOn;
    if (dewOn) {
      const a = beetleOnLeaf.clone().add(new THREE.Vector3(-.005, .055, .01)), b = LEAF.clone().add(new THREE.Vector3(.1, -.02, .1)), c = b.clone().add(new THREE.Vector3(.02, -.5, .02));
      const u = ss(seg(dk, T.dewSlide, T.dewDrop - .3)), f = seg(dk, T.dewDrop, T.dewDrop + .5);
      const p = f > 0 ? b.clone().lerp(c, f * f) : a.clone().lerp(b, u);
      dewDot.position.copy(p); dew.position.copy(p); dew.material.opacity = 1 - f;
    }
    beetle2.root.visible = id === 'path';
    if (beetle2.root.visible) { const climb = Math.max(0, t - 6.2) * .035; beetle2.root.position.set(OAK.x - .05, .62 + climb, OAK.z + .56); beetle2.frame(Math.floor(t * 4) % 2 ? 'b1' : 'b0'); beetle2.face(camera); beetle2.mesh.rotation.z = Math.PI / 2; }

    // —— flyers ——
    dragon.root.visible = id === 'stream' || id === 'leaf';
    if (id === 'stream') { const u = (t - 10.6) / 5.4, z = lerp(-4.6, 1.2, u) + Math.sin(t * 2.3) * .3; dragon.root.position.set(streamX(z) + Math.sin(t * 3.7) * .4, .35 + Math.sin(t * 5.1) * .06, z); }
    else dragon.root.position.set(-11.4 + (t - 2) * .9, 1.3 + Math.sin(t * 3) * .1, 1.2);
    dragon.frame(Math.floor(t * 24) % 2 ? 'f1' : 'f0'); dragon.face(camera, id === 'stream');
    flies.forEach((f, i) => {
      f.root.visible = id === 'path' || id === 'stream' || id === 'leaf' || id === 'home';
      const base = id === 'stream' ? [ROCK.x + .6, 1.3, ROCK.z - .5] : id === 'path' ? [-5.5, 1.6, .6] : [LEAF.x + .6, 1.1, LEAF.z - .6];
      f.root.position.set(base[0] + Math.sin(t * .9 + i * 2) * (1.2 + i * .4), base[1] + Math.sin(t * 2.1 + i) * .25 + i * .3, base[2] + Math.cos(t * .7 + i * 3) * .6);
      f.frame(['f0', 'f1', 'f2', 'f1'][Math.floor(t * 14 + i * 2) % 4]); f.face(camera);
    });
    FL.forEach((d, i) => { const m = fallers[i], ph = ((t * .22 * d[4] + d[3] * .1) % 1); m.position.set(d[0] + Math.sin(t * 1.1 + d[3]) * .6 + ph * 2, d[1] - ph * (d[1] + .2), d[2] + Math.cos(t * .8 + d[3]) * .5); m.rotation.set(t * 2.1 + d[3], t * 1.3, t * 1.7 + d[3]); m.visible = id !== 'wire' && id !== 'change'; });
    motes.userData.update(t);
    shafts.forEach(s => { const side = s.b.userData.aim(s.top, sunDir, camera); s.b.material.uniforms.k.value = .26 * s.k * side * (id === 'wire' ? 0 : id === 'change' ? 1 - prog : 1); s.b.material.uniforms.t.value = t; });

    // —— water ——
    WATER.u.t.value = t; WATER.u.camPos.value.copy(camera.position); WATER.u.fogColor.value.copy(scene.fog.color); WATER.u.fogDensity.value = scene.fog.density;
    WATER.setLights([{ p: new THREE.Vector3(streamX(-14) + 2, 6, -14), c: sun.color, i: .9 }]); WATER.u.bright.value = 1;

    // —— sun + shadow frustum around the subject ——
    const focus = bp ? new THREE.Vector3(...bp) : cam.l.clone();
    const ext = id === 'change' ? 26 : id === 'leaf' ? lerp(3, 12, ss(seg(t, 1, 5.6))) : id === 'home' ? 3.5 : 9;
    sun.target.position.copy(id === 'change' ? cam.l : focus); sun.position.copy(sun.target.position).add(SUN_OFF);
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext }); sun.shadow.camera.updateProjectionMatrix();

    // —— post ——
    renderer.toneMappingExposure = exp;
    post.bloom.strength = id === 'home' ? .62 : .48; post.bloom.threshold = .8;
    const V = post.vig.uniforms; V.amt.value = .5; V.warm.value = id === 'wire' ? .14 : .1; V.sat.value = id === 'change' ? lerp(1.12, .92, prog) : 1.12; V.contrast.value = .2;
    // focus: leaf → boy hand-off on the pull-back; follow the boy elsewhere
    let fd, aper;
    if (id === 'leaf') { const k = ss(seg(t, 2.6, 4.8)); const fl = camera.position.distanceTo(LEAF), fb = camera.position.distanceTo(new THREE.Vector3(...bp).setY(.7)); fd = lerp(fl, fb, k); aper = lerp(5, 260, ss(seg(t, 1.4, 5.4))); }
    else if (id === 'home') { const k = ss(seg(t, 56.4, 57.6)); const fl = camera.position.distanceTo(LEAF), fb = camera.position.distanceTo(new THREE.Vector3(...bp).setY(1.1)); fd = lerp(fl, lerp(fl, fb, .5), k); aper = lerp(5, 28, ss(seg(t, 55.6, 58))); if (t > T.fly) fd = camera.position.distanceTo(beetle.root.position); }
    else if (id === 'change') { fd = camera.position.distanceTo(cam.l); aper = lerp(220, 520, ss(seg(t, 16, 24))); post.dof.tiltAmt = 14 * ss(seg(t, 18, 21)); post.dof.track = new THREE.Vector3(...bp).setY(.8); }
    else if (id === 'wire') { fd = camera.position.distanceTo(cam.l); aper = 120; }
    else { fd = camera.position.distanceTo(new THREE.Vector3(...bp).setY(.75)); aper = id === 'stream' ? lerp(260, 120, ss(seg(t, 11, 16))) : 280; }
    post.dof.focus = fd; post.dof.aper = aper; post.dof.maxCoc = id === 'leaf' && t < 2 ? 30 : 22;
  }
  return { scene, update };
}
