// The shot list. Every shot: t0 (global seconds), set, fn(lt, T, shot) that poses the cast, moves the camera and sets focus.
// tr: how the shot comes in — 'dis' (0.3 s dissolve), 'long' (0.6 s), 'cut', 'whip', 'flash', 'black'.
export function makeShots(H) {
  const { E, THREE, C, P, SETS } = H;
  const { cam, focusOn, lerp, seg, ss, eio, eo, sine, noise, drift, add3, clamp } = E;
  const ext = SETS.ext.userData, kit = SETS.kitchen.userData, att = SETS.attic.userData, barn = SETS.barn.userData, bed = SETS.bedroom.userData, evi = SETS.evidence.userData;
  const V = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  // move camera from A to B over the shot (u 0..1), with handheld drift; returns u
  const move = (lt, d, A, B, o = {}) => {
    const u = (o.ease || sine)(clamp(lt / d));
    const p = add3(V(A[0], B[0], u), drift(lt + (o.seed || 0), o.shake ?? .02, o.seed || 1));
    const t = V(A[1], B[1], u);
    cam(p, t, lerp(A[2] ?? 40, B[2] ?? 40, u), lerp(A[3] ?? 0, B[3] ?? 0, u));
    return u;
  };
  const snowAt = (T, c, sp = 1) => { ext.snow.visible = true; ext.snow.userData.update(T, c, sp); };
  const smoke = (T, a = 1, col) => { ext.smoke.userData.update(T, a); if (col) ext.smoke.children.forEach(s => s.material.color.set(col)); };
  const lampFlicker = (T, base = 22) => base * (.9 + .1 * noise(T * 7) + .05 * noise(T * 23));
  const bloom = (s = .55, th = .85) => { E.post.bloom.strength = s; E.post.bloom.threshold = th; };
  const expo = v => { E.renderer.toneMappingExposure = v; };
  const vig = v => { E.post.vig.uniforms.amt.value = v; };
  const reset = () => { bloom(); expo(1); vig(.55); ext.memorial.visible = false; ext.farm.visible = true; ext.prints.visible = true; ext.sign.visible = true;
    att.mattock.visible = true; att.loose.forEach((b, i) => { b.rotation.set(.95, 0, 0); b.position.set(i ? .08 : -.1, .32, i ? .1 : -.14); }); ext.farm.userData.barnGlow.visible = false; att.roof.forEach(r => r.visible = true); kit.crumbs.visible = false; kit.bread.visible = true; kit.pantry.userData.cut.visible = false;
    kit.keys.forEach(k => k.visible = true); ext.farm.userData.barnDoor[0].rotation.y = 0; ext.farm.userData.barnDoor[1].rotation.y = 0; ext.smoke.children.forEach(s => s.material.color.set(0x2b3048));
    barn.doors[0].rotation.y = 0; barn.doors[1].rotation.y = 0; barn.L.intensity = 24; barn.glow.visible = true; barn.day.intensity = 0; barn.amb.intensity = .7; barn.outside.material.emissive.set(0x5a70c0); barn.outside.material.color.set(0x2a3a70);
    kit.lampL.intensity = 22; kit.lampGlow.visible = true; kit.amb.intensity = .55; kit.window.material.emissive.set(0x2a3d86); kit.chair.position.set(1.15, 0, -.2); kit.chair.rotation.y = -Math.PI / 2;
    evi.stamp.visible = true; bed.crib.visible = true; bed.mobile.visible = true; };
  const P0 = (o) => ({ eyes: 'dot', mouth: 'flat', ...o });
  const S = [];
  const add = (t0, set, name, fn, o = {}) => S.push({ t0, set, name, fn: (lt, T, sh) => { reset(); fn(lt, T, sh); }, ...o });

  // ===== 1. HOOK — low over the footprints, rushing toward the dark farm
  add(0, 'ext', 'hook-prints', (lt, T, sh) => {
    H.envExt('night'); H.windows(i => i === 3);
    const k = eo(lt / .55); // fast dolly-in, then slow
    const p = add3(V([-3.0, .7, -46], [-.9, .8, -33.5], k * .72 + seg(lt, .55, 1.6) * .28), drift(lt, .015));
    cam(p, [1.6, 1.9, -4], 40, lerp(-.06, 0, k)); focusOn([.6, 0, -28.5], 7, 18);
    snowAt(T, [-1, 3, -30]); smoke(T, .6);
  }, { tr: 'cut' });
  // ===== 2. Andreas finds them (lantern, low angle, prints in the foreground)
  add(1.55, 'ext', 'andreas-finds', (lt, T, sh) => {
    H.envExt('night'); H.windows(i => i === 3);
    const [a] = H.use('andreas'); a.place(5.2, 0, -9.2, 1);
    const look = lt < 1.1 ? [.1, .9] : [-.4, .6];
    a.draw(P0({ hold: 'lantern', armR: [.55, .35], eyes: lt > .6 ? 'ring' : 'dot', brow: -.8, look, sweat: seg(lt, .8, 1.3), rim: ['#9fb6ff', -1, .7], shake: .2 }), T);
    move(lt, 2.4, [[3.9, .45, -12.6], [5.1, 1.15, -9.2], 36], [[4.25, .5, -11.9], [5.15, 1.25, -9.2], 33]);
    a.billboard(); const hp = a.worldOf(...(a.lampDesign || [400, 650])); ext.spill.position.copy(hp); ext.spill.intensity = 9; ext.spill.distance = 8;
    focusOn([5.15, 1.3, -9.2], 7, 16); snowAt(T, [5, 2, -10]);
  });
  // ===== 3. "They came out of the forest…" — along the prints, focus racks to the trees
  add(3.7, 'ext', 'to-forest', (lt, T) => {
    H.envExt('night'); H.windows(i => i === 3);
    const u = move(lt, 1.6, [[1.4, .35, -18], [-1.8, 2.4, -46], 34], [[.9, .45, -22], [-2.4, 3.2, -48], 32]);
    focusOn(lerp(0, 1, ss(seg(lt, .1, .9))) > .5 ? [-2.5, 2, -47] : [1.2, 0, -21], 7, 18);
    snowAt(T, [0, 3, -24]);
  });
  // ===== 4. "…and walked straight to his house." — crane up following the prints to the farm
  add(5.05, 'ext', 'crane-farm', (lt, T) => {
    H.envExt('night'); H.windows(i => i === 3);
    move(lt, 2.4, [[-1.5, 1.0, -30], [3, 1.6, -10], 36], [[-7, 9.5, -31], [3.5, 2.2, -4], 38], { ease: eio });
    focusOn([4, 2, -5], 3, 8); snowAt(T, [0, 4, -22]); smoke(T, .8);
  });
  // ===== 5. "But not a single footprint… walked back out." — overhead, the trail ends at the door
  add(7.15, 'ext', 'overhead-door', (lt, T) => {
    H.envExt('night'); H.windows(i => i === 3);
    move(lt, 3.4, [[4.6, 7.2, -12.0], [6.3, .4, -5.0], 38, -.05], [[5.3, 4.4, -9.4], [6.35, .7, -4.6], 34, .12], { ease: eo });
    focusOn([6.3, .3, -5.4], 5, 10); snowAt(T, [6, 2, -7]);
  });
  // ===== 6. "This is Hinterkaifeck." — the sign, farm glowing behind
  add(10.7, 'ext', 'sign', (lt, T) => {
    H.envExt('night'); H.windows(i => i < 3);
    move(lt, 1.9, [[-12.6, 1.5, 13.6], [-8.0, 1.9, 7.1], 36], [[-11.6, 1.75, 12.3], [-7.9, 2.0, 7.1], 33]);
    focusOn([-7.9, 1.9, 7.1], 6, 18); snowAt(T, [-9, 2, 9]); smoke(T, 1);
  });
  // ===== 7. "A lonely farm in Germany." — extreme wide, the farm alone under the moon
  add(12.3, 'ext', 'lonely-wide', (lt, T) => {
    H.envExt('night'); H.windows(i => i < 3);
    move(lt, 2.5, [[14, 7, 34], [0, 4, -4], 38], [[20, 13, 50], [0, 6, -8], 40]);
    focusOn([0, 3, 0], 1, 4); snowAt(T, [10, 5, 30], .7); smoke(T, 1);
  }, { tr: 'long' });
  // ===== 8. The family at the table (warm) — truck past each of them
  add(14.55, 'kitchen', 'family', (lt, T) => {
    const cs = H.use('andreas', 'wife', 'viktoria', 'girl', 'josef');
    const [a, w, v, g, j] = cs;
    a.seat(-1.45, 1.36, -1.0, 1); w.seat(-.85, 1.28, -1.05, 1); v.seat(-.2, 1.33, -1.0, -1); g.seat(.38, 1.18, -1.0, -1); j.seat(.86, 1.08, -1.0, -1);
    const glance = (on) => on ? [0, .1] : [.3, .1];
    a.draw(P0({ mouth: 'smile', look: [.2, .2], rim: ['#ffc070', 1, .5], armL: [.6, .3], armR: [.6, .3] }), T);
    w.draw(P0({ mouth: 'smile', eyes: lt > 1.4 && lt < 1.9 ? 'closed' : 'dot', look: [.3, .1], rim: ['#ffc070', 1, .5] }), T);
    v.draw(P0({ mouth: 'smile', look: [-.3, .1], rim: ['#ffc070', -1, .5] }), T + 1);
    g.draw(P0({ mouth: lt > 3 ? 'open' : 'smile', talk: lt > 3 ? .3 + .3 * Math.sin(T * 9) : 0, look: [.4, 0], rim: ['#ffc070', -1, .5], armR: [2.3, .2] }), T + 2);
    j.draw(P0({ mouth: 'o', look: [-.4, 0] }), T + 3);
    cs.forEach(c => c.billboard());
    const xs = [[0, -1.6], [1.3, -1.45], [1.9, -.85], [2.5, -.2], [3.2, .45], [4.2, .7]];
    let fx = xs[0][1]; for (let i = 0; i < xs.length - 1; i++) if (lt >= xs[i][0]) fx = lerp(xs[i][1], xs[i + 1][1], eio(seg(lt, xs[i][0] + .1, xs[i + 1][0])));
    cam(add3([fx + .1, 1.22, 1.15], drift(lt, .012)), [fx, 1.05, -1.0], 40);
    kit.lampL.intensity = lampFlicker(T, 24); focusOn([fx, 1, -1.0], 9, 20); kit.dust.userData.update(T, [-.4, 1.4, 0]);
    expo(1.05);
  }, { tr: 'long' });
  // ===== 9. "Months earlier, their maid had quit." — she leaves, looks back
  add(18.75, 'kitchen', 'maid-quits', (lt, T) => {
    const [m] = H.use('oldmaid'); m.place(-1.85 + lt * .12, 0, 1.75, -1);
    m.draw(P0({ hold: 'bag', armR: [.2, .2], eyes: 'ring', brow: -1, look: [-.8, -.2], mouth: 'wobble', shake: .5, sweat: .8, walk: .3, phase: T * 6, rim: ['#9fb6ff', 1, .6] }), T);
    m.billboard();
    kit.door.rotation.y = -1.1;
    move(lt, 2.2, [[.2, 1.35, -.6], [-1.9, 1.2, 2.2], 36], [[-.4, 1.3, .4], [-1.9, 1.25, 2.2], 32]);
    kit.lampL.intensity = lampFlicker(T, 16); kit.amb.intensity = .5; focusOn([-1.85, 1.2, 1.8], 8, 18);
  });
  // ===== 10. "She said the house was haunted… noises in the attic." — awake in bed, eyes on the ceiling
  add(20.85, 'bedroom', 'maid-bed', (lt, T) => {
    bed.crib.visible = false; bed.mobile.visible = false;
    const [m] = H.use('oldmaid'); m.place(-1.5, .62, -.15, 1);
    m.g.rotation.set(-Math.PI / 2, 0, 0); m.mesh.position.y = .55;
    const startle = [1.9, 2.6, 3.2].some(b => lt > b && lt < b + .25);
    m.draw(P0({ eyes: 'wide', brow: -1, look: [noise(T * 1.3) * .5, -.2], mouth: 'wobble', shake: startle ? 1 : .3, sweat: .9 }), T);
    const tilt = ss(seg(lt, 1.5, 3.2));
    cam(add3(V([-1.5, 2.15, .35], [-1.2, 1.1, 1.1], tilt), drift(lt, .01)), V([-1.5, .5, -.35], [-1.0, 2.6, -1.0], tilt), lerp(42, 48, tilt), lerp(0, .1, tilt));
    focusOn(tilt < .5 ? [-1.5, .6, -.3] : [-1.0, 2.6, -1.0], 6, 14);
    P.dustFall.visible = true; P.dustFall.userData.update(T, [20.85 + 1.9, 20.85 + 2.6, 20.85 + 3.2], [-1.2, 2.58, -1.3], 1.4);
    bed.dust.userData.update(T, [-1, 1.4, -.4]);
  });
  // ===== 11. "A house key vanished." — the key board, one hook empty
  add(24.85, 'kitchen', 'key', (lt, T) => {
    kit.keys[1].visible = false;
    kit.keys.forEach((k, i) => { k.rotation.z = Math.sin(T * 3 + i) * .08 * Math.exp(-lt * .6); });
    move(lt, 1.8, [[1.1, 1.62, 1.05], [3, 1.55, .9], 36], [[1.45, 1.58, .95], [3, 1.55, .9], 33]);
    focusOn([3, 1.55, .9], 10, 22); kit.lampL.intensity = lampFlicker(T, 18);
  }, { tr: 'whip' });
  // ===== 12. "A Munich newspaper showed up on the farm…" — on the snowy doorstep
  add(26.55, 'ext', 'newspaper', (lt, T) => {
    H.envExt('dusk'); H.windows(false);
    P.paper.visible = true; P.paper.position.set(-2.0, .04, 5.3); P.paper.rotation.y = .3;
    P.paper.userData.flap.rotation.x = -.4 - .5 * Math.abs(Math.sin(T * 2.6)) * (.6 + .4 * noise(T * 3));
    move(lt, 1.8, [[-1.2, .55, 6.6], [-2.0, .05, 5.3], 34], [[-1.5, .75, 6.3], [-2.0, .05, 5.3], 28]);
    focusOn([-2.0, .05, 5.3], 8, 18); snowAt(T, [-2, 2, 6], .5);
  });
  // ===== 13. "…one that nobody around here ever bought." — Andreas, uneasy, looks around
  add(28.3, 'ext', 'andreas-paper', (lt, T) => {
    H.envExt('dusk'); H.windows(false);
    const [a] = H.use('andreas'); a.place(-2.2, 0, 5.6, 1);
    const lk = lt < .9 ? [0, .6] : lt < 1.6 ? [-.9, 0] : [.9, -.1];
    a.draw(P0({ hold: 'paper', armR: [2.4, .25], eyes: lt > .9 ? 'ring' : 'dot', brow: -1, look: lk, mouth: 'frown', sweat: seg(lt, 1.2, 1.8), rim: ['#ffb890', -1, .55] }), T);
    a.billboard();
    move(lt, 2.6, [[-1.4, 1.35, 8.6], [-2.2, 1.35, 5.6], 34], [[-1.7, 1.3, 7.6], [-2.2, 1.4, 5.6], 30]);
    focusOn([-2.2, 1.4, 5.6], 8, 18); snowAt(T, [-2, 2, 7], .5);
  });
  // ===== 14. "One night, the whole family heard it." — they freeze, eyes up
  add(31.1, 'kitchen', 'family-freeze', (lt, T) => {
    const cs = H.use('andreas', 'wife', 'viktoria', 'girl'); const [a, w, v, g] = cs;
    a.seat(-1.45, 1.36, -1.0, 1); w.seat(-.85, 1.28, -1.05, 1); v.seat(-.2, 1.33, -1.0, -1); g.seat(.38, 1.18, -1.0, -1);
    const up = ss(seg(lt, .6, 1.0));
    const pose = (o) => P0({ eyes: up > .5 ? 'ring' : 'dot', look: [0, -up], brow: -up, mouth: up > .5 ? 'o' : 'flat', shake: up * .3, ...o });
    a.draw(pose({ rim: ['#ffc070', 1, .5] }), T); w.draw(pose({ rim: ['#ffc070', 1, .5] }), T); v.draw(pose({ rim: ['#ffc070', -1, .5] }), T); g.draw(pose({ rim: ['#ffc070', -1, .5], mouth: 'wobble' }), T);
    cs.forEach(c => c.billboard());
    move(lt, 2.4, [[-.3, .95, 1.6], [-.5, 1.3, -1.0], 38, -.05], [[-.35, .9, 1.05], [-.5, 1.4, -1.0], 36, .06]);
    kit.lamp.rotation.z = Math.sin(T * 2.2) * .05; kit.lampL.intensity = lampFlicker(T, 20); focusOn([-.6, 1.2, -1.0], 8, 18);
  });
  // ===== 15. "Footsteps. Right above them… in the attic." — the ceiling sheds dust at every step
  add(33.55, 'kitchen', 'ceiling', (lt, T) => {
    const steps = [33.66, 34.25, 34.85, 35.45];
    const hit = steps.reduce((a, s) => a + Math.max(0, 1 - Math.abs(T - s - .05) * 9), 0);
    move(lt, 2.7, [[.3, 1.5, 1.0], [-1.3, 2.8, -1.1], 44], [[-.6, 1.5, .9], [-1.7, 2.8, -1.3], 44], { shake: .02 + hit * .02 });
    kit.lamp.rotation.z = Math.sin(T * 2.4) * (.04 + .04 * seg(lt, 0, 2)); kit.lampL.intensity = lampFlicker(T, 20) * (1 - hit * .3);
    P.dustFall.visible = true; P.dustFall.userData.update(T, steps, [-1.5, 2.76, -1.3], 2.6);
    focusOn([-1.5, 2.7, -1.2], 6, 14);
  }, { tr: 'cut' });
  // ===== 16. "Andreas climbed up with a lantern." — rising through the trapdoor
  add(36.3, 'attic', 'trapdoor', (lt, T) => {
    const [a] = H.use('andreas'); const rise = eo(seg(lt, 0, 1.3));
    a.place(0, lerp(-1.65, -.75, rise), 1.25, -1);
    a.draw(P0({ hold: 'lantern', armR: [2.7, .1], eyes: 'ring', brow: -1, look: [-.6 + Math.sin(lt * 1.5) * .5, -.2], sweat: .7, rim: ['#9fb6ff', -1, .45], mouth: 'flat' }), T);
    a.billboard();
    const hp = a.worldOf(...(a.lampDesign || [470, 300])); att.lant.position.copy(hp); att.lant.intensity = 20 * (.9 + .1 * noise(T * 8));
    move(lt, 2.2, [[-.48, .62, -1.3], [0, .6, 1.2], 40], [[-.46, .78, -.75], [0, .65, 1.2], 36]);
    focusOn([0, .5, 1.25], 8, 16); att.dust.userData.update(T, [0, 1, 0]); att.below.material.emissiveIntensity = .9;
  });
  // ===== 17. "Nobody was there." — lantern POV, the attic is empty. (music cuts out)
  add(38.3, 'attic', 'empty', (lt, T) => {
    const yaw = lerp(.9, -.75, eio(seg(lt, 0, 1.6)));
    const p = [0 + Math.sin(T * 1.1) * .01, 1.3, 1.25];
    cam(add3(p, drift(lt, .01)), [p[0] - Math.sin(yaw) * 3, 1.0, p[2] - Math.cos(yaw) * 3], 42);
    att.lant.position.set(.35, 1.15, .9); att.lant.intensity = 34 * (.9 + .1 * noise(T * 8));
    focusOn([p[0] - Math.sin(yaw) * 2.4, 1, p[2] - Math.cos(yaw) * 2.4], 4, 10); att.dust.userData.update(T, [0, 1, 0]);
    att.amb.intensity = .95; expo(1.0);
  });
  // ===== 18. "He told the neighbors. But he never told the police." — at the fence, waving off help
  add(39.95, 'ext', 'fence', (lt, T) => {
    H.envExt('day'); H.windows(false);
    const [a, n] = H.use('andreas', 'neighbor');
    a.place(-4.1, 0, 8.25, 1); n.place(-2.6, 0, 9.75, -1);
    const no = lt > 1.4; // "But he never told the police."
    n.draw(P0({ talk: lt < 1.3 ? .4 + .4 * Math.sin(T * 11) : 0, brow: -.6, look: [-.6, 0], armR: [1.4, .4], mouth: lt < 1.3 ? 'flat' : 'frown' }), T);
    a.draw(P0({ tilt: no ? Math.sin(T * 9) * .12 * Math.exp(-(lt - 1.4) * 1.2) : 0, look: [.6, 0], brow: .6, mouth: 'frown', eyes: 'half', armR: no ? [2.0 + Math.sin(T * 10) * .35, .2] : [.3, .2] }), T);
    a.billboard(); n.billboard();
    move(lt, 2.8, [[-3.2, 1.5, 15.6], [-3.35, 1.25, 9.0], 38], [[-3.5, 1.45, 14.0], [-3.6, 1.3, 8.9], 34]);
    focusOn(no ? [-4.1, 1.3, 8.25] : [-3.3, 1.3, 9], 7, 16); snowAt(T, [-3, 2, 11], .4);
  }, { tr: 'long' });
  // ===== 19. "On March 31st," — the calendar
  add(42.85, 'kitchen', 'calendar', (lt, T) => {
    move(lt, 1.3, [[-2.0, 1.6, -.75], [-2.98, 1.65, -1.2], 36, -.08], [[-2.45, 1.64, -1.05], [-2.98, 1.65, -1.2], 30, .04], { ease: eo });
    focusOn([-2.98, 1.65, -1.2], 10, 20); kit.lampL.intensity = lampFlicker(T, 16); kit.window.material.emissive.set(0x7a5a8a);
  }, { tr: 'whip' });
  // ===== 20. "…a new maid arrived." — at the door at dusk, cheerful (she doesn't know)
  add(44.05, 'ext', 'newmaid', (lt, T) => {
    H.envExt('dusk'); H.windows(i => i < 2);
    const [m] = H.use('newmaid'); m.place(-2.3 + (1 - eo(lt / 1.2)) * .8, 0, 5.3, -1);
    m.draw(P0({ hold: 'bag', mouth: 'smile', look: [-.3, -.1], walk: 1 - seg(lt, .6, 1.2), phase: T * 7, armL: [.4, .2], rim: ['#ffb890', 1, .55] }), T);
    m.billboard();
    move(lt, 1.6, [[-1.3, 1.3, 8.4], [-2.3, 1.2, 5.3], 34], [[-1.6, 1.3, 7.6], [-2.3, 1.25, 5.3], 30]);
    focusOn([-2.3, 1.2, 5.3], 8, 18); snowAt(T, [-2, 2, 7], .4);
  });
  // ===== 21. "That same night, someone lured the family into the barn…" — the barn door, ajar, glowing
  add(45.5, 'ext', 'barn-ext', (lt, T) => {
    H.envExt('night'); H.windows(false);
    const bd = ext.farm.userData.barnDoor; bd[0].rotation.y = .85; bd[1].rotation.y = -.2; ext.farm.userData.barnGlow.visible = true; ext.farm.userData.barnGlow.material.emissiveIntensity = .5 + .1 * noise(T * 6);
    ext.spill.position.set(5.2, 1.6, 4.6); ext.spill.intensity = 14 * (.85 + .15 * noise(T * 6)); ext.spill.distance = 9;
    move(lt, 2.5, [[7.4, 1.0, 16.5], [5.8, 1.7, 4], 42], [[6.6, 1.2, 12.6], [5.6, 1.8, 4], 38]);
    focusOn([5.6, 1.7, 4.1], 5, 14); snowAt(T, [6, 2, 9]); expo(.95);
  }, { tr: 'long' });
  // ===== 22. "…one… by one." — from inside the dark barn the door swings shut
  add(47.75, 'barn', 'barn-door', (lt, T) => {
    const close = ss(seg(T, 48.2, 49.55)), slam = T > 49.55 ? Math.exp(-(T - 49.55) * 6) : 0;
    barn.doors[0].rotation.y = lerp(1.25, 0, close) + slam * .03; barn.doors[1].rotation.y = -lerp(1.15, 0, close) - slam * .03;
    barn.L.intensity = lampFlicker(T, 18) * (1 - .6 * seg(T, 49.5, 50.3)); barn.glow.material.opacity = .8 * (1 - .6 * seg(T, 49.5, 50.3));
    barn.cows.forEach((c, i) => c.position.y = .72 + Math.sin(T * 1.3 + i) * .01);
    move(lt, 3, [[2.7, 2.3, -3.0], [-1.5, 1.2, 2.4], 52], [[2.3, 2.1, -2.3], [-1.3, 1.2, 2.6], 48], { shake: .02 + slam * .05 });
    focusOn([0, 1.5, 3.5], 5, 12); barn.dust.userData.update(T, [0, 1.6, 0]);
  });
  // ===== 23. "Then he went inside… for the new maid," — a shadow crosses the bedroom wall
  add(50.5, 'bedroom', 'shadow', (lt, T) => {
    bed.mobile.visible = true;
    const [m] = H.use('newmaid'); m.place(-1.5, .62, -.4, 1); m.g.rotation.set(-Math.PI / 2, 0, 0); m.mesh.position.y = .5;
    m.draw(P0({ eyes: 'closed', mouth: 'flat' }), T);
    const k = ss(seg(lt, .2, 1.9));
    P.shadow.visible = true; P.shadow.position.set(2.14, 1.2 + k * .15, lerp(1.6, -.4, k)); P.shadow.rotation.y = -Math.PI / 2; P.shadow.scale.set(lerp(1, 1.5, k), lerp(1, 1.5, k), 1); P.shadow.material.opacity = .78 * ss(seg(lt, 0, .5));
    bed.candle.intensity = 1.6 * (.85 + .15 * noise(T * 9));
    move(lt, 2, [[-1.4, 1.5, -1.3], [1.4, 1.2, .8], 40], [[-1.1, 1.45, -1.0], [1.8, 1.3, .2], 36]);
    focusOn([2.1, 1.3, .4], 4, 10); bed.dust.userData.update(T, [0, 1.3, 0]);
  });
  // ===== 24. "…and two-year-old Josef in his crib." — the crib, the mobile, a music box winding down
  add(52.3, 'bedroom', 'crib', (lt, T) => {
    bed.mobile.rotation.y = T * .3;
    move(lt, 2.6, [[1.5, 1.35, -.1], [.4, .7, -1.4], 38], [[1.0, 1.15, -.6], [.4, .65, -1.4], 34]);
    focusOn([.4, .7, -1.4], 7, 16); bed.dust.userData.update(T, [.4, 1.2, -1.2]); bed.candle.intensity = 0;
  }, { fx: (lt, T) => ({ fade: 1 - .85 * ss(seg(T, 54.1, 54.95)) }) });
  // ===== 25. "But here's the scariest part." — rush over the farm at night
  add(54.95, 'ext', 'aerial', (lt, T) => {
    H.envExt('night'); H.windows(false);
    move(lt, 1.8, [[-26, 24, 40], [1, 3, -6], 42], [[-11, 12.5, 24], [0, 4, -6], 40], { ease: eo });
    focusOn([0, 3, 0], 1, 4); snowAt(T, [-8, 10, 20], 1.4); smoke(T, 1);
  }, { tr: 'whip' });
  // ===== 26. "The killer didn't leave." — one window lit in the dark house (silence)
  add(56.7, 'ext', 'window', (lt, T) => {
    H.envExt('night'); H.windows(i => i === 1);
    ext.spill.position.set(-3.4, 2.4, 5.2); ext.spill.intensity = 10; ext.spill.distance = 7;
    move(lt, 2.0, [[-3.3, 2.0, 10.5], [-3.4, 2.7, 4], 34], [[-3.35, 2.4, 7.6], [-3.4, 2.8, 4], 30], { ease: s => s });
    focusOn([-3.4, 2.8, 4.02], 6, 14); snowAt(T, [-3.4, 2, 7], .5); smoke(T, 1);
  }, { tr: 'cut' });
  // ===== 27. "For days, someone fed the cattle." — fresh hay, cows eating (grey daylight)
  add(58.7, 'barn', 'cattle', (lt, T) => {
    barn.L.intensity = 0; barn.glow.visible = false; barn.day.intensity = 18; barn.amb.intensity = .8; barn.outside.material.emissive.set(0xc8d0e0);
    barn.doors[0].rotation.y = .5; barn.doors[1].rotation.y = -.5;
    barn.cows.forEach((c, i) => { c.position.y = .72 + Math.max(0, Math.sin(T * 2.4 + i * 2)) * .05; c.rotation.z = Math.sin(T * 2.4 + i * 2) * .03; });
    move(lt, 2.5, [[.2, 1.05, 1.3], [-2.7, .7, -.3], 46], [[-.3, .95, .8], [-2.7, .7, -.3], 42]);
    focusOn([-2.6, .7, -.2], 7, 16); barn.dust.userData.update(T, [-1, 1.4, 0]);
  }, { tr: 'long' });
  // ===== 28. "Ate all the bread." — the empty basket, crumbs
  add(61.1, 'kitchen', 'bread', (lt, T) => {
    kit.bread.visible = false; kit.crumbs.visible = true; kit.lampL.intensity = 8; kit.amb.intensity = 1.1; kit.window.material.emissive.set(0x8a96b8);
    move(lt, 1.3, [[.2, 1.8, .9], [-.6, .9, -.25], 42], [[-.1, 1.62, .55], [-.6, .9, -.25], 38]);
    focusOn([-.6, .92, -.25], 8, 18);
  }, { tr: 'cut' });
  // ===== 29. "Cut meat from the pantry." — the ham, a fresh slice gone
  add(62.4, 'kitchen', 'ham', (lt, T) => {
    kit.pantry.userData.cut.visible = true; kit.lampL.intensity = 8; kit.amb.intensity = 1.1; kit.window.material.emissive.set(0x8a96b8);
    kit.pantry.children[1].rotation.z = Math.sin(T * 1.6) * .05;
    move(lt, 1.6, [[.5, 1.6, 1.9], [2.7, 1.5, 1.3], 38], [[.95, 1.55, 1.55], [2.7, 1.5, 1.3], 34]);
    focusOn([2.7, 1.5, 1.3], 9, 18);
  }, { tr: 'cut' });
  // ===== 30. "A neighbor saw smoke rising from the house…" — thick, sick smoke against the moon
  add(64.0, 'ext', 'smoke', (lt, T) => {
    H.envExt('night'); H.windows(false);
    move(lt, 2.2, [[-8, 2.5, 19], [-3, 9.5, -1], 36], [[-7, 3.4, 15], [-3, 11, -1], 36]);
    focusOn([-3, 10, -.5], 2, 6); smoke(T * 1.6, 1.4, 0x4a4e3e); snowAt(T, [-6, 4, 14], .5);
  }, { tr: 'long' });
  // ===== 31. "…with a revolting smell." — the neighbor recoils
  add(66.05, 'ext', 'neighbor-smell', (lt, T) => {
    H.envExt('night'); H.windows(false);
    const [n] = H.use('neighbor2'); n.place(-6.2, 0, 13.6, -1);
    const gag = seg(lt, .5, .9);
    n.draw(P0({ hold: 'lantern', armR: [.5, .3], armL: gag > .2 ? [2.6, .9] : [.3, .2], eyes: gag > .2 ? 'half' : 'dot', brow: -1, mouth: gag > .2 ? 'gag' : 'flat', lean: -gag * .12, look: [.5, -.2], rim: ['#9fb6ff', 1, .6] }), T);
    n.billboard(); const hp = n.worldOf(...(n.lampDesign || [430, 650])); ext.spill.position.copy(hp); ext.spill.intensity = 8; ext.spill.distance = 6;
    move(lt, 1.9, [[-5.1, 1.5, 16.6], [-6.2, 1.45, 13.6], 34], [[-5.5, 1.5, 15.6], [-6.2, 1.5, 13.6], 30]);
    focusOn([-6.2, 1.5, 13.6], 7, 16); snowAt(T, [-6, 2, 15], .5);
  });
  // ===== 32. "Whoever did this was living there… with the bodies." — an empty chair, a seated shadow
  add(67.95, 'kitchen', 'seated-shadow', (lt, T) => {
    kit.chair.position.set(.9, 0, .25); kit.chair.rotation.y = -Math.PI / 2 - .6; kit.lampL.intensity = lampFlicker(T, 16); kit.lampL.position.set(-.4, 1.75, -.2);
    P.seatShadow.visible = true; P.seatShadow.position.set(1.05, 1.3, -2.48); P.seatShadow.scale.set(1.45, 1.45, 1); P.seatShadow.material.opacity = .92;
    P.seatShadow.position.x = 1.05 + Math.sin(T * .8) * .02;
    move(lt, 3.1, [[-.6, 1.45, 2.1], [.8, 1.1, -1.6], 40], [[-.1, 1.35, 1.3], [.9, 1.15, -1.8], 36]);
    focusOn([1.0, 1.2, -1.9], 5, 14); kit.dust.userData.update(T, [.4, 1.4, -.5]); expo(.9);
  }, { tr: 'long' });
  // ===== 33. "Four days later, the neighbors finally went in." — from inside: the doors open, their faces
  add(71.2, 'barn', 'discovery', (lt, T) => {
    const open = ss(seg(T, 71.6, 72.6));
    barn.doors[0].rotation.y = -open * 1.5; barn.doors[1].rotation.y = open * 1.5;
    barn.L.intensity = 0; barn.glow.visible = false; barn.outside.material.emissive.set(0x7c8496); barn.outside.material.color.set(0x404858);
    barn.day.intensity = 6 * open; barn.amb.intensity = .35 + .25 * open;
    const cs = H.use('neighbor', 'neighbor2', 'neighbor3'); const [a, b, c] = cs;
    a.place(-.75, 0, 4.3, 1); b.place(.15, 0, 4.15, -1); c.place(.95, 0, 4.4, -1); cs.forEach(x => x.tint(0xb9c3d8));
    const horror = seg(T, 72.4, 72.9);
    for (const [ch, k] of [[a, 0], [b, 1], [c, 2]]) ch.draw(P0({ eyes: horror > .3 ? 'wide' : 'dot', mouth: horror > .3 ? 'o' : 'flat', brow: -horror, shake: horror * .6, look: [0, .35], lean: horror * .05 * (k - 1), pale: horror * .4, rim: ['#e8eef8', k % 2 ? 1 : -1, .8], armR: k === 0 ? [2.2 * (1 - open) + .3, .3] : [.25, .25] }), T + k);
    cs.forEach(x => x.billboard());
    move(lt, 2.9, [[0, .9, -1.4], [0, 1.45, 3.6], 38], [[0, 1.0, -.3], [0, 1.5, 3.8], 34]);
    focusOn([0, 1.4, 4.2], 6, 14); barn.dust.userData.update(T, [0, 1.6, 1.5]);
  }, { tr: 'long' });
  // ===== 34. "Over a hundred people were suspected." — the wall of suspects, pulling back
  add(74.0, 'evidence', 'suspects', (lt, T) => {
    move(lt, 2.1, [[.3, 2.7, .7], [.25, 2.6, -.5], 34], [[0, 2.5, 5.8], [0, 2.5, -.5], 40], { ease: eo });
    focusOn([0, 2.5, -.45], 5, 12); evi.dust.userData.update(T, [0, 2.5, 1.5]);
  }, { tr: 'whip' });
  // ===== 35. "No one was ever convicted." — the file, the stamp slams down
  add(75.95, 'evidence', 'stamp', (lt, T) => {
    const hit = 76.85, k = seg(T, hit - .12, hit);
    evi.stamp.visible = T > hit - .12; evi.stamp.scale.setScalar(lerp(1.8, 1, eo(k))); evi.stamp.material.opacity = k;
    const shake = T > hit ? Math.exp(-(T - hit) * 8) : 0;
    move(lt, 2.0, [[.1, 2.2, 1.75], [0, 1.02, 1.22], 40], [[.05, 1.95, 1.6], [0, 1.02, 1.22], 36], { shake: .01 + shake * .06 });
    focusOn([0, 1.03, 1.22], 8, 16);
  }, { tr: 'cut', fx: (lt, T) => ({ flash: T > 76.85 ? .35 * Math.exp(-(T - 76.85) * 10) : 0 }) });
  // ===== 36. "And when the farm was torn down the next year," — daylight through a stripped roof, crowbars
  add(77.9, 'attic', 'demolition', (lt, T) => {
    att.roof[1].visible = false; P.daySky.visible = true; att.amb.intensity = 1.1; att.lant.intensity = 0; att.moon.intensity = 40; att.moon.color.set(0xfff4e0); att.beam.visible = false;
    att.moon.position.set(-1, 5, 4); att.moon.target.position.set(-2.4, 0, .6);
    const [w] = H.use('worker'); w.place(-2.2, 0, -1.55, -1);
    const pry = Math.sin(T * 5) * .25;
    w.draw(P0({ hold: 'crowbar', armR: [1.9 + pry, .3], armL: [1.6 + pry, .5], lean: .15 + pry * .2, brow: .7, mouth: 'grit', look: [-.4, .5] }), T);
    w.billboard();
    att.loose[0].rotation.x = .95 - Math.max(0, pry) * .2; att.amb.intensity = 1.2;
    move(lt, 2.4, [[.0, 1.3, .9], [-2.4, .8, -1.6], 40], [[-.4, 1.25, .5], [-2.5, .75, -1.7], 37]);
    focusOn([-2.3, .8, -1.6], 6, 14); att.dust.userData.update(T, [-2, 1, -1.5]);
  }, { tr: 'long', fx: () => ({}) });
  // ===== 37. "…they found the murder weapon…" — boards up, something underneath
  add(80.25, 'attic', 'found', (lt, T) => {
    att.roof[1].visible = false; P.daySky.visible = true; att.amb.intensity = .9; att.lant.intensity = 0; att.moon.intensity = 40; att.moon.color.set(0xfff4e0); att.beam.visible = false;
    att.moon.position.set(-2, 5, 2); att.moon.target.position.set(-3.0, 0, -2.6);
    const up = eo(seg(lt, 0, .7));
    att.loose[0].rotation.x = lerp(.95, 1.55, up); att.loose[0].position.set(-.1 - up * .1, lerp(.32, .03, up), -.14 + up * .75); att.loose[1].rotation.x = lerp(.95, 1.5, up); att.loose[1].position.set(.08 + up * .2, lerp(.32, .03, up), .1 + up * .95);
    move(lt, 1.7, [[-1.45, 1.75, -1.15], [-2.95, .05, -2.5], 46], [[-1.55, 1.55, -1.45], [-2.9, .05, -2.6], 42]);
    focusOn([-3.0, .05, -2.65], 8, 16); att.dust.userData.update(T, [-3, .6, -2]); att.amb.intensity = 1.0;
  }, { tr: 'cut' });
  // ===== 38. "…hidden in the attic." — close on the mattock in the cavity
  add(81.75, 'attic', 'mattock', (lt, T) => {
    att.roof[1].visible = false; P.daySky.visible = true; att.amb.intensity = .35; att.lant.intensity = 0; att.moon.intensity = 50; att.moon.color.set(0xd8e0ff); att.beam.visible = false;
    att.moon.position.set(-2.3, 1.7, -1.2); att.moon.target.position.set(-3.0, 0, -2.7); att.moon.angle = .3; att.moon.intensity = 14;
    att.loose[0].rotation.x = 1.55; att.loose[0].position.set(-.2, .03, .61); att.loose[1].rotation.x = 1.5; att.loose[1].position.set(.28, .03, 1.05);
    move(lt, 1.6, [[-1.95, 1.2, -1.75], [-2.75, .03, -2.65], 38, .06], [[-2.2, .9, -2.05], [-2.75, .03, -2.65], 34, -.04], { ease: s => s });
    focusOn([-2.75, .03, -2.68], 10, 18); expo(.85); vig(.75);
  }, { tr: 'dis' });
  // ===== 39. "The killer was never found." — the farm is gone; only a cross, and the footprints
  add(83.1, 'ext', 'ending', (lt, T) => {
    H.envExt('night'); ext.farm.visible = false; ext.sign.visible = false; ext.memorial.visible = true; ext.memorial.position.set(5.2, 0, -5.2);
    move(lt, 4.4, [[-1.6, .55, -30], [4, 1.4, -6], 34], [[-1.9, 2.4, -36], [4.2, 1.6, -6], 32], { ease: s => s });
    focusOn([3.6, 1.2, -6], 2.5, 8); snowAt(T, [0, 3, -28], .8);
  }, { tr: 'long' });

  // the attic moon must be restored for shots that don't override it
  const baseMoon = { p: att.moon.position.clone(), t: att.moon.target.position.clone(), c: att.moon.color.getHex(), i: att.moon.intensity, a: att.moon.angle };
  const baseLamp = kit.lampL.position.clone();
  for (const s of S) { const f = s.fn; s.fn = (lt, T, sh) => { att.moon.position.copy(baseMoon.p); att.moon.target.position.copy(baseMoon.t); att.moon.color.setHex(baseMoon.c); att.moon.intensity = baseMoon.i; att.moon.angle = baseMoon.a; att.beam.visible = true; P.daySky.visible = false; kit.lampL.position.copy(baseLamp); att.amb.intensity = .6; E.fill.intensity = 1.4; E.fill.color.set(0xc8d2ff); f(lt, T, sh); }; }
  return S;
}
