// Set 7: an auction hall. One graded slab on a pedestal (a generic slab with a "10"; the card face is an abstract golden picture,
// not the real card art), a spotlight that snaps on (shadows jump), an audience that raises paddles, a gavel, gold confetti.
// Shots: hall (slow push to the slab), sale (paddles, gavel), crayon (a kid at a little table drawing — "a prize from a drawing contest").
import * as THREE from 'three';
import { PX, ramp, hex, h2, texOf, glow, mulberry, woodPlanks, billboard } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeSitter, makeKid, sprite } from './chars.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';
import { T } from './timeline.js';

export function buildAuction() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0810'); scene.fog = new THREE.FogExp2('#1a1420', .04);
  const R = mulberry(41);
  const floorM = mat(woodPlanks(96, 96, { pw: 8, len: 48, seed: 2, cols: ['#2a1810', '#3e2418', '#563420', '#6e462c', '#86583a'] })); floorM.userData.tile = 96 / 40;
  scene.add(mesh(new THREE.BoxGeometry(14, .1, 12).translate(0, -.05, 0), floorM));
  const wallM = new THREE.MeshStandardMaterial({ color: '#3a1820', roughness: .9 });
  scene.add(mesh(new THREE.BoxGeometry(14, 5, .2).translate(0, 2.5, -4), wallM)); scene.add(mesh(new THREE.BoxGeometry(.2, 5, 12).translate(5.2, 2.5, 0), wallM));
  // curtains (pixel folds)
  const cP = new PX(32, 48); cP.fill((x, y) => ramp(['#3a0a14', '#6a1424', '#9a2232', '#c43a44'])(.45 + .4 * Math.sin(x * .8) * (1 - y / 96), x, y));
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.6), new THREE.MeshStandardMaterial({ map: texOf(cP.done()), roughness: .9 })); curtain.position.set(2.6, 2.3, -3.88); scene.add(curtain);
  // red carpet stage, pedestal, slab
  const stage = mesh(new THREE.BoxGeometry(4.4, .3, 4).translate(2.8, .15, -1.6), new THREE.MeshStandardMaterial({ color: '#7a1420', roughness: .95 })); scene.add(stage);
  const ped = mesh(new THREE.CylinderGeometry(.32, .4, 1.1, 16).translate(2.6, .85, -1.4), new THREE.MeshStandardMaterial({ color: '#1e1a22', roughness: .4, metalness: .3 })); scene.add(ped);
  const cardFace = (() => { const P = new PX(20, 28); P.fill((x, y) => { if (x < 1 || y < 1 || x > 18 || y > 26) return [240, 210, 110]; const d = Math.hypot(x - 9.5, y - 11); if (y < 19) return d < 5 ? [255, 236, 150] : [ (200 + h2(x, y, 3) * 50) | 0, (170 + h2(x, y, 4) * 50) | 0, 90]; return [236, 228, 200]; }); for (let x = 3; x < 17; x += 2) P.set(x, 22, [120, 110, 100]); return P.done(); })();
  const labelC = (() => { const P = new PX(24, 6); P.fill((x, y) => (x < 1 || y < 1 || x > 22 || y > 4) ? [180, 30, 40] : [246, 244, 240]); [[16, 2], [16, 3], [16, 4], [19, 2], [20, 2], [19, 4], [20, 4], [18, 3], [21, 3]].forEach(([x, y]) => P.set(x, y - 1, [20, 20, 30])); for (let x = 3; x < 12; x += 2) P.set(x, 2, [80, 80, 90]); return P.done(); })();
  const slab = new THREE.Group(); slab.position.set(2.6, 1.42, -1.4); scene.add(slab);
  { const card = new THREE.Mesh(new THREE.PlaneGeometry(.3, .42), new THREE.MeshStandardMaterial({ map: texOf(cardFace), emissive: '#ffffff', emissiveMap: texOf(cardFace), emissiveIntensity: .35, roughness: .4 })); slab.add(card);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.34, .085), new THREE.MeshStandardMaterial({ map: texOf(labelC), roughness: .5 })); label.position.set(0, .28, .002); slab.add(label);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(.4, .66, .05), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: .22, roughness: .05, metalness: 0 })); glass.position.set(0, .03, 0); slab.add(glass); }
  const slabGlow = glow('#ffe6a0', 1.4, 0); slabGlow.position.set(2.6, 1.45, -1.3); scene.add(slabGlow);
  // spotlight (snaps on): point + beam card
  const spot = new THREE.SpotLight('#fff0d0', 0, 12, .32, .5, 1.2); spot.position.set(2.2, 5.0, 1.0); spot.target.position.set(2.6, 1.2, -1.4); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.002; scene.add(spot, spot.target);
  const beam = beamCard(4.4, .3, 1.6, '#ffe8c0', { k: 0, fall: .6 }); scene.add(beam);
  const hemi = new THREE.HemisphereLight('#8a7aaa', '#2a1418', .8); scene.add(hemi);
  const house = new THREE.PointLight('#ffb070', 2.5, 16, 1.2); house.position.set(-2.2, 4.0, 2.0); scene.add(house);
  const front = new THREE.PointLight('#ffd8b0', 1.6, 10, 1.4); front.position.set(-1.5, 2.2, 5); scene.add(front);
  // lectern + gavel
  scene.add(box(.6, 1.1, .5, new THREE.MeshStandardMaterial({ color: '#4a2a18', roughness: .7 })).translateX(4.0).translateY(.3).translateZ(-.6));
  const gavel = new THREE.Group(); gavel.position.set(4.0, 1.46, -.6); scene.add(gavel);
  { const hd = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .2, 10), new THREE.MeshStandardMaterial({ color: '#6a3a1a' })); hd.rotation.x = Math.PI / 2; hd.position.set(.22, .0, 0); gavel.add(hd);
    const hn = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .3, 6), new THREE.MeshStandardMaterial({ color: '#8a5a2a' })); hn.rotation.z = Math.PI / 2; hn.position.set(.08, 0, 0); gavel.add(hn); }
  // audience: rows of seated sprites facing right (toward the stage)
  const pals = ['devA', 'devB', 'devC', 'elder', 'satoshi'];
  const crowd = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const pal = pals[(r * 4 + c * 3) % 4]; const m = makeSitter(pal); m.root.position.set(-3.6 + r * 1.2, 0, -2.6 + c * 1.35 + (r % 2) * .3); scene.add(m.root); crowd.push({ m, ph: R(), r, c }); }
  const paddleP = new PX(6, 9); paddleP.fill((x, y) => y > 5 ? (x === 2 || x === 3 ? [60, 40, 30] : null) : [250, 246, 236]); paddleP.set(2, 2, [180, 30, 40]); paddleP.set(3, 2, [180, 30, 40]);
  const padTex = texOf(paddleP.done());
  const paddles = crowd.map(() => { const p = billboard(padTex, .2, .3, { shadow: false }); scene.add(p); return p; });
  const CONF = [...Array(220)].map(() => [R() * 6 - 1, R() * 5, R() * 5 - 3, R() * 6]);
  const conf = particles(CONF.length, (i, t, o) => { const c = CONF[i], k = t - T.record; o.x = c[0] + Math.sin(t * 1.3 + c[3]) * .3; o.y = 4.6 - ((k * (1 + c[3] * .2) + c[1] * .2) % 5); o.z = c[2]; o.a = k > 0 ? 1 : 0; o.s = .05; o.r = 2.2; o.g = 1.7; o.b = .5; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(conf);
  // the drawing kid (corner table, warm lamp)
  const KID = new THREE.Vector3(-3.4, 0, 3.4);
  const kid = makeKid(2, false); kid.root.position.copy(KID); scene.add(kid.root);
  scene.add(box(.7, .45, .5, new THREE.MeshStandardMaterial({ color: '#c89a5a', roughness: .8 })).translateX(KID.x + .5).translateY(0).translateZ(KID.z - .1));
  const drawing = (() => { const P = new PX(16, 12); P.fill(() => [248, 244, 232]); const r = mulberry(5); for (let k = 0; k < 30; k++) P.set(4 + r() * 8, 3 + r() * 6, [[240, 200, 40], [220, 60, 60], [40, 120, 220]][k % 3]); return P.done(); })();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(.32, .24), new THREE.MeshStandardMaterial({ map: texOf(drawing), roughness: .9 })); paper.rotation.x = -Math.PI / 2; paper.position.set(KID.x + .5, .456, KID.z - .1); scene.add(paper);
  const crayons = [['#e83030', 0], ['#3060e0', .05], ['#f0c020', .1]].map(([c, dx]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .09, 6), new THREE.MeshStandardMaterial({ color: c })); m.rotation.z = Math.PI / 2; m.position.set(KID.x + .75, .462, KID.z - .25 + dx); scene.add(m); return m; });
  const kidLamp = new THREE.PointLight('#ffd090', 0, 3, 1.5); kidLamp.position.set(KID.x + .3, 1.2, KID.z + .4); scene.add(kidLamp);

  const SL = new THREE.Vector3(2.6, 1.42, -1.4);
  const CAM = {
    hall: { p: track([[0, [-4.5, 4.4, 6.5]], [.45, [-.5, 3.0, 4.2]], [1, [1.9, 1.8, .6]]]), l: track([[0, [0, 1, -1]], [.45, [1.8, 1.2, -1.4]], [1, [SL.x, SL.y, SL.z]]]), fov: [40, 30] },
    sale: { p: track([[0, [-.8, 4.2, 6.8]], [.6, [.4, 3.8, 6.0]], [1, [.2, 5.2, 7.6]]]), l: track([[0, [-1.4, 1.0, -.6]], [.6, [.4, 1.1, -.9]], [1, [.4, 1.2, -1.0]]]), fov: [42, 44] },
    crayon: { p: track([[0, [KID.x + 1.9, 2.1, KID.z + 2.8]], [1, [KID.x + 1.5, 1.9, KID.z + 2.3]]]), l: track([[0, [KID.x + .3, .6, KID.z - .1]], [1, [KID.x + .3, .55, KID.z - .1]]]), fov: [34, 32] },
  };
  function update(t, shot, camera, post, renderer) {
    const id = shot.id, u = seg(t, shot.a, shot.b);
    const C = CAM[id]; camera.position.set(...C.p(u)); camera.lookAt(...C.l(u)); camera.fov = lerp(C.fov[0], C.fov[1], u); camera.up.set(0, 1, 0);
    // spotlight snaps on (shadows jump), stays; flickers for the record
    const sOn = id === 'crayon' ? .3 : (t >= T.slab ? 1 : 0), burst = t > T.record ? Math.exp(-(t - T.record) / .5) : 0;
    spot.intensity = sOn * 22 * (1 + burst * .6); const side = beam.userData.aim(spot.position, spot.target.position.clone().sub(spot.position).normalize(), camera); beam.material.uniforms.k.value = sOn * .45 * side; beam.material.uniforms.t.value = t;
    slabGlow.material.color.set('#ffe6a0').multiplyScalar(sOn * (.22 + .05 * Math.sin(t * 3)) + burst * .6);
    slab.rotation.y = Math.sin(t * .6) * .35;
    house.intensity = id === 'hall' && t < T.slab ? 3.0 : 2.0;
    // gavel: lifts and strikes at T.gavel
    const g = t - T.gavel; gavel.rotation.z = g < -.4 ? 0 : g < -.06 ? .9 * ss((g + .4) / .34) : g < 0 ? .9 * (-g / .06) : 0;
    // audience: paddles go up in the sale (bidding), everyone up at the gavel
    crowd.forEach((c, i) => { const bid = id === 'sale' && ((t * .9 + c.ph * 4) % 3 < .9 || (t > T.gavel - .2 && t < T.gavel + 1.4)); const fr = bid ? 'stretch' : (id === 'sale' && t > T.gavel ? 'wow' : (Math.floor(t + c.ph * 3) % 4 === 0 ? 'blink' : 'sit0')); c.m.frame(fr); c.m.face(camera); c.m.root.visible = id !== 'crayon';
      const pp = c.m.at(9, 4); paddles[i].position.copy(pp); paddles[i].visible = bid && id !== 'crayon'; paddles[i].lookAt(camera.position.x, pp.y, camera.position.z); });
    conf.visible = t > T.record && id !== 'hall'; conf.userData.update(t);
    // kid drawing
    kid.root.visible = id === 'crayon'; kid.frame(Math.floor(t * 4) % 2 ? 'i1' : 'i0'); kid.face(camera); kidLamp.intensity = id === 'crayon' ? 2.2 : 0;
    renderer.toneMappingExposure = 1.15 * (1 + burst * .4); post.bloom.strength = .55 + burst * .5; post.bloom.threshold = .8;
    const V = post.vig.uniforms; V.amt.value = .72; V.warm.value = .14; V.sat.value = 1.12;
    const fp = id === 'crayon' ? KID.clone().add(new THREE.Vector3(.4, .5, -.1)) : id === 'hall' ? SL : new THREE.Vector3(1.0, 1.1, -1.0);
    post.dof.focus = camera.position.distanceTo(fp); post.dof.aper = id === 'hall' ? lerp(80, 30, u) : 60; post.dof.maxCoc = 18;
  }
  return { scene, update };
}
