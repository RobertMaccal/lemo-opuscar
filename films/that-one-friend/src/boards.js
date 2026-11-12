// Preproduction boards: id → { file, w, h, t, draw(ctx, t, W, H) }
import { sheetLeads, sheetActing, sheetCast } from './sheets.js';
import * as B from './shots.js';
const sb = (file, draw, t = 2.4) => ({ file, w: 1080, h: 1920, t, draw });
export const FRAMES = {
  sheet: { file: 'character-sheet', w: 2400, h: 1600, draw: sheetLeads },
  acting: { file: 'character-sheet-acting', w: 2400, h: 1450, draw: sheetActing },
  cast: { file: 'character-sheet-supporting', w: 2400, h: 1400, draw: sheetCast },
  hallway: sb('style-frame-school-hallway', B.bHallway),
  exam: sb('style-frame-examination', B.bExam),
  b01: sb('storyboard-01-before-exam', B.b01),
  b02: sb('storyboard-02-extra-paper', B.b02),
  b02b: sb('storyboard-02b-horror-reaction', B.b02b),
  b03: sb('storyboard-03-post-exam', B.b03),
  b04: sb('storyboard-04-classroom', B.b04),
  b05: sb('storyboard-05-running', B.b05),
  b06: sb('storyboard-06-swimming', B.b06),
  b07: sb('storyboard-07-scoreboard', B.b07),
  b08: sb('storyboard-08-final-sunset', B.b08),
};
