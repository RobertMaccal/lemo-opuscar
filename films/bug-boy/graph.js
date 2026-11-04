// Set 8: a price chart built as a tabletop mountain path. A little collector climbs the rising columns; a grandpa in a rocking chair
// leafs through his binder on a ledge ("a retirement plan?"); fog rolls in ("nobody knows"); then the path ahead drops away ("crash").
import * as THREE from 'three';
import { PX, ramp, h2, texOf, glow, mulberry, billboard } from './px.js';
import { mat, mesh } from './kit.js';
import { sky, particles } from './fx.js';
import { makeKid, makeSitter, sprite } from './chars.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';
import { T } from './timeline.js';

export function buildGraph() {
  const scene = new THREE.Scene(); const R = mulberry(61);
  const SKY = sky({ top: '#2a3a6a', mid: '#6a7ab0', hor: '#e8c8b0', moonDir: new THREE.Vector3(.3, .3, -.9), moonCol: '#ffe8c8' }); scene.add(SKY.mesh);
  scene.fog = new THREE.FogExp2('#b8b8cc', .02);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); sun.shadow.bias = -.0006;
  scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#c8d0f0', '#3a3040', .9); scene.add(hemi);
  // table: graph paper
  const gp = new PX(256, 256); gp.fill((x, y) => (x % 16 === 0 || y % 16 === 0) ? [150, 170, 200] : (x % 4 === 0 || y % 4 === 0) ? [214, 222, 232] : [240, 242, 246]);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ map: texOf(gp.done(), { repeat: [4, 3] }), roughness: .9 })); table.material.map.wrapS = table.material.map.wrapT = THREE.RepeatWrapping; table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
  // columns: the price path (rises in steps with small dips), then a gap and the drop
  const colP = new PX(24, 24); colP.fill((x, y) => ramp(['#2a6a4a', '#3a8a5a', '#5aaa6a', '#8ad08a'])(.5 + (y === 0 ? .4 : 0) - (x % 6 === 0 ? .2 : 0) + (h2(x, y, 3) - .5) * .1, x, y));
  const colM = mat(colP.done()); colM.userData.tile = 24 / 40;
  const N = 22, W = .8, cols = [];
  let h = .3;
  for (let i = 0; i < N; i++) { h += .18 + R() * .22 - (i % 5 === 3 ? .45 : 0) + (i > 12 ? .1 : 0); h = Math.max(.2, h); const m = mesh(new THREE.BoxGeometry(W, 1, 1.4).translate(0, .5, 0), colM); m.scale.y = h; m.position.set(-9 + i * W, 0, 0); scene.add(m); cols.push({ m, h, x: -9 + i * W }); }
  const GAP = 18;   // columns from here on drop at the crash
  // axis + "$" sign (gold)
  const gold = new THREE.MeshStandardMaterial({ color: '#e8c060', metalness: .6, roughness: .35 });
  const axis = new THREE.Mesh(new THREE.BoxGeometry(.08, 6, .08).translate(0, 3, 0), gold); axis.position.set(-9.6, 0, -.7); scene.add(axis);
  const dP = new PX(9, 13); [[3, 0], [3, 12], [1, 2], [2, 1], [3, 1], [4, 1], [5, 1], [6, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 6], [5, 7], [6, 8], [6, 9], [5, 10], [4, 11], [3, 11], [2, 11], [1, 10]].forEach(([x, y]) => { dP.set(x, y, [240, 200, 90]); dP.set(x + 1, y, [240, 200, 90]); }); dP.outline(.4, [40, 30, 10]);
  const dollar = billboard(texOf(dP.done()), .6, .86, { shadow: false }); dollar.material.emissive.set('#a07020'); dollar.material.emissiveIntensity = .6; dollar.position.set(-9.6, 6.2, -.7); scene.add(dollar);
  // the climber and the grandpa
  const kid = makeKid(0, true); scene.add(kid.root);
  const gramps = makeSitter('elder'); const LEDGE = 9; scene.add(gramps.root);
  const binder = new THREE.Mesh(new THREE.BoxGeometry(.24, .05, .3), new THREE.MeshStandardMaterial({ color: '#2a4a9a' })); scene.add(binder);
  const FG = [...Array(120)].map(() => [R() * 20 - 6, R() * 4, R() * 6 - 3, R() * 6]);
  const fogP = particles(FG.length, (i, t, o) => { const f = FG[i]; o.x = f[0] + Math.sin(t * .3 + f[3]) * 1.5; o.y = f[1] + 1; o.z = f[2]; o.a = U.fog * .35; o.s = 1.4; o.r = .9; o.g = .9; o.b = 1.0; }, { soft: 1, blend: THREE.NormalBlending });
  const U = { fog: 0 }; scene.add(fogP);
  const topOf = i => cols[clamp(i, 0, N - 1) | 0].h;
  const CAM = { p: track([[0, [-8, 3.2, 6.5]], [.55, [-1, 5.5, 7.2]], [1, [5.4, 7.2, 10.2]]]), l: track([[0, [-7, 1, 0]], [.55, [0, 2.6, 0]], [1, [6.2, 3.6, 0]]]) };
  function update(t, shot, camera, post, renderer) {
    const u = seg(t, shot.a, shot.b);
    // climber walks the tops from column 0 toward the gap; stops at the edge
    const pos = Math.min(GAP - .3, (t - shot.a) * 2.5), i = Math.floor(pos), f = pos - i;
    const y = lerp(topOf(i), topOf(i + 1), ss(clamp((f - .7) / .3)));
    kid.root.position.set(-9 + pos * W, y, .1); kid.frame(pos < GAP - .35 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4] : (Math.floor(t * 3) % 2 ? 'i1' : 'i0')); kid.face(camera);
    // crash: columns past the gap sink away
    cols.forEach((c, k) => { const drop = k >= GAP ? eo(clamp((t - T.crash - (k - GAP) * .06) / .7)) : 0; c.m.scale.y = Math.max(.05, c.h * (1 - drop * .92)); });
    gramps.root.position.set(cols[LEDGE].x - .25, cols[LEDGE].h, -.25); gramps.root.visible = t > T.rocker - .1; gramps.frame(Math.floor(t * 1.5) % 2 ? 'hold1' : 'hold0'); gramps.face(camera);
    gramps.root.rotation.z = 0; gramps.mesh.rotation.z = Math.sin(t * 2.2) * .06;   // rocking
    binder.visible = gramps.root.visible; binder.position.copy(gramps.at(33, 26));
    U.fog = ss(seg(t, T.fog, T.fog + 1.2)); fogP.userData.update(t); fogP.visible = U.fog > 0; scene.fog.density = .02 + U.fog * .035;
    camera.position.set(...CAM.p(u)); camera.lookAt(...CAM.l(u)); camera.fov = 40; camera.up.set(0, 1, 0);
    const lt = new THREE.Vector3(...CAM.l(u)); sun.target.position.copy(lt); sun.position.copy(lt).add(new THREE.Vector3(6, 14, 8));
    dollar.position.y = 6.2 + Math.sin(t * 2) * .1;
    renderer.toneMappingExposure = 1.1; post.bloom.strength = .5;
    const V = post.vig.uniforms; V.sat.value = 1.1 - U.fog * .25;
    post.dof.focus = camera.position.distanceTo(kid.root.position); post.dof.aper = 180; post.dof.maxCoc = 18; post.dof.tiltAmt = 10; post.dof.track = kid.root.position.clone().setY(kid.root.position.y + .6);
  }
  return { scene, update };
}
