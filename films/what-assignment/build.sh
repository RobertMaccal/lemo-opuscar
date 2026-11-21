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
# Lacrimosa: Bruno Walter, Vienna Philharmonic, 1956 Salzburg (public domain, archive.org) — fetched once
if [ ! -f "$HERE/audio/src/lacrimosa.wav" ]; then
  mkdir -p "$HERE/audio/src"
  curl -sSL -o "$HERE/audio/src/lacrimosa_walter.ogg" "https://archive.org/download/MozartRequiemBruno/W.%20A.%20Mozart%20-%20Requiem%2C%20K.%20626%20%28Bruno%20Walter%2C%20Wiener%20Philharmoniker%2C%20Wiener%20Staatsopernchor%2C%201956%29%20-%2008.%20Lacrimosa.ogg"
  ffmpeg -v error -y -i "$HERE/audio/src/lacrimosa_walter.ogg" -ar 48000 -ac 2 "$HERE/audio/src/lacrimosa.wav"
fi
# the pizzicato cue needs the VSCO 2 CE samples (CC0)
[ -d "$LIB/core/audio/instruments/vsco2ce" ] || sh tools/fetch.sh instruments vsco2ce
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
