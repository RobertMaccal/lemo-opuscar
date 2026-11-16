// Model sheet: the cast in the same rig and light as the film (2400×1500).  index.html?sheet=1
import { P, F, lg, text, fillR } from './kit.js';
import { X, HALE, VOL, PARK, CHRIS, DONOR, MAYA, LENA, PRIYA, NORA, BEN, TOM, SAM } from './cast.js';
import { drawChar, pose } from './rig.js';
import { mkL, finish } from './shots.js';
const L = mkL(-.76, .6, { shadow: { kx: -.5, ky: .12, a: .25, blur: 6, col: P.plum } });
export function sheet(ctx, W, H) {
  ctx.fillStyle = lg(ctx, 0, 0, 0, H, ['#F6E4BE', '#EBCB98']); ctx.fillRect(0, 0, W, H);
  text(ctx, 'CPR CLASS GONE WRONG — cast', 60, 70, { size: 54, align: 'left' });
  const leads = [[HALE, 'TEACHER', X.dry], [VOL, 'KYLE · the volunteer', X.smug], [PARK, 'GUS · parking lot', X.delighted], [CHRIS, 'CHRISTOPHER', X.confused], [DONOR, 'VICTOR · donor card', X.deadpan]];
  leads.forEach(([ch, name, e], i) => {
    const x = 260 + i * 470; fillR(ctx, x - 200, 860, 400, 6, 'rgba(74,63,107,.25)');
    drawChar(ctx, ch, { ...pose(ch, { e: { ...ch.face, ...e } }), x, y: 860, s: 1.05 }, L);
    text(ctx, name, x, 905, { size: 32, col: P.ink });
  });
  const ex = [['proud', { ...X.relieved, sweat: 0, mS: .7 }], ['surprised', X.shocked], ['the stare', { ...X.deadpan, browAsym: .85, lidT: .38 }], ['delighted', { ...X.delighted, sweat: 0 }], ['embarrassed', X.embarrassed], ['despair', X.despair]];
  ex.forEach(([n, e], i) => { const x = 230 + i * 330; drawChar(ctx, VOL, { ...pose(VOL, { e: { ...VOL.face, ...e } }), x, y: 1420, s: .62 }, L); text(ctx, n, x, 1460, { size: 26, font: F.ui, col: P.inkSoft }); });
  const cl = [MAYA, LENA, PRIYA, NORA, BEN, TOM, SAM];
  cl.forEach((ch, i) => { const x = 2200 - (i % 2) * 140, y = 1000 + Math.floor(i / 2) * 0; });

}
export function sheet2(ctx, W, H) {
  ctx.fillStyle = lg(ctx, 0, 0, 0, H, ['#F6E4BE', '#EBCB98']); ctx.fillRect(0, 0, W, H);
  text(ctx, 'classmates', 60, 70, { size: 54, align: 'left' });
  [[MAYA, 'MAYA'], [LENA, 'LENA'], [PRIYA, 'PRIYA'], [NORA, 'NORA'], [BEN, 'BEN'], [TOM, 'TOM'], [SAM, 'SAM']].forEach(([ch, n], i) => {
    const x = 190 + i * 335; drawChar(ctx, ch, { ...pose(ch, { e: { ...ch.face, ...X.happy } }), x, y: 760, s: .9 }, L); text(ctx, n, x, 805, { size: 30 });
  });

}
