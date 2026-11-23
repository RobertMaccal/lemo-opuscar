// 2D cut-out characters (big round heads, bean bodies, stick limbs, thick ink) drawn on a canvas that stands in the 3D set.
import { THREE, camera, clamp, lerp, noise } from './engine.js';

const CW = 600, CH = 1000;          // design units; the canvas is CW*res × CH*res
const INK = '#17121c', LW = 10;

export const CAST = {
  andreas: { skin: '#f4e7d4', hair: 'farmer', hairCol: '#a7a3a6', body: 'coat', bodyCol: '#5b4636', accent: '#8a6a4a', h: 1.75, stache: true },
  wife: { skin: '#f2e3cf', hair: 'kerchief', hairCol: '#3b2b3e', scarf: '#6d2a35', body: 'dress', bodyCol: '#3c3550', apron: '#cfc6b4', h: 1.5 },
  viktoria: { skin: '#f6e9d8', hair: 'bun', hairCol: '#4a3326', body: 'dress', bodyCol: '#2f5a55', apron: '#e2dccd', h: 1.62 },
  girl: { skin: '#f8ecdc', hair: 'braids', hairCol: '#6b4a2e', ribbon: '#c0333a', body: 'dress', bodyCol: '#b2443d', apron: '#efe6d6', h: 1.12, kid: true },
  josef: { skin: '#fbefe0', hair: 'tuft', hairCol: '#8a6a45', body: 'shirt', bodyCol: '#8fb0c9', h: .78, kid: true, baby: true },
  oldmaid: { skin: '#f3e4d0', hair: 'bonnet', hairCol: '#5a4030', scarf: '#ece6da', body: 'dress', bodyCol: '#4b4f6a', apron: '#d9d2c2', h: 1.55 },
  newmaid: { skin: '#f6e8d6', hair: 'kerchief', hairCol: '#7a5233', scarf: '#5f86a8', body: 'dress', bodyCol: '#6b3f52', apron: '#e4ddce', h: 1.58 },
  neighbor: { skin: '#f1e1cc', hair: 'cap', hairCol: '#3b3a3f', capCol: '#4a4a52', body: 'coat', bodyCol: '#2f3b4f', accent: '#55657d', h: 1.72, stache: false, beard: true },
  neighbor2: { skin: '#f3e5d2', hair: 'hat', hairCol: '#2c2a2e', capCol: '#3a2f2a', body: 'coat', bodyCol: '#4d3b2e', accent: '#6a5240', h: 1.7, stache: true },
  neighbor3: { skin: '#f0e0ca', hair: 'cap', hairCol: '#6b5a48', capCol: '#5a4a3a', body: 'vest', bodyCol: '#56473a', shirt: '#d8d0c0', h: 1.66 },
  worker: { skin: '#f0dfc8', hair: 'cap', hairCol: '#4a3a2a', capCol: '#5d6a73', body: 'vest', bodyCol: '#4a5560', shirt: '#cfc7b6', h: 1.7 },
};

const DEF = { look: [0, 0], blink: 0, eyes: 'dot', mouth: 'flat', talk: 0, brow: 0, sweat: 0, tilt: 0, lean: 0, bob: 0,
  armL: [0.25, 0.25], armR: [0.25, 0.25], walk: 0, phase: 0, hold: null, holdR: null, rim: null, shake: 0, breath: 0, pale: 0 };

