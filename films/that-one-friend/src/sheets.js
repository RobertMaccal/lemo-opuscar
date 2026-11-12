// Model sheets: the leads, their acting range, and the supporting cast. Drawn with the film rig.
import { P, F, mix, dark, rgba, rr, fillRR, fillR, circ, ell, line, lg, text, paperGrain, lightPatch, poly } from './kit.js';
import { drawChar, pose } from './rig.js';
import { X, YOU, JACK, PROF, TEACHER, COACH, STU_A, STU_B, light } from './cast.js';

const L0 = light();
function sheetBg(c, W, H, tag, title, sub) {
  fillR(c, 0, 0, W, H, P.paper);
  c.strokeStyle = rgba(P.lavLight, .5); c.lineWidth = 1.5; c.beginPath();
  for (let x = 40; x < W; x += 80) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 40; y < H; y += 80) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
  text(c, tag, 84, 74, { size: 27, font: F.ui, weight: '600', col: P.lavDeep, align: 'left', ls: 4 });
  text(c, title, 80, 150, { size: 96, col: P.ink, align: 'left' });
  text(c, sub, 86, 222, { size: 38, font: F.hand, col: P.inkSoft, align: 'left' });
  fillR(c, 84, 258, 300, 8, P.orange);
}
function panel(c, x, y, w, h, floor, o = {}) {
  c.save(); rr(c, x, y, w, h, 34); c.clip();
  c.fillStyle = lg(c, 0, y, 0, y + h, o.wall || ['#FBE6BC', '#F6D5A2']); c.fillRect(x, y, w, h);
  if (o.patch !== false) lightPatch(c, x + w * .5, y + 40, w * .34, floor - y - 150, -w * .1, { col: '#FFF1CC', a: .55, gap: 14, cols: 2, rows: 3, op: 'source-over' });
  fillR(c, x, floor, w, y + h - floor, o.floor || '#E9BE8B'); fillR(c, x, floor, w, 10, rgba(P.woodDark, .35));
  c.restore();
}
const fig = (c, ch, x, y, s, o = {}, L = L0, opt) => drawChar(c, ch, pose(ch, { x, y, s }, o), L, opt);
function note(c, s, x, y, tx, ty, align = 'left', size = 36) {
  line(c, x, y, tx, ty, P.ink, 2.6); circ(c, x, y, 6, P.ink);
  text(c, s, tx + (align === 'left' ? 12 : -12), ty, { size, font: F.hand, col: P.ink, align });
}
function swatch(c, x, y, w, h, col, name, hex) {
  fillRR(c, x, y, w, h, 14, col); c.lineWidth = 3; c.strokeStyle = P.ink; rr(c, x, y, w, h, 14); c.stroke();
  text(c, name, x + w / 2, y + h + 26, { size: 27, font: F.hand, col: P.ink }); text(c, hex, x + w / 2, y + h + 54, { size: 19, font: F.ui, col: P.lavDeep, ls: 1 });
}

