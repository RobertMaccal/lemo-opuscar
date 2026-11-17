// Reels cover / thumbnail: the horror face in bed, the terrified brain bursting in above, one hook line.
import { P, F, rgba, rg, lg, text, fillRR, rr, wash, dust, bloom, vignette, paperGrain, TAU, mix } from './kit.js';
import { X } from './cast.js';
import { drawBrain, BX, bmix } from './brain.js';
import { sleepFace } from './film.js';
import { W, H, caption } from './shots.js';
export function renderThumb(ctx, t = 0) {
  // the bed, the face: eyes snapped open, pale, sweating
  const e = { ...X.awake, eyeOpen: 1.42, pup: .3, browH: .02, browA: .5, browC: .5, mO: .6, pale: .7, gloom: .45, sweat: 1 };
  ctx.save(); ctx.translate(540, 1250); ctx.scale(1.22, 1.22); ctx.translate(-540, -860);
  sleepFace(ctx, 3.3, e, { lift: .6 });
  ctx.restore();
  wash(ctx, W, H, '#3A2F6E', .28, 'multiply');
  // violet mind-glow pouring from the top
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rg(ctx, 330, 700, 20, 900, [rgba('#B07BD8', .75), rgba('#5A3E9E', .35), 'rgba(0,0,0,0)']); ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.fillStyle = lg(ctx, 0, 0, 0, 760, ['#140F28', 'rgba(20,15,40,0)']); ctx.fillRect(0, 0, W, 760);
  dust(ctx, 3, 0, 300, 1080, 900, 60, 51, '#D9C6FF', .6);
  // the brain, terrified, hands up at its cheeks
  const be = bmix(BX.casual, BX.scared, 1);
  ctx.save(); ctx.translate(330, 760); ctx.rotate(-.16); ctx.translate(-330, -760);
  drawBrain(ctx, 330, 760, 1.02, { ...be, gx: .45, gy: .35, mO: .45, shake: 0 }, -1, 2.3, { glow: 1.4 });
  ctx.restore();
  // motion "shake" strokes beside the brain
  ctx.save(); ctx.strokeStyle = rgba('#F6EAD0', .85); ctx.lineCap = 'round'; ctx.lineWidth = 9;
  for (const [x, y, a] of [[612, 600, -.5], [640, 690, -.2], [630, 790, .15], [40, 560, -2.6], [26, 680, -2.95]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 46, y + Math.sin(a) * 46); ctx.stroke(); }
  ctx.restore();
  // the hook
  bloom(ctx, W, H, .28); vignette(ctx, W, H, .55, P.night, .5, .55, .32); paperGrain(ctx, W, H, .12);
  const big = (s, x, y, size, col, rot = -.03) => { text(ctx, s, x + 10, y + 12, { size, col: rgba(P.night, .9), rot }); text(ctx, s, x, y, { size, col, stroke: P.ink, sw: size * .14, rot }); text(ctx, s, x, y, { size, col, rot }); };
  big('MY BRAIN', 540, 352, 150, P.cream);
  big('WAITED TILL 2AM', 540, 500, 112, P.sun, -.03);
  // the brain's own line, as an in-world caption
  caption(ctx, 'Hey... you *sleeping?*', 1735, { who: 'BRAIN', think: true, size: 60, rot: .02 });
}
