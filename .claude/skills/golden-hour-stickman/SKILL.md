---
name: golden-hour-stickman
description: Make an animated film in the user's own "Golden Hour Stickman" (暖光火柴人) style — the look of "That One Friend at School": nostalgic stick-figure sitcom, doodle characters with huge acting faces, warm window-lit flat-shaded sets, rim light, real voices, piano score, vertical 1080×1920. Use whenever the user names this style, says "golden hour stickman", "my stickman style", "the That One Friend style", "same style as the school film", or asks for another film like that one.
---

# Golden Hour Stickman

The user's own saved style (Lemo-Opuscar "my style"). Everything about the look is in the style folder:

- `my-styles/golden-hour-stickman/STYLE.md` — the style prompt. Treat it exactly like a library `styles/<slug>/STYLE.md`: its invariants are fixed.
- `my-styles/golden-hour-stickman/DEMO.md` and `demo/` — how the first film was built, and the reusable engine (rig, cast, sets, camera, captions, timeline, mix). Read them only **after** your treatment exists; never reuse the demo's story, shots or timings.
- `styleframe.jpg`, `modelsheet*.jpg`, `storyboard.jpg`, `test.mp4` — the approved look.

## How to make a film in this style

Follow the normal workflow in `AGENTS.md` (brief → treatment → look → optional storyboard → produce → self-check → deliver), with these specifics:

1. **Brief.** Ask once, in one message: topic facts, cast (names, outfits: one bold colour per lead), voices, music, language, length, and **whether they want a visual preproduction package to approve first** (they asked for one on the first film: character sheet, environments, storyboard frames, then stop and wait).
2. **Treatment.** `films/<name>/TREATMENT.md` with three candidate structures (DIRECTOR.md §4).
3. **Engine.** Copy `my-styles/golden-hour-stickman/demo/` into `films/<name>/` and build on it; never edit `my-styles/` for a film. In the copy: set `LIB` in `build.sh` to two levels up (`$HERE/../..`), give `OUT` a folder inside the project, replace `src/timeline.js`, `src/film*.js`, `src/cast.js` entries and `src/sets.js` scenes with the new story's. Keep `kit.js`, `rig.js`, `anim.js`, `shots.js` helpers, the caption design and the post stack.
4. **Look.** Render model sheets and style frames with the real code (`tools/boards.mjs`) and check them against STYLE.md.
5. **Voices.** ElevenLabs connector: one flow per film, `creative_list_voices` → `creative_generate_speech` (model `eleven_v4`, direction tags) per line → poll → download each `content_url` → convert to 48 kHz mono WAV in `audio/vo/` → `audio/prep_vo.py` → check every line with faster-whisper (`small.en`) and regenerate any that mishear. Record voice IDs in `CREDITS`. Don't spend credits before the user approves the visuals when they asked for an approval stage.
6. **Music.** Public-domain composition **and** a CC0/public-domain or licensed recording (check the file's own licence; Musopen CC0 on archive.org worked). Cut, duck and stretch it for comedy (`mix.py`).
7. **Deliver** per DIRECTOR.md §11: `<name>.mp4` (1080×1920, 30 fps, −14 LUFS), `.srt`, poster/thumbnail, `TREATMENT.md`, `CREDITS`, source with one-command `build.sh`. Commit and push to the session branch.
