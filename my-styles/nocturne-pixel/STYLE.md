# Nocturne Pixel · 夜曲像素 — Style Prompt

Made from a blank page; techniques from 16-bit Pixel RPG (pixel-rpg) in Lemo-Opuscar.
Default size: 1080×1920, 30 fps.

> Rainy-night pixel cinema: a forgotten cut-scene from a 1990s adventure game. Blue-black facades, small warm windows with little lives inside, wet streets, rain, and a camera that moves like a film's.
> References (grammar only): cut-away night buildings in modern pixel illustration; mid-90s adventure-game cut-scenes; painted wooden-block toy towns. Never copy a building, room, character, font or melody.

## 1. Essence, and what it is not

- **A native grid of 360×640**, scaled ×3 nearest-neighbour; every element lives on its layer's pixel grid.
- **Cold outside, warm inside.** The whole frame is navy and blue-grey; amber light only comes from windows, lamps and screens. The eye goes to the warm pixels.
- **Little lives in windows.** People are small silhouettes in lit rooms; one character, when the film goes inside, is a shaded sprite rig with readable acting.
- **A cinematic camera over pixel art.** Slow dolly-ins, pans, pull-backs and pushes through glass, placed sub-pixel and smooth, while the pixels stay square and chunky.
- **Mood over plot.** No dialogue, no voice: music, rain and small sounds carry it.

Not a game UI (no dialog boxes, menus, HUD); not neon cyberpunk; not HD-2D (no bloom, no depth of field, no real-time light); not photoreal; not flat vector.

## 2. Materials & rendering

- **Pixel buffers** (`Uint32Array`) on a fixed palette of ~70 colours; every colour comes from the palette (`near()` quantises any blend).
- **Light is palette stepping**: halos round lit windows and lamps are Bayer-dithered rings that step facade pixels toward amber (`warm(c, n)`), never a blur or alpha glow. Halo radius ≈ half a window.
- **Layers with parallax**: sky (depth .15), far skyline (.55), the main plane (1), rain in screen space (never zooms). Each layer is drawn at native resolution, then placed with the camera transform.
- **Detail layers for close-ups**: when the camera pushes far in, a 4×-detail layer of the target (bricks, frame, rain beads) dissolves in by ordered dither on the coarse grid, so the image never turns into a few giant blocks.
- **Portal through glass**: the room behind a window is rendered as its own scene and shown inside the glass; at the moment the glass fills the frame the room takes over with no cut.
- **Facades**: brick texture by sparse dithered mortar, stone lintels and sills one step lighter, a darker side face for depth, one decorative arched floor, roof clutter (antenna with a blinking light, chimneys, a stair hut).
- **Wet street**: road pixels take a dimmed, rippled copy of every bright pixel above (lit windows, lamps, headlights), long warm streaks under lamps, 1-px splashes. Reflections change when lights change.
- **Characters**: window figures are 3–16 px silhouettes in `b0/b1`; the lead is a rig (hunched torso polygon, rotatable pixel head with features, 2-bone IK arm with shaded thick segments), knitted texture by rib dither, 1-px ink outline. Faces are readable at mobile size: glasses glint, eyebrow, mustache.
- **Miniatures** (when a model appears): painted wooden blocks in muted toy colours (`k0`–`k6`), triangle roofs, 2–4 px windows that light exactly like the real ones.
- **Post**: a 7.5 % scanline on one output row in three (one per native pixel) and a soft vignette. No grain (mux grain 0).

## 3. Colour logic

- **Night ramp** `#080D19 → #10192E → #182945 → #40546B → #667F99`: sky, facades, rain, shadows. **Warm ramp** `#C77D43 → #F6B85C → #FFD68A → #FFE7BB`: only from light sources.
- **The last light is the brightest warm** (`w8`/`w10` core, widest halo); everything else steps down as it switches off: one frame-pair afterglow at half level, then dark glass with a diagonal reflection.
- **TV light is the only cold light inside** (`t1–t3`), and it flickers.
- **Rooms are lit by palette steps from the lamp**; when a lamp dies, the room maps to a rain-light palette (`night()`), and light can return as a **dither flood** that spreads from its source.
- Purples (`p0–p4`) bridge cold and warm: clouds' undersides, flanking buildings, city glow on the horizon.

## 4. Type & subtitles

- Titles only, no subtitles: an **original 5×7 pixel capital font**, cream `#FFE7BB` with a 1-px navy shadow, 2-px tracking, at native scale (×2 for one key card), placed in the sky in the top fifth.
- Cards in and out by **ordered Bayer dissolve**; held for reading time (letters ÷ 15 + 1.5 s, `readcheck`). Four cards at most per 40 s.

## 5. Motion quality

