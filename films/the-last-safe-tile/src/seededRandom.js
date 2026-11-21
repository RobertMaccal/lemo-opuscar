// Deterministic PRNG utilities (mulberry32 + integer hashing for independent sub-streams).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash32(...xs) {
  let h = 0x811C9DC5 >>> 0;
  for (const x of xs) {
    h ^= (x | 0) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0x5BD1E995) >>> 0;
    h ^= h >>> 15;
  }
  return h >>> 0;
}

// One named, independent stream per purpose so changing one system never shifts another.
const STREAMS = { balls: 1, colors: 2, motion: 3, tiles: 4, timing: 5, fx: 6, audio: 7, fragments: 8 };
export function rng(seed, stream, sub = 0) {
  return makeRng(hash32(seed, STREAMS[stream] ?? 99, sub));
}

export function makeRng(s) {
  const r = mulberry32(s);
  r.range = (a, b) => a + (b - a) * r();
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.sign = () => (r() < 0.5 ? -1 : 1);
  r.normal = () => { const u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  r.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return r;
}

// Stateless random in [0,1) for render-time effects (particles) keyed by integers.
export function hrand(...xs) { return hash32(...xs) / 4294967296; }
