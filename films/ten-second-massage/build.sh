#!/bin/sh
# THE 10-SECOND MASSAGE — one command rebuilds the film from source:
#   sh films/ten-second-massage/build.sh          (from the library root, or from anywhere)
# Needs Node 20+, ffmpeg 7+ on PATH (6.x makes mux.sh reject the audio; a static build such as the one in the
# imageio-ffmpeg pip package works) and the library .venv (setup.sh deps). Generated files go to $OUT (default: films/ten-second-massage/out/); the finished film is copied next to this script.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}             # the Lemo-Opuscar library (this repo)
OUT=${OUT:-$HERE/out}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT/src"; cd "$LIB"
PY="$LIB/.venv/bin/python"
# the Chopin recording (Musopen, CC0) is not kept in git: fetch it once
if [ ! -f "$OUT/src/chopin.wav" ]; then
  [ -f "$OUT/src/chopin.flac" ] || curl -sSL -o "$OUT/src/chopin.flac" "https://archive.org/download/musopen-chopin-complete-works-flac/Nocturne%20in%20E%20flat%20major%2C%20Op.%209%20no.%202.flac"
  ffmpeg -v error -y -i "$OUT/src/chopin.flac" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT/src/chopin.wav"
fi
"$PY" "$HERE/audio/prep_vo.py"                        # trim + level the dialogue, mouth envelopes → $OUT/vo.json
cmp -s "$OUT/vo.json" "$HERE/audio/vo.json" || cp "$OUT/vo.json" "$HERE/audio/vo.json"
node "$HERE/tools/timeline.mjs"                       # timeline → $OUT/timeline.json
node "$HERE/tools/srt.mjs"                            # subtitles
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
"$PY" "$HERE/mix.py"                                  # dialogue, music, foley → $OUT/mix.wav
rm -f "$OUT/ten-second-massage.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/ten-second-massage.mp4" 30 1
cp "$OUT/ten-second-massage.mp4" "$OUT/ten-second-massage.srt" "$HERE/"