- 30 fps output. Camera on ones, sub-pixel smooth; window life, the cat's tail, TV flicker and curtain sway step on their own small cycles.
- **Lights never switch together**: each window has its own time, at least 0.17 s apart; key ones land on the music's beat.
- **Character motion** through keyframe tracks (monotone splines): lean, head pitch, fingertip target; breathing 1 px at 3.6 s; blinks; a startle pull-back; looking up to a window is a head rotation the viewer can read.
- Push and pull in **log-zoom** space with monotone splines: no overshoot; holds stay still.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Slow dolly-in on a whole building | a world at rest, the hook | an opening, a city at night |
| S-pan up a facade at window scale | many small lives, one after another | neighbours, a community, a night shift |
| Pull back to the whole facade | the result of many small changes | a blackout, a building emptying |
| Push through a window (portal) | going inside someone's life | a reveal, entering a memory |
| Macro over a table-top | intimacy, craft, a secret | a model, a letter, a recipe |
| Two worlds in one frame (inside + view outside) | cause and effect at a distance | a link, a mirror, an echo |
| Reverse push back out to the wide | an ending that rhymes with the opening | a loop, a bookend |

Framing: the warm subject sits in the middle third; the top fifth stays sky for titles.

## 7. Sound palette

- **Score**: soft detuned piano (two strings a few cents apart, slow tape wow), warm analog pads (detuned saws, low-passed), a low drone with 2nd/3rd harmonics, FM bells, music-box notes, reversed piano swells into transitions, tape hiss. Not horror, not action, not generic relaxing.
- **Techniques**: a descending note for each light that goes out; a borrowed minor iv or flat sixth for unease; a true near-silence (music out, rain and a clock only) before the emotional peak; one bell on the peak; a final chord left to decay into the loop seam.
- **Ambience**: rain in two perspectives (street: wide and bright; behind glass: muffled, with bead ticks), far city hum, room tone. J-cut the inside before the portal, L-cut a sound (a clock) out of it.
- **Foley**: soft electrical switch clicks panned to their window, TV-off sweep, car hiss on a wet road, distant thunder, clock ticks, wooden block "tok", card rustle, tiny clicks for miniatures with a far echo click from the city, lamp-flicker buzz.
- **Mix**: rain ~9 dB under the music; no jump scares, no loud impacts; −14 LUFS; low band 20–120 Hz kept well under the rest.

## 8. Native moves

- **The building falls asleep.** Windows go dark one by one, each with its own tiny story. *Fits:* a city at night, a closing time, the end of a season.
- **Through the glass.** The camera pushes into one window until the room inside takes over. *Fits:* a portrait, a reveal, a memory.
- **Two worlds, one light table.** A model, map or screen whose lights are the real world's lights, drawn from one shared state. *Fits:* a remote control, a caretaker, a model railway, a smart home.
- **Lamp dies, light floods back.** Rain-light palette, silence, then warm light spreading from its source by dither. *Fits:* hope, choice, a recovery.
- **Last window wide.** The opening framing returns with one light left. *Fits:* a loop, an ending that asks to be watched again.

## 9. Pitfalls of the medium

- Halos as alpha blurs read as modern glow → palette-stepped Bayer rings only.
- Zooming 20–90× on a coarse grid gives a few giant blocks → dissolve in a 4×-detail layer, then hand off to a portal.
- A portal image narrower than the glass shows a seam → fill the glass first, size the portal to the glass width.
- All windows switching together looks like a power cut, not sleep → stagger, min 0.17 s apart.
- A character's reach longer than the arm makes the hand stop short of its target → move the shoulder (lean) before lengthening the arm; check every touch at 0.2 s.
- Macro framing can push the face out of frame on a look beat → widen for every look.
- Rain drawn in world space zooms with the camera → keep it on the screen grid (inside a room, rain only exists inside the window).
- Text dissolves read as glitches if too fast → 0.45 s in, 0.5 s out.
- Mux needs ffmpeg 7+ (6.x misreads the audio length).

## 10. Engine

In `demo/`: `src/px.js` (buffers, palette, `warm`/`night` stepping, Bayer, halos), `src/city.js` (sky, clouds, skyline, flanks, street, cars, reflections), `src/building.js` (facade cache, window interiors, halos, cat), `src/lod.js` (4× detail layer of one window), `src/apartment.js` (room, lamp light, dark/flood), `src/oldman.js` (character rig), `src/miniature.js` (model city), `src/rain.js`, `src/font.js`, `src/camera.js` (log-zoom keyframes, parallax), `src/timeline.js` (times and the shared light table), `src/events.js` (sound events), `src/main.js` (layers, portal, titles, post), `audio/mix.py` (score and foley). Technique base: `$LIB/styles/pixel-rpg/`.

## 11. Variation space

Free in every film: the building or street, the characters, what the windows hold, the weather (rain, snow, fog), the time (3 AM, dusk, a power cut), the opening, the turn and the ending. Far from the demo:

- Structures: **one window, many nights** (the same room across a year); **a street of shops closing** (side-scroll at window scale); **a night shift** (lights coming *on* one by one toward dawn).
- Openings: a single lit window in a black frame; rain on glass, focus pulled to the street; a train passing with lit carriages.
- Endings: dawn replaces the warm palette; the camera rises above the roofs to a skyline of one colour; a curtain closes and the frame goes to the night ramp.
