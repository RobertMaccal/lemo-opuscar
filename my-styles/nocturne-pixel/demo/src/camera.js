// Explicit camera keyframes. Zoom Z = output pixels per world pixel (3 = whole 360x640 world on screen).
// Position and log-zoom go through monotone cubic splines: no overshoot, holds stay still.
import { monotone } from './rng.js';
import { OW, OH } from './px.js';

function cam(keys) {
  const fx = monotone(keys.map(k => [k[0], k[1]])), fy = monotone(keys.map(k => [k[0], k[2]])), fz = monotone(keys.map(k => [k[0], Math.log(k[3])]));
  return t => ({ x: fx(t), y: fy(t), Z: Math.exp(fz(t)) });
}
export const ZE = 3 * 1104 / 1080;   // interior entry/exit framing (matches the arched glass at handoff)
export const extCam = cam([
  [0, 180, 320, 3.0], [3.6, 180, 336, 3.4],
  [6.4, 135, 418, 7.2], [8.3, 218, 388, 7.8], [10.4, 150, 292, 7.8], [12.0, 214, 252, 7.6], [12.6, 205, 270, 6.8],
  [14.0, 183, 330, 3.15], [14.6, 183, 330, 3.1],
  [15.6, 186, 326, 3.45], [16.4, 189, 322, 4.2], [17.0, 192, 319, 6.0], [17.5, 194, 317, 12], [17.95, 195, 315.8, 30], [18.4, 195, 315.5, 70], [18.8, 195, 315.5, 92], [19.2, 195, 315.5, 92],
  [35.4, 195, 315.5, 92], [35.8, 195, 315.5, 92], [36.2, 195, 315.5, 78], [36.6, 195, 315.5, 42], [37.0, 194.6, 316, 20], [37.5, 192, 317, 9.5], [38.1, 186, 319, 4.6], [38.7, 181, 320, 3.25], [39.2, 180, 320, 3.0], [40.5, 180, 320, 3.0],
]);
export const intCam = cam([
  [18.4, 180, 320, ZE], [18.8, 180, 320, ZE], [20.6, 192, 368, 3.85], [24.6, 204, 378, 4.45], [26.8, 228, 378, 6.0], [29.0, 236, 386, 6.6], [29.8, 236, 386, 6.6], [31.0, 212, 376, 4.9], [34.4, 222, 386, 5.5], [35.8, 180, 320, ZE], [36.2, 180, 320, ZE],
]);
export const interior = t => t >= 18.8 && t < 35.8;
export const toScreen = (c, wx, wy) => [(wx - c.x) * c.Z + OW / 2, (wy - c.y) * c.Z + OH / 2];
// parallax layer camera: depth f (1 = main plane, smaller = farther)
export const layerCam = (c, f) => ({ x: 180 + (c.x - 180) * f, y: 320 + (c.y - 320) * f, Z: 3 * Math.pow(c.Z / 3, f) });
export function applyCam(ctx, c, ox = 0, oy = 0, scale = 1) {
  ctx.setTransform(c.Z / scale, 0, 0, c.Z / scale, OW / 2 + (ox - c.x) * c.Z, OH / 2 + (oy - c.y) * c.Z);
}
