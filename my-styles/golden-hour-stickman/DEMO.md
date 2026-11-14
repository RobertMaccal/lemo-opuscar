# Golden Hour Stickman — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *That One Friend at School* (2:37.7) · [`test.mp4`](test.mp4) · source in [`demo/`](demo/)

## Story & structure

An ordinary student spends one school day discovering that his relaxed best friend, who "didn't study either", is better than him at everything and has no idea. Five sequences and a coda: before the exam → the extra answer booklet → the post-exam "I wrote a muscle" spiral → the hyoid question in class → the "second place, after Jack" montage → the sunset walk ("I'm just chill"). The light tells the time: cream morning, backlit exam hall, drained lavender, amber afternoon, bright noon sport, gold-and-lavender sunset.

Native moves spent: the background hand (the booklet request), eyes-then-head, the shrinking corridor, the result board (eight times, faster each time), the magic-hour ending.

## Shots

About 45 shots; the full list with reasons is in the film project (`films/that-one-friend/preproduction/shot-list.md`). Signature shots: the eyes-then-head extreme close-up (0:37), the dolly-zoom corridor (1:05), the full-screen JACK (2:11), the crane up at sunset (2:32).

## Palette & cast

YOU: deep-blue hoodie, messy hair with a cowlick, white sneakers. JACK: muted green hoodie, swept quiff, half-lidded eyes, phone. Professor (lavender cardigan, glasses), Teacher (terracotta blazer, bun), Coach (teal tracksuit, orange cap), Student A (burgundy jacket), Student B (butter-yellow jumper).

## Score structure

Chopin, Nocturne in E-flat major Op. 9 No. 2, Musopen recording (CC0): bars 1–4 under the title and corridor; ducked to almost nothing in the exam hall; cut dead on "please?"; a low piano cluster as the sting; slowed and low-passed with a heartbeat for the spiral; the second statement for the classroom, stopped on "The hyoid bone"; time-stretched 1.55× → 2.5× with clack-and-kick percussion for the montage; the closing bars for the sunset.

## Voices

ElevenLabs Eleven v4 on the owner's account, one clip per line, direction tags (`[casual]`, `[whispers]`, `[breathless]`…). Voice IDs are in `demo/CREDITS`; the takes used are in `demo/audio/vo/`. Two lines were regenerated after a speech-to-text check.

## Build

```sh
sh my-styles/golden-hour-stickman/demo/build.sh      # from the repo root; output in my-styles/golden-hour-stickman/out/
```

Steps: fetch the Chopin FLAC (archive.org) → `audio/prep_vo.py` (trim, level, mouth envelopes) → `tools/timeline.mjs` → `tools/srt.mjs` → `core/render/video.mjs` (4 workers, about 10 minutes on 4 CPUs) → `mix.py` → `core/render/mux.sh` (−14 LUFS, grain 1).

Which file draws what: `src/film.js` title and sequence 1; `film2.js` the exam; `film3.js` post-exam and classroom; `film4.js` montage and sunset. `src/boards.js` + `src/sheets.js` + `tools/boards.mjs` render the model sheets and storyboard stills (`node my-styles/golden-hour-stickman/demo/tools/boards.mjs` → `out/preproduction/`).

## Demo pitfalls

- The corridor door had to sit between the two leads so the professor could open it between them.
- The exam hall's centre aisle (row 3) is left empty for the professor's walk.
- The montage voices ("Jack." ×6) are pitch-raised copies of existing takes, not new recordings.
