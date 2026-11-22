# Nocturne Pixel — the demo film

One example among many. Don't reuse its story, arc, shots, props or timings.

*The Last Window* (40.0 s, 1080×1920, 30 fps) · `test.mp4` · source in [`demo/`](demo/)

## Story
At 3 AM the windows of an apartment building go dark one by one (a reader, a couple, a TV, a cat, a kitchen, a laptop). One arched window stays lit. The camera pushes through its glass: an old man builds a miniature of the city from painted wooden blocks. When he presses a tiny switch, a real window in the skyline goes dark at the same instant. Twice. The only lit window left in his model is his own; it flickers and dies, and so does his lamp. Silence. He looks out at the black city, then switches the tiny light back on; warm light floods his room. The camera pulls back out through the same glass to the opening framing: one window lit. "SOME LIGHTS ARE WORTH KEEPING ON."

## Shots
1 wide dolly-in (0–5 s) · 2 facade S-pan at window scale (5–12.6) · 3 pull back to the dark facade (12.6–14.6) · 4 log-zoom push through the arched glass with a 4× detail layer and a portal (14.6–18.8) · 5 room, slow push (18.8–25) · 6 macro, miniature + real skyline in one frame (25–31) · 7 medium hold through the blackout and relight (31–34.4) · 8 pull back to the room (34.4–35.8) · 9 reverse push out through the glass to the wide (35.8–39.2), hold.

## Palette, light
Night ramp for everything outside, warm ramp only from light sources; halos by palette stepping; dark room = `night()` map; relight = dither flood from the tiny window.

## Score
75 bpm. I pad + drone + three detuned piano notes · II motif per bar, a descending note on each of the six vignette lights · III thin sus pad, a high bell, reversed swell into the glass · IV warm felt piano, clock · V music-box 8ths, one note drops per click, a flat sixth creeps in, drone slides down · VI music out (rain + clock) · VII bell on the switch, shimmer, Gmaj9♯11 → Dmaj9 add ♯11, decay to the loop seam.

## Build notes
`sh my-styles/nocturne-pixel/demo/build.sh` (needs Node 20+, the library's `.venv`, ffmpeg 7+ for the mux; `FFDIR=<folder with ffmpeg 7+>` if the system one is older). Files: see STYLE.md §10. `index.html?preview=1` opens a browser preview with play / pause / restart / mute / scale controls.
