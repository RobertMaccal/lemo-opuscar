# THE ONE-PIXEL BRIDGE

100 glowing balls race up a bridge over a black void. The bridge narrows to a 1 px rail; wind, sweepers and curves
push competitors off one by one. One small golden ball is the one we follow.

- **Deliverable:** `one_pixel_bridge_45s.mp4`: 1080×1920 (9:16), 60 fps, 2,700 frames, exactly 45.000 s,
  H.264 High + AAC 48 kHz, sound effects only, about −14 LUFS.
- **Everything is simulated.** No keyframes and no scripted eliminations. The survivor counter reads the number of
  active balls straight from the simulation.

## Run and preview

```bash
node export.js --stills 0,20,40.2          # a few review stills (no server needed; uses the bundled Chromium)
python3 -m http.server 8000                # then open http://localhost:8000/
```

The preview page (`index.html`) plays the film in real time at any window size. The canvas renders at a native
1080×1920 and is scaled to fit.

| Control | What it does |
|---|---|
| ▶ / space | play / pause (the film loops) |
| slider, ← → (shift = 1 s) | scrub frame by frame |
| 🔊 / M | mute / unmute the procedural audio |
| seed box + **run** | re-simulate with another seed (`index.html?seed=42` works too) |

ES modules need a local server to load, so opening the file directly with `file://` won't work.

## Export

```bash
node export.js                       # default seed (6783) → one_pixel_bridge_45s.mp4
node export.js --seed 42 --workers 4 --out race_42.mp4
node export.js --audio-only          # just out/sfx.wav
```

What the exporter does:
1. Runs headless Chromium (Playwright) on the page in `?export=1` mode.
2. The page simulates the whole race once, at a fixed 1/60 s step with four 240 Hz substeps.
3. `renderFrame(n)` draws frame *n* = time *n*/60 s. It is a pure function of the stored simulation, so frames render
   in any order and in parallel.
4. Frames go to ffmpeg as JPEG and are encoded to H.264. The segments from each worker are joined losslessly.
5. The soundtrack is rendered by the same Web Audio code through `OfflineAudioContext`, from the same event log.
   It is normalised with two-pass `loudnorm` to −14 LUFS and muxed as AAC.
6. ffprobe checks the result: dimensions, frame rate, frame count and duration.

Needs Node 18+, ffmpeg and ffprobe, and Playwright with Chromium (`npm i playwright && npx playwright install chromium`
if it isn't installed already).

## Seeds and testing

```bash
node tools/seeds.mjs 1 2000 out/seeds.jsonl   # batch search (each seed is cut short as soon as gold falls)
node tools/gold.mjs 6783                       # the gold ball's diary: margin to the edge, collisions, rank
node tools/railwob.mjs 6783                    # gold's offset from the rail in the last seconds
```

For every seed the search records:
- survivors at 10, 19, 29 and 37 s, and the final count;
- the finishers, and whether and when gold finishes;
- the time of the last elimination;
- every near miss (a ball whose centre went over an edge and that recovered), with its time and depth.

`score()` in `tools/seeds.mjs` ranks the seeds against the storyboard targets. `out/seed_report.jsonl` holds the
report for seeds 6001–7000.

**The chosen run, seed 6783.** All numbers come from the simulation:

| | 10 s | 19 s | 29 s | 37 s | end |
|---|---|---|---|---|---|
| survivors | 97 | 51 | 7 | 2 | **1 (gold)** |

- **14 s:** gold is caught in a pile-up and hit by a sweeper.
- **16.5–17 s:** the field falls from 83 to 59 around it.
- **19.5 s:** gold is within 1.3 radii of the edge.
- **33 s:** a gust leaves it 0.13 radii from the edge as the field drops from 6 to 2.
- **From 34 s:** a duel with one rival on the narrowing bridge, then the rail.
- **39–40.6 s:** in the last gust, gold drifts 10.7 px off the 1.2 px rail; support is lost at about 11.1 px. Its own
  steering brings it back to 8 px before the finish pad catches it. The rival falls at 40.1 s, and gold finishes alone
  at 40.6 s.

**How the seed was found.** The course was designed first and is identical for every seed: the geometry, the gust
schedule, the late turbulence and the sweeper phases. Then about 7,000 seeds were simulated. The sole-gold
candidates were re-run with the final code, and the best one by `score()` was picked.

**What the search did not do.** Nothing in the run was edited afterwards: no spawning or removing balls, no rule
changes near the end, no teleporting and no faked counts. Determinism holds across engines: Node's V8 and Chromium
give identical results for a seed.

## Physics in one page (`src/physics.js`)

- **Balls.** 100 discs of radius 13, mass 1 ± 4%. Each has seeded traits: cruising speed, steering authority,
  reaction lag, damping, lane preference, wind feel and a slow wobble. Gold (`#FFD34D`, id 0) is drawn from the same
  distributions as everyone else.
- **Driving.** Each ball applies forward thrust along the path tangent and a lateral steering force. Steering is a
  PD controller that reads its own position with a lag, saturates at the ball's authority, and grows urgent near an
  edge. Air drag pulls each ball toward the wind velocity.
- **Collisions.** Ball–ball collisions use a spatial hash, positional correction, and impulses with restitution 0.6
  and mass weighting. Sweepers are kinematic capsules of infinite mass that move sinusoidally across the path. At
  240 Hz no ball moves more than about 2 px per substep, so nothing tunnels through.
- **One support rule everywhere.** A ball is supported while its centre is over the surface. Past an edge, it pivots
  on the edge like a solid sphere: horizontal acceleration is 5/7 · g · sinφ · cosφ. It leaves the surface at
  φ = 54° (cos φ = 10/17), about 0.81 R of overhang.
  - The final rail is the same rule applied to a 1.2 px surface. A ball can balance there with its centre over the
    rail, and it falls as soon as it can't hold that.
- **Falling.** A ball that falls keeps its momentum, drops under gravity, shrinks with depth and fades into the void.
  The bridge hides it as it passes underneath.
- **Finishing.** A finish counts only once the ball is supported past the line, where the rail meets the pad.

## Files

| File | Role |
|---|---|
| `index.html`, `style.css` | preview page (responsive) and export mode (`?export=1`) |
| `src/main.js` | wiring, the `renderFrame(n)` / `render(t)` / `renderAudio()` API, preview controls |
| `src/physics.js` | course, seeded RNG, simulation, stats |
| `src/camera.js` | critically damped virtual camera, precomputed from the finished simulation |
| `src/renderer.js` | Canvas 2D layers: void dust, falling balls, bridge underglow/surface/edges, sweepers, wind, trails, halos, bodies, particles, UI |
| `src/audio.js` | prioritised cue list, procedural Web Audio synthesis, offline and live engines |
| `export.js` | offline frame-perfect export and verification |
| `tools/` | seed search and analysis scripts |
| `fonts/` | Inter (SIL Open Font License) |
