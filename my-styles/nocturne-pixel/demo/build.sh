#!/bin/sh
# Nocturne Pixel — demo film "The Last Window". One command rebuilds it:
#   sh my-styles/nocturne-pixel/demo/build.sh
# Everything it writes goes to $OUT (default: my-styles/nocturne-pixel/out/), never into demo/.
# mux.sh needs ffmpeg 7+: set FFDIR to a folder holding a newer ffmpeg if the system one is older.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # the Lemo-Opuscar library (this repo)
OUT=${OUT:-$(cd "$HERE/.." && pwd)/out}
[ -n "$FFDIR" ] && PATH="$FFDIR:$PATH"
export LIB OUT PATH
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT"; cd "$LIB"
node core/render/events.mjs "$HERE" --out "$OUT/events.json"
EVENTS="$OUT/events.json" "$LIB/.venv/bin/python" "$HERE/audio/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
rm -f "$OUT/the_last_window_40s.mp4"
LEMO_COLOR=bt709 sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/the_last_window_40s.mp4" 30 0
ffmpeg -v error -y -ss 39.3 -i "$OUT/the_last_window_40s.mp4" -frames:v 1 -q:v 2 "$OUT/poster.jpg"
# Instagram cover + grid / feed crops (src/thumb.js)
node core/render/still.mjs "$HERE" 0 --q thumb=1 --size 1080x1920 --prefix thumb_ --out "$OUT"
ffmpeg -v error -y -i "$OUT/thumb_0.jpg" -vf crop=1080:1440:0:240 -q:v 1 "$OUT/thumb_grid_3x4.jpg"
ffmpeg -v error -y -i "$OUT/thumb_0.jpg" -vf crop=1080:1350:0:285 -q:v 1 "$OUT/thumb_feed_4x5.jpg"
