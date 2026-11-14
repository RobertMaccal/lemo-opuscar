// Camera, layers, lights and the post stack (from the style's engine), plus this film's night grade.
import { P, tmp, bloom, vignette, wash, paperGrain } from './kit.js';
import { drawChar, pose } from './rig.js';

export const W = 1080, H = 1920;
export const cam = (g, c, fn) => { g.save(); g.translate(W / 2, H / 2); g.rotate(c.r || 0); g.scale(c.z || 1, c.z || 1); g.translate(-(c.x ?? W / 2), -(c.y ?? H / 2)); fn(); g.restore(); };
// draw into an offscreen layer, then composite blurred (depth of field)
export function layerSoft(ctx, id, fn, blur) { const g = tmp(id, W, H); fn(g); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (blur > .3) ctx.filter = `blur(${blur}px)`; ctx.drawImage(g.canvas, 0, 0); ctx.restore(); }
export const put = (g, ch, x, y, s, o, L, opt) => drawChar(g, ch, { ...pose(ch, o), x, y, s }, L, opt);
export function finish(ctx, { vig = .55, bl = .24, grade = null, grain = .12, vc = [.5, .5], inner = .32 } = {}) {
  bloom(ctx, W, H, bl); if (grade) wash(ctx, W, H, grade[0], grade[1], grade[2] || 'soft-light');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); vignette(ctx, W, H, vig, P.night, vc[0], vc[1], inner); paperGrain(ctx, W, H, grain); ctx.restore();
}
// light: (dx, dy) = the direction the light travels. Night version: warm amber rim, deep indigo shade.
export const mkL = (dx, dy, o = {}) => ({ dx, dy, rim: '#FFD597', rimA: .95, rimW: 5, shade: '#1E1A3C', shadeA: .34, shadeW: 15, ...o });
