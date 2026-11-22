// The Syringe: English remake. Timeline, shots, captions.
let WORDS = [], T0 = [];
const w = i => T0[i];
let DUR = 102.6, END0 = 96.45, GRID0 = 98.35, THUMB_T = [];
const EV = []; // sound cues {t,type,gain}
function ev(t, type, gain = 1) { EV.push({ t: +t.toFixed(3), type, gain }); }

// ---------- camera helpers ----------
function zoomAbout(cx, cy, z) { X.translate(cx, cy); X.scale(z, z); X.translate(-cx, -cy); }
const SHAKES = [];
function shake(t) {
  let dx = 0, dy = 0;
  for (const [te, a] of SHAKES) if (t >= te && t < te + .6) { const d = t - te, e = a * Math.exp(-d * 9); dx += Math.sin(d * 63) * e; dy += Math.cos(d * 51) * e; }
  return [dx, dy];
}

// ---------- shots ----------
// each: {t0, t1, tr:'slide'|'fade'|'cut', z:[z0,z1], cx, cy, draw(t)}
let SHOTS = [];
function buildShots() {
  SHOTS = [
    // 1 HOOK: verdict at the dock
    { t0: 0, t1: w(12) - .05, tr: 'cut', z: [1, 1.03], cy: 880, draw(t) {
      const k0 = eo(seg(t, 0, .9));
      X.save(); zoomAbout(540, 760, lerp(1.32, 1, k0));
      floorLine(1352);
      const st = w(7);
      const after = t > st;
      student(540, 1250, 1.25, { pose: 'dock', mouth: after ? 'frown' : 'worry', brow: 'worry', sweat: true, shock: after && t < st + .9, nosteth: false });
      dock(540, 1000, 780, 1, { h: 330 });
      for (const s of [-1, 1]) shape(EL(540 + s * 112, 1004, 30, 26, 16), { fill: '#fff', lw: 5, seed: 500 + s });
      X.restore();
      tag(250, 470, 'Germany', { fill: 'grey', size: 38, k: pop(t, w(4) - .1) });
      // stamp slams
      const ks = t < st - .05 ? 0 : lerp(2.6, 1, eo(seg(t, st - .05, st + .13)));
      if (ks) X.globalAlpha = clamp((t - st + .05) / .08, 0, 1);
      stamp(720, 380, ks, 'GUILTY', '§ 222 StGB');
      X.globalAlpha = 1;
      tag(720, 545, 'Negligent homicide', { size: 34, k: pop(t, w(9) - .05) });
    } },
    // 2 up to five years
    { t0: w(12) - .05, t1: w(18) - .1, tr: 'slide', z: [1, 1.04], draw(t) {
      floorLine(1352);
      banner(540, 360, 'Up to 5 years in prison', { size: 44, k: pop(t, w(14) - .15), sub: '§ 222 German Criminal Code', subSize: 28 });
      student(540, 1330, 1.05, { mouth: 'worry', brow: 'worry', sweat: t > w(15) });
      const d = eo(seg(t, w(15) - .05, w(15) + .25));
      if (d > 0) bars(540, 560, 600, 790, d);
    } },
    // 3 the reason: mystery syringe, real case, one sentence
    { t0: w(18) - .1, t1: w(42) - .15, tr: 'slide', z: [1, 1.05], draw(t) {
      banner(540, 330, 'The reason?', { size: 50, k: pop(t, w(18)) });
      tag(540, 470, 'Real case', { size: 34, k: pop(t, w(35) - .1) });
      const bobA = Math.sin(t * 2.2) * 10, bobB = Math.cos(t * 1.9) * 10;
      qmark(80, 560 + bobA, 1.2, fadeIn(t, w(18) + .2)); qmark(1000, 470 + bobB, .9, fadeIn(t, w(18) + .4));
      qmark(960, 1180 - bobA, .7, fadeIn(t, w(21) + .4) * .8);
      const inK = eo(seg(t, w(21) - .2, w(21) + .35)), outK = eio(seg(t, w(40) - .25, w(40) + .3));
      const sx = lerp(-700, 600, inK) - outK * 1500;
      const milk = t > w(25) - .1;
      if (inK > 0 && outK < 1) {
        syringe(sx, 900, 1.08, { rot: -.13, fill: milk ? 'milk' : 'hatch', label: t > w(21) + .2, plunger: milk ? 0 : 0 });
        if (milk) { const g = 1 - seg(t, w(25) - .1, w(25) + .5); if (g > 0) { X.save(); X.globalAlpha = g * .9; X.fillStyle = YEL; X.beginPath(); X.ellipse(sx, 900, 240 * (1 + (1 - g) * .4), 90, -.13, 0, 6.283); X.fill(); X.restore(); } }
      }
      tag(sx + 40, 1110, 'No label', { fill: 'grey', size: 38, k: pop(t, w(28) - .1) * (1 - outK), sub: 'nothing written on it' });
      // one sentence: three empty word boxes
      const xs = [220, 540, 860];
      xs.forEach((bx, i) => wordBox(bx, 900, 270, 150, i === 0 ? '?' : '', { k: pop(t, w(40) + .05 + i * .18), yel: i === 2, seed: i }));
    } },
    // 4 Bielefeld + baby
    { t0: w(42) - .15, t1: w(51) - .1, tr: 'slide', z: [1, 1.04], draw(t) {
      banner(540, 330, 'Bielefeld · 2011', { size: 48, k: pop(t, w(42) - .05), sub: 'Germany · pediatric cancer ward', subSize: 30 });
      const m = eio(seg(t, w(43) - .2, w(43) + .45));
      const mx = lerp(300, 640, m), my = lerp(540, 520, m), mw = lerp(560, 330, m), mh = lerp(760, 448, m);
      germany(mx, my, mw, mh, seg(t, w(42) - .1, w(42) + .6));
      if (t > w(42) + .5) {
        dotFill(mx + .77 * mw, my + .32 * mh, 9 * lerp(1, .7, m)); txt('Berlin', mx + .77 * mw, my + .32 * mh - 30 * lerp(1, .7, m), { size: 34 * lerp(1, .7, m) });
        pin(mx + .30 * mw, my + .36 * mh, pop(t, w(42) + .5) * lerp(1, .6, m));
        tag(lerp(200, 360, m) + 0, lerp(760, 610, m), 'Bielefeld', { size: lerp(40, 30, m), k: pop(t, w(42) + .65) });
      }
      const a = fadeIn(t, w(43) - .1, .4);
      if (a > 0) {
        X.save(); X.globalAlpha = a; floorLine(1352);
        crib(150, 1352, 360, 1, { baby: false });
        mother(330, 1352, 1.1, { pose: 'hold' });
        X.restore();
        tag(800, 1000, '10 months', { size: 40, k: pop(t, w(44)) });
        tag(800, 1130, 'Leukemia', { size: 40, k: pop(t, w(49) - .05), sub: 'blood cancer' });
      }
    } },
    // 5 the student arrives
    { t0: w(51) - .1, t1: w(64) - .05, tr: 'slide', z: [1, 1.04], draw(t) {
      banner(540, 330, 'The student', { size: 50, k: pop(t, w(51) + .05) });
      floorLine(1352);
      const wk = seg(t, w(51) + .1, w(51) + 1.3);
      const x = lerp(-200, 360, eo(wk));
      student(x, 1352, 1.3, { walk: wk < 1 ? t * 9 : null, mouth: 'smile' });
      tag(790, 640, 'PJ · 29 years', { fill: 'grey', size: 36, k: pop(t, w(53) - .1), sub: 'final-year medical student', subSize: 26 });
      tag(790, 860, 'Week 1', { size: 42, k: pop(t, w(60) - .1), sub: 'on the ward', subSize: 28 });
    } },
    // 6 the misunderstanding
    { t0: w(64) - .05, t1: w(84) - .1, tr: 'slide', z: [1, 1.03], draw(t) {
      const pan = eio(seg(t, w(71) - .15, w(71) + .5));
      X.save(); X.translate(-560 * pan, 0);
      floorLine(1352, -40, 1700);
      nurse(380, 1352, 1.25, { pose: 'point', mouth: (t > w(65) && t < w(70) + .4) ? 'talk' : 'smile', t });
      const kb = pop(t, w(69) - .1);
      if (kb > 0) at(470, 500, kb, 0, () => { speech(0, 0, 400, 150, -60, 230); txt('Blood draw', 0, 4, { size: 54 }); });
      student(1100, 1352, 1.25, { mouth: t > w(77) ? 'line' : 'smile', brow: t > w(83) ? 'up' : null });
      const kc = pop(t, w(73) - .05);
      if (kc > 0) {
        const grow = eo(seg(t, w(77) - .1, w(77) + .3));
        at(1100, 500, kc, 0, () => {
          const cw = lerp(360, 640, grow);
          cloud(0, 0, cw, 230, -10, 200);
          if (grow < .5) txt('Blood', 0, 0, { size: 60, color: `rgba(27,27,29,${1 - grow * 2})` });
          if (grow > 0) {
            X.save(); X.globalAlpha = grow;
            txt('Blood', -170, -6, { size: 54 }); txt('+', -80, -6, { size: 54 });
            const hk = seg(t, w(83) - .05, w(83) + .2);
            if (hk > 0) shape(RR(-50, -42, 260 * hk, 74, 30), { fill: YEL, stroke: null, seed: 600 });
            txt('Refobacin', 80, -6, { size: 54 });
            txt('IV antibiotic', 80, 50, { size: 26, fam: SANS, weight: 800, color: '#444' });
            X.restore();
          }
        });
      }
      X.restore();
    } },
    // 7 syringe set down; the mother speaks
    { t0: w(84) - .1, t1: w(103) - .1, tr: 'slide', z: [1, 1.035], draw(t) {
      floorLine(1352);
      mother(135, 1352, .98, { pose: 'hold' });
      student(405, 1352, 1.0, { pose: 'back' });
      cabinet(690, 1352, 1.05, { items: true, syr: t > w(88) });
      if (t > w(88) && t < w(88) + .35) { const k = 1 - seg(t, w(88), w(88) + .35); alarmLines(670, 1050, k); }
      nurse(950, 1352, 1.0, { pose: t < w(91) + .5 ? 'point' : 'stand', mouth: (t > w(95) - .1 && t < w(102) + .5) ? 'talk' : 'smile', t });
      tag(690, 860, 'No eye contact', { fill: 'grey', size: 30, k: pop(t, w(90) - .1) * (1 - seg(t, w(92) - .2, w(92))) });
      tag(850, 380, 'per the verdict', { fill: 'grey', size: 30, k: pop(t, w(92) - .1) });
      const kb = pop(t, w(94) - .05);
      if (kb > 0) at(560, 560, kb, 0, () => {
        speech(0, 0, 760, 230, 380, 300);
        const hk = seg(t, w(101) - .1, w(101) + .2);
        const ow = tw('oral', 58);
        // "Here's the oral" centred, highlight on oral
        const l1 = "Here's the ", l1w = tw(l1, 58), tot = l1w + ow, x0 = -tot / 2;
        if (hk > 0) shape(RR(x0 + l1w - 10, -76, (ow + 20) * hk, 70, 26), { fill: YEL, stroke: null, seed: 610 });
        txt(l1, x0, -40, { size: 58, align: 'left' }); txt('oral', x0 + l1w, -40, { size: 58, align: 'left' });
        txt('antibiotic.', 0, 34, { size: 58 });
      });
    } },
    // 8 "that's the Refobacin"
    { t0: w(103) - .1, t1: w(113) - .1, tr: 'slide', z: [1, 1.06], cy: 760, draw(t) {
      floorLine(1352);
      student(540, 1352, 1.2, { pose: 'hold', mouth: 'line', brow: 'angry' });
      const kc = pop(t, w(109) - .05);
      if (kc > 0) at(560, 470, kc, 0, () => { cloud(0, 0, 440, 190, 10, 230); txt('Refobacin?', 0, 2, { size: 58 }); });
    } },
    // 9 STOP: what would you do?
    { t0: w(113) - .1, t1: w(122) - .1, tr: 'slide', z: [1, 1.04], draw(t) {
      floorLine(1352);
      student(310, 1352, 1.08, { pose: 'hold', mouth: 'worry', brow: 'worry' });
      at(300, 560, 1, 0, () => { cloud(0, 0, 330, 140, 10, 170); txt('Refobacin?', 0, 2, { size: 44 }); });
      tag(790, 430, 'STOP', { size: 70, k: pop(t, w(113) - .05), rot: .08, padX: 34 });
      tag(790, 760, 'A · Inject', { fill: 'grey', size: 44, k: pop(t, w(118) - .1) });
      tag(790, 910, 'B · Ask', { size: 44, k: pop(t, w(121) - .1) });
    } },
    // 10 the injection: syringe pushed into the IV line's port, syrup runs down the tube to the baby
    { t0: w(122) - .1, t1: w(139) - .1, tr: 'slide', z: [1, 1.07], cy: 1150, draw(t) {
      floorLine(1352);
      crib(330, 1352, 520, 1, {});
      const push = eio(seg(t, w(123), w(129) + .3));
      ivSet(seg(t, w(124), w(130) + .6));
      student(930, 1352, 1.05, { pose: 'ivpush', pl: push * 190, mouth: 'line', brow: 'angry' });
      tag(470, 980, 'IV line', { fill: 'grey', size: 36, k: pop(t, w(128) - .1), sub: 'straight into the vein', subSize: 24 });
      tag(540, 470, 'Syrup', { fill: 'grey', size: 40, k: pop(t, w(134) - .1), sub: 'meant for the mouth' });
      tag(540, 640, 'oral ≠ IV', { size: 52, k: pop(t, w(137) - .1), sub: 'by mouth ≠ into the vein' });
    } },
    // 11 08:46 blue baby + doctors rush in
    { t0: w(139) - .1, t1: w(158) - .1, tr: 'slide', z: [1, 1.05], cy: 1000, draw(t) {
      const blue = t > w(148) - .1;
      const vig = blue ? .28 * seg(t, w(148) - .1, w(148) + .4) * (.8 + .2 * Math.sin(t * 6)) : 0;
      floorLine(1352);
      monitor(150, 720, .85, t, { irregular: blue, rate: blue ? 2.2 : 1.2, badge: blue ? '!' : null, alarm: blue ? .6 + .4 * Math.sin(t * 12) : 0 });
      crib(470, 1352, 560, 1, { blue, gasp: blue });
      const nIn = eo(seg(t, w(141) - .1, w(141) + .8));
      const nx = lerp(1250, 830, nIn);
      nurse(nx, 1352, 1, { walk: nIn < 1 && nIn > 0 ? t * 9 : null, pose: blue ? 'lean' : 'stand', shock: blue, mouth: blue ? 'o' : 'smile', alarm: blue ? .6 + .4 * Math.sin(t * 10) : 0 });
      const dIn = eo(seg(t, w(152) - .05, w(152) + .6));
      if (dIn > 0) {
        student(lerp(1300, 1010, dIn), 1352, .95, { hair: 'senior', glasses: true, mouth: 'o', shock: true, walk: dIn < 1 ? t * 11 : null, badge: 'Dr' });
        tag(990, 760, 'Senior physician', { fill: 'grey', size: 30, k: pop(t, w(152) + .2) });
      }
      banner(540, 300, '08:46', { size: 70, k: pop(t, w(145) - .1) });
      if (t > w(146)) { X.save(); X.globalAlpha = fadeIn(t, w(146), .3); txt('The baby turns blue, fighting for air', 540, 430, { size: 32, fam: SANS, weight: 900 }); X.restore(); }
      tag(540, 560, 'Intensive care!', { size: 40, k: pop(t, w(156) - .05) });
      if (vig > 0) { const g = X.createRadialGradient(540, 900, 400, 540, 900, 1250); g.addColorStop(0, 'rgba(60,60,60,0)'); g.addColorStop(1, `rgba(60,60,60,${vig})`); X.fillStyle = g; X.fillRect(-200, -200, W + 400, H + 400); }
    } },
    // 12 ICU: 3.5 hours of resuscitation
    { t0: w(158) - .1, t1: w(165) - .1, tr: 'slide', z: [1, 1.03], draw(t) {
      tag(540, 330, 'ICU · intensive care', { fill: 'grey', size: 40, k: pop(t, w(158)) });
      const p = eio(seg(t, w(158) + .2, w(165) - .4));
      const hrs = lerp(9 + 4 / 60, 12 + 27 / 60, p);
      clock(330, 760, 150, hrs);
      const hh = Math.floor(hrs), mm = Math.floor((hrs - hh) * 60 + 1e-6);
      txt(String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), 330, 990, { size: 80 });
      monitor(770, 760, .9, t, { nostand: true, irregular: true, rate: 2, badge: '!', alarm: .6 + .4 * Math.sin(t * 12) });
      tag(540, 1180, 'Resuscitation · 3.5 h', { fill: 'grey', size: 42, k: pop(t, w(162) - .1) });
    } },
    // 13 12:28: the baby died
    { t0: w(165) - .1, t1: w(171) - .1, tr: 'fade', z: [1, 1.06], cy: 1000, draw(t) {
      X.save(); X.fillStyle = 'rgba(70,70,70,.07)'; X.fillRect(-200, -200, W + 400, H + 400); X.restore();
      floorLine(1352);
      monitor(160, 860, .8, t, { flat: seg(t, w(166) - .2, w(166) + .4), badge: '0' });
      crib(470, 1352, 540, 1, {});
      mother(840, 1352, .95, { pose: 'grief' });
      const k = pop(t, w(166) - .1);
      if (k > 0) at(540, 310, k, 0, () => txt('12:28', 0, 0, { size: 130 }));
      if (t > w(169) - .1) { X.save(); X.globalAlpha = fadeIn(t, w(169) - .1, .5); txt('The baby died.', 540, 450, { size: 60 }); X.restore(); }
    } },
    // 14 next day: oral syringes
    { t0: w(171) - .1, t1: w(180) - .1, tr: 'fade', z: [1, 1.03], draw(t) {
      calendar(540, 440, pop(t, w(171) - .05) * .95, { day: '23', month: 'August 2011' });
      if (t > w(172)) { X.save(); X.globalAlpha = fadeIn(t, w(172), .3); txt('The next day', 540, 640, { size: 42 }); X.restore(); }
      const sIn = eo(seg(t, w(174) - .2, w(174) + .3));
      if (sIn > 0) syringe(lerp(-500, 520, sIn), 860, .62, { needle: true });
      const x1 = seg(t, w(176), w(176) + .25), x2 = seg(t, w(176) + .25, w(176) + .5);
      if (x1 > 0) line([[290, 760], [790, 960]], { lw: 12, prog: x1, seed: 700 });
      if (x2 > 0) line([[790, 760], [290, 960]], { lw: 12, prog: x2, seed: 701 });
      const oIn = eo(seg(t, w(178) - .2, w(178) + .35));
      if (oIn > 0) syringe(lerp(1500, 560, oIn), 1110, .62, { oral: true, amber: true, text: 'ORAL' });
      tag(560, 1250, 'Oral syringe', { size: 36, k: pop(t, w(178) + .2) });
    } },
    // 15 court 2012: the judge's sentence
    { t0: w(180) - .1, t1: w(198) - .1, tr: 'slide', z: [1, 1.04], draw(t) {
      const qk = pop(t, w(189) - .15);
      const hdr = 1 - seg(t, w(189) - .3, w(189) - .1);
      if (hdr > 0) {
        X.save(); X.globalAlpha = hdr;
        tag(540, 330, 'Negligent homicide · 2012', { fill: 'grey', size: 38, k: pop(t, w(180)), sub: 'German criminal court', subSize: 26 });
        const swap = seg(t, w(184) - .1, w(184) + .1);
        if (swap < 1) tag(540, 520, 'Charge: negligent homicide', { size: 38, k: pop(t, w(182) - .1) * (1 - swap) });
        tag(540, 520, 'On appeal', { size: 44, k: pop(t, w(184) - .05) });
        X.restore();
      }
      const talking = t > w(186) && t < w(197) + .5;
      judge(540, 1080, 1.1, { mouth: talking ? 'talk' : 'line', t });
      dock(540, 1010, 780, 1, { h: 320 });
      const gb = w(183);
      const ga = t < gb - .25 ? -.9 : t < gb ? lerp(-.9, -1.5, seg(t, gb - .25, gb)) : lerp(-.15, -.9, eo(seg(t, gb, gb + .5)));
      gavel(800, 990, 1.05, ga);
      if (qk > 0) at(540, 395, qk, 0, () => {
        card(0, 0, 940, 330);
        const words1 = [['“The', 189], ['defendant', 190], ['should,', 191]], words2 = [['at', 192], ['the', 193], ['very', 194], ['least,', 195]], words3 = [['have', 196], ['asked.”', 197]];
        const rows = [words1, words2, words3];
        rows.forEach((row, ri) => {
          const sz = 58, gap = 16;
          const tot = row.reduce((a, [s]) => a + tw(s, sz), 0) + gap * (row.length - 1);
          let x = -tot / 2; const y = -95 + ri * 92;
          for (const [s, idx] of row) {
            const ww = tw(s, sz);
            const shown = t >= w(idx) - .05;
            if (idx === 197 && shown) { const hk = seg(t, w(197), w(197) + .25); shape(RR(x - 10, y - 38, (ww + 20) * hk, 74, 26), { fill: YEL, stroke: null, seed: 720 }); }
            txt(s, x, y, { size: sz, align: 'left', color: shown ? INK : '#cfcec8' });
            x += ww + gap;
          }
        });
      });
    } },
    // 16 parents leave; they wanted prison
    { t0: w(198) - .1, t1: w(205) - .1, tr: 'slide', z: [1, 1.04], draw(t) {
      floorLine(1352);
      door(250, 1352, 1);
      const p = seg(t, w(198), w(202) + .3);
      const fade = 1 - seg(t, w(202) - .1, w(202) + .4);
      X.save(); X.globalAlpha = fade;
      father(lerp(720, 330, eio(p)), 1352, .86, { walk: p < 1 ? t * 8 : null });
      mother(lerp(560, 230, eio(p)), 1352, .84, { walk: p < 1 ? t * 8 + 1.5 : null });
      X.restore();
      const kh = pop(t, w(202) - .1);
      if (kh > 0) at(540, 420, kh, 0, () => {
        const a = 'They wanted ', b = 'prison.', sz = 70, wa = tw(a, sz), wb = tw(b, sz), x0 = -(wa + wb) / 2;
        shape(RR(x0 + wa - 12, -46, wb + 24, 88, 30), { fill: YEL, stroke: null, seed: 730 });
        txt(a, x0, 0, { size: sz, align: 'left' }); txt(b, x0 + wa, 0, { size: sz, align: 'left' });
      });
      const sa = fadeIn(t, w(203), .4);
      if (sa > 0) { X.save(); X.globalAlpha = sa; student(880, 1352, .9, { mouth: 'frown', brow: 'worry' }); X.restore(); }
    } },
    // 17 license kept, verdict on record
    { t0: w(205) - .1, t1: w(217) - .1, tr: 'slide', z: [1, 1.05], draw(t) {
      floorLine(1352);
      student(540, 1352, 1.3, { mouth: 'frown', brow: 'worry' });
      tag(540, 360, 'Medical license ✓', { size: 54, k: pop(t, w(208) - .1), sub: 'not revoked', subSize: 28 });
      tag(540, 580, 'Criminal record', { fill: 'grey', size: 50, k: pop(t, w(212) - .1), sub: 'the verdict stays on file', subSize: 26 });
    } },
    // 18 one sentence -> What's in it? -> checklist -> asking is allowed
    { t0: w(217) - .1, t1: END0, tr: 'slide', z: [1, 1.02], draw(t) {
      const xs = [215, 540, 865], labels = ["What's", 'in', 'it?'];
      xs.forEach((bx, i) => {
        const k = pop(t, [w(217), w(218), w(221)][i] - .05);
        const fl = w(225) + i * .16;
        const sq = t < fl ? 1 : Math.abs(Math.cos(seg(t, fl, fl + .3) * Math.PI));
        const named = t >= fl + .15;
        if (k > 0) at(bx, 320, 1, 0, () => { X.scale(k, k * sq); wordBox(0, 0, 290, 150, named ? labels[i] : '?', { yel: i === 2, seed: i, size: 70 }); });
      });
      if (t > w(217)) { X.save(); X.globalAlpha = fadeIn(t, w(217), .3) * (1 - seg(t, w(225), w(225) + .2)); txt('One sentence…', 540, 470, { size: 46 }); X.restore(); }
      if (t > w(225) + .3) { X.save(); X.globalAlpha = fadeIn(t, w(225) + .3, .3); txt('Ask before you inject.', 540, 470, { size: 40, fam: SANS, weight: 900 }); X.restore(); }
      const rows = [
        [w(232) - .1, 'Filled it yourself?', 'did you draw it up?'],
        [w(235) - .1, 'Labeled?', 'is anything written on it?'],
        [w(241) - .1, 'No? → Ask!', 'what exactly is in it?'],
        [w(245) - .1, 'Only then, inject.', ''],
      ];
      rows.forEach(([tt, a, b], i) => {
        const y = 610 + i * 138, k = pop(t, tt);
        checkbox(130, y, i + 1, k);
        if (k > 0) {
          X.save(); X.globalAlpha = clamp(k, 0, 1); const dx = (1 - clamp(k, 0, 1)) * 40;
          if (i === 2) { const wa = tw('No? → ', 54); shape(RR(185 + dx + wa - 8, y - 36, tw('Ask!', 54) + 16, 66, 24), { fill: YEL, stroke: null, seed: 740 }); }
          txt(a, 185 + dx, y, { size: 54, align: 'left' });
          if (b) txt(b, 188 + dx, y + 50, { size: 28, fam: SANS, weight: 800, color: '#555', align: 'left' });
          X.restore();
        }
      });
      banner(540, 1210, 'Asking is allowed.', { size: 46, k: pop(t, w(257) - .1), sub: 'A question was never shameful.', subSize: 28 });
    } },
  ];
  // sound cues for transitions and pops
  SHOTS.forEach((s, i) => { if (i && s.tr === 'slide') ev(s.t0, 'whoosh', .6); });
}

