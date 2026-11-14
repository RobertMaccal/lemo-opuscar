// The thumbnail / cover: drawn with the film's own engine. No spoiler: it asks the film's question, never shows the answer.
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, TAU, clamp, lerp } from './kit.js';
import { solve, drawChar, pose } from './rig.js';
import { X, DREAMER as D } from './cast.js';
import * as S from './sets.js';
import * as SC from './scenes.js';
import { W, H, cam, layerSoft, finish, mkL } from './shots.js';

// the style's caption: a paper label from the world's own stationery, with a coloured tab and one rust emphasis word
function caption(c, str, y, { tab = null, tabCol = P.you, size = 64, rot = -.02, maxW = 900 } = {}) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = `${size}px ${F.title}`;
  const words = str.split(' ').map(w => ({ s: w.replace(/\*/g, ''), hot: w.includes('*') })), sp = c.measureText(' ').width;
  const ww = words.map(w => c.measureText(w.s).width), lw = ww.reduce((a, b) => a + b, 0) + sp * (words.length - 1), bw = Math.min(maxW, lw + 100), bh = size * 1.14 + 50;
  c.translate(W / 2, y); c.rotate(rot);
  fillRR(c, -bw / 2 + 9, -bh / 2 + 12, bw, bh, 18, rgba(P.night, .45)); fillRR(c, -bw / 2, -bh / 2, bw, bh, 18, P.paper);
  c.lineWidth = 6; c.strokeStyle = P.ink; rr(c, -bw / 2, -bh / 2, bw, bh, 18); c.stroke(); fillR(c, -bw / 2 + 24, bh / 2 - 16, bw - 48, 3, rgba(P.lav, .55));
  if (tab) { c.font = `30px ${F.title}`; const tw = c.measureText(tab).width + 40; fillRR(c, -bw / 2 + 28, -bh / 2 - 31, tw, 46, 11, tabCol); c.lineWidth = 5; rr(c, -bw / 2 + 28, -bh / 2 - 31, tw, 46, 11); c.stroke(); text(c, tab, -bw / 2 + 28 + tw / 2, -bh / 2 - 7, { size: 30, col: P.cream, ls: 1.5 }); }
  let x = -lw / 2; words.forEach((w, i) => { text(c, w.s, x, 3, { size, col: w.hot ? '#C2512D' : P.ink, align: 'left' }); x += ww[i] + sp; });
  c.restore();
}
// headline: big cream letters with a thick indigo outline and a soft drop, the style's title face
function headline(c, str, x, y, size, { col = P.cream, rot = -.035, glow = null } = {}) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.font = `${size}px ${F.title}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.letterSpacing = '2px';
  c.fillStyle = rgba(P.night, .55); c.fillText(str, 8, 12); c.lineWidth = size * .16; c.strokeStyle = rgba(P.night, .55); c.strokeText(str, 8, 12);
  c.lineWidth = size * .15; c.strokeStyle = P.ink; c.strokeText(str, 0, 0);
  if (glow) { c.shadowColor = glow; c.shadowBlur = size * .35; }
  c.fillStyle = col; c.fillText(str, 0, 0); c.shadowBlur = 0;
  c.globalCompositeOperation = 'source-atop'; c.restore();
}

export function thumb(ctx, t = 0) {
  const x = S.BED.hipX, R = D.R;
  // the pose: bolt upright in bed, both hands slapped to his cheeks, horror at full volume
  const base = pose(D, { lean: .02, face: .1, hipY: SC.HIP0 - (S.FY - 1440), shrug: 1.4, sq: -.08, lL: { x: 170, y: -96, r: -1.3 }, lR: { x: 186, y: -100, r: -1.3 },
    e: { ...X.horror, eyeOpen: 1.72, pup: .3, browH: 1.15, browA: .8, mO: .82, mW: .62, mS: -.55, pale: .25, gloom: .22, sweat: 1, gx: .1, gy: -.05 } });
  const J0 = solve(D, base), hc = J0.hc;
  const p = { ...base, aL: { to: [hc[0] - R * 1.02, hc[1] + R * .46], k: -1, z: 1, hand: 'open' }, aR: { to: [hc[0] + R * 1.04, hc[1] + R * .44], k: 1, z: 1, hand: 'open' } };
  const z = 3.05, hx = x + hc[0], hy = S.FY + hc[1], sx = 540, sy = 1035;
  const c = { x: hx - (sx - 540) / z, y: hy - (sy - 960) / z, z };
  // background: the bedroom, out of focus, and the open door glowing at the end of the night, with the toilet waiting in it
  ctx.fillStyle = S.N.wall; ctx.fillRect(0, 0, W, H);
  layerSoft(ctx, 'thumbBg', g => {
    cam(g, { x: 560, y: 1150, z: 1.55 }, () => { S.bedroomBack(g, 0, { ss: null }); S.bedFrame(g); S.pillow(g); });
    // the doorway (screen space): warm light, tiled floor, the toilet in side view
    const d0 = 770, d1 = 1090, dt = 470, db = 1090;
    fillR(g, d0 - 26, dt - 26, d1 - d0 + 52, db - dt + 26, S.N.woodLo);
    g.fillStyle = lg(g, 0, dt, 0, db, ['#FFF2CF', '#FFD691', '#F2B566']); g.fillRect(d0, dt, d1 - d0, db - dt);
    for (let yy = db - 120; yy < db; yy += 30) line(g, d0, yy, d1, yy, rgba('#D9B479', .7), 3);
    g.save(); g.translate(d0 + 168, db - 4); g.scale(.6, .6); g.translate(-830, -S.FY); g.globalAlpha = .96; S.toilet(g, 1); g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .55; g.fillStyle = rg(g, (d0 + d1) / 2, (dt + db) / 2, 40, 620, [S.N.lamp, 'rgba(0,0,0,0)']); g.fillRect(0, 0, W, H); g.restore();
    S.screenGlow(g, 60, 820, 520, S.N.lamp, .5);
  }, 4.5);
  // god rays from the doorway across the room
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .12; ctx.filter = 'blur(24px)'; ctx.fillStyle = '#FFDDA0';
  poly(ctx, [[770, 470], [1090, 470], [760, 1900], [-160, 1900]]); ctx.fill(); ctx.restore();
  // the dreamer, sharp, with a heavy amber rim
  const L = mkL(-.55, .55, { rim: '#FFD597', rimW: 7, rimA: 1, shadeA: .4 });
  cam(ctx, c, () => {
    drawChar(ctx, D, { ...p, x, y: S.FY, s: 1 }, L, { noShadow: true, only: [0, 1, 2] });
    S.blanket(ctx, 0, { from: 470, legs: [[600, 26, 110], [690, 22, 72]] });
    drawChar(ctx, D, { ...p, x, y: S.FY, s: 1 }, L, { noShadow: true, only: [3] });
    // shock ticks around the head (cartoon acting, cream)
    ctx.lineCap = 'round';
    for (const [a, l] of [[-2.55, 1], [-2.2, .8], [-1.85, .65], [-1.29, .65], [-.94, .8], [-.59, 1]]) { const r0 = R * 1.62, r1 = r0 + 34 * l; line(ctx, hx - x + x + Math.cos(a) * r0, hy + Math.sin(a) * r0, hx + Math.cos(a) * r1, hy + Math.sin(a) * r1, '#FFF1D2', 6); }
  });
  finish(ctx, { vig: .55, bl: .26, grade: ['#3A3470', .08, 'multiply'], inner: .3 });
  // copy: the question, never the answer. Kept inside the 3:4 grid crop and clear of the Shorts/Reels buttons.
  headline(ctx, 'HE WOKE UP', 540, 330, 128);
  headline(ctx, '3 TIMES…', 540, 505, 196, { col: '#FFC870', rot: -.035, glow: 'rgba(255,190,90,.75)' });
  caption(ctx, '…is he awake *NOW?*', 1452, { tab: 'ATTEMPT #4', tabCol: '#30508F', size: 72 });
}
