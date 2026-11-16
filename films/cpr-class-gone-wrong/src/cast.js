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

// ---- characters: CPR CLASS GONE WRONG ----
const mk = o => ({ ...DIMS, skin: P.skin, ...o });
// leads: one bold garment colour each
export const HALE = mk({   // the teacher
  name: 'TEACHER', R: 72, torso: 168, sw: 52, hw: 36, ul: 106, ll: 106, ua: 76, fa: 72, armW: 24, legW: 26, kind: 'open', top: '#DCC59A', inner: '#F4E9CF', buttons: true,
  pants: '#2F2B48', shoe: P.woodDark, hair: 'short', hairCol: '#5A4C5E', browCol: '#4A3F55', browW: .1, glasses: true,
  face: { ...X.tired, lidT: .3 }, rest: { shrug: -.05, head: { oy: 2 } },
});
export const VOL = mk({    // the volunteer
  name: 'VOLUNTEER', R: 80, torso: 146, sw: 50, ul: 92, ll: 92, kind: 'hoodie', hood: true, top: '#2C4E96', pants: '#7A7690',
  shoe: P.white, sole: '#B9B3CC', shoeTrim: '#2C4E96', hair: 'messy', hairCol: P.ink, browW: .1,
  face: { browA: -.1, mS: .3 }, rest: { shrug: .05, lL: { x: -24 }, lR: { x: 24 } },
});
export const PARK = mk({   // the parking-lot student
  name: 'PARKING LOT', R: 77, torso: 150, sw: 49, ul: 94, ll: 94, kind: 'open', top: '#6E8C62', inner: '#E8DCC0', pants: '#3D3854',
  shoe: '#EADBBD', sole: '#8A7F74', hair: 'tousled', hairCol: '#3A2E36', face: { lidT: .3, mS: .25 }, rest: { shrug: -.25, lean: -.03, head: { tilt: .06 } },
});
export const CHRIS = mk({  // Christopher
  name: 'CHRISTOPHER', R: 79, torso: 140, sw: 47, ul: 88, ll: 88, kind: 'sweater', top: '#EE8A3C', pants: '#3F3A58',
  shoe: P.white, sole: '#B9B3CC', hair: 'curly', hairCol: '#4A3226', face: { eyeOpen: 1.18, pup: .8, browA: .35, browH: .2, mS: -.1, mW: .7 }, rest: { shrug: .45, head: { oy: 6 } },
});
export const DONOR = mk({  // the organ-donor student
  name: 'DONOR', R: 76, torso: 158, sw: 52, ul: 98, ll: 98, kind: 'open', top: '#8E2F45', inner: '#2E2A48', pants: '#2B2742',
  shoe: P.ink, sole: '#56506E', hair: 'short', hairCol: '#1E1A30', face: { lidT: .42, browH: -.15, browA: -.15, mS: .12, mW: .62 }, rest: { shrug: -.3, head: { tilt: -.02 } },
});
// classmates: a step quieter
export const MAYA = mk({ name: 'MAYA', R: 76, torso: 140, sw: 46, armW: 23, legW: 25, kind: 'sweater', top: '#D9B460', pants: '#4A4462', shoe: P.white, hair: 'bun', hairCol: '#3A2A30', face: { mS: .3 }, rest: {} });
export const LENA = mk({ name: 'LENA', R: 76, torso: 140, sw: 46, armW: 23, legW: 25, kind: 'hoodie', hood: true, top: '#DE8A72', string: P.paper, pants: '#3D3854', shoe: P.white, hair: 'pony', hairCol: '#5B352F', face: { mS: .5, browH: .1 }, rest: {} });
export const PRIYA = mk({ name: 'PRIYA', R: 75, torso: 140, sw: 46, armW: 23, legW: 25, kind: 'sweater', top: '#5E9A97', pants: '#2E2A48', shoe: P.cream, hair: 'pony', hairCol: '#1E1828', face: { browA: .2 }, rest: { shrug: .2 } });
export const NORA = mk({ name: 'NORA', R: 76, torso: 140, sw: 46, armW: 23, legW: 25, kind: 'sweater', top: '#A79BC4', pants: '#3D3854', shoe: P.cream, hair: 'bun', hairCol: '#6B4A3A', glasses: true, face: { lidT: .1 }, rest: {} });
export const BEN = mk({ name: 'BEN', R: 78, torso: 144, sw: 50, kind: 'hoodie', hood: true, top: '#C9AE84', string: P.paper, pants: '#4A4462', shoe: P.white, hair: 'cap', hairCol: '#2E2638', capCol: '#C8643A', face: { mS: .4 }, rest: {} });
export const TOM = mk({ name: 'TOM', R: 77, torso: 146, sw: 51, kind: 'track', top: '#7E8650', stripe: P.cream, pants: '#3D3854', shoe: P.white, hair: 'curly', hairCol: '#2A2238', face: { mS: .35 }, rest: {} });
export const SAM = mk({ name: 'SAM', R: 76, torso: 144, sw: 49, kind: 'sweater', top: '#6E7E95', pants: '#2E2A48', shoe: P.cream, hair: 'messy', hairCol: '#5A3A2A', face: { mS: .2 }, rest: {} });
export const CAST = { HALE, VOL, PARK, CHRIS, DONOR, MAYA, LENA, PRIYA, NORA, BEN, TOM, SAM };
