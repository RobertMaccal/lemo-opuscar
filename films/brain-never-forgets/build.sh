#!/bin/sh
# THE BRAIN NEVER FORGETS — one command rebuilds the film:  sh films/brain-never-forgets/build.sh
# Everything it writes goes to $OUT (default: films/brain-never-forgets/out/); the delivery files are copied next to this script.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}               # clone mode: <repo>/films/<name>/
OUT=${OUT:-$HERE/out}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT/src"; cd "$LIB"
PY="$LIB/.venv/bin/python"
FF=${FFMPEG:-ffmpeg}
# the Chopin recording (Musopen, CC0) is not kept in git: fetch it once
if [ ! -f "$OUT/src/chopin.wav" ]; then
  [ -f "$OUT/src/chopin_op9_no2_musopen.flac" ] || curl -sSL -o "$OUT/src/chopin_op9_no2_musopen.flac" "https://archive.org/download/musopen-chopin-complete-works-flac/Nocturne%20in%20E%20flat%20major%2C%20Op.%209%20no.%202.flac"
  $FF -v error -y -i "$OUT/src/chopin_op9_no2_musopen.flac" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT/src/chopin.wav"
fi
"$PY" "$HERE/audio/prep_vo.py"                        # trim + level the dialogue, mouth envelopes → $OUT/vo.json
cmp -s "$OUT/vo.json" "$HERE/audio/vo.json" || cp "$OUT/vo.json" "$HERE/audio/vo.json"
node "$HERE/tools/timeline.mjs"                        # timeline → $OUT/timeline.json
node "$HERE/tools/srt.mjs"                             # subtitles
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
"$PY" "$HERE/mix.py"                                   # dialogue, music, foley → $OUT/mix.wav
rm -f "$OUT/brain-never-forgets.mp4"
# mix.py already masters to about -14.5 LUFS with a peak limiter; mux.sh normalises again. With ffmpeg 6.x its length check
# misfires (TECHNIQUE.md §1), so fall back to the same encode without the loudnorm pass.
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/brain-never-forgets.mp4" 30 1 || \
  $FF -y -loglevel error -i "$OUT/video.mp4" -i "$OUT/mix.wav" -filter_complex "[0:v]fps=30,noise=c0s=1:allf=t,format=yuv420p[v];[1:a]aresample=48000[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -r 30 -c:a aac -b:a 256k -movflags +faststart -shortest "$OUT/brain-never-forgets.mp4"
cp "$OUT/brain-never-forgets.mp4" "$OUT/brain-never-forgets.srt" "$HERE/"
