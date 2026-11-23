// The Reels cover: one still from the film's own station set — the still bath, a bridal veil floating on the water,
// the husband behind it — plus title type. Key elements stay inside the 4:5 feed crop (y 285–1635) and 3:4 grid crop (y 240–1680).
export function makeThumb(H) {
  const { E, THREE, C, SETS } = H;
  const st = SETS.station.userData;
  const veilT = E.canvasTex(512, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.translate(w / 2, h / 2); x.rotate(-.5);
    const g = x.createRadialGradient(0, -40, 10, 0, 0, 230); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(240,245,250,.35)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, -200); x.bezierCurveTo(170, -170, 220, 60, 150, 210); x.quadraticCurveTo(0, 240, -150, 210); x.bezierCurveTo(-220, 60, -170, -170, 0, -200); x.fill();
    x.strokeStyle = 'rgba(30,25,35,.55)'; x.lineWidth = 6; x.stroke();
    x.strokeStyle = 'rgba(160,170,190,.5)'; x.lineWidth = 3; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(i * 30, -170); x.quadraticCurveTo(i * 45, 20, i * 50, 200); x.stroke(); }
    x.fillStyle = '#f5f0e2'; x.strokeStyle = '#17121c'; x.lineWidth = 3; for (let i = -4; i <= 4; i++) { x.beginPath(); x.arc(i * 22, -186 + Math.abs(i) * 3, 9, 0, 7); x.fill(); x.stroke(); }
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshBasicMaterial({ map: veilT, transparent: true, depthWrite: false, color: 0xd8e4e8 }));
  veil.rotation.set(-Math.PI / 2, 0, .35); veil.renderOrder = 6; veil.visible = false; H.scene.add(veil);
  const VP = new THREE.Vector3(-.12, st.tub.userData.wy + .006, -.1); let vPx = [0, 0], vR = 80;

  const shot = {
    t0: 0, set: 'station', name: 'cover', tr: 'cut',
    fn: (lt, T) => {
      st.lamp.L.intensity = 9; st.lamp.parts.forEach(o => o.visible = true); st.tub.visible = true; st.clock.userData.set(17);
      st.tub.userData.setWater(T, { rip: .35, ripT: T - 1.2, rx: -.1, rz: .02, calm: .6 });
      veil.visible = true; veil.position.copy(VP);
      const [s] = H.use('smith'); s.place(-.3, 0, -.78, 1); s.draw({ eyes: 'half', mouth: 'smile', brow: .7, look: [.15, .1], armL: [.15, .2], armR: [.15, .2], rim: ['#ffc27a', -1, .6], blink: 0 }, 2.0); s.billboard();
      const q = new URLSearchParams(location.search), CP = (q.get('cp') || '1.55,2.4,3.3').split(',').map(Number), CT = (q.get('ct') || '-.2,.9,-.45').split(',').map(Number);
      E.cam(CP, CT, +(q.get('fov') || 40), 0);
      E.focusOn([-.3, .9, -.4], 1.6, 5);
      E.post.bloom.strength = .38; E.post.bloom.threshold = .93; E.post.vig.uniforms.amt.value = .68;
      st.dust.userData.update(T, [0, 1.6, .5]);
      const v = VP.clone().project(E.camera); vPx = [(v.x * .5 + .5) * 1080, (-v.y * .5 + .5) * 1920];
      const v2 = VP.clone().add(new THREE.Vector3(.31, 0, 0)).project(E.camera); vR = Math.abs(v2.x - v.x) * .5 * 1080;
    },
  };

  function overlay(x) {
    x.clearRect(0, 0, 1080, 1920);
    const F = (wgt, px) => `${wgt} ${px}px Montserrat`;
    const word = (t, cx, cy, px, fill, stroke = 22, ls = 0) => {
      x.font = F(900, px); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.letterSpacing = ls + 'px'; x.lineJoin = 'round'; x.miterLimit = 2;
      x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 30; x.shadowOffsetY = 10; x.strokeStyle = '#0d0a12'; x.lineWidth = stroke; x.strokeText(t, cx, cy); x.restore();
      x.strokeStyle = '#0d0a12'; x.lineWidth = stroke; x.strokeText(t, cx, cy); x.fillStyle = fill; x.fillText(t, cx, cy);
    };
    // red marker ring round the floating veil
    const [wx, wy] = vPx, r = Math.max(90, vR * 1.05);
    x.save(); x.lineCap = 'round';
    const ring = () => { x.beginPath(); for (let i = 0; i <= 64; i++) { const a = -2.2 + i / 64 * Math.PI * 2.12, rr = r * (1 + .05 * Math.sin(i * .9)); const px = wx + Math.cos(a) * rr * 1.05, py = wy + Math.sin(a) * rr * .62; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
    x.strokeStyle = '#0d0a12'; x.lineWidth = 22; ring(); x.strokeStyle = '#ff2a2a'; x.lineWidth = 11; ring(); x.restore();
    // title block
    x.save(); const pill = 'TRUE STORY · 1915'; x.font = F(800, 38); x.letterSpacing = '5px'; const pw = x.measureText(pill).width + 56;
    x.fillStyle = '#d61f26'; x.beginPath(); x.roundRect(540 - pw / 2, 352, pw, 64, 32); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(pill, 540 + 2.5, 385); x.restore();
    word('3 BRIDES.', 540, 548, 136, '#ffffff', 24, 1);
    word('0 MARKS.', 540, 690, 136, '#ff2b2b', 24, 1);
    // bottom label above the Reels caption zone
    x.save(); x.font = F(800, 44); x.letterSpacing = '3px'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const lab = 'HOW DID HE DO IT?', lw = x.measureText(lab).width + 60; x.translate(540, 1510); x.rotate(-.03);
    x.fillStyle = 'rgba(13,10,18,.85)'; x.beginPath(); x.roundRect(-lw / 2, -40, lw, 80, 14); x.fill(); x.strokeStyle = '#ff2b2b'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#ffffff'; x.fillText(lab, 2, 3); x.restore();
  }
  return { shot, overlay };
}
