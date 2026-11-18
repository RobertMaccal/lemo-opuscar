// The cast of THE 10-SECOND MASSAGE: two leads, their expression library, the room's light.
import { P } from './kit.js';
import { DIMS } from './rig.js';

// ---- expressions (overrides on EXPR0) ----
export const X = {
  neutral: {},
  // him
  bliss: { eyeOpen: .05, closeCurve: 1, mS: .9, mW: 1.05, browH: .3, browC: .5, blush: .35 },
  melt: { eyeOpen: .05, closeCurve: 1, mS: 1, mO: .34, mW: 1.15, browH: .55, browA: .35, browC: .6, blush: .7 },
  puddle: { eyeOpen: .05, closeCurve: 1.2, mS: 1.05, mO: .5, mW: 1.2, browH: .7, browA: .5, browC: .7, blush: .9 },
  content: { lidT: .42, lidB: .25, mS: .95, mW: 1.05, browH: .25, browC: .5, blush: .3 },
  smile: { mS: .9, mW: 1, lidB: .2, browH: .3, browC: .45 },
  alarm: { eyeOpen: 1.35, pup: .48, browH: .9, browA: .25, mO: 0, mW: .5, mS: -.15 },
  frozen: { eyeOpen: 1.5, pup: .4, browH: 1.05, browA: .35, mO: .12, mW: .42, mS: -.25, sweat: .55 },
  idea: { eyeOpen: 1.32, pup: .62, spark: 1, browH: .8, browA: -.15, mS: .55, mW: .9, mSkew: .4 },
  liar: { eyeOpen: 1.35, pup: .52, browH: 1.05, browA: -.1, mO: .85, mW: .95, mS: .25, spark: .6 },
  sly: { lidT: .32, lidAng: .25, browA: -.45, browAsym: .3, mS: .85, mW: .8, mSkew: .7, lidB: .2 },
  sneak: { lidT: .12, eyeOpen: 1.05, pup: .62, browA: .3, browH: .35, mS: .4, mW: .6, mSkew: .4 },
  caught: { eyeOpen: 1.55, pup: .36, browH: 1.15, browA: .55, mO: .3, mW: .45, mS: -.3, sweat: .7, pale: .25 },
  awkward: { eyeOpen: 1.12, pup: .58, browA: .85, browH: .45, mTeeth: 1, mW: 1.05, mO: .25, sweat: .9, blush: .25 },
  nervous: { eyeOpen: 1.1, pup: .6, browA: .7, browH: .35, mS: .7, mO: .45, mW: .95, sweat: .7 },
  pumped: { eyeOpen: 1.12, browA: -.35, browH: .2, mS: .8, mW: .95, mTeeth: 0 },
  eager: { eyeOpen: 1.15, browH: .55, browA: -.2, mS: .85, mW: .9, mO: .18 },
  bored: { lidT: .5, lidAng: -.12, browH: -.15, browA: .2, mS: -.05, mW: .55, gy: .25 },
  done: { lidT: .62, lidAng: -.15, browH: -.25, mS: -.15, mW: .45, gy: .2 },
  proud: { eyeOpen: .05, closeCurve: 1.2, mTeeth: 1, mW: 1.25, mO: .45, browH: .7, browA: -.25, browC: .55 },
  beam: { eyeOpen: 1.12, lidB: .3, mS: 1.1, mO: .62, mW: 1.25, browH: .75, browC: .6 },
  waiting: { eyeOpen: 1.05, lidB: .35, mTeeth: 1, mW: 1.2, mO: .3, browH: .8, browC: .6, gx: -.45, gy: .35 },
  // her
  loving: { lidB: .32, lidT: .12, mS: .85, mW: .8, browH: .3, browC: .5, gy: .5 },
  sweet: { lidB: .25, mS: .95, mW: .85, mO: .25, browH: .45, browC: .55 },
  hopeful: { eyeOpen: 1.14, pup: 1.12, browH: .75, browA: .45, mS: .7, mW: .7, mO: .2 },
  confused: { browAsym: .7, browA: .2, mS: -.2, mW: .55, mSkew: .5 },
  curious: { eyeOpen: 1.08, browH: .45, browAsym: .3, mO: .15, mW: .45, mS: .1 },
  suspicious: { lidT: .36, lidAng: .12, browAsym: 1.05, browA: -.3, browH: .05, mS: -.1, mW: .5, mSkew: -.5 },
  firm: { lidT: .22, browAsym: 1.1, browA: -.35, browH: .2, mS: .15, mW: .7, mO: .25 },
  relaxed: { eyeOpen: .05, closeCurve: 1, mS: .55, mW: .7, browH: .2, browC: .35 },
  sinking: { eyeOpen: .05, closeCurve: 1.1, mS: .75, mO: .18, mW: .8, browH: .4, browA: .3, browC: .5, blush: .3 },
  waking: { lidT: .55, mS: .2, mW: .6, browH: .1, gy: -.1 },
  flat: { lidT: .4, browH: -.15, browC: 0, mS: 0, mW: .5 },
  disbelief: { lidT: .3, eyeOpen: 1.05, pup: .66, browAsym: 1.25, browA: -.2, browH: .25, mO: .2, mW: .4, mS: -.2 },
  unimpressed: { lidT: .52, lidAng: .06, browAsym: 1.35, browA: -.3, browH: .1, browC: .05, mO: .1, mW: .44, mS: -.32, mSkew: -.3 },
};

// ---- characters ----
const mk = o => ({ ...DIMS, skin: P.skin, ...o });
export const C_HIM = '#2F4F9E', C_HER = '#8E6FC4';
export const HIM = mk({
  name: 'HIM', R: 80, torso: 150, sw: 53, hw: 35, ul: 90, ll: 90, kind: 'hoodie', hood: true, top: C_HIM, string: P.cream, pants: '#2A2742',
  shoe: '#D9CBB0', sole: '#8A7F74', shoeTrim: '#B9A98E', hair: 'messy', hairCol: P.ink,
  face: { browA: .1, mS: .2 }, rest: { shrug: .15, lL: { x: -24 }, lR: { x: 24 } },
});
export const HER = mk({
  name: 'HER', R: 76, torso: 140, sw: 50, hw: 34, ul: 88, ll: 88, armW: 23, legW: 25, hand: 13, kind: 'sweater', top: C_HER, pants: '#2B2840',
  shoe: '#EFD9C9', sole: '#B79F94', hair: 'pony', hairCol: '#2A2238',
  face: { mS: .35, browH: .1 }, rest: { shrug: 0, lL: { x: -22 }, lR: { x: 22 } },
});
export const CAST = { HIM, HER };
