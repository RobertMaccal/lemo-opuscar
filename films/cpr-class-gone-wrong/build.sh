#!/bin/sh
# CPR CLASS GONE WRONG — one command rebuilds the film from the recorded voices:
#   sh films/cpr-class-gone-wrong/build.sh        (from the library root, or anywhere)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
OUT=${OUT:-$HERE/out}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT"; cd "$LIB"
PY="$LIB/.venv/bin/python"
"$PY" "$HERE/audio/prep_vo.py"                       # trim + level the dialogue, mouth envelopes → $OUT/vo.json
cmp -s "$OUT/vo.json" "$HERE/audio/vo.json" || cp "$OUT/vo.json" "$HERE/audio/vo.json"
"$PY" "$HERE/audio/chant.py"                         # the class's original a cappella chant → $OUT/chant/*.wav
cmp -s "$OUT/chant.json" "$HERE/audio/chant.json" || cp "$OUT/chant.json" "$HERE/audio/chant.json"
node "$HERE/tools/timeline.mjs"                      # timeline → $OUT/timeline.json
node "$HERE/tools/srt.mjs"                           # subtitles → cpr-class-gone-wrong.srt
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
"$PY" "$HERE/mix.py"                                 # dialogue, chant, foley, room (no music) → $OUT/mix.wav
rm -f "$HERE/cpr-class-gone-wrong.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$HERE/cpr-class-gone-wrong.mp4" 30 1