export class Char {
  constructor(spec, res = 1.6) {
    this.s = typeof spec === 'string' ? CAST[spec] : spec;
    this.res = res;
    this.cv = document.createElement('canvas'); this.cv.width = CW * res; this.cv.height = CH * res;
    this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const h = this.s.h, w = h * CW / CH;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, alphaTest: .45, side: THREE.DoubleSide, color: 0xffffff });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.mesh.position.y = h / 2; this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: .45 });
    this.g = new THREE.Group(); this.g.add(this.mesh);
    this.face = 1; this.hand = new THREE.Vector3();
  }
  // world position of a point given in canvas design coords
  local(px, py) { const h = this.s.h, w = h * CW / CH; return new THREE.Vector3((px / CW - .5) * w * this.face * this.g.scale.x, (1 - py / CH) * h * this.g.scale.y, 0); }
  worldOf(px, py) { const h = this.s.h, w = h * CW / CH; const v = new THREE.Vector3(((this.face < 0 ? CW - px : px) / CW - .5) * w, (1 - py / CH) * h - h / 2, .05); this.mesh.updateMatrixWorld(); return this.mesh.localToWorld(v); }
  tint(hex) { this.mat.color.set(hex); return this; }
  // head centre height (fraction of h) for seating characters at a given head height
  headFrac() { return this.s.baby ? .567 : this.s.kid ? .618 : .652; }
  seat(x, headY, z, face = 1) { return this.place(x, headY - this.headFrac() * this.s.h, z, face); }
  place(x, y, z, face = 1, scale = 1) { this.g.position.set(x, y, z); this.face = face; this.g.scale.set(scale, scale, scale); return this; }
  billboard(amt = 1) {
    const dx = camera.position.x - this.g.position.x, dz = camera.position.z - this.g.position.z;
    this.g.rotation.y = Math.atan2(dx, dz) * amt + (this.baseRot || 0) * (1 - amt);
  }
  draw(pose, t = 0) {
    const p = { ...DEF, ...pose }, s = this.s, x = this.ctx, r = this.res;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.cv.width, this.cv.height);
    x.setTransform(r * this.face, 0, 0, r, this.face < 0 ? this.cv.width : 0, 0);
    x.lineJoin = x.lineCap = 'round';
    const br = Math.sin(t * 2.1) * 4 * (1 + p.breath);               // breathing
    const sh = p.shake ? [noise(t * 31) * p.shake * 6, noise(t * 29 + 5) * p.shake * 4] : [0, 0];
    const kid = s.kid, baby = s.baby;
    // proportions
    const feetY = 975, hipY = baby ? 820 : kid ? 760 : 740, torsoTop = baby ? 560 : kid ? 500 : 455;
    const headR = baby ? 205 : kid ? 190 : 172, headCY = torsoTop - headR * .62 + br * .5 + p.bob;
    const cx = 300;
    // ---- legs (walk cycle)
    const wk = p.walk, ph = p.phase;
    const legs = [[-38, Math.sin(ph) * 60 * wk, Math.max(0, Math.cos(ph)) * 22 * wk], [38, Math.sin(ph + Math.PI) * 60 * wk, Math.max(0, Math.cos(ph + Math.PI)) * 22 * wk]];
    x.strokeStyle = INK; x.lineWidth = 12;
    for (const [lx, sw, lift] of legs) {
      if (s.body === 'dress' && !kid) { /* legs short under dress */ }
      x.beginPath(); x.moveTo(cx + lx * .8, hipY - 10); x.quadraticCurveTo(cx + lx + sw * .3, (hipY + feetY) / 2, cx + lx + sw, feetY - lift - 18); x.stroke();
      // shoe
      x.fillStyle = '#2a2124'; x.beginPath(); x.ellipse(cx + lx + sw + (lx > 0 ? 12 : -12), feetY - lift - 10, 30, 15, 0, 0, Math.PI * 2); x.fill(); x.lineWidth = 7; x.stroke(); x.lineWidth = 12;
    }
    x.save(); x.translate(cx + sh[0], hipY + sh[1]); x.rotate(p.lean); x.translate(-cx, -hipY);
    // ---- torso
    const tw = baby ? 120 : kid ? 118 : 112, tb = hipY + (s.body === 'dress' ? 45 : 25);
    const bodyPath = () => {
      x.beginPath();
      if (s.body === 'dress') {
        x.moveTo(cx - tw * .78, torsoTop + 30);
        x.bezierCurveTo(cx - tw * .9, torsoTop - 10, cx + tw * .9, torsoTop - 10, cx + tw * .78, torsoTop + 30);
        x.bezierCurveTo(cx + tw * 1.05, tb - 120, cx + tw * 1.25, tb - 20, cx + tw * 1.18, tb);
        x.quadraticCurveTo(cx, tb + 22, cx - tw * 1.18, tb);
        x.bezierCurveTo(cx - tw * 1.25, tb - 20, cx - tw * 1.05, tb - 120, cx - tw * .78, torsoTop + 30);
      } else {
        x.moveTo(cx - tw * .82, torsoTop + 40);
        x.bezierCurveTo(cx - tw * .9, torsoTop - 12, cx + tw * .9, torsoTop - 12, cx + tw * .82, torsoTop + 40);
        x.bezierCurveTo(cx + tw * 1.08, torsoTop + 140, cx + tw * 1.12, tb - 40, cx + tw * .9, tb - 6);
        x.quadraticCurveTo(cx, tb + 24, cx - tw * .9, tb - 6);
        x.bezierCurveTo(cx - tw * 1.12, tb - 40, cx - tw * 1.08, torsoTop + 140, cx - tw * .82, torsoTop + 40);
      }
      x.closePath();
    };
    const rimSide = p.rim ? p.rim[1] : 1;
    const shade = (base, y0, y1) => { const g = x.createLinearGradient(cx - tw * rimSide, y0, cx + tw * rimSide, y1); g.addColorStop(0, shadeCol(base, -.28)); g.addColorStop(.55, base); g.addColorStop(1, shadeCol(base, .12)); return g; };
    bodyPath(); x.fillStyle = shade(s.bodyCol, torsoTop, tb); x.fill();
    x.save(); bodyPath(); x.clip();
    if (s.apron) { x.fillStyle = s.apron; x.beginPath(); x.moveTo(cx - tw * .55, hipY - 70); x.lineTo(cx + tw * .55, hipY - 70); x.lineTo(cx + tw * .75, tb + 10); x.lineTo(cx - tw * .75, tb + 10); x.closePath(); x.fill(); x.strokeStyle = INK; x.lineWidth = 6; x.stroke();
      x.fillStyle = shadeCol(s.apron, -.15); x.fillRect(cx - tw * .9, hipY - 82, tw * 1.8, 16); }
    if (s.body === 'coat') {
      x.fillStyle = shadeCol(s.bodyCol, -.18); x.beginPath(); x.moveTo(cx - 34, torsoTop + 8); x.lineTo(cx, torsoTop + 120); x.lineTo(cx + 34, torsoTop + 8); x.closePath(); x.fillStyle = '#d9d1c2'; x.fill();
      x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - 34, torsoTop + 8); x.lineTo(cx, torsoTop + 120); x.lineTo(cx + 34, torsoTop + 8); x.stroke();
      x.beginPath(); x.moveTo(cx, torsoTop + 120); x.lineTo(cx, tb); x.stroke();
      x.fillStyle = s.accent || '#222'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(cx + 18, torsoTop + 150 + i * 60, 8, 0, 7); x.fill(); x.stroke(); }
    }
    if (s.body === 'vest') {
      x.fillStyle = s.shirt; x.fillRect(cx - 40, torsoTop - 20, 80, tb - torsoTop + 20);
      x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(cx - 40, torsoTop - 20, 80, tb - torsoTop + 20);
    }
    if (s.body === 'shirt') { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 30, torsoTop + 10); x.quadraticCurveTo(cx, torsoTop + 40, cx + 30, torsoTop + 10); x.stroke(); }
    x.restore();
    // rim on body
    if (p.rim) { x.save(); bodyPath(); x.clip(); x.strokeStyle = p.rim[0]; x.globalAlpha = p.rim[2] ?? .8; x.lineWidth = 26; x.translate(-rimSide * 12, 6); bodyPath(); x.stroke(); x.restore(); }
    bodyPath(); x.strokeStyle = INK; x.lineWidth = LW; x.stroke();
    // ---- arms: [angle from down, elbow bend]
    const shoulderY = torsoTop + 55;
    const armEnd = (side, a) => {
      const len = baby ? 150 : kid ? 175 : 205, ang = a[0], bend = a[1];
      const sx = cx + side * tw * .78, sy = shoulderY;
      const ex = sx + side * Math.sin(ang) * len, ey = sy + Math.cos(ang) * len;
      const mx = (sx + ex) / 2 + side * Math.cos(ang) * bend * 60, my = (sy + ey) / 2 - Math.sin(ang) * bend * 60 * side * side;
      return { sx, sy, ex, ey, mx, my };
    };
    const arms = [[-1, p.armL], [1, p.armR]];
    for (const [side, a] of arms) {
      const e = armEnd(side, a);
      x.strokeStyle = INK; x.lineWidth = 12; x.beginPath(); x.moveTo(e.sx, e.sy); x.quadraticCurveTo(e.mx, e.my, e.ex, e.ey); x.stroke();
      const held = side > 0 ? p.hold : p.holdR;
      if (held) this.drawProp(x, held, e.ex, e.ey, t);
      x.fillStyle = s.skin; x.beginPath(); x.arc(e.ex, e.ey, 19, 0, 7); x.fill(); x.lineWidth = 7; x.stroke();
      if (side > 0) this.handDesign = [e.ex, e.ey];
    }
    // ---- head
    x.save(); x.translate(cx, headCY); x.rotate(p.tilt); x.translate(-cx, -headCY);
    this.drawHairBack(x, cx, headCY, headR);
    const hg = x.createRadialGradient(cx - rimSide * headR * .25, headCY - headR * .35, headR * .2, cx, headCY, headR * 1.05);
    const sk = p.pale ? mixCol(s.skin, '#cfd8e0', p.pale) : s.skin;
    hg.addColorStop(0, shadeCol(sk, .06)); hg.addColorStop(.7, sk); hg.addColorStop(1, shadeCol(sk, -.16));
    x.fillStyle = hg; x.beginPath(); x.arc(cx, headCY, headR, 0, Math.PI * 2); x.fill();
    if (p.rim) { x.save(); x.beginPath(); x.arc(cx, headCY, headR, 0, 7); x.clip(); x.strokeStyle = p.rim[0]; x.globalAlpha = p.rim[2] ?? .85; x.lineWidth = 30; x.beginPath(); x.arc(cx - rimSide * 16, headCY + 6, headR, 0, 7); x.stroke(); x.restore(); }
    x.strokeStyle = INK; x.lineWidth = LW + 1; x.beginPath(); x.arc(cx, headCY, headR, 0, Math.PI * 2); x.stroke();
    this.drawFace(x, p, cx, headCY, headR, t);
    this.drawHairFront(x, cx, headCY, headR);
    if (p.sweat > 0) { x.globalAlpha = p.sweat; x.fillStyle = '#bfe3ff'; const sx2 = cx + headR * .78, sy2 = headCY - headR * .45; x.beginPath(); x.moveTo(sx2, sy2 - 34); x.quadraticCurveTo(sx2 + 22, sy2, sx2, sy2 + 14); x.quadraticCurveTo(sx2 - 22, sy2, sx2, sy2 - 34); x.fill(); x.lineWidth = 6; x.stroke(); x.globalAlpha = 1; }
    x.restore();
    x.restore();
    this.tex.needsUpdate = true;
    if (this.handDesign) this.hand.copy(this.local(this.handDesign[0], this.handDesign[1]));
  }
  drawFace(x, p, cx, cy, R, t) {
    const lx = p.look[0] * R * .16, ly = p.look[1] * R * .12, ex = R * .34, ey = cy - R * .02 + ly;
    // blink: periodic + forced
    const auto = ((t * .37 + (this.s.h * 3.1)) % 3.3) < .12 ? 1 : 0;
    const bl = Math.max(p.blink, p.eyes === 'closed' ? 1 : auto * (p.eyes === 'dot' || p.eyes === 'ring' ? 1 : 0));
    x.strokeStyle = INK; x.fillStyle = INK; x.lineWidth = 8;
    for (const sd of [-1, 1]) {
      const exx = cx + sd * ex + lx;
      if (bl > .6) { x.beginPath(); x.arc(exx, ey + 4, 18, Math.PI * .1, Math.PI * .9); x.stroke(); continue; }
      if (p.eyes === 'dot') { x.beginPath(); x.ellipse(exx, ey, 12, 17 * (1 - bl), 0, 0, 7); x.fill(); }
      else if (p.eyes === 'half') { x.beginPath(); x.ellipse(exx, ey + 4, 13, 10, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(exx - 24, ey - 6); x.lineTo(exx + 24, ey - 6); x.stroke(); }
      else { // ring / wide: white eye with small pupil
        const rr = p.eyes === 'wide' ? 34 : 27;
        x.fillStyle = '#fbfaf6'; x.beginPath(); x.ellipse(exx, ey, rr, rr * (1 - bl), 0, 0, 7); x.fill(); x.lineWidth = 7; x.stroke();
        const pr = p.eyes === 'wide' ? 7 : 9, jit = p.shake ? noise(t * 23 + sd) * 3 : 0;
        x.fillStyle = INK; x.beginPath(); x.arc(exx + p.look[0] * rr * .45 + jit, ey + p.look[1] * rr * .4, pr, 0, 7); x.fill();
      }
    }
    // brows: brow>0 angry (inner down), brow<0 worried (inner up)
    if (p.brow !== 0 || this.s.stache) {
      x.lineWidth = this.s.stache ? 12 : 8; x.strokeStyle = this.s.stache ? shadeCol(this.s.hairCol, -.25) : INK;
      for (const sd of [-1, 1]) { const bx = cx + sd * ex + lx, by = ey - (p.eyes === 'wide' ? 58 : p.eyes === 'ring' ? 50 : 40);
        const inner = -p.brow * 14; x.beginPath(); x.moveTo(bx - sd * 26, by + 4); x.lineTo(bx + sd * 22, by + inner + 2); x.stroke(); }
    }
    // mouth
    const my = cy + R * .42 + ly * .5, mx = cx + lx * .7;
    x.strokeStyle = INK; x.lineWidth = 8; x.fillStyle = '#4a1d26';
    const talk = p.talk;
    if (this.s.stache) { // mustache
      x.fillStyle = this.s.hairCol; x.beginPath(); x.moveTo(mx - 62, my - 6); x.quadraticCurveTo(mx - 30, my - 42, mx, my - 22); x.quadraticCurveTo(mx + 30, my - 42, mx + 62, my - 6); x.quadraticCurveTo(mx + 30, my - 14, mx, my - 10); x.quadraticCurveTo(mx - 30, my - 14, mx - 62, my - 6); x.fill(); x.lineWidth = 6; x.stroke(); x.lineWidth = 8; x.fillStyle = '#4a1d26';
    }
    if (this.s.beard) { x.fillStyle = shadeCol(this.s.hairCol, .1); x.beginPath(); x.arc(cx, cy + R * .45, R * .52, .15 * Math.PI, .85 * Math.PI); x.quadraticCurveTo(cx, cy + R * 1.08, cx + Math.cos(.15 * Math.PI) * R * .52, cy + R * .45 + Math.sin(.15 * Math.PI) * R * .52); x.fill(); x.stroke(); x.fillStyle = '#4a1d26'; }
    const m = p.mouth;
    if (talk > .05 || m === 'open' || m === 'o') {
      const o = m === 'o' ? Math.max(talk, .8) : Math.max(talk, m === 'open' ? .9 : 0);
      x.beginPath(); x.ellipse(mx, my + 4, m === 'o' ? 14 + o * 6 : 22, 6 + o * 18, 0, 0, 7); x.fill(); x.stroke();
    } else if (m === 'smile') { x.beginPath(); x.arc(mx, my - 14, 26, .2 * Math.PI, .8 * Math.PI); x.stroke(); }
    else if (m === 'frown') { x.beginPath(); x.arc(mx, my + 22, 24, 1.2 * Math.PI, 1.8 * Math.PI); x.stroke(); }
    else if (m === 'wobble') { x.beginPath(); x.moveTo(mx - 28, my); for (let i = 1; i <= 6; i++) x.lineTo(mx - 28 + i * 9.3, my + (i % 2 ? -7 : 5) + (p.shake ? noise(t * 20 + i) * 3 : 0)); x.stroke(); }
    else if (m === 'grit') { x.fillStyle = '#fbfaf6'; x.beginPath(); x.roundRect(mx - 32, my - 14, 64, 30, 10); x.fill(); x.stroke(); x.lineWidth = 4; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(mx - 32 + i * 16, my - 14); x.lineTo(mx - 32 + i * 16, my + 16); x.stroke(); } x.beginPath(); x.moveTo(mx - 32, my + 1); x.lineTo(mx + 32, my + 1); x.stroke(); }
    else if (m === 'gag') { x.beginPath(); x.moveTo(mx - 26, my + 4); x.quadraticCurveTo(mx - 10, my - 10, mx, my + 2); x.quadraticCurveTo(mx + 10, my + 14, mx + 26, my - 2); x.stroke(); }
    else { x.beginPath(); x.moveTo(mx - 20, my); x.lineTo(mx + 20, my); x.stroke(); }
    // cheeks for kids
    if (this.s.kid) { x.fillStyle = 'rgba(230,110,110,.35)'; for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(cx + sd * R * .58, cy + R * .28, 22, 13, 0, 0, 7); x.fill(); } }
  }
  drawHairBack(x, cx, cy, R) {
    const s = this.s; x.strokeStyle = INK; x.lineWidth = LW;
    if (s.hair === 'bun') { x.fillStyle = s.hairCol; x.beginPath(); x.arc(cx + R * .1, cy - R * 1.02, R * .38, 0, 7); x.fill(); x.stroke(); }
    if (s.hair === 'braids') { x.fillStyle = s.hairCol; for (const sd of [-1, 1]) { for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(cx + sd * R * .95, cy + R * .15 + i * 42, 24, 26, 0, 0, 7); x.fill(); x.stroke(); }
      x.fillStyle = s.ribbon; x.beginPath(); x.ellipse(cx + sd * R * .95, cy + R * .15 + 4 * 42 - 6, 22, 12, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = s.hairCol; } }
    if (s.hair === 'kerchief' || s.hair === 'bonnet') { x.fillStyle = s.scarf; x.beginPath(); x.arc(cx, cy - R * .05, R * 1.1, Math.PI * .95, Math.PI * 2.05); x.lineTo(cx + R * .9, cy + R * .55); x.lineTo(cx - R * .9, cy + R * .55); x.closePath(); x.fill(); x.stroke(); }
  }
  drawHairFront(x, cx, cy, R) {
    const s = this.s; x.strokeStyle = INK; x.lineWidth = LW;
    const cap = (col, y0 = -.12) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, R, Math.PI * 1.02, Math.PI * 1.98); x.quadraticCurveTo(cx + R * .5, cy + R * y0 - R * .1, cx + R * .1, cy + R * y0 + R * .05); x.quadraticCurveTo(cx - R * .5, cy + R * y0 - R * .2, cx - R * .99, cy - R * .1); x.closePath(); x.fill(); x.stroke(); };
    switch (s.hair) {
      case 'farmer': { // grey sides, thin top
        x.fillStyle = s.hairCol;
        for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(cx + sd * R * .98, cy + R * .05); x.quadraticCurveTo(cx + sd * R * 1.05, cy - R * .6, cx + sd * R * .55, cy - R * .82); x.quadraticCurveTo(cx + sd * R * .7, cy - R * .4, cx + sd * R * .72, cy + R * .02); x.closePath(); x.fill(); x.stroke(); }
        x.beginPath(); x.moveTo(cx - R * .5, cy - R * .86); x.quadraticCurveTo(cx, cy - R * 1.05, cx + R * .5, cy - R * .86); x.quadraticCurveTo(cx, cy - R * .78, cx - R * .5, cy - R * .86); x.fill(); x.stroke(); break; }
      case 'bun': cap(s.hairCol, -.2); x.strokeStyle = shadeCol(s.hairCol, .25); x.lineWidth = 5; x.beginPath(); x.arc(cx, cy + R * .2, R * .9, Math.PI * 1.25, Math.PI * 1.55); x.stroke(); break;
      case 'braids': cap(s.hairCol, -.15); break;
      case 'tuft': x.fillStyle = s.hairCol; x.beginPath(); x.moveTo(cx - 30, cy - R * .96); x.quadraticCurveTo(cx - 5, cy - R * 1.35, cx + 10, cy - R * .98); x.quadraticCurveTo(cx + 30, cy - R * 1.25, cx + 40, cy - R * .93); x.closePath(); x.fill(); x.stroke(); break;
      case 'kerchief': case 'bonnet': {
        x.fillStyle = s.hairCol; x.beginPath(); x.arc(cx, cy, R * .98, Math.PI * 1.1, Math.PI * 1.9); x.quadraticCurveTo(cx, cy - R * .45, cx - R * .93, cy - R * .32); x.fill();
        x.fillStyle = s.scarf; x.beginPath(); x.arc(cx, cy - R * .08, R * 1.08, Math.PI * 1.02, Math.PI * 1.98); x.quadraticCurveTo(cx, cy - R * .78, cx - R * 1.07, cy - R * .12); x.closePath(); x.fill(); x.stroke();
        if (s.hair === 'bonnet') { x.strokeStyle = shadeCol(s.scarf, -.2); x.lineWidth = 5; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(cx, cy - R * .08, R * (1.0 - i * .05), Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } }
        // knot under chin
        x.fillStyle = s.scarf; x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.ellipse(cx + R * .55, cy + R * .86, 20, 14, .5, 0, 7); x.fill(); x.stroke(); break; }
      case 'cap': { cap(s.hairCol, -.05); x.fillStyle = s.capCol; x.beginPath(); x.arc(cx, cy - R * .2, R * 1.02, Math.PI * 1.05, Math.PI * 1.95); x.quadraticCurveTo(cx + R * 1.25, cy - R * .25, cx + R * 1.2, cy - R * .28); x.quadraticCurveTo(cx, cy - R * .2, cx - R * .99, cy - R * .38); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = shadeCol(s.capCol, -.2); x.beginPath(); x.ellipse(cx + R * .7, cy - R * .3, R * .55, R * .12, -.08, 0, 7); x.fill(); x.stroke(); break; }
      case 'hat': { x.fillStyle = s.capCol; x.beginPath(); x.ellipse(cx, cy - R * .62, R * 1.28, R * .2, 0, 0, 7); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(cx - R * .72, cy - R * .66); x.quadraticCurveTo(cx - R * .7, cy - R * 1.45, cx, cy - R * 1.42); x.quadraticCurveTo(cx + R * .7, cy - R * 1.45, cx + R * .72, cy - R * .66); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#5a6e3a'; x.fillRect(cx - R * .72, cy - R * .86, R * 1.44, R * .16); x.strokeRect(cx - R * .72, cy - R * .86, R * 1.44, R * .16); break; }
    }
  }
  drawProp(x, kind, hx, hy, t) {
    x.save(); x.strokeStyle = INK; x.lineWidth = 7;
    if (kind === 'lantern') {
      const fl = .85 + .15 * noise(t * 9);
      x.globalCompositeOperation = 'source-over';
      x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx, hy + 30); x.stroke();
      x.fillStyle = '#2c2a30'; x.fillRect(hx - 34, hy + 30, 68, 16); x.strokeRect(hx - 34, hy + 30, 68, 16);
      const g = x.createRadialGradient(hx, hy + 85, 4, hx, hy + 85, 40); g.addColorStop(0, '#fffbe0'); g.addColorStop(.5, `rgba(255,${190 + 40 * fl | 0},90,1)`); g.addColorStop(1, '#e0812a');
      x.fillStyle = g; x.beginPath(); x.roundRect(hx - 28, hy + 46, 56, 80, 10); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(hx, hy + 46); x.lineTo(hx, hy + 126); x.stroke();
      x.fillStyle = '#2c2a30'; x.fillRect(hx - 38, hy + 124, 76, 18); x.strokeRect(hx - 38, hy + 124, 76, 18);
      this.lampDesign = [hx, hy + 85];
    } else if (kind === 'bag') {
      x.fillStyle = '#6b4b35'; x.beginPath(); x.roundRect(hx - 60, hy + 10, 120, 90, 14); x.fill(); x.stroke(); x.beginPath(); x.arc(hx, hy + 10, 22, Math.PI, 0); x.stroke();
      x.fillStyle = '#c8a45a'; x.fillRect(hx - 8, hy + 40, 16, 14);
    } else if (kind === 'paper') {
      x.fillStyle = '#efe7d3'; x.translate(hx, hy); x.rotate(-.15); x.fillRect(-90, -120, 150, 190); x.strokeRect(-90, -120, 150, 190);
      x.fillStyle = INK; x.font = '900 28px Montserrat'; x.fillText('MÜNCHEN', -82, -82); x.fillRect(-82, -70, 134, 5);
      x.globalAlpha = .45; for (let i = 0; i < 8; i++) x.fillRect(-82 + (i % 2) * 70, -50 + (i >> 1) * 26, 60, 6);
    } else if (kind === 'pitchfork') {
      x.strokeStyle = '#7a5a3a'; x.lineWidth = 12; x.beginPath(); x.moveTo(hx, hy + 120); x.lineTo(hx, hy - 260); x.stroke(); x.strokeStyle = '#555'; x.lineWidth = 7;
      for (const d of [-20, 0, 20]) { x.beginPath(); x.moveTo(hx + d, hy - 260); x.lineTo(hx + d, hy - 330); x.stroke(); }
    } else if (kind === 'crowbar') {
      x.strokeStyle = '#3a3c44'; x.lineWidth = 14; x.beginPath(); x.moveTo(hx - 10, hy + 100); x.lineTo(hx + 10, hy - 140); x.quadraticCurveTo(hx + 16, hy - 170, hx + 40, hy - 160); x.stroke();
    }
    x.restore();
  }
}
// colour helpers
function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
export function shadeCol(h, a) { const c = hexRgb(h).map(v => a >= 0 ? v + (255 - v) * a : v * (1 + a)); return `rgb(${c.map(v => v | 0).join(',')})`; }
function mixCol(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); }

