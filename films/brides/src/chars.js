// 2D cut-out characters (big round heads, bean bodies, stick limbs, thick ink) drawn on a canvas that stands in the 3D set.
import { THREE, camera, clamp, lerp, noise } from './engine.js';

const CW = 600, CH = 1000;          // design units; the canvas is CW*res × CH*res
const INK = '#17121c', LW = 10;

export const CAST = {
  neil: { skin: '#f3e2cc', hair: 'bowler', hairCol: '#4a3a30', capCol: '#2b2830', body: 'coat', bodyCol: '#3a3f4d', accent: '#c9a45a', h: 1.78, stache: true },
  spils: { skin: '#f5e6d4', hair: 'slick', hairCol: '#2e2a2a', body: 'coat', bodyCol: '#2c2f38', accent: '#7a1f2a', h: 1.86, flower: true },
  diver: { skin: '#f6e4cf', hair: 'swimcap', hairCol: '#5a3a2a', capCol: '#c7333b', body: 'swim', bodyCol: '#1f2a4a', h: 1.62 },
  father: { skin: '#f1dfc8', hair: 'farmer', hairCol: '#b9b4b2', body: 'vest', bodyCol: '#4a3b33', shirt: '#e0d8c6', h: 1.72, stache: true, beard: true, glasses: true },
  smith: { skin: '#f0dcc4', hair: 'slick', hairCol: '#1d1a1c', body: 'coat', bodyCol: '#26232a', accent: '#8a7a5a', h: 1.76, stache: true },
  smithB: { skin: '#f0dcc4', hair: 'bowler', hairCol: '#1d1a1c', capCol: '#1b191d', body: 'coat', bodyCol: '#26232a', accent: '#8a7a5a', h: 1.76, stache: true },
  alice: { skin: '#f7e8d8', hair: 'updo', hairCol: '#6b4a2e', body: 'dress', bodyCol: '#ece4d6', apron: null, h: 1.6, veil: true },
  margaret: { skin: '#f5e5d2', hair: 'updo', hairCol: '#3b2a24', body: 'dress', bodyCol: '#d9cbb6', h: 1.58, veil: true },
  bessie: { skin: '#f6e6d4', hair: 'updo', hairCol: '#8a5a34', body: 'dress', bodyCol: '#5b6a8a', h: 1.7 },
  bessieV: { skin: '#f6e6d4', hair: 'updo', hairCol: '#8a5a34', body: 'dress', bodyCol: '#efe8dc', h: 1.7, veil: true },
  pc1: { skin: '#f1dfc8', hair: 'helmet', hairCol: '#3a2e28', capCol: '#1d2033', body: 'coat', bodyCol: '#20253a', accent: '#c8c8d0', h: 1.84, stache: true },
  pc2: { skin: '#efdcc2', hair: 'helmet', hairCol: '#5a4030', capCol: '#1d2033', body: 'coat', bodyCol: '#20253a', accent: '#c8c8d0', h: 1.8 },
  judge: { skin: '#f3e0ca', hair: 'wig', hairCol: '#ece8e0', body: 'coat', bodyCol: '#8e1f27', accent: '#e8d9a8', h: 1.74 },
  juror1: { skin: '#f1dfc8', hair: 'slick', hairCol: '#5a4a3a', body: 'coat', bodyCol: '#3d3a36', accent: '#888', h: 1.72, stache: true },
  juror2: { skin: '#f3e3cf', hair: 'farmer', hairCol: '#8a8480', body: 'vest', bodyCol: '#4a4038', shirt: '#ddd4c2', h: 1.7, beard: true },
  juror3: { skin: '#eedac0', hair: 'bowler', hairCol: '#3a3028', capCol: '#3a3436', body: 'coat', bodyCol: '#4a4450', accent: '#999', h: 1.75 },
};

