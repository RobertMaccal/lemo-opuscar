// Single source of truth: shots, key events, narration lines. Times in seconds on the film (≈ 3:15).
// Narration times come from the recorded take + inserts (vo.js, written by tools/vo_layout.py); events below are locked to its words.
import { VO, VO_DUR } from './vo.js';
export { VO };
export const DUR = VO_DUR;
export const FPS = 30;

export const SHOTS = [
  // Act I — the bug boy
  { id: 'leaf', set: 'country', a: 0.0, b: 5.3 },
  { id: 'path', set: 'country', a: 5.3, b: 14.3 },
  { id: 'stream', set: 'country', a: 14.3, b: 22.6 },
  { id: 'change', set: 'country', a: 22.6, b: 31.4 },
  { id: 'wire', set: 'country', a: 31.4, b: 35.0 },
  // Act II — the idea, the hard years
  { id: 'desk', set: 'room', a: 35.0, b: 40.2 },
  { id: 'tunnel', set: 'tunnel', a: 40.2, b: 43.6 },
  { id: 'eureka', set: 'room', a: 43.6, b: 48.0 },
  { id: 'studio', set: 'studio', a: 48.0, b: 57.4 },
  { id: 'quit', set: 'studio', a: 57.4, b: 64.2 },
  { id: 'boot', set: 'studio', a: 64.2, b: 68.6 },
  // Act III — launch, the Mew secret, the phenomenon
  { id: 'world', set: 'world', a: 68.6, b: 76.4 },      // date caption; "sales were modest": an empty square, a tumbleweed
  { id: 'secret', set: 'world', a: 76.4, b: 79.6 },     // a pink glow hidden in the grass
  { id: 'prank', set: 'studio', a: 79.6, b: 86.3 },     // a programmer sneaks it in at night
  { id: 'mail', set: 'studio', a: 86.3, b: 95.0 },      // 78,000 postcards flood the studio
  { id: 'rush', set: 'world', a: 95.0, b: 101.0 },      // kids pour in from every side
  { id: 'phenom', set: 'world', a: 101.0, b: 106.0 },   // two kids link up, a creature arcs between them
  { id: 'lights', set: 'world', a: 106.0, b: 110.6 },
  { id: 'cards', set: 'cardcity', a: 110.6, b: 117.2 },
  { id: 'pockets', set: 'cardcity', a: 117.2, b: 119.4 },
  { id: 'no1', set: 'cardcity', a: 119.4, b: 127.2 },
  // Act IV — cardboard gold
  { id: 'hall', set: 'auction', a: 127.2, b: 141.4 },
  { id: 'sale', set: 'auction', a: 141.4, b: 154.1 },
  { id: 'crayon', set: 'auction', a: 154.1, b: 159.0 },
  { id: 'truck', set: 'country', a: 159.0, b: 164.7 },
  // Act V — what comes next
  { id: 'coast', set: 'world', a: 164.7, b: 172.3 },
  { id: 'graph', set: 'graph', a: 172.3, b: 181.3 },
  { id: 'kids', set: 'world', a: 181.3, b: 188.9 },
  { id: 'home', set: 'country', a: 188.9, b: DUR },
];
// Cross-dissolves around t (half-length d)
export const XF = [
  { t: 35.0, d: .45 },    // power line → link cable
  { t: 68.6, d: .35 },    // green screen → full-colour world
  { t: 79.6, d: .3 },     // the glow → the programmer's screen
  { t: 95.0, d: .3 },     // postcards → the rush
  { t: 110.6, d: .3 },    // lit map → card city
  { t: 127.2, d: .35 },   // card city → auction hall
  { t: 159.0, d: .3 },    // crayons → garbage truck
  { t: 164.7, d: .4 },    // dusk town → dawn coast
  { t: 172.3, d: .3 },    // coast → price chart
  { t: 181.3, d: .3 },    // chart → kids
  { t: 188.9, d: .45 },   // screen → leaf
];
export const T = {
  // Act I
  dewSlide: .5, dewDrop: 2.6, boyIn: 2.9,
  nameIn: 5.6, kneel: 11.6, write: 15.4,
  standUp: 18.6, rareTitle: 19.9,
  changeStart: 23.2, changeEnd: 30.4, netLower: 27.0, bugsGone: 28.8,
  // Act II
  spark: 38.8, dive: 40.2, popOut: 43.8, wow: 44.3, rack: 44.7,
  devCap: 49.0, coin0: 53.1, coin1: 55.1,
  wallet: 57.7, quit1: 59.9, quit2: 60.5,
  dark: 63.8, boot: 65.0,
  // Act III
  dateIn: 66.4, modest: 72.6, tumble: 73.4, secret: 76.7, prog: 79.8, mew: 85.4,
  mailIn: 86.7, entries: 91.8, rushIn: 95.1,
  games: 106.4, cardsCap: 110.9, perPerson: 113.7, where: 117.4, no1: 120.2,
  // Act IV
  slab: 128.0, prize98: 133.3, buy21: 141.7, sold26: 148.5, gavel: 152.1, record: 154.6, crayonDrop: 157.5, mom: 159.9,
  // Act V
  gen2027: 168.3, climb: 172.7, rocker: 175.4, fog: 176.8, crash: 178.5,
  shrink: 187.6, smile: 190.0, fly: 191.8,
};
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
