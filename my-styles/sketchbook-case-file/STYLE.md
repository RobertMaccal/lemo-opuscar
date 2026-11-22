# Sketchbook Case File 速写案卷 — Style Prompt

Made from a blank page (the user's reference: a vertical true-case explainer in pencil-sketch style); techniques from the Lemo-Opuscar core tools (`core/`), no library style as base.
Default size: 1080×1920 (vertical, 30 fps).

> A narrated true-case explainer drawn like a clean pencil sketchbook: chibi characters with big round heads and dot eyes, thick wobbly ink outlines, grey diagonal hatching, one yellow accent, on cream dotted paper. A calm storyteller voice walks through the case beat by beat; every phrase lands on a taped caption card with the spoken word lit yellow. It opens on the verdict, rewinds to how it happened, and ends on one practical rule and a zoom-out to the whole "case file".
> Reference grammar (never copied, never named in a film): short-form medical/legal case explainers on social feeds — verdict-first cold open, "put yourself in his place" pause, checklist ending.

## 1. Essence, and what it is not

- **A case file in pencil.** Each film is one real (or realistic) case told as evidence: who, where, when, what went wrong, what the court or the outcome said, what the one lesson is.
- **Sketchbook, not cartoon.** Thick near-black ink lines with a slight hand wobble, grey hatching for every fill, white for skin, coats and paper props. Nothing is glossy, gradient-shaded or full-colour.
- **One accent.** Yellow (#F4C84A) marks what matters right now: the spoken word, the key label, the answer. Blue appears only for a body in danger (cyanosis); grey wash only for grief.
- **Narrated, captioned, one phrase at a time.** The voice drives the cut; captions are part of the picture.
- **Not**: a whiteboard hand-drawing reveal (no drawing hand), not flat vector infographics, not anime, not comic panels with gutters (except the final case-file grid), not a talking-head.

## 2. Materials & rendering

- Canvas 2D, everything drawn in code by `demo/page/draw.js`: points → `wobble()` (low-frequency noise along arc length, amplitude ≈1.3 px) → filled, hatched, outlined.
- **Ink**: #1B1B1D, 4.5–5.5 px at 1080 wide, round joins and caps. Thin secondary lines 3 px, grey #555–#777.
- **Hatching**: pre-rendered 45° line tiles used as fill patterns — `light` (props, grey tags), `mid` (clothes, furniture, silhouettes), `dark` (hair, judge's robe), `blue` (endangered baby), `yel` (yellow boxes, very faint).
- **Paper**: #F3F2EB with a 46 px grid of 2.6 px dots (#CFCDC3). Static — panels slide over it.
- **Shadows**: every card, tag, banner and big prop has a flat offset shadow (5–7 px, black at 12–16 %). No blur, no gradients except the danger vignette.
- **Characters** (chibi, ~4.5 heads tall, origin at the feet): big round white head with ears and blush hatch marks, dot eyes with a white glint, simple brows and mouths. Cast kit: student/doctor (white coat, lapel V, yellow name badge, stethoscope), nurse (bun, hatched scrubs), mother (fully grey-hatched faceless silhouette, long hair), father (grey silhouette), baby (swaddled bundle), judge (bald, round glasses, dark robe, white bands), senior doctor (white hair, glasses). Add new characters with the same head and limb construction.
- **Props**: dock/bench with hatched panels, jail bars, syringes (IV with needle, oral with amber tip, "?" label), IV pole + bag + tube + 3-way port, crib, monitor with live ECG, cabinet, clock, calendar, gavel, door, map outline with pin, stamp, checklist boxes, word boxes.

## 3. Colour logic

- Ground: cream paper. Figures: white + grey hatch + ink. Hair and robes: dark hatch.
- **Yellow** = attention: current caption word, key tag, banner text pill, the answer box, badges, alarm rays, data highlights. Never more than two yellow areas fighting at once.
- **Grey tags** = context or a wrong option ("No label", "A · Inject", "Criminal record"); **yellow tags** = the key fact or the right answer ("B · Ask", "oral ≠ IV").
- Blue only for physical danger; a soft grey radial vignette only for crisis; a 7 % grey wash only for death/grief. Then back to plain paper.

## 4. Type & subtitles

- **Kalam 700** (handwritten) for captions, labels, banners, speech, quotes. **Nunito 800–900** for small sub-lines (translations, explanations, dates).
- **Caption card**: centred at y≈1440 of 1920, white rounded rect, ink outline, offset shadow, a strip of grey tape on the top-left corner. 2–4 words per card (break on punctuation, after 4 words, >20 characters or a 0.45 s pause). Words already spoken are ink, the current word sits on a yellow rounded highlight that wipes in, upcoming words are light grey (#C6C5BF). The card pops in (0.9 → 1 with overshoot) on every new phrase.
- **Banner**: white card with grey hatched folded ribbon tails, yellow pill behind the title (y≈300–360). **Tag**: rounded pill, 30–54 px text, optional Nunito sub-line under it.
- Quotes and speech bubbles reveal word by word in sync with the voice; the key word gets the yellow highlight.
- Keep the bottom ~22 % of the frame free of anything but the caption (platform UI).

## 5. Motion quality

- 30 fps, smooth (no line boil). Eases: `eo`/`eio` for moves, `back()` overshoot for every pop-in (0.35–0.4 s).
- Things **pop** on the word that names them; strokes **draw on** (maps, crosses, outlines) over 0.3–0.8 s; stamps **slam** (scale 2.6 → 1 in 0.18 s with screen shake); bars drop; gavels swing.
- Characters: walk cycles with bob and leg swing, lean poses, talking mouths only while the line is spoken, shock eyes + yellow alarm rays.
- Every shot has a slow push-in (1 → 1.03–1.08). The hook shot starts zoomed 1.3× on the face and pulls back in 0.9 s.

## 6. Camera grammar

- Shot changes are **horizontal slides** (whip-pan feel, 0.45 s ease-in-out) on the sentence boundary; **cross-fade through paper** (0.5 s) only into and out of the death/grief beat.
- Inside a shot: lateral pans to move between two characters, map shrink-and-park to make room for the next layer, stacking tags on the word.
- Character scale: hero ≈ 1.05–1.3 (head at y≈700–900); group shots 0.95–1.0 on one floor line at y≈1352.
- **Ending**: the last scene shrinks into a card, then the camera zooms out to a grid of the film's key frames (4×3 cards, captions included) under a "CASE FILE NN" banner, then fades to black.

## 7. Sound palette

- **Voice**: one warm narrator (first film: ElevenLabs "Spuds Oxley", eleven_v4), at natural speed — **never time-stretched**; shorten only silent pauses (`demo/tools/trim_pauses.py`).
- **Score** (sampled, `core/audio/sampler.py`): felt piano + pizzicato bass bounce + harp arpeggios for the curious setup (minor key, ~92 bpm); a hard stop and tremolo strings for the "what would you do?" pause; timpani pulses and tremolo for the crisis; near-silence with single piano notes at the death; slow piano chords for court; a warm major-key lift (piano arpeggios, strings, glockenspiel) for the lesson; one big resolve chord on the grid zoom-out. Ducked ~6 dB under the voice.
- **Foley** (synthesised, `audio/sfx_track.py`): stamp slam, metal clank, whooshes on every slide, pops on tags, pencil scratches on draw-ons, monitor beeps → alarm → flatline, page turn, gavel, door, footsteps, card flips, ticks on checklist rows.
- Master −14 LUFS, true peak ≈ −1 dB.

## 8. Native moves

1. **Verdict cold open**: the person in the dock + GUILTY stamp slam in the first 2–3 s, then the penalty.
2. **"The reason?"** banner with floating question marks and the mystery object sliding in.
3. **Real-case tag + place/date banner** with a map pin.
4. **Karaoke caption card** on tape (always on).
5. **STOP / A or B**: freeze the story, ask the viewer what they'd do (grey wrong option, yellow right one).
6. **Clock-stamp crisis**: a yellow time badge ("08:46"), live monitor going irregular, a body turning blue, danger vignette.
7. **Court quote card** typed word by word with the key word lit yellow.
8. **"What's in it?" word boxes** flipping in, then a numbered **checklist** building row by row, then a ribbon ("Asking is allowed.").
9. **Case-file zoom-out grid** ending.

## 9. Pitfalls of the medium

- **Don't time-stretch the narration** (it sounds robotic). If the film is too long, tighten the script or ask for a faster delivery at generation time; trim only silences.
- **Who says what must match the facts.** Speech bubbles attach to the right speaker; check against the source (the first film had to move a line from the mother to the nurse).
- **Medical/technical actions must be drawn correctly**: e.g. an IV injection goes into the IV line's port, syringe level or tip-up, never a needle pointing at the floor. Draw the real mechanism (pole, bag, tube, port, flow).
- Faceless grey silhouettes can read as masks when hands sit at eye level — keep hands at the temples or below the face.
- Too many tags at once kills the sketchbook calm: max three labels on screen plus the banner.
- Text near the caption zone collides with the card: keep labels above y≈1300.
- A mirrored syringe mirrors its "?" label — counter-flip text (`flip` option handles it).
- Fonts are subset to Latin; another script needs its own font files.
- Sample libraries (salamander, vsco2ce, vcsl) must be fetched before the score renders.

## 10. Engine

- `demo/page/draw.js` — the drawing kit: wobble/hatch primitives, paper, tags, banners, cards, speech/thought bubbles, faces, the whole cast, all props, IV set. **Reuse it as is; add to it.**
- `demo/page/film.js` — the first film's timeline (story-specific). Its reusable parts: the shot system (`SHOTS` with `slide`/`fade`/`cut`, per-shot push-in), `drawScene` transitions, shake, the caption chunker + karaoke card (`buildChunks`, `drawCaption`), the end card shrink + case-file grid (`drawEnd`, thumbnails), the sound-cue export (`EV`). Shots are anchored to word times `w(i)` from `page/words.json`, so the picture follows the voice.
- `demo/tools/asr.py` (faster-whisper word timings) → `demo/tools/trim_pauses.py` (natural voice, shorter silences, caption words).
- `demo/audio/sfx_track.py`, `score.py`, `mix.py` — foley from cues, sampled score, ducked mix. `demo/build.sh` rebuilds the demo end to end.
- `demo/tools/modelsheet/` — renders the cast & kit sheet (`modelsheet.jpg`).
- `demo/tools/cover/` — the Instagram Reel cover (1080×1920, `cover.jpg`): big Kalam headline with one yellow block, hero character with the key prop, stamp, danger detail. **Keep everything essential inside the centre ≈800×1066** (x 140–940, y 427–1493): Instagram's profile grid crops that tightly.
- Library tools: `core/render/{still,video,events}.mjs`, `core/render/mux.sh`, `core/audio/{sampler,sfx}.py`.

## 11. Variation space

Free in every film: the case and its facts, setting, cast (built from the kit), number and order of beats, which native moves to use (the caption card and the verdict-style hook are the only must-haves), the lesson, narrator voice and language, music key and tempo, length (60–120 s typical). Keep fixed: the materials, palette logic, type, caption design, slide grammar and the case-file feel.