const SHADOW_TEX = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 32, 2, 64, 32, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.setTransform(1, 0, 0, .5, 0, 16); x.fillStyle = g; x.beginPath(); x.arc(64, 32, 62, 0, 7); x.fill(); const t = new THREE.CanvasTexture(c); return t; })();
const DEF = { look: [0, 0], blink: 0, eyes: 'dot', mouth: 'flat', talk: 0, brow: 0, sweat: 0, tilt: 0, lean: 0, bob: 0,
  armL: [0.25, 0.25], armR: [0.25, 0.25], sit: 0, walk: 0, phase: 0, hold: null, holdR: null, rim: null, shake: 0, breath: 0, pale: 0 };

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
    this.mesh.position.y = h * .482; this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: .45 });
    this.g = new THREE.Group(); this.g.add(this.mesh);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * .62, w * .3), new THREE.MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, opacity: .55, depthWrite: false, color: 0x000000 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = .006; this.shadow.renderOrder = 1; this.g.add(this.shadow);
    this.face = 1; this.hand = new THREE.Vector3();
  }
  // world position of a point given in canvas design coords
  local(px, py) { const h = this.s.h, w = h * CW / CH; return new THREE.Vector3((px / CW - .5) * w * this.face * this.g.scale.x, (1 - py / CH) * h * this.g.scale.y, 0); }
  worldOf(px, py) { const h = this.s.h, w = h * CW / CH; const v = new THREE.Vector3(((this.face < 0 ? CW - px : px) / CW - .5) * w, (1 - py / CH) * h - h / 2, .05); this.g.updateMatrixWorld(true); return this.mesh.localToWorld(v); }
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
    if (p.sit) {
      for (const sd of [-1, 1]) {
        const kx = cx + sd * 62, ky = hipY + 45;
        x.strokeStyle = INK; x.lineWidth = 12; x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + sd * 4, feetY - 18); x.stroke();
        x.fillStyle = '#2a2124'; x.beginPath(); x.ellipse(kx + sd * 16, feetY - 10, 30, 15, 0, 0, 7); x.fill(); x.lineWidth = 7; x.stroke();
        const kc = s.body === 'swim' ? s.skin : s.body === 'dress' ? s.bodyCol : (s.legCol || shadeCol(s.bodyCol, -.15));
        x.fillStyle = kc; x.beginPath(); x.ellipse(kx, ky - 8, 52, 44, 0, 0, 7); x.fill(); x.lineWidth = 9; x.stroke();
      }
    } else
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
    if (s.body === 'swim') {
      x.fillStyle = '#f2efe8'; for (const yy of [torsoTop + 70, torsoTop + 110]) x.fillRect(cx - tw * 1.3, yy, tw * 2.6, 14);
      x.fillStyle = s.skin; x.beginPath(); x.moveTo(cx - tw, torsoTop - 20); x.lineTo(cx + tw, torsoTop - 20); x.lineTo(cx + tw * .55, torsoTop + 26); x.quadraticCurveTo(cx, torsoTop + 50, cx - tw * .55, torsoTop + 26); x.closePath(); x.fill();
      x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - tw * .55, torsoTop + 26); x.quadraticCurveTo(cx, torsoTop + 50, cx + tw * .55, torsoTop + 26); x.stroke();
    }
    if (s.flower) { x.fillStyle = '#c4202f'; x.beginPath(); x.arc(cx - 50, torsoTop + 70, 14, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 4; x.stroke(); }
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
    if (p.hold === 'newspaper') this.drawProp(x, 'newspaper', 0, 0, t);
    for (const [side, a] of arms) {
      const e = armEnd(side, a);
      x.strokeStyle = INK; x.lineWidth = 12; x.beginPath(); x.moveTo(e.sx, e.sy); x.quadraticCurveTo(e.mx, e.my, e.ex, e.ey); x.stroke();
      const held = side > 0 ? p.hold : p.holdR;
      if (held && held !== 'newspaper') this.drawProp(x, held, e.ex, e.ey, t);
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
    if (s.glasses) { x.strokeStyle = '#3a3030'; x.lineWidth = 6; const gy = headCY - headR * .02 + p.look[1] * headR * .12; for (const sd of [-1, 1]) { x.beginPath(); x.arc(cx + sd * headR * .34 + p.look[0] * headR * .16, gy, 36, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(cx - headR * .34 + 36 + p.look[0] * headR * .16, gy); x.lineTo(cx + headR * .34 - 36 + p.look[0] * headR * .16, gy); x.stroke(); }
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
      case 'bowler': { x.fillStyle = s.capCol; x.beginPath(); x.ellipse(cx, cy - R * .6, R * 1.22, R * .2, 0, 0, 7); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(cx - R * .78, cy - R * .64); x.bezierCurveTo(cx - R * .82, cy - R * 1.55, cx + R * .82, cy - R * 1.55, cx + R * .78, cy - R * .64); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = shadeCol(s.capCol, .25); x.lineWidth = 6; x.beginPath(); x.arc(cx - R * .25, cy - R * 1.08, R * .32, 3.4, 4.4); x.stroke();
        x.strokeStyle = INK; x.lineWidth = LW; x.fillStyle = '#4a4048'; x.fillRect(cx - R * .78, cy - R * .8, R * 1.56, R * .13); x.strokeRect(cx - R * .78, cy - R * .8, R * 1.56, R * .13); break; }
      case 'slick': { x.fillStyle = s.hairCol; x.beginPath(); x.arc(cx, cy, R * 1.0, Math.PI * 1.04, Math.PI * 1.96); x.quadraticCurveTo(cx + R * .55, cy - R * .62, cx + R * .02, cy - R * .62); x.quadraticCurveTo(cx - R * .55, cy - R * .6, cx - R * .99, cy - R * .14); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = shadeCol(s.hairCol, .3); x.lineWidth = 5; x.beginPath(); x.moveTo(cx - R * .02, cy - R * .98); x.lineTo(cx - R * .02, cy - R * .66); x.stroke(); x.beginPath(); x.arc(cx + R * .3, cy - R * .2, R * .62, 3.9, 4.5); x.stroke(); break; }
      case 'swimcap': { x.fillStyle = s.capCol; x.beginPath(); x.arc(cx, cy - R * .02, R * 1.04, Math.PI * .97, Math.PI * 2.03); x.quadraticCurveTo(cx, cy - R * .45, cx - R * 1.04, cy + R * .02); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = shadeCol(s.capCol, .3); x.lineWidth = 6; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(cx, cy - R * .02, R * (.85 - i * .2), Math.PI * 1.2, Math.PI * 1.8); x.stroke(); }
        x.strokeStyle = INK; x.lineWidth = 7; for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(cx + sd * R * .98, cy + R * .05); x.quadraticCurveTo(cx + sd * R * .8, cy + R * .7, cx + sd * R * .35, cy + R * .92); x.stroke(); } break; }
      case 'helmet': { x.fillStyle = s.capCol; x.beginPath(); x.moveTo(cx - R * .95, cy - R * .5); x.bezierCurveTo(cx - R * .95, cy - R * 1.9, cx + R * .95, cy - R * 1.9, cx + R * .95, cy - R * .5); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = shadeCol(s.capCol, -.2); x.beginPath(); x.ellipse(cx, cy - R * .5, R * 1.06, R * .14, 0, 0, 7); x.fill(); x.stroke();
        x.fillStyle = '#d8d8e0'; x.beginPath(); x.moveTo(cx, cy - R * 1.12); x.lineTo(cx + R * .2, cy - R * .88); x.lineTo(cx, cy - R * .66); x.lineTo(cx - R * .2, cy - R * .88); x.closePath(); x.fill(); x.lineWidth = 5; x.stroke();
        x.lineWidth = LW; x.beginPath(); x.arc(cx, cy - R * 1.55, R * .1, 0, 7); x.fillStyle = '#c8c8d0'; x.fill(); x.stroke();
        x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - R * .9, cy - R * .45); x.quadraticCurveTo(cx, cy + R * 1.1, cx + R * .9, cy - R * .45); x.stroke(); break; }
      case 'wig': { x.fillStyle = s.hairCol; x.beginPath(); x.arc(cx, cy - R * .05, R * 1.1, Math.PI * .95, Math.PI * 2.05); x.lineTo(cx + R * 1.12, cy + R * .8); x.lineTo(cx + R * .86, cy + R * .8); x.lineTo(cx + R * .86, cy - R * .2); x.quadraticCurveTo(cx, cy - R * .75, cx - R * .86, cy - R * .2); x.lineTo(cx - R * .86, cy + R * .8); x.lineTo(cx - R * 1.12, cy + R * .8); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = shadeCol(s.hairCol, -.25); x.lineWidth = 5; for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(cx + sd * R * .99, cy + R * (-.05 + i * .22), R * .1, 0, 7); x.stroke(); } break; }
      case 'updo': { cap(s.hairCol, -.22); x.fillStyle = s.hairCol; x.beginPath(); x.ellipse(cx, cy - R * 1.02, R * .52, R * .3, 0, 0, 7); x.fill(); x.stroke();
        if (s.veil) { x.fillStyle = 'rgba(250,248,242,.55)'; x.beginPath(); x.moveTo(cx - R * .5, cy - R * 1.12); x.quadraticCurveTo(cx - R * 1.6, cy, cx - R * 1.25, cy + R * 1.9); x.lineTo(cx + R * 1.25, cy + R * 1.9); x.quadraticCurveTo(cx + R * 1.6, cy, cx + R * .5, cy - R * 1.12); x.closePath(); x.fill(); x.strokeStyle = 'rgba(30,25,35,.5)'; x.lineWidth = 4; x.stroke();
          x.fillStyle = '#f4efe2'; for (let i = -3; i <= 3; i++) { x.beginPath(); x.arc(cx + i * R * .15, cy - R * 1.1 + Math.abs(i) * 6, 13, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke(); } }
        break; }
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
    } else if (kind === 'watch') {
      x.strokeStyle = '#c9a45a'; x.lineWidth = 4; x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo(hx - 30, hy - 60, hx - 20, hy - 110); x.stroke();
      x.fillStyle = '#d9b860'; x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.arc(hx, hy + 30, 34, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#f6f1e2'; x.beginPath(); x.arc(hx, hy + 30, 25, 0, 7); x.fill(); x.lineWidth = 4; const a = t * 6.28 / 6; x.beginPath(); x.moveTo(hx, hy + 30); x.lineTo(hx + Math.sin(a) * 20, hy + 30 - Math.cos(a) * 20); x.stroke();
    } else if (kind === 'newspaper') {
      x.setTransform(1, 0, 0, 1, 0, 0); x.scale(this.res, this.res); x.translate(300, 700); x.rotate(-.04); x.fillStyle = '#ece4cf'; x.fillRect(-150, -210, 300, 230); x.strokeRect(-150, -210, 300, 230);
      x.fillStyle = INK; x.font = '900 30px Montserrat'; x.textAlign = 'center'; x.fillText('NEWS OF THE WORLD', 0, -168); x.fillRect(-134, -156, 268, 5);
      x.font = '800 22px Montserrat'; x.fillStyle = '#7a1f24'; x.fillText('BRIDE FOUND DEAD IN BATH', 0, -124);
      x.globalAlpha = .45; x.fillStyle = INK; for (let i = 0; i < 12; i++) x.fillRect(-134 + (i % 2) * 140, -100 + (i >> 1) * 20, 120, 6); x.globalAlpha = 1;
    } else if (kind === 'towel') {
      x.fillStyle = '#f1ede4'; x.beginPath(); x.roundRect(hx - 70, hy - 10, 140, 190, 18); x.fill(); x.stroke(); x.strokeStyle = '#b8434b'; x.lineWidth = 8; x.beginPath(); x.moveTo(hx - 70, hy + 150); x.lineTo(hx + 70, hy + 150); x.stroke();
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
