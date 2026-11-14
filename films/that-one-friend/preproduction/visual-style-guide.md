# Visual style guide — THAT ONE FRIEND AT SCHOOL

Everything in this folder was rendered by the film's own drawing code (`src/`), at the film's real size. Nothing is painted or AI-generated, so what you approve here is what the animation will look like.

## Essence

A childhood memory of school, told with stick people. The characters are as simple as a doodle in a margin; the world around them is warm, lit and lived-in. Comedy lives in the faces; nostalgia lives in the light.

Not: black sticks on white, 3D, realistic anatomy, meme-edit zooms, glossy vector corporate art.

## Palette

| Role | Colour | Hex |
|---|---|---|
| Warm sunlight | window patches, rim light, sun | `#FFCB7A` |
| Soft orange | accents, cap, bunting, sunset | `#F2A65A` |
| Vintage cream | walls, paper, heads, captions | `#F6EAD0` |
| Muted teal | lockers, dado, pool, tracksuit | `#5E9A97` |
| Dusty lavender | shadows, dusk, thought captions | `#A79BC4` |
| Deep indigo | all ink: limbs, outlines, hair, type | `#221E3A` |
| YOU | deep-blue hoodie | `#30508F` |
| JACK | muted green hoodie | `#6F9C6B` |

Rule: the two hoodies are the most saturated things in any frame. Supporting cast and sets stay a step quieter.

## Characters

- One rig for everyone: round head, short neck, bendable spine, two-bone arms and legs, hands, shoes. Deep-indigo ink limbs, cream head with an ink outline, ink hair silhouette.
- **YOU**: spiky messy hair with a cowlick, shoulders up, deep-blue hoodie, dark trousers, white sneakers. Huge eyes; brows do the acting.
- **JACK**: soft swept quiff, half-lidded eyes, tiny smile, muted green hoodie, relaxed trousers, soft sneakers, phone. A little taller, weight on one leg.
- Faces are built from blendable controls (eye open, upper and lower lid, lid angle, pupil size and gaze, brow height / angle / asymmetry, mouth width / open / smile / skew / wavy / teeth, plus sweat, blush, gloom, pallor), so any expression can move into any other.
- Supporting cast: PROFESSOR (lavender cardigan, glasses, grey side hair), TEACHER (terracotta blazer, bun), COACH (teal tracksuit, orange cap, whistle), STUDENT A (burgundy jacket, ponytail), STUDENT B (butter-yellow jumper, curls).

## Light

- Every scene has one named light direction. Characters get a thin warm rim on the light side, a cool shade on the far side and a cast shadow in the same direction.
- Window light is drawn as panes on walls and floors, with leaf dapple that sways; dust floats in the shafts.
- The day moves through the film: cream morning → backlit exam hall → drained lavender → amber afternoon → bright noon sport → gold-and-lavender sunset.
- Finish on every frame: soft bloom, vignette, paper texture. Film grain is added at the encode, lightly.

## Camera

- Wall-flat staging for dialogue; one-point perspective for corridors and distance.
- Depth of field is real compositing: layers are drawn separately and blurred, the subject stays sharp.
- Moves: slow push-in, tracking, rack focus, one dolly-zoom (the post-exam spiral), one crane up (the ending). Fast cuts only in the montage.

## Type

- Title and captions: **Lilita One**. Handwriting in the world: **Patrick Hand**, **Caveat**. Labels: **Fredoka**. All OFL.
- Caption = paper label with the speaker's colour tab; emphasis word in rust; YOUR thoughts on a dashed lavender label. Captions sit between y 1380 and 1620, clear of faces and of the app's bottom bar.

## Scene progression

1. `style-frame-school-hallway.png` — title, morning corridor.
2. `storyboard-01-before-exam.png` — "I'm actually cooked." / "Same here."
3. `style-frame-examination.png` — the silent hall.
4. `storyboard-02-extra-paper.png` — the hand, the full booklet.
5. `storyboard-02b-horror-reaction.png` — "Another... WHAT?"
6. `storyboard-03-post-exam.png` — "...I wrote a muscle." YOU shrink; the others blur.
7. `storyboard-04-classroom.png` — the phone, the teacher, the hyoid.
8. `storyboard-05-running.png`, `storyboard-06-swimming.png`, `storyboard-07-scoreboard.png` — second place, after Jack.
9. `storyboard-08-final-sunset.png` — "I'm just chill."

Sheets: `character-sheet.png`, `character-sheet-acting.png`, `character-sheet-supporting.png`, and all frames together in `storyboard-contact-sheet.png`.

## Design choices to confirm

- Heads are cream with ink outlines (limbs and hair are the dark ink). It gives the faces far more range than an all-dark head.
- TEACHER is drawn as a woman, STUDENT A as a girl, STUDENT B as a boy; voices would follow.
- In sport scenes YOU wear a race bib (7) or swim goggles in hoodie blue; Jack stays in his hoodie, bib number 1.
