// Single source of truth: shots, key events, narration lines. Times in seconds.
// Narration start times are re-locked to the real voice (vo.json, written by tools/align.py) when it exists.
export const DUR = 60.0;
export const FPS = 30;

// Shots (id → set). Dissolves between sets are listed in XF.
export const SHOTS = [
  { id: 'leaf', set: 'country', a: 0.0, b: 5.6 },
  { id: 'path', set: 'country', a: 5.6, b: 10.6 },
  { id: 'stream', set: 'country', a: 10.6, b: 16.0 },
  { id: 'change', set: 'country', a: 16.0, b: 24.2 },
  { id: 'wire', set: 'country', a: 24.2, b: 28.0 },
  { id: 'desk', set: 'room', a: 28.0, b: 31.6 },
  { id: 'tunnel', set: 'tunnel', a: 31.6, b: 34.6 },
  { id: 'eureka', set: 'room', a: 34.6, b: 39.6 },
  { id: 'studio', set: 'studio', a: 39.6, b: 46.6 },
  { id: 'boot', set: 'studio', a: 46.6, b: 50.4 },
  { id: 'world', set: 'world', a: 50.4, b: 55.6 },
  { id: 'home', set: 'country', a: 55.6, b: 60.0 },
];
// Cross-dissolves [time of the cut, half-length]: the outgoing set is blended over the incoming one
export const XF = [
  { t: 27.6, d: .45 },   // power line → link cable
  { t: 50.4, d: .35 },   // green screen → full-colour world
  { t: 55.6, d: .45 },   // screen → leaf
];
// Hard event times (sound and picture share these)
export const T = {
  dewSlide: .5, dewDrop: 2.6, boyIn: 3.0,
  nameIn: 7.6, kneel: 8.4, write: 12.6,
  changeStart: 16.6, changeEnd: 23.4, netLower: 21.4,
  spark: 30.9, dive: 31.5, popOut: 34.4, wow: 35.0, rack: 37.4,
  dayEnd: 42.0, nightIn: 44.2, lamps: [43.6, 43.9, 44.3, 44.6], devCap: 41.0,
  dark: 46.6, boot: 47.4, dateIn: 51.2,
  shrink: 55.0, smile: 57.2, fly: 58.4,
};
// Narration (sub = subtitle text, say = what the voice reads); t = start time (provisional), d = duration (from vo.json)
export const VO = [
  { id: 'v01', t: 0.5, sub: 'Did you know Pokémon was inspired by a little boy… catching bugs?' },
  { id: 'v02', t: 5.8, sub: 'His name was Satoshi Tajiri.' },
  { id: 'v03', t: 8.0, sub: 'Growing up in Japan, Satoshi loved exploring the countryside, searching for beetles and collecting insects.' },
  { id: 'v04', t: 13.2, sub: 'His friends even called him “Doctor Bug.”' },
  { id: 'v05', t: 16.4, sub: 'But as the city expanded, the forests and fields he loved began disappearing.' },
  { id: 'v06', t: 24.4, sub: 'Years later, Satoshi discovered something fascinating.' },
  { id: 'v07', t: 27.8, sub: 'Two Game Boys… connected by a cable.' },
  { id: 'v08', t: 30.8, sub: 'And he imagined tiny creatures traveling between them!' },
  { id: 'v09', t: 34.4, sub: 'What if children could collect, battle, and trade creatures… just like he once collected insects?' },
  { id: 'v10', t: 40.0, sub: 'Together with his team at Game Freak, he spent years bringing that idea to life.' },
  { id: 'v11', t: 47.6, sub: 'Then, in 1996, Pokémon Red and Green were released in Japan.' },
  { id: 'v12', t: 51.8, sub: 'And a childhood fascination became a worldwide phenomenon.' },
  { id: 'v13', t: 56.0, sub: 'All because one little boy… loved catching bugs.' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
