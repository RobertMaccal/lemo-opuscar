# Sketchbook Case File — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

**Film**: *The Syringe* — English remake of the user's Darija/German reference about the 2011 Bielefeld case (a final-year medical student injects an oral antibiotic syrup into a baby's IV line; the baby dies; conviction for negligent homicide; the lesson "What's in it? Ask before you inject"). 1080×1920, 30 fps, 1:51. `test.mp4`.

## Story & structure

Verdict cold open → prison → "The reason?" (white unlabeled syringe, real case, "one sentence") → Bielefeld map → baby with leukemia → the student arrives → the misunderstanding (blood draw vs. "Blood + Refobacin") → the nurse sets the syringe down and says "here's the oral antibiotic" → "that's the Refobacin" → STOP: A inject / B ask → injection into the IV line, "oral ≠ IV" → 08:46 baby turns blue, doctors rush → ICU clock, 3.5 h resuscitation → 12:28 death → next day: oral syringes → 2012 court, judge's quote → parents walk out, licence kept, record stays → "What's in it?" boxes → 4-step checklist → "Asking is allowed." → comment prompt → case-file grid → black.

## Shots

18 shots in `page/film.js` (`buildShots`), each anchored to narration word indices `w(i)`. Slides between sentences, fades around the death. The hook shot zooms 1.32 → 1 in 0.9 s; the GUILTY stamp lands on the word "guilty" (~2 s).

## Palette & cast

Paper #F3F2EB, ink #1B1B1D, yellow #F4C84A, danger blue #9DB4E0. Cast: student (PJ badge), nurse, mother + baby, father, senior doctor, judge. See `modelsheet.jpg`.

## Score structure

D-minor felt-piano/pizzicato bed (92 bpm) with harp from the map scene, clarinet line for the syringe scene; hard stop + tremolo at STOP; dark pizzicato ostinato for the injection; timpani pulses + tremolo for the crisis; single piano notes at 12:28; slow piano chords for court; F-major arpeggio lift for the rule; resolve chord + harp on the grid. The score was composed on an earlier (sped-up) timeline and is mapped onto the final voice by `voice/warp.json` — for a new film, write the score directly against `page/words.json` times and drop the warp.

## Voice

ElevenLabs, voice "Spuds Oxley" (`NOpBlnGInO9m6vDvFkFC`), model eleven_v4, whole script in one generation (consistent prosody), one line re-generated and spliced. Natural speed; 22 silent pauses shortened by `tools/trim_pauses.py`. Script: `voice/script.txt`.

## Build

`sh my-styles/sketchbook-case-file/demo/build.sh` (needs `setup.sh deps` and `sh tools/fetch.sh instruments salamander`, `vsco2ce`, `vcsl`). Writes to `my-styles/sketchbook-case-file/out/` (or `$OUT`): events → foley → score → mix → frames → mux.

| File | Draws / does |
|---|---|
| `page/draw.js` | the whole kit (primitives, UI, cast, props, IV set) |
| `page/film.js` | shots, transitions, captions, end grid, sound cues |
| `page/words.json` | narration word timings (caption text + shot anchors) |
| `audio/*.py` | foley, score, mix |
| `tools/asr.py`, `tools/trim_pauses.py` | word timings; pause trimming |
| `tools/modelsheet/` | cast & kit sheet |

## Demo pitfalls

- The first pass time-stretched the voice 1.13× (rubberband): the user heard it as robotic. Fixed by using the natural take.
- The nurse, not the mother, delivers the "oral antibiotic" line — bubble and narration both had to change.
- The injection first showed the syringe pointing at the floor; redrawn as a level push into the IV line's port with the syrup visibly flowing to the baby.
