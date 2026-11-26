// The shot list for "Hung Out to Dry". Every shot: t0, set, fn(lt, T) poses the cast, moves the camera, sets focus.
// keep(): props that must stay wholly in frame (window.CHECK). tr: 'dis' | 'long' | 'cut' | 'whip' | 'flash' | 'black'.
export function makeShots(H) {
  const { E, THREE, C, P, SETS, S } = H;
  const { cam, focusOn, lerp, seg, ss, eio, eo, ei, sine, noise, drift, add3, clamp, canvasTex } = E;
  const gr = SETS.grounds.userData, of = SETS.office.userData, PL = S.POOL;
  const V = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  const move = (lt, d, A, B, o = {}) => {
    const u = (o.ease || sine)(clamp(lt / d));
    const p = add3(V(A[0], B[0], u), drift(lt + (o.seed || 0), o.shake ?? .01, o.seed || 1));
    cam(p, V(A[1], B[1], u), lerp(A[2] ?? 40, B[2] ?? 40, u), lerp(A[3] ?? 0, B[3] ?? 0, u));
    return u;
  };
  const bloom = (s = .3, th = .95) => { E.post.bloom.strength = s; E.post.bloom.threshold = th; };
  const vig = v => { E.post.vig.uniforms.amt.value = v; };
  const P0 = o => ({ eyes: 'dot', mouth: 'flat', ...o });
  const live = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; let last = null;
    return { tex: t, set(p) { const k = JSON.stringify(p); if (k === last) return; last = k; x.save(); draw(x, w, h, p); x.restore(); t.needsUpdate = true; } }; };
  const add = (o) => { E.scene.add(o); o.visible = false; return o; };
  const fitDist = (w, h, fov, m = .12) => { const t = Math.tan(fov * Math.PI / 360); return Math.max(h / 2 / t, w / 2 / (t * 1080 / 1920)) * (1 + m); };

  // ---------- props
  // splash droplets (ballistic) + bubbles
  { const n = 160, g = new THREE.BufferGeometry(), r = E.rng(41), seed = Array.from({ length: n }, () => [r(), r(), r(), r()]);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const tex = canvasTex(64, 64, (x) => { const g2 = x.createRadialGradient(28, 26, 2, 32, 32, 28); g2.addColorStop(0, '#ffffff'); g2.addColorStop(.5, 'rgba(200,245,255,.95)'); g2.addColorStop(1, 'rgba(120,210,230,0)'); x.fillStyle = g2; x.beginPath(); x.arc(32, 32, 28, 0, 7); x.fill(); });
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: tex, size: .07, transparent: true, depthWrite: false, color: 0xe0f8ff })); pts.frustumCulled = false;
    pts.userData.update = (age, o, top, power = 1) => { const a = g.attributes.position.array;
      for (let i = 0; i < n; i++) { const [s0, s1, s2, s3] = seed[i], ang = s0 * Math.PI * 2, sp = (.7 + s1 * 2.0) * power, up = (2 + s2 * 3.2) * power, tt = age - s3 * .1;
        const y = o[1] + up * tt - 4.9 * tt * tt; a[i * 3] = o[0] + Math.cos(ang) * sp * tt * .6; a[i * 3 + 2] = o[2] + Math.sin(ang) * sp * tt * .5; a[i * 3 + 1] = tt > 0 && y > top - .02 ? y : -99; }
      g.attributes.position.needsUpdate = true; };
    P.splash = add(pts); }
  P.bubbles = add(S.makeBubbles(60));
  // Harold's book (flies out of his hands when he slips)
  const bookT = canvasTex(256, 180, (x, w, h) => { x.fillStyle = '#7a2a32'; x.fillRect(0, 0, w, h); x.fillStyle = '#d9b860'; x.font = '800 28px Montserrat'; x.textAlign = 'center'; x.fillText('POEMS', w / 2, 100); x.strokeStyle = '#17121c'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); });
  P.book = add(new THREE.Mesh(new THREE.BoxGeometry(.2, .03, .14), [0, 0, 0, 0, 0, 0].map((_, i) => new THREE.MeshLambertMaterial(i === 2 ? { map: bookT } : { color: i === 3 ? 0xf2ecdc : 0x7a2a32 })))); E.ink(P.book, { px: 1.6 });
  // wet trail on the deck where Walter dragged Harold
  P.trail = add(new THREE.Mesh(new THREE.PlaneGeometry(1, .5), new THREE.MeshLambertMaterial({ color: 0x8aa9b2, transparent: true, opacity: .45, depthWrite: false }))); P.trail.rotation.x = -Math.PI / 2;
  // the handshake (two clasped hands) for the across-the-desk shot
  const shakeT = canvasTex(256, 160, (x, w, h) => { x.lineJoin = x.lineCap = 'round'; x.strokeStyle = '#17121c'; x.lineWidth = 9;
    x.fillStyle = '#f2f2ee'; x.beginPath(); x.roundRect(170, 50, 90, 60, 14); x.fill(); x.stroke(); x.fillStyle = '#e8e4dc'; x.beginPath(); x.roundRect(-4, 52, 90, 58, 14); x.fill(); x.stroke();
    x.fillStyle = '#f2dcc4'; x.beginPath(); x.ellipse(150, 82, 46, 34, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#f4e1c8'; x.beginPath(); x.ellipse(108, 80, 46, 32, 0, 0, 7); x.fill(); x.stroke();
    x.lineWidth = 5; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(132 + i * 12, 60); x.lineTo(126 + i * 12, 100); x.stroke(); } });
  P.shake = add(new THREE.Mesh(new THREE.PlaneGeometry(.36, .225), new THREE.MeshBasicMaterial({ map: shakeT, transparent: true, alphaTest: .3, side: THREE.DoubleSide, color: 0xfff0e0 })));
  // the discharge order (live: DISCHARGED stamp, then CANCELLED)
  const docT = live(600, 780, (x, w, h, p) => {
    x.fillStyle = '#f4efe2'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2f5a4a'; x.lineWidth = 8; x.strokeRect(20, 20, w - 40, h - 40);
    x.fillStyle = '#2f5a4a'; x.font = '900 46px Montserrat'; x.textAlign = 'center'; x.fillText('DISCHARGE ORDER', w / 2, 100); x.fillRect(60, 120, w - 120, 5);
    x.textAlign = 'left'; x.fillStyle = '#1e1a16'; x.font = '700 30px Montserrat'; const rows = [['PATIENT', 'WALTER'], ['WARD', 'B · ROOM 12'], ['CONDITION', 'RECOVERED']];
    rows.forEach(([a, b], i) => { x.fillStyle = '#6a6458'; x.font = '700 24px Montserrat'; x.fillText(a, 70, 190 + i * 80); x.fillStyle = '#1e1a16'; x.font = '800 34px Montserrat'; x.fillText(b, 70, 228 + i * 80); x.fillStyle = 'rgba(30,26,22,.3)'; x.fillRect(70, 238 + i * 80, w - 140, 3); });
    x.fillStyle = '#1d2a5a'; x.font = 'italic 600 34px Montserrat'; x.fillText('R. Bennett', 330, 640); x.fillStyle = 'rgba(30,26,22,.4)'; x.fillRect(300, 650, 230, 3); x.fillStyle = '#6a6458'; x.font = '700 20px Montserrat'; x.fillText('CHIEF PSYCHIATRIST', 330, 680);
    const stampIt = (k, txt, col, rot, y) => { if (k <= 0) return; x.save(); x.translate(w / 2, y); x.rotate(rot); const s = 1 + 1.2 * Math.exp(-k * 9); x.scale(s, s); x.globalAlpha = Math.min(1, k * 4) * .9; x.strokeStyle = col; x.lineWidth = 12; x.strokeRect(-215, -62, 430, 124); x.fillStyle = col; x.font = '900 70px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, 4); x.restore(); };
    stampIt(p.a, 'DISCHARGED', '#2f8a4a', -.16, 500); stampIt(p.b, 'CANCELLED', '#c3141c', .14, 470);
  });
  P.doc = add(S.sheet(docT.tex, .42, .546, { glow: .1 }));
  P.stamp = add(new THREE.Group()); { const h = E.cyl(.035, .035, .14, E.mat({ color: 0x6a4228 }), { px: 1.6 }); h.position.y = .17; P.stamp.add(h); const k = E.sph(.05, E.mat({ color: 0x6a4228 }), { px: 1.6 }); k.position.y = .27; P.stamp.add(k); const b = E.box(.16, .07, .1, E.mat({ color: 0x2a2a2a }), { px: 1.6 }); b.position.y = .035; P.stamp.add(b); }
  // a fly (circles the hanged man) + the clothespins are gr.pins
  const flyT = canvasTex(64, 64, (x) => { x.fillStyle = 'rgba(220,235,255,.85)'; x.beginPath(); x.ellipse(22, 20, 14, 9, -.5, 0, 7); x.ellipse(42, 20, 14, 9, .5, 0, 7); x.fill(); x.fillStyle = '#17121c'; x.beginPath(); x.ellipse(32, 34, 9, 13, 0, 0, 7); x.fill(); });
  P.fly = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: flyT, transparent: true }))); P.fly.scale.set(.07, .07, 1);

  // ---------- helpers
  const S0 = [];
  const reset = () => { bloom(); vig(.42); E.fill.intensity = .6; E.fill.color.set(0xfff4e8); E.renderer.toneMappingExposure = 1.0;
    gr.sun.color.set(0xfff2dc); gr.sun.intensity = 2.1; gr.sun.position.set(-14, 22, 14); gr.hemi.intensity = 1.25; gr.setWater(0, []);
    gr.pins.forEach(p => p.visible = false); gr.drips.visible = false; gr.puddle.visible = false;
    of.door.rotation.y = -Math.PI / 2; of.view.material.map = of.views[0];
  };
  const add_ = (t0, set, name, fn, o = {}) => S0.push({ t0, set, name, fn: (lt, T, sh) => { reset(); fn(lt, T, sh); }, ...o });
  const WY = PL.wy;
  // a character standing in the water, chest-deep, bobbing
  const inWater = (c, x, z, T, pose, depth = .3) => { const hc = .634 * c.s.h; c.shadow.visible = false; c.place(x, WY + depth - hc + Math.sin(T * 3.1 + x) * .04, z, 1); c.draw(P0(pose), T); c.billboard(); return c; };
  const extras = (T) => { // background patients on the far side
    const [p2] = H.use('patient2'); const l = gr.loungers[2].position; p2.place(l.x, 0, l.z + .05, 1); p2.draw(P0({ sit: 1, hold: 'book', armR: [.45, .6], armL: [.4, .5], look: [0, .4] }), T); p2.billboard(); };
  const stamp = (k, y0 = .815) => { const d = P.doc.position; P.stamp.visible = true; const down = Math.sin(Math.PI * clamp(k)); P.stamp.position.set(d.x + .02 + (1 - down) * .45, y0 + .02 + (1 - down) * .12, d.z + .02); };

  // =========================================================== 1. THE AFTERNOON (0 – 13.5)
  add_(0, 'grounds', 'establish', (lt, T) => {
    gr.setWater(T, []); extras(T);
    const [n] = H.use('nurse'); const nx = lerp(-3.4, -2.2, seg(lt, 0, 5)); n.place(nx, 0, -4.2, 1); n.draw(P0({ walk: .5, phase: lt * 6, hold: 'clipboard', armR: [.5, .7], mouth: 'smile' }), T); n.billboard();
    move(lt, 5.1, [[1.5, 12.5, 20], [0, 3.5, -6], 40], [[1.2, 3.6, 12.5], [0, 2.6, -4], 40], { ease: eio });
    focusOn([0, 2, -4], .8, 3);
  }, { tr: 'black' });
  // "A patient named Harold was walking along the edge of the swimming pool"
  const haroldX = (t) => lerp(-3.6, .55, clamp(t / 3.2));
  add_(5.0, 'grounds', 'harold-walk', (lt, T) => {
    gr.setWater(T, []); extras(T);
    const [h] = H.use('harold'); const x = haroldX(lt); h.place(x, 0, PL.z1 + .42, 1); h.draw(P0({ walk: .55, phase: x * 4.2, hold: 'book', armR: [.45, .7], armL: [.35, .6], look: [0, .5], mouth: 'smile' }), T); h.billboard();
    move(lt, 3.25, [[x - .2, 1.75, 6.2], [x, .9, PL.z1 + .3], 38], [[x - .1, 1.72, 6.0], [x, .9, PL.z1 + .3], 38], { ease: s => s });
    focusOn([x, 1, PL.z1 + .4], 3, 8);
  }, { tr: 'long', keep: () => ({ h: C.harold.mesh }) });
  // "when he slipped" — the wet floor sign; his feet go; the book flies
  add_(8.2, 'grounds', 'slip', (lt, T) => {
    gr.setWater(T, []);
    const [h] = H.use('harold'); const k = ss(seg(lt, .55, 1.2)), x = .55 + .2 * seg(lt, 0, .7);
    h.place(x, .06 * Math.sin(Math.PI * k) * 2, PL.z1 + .42 - .25 * k, 1); h.mesh.rotation.z = -k * .95; h.mesh.position.x = k * .25;
    h.draw(P0({ walk: .55 * (1 - k), phase: x * 4.2, hold: k > .05 ? null : 'book', armL: [lerp(.35, 2.6, k), .2], armR: [lerp(.45, 2.5, k), .2], eyes: k > .1 ? 'wide' : 'dot', mouth: k > .1 ? 'o' : 'smile', brow: -k }), T); h.billboard();
    const bk = seg(lt, .6, 1.5); P.book.visible = k > .05; P.book.position.set(x + .1 + bk * .5, 1.1 + bk * 1.4 - bk * bk * 1.9, PL.z1 + .5); P.book.rotation.set(bk * 6, bk * 3, bk * 2);
    move(lt, 1.55, [[1.7, 1.25, 4.35], [.75, .85, PL.z1 + .4], 38], [[1.6, 1.2, 4.1], [.75, .85, PL.z1 + .4], 38]);
    focusOn([.8, .8, PL.z1 + .5], 3, 8);
  }, { tr: 'cut', keep: () => ({ h: C.harold.mesh, sign: gr.sign }) });
  // "and fell into the deep end." — the splash; DEEP END painted in the foreground
  add_(9.75, 'grounds', 'splash', (lt, T) => {
    const k = ss(seg(lt, 0, .45)), sx = 1.6, sz = .8;
    gr.setWater(T, lt > .45 ? [[sx, sz, T - lt + .45]] : []);
    if (k < 1) { const [h] = H.use('harold'); h.place(lerp(.85, sx, k), lerp(.3, WY - 1.2, k * k), lerp(PL.z1 + .2, sz, k), 1); h.mesh.rotation.z = -.95 - k * .6; h.mesh.position.x = .25; h.shadow.visible = false; h.draw(P0({ armL: [2.6, .2], armR: [2.5, .2], eyes: 'wide', mouth: 'o' }), T); h.billboard(); }
    else { const [h] = H.use('haroldWet'); inWater(h, sx, sz, T, { armL: [2.5 + .3 * Math.sin(T * 9), .2], armR: [2.5 + .3 * Math.sin(T * 9 + 2), .2], eyes: 'wide', mouth: 'o', shake: .4 }, lerp(-.3, .25, seg(lt, .5, 1.2))); }
    P.splash.visible = lt > .45; P.splash.userData.update(lt - .45, [sx, WY + .02, sz], WY, 1.2);
    move(lt, 2.05, [[2.0, 2.7, 6.1], [1.95, .0, 1.15], 40], [[2.0, 2.55, 5.75], [1.95, .0, 1.15], 40]);
    focusOn([1.8, .1, 1.2], 2, 6);
  }, { tr: 'cut', keep: () => ({ deep: gr.deep }), fx: (lt) => (lt > .45 && lt < .7 ? { sx: noise(lt * 90) * .004, sy: noise(lt * 80) * .004 } : {}) });
  // "Harold couldn't swim." — flailing at the deep end
  add_(11.8, 'grounds', 'cant-swim', (lt, T) => {
    gr.setWater(T, [[1.6, .8, T - lt - 1.5], [1.6, .8, T - lt + .6]]);
    const [h] = H.use('haroldWet'); inWater(h, 1.6, .8, T, { armL: [2.4 + .35 * Math.sin(T * 10), .2], armR: [2.4 + .35 * Math.sin(T * 10 + 2), .2], eyes: 'wide', mouth: 'o', brow: -1, shake: .5 }, .22 + .06 * Math.sin(T * 4));
    P.bubbles.visible = true; P.bubbles.userData.update(T, [1.6, WY - .5, .8], WY, .6, .4);
    const hc = 1.6 * .634 + WY + .22 - 1.6 * .634;
    move(lt, 1.75, [[2.2, 1.45, 3.15], [1.6, WY + .3, .8], 36], [[2.1, 1.38, 2.9], [1.6, WY + .3, .8], 36]);
    focusOn([1.6, WY + .4, .8], 4, 10);
  }, { tr: 'cut' });

  // =========================================================== 2. THE RESCUE (13.5 – 21.8)
  // "Before anyone could react," — across the pool, the nurse turns and drops her clipboard
  add_(13.5, 'grounds', 'react', (lt, T) => {
    gr.setWater(T, [[1.6, .8, T - lt - .4]]);
    const [h] = H.use('haroldWet'); inWater(h, 1.6, .8, T, { armL: [2.4 + .35 * Math.sin(T * 10), .2], armR: [2.4 + .35 * Math.sin(T * 10 + 2), .2], eyes: 'wide', mouth: 'o', shake: .5 }, .18);
    const [n] = H.use('nurse'); n.place(1.0, 0, -3.5, 1); const k = seg(lt, .3, .7); n.draw(P0({ hold: k < .5 ? 'clipboard' : null, armR: [lerp(.5, 2.3, k), .5], armL: [lerp(.3, 2.2, k), .5], eyes: k > .3 ? 'wide' : 'dot', mouth: k > .3 ? 'o' : 'flat', brow: -k }), T); n.billboard();
    move(lt, 1.6, [[2.0, 2.1, 5.2], [1.35, .25, -1.6], 40], [[1.95, 2.05, 4.9], [1.35, .25, -1.6], 40]);
    focusOn([1.3, .8, -1.5], 1.5, 5);
  }, { tr: 'cut', keep: () => ({ n: C.nurse.mesh }) });
  // "another patient, Walter," — on his lounger, he looks up
  add_(15.1, 'grounds', 'walter-looks', (lt, T) => {
    const l = gr.loungers[1].position; const [w] = H.use('walter'); const up = seg(lt, .75, 1.2);
    w.place(l.x, 0, l.z + .05, 1); w.draw(P0({ sit: up < .5 ? 1 : 0, hold: up < .3 ? 'book' : null, armR: [.45, .6], armL: [.4, .5], look: [.6, -.1], eyes: lt > .35 ? 'wide' : 'dot', brow: lt > .35 ? -.6 : 0, mouth: lt > .35 ? 'o' : 'flat' }), T); w.billboard();
    const hd = w.worldOf(300, 330);
    move(lt, 1.25, [[l.x - .5, 1.25, l.z + 2.6], [l.x, hd.y - .15, l.z], 38], [[l.x - .45, 1.25, l.z + 2.4], [l.x, hd.y - .15, l.z], 38]);
    focusOn([l.x, hd.y, l.z], 3, 8);
  }, { tr: 'whip' });
  // "jumped in after him." — the leap, arms forward, into the water
  add_(16.35, 'grounds', 'walter-jumps', (lt, T) => {
    const k = seg(lt, .1, .75), x0 = -.4, x1 = 1.0;
    gr.setWater(T, [[1.6, .8, T - lt - 2.5], ...(k >= 1 ? [[x1, .6, T - lt + .75]] : [])]);
    const [h] = H.use('haroldWet'); inWater(h, 1.6, .8, T, { armL: [2.4 + .35 * Math.sin(T * 10), .2], armR: [2.4 + .35 * Math.sin(T * 10 + 2), .2], eyes: 'wide', mouth: 'o', shake: .5 }, .15);
    if (k < 1) { const [w] = H.use('walter'); const x = lerp(x0, x1, k), y = lerp(0, WY - 1.0, k * k) + Math.sin(Math.PI * k) * .9, z = lerp(PL.z1 + .3, .6, k); w.place(x, y, z, 1); w.shadow.visible = k < .1; w.mesh.rotation.z = -k * 1.2; w.draw(P0({ armL: [2.8, .1], armR: [2.8, .1], eyes: 'wide', mouth: 'grit', brow: .8 }), T); w.billboard(); }
    else { const [w] = H.use('walterWet'); inWater(w, x1, .6, T, { armL: [1.4, .3], armR: [1.6, .3], brow: .8, mouth: 'grit' }, lerp(-.4, .25, seg(lt, .75, 1.3))); }
    P.splash.visible = k >= 1; P.splash.userData.update(lt - .75, [x1, WY + .02, .6], WY, 1.1);
    move(lt, 1.65, [[.75, 2.3, 6.6], [.75, .3, .6], 40], [[.8, 2.25, 6.3], [.85, .25, .6], 40]);
    focusOn([.6, .3, .8], 1.6, 5);
  }, { tr: 'cut', fx: (lt) => (lt > .75 && lt < .95 ? { sx: noise(lt * 90) * .003, sy: noise(lt * 80) * .003 } : {}) });
  // "He pulled Harold out of the water" — swimming him to the side
  add_(18.0, 'grounds', 'rescue-swim', (lt, T) => {
    const u = seg(lt, 0, 1.9), x = lerp(1.3, -1.6, u);
    gr.setWater(T, [[x + .3, .9, T - lt - .2], [x + .2, .9, T - lt + .8]]);
    const [w, h] = H.use('walterWet', 'haroldWet');
    inWater(w, x - .35, .95, T, { armR: [1.35, .2], armL: [1.9 + .4 * Math.sin(T * 6), .3], brow: .7, mouth: 'grit' }, .2);
    inWater(h, x + .2, .85, T, { armL: [.6, .3], armR: [.4, .3], eyes: 'half', mouth: 'wobble', look: [-.4, 0] }, .22);
    move(lt, 1.9, [[x + .6, 1.1, 3.6], [x, WY + .45, .9], 38], [[x + .2, 1.05, 3.4], [x - .1, WY + .45, .9], 38], { ease: s => s });
    focusOn([x, WY + .4, .9], 2.5, 7);
  }, { tr: 'cut' });
  // "and dragged him to safety." — out on the deck, by the collar, leaving a wet trail
  add_(19.9, 'grounds', 'drag', (lt, T) => {
    gr.setWater(T, [[-1.6, .9, T - lt - 1]]);
    const u = seg(lt, 0, 1.9), wx = lerp(-1.2, .9, u), z = PL.z1 + 1.0;
    const [w, h] = H.use('walterWet', 'haroldWet');
    w.place(wx, 0, z, 1); w.draw(P0({ walk: .5, phase: lt * 6, armL: [1.1, .3], armR: [.3, .3], brow: .6, mouth: 'grit', sweat: .6 }), T); w.billboard();
    h.place(wx - .75, -.42, z + .05, 1); h.draw(P0({ sit: 1, armL: [.3, .2], armR: [.2, .2], eyes: 'half', mouth: 'wobble', tilt: .15 }), T); h.billboard();
    P.trail.visible = true; const tx0 = -2.0, tx1 = wx - .75; P.trail.scale.set(Math.max(.01, tx1 - tx0), 1, 1); P.trail.position.set((tx0 + tx1) / 2, .075, z + .05);
    const cx = wx - .38; move(lt, 1.9, [[cx, 1.6, z + 4.3], [cx, .65, z], 40], [[cx, 1.58, z + 4.1], [cx, .65, z], 40], { ease: s => s });
    focusOn([cx, .6, z], 2, 6);
  }, { tr: 'cut', keep: () => ({ w: C.walterWet.mesh, h: C.haroldWet.mesh }) });

  // =========================================================== 3. THE WINDOW AND THE OFFICE (21.8 – 49.9)
  // "Doctor Bennett saw the whole thing from his window." — push in on the second-floor window
  add_(21.8, 'grounds', 'window', (lt, T) => {
    gr.setWater(T, []);
    const dw = gr.docWin; const [b] = H.use('bennett'); b.shadow.visible = false; b.place(dw.x, 3.28, dw.z - .55, 1); b.draw(P0({ armL: [.3, .3], armR: [2.4, .9], eyes: lt > 2.4 ? 'ring' : 'dot', brow: lt > 2.4 ? -.6 : .2, look: [0, .7], mouth: lt > 2.4 ? 'o' : 'flat' }), T); b.billboard();
    move(lt, 4.1, [[dw.x + .8, 2.6, 4.5], [dw.x, dw.y - .1, dw.z], 36], [[dw.x + .4, 3.6, -2.0], [dw.x, dw.y - .05, dw.z], 36], { ease: eio });
    focusOn([dw.x, dw.y, dw.z], 2.5, 7);
  }, { tr: 'long', keep: () => ({}) });
  // "The next morning," — the hospital in early light
  add_(25.9, 'grounds', 'morning', (lt, T) => {
    gr.setWater(T, []); gr.sun.color.set(0xffd8a8); gr.sun.intensity = 1.8; gr.sun.position.set(16, 9, 12); gr.hemi.intensity = 1.0;
    move(lt, 1.15, [[-3.5, 2.4, 9.5], [0, 3.0, -7], 40], [[-3.3, 2.35, 9.1], [0, 3.0, -7], 40]);
    focusOn([0, 3, -7], .8, 3);
  }, { tr: 'long' });
  // "he called Walter into his office." — the door opens, Walter comes in
  add_(27.05, 'office', 'door', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]);
    const k = ss(seg(lt, .1, .8)); of.door.rotation.y = -Math.PI / 2 - k * 1.25;
    const [w] = H.use('walter'); const wz = lerp(1.0, 1.0, 1), wx = lerp(3.5, 2.35, ss(seg(lt, .6, 2.0))); w.place(wx, 0, wz, 1); w.draw(P0({ walk: .4 * (seg(lt, .6, 2.0) < 1 ? 1 : 0), phase: lt * 6, mouth: 'smile', look: [-.6, 0] }), T); w.billboard();
    const [b] = H.use('bennett'); b.place(.45, 0, -1.12, 1); b.draw(P0({ sit: 1, armR: [lerp(.6, 2.5, seg(lt, 1.2, 1.6)), .5], armL: [.6, .6], mouth: 'smile', look: [.6, 0] }), T); b.billboard();
    move(lt, 2.25, [[1.5, 1.6, 4.3], [2.7, 1.05, .8], 40], [[1.6, 1.55, 4.05], [2.7, 1.05, .8], 40]);
    focusOn([2.4, 1.1, .9], 2, 6);
  }, { tr: 'black', keep: () => ({ w: C.walter.mesh }) });
  const docSit = (T, pose) => { const [b] = H.use('bennett'); b.place(.45, 0, -1.12, 1); b.draw(P0({ sit: 1, armL: [.75, .9], armR: [.75, .9], mouth: 'smile', ...pose }), T); b.billboard(); return b; };
  const walSit = (T, pose) => { const c = of.patChair.position; const [w] = H.use('walter'); w.place(c.x, 0, c.z + .08, 1); w.draw(P0({ sit: 1, armL: [.3, .4], armR: [.3, .4], ...pose }), T); w.billboard(); return w; };
  const mcu = (lt, d, c, hd, side = .25, dist = 2.4) => move(lt, d, [[hd.x + side, hd.y - .12, hd.z + dist * 1.06], [hd.x, hd.y - .14, hd.z], 36], [[hd.x + side * .8, hd.y - .12, hd.z + dist], [hd.x, hd.y - .14, hd.z], 36]);
  // "Walter, he said, for years we've tried to help you."
  add_(29.3, 'office', 'doc-1', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]); walSit(T, { mouth: 'smile' });
    const b = docSit(T, { talk: Math.max(0, Math.sin(T * 14)) * .5 * (lt > .3 ? 1 : 0), brow: -.2 }); const hd = b.worldOf(300, 330);
    mcu(lt, 3.9, b, hd, -.3, 2.5); focusOn([hd.x, hd.y, hd.z], 4, 10);
  }, { tr: 'long' });
  // "But yesterday, you risked your own life to save someone else." — two-shot across the desk
  add_(33.2, 'office', 'two-shot', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]);
    docSit(T, { talk: Math.max(0, Math.sin(T * 13)) * .5, look: [-.5, .1] }); walSit(T, { mouth: 'smile', look: [.6, -.2], brow: -.3 });
    move(lt, 4.0, [[2.45, 1.9, 4.75], [-.1, .95, -.3], 40], [[2.3, 1.86, 4.5], [-.1, .95, -.3], 40]);
    focusOn([-.4, 1.0, 0], 2, 6);
  }, { tr: 'cut', keep: () => ({ w: C.walter.mesh, b: C.bennett.mesh }) });
  // "That is not the act of a sick man." — Walter, moved
  add_(37.2, 'office', 'walter-moved', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]); docSit(T, {});
    const w = walSit(T, { mouth: 'wobble', eyes: 'ring', brow: -.8, look: [.5, -.1], sweat: seg(lt, .8, 1.6) }); const hd = w.worldOf(300, 330);
    mcu(lt, 2.4, w, hd, -.7, 2.5); focusOn([hd.x, hd.y, hd.z], 4, 10);
  }, { tr: 'cut' });
  // "I think you're healed. Congratulations, you can go home." — the discharge order gets its stamp
  add_(39.6, 'office', 'stamp-ok', (lt, T) => {
    of.dust.userData.update(T, [0, 1.2, -.5]);
    P.doc.visible = true; P.doc.position.set(.35, .802, -.45); P.doc.rotation.set(-Math.PI / 2, 0, .05);
    const k = seg(lt, 1.45, 1.85); docT.set({ a: lt > 1.65 ? seg(lt, 1.65, 2.2) : 0, b: 0 }); stamp(k);
    const d = fitDist(.42, .55, 36, .35);
    move(lt, 4.1, [[.35, .8 + d * 1.04, -.2], [.35, .8, -.45], 36], [[.35, .8 + d * .96, -.22], [.35, .8, -.45], 36]);
    focusOn([.35, .8, -.45], 2, 6);
  }, { tr: 'cut', keep: () => ({ doc: P.doc }), fx: (lt) => (lt > 1.62 && lt < 1.8 ? { sx: noise(lt * 90) * .003, sy: noise(lt * 80) * .003 } : {}) });
  // "Walter smiled. 'Thank you very much, Doctor.'"
  add_(43.7, 'office', 'walter-smiles', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]); docSit(T, {});
    const w = walSit(T, { mouth: lt > 1.5 ? (Math.sin(T * 13) > 0 ? 'open' : 'smile') : 'smile', eyes: 'dot', look: [.5, -.1], brow: -.2 }); const hd = w.worldOf(300, 330);
    mcu(lt, 2.9, w, hd, -.7, 2.4); focusOn([hd.x, hd.y, hd.z], 4, 10);
  }, { tr: 'cut' });
  // "The doctor shook his hand and asked one last question." — standing across the desk
  add_(46.6, 'office', 'handshake', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]);
    const [b, w] = H.use('bennett', 'walter'); b.place(1.5, 0, -.15, 1); w.place(.72, 0, .4, 1);
    const pump = Math.sin(T * 9) * .06 * (lt < 2.0 ? 1 : 0);
    b.draw(P0({ armL: [1.25 + pump, -.2], armR: [.3, .3], mouth: 'smile', look: [-.6, 0] }), T); w.draw(P0({ armR: [1.2 + pump, -.2], armL: [.3, .3], mouth: 'smile', look: [.6, 0] }), T); b.billboard(); w.billboard();
    const hb = b.worldOf(300 - 205 * Math.sin(1.25), 510 + 205 * Math.cos(1.25)), hw = w.worldOf(300 + 205 * Math.sin(1.2), 510 + 205 * Math.cos(1.2));
    P.shake.visible = true; P.shake.position.copy(hb.clone().lerp(hw, .5)).add(new THREE.Vector3(0, pump * .3, .05)); P.shake.lookAt(E.camera.position);
    move(lt, 3.3, [[.95, 1.55, 3.85], [1.1, 1.15, .1], 40], [[1.0, 1.52, 3.6], [1.1, 1.15, .1], 40]);
    focusOn([1.1, 1.2, .1], 2, 6);
  }, { tr: 'cut', keep: () => ({ w: C.walter.mesh, b: C.bennett.mesh }) });

  // =========================================================== 4. THE QUESTION AND THE ANSWER (49.9 – 68)
  // "By the way, where is Harold, the man you saved?"
  add_(49.9, 'office', 'question', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]);
    const [b] = H.use('bennett'); b.place(1.5, 0, -.15, 1); b.draw(P0({ armL: [.3, .3], armR: [2.3, .9], mouth: lt > .4 && lt < 3.0 ? (Math.sin(T * 13) > 0 ? 'open' : 'smile') : 'smile', look: [-.5, 0], brow: -.3 }), T); b.billboard();
    const hd = b.worldOf(300, 330); mcu(lt, 3.8, b, hd, -.25, 2.5); focusOn([hd.x, hd.y, hd.z], 4, 10);
  }, { tr: 'cut' });
  // "Oh, him? I hung him up on the balcony... To dry." — casual, thumb over his shoulder to the window
  add_(53.7, 'office', 'answer', (lt, T) => {
    of.dust.userData.update(T, [0, 1.5, 0]);
    const [w] = H.use('walter'); w.place(.72, 0, .4, 1);
    const talking = (lt > .3 && lt < .9) || (lt > 1.25 && lt < 2.6) || (lt > 3.3 && lt < 3.7);
    w.draw(P0({ armL: [lerp(.3, 2.2, ss(seg(lt, 1.3, 1.8))), .9], armR: [.3, .3], mouth: talking ? (Math.sin(T * 14) > 0 ? 'open' : 'smile') : 'smile', look: [.4, 0], eyes: 'dot', brow: -.1 }), T); w.billboard();
    const hd = w.worldOf(300, 330); mcu(lt, 3.8, w, hd, .3, 2.6); focusOn([hd.x, hd.y, hd.z], 4, 10);
  }, { tr: 'cut' });
  // the doctor's face, frozen
  add_(57.5, 'office', 'frozen', (lt, T) => {
    const [b] = H.use('bennett'); b.place(1.5, 0, -.15, 1); b.draw(P0({ armL: [.3, .3], armR: [.3, .3], eyes: 'ring', mouth: lt > .35 ? 'o' : 'flat', brow: -.4, look: [-.5, 0], sweat: seg(lt, .3, .7) }), T); b.billboard();
    const hd = b.worldOf(300, 330); move(lt, .95, [[hd.x - .25, hd.y - .12, hd.z + 2.3], [hd.x, hd.y - .12, hd.z], 36], [[hd.x - .22, hd.y - .12, hd.z + 1.95], [hd.x, hd.y - .12, hd.z], 36], { ease: eo });
    focusOn([hd.x, hd.y, hd.z], 4, 10);
  }, { tr: 'cut' });
  // the reveal: from the doctor's window across the facade to the balcony — Harold, pegged on the washing line
  add_(58.45, 'grounds', 'reveal', (lt, T) => {
    gr.setWater(T, []); gr.sun.position.set(-14, 22, 14);
    const L = gr.line; const [h] = H.use('haroldWet'); h.shadow.visible = false;
    const sway = Math.sin(T * 1.6) * .025; h.place(L.x, L.y - .66, L.z + .02, 1); h.g.rotation.z = sway;
    h.draw(P0({ eyes: 'dead', mouth: 'tongue', armL: [.05, .05], armR: [.05, .05], pale: .55, tilt: .16, brow: 0 }), T); h.billboard();
    const sh = [h.worldOf(200, 575), h.worldOf(400, 575)]; gr.pins.forEach((p, i) => { p.visible = true; p.position.set(sh[i].x, L.y - .03, L.z + .07); });
    gr.drips.visible = true; const fy = h.g.position.y + .05; gr.drips.userData.update(T, [L.x - .18, fy + .1, L.z], [L.x + .18, fy + .5, L.z], L.floor + .01); gr.puddle.visible = true;
    const hd = h.worldOf(300, 330); P.fly.visible = true; P.fly.position.set(hd.x + Math.cos(T * 5) * .32, hd.y + .25 + Math.sin(T * 7) * .1, hd.z + .15 + Math.sin(T * 5) * .12);
    const dw = gr.docWin, u = eio(seg(lt, 0, 2.6));
    const A = [dw.x + .2, dw.y - .1, -3.2], B = [L.x, L.y - .55, L.z + 4.2];
    cam(add3(V(A, B, u), drift(lt, .008, 2)), V([dw.x, dw.y, dw.z], [L.x, L.y - .62, L.z], u), 38, 0);
    focusOn(V([dw.x, dw.y, dw.z], [L.x, L.y - .6, L.z], u), 2.5, 7);
  }, { tr: 'cut', keep: () => ({ h: C.haroldWet.mesh }) });
  // the doctor takes it back: CANCELLED over DISCHARGED
  add_(63.6, 'office', 'stamp-cancel', (lt, T) => {
    of.dust.userData.update(T, [0, 1.2, -.5]);
    P.doc.visible = true; P.doc.position.set(.35, .802, -.45); P.doc.rotation.set(-Math.PI / 2, 0, .05);
    const k = seg(lt, .55, .95); docT.set({ a: 1, b: lt > .75 ? seg(lt, .75, 1.3) : 0 }); stamp(k);
    const d = fitDist(.42, .55, 36, .35);
    move(lt, 1.65, [[.35, .8 + d * 1.0, -.21], [.35, .8, -.45], 36], [[.35, .8 + d * .95, -.22], [.35, .8, -.45], 36]);
    focusOn([.35, .8, -.45], 2, 6);
  }, { tr: 'cut', keep: () => ({ doc: P.doc }), fx: (lt) => (lt > .72 && lt < .9 ? { sx: noise(lt * 90) * .003, sy: noise(lt * 80) * .003 } : {}) });
  // last look: Walter still smiling and waving; the doctor staring; the window behind shows the balcony
  add_(65.3, 'office', 'last-look', (lt, T) => {
    of.view.material.map = of.views[1];
    const [b, w] = H.use('bennett', 'walter'); b.place(1.5, 0, -.15, 1); w.place(.72, 0, .4, 1);
    b.draw(P0({ eyes: 'half', mouth: 'flat', brow: .6, armL: [.3, .3], armR: [.3, .3], look: [-.6, 0] }), T); w.draw(P0({ mouth: 'smile', armL: [2.6 + .25 * Math.sin(T * 8), .9], armR: [.3, .3], look: [.2, 0] }), T); b.billboard(); w.billboard();
    move(lt, 2.7, [[1.05, 1.62, 4.5], [1.12, 1.2, -.2], 40], [[1.08, 1.6, 4.25], [1.12, 1.2, -.2], 40]);
    focusOn([1.1, 1.2, .1], 2, 6);
  }, { tr: 'cut', keep: () => ({ w: C.walter.mesh, b: C.bennett.mesh }) });
  return S0;
}