function drawShot(s, t) {
  X.save();
  const z = lerp(s.z[0], s.z[1], ss(seg(t, s.t0, s.t1 + .5)));
  zoomAbout(540, s.cy || 900, z);
  s.draw(t);
  X.restore();
}
function drawScene(t) {
  paper();
  const [sx, sy] = shake(t);
  X.save(); X.translate(sx, sy);
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i].t0) i--;
  const cur = SHOTS[i], prev = SHOTS[i - 1];
  const TD = .45, k = prev ? seg(t, cur.t0, cur.t0 + (cur.tr === 'fade' ? .5 : TD)) : 1;
  if (prev && k < 1 && cur.tr !== 'cut') {
    if (cur.tr === 'slide') {
      const e = eio(k);
      X.save(); X.translate(-W * e, 0); drawShot(prev, t); X.restore();
      X.save(); X.translate(W * (1 - e), 0); drawShot(cur, t); X.restore();
    } else {
      drawShot(prev, t);
      X.save(); X.globalAlpha = ss(k);
      X.fillStyle = PAPER; X.fillRect(-100, -100, W + 200, H + 200);
      paperDots(); drawShot(cur, t); X.restore();
    }
  } else drawShot(cur, t);
  X.restore();
}
function paperDots() { X.fillStyle = '#cfcdc3'; for (let y = 18; y < H; y += 46) for (let x = 18; x < W; x += 46) { X.beginPath(); X.arc(x, y, 2.6, 0, 6.283); X.fill(); } }

