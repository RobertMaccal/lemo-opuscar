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
# picture in finished 2 s chunks (re-run after any interruption: it renders only what is missing), then join + master
node "$HERE/tools/chunks.mjs" --workers 3 --chunk 60
sh "$HERE/tools/assemble.sh"
cd "$HERE" && node tools/export_srt.mjs
