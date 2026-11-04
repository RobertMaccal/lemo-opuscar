// Set 4: a small game studio, early 1990s. Time-lapse day → evening → night as the team works (sketching, pixel sprites on CRTs,
// testing on a handheld); papers pile up, a wall clock spins, the coin jar drains (the "money got tight" gag), desk lamps pop on and throw
// shadows. Shot 'boot': the dark studio, one handheld powers on and the camera pushes into its screen.
import * as THREE from 'three';
import { texOf, glow, mulberry, h2, PX, ramp, woodPlanks, billboard } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, flick } from './fx.js';
import { makeSitter, sprite } from './chars.js';
import { handheld } from './props.js';
import { lcd, overworld, boot, spr, BUG, BOY } from './screens.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';
import { T } from './timeline.js';

export function buildStudio() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c0e18');
  scene.fog = new THREE.FogExp2('#202636', .03);
  const R = mulberry(9);
  // —— room ——
  const floorM = mat((() => { const P = new PX(64, 64), F = ramp(['#3a3a44', '#4a4a56', '#5a5a66', '#6a6a76'], .45); P.fill((x, y) => { let v = .5 + (h2(x >> 3, y >> 3, 2) - .5) * .25 + (h2(x, y, 3) - .5) * .1; if (x % 16 === 0 || y % 16 === 0) v -= .25; return F(v, x, y); }); return P.done(); })()); floorM.userData.tile = 64 / 40;
  const wallM = mat((() => { const P = new PX(96, 96), Rw = ramp(['#5c6062', '#6e7274', '#808486', '#929698'], .5); P.fill((x, y) => { let v = .55 + (h2(x, y, 7) - .5) * .12; if (y > 80) v = y === 81 ? .95 : .2; return Rw(v, x, y); }); return P.done(); })()); wallM.userData.tile = 96 / 40;
  scene.add(mesh(new THREE.BoxGeometry(9, .1, 7).translate(0, -.05, 0), floorM));
  scene.add(mesh(new THREE.BoxGeometry(9, 3, .12).translate(0, 1.5, -2.6), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.12, 3, 7).translate(-4.2, 1.5, 0), wallM));
  // windows in the back wall: sky colour follows the time of day (emissive)
  const winSky = new THREE.MeshBasicMaterial({ color: '#9cc8f0', fog: false });
  const winFrame = new THREE.MeshStandardMaterial({ color: '#c8c4bc', roughness: .8 });
  const wins = [-2.4, 0, 2.4].map(x => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), winSky); w.position.set(x, 1.75, -2.53); scene.add(w);
    [[0, .58, 1.9, .07], [0, -.58, 1.9, .07], [-.93, 0, .07, 1.2], [.93, 0, .07, 1.2], [0, 0, .05, 1.1]].forEach(([dx, dy, ww, hh]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, .06), winFrame); b.position.set(x + dx, 1.75 + dy, -2.5); scene.add(b); }); return w; });
  // corkboard with creature sketches (original doodles) appearing over time
  const cork = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, .04), new THREE.MeshStandardMaterial({ color: '#9a7448', roughness: 1 })); cork.position.set(-3.0 + .9, 1.75, -2.5); cork.rotation.y = 0; cork.position.set(-4.12, 1.7, -.4); cork.rotation.y = Math.PI / 2; scene.add(cork);
  const sketchTex = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const P = new PX(16, 20); P.fill((x, y) => [238, 232, 218]); const r = mulberry(i + 3); const cx = 8, cy = 10; for (let k = 0; k < 40; k++) { const a = r() * 6.28, rr = 2 + r() * 4; P.set(cx + Math.cos(a) * rr * (i % 2 ? 1 : .7), cy + Math.sin(a) * rr, [60, 60, 70]); } P.set(cx + 1, cy - 1, [20, 20, 30]); P.set(cx - 2, cy - 1, [20, 20, 30]); return texOf(P.done()); });
  const sketches = sketchTex.map((t, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.26, .32), new THREE.MeshStandardMaterial({ map: t, roughness: .9 })); m.rotation.y = Math.PI / 2; m.position.set(-4.09, 1.95 - (i % 2) * .42, -1.2 + Math.floor(i / 2) * .5); m.rotation.z = (R() - .5) * .2; scene.add(m); return m; });
  // wall clock
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(.22, 24), new THREE.MeshStandardMaterial({ color: '#efe8d8', roughness: .7 })); clockFace.position.set(1.2, 2.45, -2.52); scene.add(clockFace);
  const handM = new THREE.MeshBasicMaterial({ color: '#202028' });
  const hH = new THREE.Mesh(new THREE.BoxGeometry(.02, .12, .01).translate(0, .06, 0), handM), hM = new THREE.Mesh(new THREE.BoxGeometry(.014, .18, .01).translate(0, .09, 0), handM);
  hH.position.set(1.2, 2.45, -2.5); hM.position.set(1.2, 2.45, -2.495); scene.add(hH, hM);
  // —— desks: a 2×2 cluster ——
  const deskM = mat(woodPlanks(96, 48, { pw: 12, len: 96, seed: 5, nails: false, cols: ['#4a3a2a', '#6a543a', '#8a6e4c', '#a6885e', '#bea070'] })); deskM.userData.tile = 96 / 80;
  const DY = .72;
  const crtM = new THREE.MeshStandardMaterial({ color: '#cfc8b8', roughness: .8 });
  const desks = [[.5, -2.0, 1], [.5, -.7, 1], [.5, .6, 1], [.5, 1.9, 1]];   // one column front-to-back (portrait frame): x, z, facing
  const crtScreens = [], lamps = [], piles = [];
  desks.forEach(([x, z, f], i) => {
    scene.add(mesh(new THREE.BoxGeometry(1.5, .05, .8).translate(x, DY - .025, z), deskM));
    for (const [dx, dz] of [[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]]) scene.add(mesh(new THREE.BoxGeometry(.05, DY - .05, .05).translate(x + dx, (DY - .05) / 2, z + dz), deskM));
    // CRT on desks 1 and 3
    if (i === 1 || i === 3) {
      const cx = x + f * .25, crt = box(.46, .4, .42, crtM); crt.position.set(cx, DY, z - .1); scene.add(crt);
      const L = lcd(64, 48); const sm = new THREE.MeshBasicMaterial({ map: L.tex, color: new THREE.Color(1.3, 1.3, 1.3) });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(.34, .26), sm); s.position.set(cx, DY + .21, z + .115); scene.add(s);
      const kb = box(.42, .025, .14, new THREE.MeshStandardMaterial({ color: '#bab4a6' })); kb.position.set(cx, DY, z + .22); scene.add(kb);
      crtScreens.push({ L, s, i });
    }
    // lamp per desk
    const lp = new THREE.PointLight('#ffc27a', 0, 3.5, 1.6); lp.position.set(x - f * .55, DY + .48, z - .15); lp.castShadow = i < 2; if (lp.castShadow) { lp.shadow.mapSize.set(512, 512); lp.shadow.bias = -.003; }
    scene.add(lp); const lg = glow('#ffd08a', .3, 0); lg.position.copy(lp.position); scene.add(lg);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .5), new THREE.MeshStandardMaterial({ color: '#2a2a30' })); stand.position.set(x - f * .55, DY + .25, z - .2); scene.add(stand);
    lamps.push({ lp, lg });
    // paper pile that grows
    const pile = box(.24, .1, .31, new THREE.MeshStandardMaterial({ color: '#ece6d6', roughness: .95 })); pile.position.set(x - f * .3, DY, z + .15); pile.scale.y = .05; scene.add(pile); piles.push(pile);
  });
  // coin jar on the shelf (the gag): the coins drain as the voice says "money got tight"
  scene.add(mesh(new THREE.BoxGeometry(1.4, .04, .28).translate(2.6, 1.3, -2.45), deskM));
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .22, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: .35, roughness: .1, side: THREE.DoubleSide })); jar.position.set(2.3, 1.43, -2.42); scene.add(jar);
  const coins = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .2, 16), new THREE.MeshStandardMaterial({ color: '#d8b04a', metalness: .6, roughness: .35 })); coins.position.set(2.3, 1.32, -2.42); scene.add(coins);
  // —— the team ——
  const team = [makeSitter('devA'), makeSitter('satoshi'), makeSitter('devB'), makeSitter('devC')];
  // desk i, sprite offset so the hands reach the desk edge
  team.forEach((m, i) => { const [x, z, f] = desks[i]; m.root.position.set(x - f * 1.13, 0, z + .05); scene.add(m.root); m.flip = f < 0; });
  // the 1996 handheld on the front desk (boot shot)
  const LB = lcd(); const HB = handheld(LB, { seed: 3, w: .16 }); HB.position.set(.78, DY, .8); HB.rotation.y = .15; scene.add(HB);
  // —— light ——
  const sun = new THREE.DirectionalLight('#fff0d8', 2.0); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 20 }); sun.shadow.bias = -.001;
  scene.add(sun, sun.target); sun.target.position.set(0, 0, 0);
  const hemi = new THREE.HemisphereLight('#c8d8f0', '#2a2620', .8); scene.add(hemi);
  const fill = new THREE.PointLight('#e0e8ff', .6, 8, 2); fill.position.set(0, 2.4, 3); scene.add(fill);
  const pfill = new THREE.PointLight('#ffd8b8', 0, 4, 1.6); pfill.position.set(.2, 1.6, 3.2); scene.add(pfill);
  const scrLight = new THREE.PointLight('#bfe89a', 0, 1.4, 1.6); scene.add(scrLight);
  const DUST = [...Array(60)].map(() => [R() * 8 - 4, R() * 2.6, R() * 3 - 2.4, R() * 9]);
  const dust = particles(DUST.length, (i, t, o) => { const d = DUST[i]; o.x = d[0] + Math.sin(t * .2 + d[3]) * .3; o.y = (d[1] + t * .05) % 2.6; o.z = d[2]; o.a = .3 * U.day; o.s = .02; o.r = 1.4; o.g = 1.3; o.b = 1; }, { soft: 1 });
  const U = { day: 1 }; scene.add(dust);

  // —— postcards (78,000 entries) and the secret's pink glow ——
  const pcTex = texOf((() => { const P = new PX(10, 7); P.fill((x, y) => (x === 0 || y === 0 || x === 9 || y === 6) ? [200, 190, 170] : (y === 2 || y === 4) && x > 1 && x < 7 ? [120, 120, 140] : [246, 240, 226]); P.set(8, 1, [220, 80, 80]); return P.done(); })());
  const NPC = 420, pcM = new THREE.MeshStandardMaterial({ map: pcTex, side: THREE.DoubleSide, roughness: .9 });
  const pcs = new THREE.InstancedMesh(new THREE.PlaneGeometry(.16, .11), pcM, NPC); pcs.castShadow = true; scene.add(pcs);
  const PCS = [...Array(NPC)].map(() => { const a = R() * 6.28, r = Math.pow(R(), .7) * 1.7; return [-1.9 + Math.cos(a) * r, .2 + Math.sin(a) * r * .8, R(), R() * 6.28, r / 1.7]; });
  const mound = new THREE.Group();   // (heap is built from the landed cards themselves)
  pcTex.wrapS = pcTex.wrapT = THREE.RepeatWrapping;
  const pink = glow('#ff8ad8', .5, 0); scene.add(pink);
  const poofs = [2, 3].map(() => { const p = glow('#ffffff', 1.2, 0); scene.add(p); return p; });
  const _o = new THREE.Object3D();

  const C_studio = { p: track([[0, [-3.4, 5.0, 7.0]], [.5, [.2, 5.6, 7.8]], [1, [3.6, 5.0, 6.8]]]), l: track([[0, [0, .7, -.1]], [1, [.1, .8, -.2]]]) };
  const C_quit = { p: track([[0, [1.4, 2.9, 3.6]], [1, [.7, 2.3, 2.4]]]), l: track([[0, [-.2, .95, -.8]], [1, [-.3, 1.0, -.75]]]) };
  const C_prank = { p: track([[0, [.6, 2.4, 5.2]], [1, [.3, 2.1, 4.4]]]), l: track([[0, [-.3, 1.0, 1.85]], [1, [-.25, 1.0, 1.85]]]) };
  const C_mail = { p: track([[0, [-1.2, 5.6, 6.8]], [1, [-.4, 7.0, 8.0]]]), l: track([[0, [-.8, .4, -.1]], [1, [-.6, .4, -.2]]]) };
  function update(t, shot, camera, post, renderer) {
    const id = shot.id, u = seg(t, shot.a, shot.b);
    // time of day: studio = day → night; quit, prank, boot = night; mail = bright day
    const tod = id === 'studio' ? 2 * ss(seg(t, shot.a + (shot.b - shot.a) * .15, shot.a + (shot.b - shot.a) * .8)) : id === 'mail' ? 0 : id === 'boot' ? 2.4 : 2.05;
    const day = clamp(1 - tod), eve = clamp(1 - Math.abs(tod - 1)), night = clamp(tod - 1);
    U.day = day;
    winSky.color.set('#9cc8f0').lerp(new THREE.Color('#ff9a5a'), eve).lerp(new THREE.Color('#141c3a'), night);
    sun.color.set('#fff0d8').lerp(new THREE.Color('#ff9a5a'), eve); sun.intensity = 2.0 * (1 - night * .97);
    const sa = lerp(-.4, .9, clamp(tod / 1.4)); sun.position.set(Math.sin(sa) * 6, 4.5 - Math.min(tod, 2) * 1.2, -7);
    hemi.intensity = lerp(.8, .22, clamp(tod / 2)); hemi.color.set('#c8d8f0').lerp(new THREE.Color('#5a6aa0'), night);
    // who is here: the two who quit vanish (with a soft poof) in the quit shot; prank = only the programmer at desk 3
    const here = i => { if (id === 'boot') return false; if (id === 'prank') return i === 3; if (id === 'quit') return !((i === 0 && t > T.quit1) || (i === 2 && t > T.quit2)); return true; };
    // lamps: pop on one by one at dusk; on at night for whoever is still here
    lamps.forEach((L, i) => { let on = id === 'studio' ? (t >= shot.a + (shot.b - shot.a) * (.6 + i * .05) ? 1 : 0) : (id === 'quit' || id === 'prank') ? (here(i) ? 1 : 0) : 0; L.lp.intensity = on * 1.3 * (.97 + .03 * flick(t, i)); L.lg.material.color.set('#ffd08a').multiplyScalar(on * 1.2); });
    [T.quit1, T.quit2].forEach((tq, k) => { const p = poofs[k], d = desks[k * 2], e = id === 'quit' ? Math.exp(-Math.max(0, t - tq) / .25) * (t >= tq ? 1 : 0) : 0; p.position.set(d[0] - d[2] * 1.12, 1.0, d[1] + .1); p.material.color.set('#fff6e0').multiplyScalar(e * 1.4); p.scale.setScalar(.6 + (1 - e) * 1.2); });
    // clock spins, piles grow, sketches appear, coins drain
    const hours = id === 'studio' ? u * 14 : 0; hH.rotation.z = -hours / 12 * 6.283; hM.rotation.z = -hours * 6.283;
    piles.forEach((p, i) => { p.scale.y = id === 'studio' ? .05 + Math.min(7, Math.floor(u * 8 + i)) * .12 : .9; });
    sketches.forEach((s, i) => s.visible = id !== 'studio' || u > i / 9);
    const drain = id === 'studio' ? ss(seg(t, T.coin0, T.coin1)) : (id === 'mail' ? 0 : 1);
    coins.scale.y = Math.max(.05, 1 - drain); coins.position.y = 1.32 + .1 * coins.scale.y - .1;
    // team poses
    const poseSets = [['pen0', 'pen1'], ['lean', 'lean1', 'pen0'], ['type0', 'type1'], ['hold0', 'hold1']];
    team.forEach((m, i) => {
      const ps = id === 'prank' && i === 3 ? ['type0', 'type1'] : poseSets[i];
      const rate = id === 'studio' ? 7 : 2.4, k = Math.floor(t * rate + i * 3); let fr = ps[k % ps.length];
      if (id === 'studio' && (Math.floor(t * 2 + i) % 9 === 0)) fr = 'stretch';
      if (id === 'quit' && i === 1) fr = t % 3 < .12 ? 'blink' : (Math.floor(t * 1.2) % 2 ? 'lean1' : 'lean');
      if (id === 'prank' && i === 3) { const g = (t - shot.a) % 2.2; if (g > 1.4 && g < 1.8) fr = 'blink'; if (t > T.mew - .3 && t < T.mew + 1.2) fr = 'smile'; }
      if (id === 'mail') fr = 'wow';
      m.root.visible = here(i); m.frame(fr); m.face(camera, m.flip);
    });
    // CRT pictures: sprites being drawn; the programmer's screen gets a pink sparkle (the secret)
    crtScreens.forEach(c => { const { g } = c.L; g.fillStyle = '#10141c'; g.fillRect(0, 0, 64, 48); const n = Math.floor(((t * 9 + c.i * 5) % 40));
      spr(g, c.i === 1 ? BUG : BOY, 20, 12, 3, [null, 0, 1, 2, 3]); g.fillStyle = '#10141c'; g.fillRect(0, 12 + Math.min(24, n), 64, 48);
      if (id === 'prank' && c.i === 3 && t > T.prog) { const k = clamp((t - T.prog) / (T.mew - T.prog)); g.fillStyle = `rgba(255,140,220,${.4 + .6 * k})`; const r = 2 + k * 6 + (t > T.mew ? 10 * Math.exp(-(t - T.mew) / .3) : 0); g.fillRect(32 - r, 24 - r * .2, r * 2, r * .4); g.fillRect(32 - r * .2, 24 - r, r * .4, r * 2); }
      c.L.tex.needsUpdate = true; c.s.material.color.setScalar(id === 'boot' ? 0 : (id === 'prank' && c.i !== 3 ? 0 : 1.2)); });
    const pk = id === 'prank' && t > T.prog ? clamp((t - T.prog) / (T.mew - T.prog)) + (t > T.mew ? 2.5 * Math.exp(-(t - T.mew) / .35) : 0) : 0;
    pink.position.set(desks[3][0] - .25, DY + .25, desks[3][1] + .2); pink.material.color.set('#ff8ad8').multiplyScalar(pk * .8); pink.scale.setScalar(.4 + pk * .3);
    // postcards rain down and pile up
    const pm = id === 'mail' ? clamp((t - T.mailIn) / (shot.b - T.mailIn)) : 0;
    pcs.visible = mound.visible = id === 'mail';
    if (id === 'mail') {
      for (let i = 0; i < NPC; i++) { const c = PCS[i], t0 = T.mailIn + c[2] * (shot.b - T.mailIn - 1.2), f = clamp((t - t0) / 1.4), y = lerp(4.5, .03 + .75 * (1 - c[4]) * pm * pm + (c[2] * .04), f * f);
        _o.position.set(lerp(-1.9, c[0], .4 + .6 * f), y, c[1]); _o.rotation.set(f < 1 ? t * 3 + c[3] : -Math.PI / 2, c[3], f < 1 ? t * 2 : c[3]); _o.scale.setScalar(t < t0 ? .0001 : 1); _o.updateMatrix(); pcs.setMatrixAt(i, _o.matrix); }
      pcs.instanceMatrix.needsUpdate = true;
    }
    // the handheld: boots in the boot shot
    if (id === 'boot') { boot(LB, t - T.boot); HB.userData.on(t >= T.boot ? .2 : 0); } else { overworld(LB, t, {}); HB.userData.on(0); }
    scrLight.position.copy(HB.position).add(new THREE.Vector3(0, .6, .3)); scrLight.intensity = id === 'boot' && t >= T.boot ? .05 : 0;
    dust.userData.update(t);
    pfill.intensity = id === 'prank' ? 3.2 : id === 'quit' ? .6 : 0; pfill.position.set(id === 'prank' ? -.1 : -.2, 1.3, id === 'prank' ? 2.9 : .4);
    // camera
    const C = { studio: C_studio, quit: C_quit, prank: C_prank, mail: C_mail }[id];
    if (C) { camera.position.set(...C.p(u)); camera.lookAt(...C.l(u)); camera.fov = id === 'prank' ? 34 : 40; }
    else {
      const sp = HB.localToWorld(HB.userData.scr.position.clone()), k = eio(seg(t, T.boot - .2, shot.b));
      const p0 = sp.clone().add(new THREE.Vector3(.35, .55, .75)), p1 = sp.clone().add(new THREE.Vector3(0, .17, .0005));
      camera.position.copy(p0.lerp(p1, k)); camera.up.set(0, 1, 0); camera.lookAt(sp); camera.fov = lerp(36, 28, k);
      if (k > .5) { camera.up.set(-Math.sin(HB.rotation.y), 0, -Math.cos(HB.rotation.y)); camera.lookAt(sp); }
    }
    camera.near = .01;
    renderer.toneMappingExposure = id === 'boot' ? .95 : id === 'prank' ? 1.15 : 1.1;
    post.bloom.strength = id === 'boot' ? .3 : id === 'prank' ? .7 : .5; post.bloom.threshold = .78;
    const V = post.vig.uniforms; V.amt.value = id === 'boot' ? .85 : id === 'prank' ? .7 : .55; V.warm.value = .08 + eve * .1; V.sat.value = 1.08;
    const fp = id === 'prank' ? new THREE.Vector3(desks[3][0] - .2, 1.0, desks[3][1]) : id === 'quit' ? new THREE.Vector3(desks[1][0] - 1.0, 1.0, desks[1][1]) : id === 'boot' ? HB.position : new THREE.Vector3(0, .8, -.2);
    post.dof.focus = camera.position.distanceTo(fp); post.dof.aper = id === 'boot' ? .25 : id === 'prank' ? 40 : id === 'quit' ? 60 : 120; post.dof.maxCoc = 18;
    if (id === 'studio' || id === 'mail') { post.dof.tiltAmt = 10; post.dof.tiltC = .45; }
  }
  return { scene, update };
}
