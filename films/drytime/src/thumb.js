// The Reels cover: the office, the doctor frozen, Walter smiling; behind them the window shows the balcony (circled).
// Key elements stay inside the 4:5 feed crop (y 285–1635) and the 3:4 grid crop (y 240–1680).
export function makeThumb(H) {
  const { E, THREE, C, SETS } = H;
  const of = SETS.office.userData;
  const HP = new THREE.Vector3(1.3 + (547 / 840 - .5) * 4.2, 1.75 + (.5 - 211 / 600) * 3.0, -3.6);   // Harold in the window view
  let hPx = [0, 0], hR = 80;
  const shot = { t0: 0, set: 'office', name: 'cover', tr: 'cut', fn: (lt, T) => {
    of.view.material.map = of.views[1]; of.door.rotation.y = -Math.PI / 2;
    const [b, w] = H.use('bennett', 'walter'); b.place(1.62, 0, -.3, 1); w.place(.64, 0, .3, 1);
    b.draw({ eyes: 'ring', mouth: 'o', brow: -.6, sweat: 1, armL: [.3, .3], armR: [.3, .3], look: [-.6, 0], blink: 0 }, 1.0);
    w.draw({ eyes: 'dot', mouth: 'smile', brow: -.1, armL: [2.2, .9], armR: [.3, .3], look: [.3, 0], blink: 0 }, 1.0);
    const q = new URLSearchParams(location.search), CP = (q.get('cp') || '1.12,1.05,4.4').split(',').map(Number), CT = (q.get('ct') || '1.12,1.12,-.4').split(',').map(Number);
    E.cam(CP, CT, +(q.get('fov') || 40), 0); b.billboard(); w.billboard();
    E.focusOn([1.1, 1.3, 0], 1.4, 4); E.post.bloom.strength = .3; E.post.bloom.threshold = .95; E.post.vig.uniforms.amt.value = .5;
    const v = HP.clone().project(E.camera); hPx = [(v.x * .5 + .5) * 1080, (-v.y * .5 + .5) * 1920];
    const v2 = HP.clone().add(new THREE.Vector3(.22, 0, 0)).project(E.camera); hR = Math.abs(v2.x - v.x) * .5 * 1080;
  } };
  function overlay(x) {
    x.clearRect(0, 0, 1080, 1920);
    const F = (wgt, px) => `${wgt} ${px}px Montserrat`;
    const word = (t, cx, cy, px, fill, stroke = 22) => { x.font = F(900, px); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
      x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 30; x.shadowOffsetY = 10; x.strokeStyle = '#0d0a12'; x.lineWidth = stroke; x.strokeText(t, cx, cy); x.restore();
      x.strokeStyle = '#0d0a12'; x.lineWidth = stroke; x.strokeText(t, cx, cy); x.fillStyle = fill; x.fillText(t, cx, cy); };
    const [wx, wy] = hPx, r = Math.max(70, hR * 1.1);
    x.save(); x.lineCap = 'round'; const ring = () => { x.beginPath(); for (let i = 0; i <= 64; i++) { const a = -2.2 + i / 64 * Math.PI * 2.12, rr = r * (1 + .05 * Math.sin(i * .9)); const px = wx + Math.cos(a) * rr, py = wy + Math.sin(a) * rr * 1.2; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
    x.strokeStyle = '#0d0a12'; x.lineWidth = 22; ring(); x.strokeStyle = '#ff2a2a'; x.lineWidth = 11; ring(); x.restore();
    x.save(); const pill = 'PSYCHIATRIC HOSPITAL'; x.font = F(800, 36); x.letterSpacing = '4px'; const pw = x.measureText(pill).width + 56;
    x.fillStyle = '#d61f26'; x.beginPath(); x.roundRect(540 - pw / 2, 1205, pw, 62, 31); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(pill, 542, 1237); x.restore();
    word('HE WAS CURED…', 540, 1380, 112, '#ffffff', 22);
    word('ALMOST.', 540, 1530, 140, '#ff2b2b', 24);
    x.save(); x.font = F(800, 36); x.letterSpacing = '3px'; x.textAlign = 'center'; x.textBaseline = 'middle'; const lab = 'LOOK AT THE BALCONY', lw = x.measureText(lab).width + 50;
    const ly = Math.max(330, wy - r * 1.2 - 60); x.translate(540, ly); x.fillStyle = 'rgba(13,10,18,.85)'; x.beginPath(); x.roundRect(-lw / 2, -34, lw, 68, 12); x.fill(); x.strokeStyle = '#ff2b2b'; x.lineWidth = 5; x.stroke(); x.fillStyle = '#fff'; x.fillText(lab, 2, 3); x.restore();
  }
  return { shot, overlay };
}
