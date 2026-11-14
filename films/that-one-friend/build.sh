#!/bin/sh
# One command rebuilds the film:  sh films/that-one-friend/build.sh      (clone mode: <repo>/films/that-one-friend/)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
# the Chopin recording (Musopen, CC0) is not kept in git: fetch it once
SRC="$HERE/audio/src"; mkdir -p "$SRC"
if [ ! -f "$SRC/chopin.wav" ]; then
  [ -f "$SRC/chopin_op9_no2_musopen.flac" ] || curl -sSL -o "$SRC/chopin_op9_no2_musopen.flac" "https://archive.org/download/musopen-chopin-complete-works-flac/Nocturne%20in%20E%20flat%20major%2C%20Op.%209%20no.%202.flac"
  ffmpeg -v error -y -i "$SRC/chopin_op9_no2_musopen.flac" -ar 48000 -ac 2 -c:a pcm_s16le "$SRC/chopin.wav"
fi
"$PY" "$HERE/audio/prep_vo.py"                      # trim + level the dialogue, mouth envelopes → audio/vo.json
node "$HERE/tools/timeline.mjs"                      # timeline → out/timeline.json
node "$HERE/tools/srt.mjs"                           # subtitles
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --size 1080x1920 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"                                 # dialogue, music, foley → out/mix.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/that-one-friend-at-school.mp4" 30 1
