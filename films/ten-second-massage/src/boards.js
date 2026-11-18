// Preproduction boards and the reel cover: id → { file, w, h, t, draw(ctx, t, W, H) }
import { sheetLeads } from './sheet.js';
import { drawThumb } from './thumb.js';
export const FRAMES = {
  sheet: { file: 'model-sheet', w: 2400, h: 1500, draw: sheetLeads },
  thumb: { file: 'thumbnail', w: 1080, h: 1920, draw: drawThumb },
};
