#!/bin/sh
# ONE MORE SCROLL — rebuild the whole film with one command:   sh films/one-more-scroll/build.sh
# Needs the aiTrends 2D Studio installed next to this folder (films/aitrends-2d-studio, from the aitrends-2d-studio
# plugin's kit/ + npm install), Node 18+, ffmpeg 7+, and the library's Python venv (numpy, scipy, soundfile).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
STUDIO=${STUDIO:-$(cd "$HERE/.." && pwd)/aitrends-2d-studio}
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
PY=${PY:-$LIB/.venv/bin/python}
export STUDIO
[ -f "$STUDIO/render.mjs" ] || { echo "install the aiTrends 2D Studio at $STUDIO first"; exit 1; }
# this film's rig extensions (white shirt + tie, droopy lids, eye bags, fatigue hair, boss hair, fixed brows)
cp "$HERE/engine-patches/rig2d.js" "$STUDIO/engine/rig2d.js"
# the ElevenLabs music cues are kept as MP3; decode them once
for f in "$HERE"/audio/music/*.mp3; do [ -f "${f%.mp3}.wav" ] || ffmpeg -nostdin -v error -y -i "$f" -ar 48000 -ac 2 "${f%.mp3}.wav"; done
# 1. timeline: shots, dialogue placement, lip-sync envelopes, subtitles
"$PY" "$HERE/plan.py"
# 2. picture: every frame drawn in headless Chromium
cd "$STUDIO" && node render.mjs --project "$HERE" --format jpeg --workers ${WORKERS:-4}
# 3. sound: dialogue, ElevenLabs score, foley, master to -14 LUFS, mux
"$PY" "$HERE/mix_film.py" --video "$HERE/build/video_silent.mp4" --out "$HERE/one-more-scroll.mp4"
