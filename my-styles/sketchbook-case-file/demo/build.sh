#!/bin/sh
# Sketchbook Case File — demo film "The Syringe" (English remake). One command rebuilds it:
#   sh my-styles/sketchbook-case-file/demo/build.sh
# Everything it writes goes to $OUT (default: my-styles/sketchbook-case-file/out/), never into demo/.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # the Lemo-Opuscar library (this repo)
OUT=${OUT:-$(cd "$HERE/.." && pwd)/out}
export HERE LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT"; cd "$LIB"
PY="$LIB/.venv/bin/python"
# needs: setup.sh deps (core) + sample libraries: sh tools/fetch.sh instruments salamander / vsco2ce / vcsl
ffmpeg -v error -y -i "$HERE/voice/vo.flac" -ar 48000 -ac 1 "$OUT/vo.wav"     # narration (natural speed, pauses trimmed)
node core/render/events.mjs "$HERE/page" --size 1080x1920 --out "$OUT/events.json"   # sound cues from the page
"$PY" "$HERE/audio/sfx_track.py"                     # foley → $OUT/sfx.wav
"$PY" "$HERE/audio/score.py"                         # sampled score → $OUT/music.wav
"$PY" "$HERE/audio/mix.py"                           # voice + ducked music + foley → $OUT/mix.wav
node core/render/video.mjs "$HERE/page" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
rm -f "$OUT/the-syringe.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/the-syringe.mp4" 30 1
