// cast.js — one signature colour per recurring character, identical in every shot.
// JEFF: white shirt + RED TIE (signature). Fatigue is shown by `mess` (hair flyaways, loosened tie, untucked shirt) and by expressions.
export const JEFF = { top: 'shirt', color: '#e4e2ea', color2: '#d64a33', legs: '#1a1d2b', head: 'messy', mess: 0 };
export const jeff = (mess = 0) => ({ ...JEFF, mess });
// THE STRANGER: Jeff's exact design, but neat, greyer shirt, dark burgundy tie, cold rim light, steady eyes
export const STRANGER = { ...JEFF, color: '#a9adbd', color2: '#5a1020', mess: 0 };
// THE BOSS: charcoal suit, MUSTARD TIE, grey sides, bigger frame (draw at s × 1.14)
export const BOSS = { top: 'suit', color: '#2b2d3c', color2: '#e0a526', color3: '#cfcbd8', legs: '#20222c', head: 'bossHair', headColor: '#8a8494' };
export const BOSS_S = 1.14;
// PRIYA: the colleague who fetches Jeff — teal cardigan, ponytail with a gold band
export const PRIYA = { top: 'cardigan', color: '#2f9e8a', color2: '#efe6d6', head: 'ponytail', headColor: '#e8b04a' };
// coworkers: distinct silhouettes, quieter colours
export const MARK = { top: 'tshirt', color: '#6b7a3a', face: 'glasses', head: 'none' };
export const DANA = { top: 'dress', color: '#7a4a78', head: 'bun' };
export const LEO = { top: 'hoodie', color: '#575d70', head: 'beanie', headColor: '#3a6ea5' };
export const SAM = { top: 'shirt', color: '#c4b08a', color2: '#4a3a2a', head: 'curly' };
// bus stop extras
export const JOGGER = { top: 'tracksuit', color: '#3fb950', color2: '#ffffff', head: 'headband', headColor: '#f2c21a' };
export const COFFEE = { top: 'trench', color: '#8a6a4a', head: 'ponytail' };
export const MUSIC_GUY = { top: 'hoodie', color: '#b04a6a', head: 'capBack', headColor: '#2a2a3a' };
// phone-video creators (inside Instickram)
export const DOCTOR = { top: 'labcoat', face: 'glasses', head: 'none' };
export const CHAIR_GUY = { top: 'jersey', color: '#f2c21a', number: '12', color2: '#1a1a1a', head: 'headband', headColor: '#e04a3a' };
export const DANCER = { top: 'tshirt', color: '#ff4fa3', head: 'capBack', headColor: '#5ff2e8' };
export const MUD_GUY = { top: 'none', legs: '#3a6ea5', head: 'spiky' };
// at home on the first night: plain white T-shirt and dark sleep pants (the shirt + red tie go on for work)
export const JEFF_HOME = { top: 'tshirt', color: '#e4e2ea', legs: '#2a3050', head: 'messy', mess: 0 };
export const jeffHome = (mess = 0) => ({ ...JEFF_HOME, mess });
