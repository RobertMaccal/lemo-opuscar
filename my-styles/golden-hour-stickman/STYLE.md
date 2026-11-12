# Golden Hour Stickman 暖光火柴人 — Style Prompt

Made from a blank page; techniques from the Lemo-Opuscar core tools (`core/`), no library style as base.
Default size: 1080×1920 (vertical, 30 fps).

> A cinematic 2D sitcom told with stick people: doodle-simple characters with huge acting faces, living in warm, lit, flat-shaded rooms that feel like a remembered school day. Comedy lives in the faces and the timing; nostalgia lives in the light.
> References (grammar only): mockumentary sitcoms for the held reaction shot; anime "magic hour" interiors for window light as a character; classic cartoon acting for anticipation and squash. Never copy their characters, layouts, typefaces or music, and never name them in the film.

## 1. Essence, and what it is not

- **Doodle bodies, rich world.** Ink-indigo limbs and hair, round cream heads with an ink outline, one bold garment colour per character. The rooms around them are flat-shaded, textured and lit.
- **Faces carry the film.** Big eyes, flexible brows, small mouths: every expression is a blend of the same controls, so feelings animate into each other.
- **Light tells the time and the mood.** Window panes of sunlight on walls and floors, dust in the shafts, a warm rim on every figure, cast shadows that agree with the light.
- **Sitcom staging.** Wall-flat two-shots for talk, one-point perspective for distance and dread, hard comic cuts to faces.
- **Real voices, selective captions.** Dialogue drives the timing; only the lines that carry a joke get a caption.

