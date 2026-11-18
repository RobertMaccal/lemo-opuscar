// Preproduction boards: id → { file, w, h, t, draw(ctx, t, W, H) }
import { sheetLeads } from './sheet.js';
export const FRAMES = {
  sheet: { file: 'model-sheet', w: 2400, h: 1500, draw: sheetLeads },
};
