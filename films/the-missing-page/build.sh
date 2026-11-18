#!/bin/sh
# THE MISSING PAGE — Golden Hour Stickman. One command rebuilds the film from source:
#   sh films/the-missing-page/build.sh        (clone mode: <repo>/films/the-missing-page/)
# Needs the dialogue takes (audio/vo), the ElevenLabs music and effects (audio/music_raw, audio/sfx_raw) and the Salamander piano samples
# (sh tools/fetch.sh instruments salamander). Everything generated goes to $OUT (default: out/ in this folder).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
OUT=${OUT:-$HERE/out}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT"; cd "$LIB"
PY="$LIB/.venv/bin/python"
[ -d "$LIB/core/audio/instruments/salamander" ] || sh tools/fetch.sh instruments salamander
for f in "$HERE"/audio/music_raw/*.mp3 "$HERE"/audio/sfx_raw/*.mp3; do w="${f%.mp3}.wav"; [ -f "$w" ] || ffmpeg -v error -y -i "$f" -ar 48000 "$w"; done   # ElevenLabs downloads → 48 kHz WAV
"$PY" "$HERE/audio/prep_vo.py"                       # trim + level the dialogue, mouth envelopes → $OUT/vo.json
cmp -s "$OUT/vo.json" "$HERE/audio/vo.json" || cp "$OUT/vo.json" "$HERE/audio/vo.json"
node "$HERE/tools/timeline.mjs"                       # timeline → $OUT/timeline.json
node "$HERE/tools/srt.mjs"                            # subtitles → $OUT/the-missing-page.srt
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$OUT/video.mp4"
"$PY" "$HERE/mix.py"                                  # dialogue, music, Rachmaninoff, foley → $OUT/mix.wav
rm -f "$OUT/the-missing-page.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/the-missing-page.mp4" 30 1
cp "$OUT/the-missing-page.mp4" "$OUT/the-missing-page.srt" "$HERE/"
