#!/bin/sh
# One command: narration layout → score → mix → picture → master (1080×1920, 30 fps, −14 LUFS) → subtitles
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python -I"
cd "$HERE"
# narration: voice/takeB.wav + voice/insA1.wav + voice/insB1.wav (ElevenLabs, see CREDITS) → voice/vo.wav, vo.json, vo.js
[ -f voice/takeB.align.json ] || $PY tools/align.py voice/takeB.wav
$PY tools/vo_layout.py
node tools/export_timeline.mjs
$PY music.py
$PY mix.py
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/bug-boy.mp4" 30 0
cd "$HERE" && node tools/export_srt.mjs
