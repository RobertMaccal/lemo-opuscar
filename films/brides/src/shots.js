// The shot list. Every shot: t0 (global seconds), set, fn(lt, T) that poses the cast, moves the camera and sets focus.
// keep(): props that must stay wholly in frame (checked by window.CHECK). tr: 'dis' | 'long' | 'cut' | 'whip' | 'flash' | 'black'.
export function makeShots(H) {
  const { E, THREE, C, P, SETS, S } = H;
  const { cam, focusOn, lerp, seg, ss, eio, eo, ei, sine, noise, drift, add3, clamp, canvasTex } = E;
  const st = SETS.station.userData, pa = SETS.parlour.userData, of = SETS.office.userData, sg = SETS.stage.userData, co = SETS.court.userData, se = SETS.seaside.userData;
  const V = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  const move = (lt, d, A, B, o = {}) => {
    const u = (o.ease || sine)(clamp(lt / d));
    const p = add3(V(A[0], B[0], u), drift(lt + (o.seed || 0), o.shake ?? .012, o.seed || 1));
    cam(p, V(A[1], B[1], u), lerp(A[2] ?? 40, B[2] ?? 40, u), lerp(A[3] ?? 0, B[3] ?? 0, u));
    return u;
  };
  const bloom = (s = .38, th = .93) => { E.post.bloom.strength = s; E.post.bloom.threshold = th; };
  const expo = v => { E.renderer.toneMappingExposure = v; };
  const vig = v => { E.post.vig.uniforms.amt.value = v; };
  const P0 = o => ({ eyes: 'dot', mouth: 'flat', ...o });

  // ---------- live canvas textures (redrawn only when their progress value changes)
  const live = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; let last = null;
    return { tex: t, set(p) { const k = typeof p === 'number' ? Math.round(p * 400) / 400 : JSON.stringify(p); if (k === last) return; last = k; x.save(); draw(x, w, h, p); x.restore(); t.needsUpdate = true; } }; };
  const paper = (x, w, h, col = '#ede4cc') => { x.fillStyle = col; x.fillRect(0, 0, w, h); const g = x.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,20,.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h); };
  const reveal = (x, p, x0, y0, w, h) => { /* clip helper for handwriting reveal */ x.beginPath(); x.rect(x0, y0, w * clamp(p), h); x.clip(); };
  const add = (o) => { E.scene.add(o); o.visible = false; return o; };
  const lpos = (p, o) => { p.position.set(...o); return p; };

  // ---------- props
  // the grabbing hands + feet (one sprite at the foot end of the tub)
  const grab = live(640, 640, (x, w, h, p) => { x.clearRect(0, 0, w, h); x.lineJoin = x.lineCap = 'round';
    const k = ss(p.grip), pull = p.pull, skin = '#f6e4cf', INK = '#17121c';
    x.translate(0, -pull * 70);
    // two bare feet, soles toward camera, toes up, ankles running down into the water
    for (const sd of [-1, 1]) { const fx = w * .42 + sd * 70, fy = 250;
      x.fillStyle = skin; x.strokeStyle = INK; x.lineWidth = 11;
      x.beginPath(); x.moveTo(fx - 38, fy + 80); x.lineTo(fx - 34, h); x.lineTo(fx + 34, h); x.lineTo(fx + 38, fy + 80); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(fx, fy, 56, 104, sd * .1, 0, 7); x.fill(); x.stroke();
      for (let i = 0; i < 5; i++) { const tx = fx - sd * 36 + sd * i * 17, ty = fy - 96 + Math.abs(i - 1.2) * 7; x.beginPath(); x.arc(tx, ty, 13 - i * 1.4, 0, 7); x.fill(); x.lineWidth = 7; x.stroke(); }
      x.lineWidth = 6; x.strokeStyle = 'rgba(23,18,28,.35)'; x.beginPath(); x.moveTo(fx - 20, fy + 40); x.quadraticCurveTo(fx, fy + 60, fx + 20, fy + 40); x.stroke(); }
    // his hands slide in from the right and close around both ankles
    if (k > 0) { const hx = lerp(w + 260, w * .42, k), hy = 400;
      x.fillStyle = '#3a3f4d'; x.strokeStyle = INK; x.lineWidth = 11;
      for (const dy of [-40, 46]) { x.beginPath(); x.roundRect(hx + 70, hy + dy - 44, 420, 88, 30); x.fill(); x.stroke();
        x.fillStyle = '#e8e2d6'; x.beginPath(); x.roundRect(hx + 58, hy + dy - 48, 40, 96, 10); x.fill(); x.stroke(); x.fillStyle = '#3a3f4d'; }
      for (const dy of [-40, 46]) { x.fillStyle = '#f3e2cc'; x.beginPath(); x.roundRect(hx - 130, hy + dy - 38, 200, 76, 36); x.fill(); x.stroke();
        x.lineWidth = 6; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(hx - 100 + i * 42, hy + dy - 34); x.lineTo(hx - 100 + i * 42, hy + dy + 2); x.stroke(); } x.lineWidth = 11; }
    }
  });
  P.grab = add(new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshBasicMaterial({ map: grab.tex, transparent: true, alphaTest: .4, side: THREE.DoubleSide, color: 0xffe8d0 })));
  // the diver's hand on the rim (for "she went limp")
  const handT = live(256, 256, (x, w, h, a) => { x.clearRect(0, 0, w, h); x.lineJoin = x.lineCap = 'round'; x.translate(w / 2, 40); x.rotate(a); x.fillStyle = '#f6e4cf'; x.strokeStyle = '#17121c'; x.lineWidth = 10;
    x.beginPath(); x.roundRect(-26, -40, 52, 150, 24); x.fill(); x.stroke(); x.beginPath(); x.ellipse(0, 130, 44, 40, 0, 0, 7); x.fill(); x.stroke();
    x.lineWidth = 6; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(i * 16, 150); x.lineTo(i * 18, 176); x.stroke(); } });
  P.hand = add(new THREE.Mesh(new THREE.PlaneGeometry(.3, .3), new THREE.MeshBasicMaterial({ map: handT.tex, transparent: true, alphaTest: .4, side: THREE.DoubleSide, color: 0xffe8d0 })));
  // the newspaper (full sheet)
  const npTex = S.newspaperTex('BRIDE FOUND\nDEAD IN BATH', 'TRAGIC END OF A HONEYMOON IN HIGHGATE', { art: (x, X, Y, W, Hh) => S.tubSketch(x, X, Y, W, Hh) });
  P.paper = add(S.sheet(npTex, .56, .75, { px: 2.4, glow: .14 }));
  const npTex2 = S.newspaperTex('BATH MURDERER\nHANGED', 'GEORGE JOSEPH SMITH · MAIDSTONE · 13 AUGUST 1915', { date: 'LONDON · AUGUST 1915 · ONE PENNY', headCol: '#7a1218' });
  // wedding photographs (Alice + Smith "GEORGE SMITH"; Margaret + Smith "JOHN LLOYD")
  const wed1 = S.frame(S.portraitTex(['alice', 'smith'], { label: 'ALICE & GEORGE SMITH · 1913', w: 520, h: 420, y: .05 }), .52, .42, { col: 0x2e1d12, stand: true, glow: .2 });
  const wed2 = S.frame(S.portraitTex(['margaret', 'smithB'], { label: 'MARGARET & JOHN LLOYD · 1914', w: 520, h: 420, y: .05 }), .52, .42, { col: 0x3a2a1a, stand: true, glow: .2 });
  P.wed1 = add(wed1); P.wed2 = add(wed2);
  // red marker rings around the grooms' faces
  const ringT = canvasTex(256, 256, (x) => { x.strokeStyle = '#ff2b2b'; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 64; i++) { const a = -2.1 + i / 64 * Math.PI * 2.15, r = 104 * (1 + .04 * Math.sin(i * 1.1)); const px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r * 1.08; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); });
  const ring = () => add(new THREE.Mesh(new THREE.PlaneGeometry(.17, .17), new THREE.MeshBasicMaterial({ map: ringT, transparent: true, depthWrite: false, toneMapped: false })));
  P.ring1 = ring(); P.ring2 = ring();
  const strLine = add(new THREE.Mesh(new THREE.PlaneGeometry(1, .008), new THREE.MeshBasicMaterial({ color: 0xff2b2b, toneMapped: false }))); P.str = strLine;
  // the will
  const willT = live(600, 800, (x, w, h, p) => { paper(x, w, h, '#efe6cf'); x.fillStyle = '#1e1812'; x.textAlign = 'center';
    x.font = '900 44px Montserrat'; x.fillText('LAST WILL', w / 2, 90); x.font = '800 30px Montserrat'; x.fillText('AND TESTAMENT', w / 2, 130); x.fillRect(80, 150, w - 160, 4);
    x.textAlign = 'left'; x.font = 'italic 600 30px Montserrat'; x.fillStyle = '#1d2a5a';
    const L = ['I, Bessie Williams,', 'being of sound mind,', 'leave everything', 'I own to my', 'husband,', 'HENRY WILLIAMS.'];
    L.forEach((l, i) => { x.save(); reveal(x, p.write * 6 - i, 70, 190 + i * 62, w, 60); x.fillText(l, 80, 230 + i * 62); x.restore(); });
    x.fillStyle = '#1e1812'; x.font = '700 24px Montserrat'; x.fillText('HERNE BAY · JULY 1912', 80, 650);
    x.strokeStyle = '#1d2a5a'; x.lineWidth = 3; x.beginPath(); x.moveTo(330, 720); x.bezierCurveTo(380, 680, 420, 760, 520, 700); x.stroke();
    if (p.stamp > 0) { x.save(); x.translate(w / 2, 480); x.rotate(-.18); const s = 1 + 1.5 * Math.exp(-p.stamp * 8); x.scale(s, s); x.globalAlpha = Math.min(1, p.stamp * 3); x.strokeStyle = '#c3141c'; x.lineWidth = 10; x.strokeRect(-210, -60, 420, 120); x.fillStyle = '#c3141c'; x.font = '900 52px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('5 DAYS LATER', 0, -12); x.font = '900 34px Montserrat'; x.fillText('DROWNED', 0, 34); x.restore(); }
  });
  P.will = add(S.sheet(willT.tex, .45, .6, { glow: .14 }));
  // insurance policies + banknotes for "the money went to him"
  const policy = (amt, name, col) => S.sheet(canvasTex(400, 520, (x, w, h) => { paper(x, w, h, col); x.fillStyle = '#1e1812'; x.textAlign = 'center'; x.font = '900 30px Montserrat'; x.fillText('LIFE INSURANCE', w / 2, 60); x.fillRect(40, 76, w - 80, 4); x.font = '700 22px Montserrat'; x.fillText(name, w / 2, 120); x.font = '900 92px Montserrat'; x.fillStyle = '#7a1218'; x.fillText(amt, w / 2, 270); x.fillStyle = '#1e1812'; x.font = '700 20px Montserrat'; x.fillText('PAYABLE TO THE HUSBAND', w / 2, 330); x.globalAlpha = .4; for (let i = 0; i < 5; i++) x.fillRect(50, 370 + i * 24, w - 100, 7); }), .3, .39, { glow: .14 });
  P.pol1 = add(policy('£500', 'MRS ALICE SMITH', '#e8dfc6')); P.pol2 = add(policy('£700', 'MRS MARGARET LLOYD', '#e4e2d2'));
  P.will2 = add(S.sheet(willT.tex, .3, .4, { glow: .14 }));
  const noteT = canvasTex(420, 220, (x, w, h) => { x.fillStyle = '#d8e0c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4a5a3a'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#2a3a22'; x.font = '900 60px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('£ 10', w / 2, h / 2); });
  P.notes = add(new THREE.Group()); for (let i = 0; i < 7; i++) { const n = S.sheet(noteT, .26, .14, { px: 1.6, glow: .12 }); P.notes.add(n); }
  // Spilsbury's notebook (handwriting appears)
  const nbT = live(640, 820, (x, w, h, p) => { paper(x, w, h, '#f1ead6'); x.strokeStyle = 'rgba(60,90,160,.35)'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(30, 150 + i * 46); x.lineTo(w - 30, 150 + i * 46); x.stroke(); } x.strokeStyle = 'rgba(200,60,60,.5)'; x.beginPath(); x.moveTo(90, 0); x.lineTo(90, h); x.stroke();
    x.fillStyle = '#1e1812'; x.font = '800 34px Montserrat'; x.fillText('POST-MORTEM NOTES', 110, 90); x.font = '600 22px Montserrat'; x.fillText('B. H. SPILSBURY', 110, 122);
    const rows = [['Bruises', 'NONE'], ['Struggle', 'NONE'], ['Poison', 'NONE'], ['Cause', 'DROWNING']];
    rows.forEach(([a, b], i) => { x.save(); reveal(x, p * 4 - i, 100, 160 + i * 120, w - 120, 110); x.font = 'italic 600 40px Montserrat'; x.fillStyle = '#1d2a5a'; x.fillText(a + ' —', 110, 230 + i * 120); x.fillStyle = i < 3 ? '#b3141c' : '#1d2a5a'; x.font = '900 44px Montserrat'; x.fillText(b, 360, 230 + i * 120); x.restore(); });
  });
  P.notebook = add(S.sheet(nbT.tex, .42, .54, { glow: .14 }));
  // easel drawings: (a) water into nose + throat, (b) the trick (side cutaway of the tub)
  const anatT = live(720, 960, (x, w, h, p) => { paper(x, w, h, '#efe7d2'); x.lineJoin = x.lineCap = 'round';
    x.fillStyle = '#1e1812'; x.font = '900 46px Montserrat'; x.textAlign = 'center'; x.fillText('SUDDEN IMMERSION', w / 2, 80);
    // profile head drawing
    x.save(); x.translate(w * .46, h * .52); x.strokeStyle = '#1e1812'; x.lineWidth = 9; x.fillStyle = '#f3e2cc';
    x.beginPath(); x.moveTo(40, -250); x.bezierCurveTo(190, -250, 220, -80, 190, -40); x.lineTo(230, 10); x.lineTo(196, 30); x.bezierCurveTo(200, 70, 190, 110, 150, 120); x.lineTo(130, 170); x.lineTo(150, 330); x.lineTo(-70, 330); x.bezierCurveTo(-60, 230, -170, 160, -170, -40); x.bezierCurveTo(-170, -200, -80, -250, 40, -250); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#1e1812'; x.beginPath(); x.arc(120, -70, 11, 0, 7); x.fill();
    // airway: nose -> throat -> down
    x.strokeStyle = '#b8b0a0'; x.lineWidth = 26; x.beginPath(); x.moveTo(205, 15); x.quadraticCurveTo(110, 10, 80, 60); x.lineTo(70, 330); x.stroke();
    x.strokeStyle = '#b8b0a0'; x.beginPath(); x.moveTo(170, 95); x.quadraticCurveTo(110, 100, 80, 140); x.stroke();
    // water (blue) flows along the airway with progress p
    const flow = (pts, k) => { x.strokeStyle = '#2f8fd8'; x.lineWidth = 18; x.setLineDash([]); x.beginPath(); const n = Math.max(1, Math.floor(pts.length * clamp(k))); pts.slice(0, n).forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
    const curve = (a, b, c, n = 30) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]]; });
    flow([...curve([300, 15], [110, 10], [80, 60]), ...curve([80, 60], [75, 200], [70, 330])], p * 1.4);
    flow([...curve([260, 95], [110, 100], [80, 140]), ...curve([80, 140], [75, 240], [70, 330])], p * 1.4 - .25);
    // arrows into nose + mouth
    const arrow = (x0, y0, x1, y1, a) => { if (a <= 0) return; x.globalAlpha = Math.min(1, a * 3); x.strokeStyle = '#2f8fd8'; x.lineWidth = 12; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); const an = Math.atan2(y1 - y0, x1 - x0); x.fillStyle = '#2f8fd8'; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x1 - Math.cos(an - .5) * 34, y1 - Math.sin(an - .5) * 34); x.lineTo(x1 - Math.cos(an + .5) * 34, y1 - Math.sin(an + .5) * 34); x.closePath(); x.fill(); x.globalAlpha = 1; };
    arrow(330, 15, 240, 15, p * 2); arrow(310, 95, 210, 95, p * 2 - .2);
    x.restore();
    x.fillStyle = '#1e1812'; x.font = '800 34px Montserrat'; x.textAlign = 'left';
    x.globalAlpha = clamp(p * 3 - .3); x.fillText('NOSE', 520, 400); x.globalAlpha = clamp(p * 3 - .6); x.fillText('THROAT', 470, 560); x.globalAlpha = clamp(p * 2.5 - 1.4);
    x.fillStyle = '#b3141c'; x.font = '900 40px Montserrat'; x.textAlign = 'center'; x.fillText('→ SHOCK · UNCONSCIOUS', w / 2, h - 60); x.globalAlpha = 1;
  });
  const trickT = live(720, 960, (x, w, h, p) => { paper(x, w, h, '#efe7d2'); x.lineJoin = x.lineCap = 'round';
    x.fillStyle = '#1e1812'; x.font = '900 52px Montserrat'; x.textAlign = 'center'; x.fillText('THE METHOD', w / 2, 84);
    // side cutaway of a tub
    const tx = 90, ty = 360, tw2 = 540, th2 = 220;
    x.strokeStyle = '#1e1812'; x.lineWidth = 10; x.fillStyle = '#f7f4ec';
    x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + 40, ty + th2); x.lineTo(tx + tw2 - 20, ty + th2); x.quadraticCurveTo(tx + tw2 + 10, ty + th2 * .5, tx + tw2 + 20, ty); x.stroke();
    x.fillStyle = 'rgba(80,160,190,.55)'; x.beginPath(); x.moveTo(tx + 14, ty + 50); x.lineTo(tx + tw2 + 12, ty + 50); x.lineTo(tx + tw2 - 20, ty + th2 - 6); x.lineTo(tx + 44, ty + th2 - 6); x.closePath(); x.fill();
    // a side-view figure: sitting up against the sloped head end (k=0) → feet yanked up, body slid flat, head under (k=1)
    const k = ss(clamp(p * 1.6 - .25));
    const head = [lerp(tx + 455, tx + 470, k), lerp(ty - 75, ty + th2 - 40, k)];
    const neck = [lerp(tx + 430, tx + 420, k), lerp(ty - 25, ty + th2 - 50, k)];
    const hip = [lerp(tx + 360, tx + 300, k), ty + th2 - 32];
    const knee = [lerp(tx + 230, tx + 170, k), lerp(ty + 5, ty - 40, k)];
    const foot = [lerp(tx + 90, tx + 40, k), lerp(ty + 60, ty - 150, k)];
    x.lineCap = 'round'; x.strokeStyle = '#1e1812';
    x.lineWidth = 46; x.beginPath(); x.moveTo(neck[0], neck[1]); x.lineTo(hip[0], hip[1]); x.stroke();                // torso
    x.strokeStyle = '#2b3550'; x.lineWidth = 32; x.beginPath(); x.moveTo(neck[0], neck[1]); x.lineTo(hip[0], hip[1]); x.stroke();
    x.strokeStyle = '#1e1812'; x.lineWidth = 26; x.beginPath(); x.moveTo(hip[0], hip[1]); x.lineTo(knee[0], knee[1]); x.lineTo(foot[0], foot[1]); x.stroke();   // legs
    x.strokeStyle = '#f3e2cc'; x.lineWidth = 14; x.beginPath(); x.moveTo(hip[0], hip[1]); x.lineTo(knee[0], knee[1]); x.lineTo(foot[0], foot[1]); x.stroke();
    x.fillStyle = '#f3e2cc'; x.strokeStyle = '#1e1812'; x.lineWidth = 8; x.beginPath(); x.ellipse(foot[0] - 6, foot[1] - 8, 26, 14, -1.1 + k * .4, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.arc(head[0], head[1], 44, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#c7333b'; x.beginPath(); x.arc(head[0], head[1], 46, Math.PI * .95, Math.PI * 2.05); x.fill(); x.stroke();   // swim cap
    x.fillStyle = '#1e1812'; x.beginPath(); x.arc(head[0] - 26, head[1] + 4, 5, 0, 7); x.fill();
    if (k > .55) { x.fillStyle = 'rgba(80,160,190,.6)'; x.beginPath(); x.arc(head[0], head[1], 50, 0, 7); x.fill();
      for (let i = 0; i < 4; i++) { x.strokeStyle = '#2f8fd8'; x.lineWidth = 4; x.beginPath(); x.arc(head[0] - 20 + i * 12, head[1] - 70 - i * 18, 6 + i, 0, 7); x.stroke(); } }
    // the pull arrow at the feet
    const a = clamp(p * 3); x.globalAlpha = a; x.strokeStyle = '#b3141c'; x.lineWidth = 14; x.beginPath(); x.moveTo(foot[0] + 40, foot[1] + 10); x.quadraticCurveTo(foot[0] - 20, foot[1] - 60, foot[0] - 60, foot[1] - 130); x.stroke();
    x.fillStyle = '#b3141c'; x.beginPath(); x.moveTo(foot[0] - 60, foot[1] - 160); x.lineTo(foot[0] - 90, foot[1] - 110); x.lineTo(foot[0] - 30, foot[1] - 115); x.closePath(); x.fill();
    x.font = '900 46px Montserrat'; x.fillText('PULL', foot[0] + 95, Math.max(190, foot[1] - 100)); x.globalAlpha = 1;
    x.fillStyle = '#1e1812'; x.font = '800 32px Montserrat'; x.textAlign = 'center';
    const lab = ['NO STRUGGLE', 'NO MARKS', 'ONE SUDDEN PULL']; lab.forEach((l, i) => { x.globalAlpha = clamp((p - .35 - i * .18) * 6); x.fillStyle = i === 2 ? '#b3141c' : '#1e1812'; x.fillText(l, w / 2, 612 + i * 56); }); x.globalAlpha = 1;
  });
  const easelPaper = (lt) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.84, 1.12), new THREE.MeshLambertMaterial({ map: lt.tex, emissive: 0xffffff, emissiveMap: lt.tex, emissiveIntensity: .18 })); E.ink(m, { px: 2.4 }); m.position.set(0, 1.29, .07); m.rotation.x = -.06; st.easel.add(m); m.visible = false; return m; };
  P.anat = easelPaper(anatT); P.trick = easelPaper(trickT);
  // splash droplets (ballistic, from the water surface)
  { const n = 140, g = new THREE.BufferGeometry(), r = E.rng(41), seed = Array.from({ length: n }, () => [r(), r(), r(), r()]);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const tex = canvasTex(64, 64, (x) => { const gr = x.createRadialGradient(28, 26, 2, 32, 32, 28); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, 'rgba(200,240,255,.95)'); gr.addColorStop(1, 'rgba(120,200,230,0)'); x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 28, 0, 7); x.fill(); });
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: tex, size: .05, transparent: true, depthWrite: false, color: 0xd8f6ff })); pts.frustumCulled = false;
    pts.userData.update = (age, o, top) => { const a = g.attributes.position.array;
      for (let i = 0; i < n; i++) { const [s0, s1, s2, s3] = seed[i], ang = s0 * Math.PI * 2, sp = .6 + s1 * 1.6, up = 1.4 + s2 * 2.2, tt = age - s3 * .08;
        const ok = tt > 0; const y = o[1] + up * tt - 4.9 * tt * tt;
        a[i * 3] = o[0] + Math.cos(ang) * sp * tt * .7; a[i * 3 + 2] = o[2] + Math.sin(ang) * sp * tt * .45; a[i * 3 + 1] = ok && y > top - .02 ? y : -99; }
      g.attributes.position.needsUpdate = true; };
    P.splash = add(pts); }
  // bubbles + droplet
  P.bubbles = add(S.makeBubbles(80));
  const dropT = canvasTex(64, 64, (x) => { x.fillStyle = '#dff6ff'; x.beginPath(); x.moveTo(32, 4); x.quadraticCurveTo(58, 44, 32, 60); x.quadraticCurveTo(6, 44, 32, 4); x.fill(); });
  P.drop = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: dropT, transparent: true }))); P.drop.scale.set(.03, .03, 1);
  // red "5'7"" line on the height chart
  P.mark = add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, .02), new THREE.MeshBasicMaterial({ color: 0xff2b2b, toneMapped: false })));
  const markLab = (t) => canvasTex(256, 96, (x, w, h) => { x.fillStyle = '#ff2b2b'; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 16); x.fill(); x.fillStyle = '#fff'; x.font = '900 60px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, w / 2, h / 2 + 3); });
  P.markLab = add(new THREE.Mesh(new THREE.PlaneGeometry(.36, .135), new THREE.MeshBasicMaterial({ map: markLab(`5'7"`), transparent: true, toneMapped: false })));
  P.tapeLab = add(new THREE.Mesh(new THREE.PlaneGeometry(.36, .135), new THREE.MeshBasicMaterial({ map: markLab('5 FT'), transparent: true, toneMapped: false })));
  // name placards on stands (one man, three names)
  const placard = (name, i) => { const g = new THREE.Group(); const post = E.cyl(.02, .02, 1.0, E.mat({ color: 0x2a2018 }), { px: 1.4 }); post.position.y = .5; g.add(post);
    const base = E.cyl(.16, .18, .04, E.mat({ color: 0x2a2018 }), { px: 1.6 }); base.position.y = .02; g.add(base);
    const t = live(420, 150, (x, w, h, on) => { x.fillStyle = on ? '#b3141c' : '#e9e0c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1e1812'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = on ? '#fff' : '#1e1812'; x.font = '900 40px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, w / 2, h / 2 + 2); });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(.62, .22), new THREE.MeshLambertMaterial({ map: t.tex, emissive: 0xffffff, emissiveMap: t.tex, emissiveIntensity: .3 })); card.position.y = 1.1; E.ink(card, { px: 2 }); g.add(card); g.userData.t = t; g.userData.card = card; return add(g); };
  P.names = [placard('HENRY WILLIAMS', 0), placard('GEORGE SMITH', 1), placard('JOHN LLOYD', 2)];
  P.paper2 = add(S.sheet(npTex2, .56, .75, { px: 2.4, glow: .14 }));
  // a chair for the revived diver (station has one), a carried tub for the constables
  P.carryTub = add(S.makeTub({ water: false, outer: 0x2f3a55 }));
  const tagT = (a, b) => canvasTex(300, 170, (x, w, h) => { paper(x, w, h, '#e9dfc3'); x.strokeStyle = '#2a2018'; x.lineWidth = 6; x.strokeRect(4, 4, w - 8, h - 8); x.beginPath(); x.arc(28, h / 2, 10, 0, 7); x.stroke(); x.fillStyle = '#7a1218'; x.font = '900 34px Montserrat'; x.textAlign = 'center'; x.fillText('EVIDENCE', w / 2 + 14, 60); x.fillStyle = '#1e1812'; x.font = '800 30px Montserrat'; x.fillText(a, w / 2 + 14, 104); x.font = '700 26px Montserrat'; x.fillText(b, w / 2 + 14, 142); });
  P.tags = [[st.tubs[1], 'BLACKPOOL', '1913'], [st.tubs[0], 'HERNE BAY', '1912']].map(([tb, a, b]) => { const m = add(new THREE.Mesh(new THREE.PlaneGeometry(.44, .25), new THREE.MeshLambertMaterial({ map: tagT(a, b), emissive: 0xffffff, emissiveMap: tagT(a, b), emissiveIntensity: .15, side: THREE.DoubleSide }))); E.ink(m, { px: 2 });
    m.position.set(tb.position.x + .42, .58, tb.position.z + .4); m.rotation.set(0, -.15, .06); return m; });

  // ---------- shot helpers
  const S0 = [];
  const reset = () => { bloom(); expo(1); vig(.55); E.fill.intensity = 1.2; E.fill.color.set(0xc8d2ff);
    st.lamp.L.intensity = 9; st.lamp.parts.forEach(o => o.visible = true); st.easel.visible = true; st.tub.userData.setWater(0); st.tub.userData.water.visible = true; st.clock.userData.set(0); P.anat.visible = false; P.trick.visible = false;
    for (const b of sg.three) { b.light.intensity = 0; b.light.position.set(b.x, 4.6, 1.4); b.light.target.position.set(b.x, .4, -.3); b.candle.visible = true; b.flame.visible = true; b.tub.visible = true; b.easel.visible = true; }
    sg.row.visible = false; sg.chart.visible = false; sg.tape.visible = false; sg.endless.visible = false; sg.top.intensity = 0; sg.aisle.forEach(L => L.intensity = 0); P.tags.forEach(t => t.visible = false);
    st.tub.visible = true; sg.three.forEach(b => b.tub.position.set(b.x, 0, 0)); P.names.forEach(n => n.visible = false);
    of.pins.hernebay.visible = true; of.pins.hernebay.scale.setScalar(1); of.strings[1].visible = true; of.deskLight.intensity = 14;
  };
  const add_ = (t0, set, name, fn, o = {}) => S0.push({ t0, set, name, fn: (lt, T, sh) => { reset(); fn(lt, T, sh); }, ...o });
  const tubW = st.tub.userData.wy;   // water height in the station tub
  // diver seated in the station tub: k = 0 sitting up … 1 slid under
  const diverIn = (T, k, pose = {}) => { const [d] = H.use('diver'); d.shadow.visible = false; d.place(-.22, lerp(-.17, -.86, k), 0, 1); d.draw(P0({ eyes: 'dot', mouth: 'smile', armL: [.5, .3], armR: [.5, .3], ...pose }), T); d.billboard(); return d; };
  // diver lying flat under the water, face up (top views)
  const diverFlat = (T, depth = .09, pose = {}) => { const [d] = H.use('diver'); d.shadow.visible = false; d.place(.37, tubW - depth, 0, 1, .8); d.g.rotation.set(-Math.PI / 2, 0, Math.PI / 2); d.draw(P0({ eyes: 'closed', mouth: 'flat', armL: [.15, .1], armR: [.15, .1], ...pose }), T); return d; };
  const neilAtFeet = (T, pose = {}, x = 1.12, z = .55) => { const [n] = H.use('neil'); n.place(x, 0, z, 1); n.draw(P0({ eyes: 'dot', brow: .5, armL: [1.25, -.1], armR: [.35, .2], ...pose }), T); n.billboard(); return n; };
  const spilsWatch = (T, pose = {}, x = -1.15, z = -.62) => { const [s] = H.use('spils'); s.place(x, 0, z, 1); s.draw(P0({ hold: 'watch', armR: [.9, .9], eyes: 'dot', brow: .3, ...pose }), T); s.billboard(); return s; };
  const grabAt = (grip, pull = 0, x = .5, y = tubW + .14) => { P.grab.visible = true; grab.set({ grip, pull }); P.grab.position.set(x + pull * .1, y + .1 + pull * .06, .02); P.grab.scale.setScalar(1); P.grab.lookAt(E.camera.position); };
  const fitDist = (w, h, fov, m = .12) => { const t = Math.tan(fov * Math.PI / 360); return Math.max(h / 2 / t, w / 2 / (t * 1080 / 1920)) * (1 + m); };
  const stationAmb = (T) => { st.lamp.L.intensity = 9 * (.94 + .06 * noise(T * 6)); st.dust.userData.update(T, [0, 1.6, .5]); };

  // =========================================================== 1. HOOK (0 – 12)
  // "In 1915," — high wide over the lone tub under the gas lamp; fast drop toward it
  add_(0, 'station', 'hook-wide', (lt, T) => {
    stationAmb(T); diverIn(T, 0, { eyes: 'ring', mouth: 'flat', look: [.6, .1], brow: -.4 });
    neilAtFeet(T, { armL: [.6, .2] }); spilsWatch(T, {});
    move(lt, 1.6, [[4.2, 4.2, 4.5], [.15, .7, .1], 40], [[3.15, 2.4, 3.3], [.2, .75, .12], 40], { ease: eo });
    focusOn([0, .6, 0], 3, 8); vig(.62);
  }, { tr: 'cut', keep: () => ({ tub: st.tub }) });
  // "a detective grabbed" — the inspector's face, low angle, lamp behind
  add_(1.55, 'station', 'neil-face', (lt, T) => {
    stationAmb(T); const n = neilAtFeet(T, { brow: .9, eyes: 'dot', mouth: 'flat', armL: [.7, .2], look: [-.5, .3] }, 1.3, .4);
    const hd = n.worldOf(300, 330);
    move(lt, 1.4, [[hd.x + 1.0, hd.y - .45, hd.z + 2.7], [hd.x, hd.y - .12, hd.z], 36, -.04], [[hd.x + .85, hd.y - .4, hd.z + 2.35], [hd.x, hd.y - .1, hd.z], 35, -.02]);
    focusOn([hd.x, hd.y, hd.z], 6, 14);
  }, { tr: 'whip' });
  // "a woman in a bathtub by her feet" — the foot end: her feet, his hands closing on the ankles
  add_(2.95, 'station', 'feet-grab', (lt, T) => {
    stationAmb(T); diverIn(T, 0, { eyes: 'ring', look: [.8, .3], mouth: 'flat' });
    st.tub.userData.setWater(T, { rip: .2, ripT: 4.2, rx: .6 });
    grabAt(seg(lt, .55, 1.15), 0, .42);
    move(lt, 1.65, [[1.85, 1.55, 2.25], [.05, .72, 0], 38], [[1.65, 1.5, 2.0], [.1, .72, 0], 38]);
    focusOn([.5, .72, 0], 4, 10);
  }, { keep: () => ({ grab: P.grab }) });
  // "and pulled her under." — the yank: she slides, the water closes over her head
  add_(4.6, 'station', 'pull-under', (lt, T) => {
    stationAmb(T); const k = ss(seg(lt, .35, .85));
    diverIn(T, k, { eyes: k > .3 ? 'wide' : 'ring', mouth: k > .2 ? 'o' : 'flat', armL: [lerp(.5, 2.4, k), .2], armR: [lerp(.5, 2.4, k), .2], shake: k > .1 && k < .9 ? .6 : 0 });
    grabAt(1, k);
    st.tub.userData.setWater(T, { rip: 1.6, ripT: 4.6 + .7, rx: -.22, rz: 0 });
    P.bubbles.visible = k > .6; P.bubbles.userData.update(T, [-.22, .25, 0], tubW, seg(lt, .7, 1.2));
    P.splash.visible = lt > .5; P.splash.userData.update(lt - .5, [-.22, tubW + .02, 0], tubW);
    move(lt, 1.6, [[1.75, 1.95, 2.15], [-.15, .6, 0], 40], [[1.6, 2.05, 1.95], [-.15, .55, 0], 40], { shake: .02 + .03 * k });
    focusOn([-.22, .6, 0], 4, 10);
  }, { tr: 'whip', keep: () => ({ tub: st.tub }), fx: (lt) => (lt > .7 && lt < .95 ? { sx: noise(lt * 80) * .004, sy: noise(lt * 70 + 3) * .004 } : {}) });
  // "On purpose." — wide from the corner: the inspector holding her feet, the pathologist timing it
  add_(6.2, 'station', 'on-purpose', (lt, T) => {
    stationAmb(T); diverIn(T, 1, { eyes: 'closed' }); grabAt(1, 1);
    neilAtFeet(T, { brow: .9, armL: [1.3, -.1], armR: [1.2, -.1] }); spilsWatch(T, { look: [.5, .5], eyes: 'ring' });
    st.tub.userData.setWater(T, { rip: 1.1, ripT: 5.3, rx: -.22 });
    P.bubbles.visible = true; P.bubbles.userData.update(T, [-.22, .25, 0], tubW, .7);
    move(lt, 1.3, [[3.35, 3.7, 3.6], [.2, .65, .1], 40], [[3.1, 3.4, 3.3], [.2, .7, .1], 40]);
    focusOn([0, .7, 0], 2, 6);
  }, { tr: 'cut', keep: () => ({ tub: st.tub }) });
  // "Within seconds, she stopped moving." — straight down onto the water: her face under the surface, bubbles thinning
  add_(7.45, 'station', 'still-water', (lt, T) => {
    stationAmb(T); st.lamp.parts.forEach(o => o.visible = false); diverFlat(T, .1);
    const calm = seg(lt, .4, 2.0);
    st.tub.userData.setWater(T, { rip: lerp(.7, .05, calm), ripT: 6.4, rx: -.42, calm });
    P.bubbles.visible = true; P.bubbles.userData.update(T, [-.45, tubW - .1, 0], tubW, lerp(.8, .0, calm), .1);
    const d = fitDist(.9, 1.7, 36, .2);
    move(lt, 2.3, [[0, tubW + d * 1.05, .02], [0, 0, 0], 36, Math.PI / 2], [[0, tubW + d * .95, .02], [0, 0, 0], 36, Math.PI / 2 + .04]);
    focusOn([-.3, tubW, 0], 2, 6);
  }, { tr: 'dis', keep: () => ({ tub: st.tub }) });
  // "And that's how he caught a killer." — the stage: George Joseph Smith in front of the height chart
  add_(9.75, 'stage', 'killer', (lt, T) => {
    sg.chart.visible = true; sg.top.intensity = 26; sg.top.position.set(0, 5, 2.2); sg.top.target.position.set(0, 1, -.6); sg.dust.userData.update(T, [0, 1.6, 0]);
    const [s] = H.use('smith'); s.place(0, 0, -.45, 1); s.draw(P0({ eyes: lt > 1.25 ? 'half' : 'dot', mouth: lt > 1.4 ? 'smile' : 'flat', brow: .6, armL: [.12, .2], armR: [.12, .2] }), T); s.billboard();
    const hd = s.worldOf(300, 330);
    move(lt, 2.3, [[0, 1.2, 4.2], [0, 1.0, -.5], 40], [[0, hd.y, 1.9], [0, hd.y - .12, -.5], 36], { ease: eio });
    focusOn([0, hd.y, -.45], 3, 8); vig(.7);
  }, { tr: 'flash' });

  // =========================================================== 2. THE NEWSPAPER (12 – 30)
  // "It started with a newspaper." — the paper drops onto the rug, whole sheet in frame
  add_(12.05, 'parlour', 'paper-drop', (lt, T) => {
    pa.fireL.intensity = 9 * (.85 + .15 * noise(T * 5)); pa.dust.userData.update(T, [0, 1.2, 0]);
    const k = eo(seg(lt, 0, .55));
    P.paper.visible = true; P.paper.position.set(.2, lerp(.9, .012, k), .9); P.paper.rotation.set(-Math.PI / 2 + (1 - k) * .5, 0, .15 + (1 - k) * .4);
    const d = fitDist(.75, .9, 38, .18);
    move(lt, 1.9, [[.2, d + .1, 1.25], [.2, 0, .9], 38], [[.2, d - .12, 1.12], [.2, 0, .9], 38]);
    focusOn([.2, 0, .9], 2, 6);
  }, { tr: 'black', keep: () => ({ paper: P.paper }) });
  // "A father read about a young bride in London, found dead in her bath." — the father in his armchair, reading
  add_(13.95, 'parlour', 'father-reads', (lt, T) => {
    pa.fireL.intensity = 9 * (.85 + .15 * noise(T * 5)); pa.dust.userData.update(T, [0, 1.2, 0]);
    const ac = pa.armchair.position; const [f] = H.use('father'); f.place(ac.x, .0, ac.z + .1, 1); f.draw(P0({ sit: 1, hold: 'newspaper', armR: [.42, .5], armL: [.42, .5], eyes: 'dot', look: [0, .6], brow: lt > 2.4 ? -.6 : 0 }), T); f.billboard();
    move(lt, 4.0, [[-.2, 1.25, 2.6], [1.25, .95, -.9], 40], [[.15, 1.15, 1.85], [1.3, .98, -.9], 38]);
    focusOn([1.3, 1.0, -.9], 4, 10);
  }, { keep: () => ({ father: C.father.mesh }) });
  // "His own daughter, Alice," — he lowers the paper; his eyes go to the mantel
  add_(17.95, 'parlour', 'father-turns', (lt, T) => {
    pa.fireL.intensity = 9 * (.85 + .15 * noise(T * 5));
    const ac = pa.armchair.position; const [f] = H.use('father'); f.place(ac.x, .0, ac.z + .1, 1);
    const k = ss(seg(lt, .1, .6)); f.draw(P0({ sit: 1, hold: 'newspaper', armR: [.42, .5], armL: [.42, .5], eyes: 'wide', look: [-.9, -.2], brow: -1, mouth: 'wobble', sweat: seg(lt, .6, 1.2), pale: .2 }), T); f.billboard();
    const hd = f.worldOf(300, 330);
    move(lt, 1.6, [[hd.x - .4, hd.y - .05, hd.z + 2.6], [hd.x, hd.y - .22, hd.z], 36], [[hd.x - .35, hd.y - .05, hd.z + 2.3], [hd.x, hd.y - .2, hd.z], 36]);
    focusOn([hd.x, hd.y, hd.z], 6, 14);
  }, { tr: 'cut' });
  // "had died the exact same way." — the photograph of Alice on the mantel, whole frame in shot
  add_(19.55, 'parlour', 'alice-photo', (lt, T) => {
    pa.fireL.intensity = 9 * (.85 + .15 * noise(T * 5)); pa.dust.userData.update(T, [0, 1.2, -1.5]);
    const ph = pa.alicePhoto.position; const d = fitDist(.44, .58, 34, .55);
    move(lt, 1.9, [[ph.x + .25, ph.y + .02, ph.z + d * 1.1], [ph.x, ph.y, ph.z], 34], [[ph.x + .12, ph.y + .01, ph.z + d * .92], [ph.x, ph.y, ph.z], 34]);
    focusOn([ph.x, ph.y, ph.z], 6, 12);
  }, { keep: () => ({ photo: pa.alicePhoto }) });
  // "A new bride, one year earlier." — the stage: one tub, her portrait, 1913
  add_(21.4, 'stage', 'alice-tub', (lt, T) => {
    sg.row.visible = true; const b = sg.three[1]; b.light.intensity = 32; sg.three[0].tub.visible = sg.three[2].tub.visible = false; sg.three[0].easel.visible = sg.three[2].easel.visible = false; sg.three[0].candle.visible = sg.three[2].candle.visible = false;
    b.tub.userData.setWater(T, { calm: .7 }); sg.dust.userData.update(T, [0, 1.4, 0]);
    move(lt, 2.45, [[.0, 1.85, 4.6], [0, .8, -.4], 38], [[.0, 1.75, 4.2], [0, .8, -.4], 38]);
    focusOn([0, .9, -.5], 2.5, 7);
  }, { tr: 'long', keep: () => ({ tub: sg.three[1].tub, easel: sg.three[1].easel }) });
  // "Her husband was George Smith." — the wedding photograph on Neil's desk
  const wedPos = () => { P.wed1.visible = P.wed2.visible = true; P.wed1.position.set(-.35, 2.28, -1.515); P.wed1.rotation.set(0, 0, .015); P.wed2.position.set(-.35, 1.18, -1.515); P.wed2.rotation.set(0, 0, -.02); };
  add_(23.75, 'office', 'wed-smith', (lt, T) => {
    wedPos(); of.dust.userData.update(T, [0, 1.2, 0]);
    const d = fitDist(.62, .52, 34, .3), p = P.wed1.position;
    move(lt, 1.95, [[p.x - .04, p.y - .06, p.z + d * 1.08], [p.x, p.y - .1, p.z], 34], [[p.x, p.y - .06, p.z + d * .97], [p.x, p.y - .1, p.z], 34]);
    focusOn([p.x, p.y, p.z], 5, 12);
  }, { keep: () => ({ photo: P.wed1 }) });
  // "The London bride's husband was John Lloyd." — truck right to the second photograph
  add_(25.7, 'office', 'wed-lloyd', (lt, T) => {
    wedPos(); of.dust.userData.update(T, [0, 1.2, 0]);
    const d = fitDist(.62, .52, 34, .3), p1 = P.wed1.position, p2 = P.wed2.position, u = eio(seg(lt, 0, 1.1));
    const p = V([p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z], u);
    move(lt, 2.5, [[p[0], p[1] - .06, p[2] + d * .97], [p[0], p[1] - .1, p[2]], 34], [[p[0], p[1] - .06, p[2] + d * .93], [p[0], p[1] - .1, p[2]], 34], { ease: s => s });
    focusOn(p, 5, 12);
  }, { tr: 'cut', keep: () => ({ photo: P.wed2 }) });
  // "Different names, same story." — both photographs, red rings round the same face, string between
  add_(28.2, 'office', 'same-face', (lt, T) => {
    wedPos(); of.dust.userData.update(T, [0, 1.2, 0]);
    const groom = (fr) => fr.localToWorld(new THREE.Vector3(.13, .0, .03));
    P.wed1.updateMatrixWorld(); P.wed2.updateMatrixWorld();
    const g1 = groom(P.wed1), g2 = groom(P.wed2), k1 = eo(seg(lt, .15, .4)), k2 = eo(seg(lt, .45, .7)), k3 = eo(seg(lt, .85, 1.3));
    P.ring1.visible = k1 > 0; P.ring1.position.copy(g1); P.ring1.scale.setScalar((.6 + .4 * k1) * 1.25);
    P.ring2.visible = k2 > 0; P.ring2.position.copy(g2); P.ring2.scale.setScalar((.6 + .4 * k2) * 1.25);
    const L = g1.distanceTo(g2) - .23; P.str.visible = k3 > 0; P.str.rotation.z = Math.PI / 2; P.str.scale.x = Math.max(.001, L * k3); P.str.position.set(g1.x, g1.y - .115 - (L * k3) / 2, g1.z + .01);
    const d = fitDist(.64, 1.66, 36, .22);
    move(lt, 1.8, [[-.35, 1.66, -1.515 + d * 1.06], [-.35, 1.66, -1.515], 36], [[-.35, 1.66, -1.515 + d * .98], [-.35, 1.66, -1.515], 36]);
    focusOn([-.35, 1.7, -1.515], 3, 8);
  }, { keep: () => ({ a: P.wed1, b: P.wed2 }) });

  // =========================================================== 3. THE INSPECTOR, THE THIRD BRIDE (30 – 46.5)
  add_(29.95, 'office', 'neil-desk', (lt, T) => {
    of.dust.userData.update(T, [0, 1.2, 0]); wedPos();
    const [n] = H.use('neil'); n.place(.05, 0, -.85, 1); n.draw(P0({ hold: 'paper', armR: [.9, 1.0], armL: [.5, .6], look: [.3, .5], brow: .6 }), T); n.billboard();
    move(lt, 3.2, [[.9, 1.65, 3.1], [.1, 1.15, -.6], 40], [[.7, 1.55, 2.6], [.1, 1.15, -.6], 39]);
    focusOn([-.15, 1.2, -.75], 3, 8);
  }, { tr: 'long', keep: () => ({ neil: C.neil.mesh }) });
  // "and he found a third." — the map: London, Blackpool… and a third pin, Herne Bay
  add_(33.1, 'office', 'map-pin', (lt, T) => {
    of.dust.userData.update(T, [.9, 1.8, -1]); const k = eo(seg(lt, .45, .75));
    of.pins.hernebay.visible = k > 0; of.pins.hernebay.scale.setScalar(lerp(3, 1, k)); of.strings[1].visible = lt > .7;
    const m = of.map.position, d = fitDist(1.2, 1.68, 36, .1);
    move(lt, 1.6, [[m.x + .05, m.y, m.z + d * 1.08], [m.x, m.y, m.z], 36], [[m.x + .02, m.y, m.z + d], [m.x, m.y, m.z], 36]);
    focusOn([m.x, m.y, m.z], 2, 6);
  }, { tr: 'whip', keep: () => ({ map: of.map }) });
  // "Bessie, 1912," — Herne Bay at night, one window lit upstairs
  add_(34.7, 'seaside', 'herne-bay', (lt, T) => {
    se.lightWindow(3, 2); se.sea.material.uniforms.t.value = T;
    move(lt, 2.0, [[-1.2, 1.7, 15.5], [.2, 3.9, -3.3], 40], [[-.6, 1.9, 13.4], [.5, 4.0, -3.3], 39]);
    focusOn([.8, 4.6, -3.3], 1.5, 5);
  }, { tr: 'long' });
  // "drowned in her bath five days after making a will." — the will, whole sheet, stamped
  add_(36.6, 'office', 'will', (lt, T) => {
    of.dust.userData.update(T, [0, 1, 0]); of.deskLight.intensity = 4.5; P.will.visible = true; P.will.position.set(.0, .815, .1); P.will.rotation.set(-Math.PI / 2, 0, .06);
    willT.set({ write: seg(lt, 0, 1.4), stamp: seg(lt, 1.55, 2.6) });
    const d = fitDist(.45, .6, 36, .2);
    move(lt, 2.6, [[.0, .815 + d * 1.08, .3], [.0, .815, .1], 36], [[.0, .815 + d * .98, .27], [.0, .815, .1], 36]);
    focusOn([0, .82, .1], 2, 6);
  }, { tr: 'cut', keep: () => ({ will: P.will }), fx: (lt) => (lt > 1.55 && lt < 1.75 ? { sx: noise(lt * 90) * .003, sy: noise(lt * 80) * .003 } : {}) });
  // "Three brides, three bathtubs," — the stage: three tubs light up one by one with their portraits
  const threeOn = (lt, tOn) => sg.three.forEach((b, i) => { b.light.intensity = 44 * ss(seg(lt, tOn[i], tOn[i] + .12)); b.tub.userData.setWater(lt, { calm: .8 }); });
  add_(39.2, 'stage', 'three-tubs', (lt, T) => {
    sg.row.visible = true; threeOn(lt, [.12, .9, 1.25]); sg.dust.userData.update(T, [0, 1.4, 0]);
    move(lt, 2.65, [[5.9, 2.15, 4.3], [-.3, .75, -.45], 40], [[5.45, 2.0, 3.95], [-.3, .75, -.45], 40]);
    focusOn([0, .9, -.3], 1.2, 4);
  }, { tr: 'cut', keep: () => ({ a: sg.three[0].tub, b: sg.three[1].tub, c: sg.three[2].tub }) });
  // "one man with a different name every time." — Smith between the tubs, the three names light up
  add_(41.85, 'stage', 'one-man', (lt, T) => {
    sg.row.visible = true; threeOn(99, [0, 0, 0]); sg.three.forEach(b => b.light.intensity = 14); sg.dust.userData.update(T, [0, 1.4, 1]);
    sg.top.intensity = 26; sg.top.position.set(0, 5, 3.4); sg.top.target.position.set(0, .8, 1.3);
    const [s] = H.use('smithB'); s.place(-.5, 0, 1.35, 1); s.draw(P0({ eyes: 'half', mouth: 'smile', brow: .5, look: [.6, 0] }), T); s.billboard();
    P.names.forEach((n, i) => { n.visible = true; n.position.set(.26, 0, 1.4 + i * .001); n.userData.card.position.y = 1.72 - i * .3; n.children[0].visible = i === 2; n.children[1].visible = i === 2; if (i === 2) { n.children[0].scale.y = 1.85; n.children[0].position.y = .925; } n.userData.t.set(lt > [.55, 1.05, 1.5][i] ? 1 : 0); n.rotation.y = Math.atan2(E.camera.position.x - .5, E.camera.position.z - 1.4); });
    move(lt, 2.2, [[-.1, 1.35, 5.6], [-.1, 1.05, 1.4], 40], [[-.1, 1.3, 5.2], [-.1, 1.05, 1.4], 40]);
    focusOn([0, 1.1, 1.4], 2, 6);
  }, { keep: () => ({ smith: C.smithB.mesh, n0: P.names[0].userData.card, n2: P.names[2].userData.card }) });
  // "And every time, the money went to him." — Smith at the desk, policies, the will and banknotes in front of him
  add_(44.05, 'office', 'money', (lt, T) => {
    of.dust.userData.update(T, [0, 1.2, 0]);
    const [s] = H.use('smith'); s.place(0, 0, -.72, 1); s.draw(P0({ eyes: 'half', mouth: 'smile', brow: .4, armL: [.9, .8], armR: [.9, .8] }), T); s.billboard();
    const drop = (o, t0, x, z, r) => { const k = eo(seg(lt, t0, t0 + .35)); o.visible = k > 0; o.position.set(x, lerp(1.6, .816, k), z); o.rotation.set(-Math.PI / 2, 0, r + (1 - k) * .8); };
    drop(P.pol1, .1, -.24, .14, .14); drop(P.pol2, .45, .02, .2, -.05); drop(P.will2, .8, .27, .13, -.16);
    P.notes.visible = true; P.notes.children.forEach((n, i) => { const k = eo(seg(lt, 1.15 + i * .08, 1.45 + i * .08)); n.visible = k > 0; n.position.set(-.27 + i * .09, lerp(1.4, .82 + i * .002, k), .36 + (i % 2) * .03); n.rotation.set(-Math.PI / 2, 0, (i - 3) * .15); });
    move(lt, 2.5, [[0, 1.75, 2.75], [0, 1.0, -.25], 40], [[0, 1.7, 2.5], [0, 1.0, -.25], 40]);
    focusOn([0, .9, .1], 2.5, 7);
  }, { tr: 'cut', keep: () => ({ smith: C.smith.mesh, p1: P.pol1, p3: P.will2 }) });

  // =========================================================== 4. THE PROBLEM (46.5 – 58.3)
  add_(46.55, 'office', 'problem', (lt, T) => {
    of.dust.userData.update(T, [0, 1.2, 0]); of.deskLight.intensity = 16;
    const [n] = H.use('neil'); n.place(0, 0, -.75, 1); n.draw(P0({ brow: -.6, eyes: 'dot', look: [0, .6], mouth: 'frown', armL: [.25, .3], armR: [.25, .3] }), T); n.billboard();
    const hd = n.worldOf(300, 330);
    move(lt, 1.3, [[hd.x + .25, hd.y - .2, hd.z + 2.7], [hd.x, hd.y - .12, hd.z], 36], [[hd.x + .2, hd.y - .18, hd.z + 2.4], [hd.x, hd.y - .1, hd.z], 36]);
    focusOn([hd.x, hd.y, hd.z], 5, 12);
  }, { tr: 'whip' });
  // "No bruises. No sign of a struggle." — Spilsbury's notebook, writing appears
  add_(47.8, 'office', 'notebook', (lt, T) => {
    of.dust.userData.update(T, [0, 1, 0]); of.deskLight.intensity = 4.5; P.notebook.visible = true; P.notebook.position.set(0, .815, .1); P.notebook.rotation.set(-Math.PI / 2, 0, -.05);
    nbT.set(clamp(seg(lt, 0, .5) * .25 + seg(lt, 1.25, 1.8) * .25 + seg(lt, 1.9, 2.3) * .25 + seg(lt, 2.3, 2.6) * .25));
    const d = fitDist(.42, .54, 36, .2);
    move(lt, 2.65, [[.0, .815 + d * 1.06, .3], [0, .815, .1], 36], [[.0, .815 + d * .96, .26], [0, .815, .1], 36]);
    focusOn([0, .82, .1], 2, 6);
  }, { tr: 'cut', keep: () => ({ nb: P.notebook }) });
  // "Bessie was five foot seven." — the height chart: Bessie standing, red line at 5'7"
  const chartFt = 2.134 / 7;
  const bessieChart = (T, x = 0) => { sg.chart.visible = true; sg.chart.children[0].scale.set(1, 2.134 / 2.4, 1); sg.chart.children[0].position.set(x, 1.067, -.9);
    const [b] = H.use('bessie'); const sc = (5 + 7 / 12) * chartFt / (.806 * b.s.h); b.place(x, 0, -.62, 1, sc); b.draw(P0({ eyes: 'dot', mouth: 'flat', look: [0, 0], armL: [.1, .2], armR: [.1, .2] }), T); b.billboard(); return b; };
  add_(50.45, 'stage', 'height', (lt, T) => {
    sg.top.intensity = 26; sg.top.position.set(0, 5, 2.4); sg.top.target.position.set(0, 1, -.7); sg.dust.userData.update(T, [0, 1.4, 0]);
    bessieChart(T);
    const y = (5 + 7 / 12) * chartFt, k = eo(seg(lt, .55, .95));
    P.mark.visible = k > 0; P.mark.position.set(0, y, -.4); P.mark.scale.x = k; P.markLab.visible = k > .5; P.markLab.position.set(.38, y + .1, -.38);
    const d = fitDist(1.3, 2.25, 38, .1);
    move(lt, 1.6, [[0, 1.05, -.6 + d * 1.06], [0, 1.05, -.7], 38], [[0, 1.05, -.6 + d], [0, 1.05, -.7], 38]);
    focusOn([0, 1.1, -.6], 2, 6);
  }, { tr: 'cut', keep: () => ({ bessie: C.bessie.mesh, lab: P.markLab }) });
  // "Her bath was only five feet long." — the tub laid beside her, the tape measure: 5 FT
  add_(52.0, 'stage', 'tub-length', (lt, T) => {
    sg.top.intensity = 26; sg.top.position.set(.7, 5, 2.4); sg.top.target.position.set(.7, .6, -.3); sg.dust.userData.update(T, [0, 1.4, 0]);
    bessieChart(T, 0); const y = (5 + 7 / 12) * chartFt; P.mark.visible = true; P.mark.position.set(0, y, -.4); P.mark.scale.x = 1; P.markLab.visible = true; P.markLab.position.set(.38, y + .1, -.38);
    sg.row.visible = true; sg.three.forEach((b, i) => { b.tub.visible = i === 0; b.easel.visible = false; b.candle.visible = false; });
    const tb = sg.three[0].tub; tb.position.set(0, 0, .75); tb.userData.setWater(T, { calm: .8 }); sg.three[0].light.intensity = 22; sg.three[0].light.position.set(0, 4.5, 3); sg.three[0].light.target.position.set(0, .4, .7);
    const k = eo(seg(lt, .35, 1.1)); sg.tape.visible = k > 0; sg.tape.position.set(-.775 + .775 * k, tb.userData.rimY + .05, 1.18); sg.tape.scale.x = k; P.tapeLab.visible = k > .9; P.tapeLab.position.set(0, tb.userData.rimY + .2, 1.2);
    move(lt, 2.2, [[0, 1.75, 5.0], [0, .98, 0], 38], [[0, 1.7, 4.6], [0, .98, 0], 38]);
    focusOn([0, .9, .5], 1.5, 5);
  }, { keep: () => ({ bessie: C.bessie.mesh, tub: sg.three[0].tub, tape: P.tapeLab }), done: () => { } });
  // "So how do you drown a grown woman without leaving a single mark?" — one empty tub, a drop falls, rings
  add_(54.2, 'stage', 'question', (lt, T) => {
    sg.row.visible = true; sg.three.forEach((b, i) => { b.tub.visible = i === 1; b.easel.visible = false; b.candle.visible = false; }); const tb = sg.three[1].tub; tb.position.set(0, 0, 0);
    sg.three[1].light.intensity = 34; sg.dust.userData.update(T, [0, 1.2, 0]);
    const dropT0 = 2.2, k = seg(lt, dropT0, dropT0 + .5);
    P.drop.visible = lt > dropT0 && k < 1; P.drop.position.set(.62, lerp(tb.userData.rimY + .2, tb.userData.wy, k * k), 0);
    tb.userData.setWater(T, { rip: lt > dropT0 + .5 ? .8 : 0, ripT: T - lt + dropT0 + .5, rx: .62, calm: .9 });
    move(lt, 4.1, [[2.3, 2.5, 3.5], [-.15, .45, 0], 40], [[1.75, 1.95, 2.7], [-.12, .45, 0], 40]);
    focusOn([0, .6, 0], 2, 6); vig(.7);
  }, { tr: 'long', keep: () => ({ tub: sg.three[1].tub }) });

  // =========================================================== 5. THE EXPERIMENT (58.3 – 80)
  // "Neil had the bathtubs brought to London" — two constables carry a tub into the station room
  add_(58.35, 'station', 'tubs-arrive', (lt, T) => {
    stationAmb(T); st.tub.visible = false;
    P.tags.forEach(t => t.visible = true);
    st.easel.visible = false; const [a] = H.use('pc1'); a.place(2.38, 0, -1.42, 1); a.draw(P0({ armR: [2.5, .7], armL: [.3, .3], eyes: 'half', mouth: 'flat', sweat: .7 }), T); a.billboard();
    move(lt, 2.05, [[1.8, 1.65, 3.35], [1.8, 1.12, -2.0], 40], [[1.8, 1.6, 3.05], [1.8, 1.12, -2.0], 40]);
    focusOn([1.9, .8, -1.9], 2.5, 7);
  }, { tr: 'black', keep: () => ({}) });
  // "and hired a trained diver." — she stands ready by the tub, towel on her arm
  add_(60.4, 'station', 'diver-arrives', (lt, T) => {
    stationAmb(T); st.tub.visible = true;
    const [d] = H.use('diver'); d.place(.15, 0, 1.15, 1); d.draw(P0({ mouth: 'smile', eyes: 'dot', hold: 'towel', armR: [.35, .4], armL: [.25, .2], brow: .2 }), T); d.billboard();
    neilAtFeet(T, { armL: [.4, .3], armR: [.6, .5], look: [-.5, 0] }, .78, -.45); spilsWatch(T, { look: [.6, 0] }, -.55, -.7);
    move(lt, 1.55, [[.1, 1.5, 4.9], [.1, 1.0, .2], 40], [[.1, 1.45, 4.5], [.1, 1.0, .2], 40]);
    focusOn([.25, 1.0, 1.05], 2.5, 7);
  }, { tr: 'cut', keep: () => ({ d: C.diver.mesh, n: C.neil.mesh, s: C.spils.mesh }) });
  // "She sat in the tub." — sitting in the water, smiling, quite at ease
  add_(61.95, 'station', 'diver-sits', (lt, T) => {
    stationAmb(T); diverIn(T, 0, { mouth: 'smile', eyes: 'dot', armL: [.9, .3], armR: [.9, .3] });
    st.tub.userData.setWater(T, { rip: .4, ripT: T - lt, rx: -.22 });
    move(lt, 1.25, [[1.75, 1.95, 3.5], [-.05, .7, 0], 38], [[1.65, 1.9, 3.3], [-.05, .7, 0], 38]);
    focusOn([-.2, .8, 0], 3, 8);
  }, { tr: 'dis', keep: () => ({ tub: st.tub }) });
  // "Then, without warning, Neil grabbed her feet" — the inspector at the foot end; she smiles, unaware
  add_(63.2, 'station', 'warning', (lt, T) => {
    stationAmb(T); diverIn(T, 0, { mouth: 'smile', eyes: 'dot', look: [-.4, 0] });
    neilAtFeet(T, { armL: [lerp(.5, 1.25, seg(lt, 1.4, 2.1)), -.1], brow: .9 }); spilsWatch(T, { look: [.6, .2] });
    grabAt(seg(lt, 1.7, 2.3));
    move(lt, 2.8, [[3.3, 2.35, 3.45], [.2, .78, .12], 40], [[2.95, 2.1, 3.05], [.22, .78, .12], 40]);
    focusOn([.6, .8, .1], 2.5, 7);
  }, { tr: 'cut', keep: () => ({ tub: st.tub, n: C.neil.mesh }) });
  // "and pulled." — the yank
  add_(65.95, 'station', 'yank', (lt, T) => {
    stationAmb(T); const k = ss(seg(lt, .2, .62));
    diverIn(T, k, { eyes: k > .2 ? 'wide' : 'dot', mouth: k > .15 ? 'o' : 'smile', armL: [lerp(.5, 2.5, k), .2], armR: [lerp(.5, 2.5, k), .2], shake: k > .1 && k < .95 ? .7 : 0 });
    neilAtFeet(T, { armL: [1.25 - .25 * k, -.1], brow: 1, mouth: 'grit' }, 1.22 + .08 * k);
    grabAt(1, k); st.tub.userData.setWater(T, { rip: 1.8, ripT: T - lt + .35, rx: -.22 });
    P.bubbles.visible = k > .6; P.bubbles.userData.update(T, [-.22, .25, 0], tubW, seg(lt, .4, .9));
    P.splash.visible = lt > .36; P.splash.userData.update(lt - .36, [-.22, tubW + .02, 0], tubW);
    move(lt, 1.35, [[3.15, 2.2, 3.25], [.35, .74, .15], 40], [[2.95, 2.2, 3.0], [.3, .7, .15], 40], { shake: .015 + .04 * k });
    focusOn([-.15, .65, 0], 3, 8);
  }, { tr: 'cut', keep: () => ({ tub: st.tub }), fx: (lt) => (lt > .3 && lt < .6 ? { sx: noise(lt * 80) * .005, sy: noise(lt * 70 + 3) * .005 } : {}) });
  // "Her head slid under." — straight down into the water: her face below the surface, bubbles streaming up
  add_(67.3, 'station', 'underwater', (lt, T) => {
    stationAmb(T); st.lamp.parts.forEach(o => o.visible = false); diverFlat(T, .08, { eyes: 'wide', mouth: 'o', shake: .4 });
    st.tub.userData.setWater(T, { rip: 1.0, ripT: T - lt - .2, rx: -.42 });
    P.bubbles.visible = true; P.bubbles.userData.update(T, [-.45, tubW - .1, 0], tubW, 1, .12);
    const d = fitDist(.9, 1.7, 36, .2);
    move(lt, 1.6, [[0, tubW + d * 1.0, .02], [0, 0, 0], 36, Math.PI / 2], [[0, tubW + d * .94, .02], [0, 0, 0], 36, Math.PI / 2 - .05]);
    focusOn([-.3, tubW, 0], 2, 6);
  }, { tr: 'cut', keep: () => ({ tub: st.tub }) });
  // "Water rushed into her nose and throat." — the pathologist's drawing on the easel, water flowing in
  add_(68.85, 'station', 'nose-throat', (lt, T) => {
    stationAmb(T); P.anat.visible = true; anatT.set(seg(lt, .1, 2.1));
    P.anat.updateMatrixWorld(); const c = P.anat.getWorldPosition(new THREE.Vector3()), n = new THREE.Vector3(0, 0, 1).applyQuaternion(P.anat.getWorldQuaternion(new THREE.Quaternion()));
    const d = fitDist(.84, 1.12, 36, .12);
    move(lt, 2.3, [c.clone().addScaledVector(n, d * 1.06).toArray(), c.toArray(), 36], [c.clone().addScaledVector(n, d * .98).toArray(), c.toArray(), 36]);
    focusOn(c.toArray(), 2, 6);
  }, { tr: 'whip', keep: () => ({ paper: P.anat }) });
  // "And she went limp." — her hand slips off the rim; the water settles; silence
  add_(71.15, 'station', 'limp', (lt, T) => {
    stationAmb(T); diverIn(T, 1, { eyes: 'closed' });
    const k = ss(seg(lt, .25, .8));
    P.hand.visible = true; handT.set(lerp(-1.4, -.2, k)); P.hand.position.set(-.12, st.tub.userData.rimY + .02 - k * .12, .4); P.hand.lookAt(E.camera.position);
    st.tub.userData.setWater(T, { rip: .2, ripT: T - lt + .6, rx: -.2, calm: .8 });
    move(lt, 1.5, [[1.25, 1.75, 3.2], [-.05, .62, .1], 38], [[1.15, 1.7, 3.0], [-.05, .62, .1], 38], { ease: s => s });
    focusOn([-.3, .65, .3], 3, 8);
  }, { tr: 'dis', keep: () => ({ tub: st.tub, hand: P.hand }) });
  // "It took over half an hour to bring her back." — the clock races 35 minutes…
  add_(72.65, 'station', 'clock', (lt, T) => {
    stationAmb(T); st.clock.userData.set(lerp(0, 35, ei(seg(lt, .05, 1.2))) + 10);
    const c = st.clock.position, d = fitDist(.66, .66, 36, .7);
    move(lt, 1.3, [[c.x + .1, c.y - .05, c.z + d * 1.1], [c.x, c.y, c.z], 36], [[c.x + .05, c.y - .03, c.z + d], [c.x, c.y, c.z], 36]);
    focusOn([c.x, c.y, c.z], 4, 10);
  }, { tr: 'whip', keep: () => ({ clock: st.clock }) });
  // …and she is sitting up in the chair, wrapped in a towel, alive; Neil wipes his brow
  add_(73.95, 'station', 'revived', (lt, T) => {
    stationAmb(T); const ch = st.chair.position;
    const [d] = H.use('diver'); d.place(ch.x, 0, ch.z + .12, 1); d.draw(P0({ sit: 1, eyes: 'half', mouth: 'wobble', hold: 'towel', armR: [.3, .5], armL: [.3, .3], pale: .35, sweat: .8, shake: .2 }), T); d.billboard();
    const [n] = H.use('neil'); n.place(ch.x + .72, 0, ch.z - .35, 1); n.draw(P0({ eyes: 'closed', mouth: 'flat', armR: [2.6, .6], brow: -.7, sweat: 1 }), T); n.billboard();
    move(lt, 1.35, [[ch.x + .36, 1.4, ch.z + 4.1], [ch.x + .36, .92, ch.z], 40], [[ch.x + .36, 1.38, ch.z + 3.85], [ch.x + .36, .92, ch.z], 40]);
    focusOn([ch.x + .3, .9, ch.z], 2.5, 7);
  }, { tr: 'cut', keep: () => ({ d: C.diver.mesh, n: C.neil.mesh }) });
  // "That was the trick. No struggle. No marks. Just one sudden pull." — the method, drawn on the easel
  add_(75.3, 'station', 'trick', (lt, T) => {
    stationAmb(T); P.trick.visible = true; trickT.set(seg(lt, .1, 4.4));
    P.trick.updateMatrixWorld(); const c = P.trick.getWorldPosition(new THREE.Vector3()), n = new THREE.Vector3(0, 0, 1).applyQuaternion(P.trick.getWorldQuaternion(new THREE.Quaternion()));
    const d = fitDist(.84, 1.12, 36, .16), aim = c.clone().add(new THREE.Vector3(0, -.08, 0));
    move(lt, 4.75, [c.clone().addScaledVector(n, d * 1.12).add(new THREE.Vector3(0, -.08, 0)).toArray(), aim.toArray(), 36], [c.clone().addScaledVector(n, d * .98).add(new THREE.Vector3(0, -.08, 0)).toArray(), aim.toArray(), 36]);
    focusOn(c.toArray(), 2, 6);
  }, { tr: 'long', keep: () => ({ paper: P.trick }) });

  // =========================================================== 6. VERDICT AND THE QUESTION (80 – 94.6)
  const jurors = () => { const ks = ['juror1', 'juror2', 'juror3', 'j0', 'j1', 'j2']; const jb = co.jury.position;
    return ks.map((k, i) => { const row = i < 3 ? 0 : 1, col = i % 3; const [c] = H.use(k); c.place(jb.x + (row ? -.2 : .42), row ? .62 : 0, jb.z - .55 + col * .55 + (row ? .27 : 0), 1, .9); c.shadow.visible = false; return c; }); };
  add_(80.05, 'court', 'jury', (lt, T) => {
    co.dust.userData.update(T, [-2, 2, 0]); co.dockL.intensity = 0;
    jurors().forEach((c, i) => { c.draw(P0({ eyes: i % 4 === 0 ? 'half' : 'dot', brow: .4, mouth: i % 3 ? 'flat' : 'frown', look: [.6, 0] }), T + i); c.billboard(); });
    co.clock.userData.set(lerp(10, 30, ss(seg(lt, .7, 1.5))));
    move(lt, 2.1, [[1.8, 1.5, .6], [-3.5, 1.02, .05], 40], [[1.45, 1.48, .55], [-3.5, 1.02, .05], 40]);
    focusOn([-3.4, 1.3, .1], 1.5, 5);
  }, { tr: 'black', keep: () => ({ clock: co.clock }) });
  add_(82.15, 'court', 'dock', (lt, T) => {
    co.dust.userData.update(T, [2, 2, 0]);
    const dk = co.dock.position; const [s] = H.use('smith'); s.place(dk.x + .37, .5, dk.z + .2, 1); s.draw(P0({ eyes: lt > 1.0 ? 'ring' : 'half', mouth: lt > 1.1 ? 'flat' : 'smile', brow: lt > 1.0 ? -.5 : .5, look: [0, -.2] }), T); s.billboard();
    const [j] = H.use('judge'); j.place(0, .5, -3.0, 1); j.draw(P0({ eyes: 'dot', brow: .8, mouth: 'frown' }), T); j.billboard();
    const hd = s.worldOf(300, 330);
    co.dockL.intensity = 26; move(lt, 2.15, [[dk.x - 1.6, 1.75, dk.z + 3.0], [dk.x, 1.3, dk.z], 40], [[dk.x - 1.3, 1.7, dk.z + 2.45], [dk.x, 1.32, dk.z], 40]);
    focusOn([dk.x, hd.y, dk.z], 2, 6);
  }, { tr: 'cut', keep: () => ({ smith: C.smith.mesh }) });
  // "But three women died before anyone noticed." — the three tubs, the candles go out one by one
  add_(84.3, 'stage', 'candles', (lt, T) => {
    sg.row.visible = true; sg.dust.userData.update(T, [0, 1.4, 0]);
    sg.three.forEach((b, i) => { const off = lt > [1.2, 1.75, 2.3][i]; b.light.intensity = off ? 5 : 42; b.flame.visible = !off; b.candle.children[2].visible = !off; b.tub.userData.setWater(T, { calm: .9 }); });
    move(lt, 3.3, [[-5.2, 1.95, 3.6], [.2, .8, -.45], 40], [[-4.7, 1.8, 3.2], [.2, .8, -.45], 40]);
    focusOn([0, .9, -.3], 1.2, 4);
  }, { tr: 'long', keep: () => ({ a: sg.three[0].tub, b: sg.three[1].tub, c: sg.three[2].tub }) });
  // "If one father hadn't read one newspaper," — the father in his chair again, the paper in his lap
  add_(87.6, 'parlour', 'father-again', (lt, T) => {
    pa.fireL.intensity = 7 * (.85 + .15 * noise(T * 5)); pa.lampL.intensity = 5;
    const ac = pa.armchair.position; const [f] = H.use('father'); f.place(ac.x, 0, ac.z + .1, 1); f.draw(P0({ sit: 1, hold: 'newspaper', armR: [.42, .5], armL: [.42, .5], eyes: 'dot', look: [-.9, -.3], brow: -.8, mouth: 'frown' }), T); f.billboard();
    move(lt, 2.75, [[3.35, 1.75, 2.0], [.45, 1.18, -1.6], 42], [[3.25, 1.7, 1.75], [.45, 1.18, -1.6], 42]);
    focusOn([1.2, 1.0, -.9], 2, 6);
  }, { tr: 'long', keep: () => ({ father: C.father.mesh, photo: pa.alicePhoto }) });
  // "how many more brides would there have been?" — an endless row of tubs and veils, into the dark
  add_(90.35, 'stage', 'endless', (lt, T) => {
    sg.endless.visible = true; sg.top.intensity = 40; sg.aisle.forEach((L, i) => L.intensity = 22); sg.top.position.set(0, 7, 1); sg.top.target.position.set(0, 0, -8); sg.dust.userData.update(T, [0, 1.4, -4 - lt]);
    sg.endless.children.forEach(c => { if (c.userData.setWater) c.userData.setWater(T, { calm: .9 }); });
    move(lt, 4.3, [[0, 1.5, 3.0], [0, .7, -10], 42], [[0, 1.1, -3.2], [0, .6, -16], 40], { ease: s => s });
    focusOn([0, .6, -8], .6, 3); vig(.75);
  }, { tr: 'long' });
  return S0;
}
