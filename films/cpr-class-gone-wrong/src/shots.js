// Storyboard frames: sets + posed rigs + camera + light + post. These are the film's key shots at one instant.
import { P, F, mix, dark, rgba, rr, poly, fillR, fillRR, circ, ell, line, lg, rg, text, tmp, TAU, clamp, lerp, shaft, dust, bloom, vignette, wash, paperGrain } from './kit.js';
import { drawChar, pose } from './rig.js';

export const W = 1080, H = 1920;
const cam = (g, c, fn) => { g.save(); g.translate(W / 2, H / 2); g.rotate(c.r || 0); g.scale(c.z || 1, c.z || 1); g.translate(-(c.x ?? W / 2), -(c.y ?? H / 2)); fn(); g.restore(); };
// draw into an offscreen layer, then composite (optionally blurred: depth of field)
function layer(ctx, id, fn, blur = 0, alpha = 1) {
  const g = tmp(id, W, H); fn(g); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha;
  if (blur) { ctx.drawImage(g.canvas, 0, 0); ctx.filter = `blur(${blur}px)`; } ctx.drawImage(g.canvas, 0, 0); ctx.restore();
}
function layerSoft(ctx, id, fn, blur) { const g = tmp(id, W, H); fn(g); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${blur}px)`; ctx.drawImage(g.canvas, 0, 0); ctx.restore(); }
const put = (g, ch, x, y, s, o, L, opt) => drawChar(g, ch, { ...pose(ch, o), x, y, s }, L, opt);
const sitY = ch => (ch.ul + ch.ll) * .992 + 12 - 95;
const seat = (ch, o = {}) => ({ hipY: sitY(ch), legS: .5, lL: { x: -30 }, lR: { x: 30 }, ...o });
function finish(ctx, { vig = .5, bl = .2, grade = null, grain = .13, vc = [.5, .5], inner = .35 } = {}) {
  bloom(ctx, W, H, bl); if (grade) wash(ctx, W, H, grade[0], grade[1], grade[2] || 'soft-light');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); vignette(ctx, W, H, vig, P.night, vc[0], vc[1], inner); paperGrain(ctx, W, H, grain); ctx.restore();
}
const mkL = (dx, dy, o = {}) => ({ dx, dy, rim: '#FFEBBE', rimA: .95, rimW: 5, shade: P.plum, shadeA: .26, shadeW: 15, ...o });
const L_HALL = mkL(.74, .6, { shadow: { kx: .6, ky: .15, a: .3, blur: 6, col: P.plum } });
const L_RIGHT = mkL(-.76, .6, { shadow: { kx: -.6, ky: .15, a: .3, blur: 6, col: P.plum } });
const L_BACK = mkL(.14, .99, { rim: '#FFF2CC', rimW: 6, shadeA: 0, shadow: null });

// ---- captions: a paper label from the school's own stationery ----
const WHO = { TEACHER: '#97743C', KYLE: '#2C4E96', GUS: '#55744A', CHRISTOPHER: '#D06A22', VICTOR: '#8E2F45' };
export function caption(c, str, y, { who = null, think = false, size = 60, rot = -.014, maxW = 900, k = 1 } = {}) {
  if (k <= 0.01) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.min(1, k * 1.6);
  const font = `${size}px ${F.title}`; c.font = font;
  const words = str.split(' ').map(w => ({ s: w.replace(/\*/g, ''), hot: w.includes('*') }));
  const sp = c.measureText(' ').width, lines = [[]]; let lw = 0;
  for (const w of words) { const ww = c.measureText(w.s).width; if (lw + ww > maxW - 90 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ ...w, ww }); lw += ww + sp; }
  const lws = lines.map(l => l.reduce((a, w) => a + w.ww, 0) + sp * (l.length - 1)), bw = Math.max(...lws) + 96, lh = size * 1.14, bh = lines.length * lh + 46;
  c.translate(W / 2, y + (1 - k) * 26); c.rotate(rot); c.scale(.86 + .14 * k, .86 + .14 * k);
  fillRR(c, -bw / 2 + 8, -bh / 2 + 11, bw, bh, 16, rgba(P.night, .4));
  fillRR(c, -bw / 2, -bh / 2, bw, bh, 16, think ? '#E7DFF1' : P.paper);
  c.lineWidth = 5; c.strokeStyle = P.ink; if (think) c.setLineDash([16, 11]); rr(c, -bw / 2, -bh / 2, bw, bh, 16); c.stroke(); c.setLineDash([]);
  if (!think) { fillR(c, -bw / 2 + 22, bh / 2 - 15, bw - 44, 3, rgba(P.lav, .55)); }
  if (who) {
    const tw = (() => { c.font = `26px ${F.title}`; return c.measureText(think ? who + ' · thinking' : who).width + 34; })();
    fillRR(c, -bw / 2 + 26, -bh / 2 - 27, tw, 40, 10, WHO[who] || P.ink); c.lineWidth = 4; rr(c, -bw / 2 + 26, -bh / 2 - 27, tw, 40, 10); c.stroke();
    text(c, think ? who + ' · thinking' : who, -bw / 2 + 26 + tw / 2, -bh / 2 - 6, { size: 26, col: P.cream, ls: 1 });
  }
  lines.forEach((l, i) => { let x = -lws[i] / 2; const yy = -bh / 2 + 26 + lh * (i + .5) - 2; for (const w of l) { text(c, w.s, x, yy, { size, col: w.hot ? '#C2512D' : P.ink, align: 'left' }); x += w.ww + sp; } });
  c.restore();
}

export { cam, layer, layerSoft, put, sitY, seat, finish, mkL, WHO };
