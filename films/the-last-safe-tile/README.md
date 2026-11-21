# THE LAST SAFE TILE

**100 balls. 100 tiles. One last safe spot.** A deterministic 45-second physics short made entirely in code:
HTML5 Canvas 2D, 1080 × 1920 (9:16), 60 fps, 2,700 frames, procedural sound effects only.

- Final video: `output/the_last_safe_tile_45s.mp4`
- Verification report: `output/verification-report.md` (+ `.json`, QC stills in `output/qc/`)
- Seed used for the final video: **326** (`DEFAULT_SEED` in `src/config.js`, simulation checksum `250558a6`)

## Requirements

- Node.js ≥ 18 (tested on 22)
- FFmpeg + FFprobe on `PATH` (only for rendering / verifying the MP4)
- Playwright with Chromium (only for rendering): `npm install && npx playwright install chromium`
  (a globally installed Playwright also works; set `PLAYWRIGHT_CHROME=/path/to/chrome` to use another Chromium)

No other dependencies. No remote assets: the font (Space Grotesk, OFL) is in `fonts/`.

## Launch the preview

```sh
npm run preview          # → http://127.0.0.1:8173/index.html
```

Any static server works too (ES modules need `http://`, not `file://`). Controls:

| Control | What it does |
|---|---|
| Play / Pause (Space) | start / stop playback (loops seamlessly) |
| Restart (R) | jump to frame 0 and play |
| Sound (M) | mute / unmute (Web Audio plays the same synthesized mix as the MP4) |
| Seed + Load / Random | bake and play another run (also `index.html?seed=N`) |
| Speed | 0.25× · 0.5× · 1× · 2× |
| Timeline | scrub to any frame (←/→ step one frame) |
| Export (WebM) | real-time in-browser recording fallback; use `npm run render` for the frame-perfect MP4 |

The stats panel shows the run's survivors, winner, the gold ball's fate and the simulation checksum.

## Reproduce the final outcome

The whole film is a pure function of the seed plus `src/config.js`:

```sh
node scripts/audit-physics.js --seed <SEED>   # prints checksum, survivors, physics audit
```

The same checksum is computed in the browser (`window.BAKE_INFO`), and the renderer refuses to export if they differ.

## Find new seeds

```sh
npm run seeds -- --count 2000 --workers 4    # ranks seeds, writes output/seed-report.json
```

Every candidate runs the real simulation headlessly and is scored on: one final survivor, stability of
the result through the reveal, survivors at 10/20/30/39/41.5/43 s, near misses (balls that leave a warning
tile before it falls; edge teeters), the longest stretch without an elimination, and a bonus if the gold
ball genuinely wins. Change `DEFAULT_SEED` in `src/config.js` (or use `--seed`) to switch runs.

## Render and verify a video

```sh
npm run render -- --seed <SEED> --workers 4   # → output/the_last_safe_tile_45s.mp4 (+ audio_mix.wav, render-info.json)
npm run verify                                # → output/verification-report.md, output/qc/
```

`render-video.js` bakes the run, renders every frame in parallel headless Chromium workers through
`renderFrame(frameIndex)`, pipes JPEG frames (q96) straight into x264 (CRF 17, `yuv420p`, BT.709), synthesizes the SFX mix from the same
event timeline (48 kHz, ≈ −17 LUFS) and muxes AAC with `+faststart`. The true peak is measured *after* AAC encoding and the
limiter ceiling is lowered until it sits at or below −1.2 dBTP. `--remux` re-does only the audio on an existing export.
`--range a:b` renders a slice for quick tests.

`verify-output.js` checks codec, resolution, 60/1 fps, exactly 2,700 decoded frames, durations, fast start, the loop seam
(last frame vs first frame), black frames, duplicate frames, loudness / true peak / full-scale samples, audio–video sync
at the tile collapses, and extracts QC stills at 0, 2, 5, 10, 15, 20, 25, 30, 35, 39, 41, 43, 44.5 s plus a contact sheet.

## How it works

