// renderer.js — draws frame N of a finished simulation onto a 1080×1920 Canvas 2D context.
// Pure function of (simulation, camera, frame index): no hidden state, so any frame can be rendered in any order.
import {
  FPS, FRAMES, DUR, N, R, GOLD, Y_FINISH, Y_START, SWEEPERS, GUSTS, WARN,
  width, centerX, slope, sweeperState, wind, hash, vnoise,
} from './physics.js';
import { VW, VH } from './camera.js';

const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const FONT = '"Inter", "Space Grotesk", system-ui, sans-serif';

function hsl(h, s, l) {
  s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (c, d, t) => [c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t, c[2] + (d[2] - c[2]) * t].map(Math.round);
const GOLDC = [255, 211, 77];

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

export function createRenderer(sim, cam) {
  const { rec, alive, events, balls } = sim;
  // display-only hue remap: widen the empty band around gold (sim hues avoid 30–68°, the screen avoids 14–88°)
  const dispHue = h => { const u = h <= 30 ? h : h - 38; const v = u * (286 / 322); return v <= 14 ? v : v + 74; };
  const colors = balls.map(b => b.id === GOLD ? GOLDC : hsl(dispHue(b.hue), b.sat, b.lit));

  // ---- sprites: shaded body + soft halo per ball colour ----
  const SPR = 112, bodies = [], halos = [];
  for (let i = 0; i < N; i++) {
    const c = colors[i], gold = i === GOLD;
    const bc = makeCanvas(SPR, SPR), g = bc.getContext('2d'), r = SPR / 2 - 2;
    const grd = g.createRadialGradient(SPR / 2 - r * 0.35, SPR / 2 - r * 0.4, r * 0.05, SPR / 2, SPR / 2, r);
    if (gold) { grd.addColorStop(0, '#fff8d8'); grd.addColorStop(0.28, '#ffe27a'); grd.addColorStop(0.62, '#f2b632'); grd.addColorStop(1, '#8a5a0c'); }
    else { grd.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.55), 1)); grd.addColorStop(0.45, rgba(c, 1)); grd.addColorStop(1, rgba(mix(c, [0, 0, 0], 0.55), 1)); }
    g.fillStyle = grd; g.beginPath(); g.arc(SPR / 2, SPR / 2, r, 0, Math.PI * 2); g.fill();
    // rim light on the lower edge (reflected bridge light)
    g.strokeStyle = gold ? 'rgba(255,240,190,0.55)' : rgba(mix(c, [180, 255, 255], 0.5), 0.45); g.lineWidth = 3;
    g.beginPath(); g.arc(SPR / 2, SPR / 2, r - 2, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    // specular highlight
    const hg = g.createRadialGradient(SPR / 2 - r * 0.36, SPR / 2 - r * 0.42, 0, SPR / 2 - r * 0.36, SPR / 2 - r * 0.42, r * 0.34);
    hg.addColorStop(0, 'rgba(255,255,255,0.95)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(SPR / 2 - r * 0.36, SPR / 2 - r * 0.42, r * 0.34, 0, Math.PI * 2); g.fill();
    bodies.push(bc);
    const hc = makeCanvas(SPR, SPR), h = hc.getContext('2d');
    const hgd = h.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
    const ha = gold ? 0.62 : 0.42;
    hgd.addColorStop(0, rgba(c, ha)); hgd.addColorStop(0.32, rgba(c, ha * 0.45)); hgd.addColorStop(1, rgba(c, 0));
    h.fillStyle = hgd; h.fillRect(0, 0, SPR, SPR); halos.push(hc);
  }
  // soft dot for particles
  const dot = makeCanvas(32, 32); { const g = dot.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }

  // ---- derived timelines ----
  const falls = events.filter(e => e.type === 'fall');
  const bigHits = events.filter(e => (e.type === 'hit' && e.j > 110) || (e.type === 'sweep' && e.j > 120));
  const finishE = events.find(e => e.type === 'finish' && e.id === GOLD) || null;
  const firstFinish = events.find(e => e.type === 'finish') || null;
  const windInt = new Float32Array(FRAMES); for (let f = 1; f < FRAMES; f++) windInt[f] = windInt[f - 1] + wind(f / FPS) / FPS;
  const lastChange = new Int32Array(FRAMES), prevVal = new Int16Array(FRAMES);
  { let lc = 0, pv = alive[0]; for (let f = 0; f < FRAMES; f++) { if (f > 0 && alive[f] !== alive[f - 1]) { lc = f; pv = alive[f - 1]; } lastChange[f] = lc; prevVal[f] = pv; } }
  const finalCount = alive[FRAMES - 1];

  const P = (o, f) => rec[(f * N + o) * 4];
  return function draw(ctx, f) {
    f = clamp(Math.round(f), 0, FRAMES - 1);
    const t = f / FPS;
    const cx0 = cam[f * 4], cy0 = cam[f * 4 + 1], Z = cam[f * 4 + 2], sh = cam[f * 4 + 3];
    const shx = sh * 5 * vnoise(t * 40, 1), shy = sh * 5 * vnoise(t * 40, 2);
    const camX = cx0, camY = cy0;
    const SX = x => VW / 2 + (x - camX) * Z + shx, SY = y => VH / 2 - (y - camY) * Z + shy;
    const yTop = camY + (VH / 2 + 80) / Z, yBot = camY - (VH / 2 + 80) / Z;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);

    // ---- 1. deep void dust (parallax) ----
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 110; i++) {
      const depth = 0.25 + hash(i * 3 + 1) * 0.35;
      let x = (hash(i * 3 + 2) * VW * 1.6 - (camX * Z * depth)) % (VW * 1.6); if (x < 0) x += VW * 1.6; x -= VW * 0.3;
      let y = (hash(i * 3 + 3) * VH * 1.4 + camY * Z * depth) % (VH * 1.4); if (y < 0) y += VH * 1.4; y -= VH * 0.2;
      const a = 0.05 + 0.12 * hash(i + 99) * (0.6 + 0.4 * Math.sin(t * 0.8 + i));
      ctx.globalAlpha = a; const s = 1.5 + 3 * depth * Z;
      ctx.drawImage(dot, x - s, y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;

    // ---- 2. falling balls (below the bridge plane, so the bridge can hide them) ----
    for (let i = 0; i < N; i++) {
      const o = (f * N + i) * 4, st = rec[o + 3] | 0; if (st !== 1) continue;
      const z = rec[o + 2], s = 700 / (700 + z), fade = clamp(1 - z / 1900, 0, 1);
      const pull = 1 - (1 - s) * 0.3;
      const px = VW / 2 + (rec[o] - camX) * Z * pull + shx, py = VH / 2 - (rec[o + 1] - camY) * Z * pull + shy;
      const c = colors[i];
      // falling trail from recorded history
      ctx.globalCompositeOperation = 'lighter';
      let lx = px, ly = py;
      for (let k = 1; k <= 12; k++) {
        const fk = f - k; if (fk < 0) break; const ok = (fk * N + i) * 4; const sk = rec[ok + 3] | 0; if (sk === 2) break;
        const zk = rec[ok + 2], sk2 = 700 / (700 + zk), pk = 1 - (1 - sk2) * 0.3;
        const qx = VW / 2 + (rec[ok] - camX) * Z * pk + shx, qy = VH / 2 - (rec[ok + 1] - camY) * Z * pk + shy;
        ctx.strokeStyle = rgba(c, 0.32 * fade * (1 - k / 13)); ctx.lineWidth = Math.max(1, R * Z * s * 0.9 * (1 - k / 14));
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(qx, qy); ctx.stroke(); lx = qx; ly = qy;
      }
      const rr = R * Z * s;
      ctx.globalAlpha = 0.9 * fade * fade; ctx.drawImage(halos[i], px - rr * 2.6, py - rr * 2.6, rr * 5.2, rr * 5.2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, fade * 1.25); ctx.drawImage(bodies[i], px - rr, py - rr, rr * 2, rr * 2);
      // darken with depth
      ctx.globalAlpha = (1 - fade) * 0.8; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px, py, rr, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ---- 3. the bridge ----
    const step = Math.max(6, 14 / Z);
    const L = [], Rr = [], C = [];
    for (let y = Math.max(Y_START - 760, yBot); y <= Math.min(9400, yTop) + step; y += step) {
      const th = Math.atan(slope(y)), half = width(y) / 2 / Math.cos(th), cx = centerX(y);
      L.push([SX(cx - half), SY(y)]); Rr.push([SX(cx + half), SY(y)]); C.push([SX(cx), SY(y), width(y) * Z, y]);
    }
    if (L.length > 1) {
      const poly = () => { ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (const p of L) ctx.lineTo(p[0], p[1]); for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]); ctx.closePath(); };
      // underglow
      ctx.globalCompositeOperation = 'lighter';
      const edgePath = (pts, from, to) => { ctx.beginPath(); let started = false; for (let i = from; i < to; i++) { const p = pts[i]; if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]); } };
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const [wdt, a, col] of [[90, 0.035, '30,110,255'], [44, 0.06, '40,150,255'], [18, 0.10, '60,210,255']]) {
        ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = wdt;
        edgePath(L, 0, L.length); ctx.stroke(); edgePath(Rr, 0, Rr.length); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      // surface: very dark, slightly blue
      poly(); ctx.fillStyle = '#020c15'; ctx.fill();
      // panel seams (world-locked: they give speed) and a faint centre guide
      ctx.save(); poly(); ctx.clip();
      ctx.strokeStyle = 'rgba(90,220,255,0.07)'; ctx.lineWidth = Math.max(1, 1.2 * Z);
      const seam = 120; for (let y = Math.ceil(yBot / seam) * seam; y < yTop; y += seam) {
        if (y < Y_START - 700 || y > 9400) continue; const th = Math.atan(slope(y)), half = width(y) / 2, cx = centerX(y);
        const nx = Math.cos(th), ny = -Math.sin(th);
        ctx.beginPath(); ctx.moveTo(SX(cx - half * nx), SY(y - half * ny)); ctx.lineTo(SX(cx + half * nx), SY(y + half * ny)); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(90,220,255,0.05)'; ctx.setLineDash([10 * Z, 26 * Z]); ctx.lineDashOffset = 0;
      ctx.beginPath(); C.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // edges (two crisp lines) where the bridge is wide enough on screen; a single 1–2 px core where it is a rail
      ctx.globalCompositeOperation = 'lighter';
      const runs = []; let cur = null;
      for (let i = 0; i < C.length; i++) { const rail = C[i][2] < 7; if (!cur || cur.rail !== rail) { if (cur) cur.to = i + 1; cur = { rail, from: Math.max(0, i - 1) }; runs.push(cur); } }
      if (cur) cur.to = C.length;
      for (const run of runs) {
        if (!run.rail) {
          for (const [wdt, col] of [[9, 'rgba(40,140,255,0.28)'], [4.5, 'rgba(70,220,255,0.55)'], [2.2, 'rgba(200,255,255,0.95)']]) {
            ctx.strokeStyle = col; ctx.lineWidth = wdt;
            edgePath(L, run.from, run.to); ctx.stroke(); edgePath(Rr, run.from, run.to); ctx.stroke();
          }
        } else {
          for (const [wdt, col] of [[22, 'rgba(40,120,255,0.10)'], [9, 'rgba(60,200,255,0.30)'], [3.5, 'rgba(120,240,255,0.6)'], [1.6, 'rgba(235,255,255,1)']]) {
            ctx.strokeStyle = col; ctx.lineWidth = wdt; edgePath(C, run.from, run.to); ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    // start and finish markers
    const lineAcross = (y, extra, col, lw) => { const half = width(y) / 2 + extra, cx = centerX(y); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(SX(cx - half), SY(y)); ctx.lineTo(SX(cx + half), SY(y)); ctx.stroke(); };
    if (SY(Y_START) > -50 && SY(Y_START) < VH + 50) { ctx.globalCompositeOperation = 'lighter'; lineAcross(Y_START, 0, 'rgba(120,240,255,0.35)', 3 * Z); ctx.globalCompositeOperation = 'source-over'; }
    const FY = Y_FINISH + 40, GATE = 170;   // the finish line: where the rail meets the pad
    if (SY(FY) > -120 && SY(FY) < VH + 120) {
      ctx.globalCompositeOperation = 'lighter';
      const cx = centerX(FY), cell = 17;
      for (let k = 0; k * cell < GATE * 2; k++) for (let r2 = 0; r2 < 2; r2++) {   // checker band just past the line
        if ((k + r2) % 2) continue; ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.fillRect(SX(cx - GATE + k * cell), SY(FY + (r2 + 1) * cell), cell * Z, cell * Z);
      }
      ctx.strokeStyle = 'rgba(255,240,200,0.85)'; ctx.lineWidth = 2.5 * Z;
      ctx.beginPath(); ctx.moveTo(SX(cx - GATE), SY(FY)); ctx.lineTo(SX(cx + GATE), SY(FY)); ctx.stroke();
      for (const sd of [-1, 1]) { const s2 = 16 * Z; ctx.drawImage(dot, SX(cx + sd * GATE) - s2, SY(FY) - s2, s2 * 2, s2 * 2); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255,255,255,${0.5 * sstep(420, 560, SY(FY + 62))})`; ctx.font = `700 ${Math.round(13 * Z)}px ${FONT}`; ctx.textAlign = 'center'; ctx.letterSpacing = `${Math.round(6 * Z)}px`;
      ctx.fillText('FINISH', SX(cx) + 3 * Z, SY(FY + 62)); ctx.letterSpacing = '0px';
    }
    // golden pulse across the finish line
    if (finishE && t >= finishE.t && t < finishE.t + 2.2) {
      const a = t - finishE.t, half = GATE, cx = centerX(FY);
      ctx.globalCompositeOperation = 'lighter';
      for (const side of [-1, 1]) {
        const px = cx + side * Math.min(half, a * 900);
        ctx.globalAlpha = clamp(1 - a / 2.2, 0, 1);
        const s = 70 * Z; ctx.drawImage(halos[GOLD], SX(px) - s, SY(FY) - s, s * 2, s * 2);
      }
      ctx.globalAlpha = clamp(1 - a / 1.6, 0, 1) * 0.9; ctx.strokeStyle = 'rgba(255,215,90,1)'; ctx.lineWidth = 6 * Z; ctx.beginPath(); ctx.moveTo(SX(cx - half), SY(FY)); ctx.lineTo(SX(cx + half), SY(FY)); ctx.stroke();
      const ring = a * 520 * Z; ctx.globalAlpha = clamp(0.7 - a / 1.6, 0, 1); ctx.strokeStyle = 'rgba(255,215,100,1)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(SX(finishE.x), SY(finishE.y), ring, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    // ---- 4. sweepers ----
    for (let si = 0; si < SWEEPERS.length; si++) {
      const S = SWEEPERS[si]; if (SY(S.y) < -300 || SY(S.y) > VH + 300) continue;
      const s = sweeperState(S, t), w = width(S.y), A = Math.max(0, 0.62 * (w / 2 - R)), th = Math.atan(slope(S.y));
      // travel guide
      ctx.strokeStyle = 'rgba(255,70,130,0.16)'; ctx.lineWidth = 2; ctx.setLineDash([6, 10]);
      ctx.beginPath(); ctx.moveTo(SX(centerX(S.y) - A * Math.cos(th)), SY(S.y + A * Math.sin(th))); ctx.lineTo(SX(centerX(S.y) + A * Math.cos(th)), SY(S.y - A * Math.sin(th))); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let g = 4; g >= 1; g--) {                // motion ghosts
        const sp = sweeperState(S, t - g * 0.018);
        ctx.strokeStyle = `rgba(255,60,120,${0.07 * (5 - g)})`; ctx.lineWidth = S.rad * 2 * Z;
        ctx.beginPath(); ctx.moveTo(SX(sp.ax), SY(sp.ay)); ctx.lineTo(SX(sp.bx), SY(sp.by)); ctx.stroke();
      }
      for (const [wdt, col] of [[S.rad * 2 * Z + 26, 'rgba(255,40,110,0.10)'], [S.rad * 2 * Z + 10, 'rgba(255,60,130,0.28)'], [S.rad * 2 * Z, 'rgba(255,90,150,0.95)'], [Math.max(2, S.rad * 0.7 * Z), 'rgba(255,230,240,1)']]) {
        ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(SX(s.ax), SY(s.ay)); ctx.lineTo(SX(s.bx), SY(s.by)); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // ---- 5. wind streaks + gust warnings ----
    const W = wind(t), aw = Math.abs(W);
    if (aw > 45) {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const n = Math.round(clamp(aw / 480, 0, 1) * 64), dir = Math.sign(W), span = VW + 600;
      for (let i = 0; i < n; i++) {
        const sy = hash(i * 5 + 7) * VH, spd = 0.8 + hash(i * 5 + 8) * 0.6;
        let sx = (hash(i * 5 + 9) * span + windInt[f] * Z * spd * 1.4) % span; if (sx < 0) sx += span; sx -= 300;
        const len = (40 + aw * 0.22 * spd) * Math.min(1.6, Z * 0.8 + 0.3);
        ctx.strokeStyle = `rgba(190,235,255,${clamp((aw - 45) / 500, 0, 1) * (0.16 + 0.14 * hash(i + 3))})`;
        ctx.lineWidth = 1 + hash(i * 5 + 10) * 1.4;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - dir * len, sy); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const g of GUSTS) {
      if (g.p < 250) continue;
      const a = t - (g.t - WARN); if (a < 0 || a > WARN + 0.5) continue;
      const alpha = sstep(0, 0.25, a) * (1 - sstep(WARN, WARN + 0.5, a));
      const side = -g.dir;                         // wind comes from the opposite side
      const bx = side < 0 ? 70 : VW - 70, by = VH * 0.5;
      ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let k = 0; k < 3; k++) {
        const ph = (a * 2.2 - k * 0.22) % 1, aa = alpha * (0.35 + 0.65 * Math.max(0, Math.sin(ph * Math.PI)));
        ctx.strokeStyle = `rgba(200,240,255,${aa * 0.8})`;
        const x = bx + g.dir * k * 30;
        ctx.beginPath(); ctx.moveTo(x - g.dir * 12, by - 22); ctx.lineTo(x + g.dir * 12, by); ctx.lineTo(x - g.dir * 12, by + 22); ctx.stroke();
      }
    }

    // ---- 6. balls on the bridge: trails, halos, bodies ----
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const o = (f * N + i) * 4, st = rec[o + 3] | 0; if (st !== 0 && st !== 3) continue;
      const gold = i === GOLD, len = gold ? 18 : 10, c = colors[i];
      let lx = SX(rec[o]), ly = SY(rec[o + 1]);
      for (let k = 1; k <= len; k++) {
        const fk = f - k; if (fk < 0) break; const ok = (fk * N + i) * 4;
        const qx = SX(rec[ok]), qy = SY(rec[ok + 1]), q = 1 - k / (len + 1);
        ctx.strokeStyle = rgba(gold ? [255, 200, 70] : c, (gold ? 0.42 : 0.24) * q);
        ctx.lineWidth = Math.max(1, R * Z * (gold ? 0.75 : 0.55) * q);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(qx, qy); ctx.stroke(); lx = qx; ly = qy;
      }
    }
    for (let i = 0; i < N; i++) {
      const o = (f * N + i) * 4, st = rec[o + 3] | 0; if (st !== 0 && st !== 3) continue;
      const rr = R * Z * (i === GOLD ? 3.0 : 2.5);
      ctx.drawImage(halos[i], SX(rec[o]) - rr, SY(rec[o + 1]) - rr, rr * 2, rr * 2);
    }
    // edge "hot spots" under teetering balls: the edge glows red where a ball hangs over it
    for (let i = 0; i < N; i++) {
      const o = (f * N + i) * 4, aux = rec[o + 3], st = aux | 0; if (st !== 0) continue;
      const ov = aux - st; if (ov <= 0.005) continue;
      const x = rec[o], y = rec[o + 1], th = Math.atan(slope(y)), d = (x - centerX(y)) * Math.cos(th), half = width(y) / 2;
      const ex = centerX(y) + Math.sign(d) * half * Math.cos(th), ey = y - Math.sign(d) * half * Math.sin(th);
      const s = (16 + 40 * ov) * Z; ctx.globalAlpha = clamp(ov * 2.2, 0, 0.9);
      ctx.drawImage(halos[i], SX(ex) - s, SY(ey) - s, s * 2, s * 2);
      ctx.fillStyle = 'rgba(255,80,60,1)'; ctx.globalAlpha = clamp(ov * 1.6, 0, 0.6);
      ctx.drawImage(dot, SX(ex) - s * 0.5, SY(ey) - s * 0.5, s, s);
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
    // bodies (gold last so it is never hidden)
    const order = []; for (let i = N - 1; i >= 0; i--) order.push(i);
    for (const i of order) {
      const o = (f * N + i) * 4, aux = rec[o + 3], st = aux | 0; if (st !== 0 && st !== 3) continue;
      const ov = st === 0 ? aux - st : 0, dip = 1 - 0.06 * ov;   // pivoting over an edge: the ball sinks a little
      const rr = R * Z * dip;
      ctx.drawImage(bodies[i], SX(rec[o]) - rr, SY(rec[o + 1]) - rr, rr * 2, rr * 2);
    }
    // gold intro marker: a thin pulsing ring for ~1.2 s
    {
      const o = (f * N + GOLD) * 4, st = rec[o + 3] | 0;
      if (t < 1.5 && st === 0) {
        const a = sstep(0, 0.15, t) * (1 - sstep(1.05, 1.5, t)), pr = R * Z * (2.0 + 0.35 * Math.sin(t * 9));
        ctx.strokeStyle = `rgba(255,215,90,${0.9 * a})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(SX(rec[o]), SY(rec[o + 1]), pr, 0, 7); ctx.stroke();
      }
    }

    // ---- 7. particles: elimination bursts, collision sparks, victory burst ----
    ctx.globalCompositeOperation = 'lighter';
    for (const e of falls) {
      const a = t - e.t; if (a < 0 || a > 1.4) continue;
      const c = colors[e.id];
      for (let k = 0; k < 14; k++) {
        const h1 = hash(e.id * 131 + k * 7), h2 = hash(e.id * 977 + k * 13), h3 = hash(e.id * 59 + k * 3);
        const ang = h1 * Math.PI * 2, sp = 40 + h2 * 150, kf = 2.6, life = 0.6 + h3 * 0.8; if (a > life) continue;
        const dsp = (1 - Math.exp(-kf * a)) / kf;
        const x = e.x + (Math.cos(ang) * sp + e.vx * 0.5) * dsp, y = e.y + (Math.sin(ang) * sp + e.vy * 0.5) * dsp;
        const q = 1 - a / life, s = (2 + 3 * h3) * Z * (0.6 + 0.4 * q);
        ctx.globalAlpha = q * 0.9; ctx.drawImage(halos[e.id], SX(x) - s * 2, SY(y) - s * 2, s * 4, s * 4);
        ctx.globalAlpha = q; ctx.drawImage(dot, SX(x) - s * 0.6, SY(y) - s * 0.6, s * 1.2, s * 1.2);
      }
    }
    for (const e of bigHits) {
      const a = t - e.t; if (a < 0 || a > 0.22) continue;
      const q = 1 - a / 0.22, s = (6 + Math.min(18, e.j / 18)) * Z * (0.6 + a * 3);
      ctx.globalAlpha = q * 0.55; ctx.drawImage(dot, SX(e.x) - s, SY(e.y) - s, s * 2, s * 2);
    }
    if (finishE && t >= finishE.t) {
      const a = t - finishE.t;
      for (let k = 0; k < 46; k++) {
        const h1 = hash(k * 17 + 5), h2 = hash(k * 29 + 3), h3 = hash(k * 41 + 9);
        const life = 1.2 + h3 * 1.6; if (a > life) continue;
        const ang = h1 * Math.PI * 2, sp = 90 + h2 * 280, kf = 2.0, dsp = (1 - Math.exp(-kf * a)) / kf;
        const x = finishE.x + Math.cos(ang) * sp * dsp, y = finishE.y + 40 + Math.sin(ang) * sp * dsp;
        const q = 1 - a / life, s = (2.5 + 3 * h3) * Z;
        ctx.globalAlpha = q; ctx.drawImage(halos[GOLD], SX(x) - s * 2.2, SY(y) - s * 2.2, s * 4.4, s * 4.4);
        ctx.drawImage(dot, SX(x) - s * 0.6, SY(y) - s * 0.6, s * 1.2, s * 1.2);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // ---- 8. vignette ----
    const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VH * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);

    // ---- 9. interface ----
    drawUI(ctx, f, t);

    // ---- 10. loop fades: in from black over the first frames, out to black at the end ----
    const fade = Math.max(0.55 * (1 - sstep(0, 0.09, t)), sstep(DUR - 0.62, (FRAMES - 1) / FPS, t));
    if (fade > 0) { ctx.globalAlpha = fade; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  };

  function text(ctx, s, x, y, size, weight, color, spacing = 0, alpha = 1, glow = null) {
    if (alpha <= 0.002) return;
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = `${spacing}px`; ctx.globalAlpha = alpha;
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = size * 0.45; }
    ctx.fillStyle = color; ctx.fillText(s, x + spacing / 2, y);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  }

  function drawUI(ctx, f, t) {
    const n = alive[f];
    const endA = 1 - sstep(43.1, 43.5, t);
    // top: title + counter (the counter always shows the simulated number of active balls)
    text(ctx, 'THE ONE-PIXEL BRIDGE', VW / 2, 158, 50, 800, '#ffffff', 7, endA, 'rgba(80,220,255,0.55)');
    const finalMode = sstep(29.0, 29.6, t);
    const ca = endA * (1 - finalMode);
    // rolling number transition
    const since = (f - lastChange[f]) / FPS, roll = sstep(0, 0.2, since);
    if (ca > 0.01) {
      ctx.save(); ctx.textBaseline = 'alphabetic';
      ctx.font = `600 30px ${FONT}`; ctx.letterSpacing = '6px'; const lw = ctx.measureText('SURVIVORS').width;
      ctx.font = `700 58px ${FONT}`; ctx.letterSpacing = '0px'; const nw = ctx.measureText('100').width, sw = ctx.measureText('/ 100').width;
      const gap = 22, x0 = VW / 2 - (lw + gap + nw + 14 + sw) / 2, yb = 246;
      ctx.globalAlpha = ca; ctx.textAlign = 'left'; ctx.font = `600 30px ${FONT}`; ctx.letterSpacing = '6px'; ctx.fillStyle = '#7ff3ff';
      ctx.fillText('SURVIVORS', x0, yb - 4);
      ctx.font = `700 58px ${FONT}`; ctx.letterSpacing = '0px';
      ctx.globalAlpha = ca * 0.7; ctx.fillStyle = '#9fdcff'; ctx.fillText('/ 100', x0 + lw + gap + nw + 14, yb);
      ctx.beginPath(); ctx.rect(x0 + lw + gap - 10, yb - 60, nw + 20, 76); ctx.clip();
      ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff'; const nx = x0 + lw + gap + nw;
      if (roll < 1 && lastChange[f] > 0) {
        ctx.globalAlpha = ca * (1 - roll); ctx.fillText(String(prevVal[f]), nx, yb - 50 * roll);
        ctx.globalAlpha = ca * roll; ctx.fillText(String(n), nx, yb + 50 * (1 - roll));
      } else { ctx.globalAlpha = ca; ctx.fillText(String(n), nx, yb); }
      ctx.restore();
    }
    if (finalMode > 0.01) {
      const fa = finalMode * endA * (1 - sstep(40.0, 40.5, t) * (finishE ? 1 : 0));
      text(ctx, 'FINAL SURVIVORS', VW / 2, 236, 32, 700, '#7ff3ff', 8, fa);
      text(ctx, String(n), VW / 2, 326, 84, 800, '#ffffff', 2, fa, 'rgba(80,220,255,0.6)');
    }
    // the hook (0–3.6 s)
    text(ctx, '100 BALLS.', VW / 2, 470, 96, 800, '#ffffff', 2, sstep(0.05, 0.25, t) * (1 - sstep(1.45, 1.75, t)), 'rgba(90,220,255,0.5)');
    text(ctx, 'ONE IMPOSSIBLE', VW / 2, 450, 84, 800, '#ffffff', 2, sstep(1.6, 1.9, t) * (1 - sstep(3.3, 3.7, t)), 'rgba(90,220,255,0.5)');
    text(ctx, 'BRIDGE.', VW / 2, 545, 84, 800, '#7ff3ff', 6, sstep(1.75, 2.05, t) * (1 - sstep(3.3, 3.7, t)), 'rgba(90,220,255,0.5)');
    text(ctx, 'WHICH ONE SURVIVES?', VW / 2, 1470, 56, 800, '#ffffff', 4, sstep(0.5, 0.8, t) * (1 - sstep(3.8, 4.3, t)), 'rgba(255,211,77,0.35)');
    // the payoff
    if (finishE && finalCount === 1) {
      const a0 = finishE.t + 0.35;
      const pa = sstep(a0, a0 + 0.35, t) * (1 - sstep(43.15, 43.55, t));
      text(ctx, '1 / 100', VW / 2, 640, 150, 800, '#ffd34d', 2, pa, 'rgba(255,190,60,0.75)');
      text(ctx, 'SURVIVED', VW / 2, 735, 62, 800, '#ffffff', 16, pa, 'rgba(255,211,77,0.4)');
    } else if (t > 40) {
      // honest alternative endings, chosen by what the simulation produced
      const msg = finalCount === 0 ? 'THE BRIDGE WON' : `${finalCount} / 100 SURVIVED`;
      const pa = sstep(41.5, 41.9, t) * (1 - sstep(43.15, 43.55, t));
      text(ctx, msg, VW / 2, 680, 92, 800, '#ffffff', 3, pa, 'rgba(80,220,255,0.55)');
    }
    const q = sstep(43.3, 43.75, t);
    if (q > 0) { ctx.globalAlpha = 0.55 * q; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
    text(ctx, 'WOULD YOUR BALL', VW / 2, 900, 76, 800, '#ffffff', 3, q, 'rgba(90,220,255,0.5)');
    text(ctx, 'HAVE SURVIVED?', VW / 2, 990, 76, 800, '#ffd34d', 3, q, 'rgba(255,190,60,0.5)');
  }
}
