// The handheld screens: 4-shade green LCD pictures drawn on a 160×144 canvas (original art; no game is copied).
import * as THREE from 'three';
import { h2 } from './px.js';

export const GB = ['#0f2a1a', '#3a6a2a', '#8aac3a', '#c6dc8a'];   // darkest → lightest
const T = (c, i) => { c.fillStyle = GB[i]; };
export function lcd(w = 160, h = 144) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.colorSpace = THREE.SRGBColorSpace;
  return { c, g, tex };
}
// little sprites in 4 shades: 0 transparent, 1..4 shade index+1
const BOY = ['..2222..', '.233332.', '.244442.', '..4141..', '..4444..', '.333333.', '.3.33.3.', '..2..2..'];
const BUG = ['.1..1.', '..11..', '.1331.', '133331', '.1331.', '..11..'];
const TREE = ['...11...', '..1221..', '.122221.', '12222221', '.122221.', '..1221..', '...33...', '...33...'];
function spr(g, rows, x, y, s = 1, map = [null, 0, 1, 2, 3]) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; const k = map[+ch]; if (k == null) return; T(g, k); g.fillRect(x + i * s, y + j * s, s, s); }));
}
// An overworld: grass tiles, trees, a path, a small hero, a bug. scroll moves the map; bugPos [x,y] or null
export function overworld(L, t, o = {}) {
  const { g, c } = L; T(g, 3); g.fillRect(0, 0, c.width, c.height);
  const sx = Math.floor(o.scroll ?? 0);
  for (let y = 0; y < 18; y++) for (let x = -1; x < 21; x++) {
    const X = x * 8 - (sx % 8), wx = x + Math.floor(sx / 8);
    if (y === 10 || y === 11) { T(g, 2); g.fillRect(X, y * 8, 8, 8); if (h2(wx, y, 3) > .7) { T(g, 3); g.fillRect(X + 3, y * 8 + 3, 2, 1); } continue; }
    if (h2(wx, y, 1) > .86 && Math.abs(y - 10.5) > 2) spr(g, TREE, X, y * 8);
    else if (h2(wx, y, 2) > .8) { T(g, 2); g.fillRect(X + 2, y * 8 + 5, 1, 2); g.fillRect(X + 5, y * 8 + 4, 1, 2); }
  }
  if (o.hero !== false) spr(g, BOY, 74, 74 + (Math.floor(t * 4) % 2), 1);
  if (o.bug) spr(g, BUG, o.bug[0], o.bug[1] + Math.round(Math.sin(t * 8)), 1);
  if (o.box) { T(g, 3); g.fillRect(4, 108, 152, 32); T(g, 0); g.fillRect(4, 108, 152, 1); g.fillRect(4, 139, 152, 1); g.fillRect(4, 108, 1, 32); g.fillRect(155, 108, 1, 32); }
  L.tex.needsUpdate = true;
}
// Power-on: blank → a bright wipe → the overworld fading in from light
export function boot(L, t, o = {}) {
  const { g, c } = L;
  if (t < 0) { g.fillStyle = '#1c2a1c'; g.fillRect(0, 0, c.width, c.height); L.tex.needsUpdate = true; return; }
  if (t < .5) { T(g, 3); g.fillRect(0, 0, c.width, c.height); const y = Math.floor(t / .5 * 70); T(g, 0); g.fillRect(40, y, 80, 3); L.tex.needsUpdate = true; return; }
  overworld(L, t, { scroll: (t - .5) * 10, ...o });
  if (t < 1.0) { g.globalAlpha = 1 - (t - .5) / .5; T(g, 3); g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1; L.tex.needsUpdate = true; }
}
// A centred bug on blank light green (the last picture before the leaf)
export function bugCard(L, t, k = 1) {
  const { g, c } = L; T(g, 3); g.fillRect(0, 0, c.width, c.height);
  spr(g, BUG, 68, 64, 4); L.tex.needsUpdate = true;
}
export { spr, BUG, BOY };