// ---- sheet 1: the two leads ----
function clipTo(c, x, y, w, h, fn) { c.save(); rr(c, x, y, w, h, 34); c.clip(); fn(); c.restore(); }
function noteL(c, lines, tx, ty, x, y, size = 31) {     // text block on the left, leader to the right
  let wmax = 0; lines.forEach((s, i) => { text(c, s, tx, ty + i * size * 1.05, { size, font: F.hand, col: P.ink, align: 'left' }); c.font = `${size}px ${F.hand}`; wmax = Math.max(wmax, c.measureText(s).width); });
  const ly = ty + (lines.length - 1) * size * .52; line(c, tx + wmax + 12, ly, x, y, P.ink, 2.6); circ(c, x, y, 6, P.ink);
}
function noteR(c, lines, tx, ty, x, y, size = 31) {     // text block on the right, leader to the left
  lines.forEach((s, i) => text(c, s, tx, ty + i * size * 1.05, { size, font: F.hand, col: P.ink, align: 'left' }));
  const ly = ty + (lines.length - 1) * size * .52; line(c, tx - 12, ly, x, y, P.ink, 2.6); circ(c, x, y, 6, P.ink);
}
export function sheetLeads(c, t, W, H) {
  sheetBg(c, W, H, 'THAT ONE FRIEND AT SCHOOL  ·  VISUAL DEVELOPMENT', 'CHARACTER SHEET', 'the two leads — drawn by the same code rig that will animate the film');
  const FL = 1372, YX = 560, JX = 1090, S = 1.85;
  panel(c, 70, 300, 1440, 1230, FL);
  c.setLineDash([10, 12]); line(c, 250, FL - 968, 1330, FL - 968, rgba(P.lavDeep, .7), 2.5, 'butt'); line(c, 250, FL - 924, 1330, FL - 924, rgba(P.lavDeep, .45), 2.5, 'butt'); c.setLineDash([]);
  text(c, 'Jack is a little taller. Of course he is.', 1338, FL - 990, { size: 28, font: F.hand, col: P.lavDeep, align: 'right' });
  clipTo(c, 70, 300, 1440, 1230, () => {
    fig(c, YOU, YX, FL, S, { e: { ...X.worried, sweat: .5, gx: .35 }, aL: { a: -.2, b: .3 }, aR: { a: .16, b: -.2 }, head: { tilt: -.04 } });
    fig(c, JACK, JX, FL, S, { face: -.16, e: { gx: -.25, gy: .55 }, aL: { to: [-26, -318], k: 1, z: 1, prop: { n: 'phone', r: .22, back: 1 } }, aR: { a: .1, b: -.5 }, head: { nod: .5, tilt: .08 } });
  });
  text(c, 'YOU', YX, 1452, { size: 100, col: P.you }); text(c, 'JACK', JX, 1452, { size: 100, col: dark(P.jack, .3) });
  text(c, 'average student. trying his best. it shows.', YX, 1508, { size: 33, font: F.hand, col: P.inkSoft });
  text(c, 'never studies. good at everything. no idea.', JX, 1508, { size: 33, font: F.hand, col: P.inkSoft });
  noteL(c, ['messy hair,', 'one stubborn', 'cowlick'], 104, 430, 470, 520);
  noteL(c, ['big eyes + brows', 'do all the acting'], 104, 640, 478, 668);
  noteL(c, ['shoulders up:', 'always nervous'], 104, 800, 462, 836);
  noteL(c, ['deep-blue hoodie'], 104, 1000, 480, 990);
  noteL(c, ['white sneakers'], 104, 1300, 500, 1352);
  noteR(c, ['half-lidded,', 'tiny smile'], 1262, 560, 1150, 640);
  noteR(c, ['muted green', 'hoodie'], 1262, 800, 1178, 880);
  noteR(c, ['loose shoulders,', 'weight on one leg'], 1262, 1010, 1150, 1100);
  noteR(c, ['relaxed trousers,', 'soft sneakers'], 1262, 1250, 1150, 1330);
  text(c, 'phone: always', 826, 716, { size: 31, font: F.hand, col: P.ink }); line(c, 906, 730, 1000, 776, P.ink, 2.6); circ(c, 1000, 776, 6, P.ink);

  text(c, 'TURNAROUND', 1570, 330, { size: 44, col: P.ink, align: 'left' });
  const views = [['front', { face: 0 }], ['3/4', { face: .5 }], ['side', { face: 1 }], ['back', { face: 0, head: { back: 1 } }]];
  for (const [row, ch, y] of [[0, YOU, 760], [1, JACK, 1210]]) {
    panel(c, 1560, y - 380, 780, 420, y - 6, { patch: false, wall: ['#FBEBC8', '#F8DDB0'] });
    clipTo(c, 1560, y - 380, 780, 420, () => views.forEach(([n, o], i) => fig(c, ch, 1668 + i * 190, y - 6, .64, row ? { ...o, e: X.chill } : o)));
    views.forEach(([n], i) => text(c, n, 1668 + i * 190, y + 62, { size: 28, font: F.hand, col: P.inkSoft }));
  }
  text(c, 'PALETTE', 1570, 1330, { size: 44, col: P.ink, align: 'left' });
  const sw = [[P.sun, 'warm sunlight'], [P.orange, 'soft orange'], [P.cream, 'vintage cream'], [P.teal, 'muted teal'], [P.lav, 'dusty lavender'], [P.ink, 'deep indigo']];
  sw.forEach(([col, n], i) => swatch(c, 1566 + i * 132, 1370, 110, 92, col, n, col.toUpperCase()));
  paperGrain(c, W, H, .12);
}