// ---------- captions ----------
let CHUNKS = [];
function buildChunks() {
  let cur = [];
  const push = () => { if (cur.length) CHUNKS.push(cur); cur = []; };
  WORDS.forEach((wd, i) => {
    cur.push(wd);
    const s = wd.w, chars = cur.map(x => x.w).join(' ').length;
    const next = WORDS[i + 1];
    if (/[.?!]$/.test(s) || (/[,:]$/.test(s) && cur.length >= 2) || cur.length >= 4 || chars > 20 || (next && next.t0 - wd.t1 > .45)) push();
  });
  push();
  CHUNKS = CHUNKS.map((c, i) => ({ words: c, t0: c[0].t0 - .08, t1: i < CHUNKS.length - 1 ? CHUNKS[i + 1][0].t0 - .08 : c[c.length - 1].t1 + .9 }));
}
function drawCaption(t) {
  const c = CHUNKS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const sz = 62, gap = 18, cy = 1440;
  const ws = c.words.map(x => tw(x.w, sz));
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  const cw = tot + 70, ch = 108;
  const k = lerp(.9, 1, back(seg(t, c.t0, c.t0 + .25), 2.5));
  at(540, cy, k, 0, () => {
    const p = RR(-cw / 2, -ch / 2, cw, ch, 16);
    shadowShape(p, 6, 7, .16);
    shape(p, { fill: '#fff', lw: 4.5, seed: 800 + c.t0 });
    tape(-cw / 2 + 40, -ch / 2 + 2, 74, 28, -.2);
    let x = -tot / 2;
    c.words.forEach((wd, i) => {
      const curW = t >= wd.t0 - .04 && (i === c.words.length - 1 ? true : t < c.words[i + 1].t0 - .04);
      const past = t >= wd.t0 - .04;
      if (curW) { const hk = eo(seg(t, wd.t0 - .04, wd.t0 + .1)); shape(RR(x - 9, -36, (ws[i] + 18) * hk, 72, 12), { fill: YEL, stroke: null, seed: 900 + i }); }
      txt(wd.w, x, 4, { size: sz, align: 'left', color: past ? INK : '#c6c5bf' });
      x += ws[i] + gap;
    });
  });
}

