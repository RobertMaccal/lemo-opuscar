// Set 6: a town whose towers are stacks of trading cards (generic backs: no logos, no real card art), tiny collectors in the streets.
// Shots: cards (rising crane up a tower, 85 billion), pockets (a kid with an empty shoebox: "where are yours?"), no1 (golden hour orbit, a No. 1 podium).
import * as THREE from 'three';
import { PX, ramp, hex, h2, texOf, glow, mulberry, billboard } from './px.js';
import { mat, mesh } from './kit.js';
import { sky, particles } from './fx.js';
import { makeKid, sprite } from './chars.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';
import { T } from './timeline.js';

export function buildCardCity() {
  const scene = new THREE.Scene(); const R = mulberry(23);
  const SKY = sky({ top: '#4a7ad0', mid: '#a0c4ec', hor: '#fde8c8', moonDir: new THREE.Vector3(.5, .3, -.8), moonCol: '#fff0c8' }); scene.add(SKY.mesh);
  scene.fog = new THREE.FogExp2('#e0e8f0', .016);
  const sun = new THREE.DirectionalLight('#fff0d0', 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 90 }); sun.shadow.bias = -.0006;
  scene.add(sun, sun.target); const hemi = new THREE.HemisphereLight('#d0e4ff', '#5a5a6a', 1.0); scene.add(hemi);
  // ground: streets and plazas
  const P = new PX(480, 480), A = ramp(['#8a8e98', '#a2a6ae', '#b8bcc2', '#ccd0d4'], .4);
  P.fill((x, y) => { const bx = x % 60, by = y % 60; if (bx < 10 || by < 10) return A(.3 + (bx === 5 || by === 5 ? .5 : 0) * ((x + y) % 6 < 3 ? 1 : 0), x, y); return A(.65 + (h2(x >> 2, y >> 2, 3) - .5) * .2, x, y); });
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: texOf(P.done()), roughness: .95 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
  // card textures: a generic back (blue, gold border, star) and the layered edge of a stack
  const backC = (() => { const Q = new PX(20, 28); Q.fill((x, y) => { if (x < 1 || y < 1 || x > 18 || y > 26) return [232, 200, 96]; if (x < 2 || y < 2 || x > 17 || y > 25) return [30, 50, 120]; const d = Math.hypot(x - 9.5, y - 13.5); if (d < 4 && Math.abs(Math.atan2(y - 13.5, x - 9.5) * 5 / Math.PI % 2) < 1.2) return [255, 220, 120]; return d < 6.5 ? [60, 90, 180] : [40, 66, 150]; }); return Q.done(); })();
  const edgeC = (() => { const Q = new PX(16, 64); Q.fill((x, y) => y % 2 ? [236, 230, 214] : (y % 6 === 0 ? [60, 80, 160] : [210, 200, 180])); return Q.done(); })();
  const topM = new THREE.MeshStandardMaterial({ map: texOf(backC), roughness: .6 });
  const edgeT = texOf(edgeC, { repeat: [1, 1] }); edgeT.wrapS = edgeT.wrapT = THREE.RepeatWrapping;
  const towers = [];
  for (let gx = -4; gx <= 4; gx++) for (let gz = -5; gz <= 3; gz++) {
    if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue;   // central plaza
    const dd = Math.hypot(gx, gz), h = 1.5 + Math.pow(R(), 1.4) * 14 * (1 - dd / 9) * clamp((dd - 1.2) / 2.2), w = 1.4 + R() * .5, d = w * 1.4;
    const em = new THREE.MeshStandardMaterial({ map: edgeT.clone(), roughness: .8 }); em.map.repeat.set(1, h * 6); em.map.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [em, em, topM, em, em, em]);
    m.position.set(gx * 4 + (R() - .5), 0, gz * 4 + (R() - .5)); m.rotation.y = (R() - .5) * .3; m.castShadow = m.receiveShadow = true; scene.add(m); towers.push({ m, h });
  }
  // falling cards in the air
  const CF = [...Array(160)].map(() => [R() * 30 - 15, R() * 20, R() * 24 - 16, R() * 6]);
  const flyers = new THREE.InstancedMesh(new THREE.PlaneGeometry(.3, .42), new THREE.MeshStandardMaterial({ map: texOf(backC), side: THREE.DoubleSide, roughness: .6 }), CF.length); scene.add(flyers);
  const _o = new THREE.Object3D();
  // collectors in the streets
  const kidA = [0, 1, 2].map(k => makeKid(k, true).A);
  const kids = [...Array(22)].map((_, i) => { const A = kidA[i % 3], tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true; const s = sprite({ ...A, tex, em }, 1 / 30, { blobR: .26 }); scene.add(s.root); return s; });
  const KP = kids.map(() => [Math.floor(R() * 9 - 4) * 4 + 2, R() * 30 - 18, R() > .5 ? 1 : -1, .6 + R() * .6]);
  // pockets gag: one kid, an open empty shoebox, a "?" above
  const solo = (() => { const A = kidA[1], tex = A.tex.clone(), em = A.em.clone(); tex.needsUpdate = em.needsUpdate = true; const s = sprite({ ...A, tex, em }, 1 / 30, { blobR: .26 }); scene.add(s.root); return s; })();
  const boxM = new THREE.MeshStandardMaterial({ color: '#b08a5a', roughness: .9, side: THREE.DoubleSide });
  const shoebox = new THREE.Group(); scene.add(shoebox);
  { const bw = .5, bd = .32, bh = .2; [[0, bh / 2, -bd / 2, bw, bh, .02], [0, bh / 2, bd / 2, bw, bh, .02], [-bw / 2, bh / 2, 0, .02, bh, bd], [bw / 2, bh / 2, 0, .02, bh, bd], [0, .01, 0, bw, .02, bd]].forEach(([x, y, z, w, h, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxM); b.position.set(x, y, z); b.castShadow = true; shoebox.add(b); });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(.52, .03, .34), new THREE.MeshStandardMaterial({ color: '#c49a68' })); lid.position.set(-.05, .12, -.3); lid.rotation.x = -1.1; shoebox.add(lid); }
  const qP = new PX(9, 13); [[2, 0], [3, 0], [4, 0], [5, 0], [1, 1], [6, 1], [6, 2], [6, 3], [5, 4], [4, 5], [3, 6], [3, 7], [3, 8], [3, 11], [3, 12]].forEach(([x, y]) => { qP.set(x, y, [255, 236, 160]); qP.set(x + 1, y, [255, 236, 160]); }); qP.outline(.5, [30, 20, 10]);
  const qm = billboard(texOf(qP.done()), .32, .46, { shadow: false }); qm.material.emissive.set('#ffd870'); qm.material.emissiveIntensity = .8; scene.add(qm);
  const SOLO = new THREE.Vector3(2.0, 0, 13.0);
  // No. 1 podium in the plaza
  const gold = new THREE.MeshStandardMaterial({ color: '#e8c060', metalness: .7, roughness: .3, emissive: '#5a4010', emissiveIntensity: .3 });
  const podium = new THREE.Group(); scene.add(podium);
  [[0, 1.2, 1.6], [-1.6, .8, 1.5], [1.6, .5, 1.5]].forEach(([x, h, w]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4).translate(0, h / 2, 0), new THREE.MeshStandardMaterial({ color: '#f0ece4', roughness: .7 })); b.position.x = x; b.castShadow = b.receiveShadow = true; podium.add(b); });
  const one = new THREE.Group(); podium.add(one);
  [[0, .9, .32, 1.6], [-.22, 1.55, .32, .5], [0, .08, .9, .16]].forEach(([x, y, w, h], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .3), gold); b.position.set(x, y + 1.2, 0); if (i === 1) b.rotation.z = -.6; b.castShadow = true; one.add(b); });
  const halo = glow('#ffe08a', 4, 0); halo.position.set(0, 2.6, .2); podium.add(halo);
  const CONF = [...Array(140)].map(() => [R() * 8 - 4, R() * 6, R() * 6 - 3, R() * 6]);
  const confetti = particles(CONF.length, (i, t, o) => { const c = CONF[i]; o.x = c[0] + Math.sin(t + c[3]) * .4; o.y = ((c[1] - (t - T.no1) * 1.2) % 6 + 6) % 6; o.z = c[2]; o.a = U.conf; o.s = .06; const k = i % 3; o.r = [2, 1.8, .6][k]; o.g = [1.6, .6, 1.4][k]; o.b = [.4, .8, 2][k]; }, { soft: 0, blend: THREE.NormalBlending });
  const U = { conf: 0 }; scene.add(confetti);

  const tall = towers.reduce((a, b) => b.h > a.h ? b : a), TP = tall.m.position;
  const CAM = {
    cards: { p: track([[0, [2, 1.6, 15]], [.55, [2, 8, 17]], [1, [2, 20, 22]]]), l: track([[0, [2, 2.5, -4]], [.55, [1, 4, -6]], [1, [0, 1, -6]]]), fov: [42, 46] },
    pockets: { p: track([[0, [SOLO.x + .3, 1.9, SOLO.z + 4.0]], [1, [SOLO.x + .2, 1.7, SOLO.z + 3.4]]]), l: track([[0, [SOLO.x - .1, .75, SOLO.z]], [1, [SOLO.x - .1, .75, SOLO.z]]]), fov: [36, 34] },
    no1: { p: track([[0, [-5, 9.5, 5.5]], [.5, [0, 10, 7.5]], [1, [5, 9.5, 5.5]]]), l: track([[0, [0, 1.5, 0]], [1, [0, 1.5, 0]]]), fov: [42, 42] },
  };
  function update(t, shot, camera, post, renderer) {
    const id = shot.id, u = seg(t, shot.a, shot.b);
    const goldK = id === 'no1' ? ss(seg(t, shot.a, shot.a + 2)) : 0;
    sun.color.set('#fff0d0').lerp(new THREE.Color('#ffb060'), goldK); SKY.u.hor.value.set('#fde8c8').lerp(new THREE.Color('#ffc080'), goldK); SKY.u.mid.value.set('#a0c4ec').lerp(new THREE.Color('#e0b0a0'), goldK);
    const C = CAM[id]; camera.position.set(...C.p(u)); camera.lookAt(...C.l(u)); camera.fov = lerp(C.fov[0], C.fov[1], u); camera.up.set(0, 1, 0);
    const lt = new THREE.Vector3(...C.l(u)); sun.target.position.copy(lt); sun.position.copy(lt).add(new THREE.Vector3(12, 22, 9));
    for (let i = 0; i < CF.length; i++) { const c = CF[i], y = ((c[1] - t * 1.1) % 20 + 20) % 20; _o.position.set(c[0] + Math.sin(t * .7 + c[3]) * 1.2, y, c[2]); _o.rotation.set(t * 2 + c[3], t * 1.3, t * 1.7 + c[3]); _o.updateMatrix(); flyers.setMatrixAt(i, _o.matrix); }
    flyers.instanceMatrix.needsUpdate = true; flyers.visible = id !== 'pockets';
    kids.forEach((k, i) => { const p = KP[i], z = ((p[1] + t * p[3] * p[2]) % 30 + 30) % 30 - 18; k.root.position.set(p[0], 0, z); k.frame(['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8 + i) % 4]); k.face(camera, p[2] < 0); k.root.visible = id !== 'pockets' || Math.abs(z - SOLO.z) > 3; });
    // pockets: the kid looks into the empty box, shrugs (bob), a "?" pops
    const on = id === 'pockets'; solo.root.visible = shoebox.visible = qm.visible = on;
    solo.root.position.copy(SOLO).add(new THREE.Vector3(-.45, 0, 0)); solo.frame(Math.floor(t * 3) % 2 ? 'i1' : 'i0'); solo.face(camera);
    shoebox.position.copy(SOLO).add(new THREE.Vector3(.25, 0, .1));
    const qk = clamp((t - T.where - .1) / .25); qm.position.copy(SOLO).add(new THREE.Vector3(-.4, 1.25 + .05 * Math.sin(t * 6), 0)); qm.scale.setScalar(Math.max(.001, qk * (1 + .3 * Math.exp(-(t - T.where) / .2)))); qm.lookAt(camera.position);
    podium.visible = id === 'no1'; one.rotation.y = id === 'no1' ? Math.sin(t * .8) * .25 : 0;
    halo.material.color.set('#ffe08a').multiplyScalar(id === 'no1' ? .9 * ss(seg(t, T.no1, T.no1 + .6)) : 0);
    U.conf = id === 'no1' && t > T.no1 ? 1 : 0; confetti.visible = U.conf > 0; confetti.userData.update(t);
    renderer.toneMappingExposure = 1.1; post.bloom.strength = .55; post.bloom.threshold = .82;
    const V = post.vig.uniforms; V.sat.value = 1.15; V.warm.value = .08 + goldK * .1;
    const fp = id === 'pockets' ? SOLO.clone().setY(.6) : lt;
    post.dof.focus = camera.position.distanceTo(fp); post.dof.aper = id === 'pockets' ? 60 : 240; post.dof.maxCoc = 20;
    if (id !== 'pockets') { post.dof.tiltAmt = 14; post.dof.tiltC = .45; }
  }
  return { scene, update };
}