// ---- sheet 2: acting range ----
function bust(c, ch, x, y, s, o, label, w = 250, h = 290) {
  c.save(); rr(c, x - w / 2, y - h + 40, w, h, 26); c.fillStyle = lg(c, 0, y - h, 0, y, ['#FBE8C0', '#F7D7A6']); c.fill(); c.clip();
  const ph = (ch.ul + ch.ll) * .992 + 12 + ch.torso + ch.neck + ch.R * .9 + 4;
  drawChar(c, ch, pose(ch, { x, y: y - 122 + ph * s, s }, o), { ...L0, shadow: null });
  c.restore(); c.lineWidth = 4; c.strokeStyle = P.ink; rr(c, x - w / 2, y - h + 40, w, h, 26); c.stroke();
  text(c, label, x, y + 76, { size: 32, font: F.hand, col: P.ink });
}
export function sheetActing(c, t, W, H) {
  sheetBg(c, W, H, 'THAT ONE FRIEND AT SCHOOL  ·  VISUAL DEVELOPMENT', 'ACTING RANGE', 'every face is a blend of the same eye / lid / brow / mouth controls — so they animate between each other');
  text(c, 'YOU', 84, 372, { size: 64, col: P.you, align: 'left' }); text(c, '— anxiety → shock → embarrassment → disbelief → frustration → resignation', 220, 376, { size: 32, font: F.hand, col: P.inkSoft, align: 'left' });
  const you = [['anxious', X.anxious, {}], ['relieved', X.relieved, { head: { tilt: .08 } }], ['“another… WHAT?”', X.horror, { sq: -.25 }], ['“I wrote a muscle.”', X.hollow, {}], ['mortified', X.mortified, { shrug: 1 }],
    ['“ha. he’s done.”', X.smug, { head: { tilt: -.1, turn: .35 } }], ['“HOW?!”', X.how, { sq: -.3 }], ['second place', X.deadpan, {}], ['“whatever, man.”', X.sigh, { head: { tilt: .1, nod: .4 } }]];
  you.forEach(([n, e, o], i) => bust(c, YOU, 196 + i * 251, 700, 1.02, { ...o, e }, n, 232, 290));
  text(c, 'JACK', 84, 892, { size: 64, col: dark(P.jack, .3), align: 'left' }); text(c, '— one setting: unbothered. He never smirks, never shows off, never notices.', 250, 896, { size: 32, font: F.hand, col: P.inkSoft, align: 'left' });
  const jack = [['default: chill', X.chill, {}], ['“hmm?”', X.hmm, { head: { tilt: .1 } }], ['“yeah, same here.”', X.jackTalk, { head: { nod: .5 }, e: { ...X.jackTalk, gy: .6 } }], ['genuinely confused', X.jackConfused, { head: { tilt: -.12 } }], ['yawn', X.yawn, { head: { tilt: .12 } }],
    ['“new high score.”', X.score, { head: { nod: .7 } }], ['friendly', X.friendly, {}]];
  jack.forEach(([n, e, o], i) => bust(c, JACK, 196 + i * 251, 1220, 1.02, { e, ...o, ...(o.e ? { e: o.e } : {}) }, n, 232, 290));
  // key poses on the right of Jack's row
  text(c, 'body language', 2048, 1010, { size: 34, font: F.hand, col: P.lavDeep });
  panel(c, 1850, 1040, 480, 290, 1296, { patch: false });
  clipTo(c, 1850, 1040, 480, 290, () => {
    fig(c, YOU, 1960, 1296, .46, { e: X.cooked, aL: { to: [-62, -462], k: -1 }, aR: { to: [62, -462], k: 1 }, shrug: 1, lL: { x: -14 }, lR: { x: 16 }, hipY: 14 });
    fig(c, JACK, 2200, 1296, .46, { e: X.jackConfused, shrug: 1, aL: { a: -.75, b: -1.25, hand: 'open' }, aR: { a: .75, b: 1.25, hand: 'open' } });
  });
  text(c, 'panic  /  “I’m just chill.”', 2090, 1372, { size: 28, font: F.hand, col: P.ink });
  paperGrain(c, W, H, .12);
}

// ---- sheet 3: supporting cast ----
export function sheetCast(c, t, W, H) {
  sheetBg(c, W, H, 'THAT ONE FRIEND AT SCHOOL  ·  VISUAL DEVELOPMENT', 'SUPPORTING CAST', 'same rig, same ink, quieter colours — they never out-shout the two hoodies');
  panel(c, 70, 300, W - 140, 860, 1040);
  const gy = 1040, s = 1.1;
  const cast = [
    [PROF, 270, { e: X.tired, aL: { to: [-46, -262], k: 1, prop: { n: 'paper', r: -.16 } } }, 'PROFESSOR', ['invigilator. has seen', 'everything. is tired.']],
    [TEACHER, 610, { e: X.dry, face: .16, aR: { to: [44, -292], k: -1, prop: { n: 'pointer', r: .9, len: 120 } }, aL: { a: -.5, b: .9 } }, 'TEACHER', ['anatomy. calm, dry.', 'hopes to catch Jack out.']],
    [COACH, 960, { e: { browA: -.3, mS: .3, mW: 1 }, aR: { to: [74, -326], k: -1, prop: { n: 'stopwatch' } }, aL: { a: -.6, b: .9 } }, 'COACH', ['“second place.” says it', 'like the weather.']],
    [STU_A, 1300, { e: { mS: .6, mO: .25 }, face: .2, aR: { a: .5, b: 1.5, hand: 'open' } }, 'STUDENT A', ['burgundy jacket.', 'compares answers.']],
    [STU_B, 1600, { e: { mS: .5, browH: .2 }, face: -.2 }, 'STUDENT B', ['butter-yellow jumper.', 'agrees.']],
  ];
  clipTo(c, 70, 300, W - 140, 860, () => {
    for (const [ch, x, o] of cast) fig(c, ch, x, gy, s, o);
    fig(c, YOU, 1960, gy, s, { e: X.neutral }); fig(c, JACK, 2170, gy, s, {});
  });
  for (const [ch, x, o, n, d] of cast) { text(c, n, x, gy + 176, { size: 46, col: P.ink }); d.forEach((l, i) => text(c, l, x, gy + 222 + i * 32, { size: 28, font: F.hand, col: P.inkSoft })); }
  text(c, 'YOU + JACK', 2065, gy + 176, { size: 46, col: P.lavDeep }); text(c, 'for scale', 2065, gy + 222, { size: 28, font: F.hand, col: P.inkSoft });
  paperGrain(c, W, H, .12);
}
