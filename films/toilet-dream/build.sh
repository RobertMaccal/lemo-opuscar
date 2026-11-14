#!/bin/sh
# THE TOILET DREAM — THE ULTIMATE BETRAYAL. One command rebuilds the film from source:
#   sh films/toilet-dream/build.sh          (from anywhere; output: films/toilet-dream/the-toilet-dream.mp4)
# Needs the Lemo-Opuscar core tier (sh plugin/skills/lemo-opuscar/scripts/setup.sh deps) and the Salamander piano
# samples (sh tools/fetch.sh instruments salamander).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
[ -d core/audio/instruments/salamander ] || sh tools/fetch.sh instruments salamander
mkdir -p "$HERE/out"
node core/render/events.mjs "$HERE" --size 1080x1920                                  # timeline → events.json
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"                                                # score + foley → out/mix.wav
rm -f "$HERE/the-toilet-dream.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/the-toilet-dream.mp4" 30 1
ffmpeg -v error -y -ss 40.35 -i "$HERE/the-toilet-dream.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
# the cover / thumbnail (no spoiler), drawn with the same engine
node core/render/still.mjs "$HERE" 0 --size 1080x1920 --q board=thumb --prefix thumb_ --out "$HERE/out/thumb" && cp "$HERE/out/thumb/thumb_0.jpg" "$HERE/thumbnail.jpg"
