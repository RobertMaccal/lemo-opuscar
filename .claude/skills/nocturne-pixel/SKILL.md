---
name: nocturne-pixel
description: Make an animated film in the user's own "Nocturne Pixel" (夜曲像素) style, the look of "The Last Window": rainy-night pixel cinema on a 360×640 grid scaled ×3, blue-black facades with small warm windows and little lives inside, wet street reflections, palette-stepped halos, a smooth cinematic camera (dolly-ins, pushes through glass), ambient detuned-piano score with rain and soft foley, no voice, vertical 1080×1920 at 30 fps. Use whenever the user names this style, says "nocturne pixel", "my pixel night style", "the Last Window style", or asks for another film like that one.
---

# Nocturne Pixel

The user's own saved style (Lemo-Opuscar "my style"). Everything about the look is in the style folder:

- `my-styles/nocturne-pixel/STYLE.md`: the style prompt. Treat it exactly like a library `styles/<slug>/STYLE.md`: its invariants are fixed.
- `my-styles/nocturne-pixel/DEMO.md` and `demo/`: how the first film was built, and the reusable engine (pixel buffer and palette stepping, city and street, building windows, detail layer and glass portal, room lighting, character rig, miniature, rain, font, camera, timeline, score and foley). Read them only **after** your treatment exists; never reuse the demo's story, shots or timings.
- `styleframe.jpg`, `test.mp4`: the approved look.

## How to make a film in this style

Follow the normal workflow in `AGENTS.md` (brief → treatment → look → optional storyboard → produce → self-check → deliver), with these specifics:

1. **Brief.** Ask once: topic facts, whether there's voice (the style defaults to none), music wishes, language for any title cards, length.
2. **Treatment.** `films/<name>/TREATMENT.md` with three candidate structures (DIRECTOR.md §4).
3. **Engine.** Copy `my-styles/nocturne-pixel/demo/` into `films/<name>/` and build on it; never edit `my-styles/` for a film. In the copy set `LIB` in `build.sh` to two levels up (`$HERE/../..`) and replace `src/timeline.js`, camera keys, window/room/character content and `audio/mix.py` cues with the new story's. Keep `px.js`, `rain.js`, `font.js`, the halo, reflection, detail-layer and portal techniques and the post stack.
4. **Look.** Render stills with `node core/render/still.mjs <film> <t…> --size 1080x1920` and check them against STYLE.md.
5. **Sound.** Synthesised in `audio/mix.py` from `window.EV` (events.json): score, rain beds, clicks. Check band balance and a near-silence before the peak.
6. **Mux** needs ffmpeg 7+. If the system has 6.x, install `imageio-ffmpeg` into a private venv in the scratchpad and pass `FFDIR=<folder with an ffmpeg symlink>`.
7. **Deliver** per DIRECTOR.md §11: mp4 (1080×1920, 30 fps, yuv420p, AAC 48 kHz, −14 LUFS), poster, `TREATMENT.md`, `CREDITS`, source with a one-command `build.sh`. Commit and push to the session branch.
