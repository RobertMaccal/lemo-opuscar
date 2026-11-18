// Model sheet: the two leads — turnaround, expressions, key poses, palette — drawn with the film's own rig.
import { P, F, rgba, fillR, fillRR, circ, text, line } from './kit.js';
import { drawChar, pose } from './rig.js';
import { X, HIM, HER, C_HIM, C_HER } from './cast.js';
import { mkL } from './shots.js';
import { sitO } from './staging.js';
const L = mkL(.62, .78, { rim: '#FFE2A8', rimA: .95, shadow: { kx: .5, ky: .16, a: .22, blur: 6, col: P.plum } });
const put = (g, ch, x, y, s, o, opt = {}) => drawChar(g, ch, { ...pose(ch, o), x, y, s }, L, opt);
const head = (g, ch, x, y, s, e, o = {}) => { g.save(); g.beginPath(); g.rect(x - 130, y - 150, 260, 250); g.clip(); put(g, ch, x, y + 380 * s, s, { e, ...o }, { noShadow: true }); g.restore(); };
export function sheetLeads(g, t, W, H) {
  g.fillStyle = '#FBF4E2'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(167,155,196,.18)'; g.lineWidth = 1; for (let x = 40; x < W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 40; y < H; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  text(g, 'THE 10-SECOND MASSAGE · MODEL SHEET', 70, 60, { size: 26, font: F.ui, weight: '600', col: P.lavDeep, align: 'left', ls: 2 });
  text(g, 'HIM & HER', 70, 128, { size: 86, align: 'left' }); fillRR(g, 70, 180, 300, 9, 4, P.orange);
  text(g, 'Golden Hour Stickman · indigo ink, cream heads, one bold colour each · rim light from the window (screen-left)', 2330, 130, { size: 30, font: F.hand, col: P.inkSoft, align: 'right' });
  // turnarounds
  const views = [['front', {}], ['3/4', { face: .5 }], ['profile', { face: 1.05 }], ['back', { head: { back: 1 } }]];
  views.forEach(([n, o], i) => {
    const x = 160 + i * 150; put(g, HIM, x, 820, .92, o); text(g, n, x, 860, { size: 24, font: F.ui, col: P.lavDeep });
    const x2 = 820 + i * 140; put(g, HER, x2, 820, .92, o); text(g, n, x2, 860, { size: 24, font: F.ui, col: P.lavDeep });
  });
  text(g, 'HIM · deep-blue hoodie', 160, 250, { size: 40, align: 'left', col: C_HIM }); text(g, 'HER · soft violet top, ponytail', 780, 250, { size: 40, align: 'left', col: C_HER });
  // expressions
  const eh = [['bliss', X.bliss], ['the idea', X.idea], ['caught', X.caught], ['awkward', X.awkward], ['bored', X.bored], ['proud', X.proud]];
  const ew = [['sweet', X.sweet], ['hopeful', X.hopeful], ['suspicious', X.suspicious], ['relaxed', X.relaxed], ['disbelief', X.disbelief], ['unimpressed', X.unimpressed]];
  text(g, 'EXPRESSIONS', 1440, 200, { size: 40, align: 'left' });
  eh.forEach(([n, e], i) => { const x = 1500 + (i % 3) * 290, y = 420 + Math.floor(i / 3) * 270; head(g, HIM, x, y, 1, e); text(g, n, x, y + 128, { size: 26, font: F.hand, col: P.inkSoft }); });
  ew.forEach(([n, e], i) => { const x = 1500 + (i % 3) * 290, y = 960 + Math.floor(i / 3) * 270; head(g, HER, x, y, 1, e); text(g, n, x, y + 128, { size: 26, font: F.hand, col: P.inkSoft }); });
  // key poses
  text(g, 'KEY POSES', 160, 950, { size: 40, align: 'left' });
  put(g, HIM, 230, 1420, .8, { face: .72, lean: .14, hipY: 26, shrug: .55, e: { ...X.sly, gx: -.9 }, head: { turn: -1.55 }, aL: { a: -.75, b: -.55, hand: 'open' }, aR: { to: [54, -372], k: -1, z: 1, hand: 'open' }, lL: { x: -40 }, lR: { x: 46, y: -36 } });
  text(g, 'the sneak', 230, 1460, { size: 26, font: F.hand, col: P.inkSoft });
  put(g, HIM, 520, 1420, .8, { shrug: .55, e: X.proud, aL: { a: -1.62, b: -1.5, hand: 'fist', z: 1 }, aR: { a: 1.62, b: 1.5, hand: 'fist', z: 1 } });
  text(g, 'the flex', 520, 1460, { size: 26, font: F.hand, col: P.inkSoft });
  put(g, HER, 800, 1420, .8, sitO(HER, { face: .55, lean: .3, e: { ...X.firm, gx: .9 }, aR: { to: [190, -230], k: 1, z: 1, l: 1.3, hand: 'fist' }, aL: { to: [6, -168], k: 1 } }));
  text(g, 'the catch', 800, 1460, { size: 26, font: F.hand, col: P.inkSoft });
  put(g, HER, 1080, 1420, .8, sitO(HER, { e: X.unimpressed, head: { turn: .5, tilt: -.1 }, aL: { to: [-16, -166], k: 1 }, aR: { to: [18, -166], k: -1 } }));
  text(g, 'the stare', 1080, 1460, { size: 26, font: F.hand, col: P.inkSoft });
  // palette
  const pal = [['ink', P.ink], ['cream', P.cream], ['sun', '#FFB25E'], ['teal', '#4F8A87'], ['lavender', P.lav], ['HIM', C_HIM], ['HER', C_HER]];
  pal.forEach(([n, c], i) => { const x = 1440 + i * 128; fillRR(g, x, 1430, 104, 34, 8, c); g.lineWidth = 3; g.strokeStyle = P.ink; g.strokeRect(x, 1430, 104, 34); text(g, n, x + 52, 1484, { size: 20, font: F.ui, col: P.inkSoft }); });
  text(g, 'PALETTE', 1440, 1400, { size: 30, align: 'left' });
}
