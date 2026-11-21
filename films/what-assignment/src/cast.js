// The cast: dimensions, outfits, resting posture, expression and pose libraries.
import { P } from './kit.js';
import { DIMS } from './rig.js';

// ---- expressions (overrides on EXPR0) ----
export const X = {
  neutral: {},
  happy: { mS: .95, mO: .32, lidB: .22, browH: .35, browC: .5 },
  relieved: { eyeOpen: .05, closeCurve: 1, mS: .8, mO: .28, browH: .25, browA: .4, sweat: .35 },
  worried: { browA: .75, browH: .3, mS: -.55, mW: .8, gy: .15, sweat: .3 },
  anxious: { eyeOpen: 1.2, pup: .72, browA: .95, browH: .45, mWavy: 1, mW: 1.1, sweat: 1 },
  cooked: { eyeOpen: 1.15, pup: .7, browA: 1, browH: .5, mO: .5, mW: .85, mS: -.7, sweat: .8 },
  confused: { browAsym: .7, browA: .2, mS: -.2, mW: .6, mSkew: .6, gx: .35 },
  shocked: { eyeOpen: 1.45, pup: .42, browH: 1, browA: .3, mO: .62, mW: .5, mS: -.2, pale: .4 },
  horror: { eyeOpen: 1.62, pup: .3, browH: 1.1, browA: .85, mO: .8, mW: .62, mS: -.6, pale: .8, sweat: .9, gloom: .35 },
  mortified: { eyeOpen: 1.12, pup: .46, browA: .9, browH: .25, mTeeth: 1, mW: .95, mO: .25, gloom: 1, pale: .6 },
  hollow: { eyeOpen: 1.3, pup: .26, browA: .55, browH: .5, mO: 0, mW: .34, mS: -.1, gloom: .9, pale: .85 },
  embarrassed: { blush: 1, browA: .65, mWavy: .85, gy: .4, sweat: .5 },
  exhausted: { lidT: .55, lidAng: -.22, browA: .55, browH: -.1, mO: .5, mW: .7, mS: -.5, sweat: .85, gy: .25 },
  sarcastic: { lidT: .46, browAsym: .75, browH: -.1, mS: -.05, mW: .7, mSkew: .7, gx: .55 },
  deadpan: { lidT: .5, browH: -.35, browC: 0, mS: 0, mW: .55 },
  despair: { eyeOpen: .05, closeCurve: -1, browA: 1, browH: .35, mO: .5, mW: .9, mS: -1, gloom: .55 },
  determined: { browA: -.7, browH: -.25, mTeeth: 1, mW: .8, lidT: .16, lidAng: .3, sweat: .5 },
  smug: { lidT: .3, lidAng: .22, browA: -.3, browAsym: .35, mS: 1, mW: 1.05, mSkew: .5, lidB: .25, gx: .6 },
  how: { eyeOpen: 1.5, pup: .34, browA: -.15, browH: 1, mO: 1, mW: .9, mS: -.4 },
  delighted: { eyeOpen: 1.1, browH: .7, browC: .6, mS: 1, mO: .7, mW: 1.05, sweat: .6 },
  gasp: { eyeOpen: 1.05, lidT: .2, browA: .7, browH: .3, mO: .85, mW: .7, mS: -.2 },
  sigh: { lidT: .62, lidAng: -.2, browA: .45, browH: -.2, mO: .28, mW: .5, mS: -.3, gy: .5 },
  // this film
  blank: { eyeOpen: .82, pup: .62, browH: .05, browA: 0, browC: 0, mS: 0, mW: .42, mO: 0 },
  huh: { eyeOpen: 1.12, pup: .6, browAsym: .9, browH: .45, browA: .1, mO: .45, mW: .55, mS: -.15, mSkew: .4 },
  doom: { eyeOpen: 1.18, pup: .34, browA: .95, browH: .55, mO: 0, mW: .5, mS: -.75, mWavy: .7, pale: .9, gloom: 1, sweat: 1 },
  proud: { lidT: .4, lidB: .22, browH: .2, browA: -.1, mS: 1, mW: 1.0, mSkew: .35, gx: -.4 },
  // Jack
  chill: { lidT: .46, browH: -.05, browC: .1, mS: .4, mW: .55 },
  hmm: { lidT: .4, browAsym: .6, mW: .36, mO: .3, mS: 0 },
  jackTalk: { lidT: .44, mW: .5, mO: .4, mS: .1 },
  jackConfused: { lidT: .22, browA: .45, browAsym: .45, mS: -.15, mW: .46, mO: .22 },
  yawn: { eyeOpen: .05, closeCurve: -1, browH: .45, browA: .3, mO: 1, mW: .6, mS: -.2 },
  friendly: { lidT: .28, lidB: .3, mS: .95, mW: .8, mO: .3, browH: .25 },
  score: { lidT: .4, lidB: .2, mS: .8, mW: .6, gy: .7, browH: .1 },
  // adults
  tired: { lidT: .38, lidAng: -.12, browH: -.15, mS: -.2, mW: .7 },
  stern: { lidT: .25, lidAng: .22, browA: -.55, browH: -.2, mS: -.35, mW: .7 },
  dry: { lidT: .4, browAsym: .7, mS: .25, mSkew: .7, mW: .6 },
  flat: { lidT: .32, browH: -.2, browC: 0, mS: -.1, mW: .5 },
  bark: { browA: -.45, mO: .7, mW: .9, mS: .1, browH: .1 },
};

// ---- characters ----
const mk = o => ({ ...DIMS, skin: P.skin, ...o });
P.ray = '#D2483C'; P.kai = '#3563B8';
// RAY: asks the question. Red hoodie, messy hair, restless.
export const RAY = mk({
  name: 'RAY', R: 80, torso: 146, sw: 50, ul: 90, ll: 90, kind: 'hoodie', hood: true, top: P.ray, string: P.cream, pants: '#2B2744',
  shoe: P.white, sole: '#B9B3CC', shoeTrim: P.ray, hair: 'messy', hairCol: P.ink,
  face: { browA: .1, mS: .2 }, rest: { shrug: .15, lL: { x: -22 }, lR: { x: 22 } },
});
// KAI: unbothered. Cobalt bomber over a cream tee, curly hair, half-lidded.
export const KAI = mk({
  name: 'KAI', R: 78, torso: 154, sw: 52, ul: 96, ll: 96, legW: 29, kind: 'open', top: P.kai, inner: P.cream, pants: '#3A3552', cuffs: true,
  shoe: '#EADBBD', sole: '#8A7F74', shoeTrim: P.kai, hair: 'curly', hairCol: '#2A2238',
  face: X.chill, rest: { shrug: -.25, head: { tilt: .04 } },
});
export const CAST = { RAY, KAI };

// ---- lights ----
export const LIGHT = {
  // light from upper right, warm
  studio: { dx: -.78, dy: .62, rim: '#FFEBBE', rimA: .92, rimW: 5, shade: P.plum, shadeA: .24, shadeW: 15, shadow: { kx: -.42, ky: .14, a: .26, blur: 6, col: P.plum } },
};
export const light = (o = {}, base = 'studio') => { const b = LIGHT[base]; return { ...b, ...o, shadow: o.shadow === null ? null : { ...b.shadow, ...(o.shadow || {}) } }; };