// ---------- end: shrink to card, zoom out to case-file grid ----------
const OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H;
let THUMBS = null;
function renderInto(canvas, t) {
  const main = X; setCtx(canvas.getContext('2d'));
  X.setTransform(1, 0, 0, 1, 0, 0); drawScene(t); drawCaption(t);
  setCtx(main);
}
function makeThumbs() {
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  THUMBS = THUMB_T.map(tt => { const c = document.createElement('canvas'); c.width = W / 2; c.height = H / 2; const g = c.getContext('2d'); renderInto(tmp, tt); g.drawImage(tmp, 0, 0, W / 2, H / 2); return c; });
}
function cardFrame(x, y, w, h, img) {
  const p = RR(x - w / 2, y - h / 2, w, h, 24 * w / W);
  shadowShape(p, 10 * w / W + 3, 12 * w / W + 3, .18);
  X.save(); tracePath(p, true); X.clip(); X.drawImage(img, x - w / 2, y - h / 2, w, h); X.restore();
  shape(p, { stroke: INK, lw: Math.max(3, 9 * w / W), seed: 950 });
}
function drawEnd(t) {
  renderInto(OFF, Math.min(t, GRID0 - .05));
  paper();
  // grid geometry
  const cols = 4, tw0 = 216, th0 = 384, gx = 22, gy = 22, gw = cols * tw0 + (cols - 1) * gx;
  const ox = (W - gw) / 2 + tw0 / 2, oy = 640;
  const cells = []; for (let i = 0; i < 12; i++) cells.push([ox + (i % cols) * (tw0 + gx), oy + Math.floor(i / cols) * (th0 + gy)]);
  const last = cells[11];
  // phase A: full frame -> card at 0.82
  const a = eio(seg(t, END0, END0 + .7));
  const s1 = lerp(1, .8, a);
  // phase B: zoom out: camera from last cell (scale s1/(tw0/W)) to grid
  const b = eio(seg(t, GRID0, GRID0 + 1.6));
  const camS = lerp(s1 * W / tw0, 1, b);
  const cx = lerp(last[0], W / 2, b), cy = lerp(last[1], H / 2 + 40, b);
  X.save();
  X.translate(W / 2, H / 2); X.scale(camS, camS); X.translate(-cx, -cy);
  if (b > 0) {
    if (!THUMBS) makeThumbs();
    for (let i = 0; i < 11; i++) { const [x, y] = cells[i]; cardFrame(x, y, tw0, th0, THUMBS[i]); }
  }
  if (a < .02) { X.restore(); X.drawImage(OFF, 0, 0); return; }
  cardFrame(last[0], last[1], tw0, th0, OFF);
  X.restore();
  // header
  banner(540, 250, 'CASE FILE 01', { size: 54, k: pop(t, GRID0 + 1.2), sub: 'The Syringe · Bielefeld, 2011', subSize: 30 });
  // fade to black
  const f = seg(t, DUR - .9, DUR - .05);
  if (f > 0) { X.fillStyle = `rgba(0,0,0,${ss(f)})`; X.fillRect(0, 0, W, H); }
}

