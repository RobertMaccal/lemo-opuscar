#!/bin/sh
# Golden Hour Stickman — demo film "That One Friend at School". One command rebuilds it:
#   sh my-styles/golden-hour-stickman/demo/build.sh
# Everything it writes goes to $OUT (default: my-styles/golden-hour-stickman/out/), never into demo/.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # the Lemo-Opuscar library (this repo)
OUT=${OUT:-$(cd "$HERE/.." && pwd)/out}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT/src"; cd "$LIB"
PY="$LIB/.venv/bin/python"
# the Chopin recording (Musopen, CC0) is not kept in git: fetch it once
if [ ! -f "$OUT/src/chopin.wav" ]; then
  [ -f "$OUT/src/chopin_op9_no2_musopen.flac" ] || curl -sSL -o "$OUT/src/chopin_op9_no2_musopen.flac" "https://archive.org/download/musopen-chopin-complete-works-flac/Nocturne%20in%20E%20flat%20major%2C%20Op.%209%20no.%202.flac"
  ffmpeg -v error -y -i "$OUT/src/chopin_op9_no2_musopen.flac" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT/src/chopin.wav"
fi
"$PY" "$HERE/audio/prep_vo.py"                       # trim + level the dialogue, mouth envelopes → $OUT/vo.json
cmp -s "$OUT/vo.json" "$HERE/audio/vo.json" || cp "$OUT/vo.json" "$HERE/audio/vo.json"   # only when the voices changed
node "$HERE/tools/timeline.mjs"                       # timeline → $OUT/timeline.json
node "$HERE/tools/srt.mjs"                            # subtitles
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
"$PY" "$HERE/mix.py"                                  # dialogue, music, foley → $OUT/mix.wav
rm -f "$OUT/that-one-friend-at-school.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/that-one-friend-at-school.mp4" 30 1
