// cast.js — locked signature colours (style bible): Max = deep-blue jacket, Dr. Ada = lab coat + glasses + bun (violet scarf drawn by scarf()).
import { seg } from '/engine/core.js';
import { headPos } from '/engine/rig2d.js';
export const MAX = { top: 'hoodie', color: '#1e56a0', head: 'none' };
export const ADA = { top: 'labcoat', face: 'glasses', head: 'bun' };
export const SALES = { top: 'suit', color: '#1a1622', head: 'none' };   // ink-only ad salesman (orange tie drawn separately)
export const VIOLET = '#9b59b6', TIE = '#e67e22';
// violet scarf around Ada's neck (her one saturated item)
export function scarf(g, fig) { const s = fig.s ?? 1, f = fig.facing ?? 1, [hx, hy, r] = headPos(fig);
  seg(g, [[hx - r * 0.7 * f, hy + r * 1.05], [hx + r * 0.7 * f, hy + r * 1.1]], 9 * s, VIOLET);
  seg(g, [[hx + r * 0.45 * f, hy + r * 1.1], [hx + r * 0.6 * f, hy + r * 2.0]], 8 * s, VIOLET); }