Not: black sticks on white (that's a whiteboard explainer), not 3D or realistic anatomy, not meme-edit zoom spam, not glossy corporate vector art, not a slideshow of stills.

## 2. Materials & rendering

- Canvas 2D, drawn every frame from a rig: round head, short neck, a bendable spine (quadratic), two-bone arms and legs solved with IK or FK, hands (fist, open, point, thumb), shoes. Garment silhouettes are built along the spine (hoodie, open jacket, sweater, tracksuit, bare stick for swimming).
- Each character is drawn in four groups (far limbs, body, head, near arms) into an offscreen layer; props and desks can be slotted between groups (`only: [...]`).
- **Rim light compositor:** per group, a light-side edge band (the silhouette minus itself shifted along the light) and a far-side shade band, then a skewed, blurred cast shadow. Every scene names one light direction and uses it for all figures.
- Sets: flat shapes with gradients; window light drawn as pane quads in screen or overlay blend with leaf dapple that sways; volumetric shafts are blurred quads; dust is seeded and drifts.
- Depth of field is real compositing: background and foreground drawn to separate layers and blurred, the subject stays sharp. Never a blur over the whole frame.
- Finish on every frame: soft bloom (quarter-size blurred copy, screen), vignette (multiply), paper grain (soft-light static tile). Film grain proper is added at the encode, lightly (mux grain 1).
- Deterministic: seeded randomness only, no state carried between frames.

## 3. Colour logic

- Deep indigo ink (`#221E3A`) for all linework, limbs, hair and type. Vintage cream for heads, walls and paper.
- The ground of every set is warm (cream, sand, wood, sunlight) with muted teal as its cool counterweight (lockers, dados, pools, trees). Dusty lavender is the shadow colour and the colour of bad feelings (gloom, dusk, thought captions).
- **The leads' garments are the most saturated things in any frame.** Supporting cast and sets stay a step quieter; background extras are tinted toward the haze.
- Mood shifts by grade, not by new hues: a lavender multiply wash for dread, a golden screen for joy, a violet-to-gold sky for endings.
- Example palette (the demo's): sunlight `#FFCB7A`, soft orange `#F2A65A`, cream `#F6EAD0`, teal `#5E9A97`, lavender `#A79BC4`, indigo `#221E3A`; YOU `#30508F`, JACK `#6F9C6B`.

## 4. Type & subtitles

- Titles and captions: **Lilita One**. In-world handwriting: **Patrick Hand**, **Caveat**. Labels and small print: **Fredoka**. All OFL, self-hosted in `demo/fonts/`.
- Caption = a paper label from the world's own stationery, tilted about 1°, with the speaker's colour tab; one emphasis word in rust. Inner thoughts: a dashed lavender label tagged "thinking".
- Captions pop in with the voice (scale 0.86 → 1, 0.16 s) and sit between y 1380 and 1700 at 1080×1920, clear of faces and of the app's bottom bar. Sizes 52–76 px.
- Selective: only lines that carry a joke or a key fact. Hold ≥ max(1.8 s, speech + 0.6 s); never across a sequence cut.
- Burn captions into the picture and export the full dialogue as `.srt`.

## 5. Motion quality

- 30 fps, on ones; camera and light always smooth.
- Every pose is a keyframe in a pose track, blended with easing (`io`, `o`, `back` for snaps, `i` for falls). Never switch poses inside an `if`.
- Idle life on every figure: breathing (shoulders and hips), a slow head sway, seeded blinks. Lip sync from each recorded line's loudness envelope; mouths stay closed when someone else talks.
- Anticipation and follow-through on meaningful moves (arm wind-up, head turn led by the eyes, settle bounces). Squash on shock, stretch arms for cartoon reach.
- Walks and runs come from cycle functions (stride, lift, arm swing); characters never slide or teleport. Heads that hit things bounce once.
- What never moves: the ink weight, the head size, the garment colours.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| locked wall-flat two-shot, tiny drift | normal life, sitcom rhythm | an argument; a confession; waiting |
| slow push-in on a face | a thought arriving | realisation; temptation; doubt |
| hard cut to a close-up | the punchline lands on a face | surprise; embarrassment; a lie found out |
| rack focus (layer blur swap) | attention moves | a reveal in the background; noticing someone |
| eyes-then-head turn in extreme close-up | slow-dawning horror | a sound behind you; a name read aloud; a bill |
| dolly-zoom in a one-point corridor | the world stretches away | shame; dread; being left behind |
| side tracking | effort, speed | a race; a chase; being late |
| crane up / pull back to a wide | the day ends, memory | a goodbye; a scale reveal; an ending of any kind |

At key moments the subject's head fills at least a fifth of the frame height; in close-ups the face is the frame. Transitions are cuts (comic) or light (a flash to white for memory, a fade to indigo for an ending); no dissolves between unrelated places.

## 7. Sound palette

- **Dialogue first.** Natural, performed voices (TTS with direction tags is fine), each line its own clip, compressed and placed in a room (short reverb that matches the set). Inner thoughts: same voice, closer, warmer, longer tail.
- **Music:** gentle solo piano carries nostalgia; it is cut, ducked, slowed or sped up for comedy rather than played at one level. Under speech it ducks about 6 dB.
- **Foley tied to every action:** clocks, pencils, paper, sneakers, doors, chairs, desks, phones; school ambience (chatter beds, birds, breeze). Procedural where possible.
- **Silence is a punchline.** At least two hard music cuts before reveals; the first sound after a silence is the most important one.
- Comic accents sparingly: one sting, one jingle, one crash per film section, never a meme soundboard.
- Master at −14 LUFS, true peak −1 dB.

## 8. Native moves

- **The background hand.** Something happens out of focus behind the lead; we see the clue before the face. *Fits content like:* a colleague finishing first; a sibling taking the last slice; a rival's notification.
- **Eyes, then head.** In extreme close-up the pupils slide first, the head follows half a second later, the face drains (pallor, gloom lines). *Fits content like:* hearing your name; seeing the price; realising the meeting is today.
- **The shrinking corridor.** Dolly-zoom in one-point perspective: the lead shrinks and stays sharp, the others loom close and blurred, voices sink under a low-pass, a heartbeat speeds up. *Fits content like:* a failed interview; a forgotten birthday; stage fright.
- **The result board.** Slotted cards flip in, repeated faster each time with the same outcome. *Fits content like:* a leaderboard; job rejections; weekly weigh-ins.
- **Magic-hour ending.** Backlit figures with thick gold rims, long shadows toward the camera, a crane up as the music finds its last bars. *Fits content like:* graduation; a last day at work; moving house.

## 9. Pitfalls of the medium

- Rim light on the wrong side or a shadow that disagrees with the window: set one light direction per scene and pass it to every figure.
- Faces too small to act: if the joke is in the face, cut closer; wide shots are for staging only.
- Expressions that don't read: brow direction decides worried vs angry; check every expression at final size.
- Head drawn over a desk it should be behind (or the reverse): draw desks between body groups with `only: [...]`.
- Seated legs too long: seated poses use `legS ≈ 0.5`; kneeling poses lower the ground line too.
- Blank faces after a pose override: spread the current expression (`e: { ...p.e, ... }`), never replace it wholesale.
- Captions crossing a cut or covering a face: end them at the next sequence mark; keep them in the lower band.
- TTS that blurs short words ("Second?"): check every line with speech-to-text, regenerate the ones that fail.
- Quiet classical recordings vanish on phones: ride the music level gently before mixing.

## 10. Engine

All in [`demo/src/`](demo/src/):

- `kit.js` — palette `P`, fonts `F`, shapes, gradients, pooled offscreen canvases (`tmp`), text, light helpers (`lightPatch`, `shaft`, `dust`), nature (`cloud`, `foliage`, `tree`), post (`bloom`, `vignette`, `wash`, `paperGrain`).
- `rig.js` — the character rig: `pose(ch, ...overrides)`, `mixPose(ch, a, b, t)`, `drawChar(ctx, ch, pose, light, { only, tint, blur, alpha, noShadow })`, `PROPS` (phone, pencil, paper, stopwatch, bottle, pointer, clipboard, chess piece), garment kinds, hair styles, the rim-light compositor.
- `cast.js` — character definitions (dimensions, outfit, hair, resting posture) and the expression library `X` (anxious, horror, hollow, smug, how, chill, deadpan…). New characters are new entries here.
- `sets.js` — reusable sets and props: hallway (flat + one-point `corridor` with a dolly-zoom-ready projection), classroom (`room`), chalkboard, athletics track, pool, club room, `resultBoard`, sunset `courtyard`, desks, windows, clocks, lamps, `sunQuad` window light.
- `shots.js` — camera (`cam`), layered depth of field (`layer`, `layerSoft`), lights (`mkL`), `finish` (post stack), `caption` (paper-label captions).
- `anim.js` — keyframes (`kf`, `pk`), `idle`, lip sync (`talk` from voice envelopes), `walk`, `run`, `captions`, `drawP`, `zoomAt`.
- `timeline.js` — the single timeline: `say(id, who)`, `wait`, `mark`, `ev` build the cut points, lines and sound events from measured voice durations.
- `../mix.py` — dialogue rooms, music cutting and stretching, ducking, procedural foley, master.

Minimal example (a figure waving under a window patch, not in the demo):

```js
import { P } from './kit.js'; import * as S from './sets.js'; import { drawChar, pose } from './rig.js';
import { YOU, X } from './cast.js'; import { mkL, finish } from './shots.js';
S.room(ctx, t, { mode: 'class' });
S.sunQuad(ctx, t, [[700, 960], [1040, 960], [820, 1960], [200, 1960]], { cols: 2, rows: 3, a: .4 });
const wave = Math.sin(t * 8) * .3;
drawChar(ctx, YOU, { ...pose(YOU, { e: X.happy, aR: { a: 2.6 + wave, b: .4, hand: 'open' } }), x: 540, y: 1500, s: 1.2 }, mkL(-.76, .6, { shadow: { kx: -.6, ky: .15, a: .3 } }));
finish(ctx);
```

## 11. Variation space

Decided for each film: the story and its structure, the cast and their outfits (keep one bold colour per lead), the sets, the light direction and time of day per scene, the camera path, the pacing, which native moves to spend, the music piece (any public-domain or licensed piano work), voices.

- **Three structures:** a single day that gets worse; a list of rules broken one by one; two timelines side by side (expectation / reality).
- **Three openings:** a cold-open close-up of a panicking face; a title over a quiet empty room before anyone enters; a phone screen notification that starts the trouble.
- **Three endings:** a crane up over the place at dusk; a freeze on the lead's resigned face; a callback where the roles finally swap for one beat.

---

How the demo was made (story, shots, score, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