```
src/config.js        every tunable: timing, physics, pacing, camera, the locked seed
src/seededRandom.js  mulberry32 + hashed sub-streams (balls, colours, motion, tiles, timing, fx…)
src/tiles.js         collapse schedule (seed only, computed before the simulation), tile state machine, fracture + crack geometry
src/physics.js       contact-patch support, ball–ball impulses (uniform-grid broad phase), perimeter rails
src/simulation.js    bake(seed): fixed 1/60 s step × 4 substeps; records every frame; stats + checksum
src/camera.js        critically damped camera baked per frame, loop blend, tiny late-collapse impulses
src/particles.js     analytic (closed-form) shards, sparks and elimination particles
src/renderer.js      renderFrame(f): void layer → tiles → rails → trails + balls → particles → bloom → UI → loop transition
src/timeline.js      sound cues from the baked run (collision rate limiting, grouped falls, accents)
src/audio.js         pure-DSP synthesis, reverb, bus compressor, look-ahead limiter, WAV writer
src/main.js          preview app and render hooks (index.html?render=1)
scripts/             test-seeds, render-video, verify-output, audit-physics, stills, serve
```

### The rules (no cheating)

- **Balls**: 100 glass marbles, radius 8.8–11 px, mass ∝ r³, semi-implicit Euler at 240 Hz, rolling resistance,
  impulse collisions (restitution 0.78, Coulomb friction, positional correction with slop), perimeter rails (restitution 0.7)
  that exist only beside perimeter tiles that still exist.
- **Agitation**: each marble feels a gentle push whose heading wanders smoothly (closed form in time). Its strength follows one
  global, fixed curve (`AGITATION_KEYS`): lively in the hook, calmer later, powering down after the last collapse.
  It never looks at the game state and is the same for every ball, the gold one included.
- **Support**: 13 weighted samples over the contact patch; adjacent active tiles form one surface (seams are visual only).
  Below 50 % support a ball falls; with less than 30 % it falls at once, otherwise after at most two substeps (8 ms, numerical only).
  Falling keeps the planar velocity, adds gravity (2,900 px/s²), leaves the collision set and never comes back.
  The counter ticks when the ball has sunk 2.2 radii below the surface.
- **Tiles**: ACTIVE → WARNING (orange, cracks, 0.5–0.95 s) → CRACKING (red-orange, sparks, 0.12–0.2 s) → COLLAPSED.
  The order is a seeded draw: early holes are scattered, later holes grow next to existing ones, biased toward a seeded
  "heart" so the arena converges. It's computed before the simulation and never depends on where any ball is.
  Pacing follows the brief: 4 / 16 / 26 / 28 / 20 / 5 collapses in 0–4 / 4–12 / 12–22 / 22–31 / 31–39 / 39–42 s.
- **Loop**: from 44.2 s the last tile pulses, the arena reassembles in a mosaic wave and the opening layout reappears,
  holding the exact frame-0 picture for the final frames. This is an editorial transition after the competition, not physics.

## Final run (seed 326)

Chosen from 4,000 simulated seeds (`output/seed-search.txt`): 736 ended with exactly one survivor, 16 of them with a genuine gold win.
Seed 326 scored highest, with no rule changes and no protection for the gold ball.

| | |
|---|---|
| Balls alive at 10 / 20 / 30 / 39 / 41.5 / 43 s | 70 / 41 / 24 / 6 / 2 / 1 |
| First elimination | 1.57 s (three balls ride the first collapsing tile down) |
| Longest stretch without an elimination (2–42 s) | 2.5 s |
| Near misses | 10 (6 balls leave a warning tile before it falls) |
| Endgame | at 40.90 s three balls drop as the board goes to two tiles. LIME #9 is left on the second-to-last tile, GOLD #43 on the last one. The doomed tile flashes for 0.95 s and LIME falls at 42.05 s |
| Result | **1 survivor: the GOLD ball (#43)** on tile 4 (top row) |
| Physics audit (`scripts/audit-physics.js`) | max ball overlap 0.06 px, 0 floating frames, 0 resurrections, counters match the eliminations on every frame, max step 2.2 px/frame |

Export (`output/verification-report.md`): 1080 × 1920, 60/1 fps, **2,700 frames, 45.000 s**, H.264 High yuv420p (CRF 17),
AAC 48 kHz stereo at −17.8 LUFS, −2.8 dBTP true peak, 0 full-scale samples. Last frame vs first frame: mean difference 0.86/255.
No black frames, no duplicate frames, audio onsets within 1 ms of the tile collapses. File size 18.6 MB.
