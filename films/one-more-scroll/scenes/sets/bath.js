// sets/bath.js — the bathroom at 4:30 AM: cold tiles, a mirror cabinet, a buzzing fluorescent tube (flicker), sink and faucet.
import { E, V, mood, layer, backdrop, rr, seg, circle, poly, linGrad, radGrad, glow, alpha, shade, mix, clamp, lerp, rng } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';

export const BATH = { GY: 880, sinkX: 1020, sinkY: 600, mirX: 840, mirY: 170, mirW: 360, mirH: 330, tubeY: 130 };
// light 0..1 (tube power, flicker handled by the caller)
export function bath(g, t, cam, o = {}) {
  const M = mood('interiorCool'), GY = BATH.GY, L = o.light ?? 1, tile = mix('#141a22', '#5e7a7e', L * 0.85), grout = shade(tile, -0.25);
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = linGrad(g, 0, -200, 0, GY, [shade(tile, -0.35), tile, shade(tile, -0.15)]); g.fillRect(-1200, -600, 4400, GY + 600);
    g.strokeStyle = alpha(grout, 0.8); g.lineWidth = 3; for (let x = -1200; x < 3200; x += 90) { g.beginPath(); g.moveTo(x, -600); g.lineTo(x, GY); g.stroke(); } for (let y = -600; y < GY; y += 90) { g.beginPath(); g.moveTo(-1200, y); g.lineTo(3200, y); g.stroke(); }
    // door frame (left) with the dark bedroom beyond
    g.fillStyle = '#06070c'; g.fillRect(140, GY - 560, 250, 560); g.fillStyle = shade(tile, -0.45); g.fillRect(120, GY - 580, 20, 580); g.fillRect(390, GY - 580, 20, 580); g.fillRect(120, GY - 590, 290, 20);
    // switch
    rr(g, 450, GY - 360, 40, 64, 6); g.fillStyle = mix('#3a3e44', '#d8dcd8', L * 0.8); g.fill(); rr(g, 462, GY - 344 + (o.switchOn ? -8 : 8), 16, 24, 4); g.fillStyle = shade(tile, -0.3); g.fill();
    // mirror cabinet
    const { mirX: mx, mirY: my, mirW: mw, mirH: mh } = BATH;
    rr(g, mx - 16, my - 16, mw + 32, mh + 32, 10); g.fillStyle = mix('#0e1014', '#9aa4a8', L * 0.6); g.fill();
    g.fillStyle = o.mirrorFill || linGrad(g, mx, my, mx + mw, my + mh, [mix('#0a0d12', '#4a5a62', L), mix('#06080c', '#2a3438', L)]); g.fillRect(mx, my, mw, mh);
    if (o.mirror) { g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip(); o.mirror(g, mx, my, mw, mh); g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#ffffff', 0.05 + L * 0.06); poly(g, [[mx + 30, my], [mx + 120, my], [mx + 40, my + mh], [mx - 50 + 30, my + mh]], g.fillStyle); g.restore();
    // fluorescent tube
    rr(g, mx - 30, BATH.tubeY - 30, mw + 60, 26, 10); g.fillStyle = '#1a1c20'; g.fill(); rr(g, mx - 20, BATH.tubeY - 22, mw + 40, 12, 6); g.fillStyle = L > 0.1 ? mix('#3a4446', '#f2fff8', L) : '#2a2e30'; g.fill();
    // towel bar + towel
    seg(g, [[1300, 360], [1460, 360]], 8, '#20242a'); g.fillStyle = mix('#1a2028', '#8aa6b8', L * 0.7); rr(g, 1316, 360, 128, 230, 10); g.fill();
    // counter + sink + faucet
    const sx = BATH.sinkX, sy = BATH.sinkY;
    g.fillStyle = mix('#0c0e12', '#a8b4b6', L * 0.8); g.fillRect(sx - 340, sy, 680, 34); g.fillStyle = mix('#0a0c10', '#6a787c', L * 0.7); g.fillRect(sx - 320, sy + 34, 640, GY - sy - 34);
    g.fillStyle = shade(mix('#0a0c10', '#6a787c', L * 0.7), -0.2); for (const dx of [-300, 0]) g.fillRect(sx + dx + 20, sy + 70, 260, GY - sy - 110);
    g.fillStyle = mix('#14181e', '#e8eeee', L * 0.85); g.beginPath(); g.ellipse(sx, sy + 4, 150, 22, 0, 0, Math.PI * 2); g.fill();
    seg(g, [[sx + 60, sy - 4], [sx + 60, sy - 70], [sx + 10, sy - 74]], 12, mix('#20242a', '#c8d0d4', L * 0.8));
    // floor
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, [mix('#0a0c10', '#3a4a50', L * 0.7), '#05060a']); g.fillRect(-1200, GY, 4400, 900);
  });
  if (L > 0.05) layer(g, cam, 0.8, (g) => { glow(g, BATH.mirX + BATH.mirW / 2, BATH.tubeY - 16, 700, '#e8fff4', 0.32 * L); FX.lightCone(g, BATH.mirX + BATH.mirW / 2, BATH.tubeY, { angle: Math.PI / 2, spread: 1.6, len: 900, color: '#e8fff4', a: 0.1 * L }); });
  return { GY, M };
}
// flicker pattern for the tube switching on
export const flick = (t, on) => { if (t < on) return 0; const k = t - on; if (k > 1.0) return 1; return [0.9, 0, 0.6, 0, 0, 1, 0.2, 1, 1, 0.5, 1][Math.floor(k * 11)] ?? 1; };
