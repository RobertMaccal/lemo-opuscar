#!/bin/sh
# WHAT ASSIGNMENT? — 15 s, Golden Hour Stickman. One command rebuilds the film, the subtitles and the thumbnails:
#   sh films/what-assignment/build.sh            (from the library root, or from anywhere)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
OUT=${OUT:-$HERE/out}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT"; cd "$LIB"
PY="$LIB/.venv/bin/python"
# music: the Flower Duet recording the user supplied (not in git: put it at audio/src/flower_duet.mp3)
[ -f "$HERE/audio/src/flower_duet.mp3" ] || { echo "missing audio/src/flower_duet.mp3 (the user's Flower Duet recording)"; exit 1; }
[ -f "$HERE/audio/src/flower_duet.wav" ] || ffmpeg -v error -y -i "$HERE/audio/src/flower_duet.mp3" -ar 48000 -ac 2 "$HERE/audio/src/flower_duet.wav"
"$PY" "$HERE/audio/prep_vo.py"                       # trim + level the dialogue, mouth envelopes → $OUT/vo.json
cmp -s "$OUT/vo.json" "$HERE/audio/vo.json" || cp "$OUT/vo.json" "$HERE/audio/vo.json"
node "$HERE/tools/timeline.mjs"                       # timeline → $OUT/timeline.json
node "$HERE/tools/srt.mjs"                            # subtitles → $HERE/what-assignment.srt
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
node core/render/events.mjs "$HERE" --size 1080x1920   # bone landings etc. → $HERE/events.json
"$PY" "$HERE/mix.py"                                  # dialogue, music, foley → $OUT/mix.wav
rm -f "$HERE/what-assignment.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$HERE/what-assignment.mp4" 30 1
node "$HERE/tools/boards.mjs"                         # thumbnails + model sheet
cp "$OUT/thumbnail.png" "$HERE/thumbnail.png"; cp "$OUT/thumbnail-16x9.png" "$HERE/thumbnail-16x9.png"
ffmpeg -v error -y -i "$HERE/thumbnail.png" -q:v 2 "$HERE/poster.jpg"
