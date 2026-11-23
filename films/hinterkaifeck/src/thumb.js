// The cover (Reels thumbnail): one still built from the film's own set and cast, plus title type.
// Everything that matters sits inside the 4:5 feed crop (y 285–1635) and the 3:4 grid crop (y 240–1680).
export function makeThumb(H) {
  const { E, THREE, C, P, SETS } = H;
  const ext = SETS.ext.userData;
  // the figure in the window: lit glass with a black head-and-shoulders silhouette
  const sil = E.canvasTex(330, 390, (x, w, h) => {
    const g = x.createRadialGradient(w * .5, h * .42, 10, w * .5, h * .5, w * .8);
    g.addColorStop(0, '#ffe3a0'); g.addColorStop(.45, '#ff9d3c'); g.addColorStop(1, '#a3361a');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.filter = 'blur(5px)'; x.fillStyle = '#07040a';
    x.beginPath(); x.ellipse(w * .5, h * .4, 58, 70, 0, 0, 7); x.fill();                       // head
    x.beginPath(); x.moveTo(w * .5 - 40, h * .55); x.quadraticCurveTo(w * .5, h * .6, w * .5 + 40, h * .55);
    x.quadraticCurveTo(w * .5 + 150, h * .64, w * .5 + 165, h + 20); x.lineTo(w * .5 - 165, h + 20);
    x.quadraticCurveTo(w * .5 - 150, h * .64, w * .5 - 40, h * .55); x.fill();                  // shoulders
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ map: sil, toneMapped: false, color: 0xffffff }));
  win.material.color.setScalar(1.6); win.position.set(-6, 2.8, -4.075); win.rotation.y = Math.PI; win.visible = false; H.scene.add(win);
  const winLight = new THREE.PointLight(0xff9a48, 0, 7, 1.6); winLight.position.set(-6, 2.6, -5.0); H.scene.add(winLight);
  // a trail of prints for the cover: out of the dark, straight up to the house (none coming back)
  const proto = ext.prints.userData.list[0].m, trail = new THREE.Group(); H.scene.add(trail); trail.visible = false;
  { const pts = [[-6.15, -23.8], [-6.45, -19], [-6.1, -13], [-6.35, -8], [-6.2, -4.5]]; let k = 0;
    for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
      for (let d = 0; d < L; d += .62, k++) { const f = d / L, sd = k % 2 ? 1 : -1, m = proto.clone();
        m.position.set(a[0] + (b[0] - a[0]) * f + Math.cos(ang) * .16 * sd, .035, a[1] + (b[1] - a[1]) * f - Math.sin(ang) * .16 * sd); m.rotation.y = ang + Math.PI; trail.add(m); } } }
  const WIN = new THREE.Vector3(-6, 2.8, -4.08);
  let winPx = [0, 0], winR = 0;

  const shot = {
    t0: 0, set: 'ext', name: 'cover', tr: 'cut',
    fn: (lt, T) => {
      H.envExt('night'); H.windows(false);
      win.visible = true; winLight.intensity = 9; trail.visible = true; ext.prints.visible = false;
      const [a] = H.use('andreas');
      const AP = (new URLSearchParams(location.search).get('ap') || '-5.0,0,-20.1').split(',').map(Number);
      a.place(AP[0], AP[1], AP[2], -1); a.tint(0xf6dcc4);
      a.draw({ eyes: 'wide', mouth: 'o', brow: -1, sweat: 1, look: [-.75, -.15], hold: 'lantern', armR: [.6, .35], armL: [.2, .25],
        rim: ['#ffb070', 1, .9], tilt: .05, lean: 0, blink: 0, walk: 0, phase: 0, talk: 0, bob: 0, holdR: null, shake: 0, breath: 0, pale: .15 }, 3.3);
      const qq = new URLSearchParams(location.search), CP = (qq.get('cp') || '-5.32,1.0,-24.6').split(',').map(Number), CT = (qq.get('ct') || '-5.62,2.55,-4').split(',').map(Number);
      E.cam(CP, CT, +(qq.get('fov') || 37), .015);
      a.billboard();
      const hp = a.worldOf(...(a.lampDesign || [400, 650])); ext.spill.position.copy(hp); ext.spill.intensity = 4.5; ext.spill.distance = 4;
      E.focusOn([AP[0], 1.4, AP[2]], 2.2, 7);
      E.post.bloom.strength = .8; E.post.bloom.threshold = .8;
      ext.snow.visible = true; ext.snow.userData.update(T, [-2, 3, -12], .9);
      ext.smoke.userData.update(T, 1);
      // where the window lands on screen (for the red circle)
      const v = WIN.clone().project(E.camera); winPx = [(v.x * .5 + .5) * 1080, (-v.y * .5 + .5) * 1920];
      const v2 = WIN.clone().add(new THREE.Vector3(0, .75, 0)).project(E.camera); winR = Math.abs(v2.y - v.y) * .5 * 1920;
    },
  };

  function overlay(x) {
    x.clearRect(0, 0, 1080, 1920);
    const F = (wgt, px) => `${wgt} ${px}px Montserrat`;
    const word = (t, cx, cy, px, fill, stroke = 22, ls = 0) => {
      x.font = F(900, px); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.letterSpacing = ls + 'px';
      x.lineJoin = 'round'; x.miterLimit = 2;
      x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 30; x.shadowOffsetY = 10;
      x.strokeStyle = '#0d0a12'; x.lineWidth = stroke; x.strokeText(t, cx, cy); x.restore();
      x.strokeStyle = '#0d0a12'; x.lineWidth = stroke; x.strokeText(t, cx, cy);
      x.fillStyle = fill; x.fillText(t, cx, cy);
    };
    // red marker circle round the window, with a short arrow from the title
    const [wx, wy] = winPx, r = Math.max(70, winR * 1.08);
    x.save(); x.lineCap = 'round'; x.strokeStyle = '#0d0a12'; x.lineWidth = 22;
    const ring = () => { x.beginPath(); for (let i = 0; i <= 64; i++) { const a = -2.2 + i / 64 * Math.PI * 2.12, rr = r * (1 + .05 * Math.sin(i * .9)); const px = wx + Math.cos(a) * rr * 1.02, py = wy + Math.sin(a) * rr * 1.08; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
    ring(); x.strokeStyle = '#ff2a2a'; x.lineWidth = 11; ring(); x.restore();
    // title block
    x.save();
    const pill = 'TRUE STORY · 1922';
    x.font = F(800, 38); x.letterSpacing = '5px'; const pw = x.measureText(pill).width + 56;
    x.fillStyle = '#d61f26'; x.beginPath(); x.roundRect(540 - pw / 2, 352, pw, 64, 32); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(pill, 540 + 2.5, 385);
    x.restore();
    word('THE KILLER', 540, 540, 124, '#ffffff', 24, 1);
    word('NEVER LEFT', 540, 680, 136, '#ff2b2b', 26, 1);
    // bottom label (inside the safe area, above the Reels caption zone)
    x.save(); x.font = F(800, 44); x.letterSpacing = '3px'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const lab = 'STILL UNSOLVED', lw = x.measureText(lab).width + 60;
    x.translate(730, 1515); x.rotate(-.035);
    x.fillStyle = 'rgba(13,10,18,.82)'; x.beginPath(); x.roundRect(-lw / 2, -40, lw, 80, 14); x.fill();
    x.strokeStyle = '#ff2b2b'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#ffffff'; x.fillText(lab, 2, 3);
    x.restore();
  }
  return { shot, overlay };
}
