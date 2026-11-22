---
name: sketchbook-case-file
description: Make an animated film in the user's own "Sketchbook Case File" (速写案卷) style — the look of "The Syringe": a narrated true-case explainer drawn like a pencil sketchbook (chibi characters with big round heads and dot eyes, thick wobbly ink lines, grey diagonal hatching, one yellow accent, cream dotted paper), taped caption cards with the spoken word lit yellow, verdict-first cold open, horizontal slide transitions, checklist ending and a case-file zoom-out grid; vertical 1080×1920. Use whenever the user names this style, says "sketchbook case file", "my pencil sketch style", "the syringe style", "same style as the syringe / Bielefeld video", "the case explainer style", or asks to animate something "in this style" meaning that film.
---

# Sketchbook Case File

The user's own saved style (Lemo-Opuscar "my style"). Everything about the look is in the style folder:

- `my-styles/sketchbook-case-file/STYLE.md` — the style prompt. Treat it exactly like a library `styles/<slug>/STYLE.md`: its invariants are fixed.
- `my-styles/sketchbook-case-file/DEMO.md` and `demo/` — how the first film was built, and the reusable engine (`page/draw.js` kit: primitives, cast, props; `page/film.js` shot system, captions, end grid; audio scripts; tools). Read them only **after** your treatment exists; never reuse the demo's story, shots or timings.
- `styleframe.jpg`, `modelsheet.jpg` (cast & kit), `test.mp4` — the approved look.

## How to make a film in this style

Follow the normal workflow in `AGENTS.md` (brief → treatment → look → optional storyboard → produce → self-check → deliver), with these specifics:

1. **Brief.** Ask once, in one message: the case/topic and its facts (who says what — attribute every line to the right person), names or labels that must appear, narrator voice (default: ElevenLabs "Spuds Oxley", `NOpBlnGInO9m6vDvFkFC`, model `eleven_v4`) and language, music wishes, length, and whether they want a storyboard first. If they send a reference video, analyse it frame by frame (ffmpeg contact sheets + caption strips) before writing.
2. **Treatment.** `films/<name>/TREATMENT.md` with three candidate structures (DIRECTOR.md §4). Strong hook in the first 2–3 s (verdict / shocking fact + slam).
3. **Voice first.** Generate the whole script in one ElevenLabs call (consistent prosody) → download → 48 kHz WAV → `demo/tools/asr.py` (faster-whisper word timings) → `demo/tools/trim_pauses.py` (shortens only silent pauses, writes `page/words.json`). **Never time-stretch the voice** — the user hears it as robotic. If it runs long, tighten the script. To fix one line, regenerate just that sentence and splice it in a silent gap, loudness-matched.
4. **Engine.** Copy `my-styles/sketchbook-case-file/demo/` into `films/<name>/` and build on it; never edit `my-styles/` for a film. Keep `page/draw.js` (add new characters/props there in the same construction), the caption system, transitions, end grid and audio scripts. Replace `buildShots()` in `page/film.js` with the new story, anchoring every beat to word times `w(i)`; set the end-grid `THUMB_T` to the new key frames; replace the sound cues. Write the score in `audio/score.py` directly against the new word times (drop the demo's `warp.json` mapping).
5. **Look.** Render stills (`node core/render/still.mjs <page> t… --size 1080x1920`) and contact sheets; check against STYLE.md §9 pitfalls — especially correct medical/technical actions and the right speaker for each speech bubble.
6. **Sound.** Needs sample libraries: `sh tools/fetch.sh instruments salamander`, `vsco2ce`, `vcsl`. Foley from page cues (`events.mjs` → `audio/sfx_track.py`), score, ducked mix (`audio/mix.py`), `core/render/mux.sh` at 30 fps → −14 LUFS.
7. **Deliver** per DIRECTOR.md §11: `<name>.mp4` (1080×1920, 30 fps), source with one-command `build.sh`, `CREDITS` (voice ID, sample libraries, fonts). No LemoLab credit or watermark; don't copy a reference creator's handle.