// simple 2D cartoon cow cut-out
export function cowSprite() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 600; const x = c.getContext('2d'); x.lineJoin = x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 12;
  x.fillStyle = '#efe9df';
  for (const lx of [250, 330, 600, 680]) { x.beginPath(); x.moveTo(lx, 380); x.lineTo(lx, 560); x.stroke(); x.fillStyle = '#2a2124'; x.fillRect(lx - 16, 545, 32, 26); x.fillStyle = '#efe9df'; }
  x.beginPath(); x.roundRect(170, 170, 580, 250, 120); x.fill(); x.stroke();
  x.fillStyle = '#2b2630'; x.beginPath(); x.ellipse(330, 260, 90, 60, .3, 0, 7); x.fill(); x.beginPath(); x.ellipse(600, 320, 70, 50, -.2, 0, 7); x.fill();
  x.fillStyle = '#efe9df'; x.beginPath(); x.ellipse(160, 230, 105, 95, 0, 0, 7); x.fill(); x.stroke();
  x.fillStyle = '#e8b4b0'; x.beginPath(); x.ellipse(120, 290, 80, 50, 0, 0, 7); x.fill(); x.stroke();
  x.fillStyle = INK; x.beginPath(); x.arc(95, 290, 9, 0, 7); x.arc(140, 290, 9, 0, 7); x.fill(); x.beginPath(); x.arc(135, 205, 11, 0, 7); x.arc(195, 205, 11, 0, 7); x.fill();
  x.fillStyle = '#d8cfbf'; x.beginPath(); x.moveTo(100, 150); x.lineTo(80, 110); x.lineTo(125, 140); x.fill(); x.stroke(); x.beginPath(); x.moveTo(220, 150); x.lineTo(245, 110); x.lineTo(200, 140); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(750, 250); x.quadraticCurveTo(800, 330, 780, 420); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