// ---------- main ----------
function render(t) {
  X.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= END0) drawEnd(t);
  else { drawScene(t); drawCaption(t); }
}
window.render = render;

(async () => {
  WORDS = await (await fetch('words.json')).json();
  let last = 0; for (const wd of WORDS) { for (let i = last; i <= wd.i; i++) T0[i] = wd.t0; last = wd.i + 1; }
  T0[269] = T0[269] ?? WORDS[WORDS.length - 1].t0;
  const lastW = WORDS[WORDS.length - 1];
  END0 = w(262) - .08; GRID0 = lastW.t1 + .15; DUR = GRID0 + 4.25; window.DUR = DUR;
  THUMB_T = [w(11) - .2, w(18) - .3, w(32) - .4, w(51) - .3, w(84) - .4, w(103) - .3, w(122) - .2, w(139) - .3, w(152) - .4, w(171) - .35, w(198) - .35];
  buildShots(); buildChunks();
  // shakes + sound cues
  SHAKES.push([w(7) + .1, 14], [w(15) + .2, 9], [w(183), 8]);
  ev(0, 'hit', .7);
  ev(w(7) + .05, 'stamp', 1); ev(w(15) + .15, 'clank', .9); ev(w(21) - .1, 'whoosh', .5);
  ev(w(25) - .05, 'sparkle', .5); ev(w(40) - .2, 'whoosh', .5);
  for (const i of [0, 1, 2]) ev(w(40) + .05 + i * .18, 'pop', .5);
  ev(w(42) - .05, 'pencil', .6); ev(w(42) + .5, 'pop', .6);
  ev(w(69) - .1, 'pop', .5); ev(w(73) - .05, 'pop', .5); ev(w(83), 'ding', .5);
  ev(w(88), 'tick', .6); ev(w(94) - .05, 'pop', .4); ev(w(109) - .05, 'pop', .5);
  ev(w(113) - .05, 'stamp', .7); ev(w(118) - .1, 'pop', .5); ev(w(121) - .1, 'pop', .5);
  ev(w(137) - .1, 'ding', .45);
  for (let tt = w(139); tt < w(148) - .1; tt += .8) ev(tt, 'beep', .25);
  for (let tt = w(148) - .1; tt < w(165) - .2; tt += .42) ev(tt, 'alarm', .3);
  ev(w(166) - .1, 'flatline', .45);
  ev(w(171) - .05, 'page', .6); ev(w(176), 'scribble', .6); ev(w(176) + .25, 'scribble', .6); ev(w(178) - .2, 'whoosh', .45);
  ev(w(183), 'gavel', 1); ev(w(189) - .15, 'pop', .4);
  ev(w(198) + .2, 'steps', .5); ev(w(202), 'door', .6);
  ev(w(208) - .1, 'ding', .45); ev(w(212) - .1, 'pop', .45);
  for (const i of [217, 218, 221]) ev(w(i) - .05, 'pop', .45);
  for (let i = 0; i < 3; i++) ev(w(225) + i * .16, 'flip', .5);
  for (const i of [232, 235, 241, 245]) ev(w(i) - .1, 'tick', .55);
  ev(w(257) - .1, 'ding', .5);
  ev(END0, 'whoosh', .5); ev(GRID0, 'whoosh', .7); ev(GRID0 + 1.2, 'stamp', .5);
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;
  await document.fonts.load("700 40px Kalam"); await document.fonts.load("900 40px Nunito"); await document.fonts.load("800 40px Nunito");
  await document.fonts.ready;
  render(0);
  window.READY = true;
})();
