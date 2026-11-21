// THE LAST SAFE TILE — locked configuration.
// Everything that shapes the simulation lives here so a seed + this file fully reproduces a run.

export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const DURATION = 45;
export const FRAMES = FPS * DURATION;          // 2700
export const DT = 1 / FPS;
export const SUBSTEPS = 4;                     // physics substeps per frame (dt = 1/240 s)

// ---- world (board) geometry, in world pixels (1 world px = 1 screen px at camera scale 1)
export const GRID = 10;
export const PITCH = 90;                       // tile pitch
export const BOARD = GRID * PITCH;             // 900
export const SEAM = 5;                         // visual seam only; adjacent active tiles are one surface
export const RAIL_OFFSET = 3;                  // physical + visual rail sits 3 px outside the board edge

// ---- screen layout
export const ARENA = { cx: 540, cy: 920, w: 900, h: 900 };   // initial board: x 90..990, y 470..1370

// ---- balls
export const N_BALLS = 100;
export const R_MIN = 8.8;
export const R_MAX = 11.0;
export const RESTITUTION = 0.78;               // ball–ball
export const RAIL_RESTITUTION = 0.7;
export const FRICTION = 0.06;                  // tangential (Coulomb) coefficient at contacts
export const DAMPING = 0.95;                   // rolling resistance, 1/s (v *= exp(-k dt))
export const GRAVITY = 2900;                   // px/s^2 into the void (≈ 9.8 m/s² at 1 px ≈ 3.4 mm)
export const SUPPORT_THRESHOLD = 0.5;          // weighted contact-patch support needed to stay on the surface
export const SUPPORT_GRACE = 2 / 240;          // numerical grace for marginal edge contact only (two substeps)
export const SUPPORT_HARD = 0.3;              // below this there is no grace at all: the ball drops immediately
export const ELIM_DEPTH_R = 2.2;               // eliminated once it sinks 2.2 radii below the surface
export const FALL_RENDER_TIME = 0.62;          // a falling ball is drawn for this long

// Arena "vibration": the gentle external agitation that keeps the marbles rolling.
// A fixed function of time only (identical for every ball, never looks at the game state).
// Value = agitation acceleration amplitude in px/s². Terminal speed ≈ amplitude / DAMPING.
export const AGITATION_KEYS = [
  [0, 110], [5, 90], [10, 52], [16, 36], [24, 27], [32, 21], [40, 16], [42, 12], [43, 5], [44, 0], [45, 0],
];

// ---- tile collapse pacing (segment end time, collapses in segment)
export const PACING = [
  // [t0, t1, count]
  [0, 4, 4],
  [4, 12, 16],
  [12, 22, 26],
  [22, 31, 28],
  [31, 38.7, 20],
  [39, 42.2, 5],
];
export const CLUSTER = 5;                     // how strongly new holes grow next to existing ones
export const SCATTER_PHASE = 0.06;            // first 6% of collapses are scattered (no clustering)
export const HEART_BIAS = 4;                  // how strongly the arena shrinks toward its seeded heart
export const WARN_TIME = 0.5;                  // orange warning lead time
export const CRIT_TIME = 0.12;                 // red-orange critical phase before collapse

// ---- story beats
export const T_FINAL6 = 38.75;                 // "FINAL 6 TILES"
export const T_REVEAL = 43.0;                  // "1 SURVIVOR."
export const T_RESET = 44.2;                   // loop transition starts
export const GOLD = '#FFD34D';

// ---- camera
export const CAM_OMEGA = 2.6;                  // critically damped spring stiffness (rad/s)
// max zoom allowed over time (camera may zoom less if the survivors need more room)
export const CAM_ZOOM_KEYS = [[0, 1], [20, 1], [28, 1.25], [34, 1.6], [39, 2.0], [41.2, 2.6], [43, 3.5], [44.2, 3.7]];

export const DEFAULT_SEED = 326;               // locked: chosen by scripts/test-seeds.js (4,000 seeds), genuine GOLD win
