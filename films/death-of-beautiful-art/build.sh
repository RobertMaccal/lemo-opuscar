#!/bin/sh
# The Death of Beautiful Art? — one-command build (clone mode: films/<name>/ inside the library).
# Needs: library set up with `setup.sh deps voice` + instruments vsco2ce, vcsl, salamander; narration already in voice/seq*.wav
# (made from voice/takes/*.mp3 by tools/voice_edit.py). Assets in assets/ (see RIGHTS.md).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$HERE"
[ -f voice/seq1.wav ] || "$PY" tools/voice_edit.py
python3 -I tools/timeline.py > /dev/null
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --step 0.1
node core/render/events.mjs "$HERE"
"$PY" "$HERE/tools/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
python3 -c "import json;F=json.load(open('$HERE/film.json'));json.dump([{'t0':a,'t1':b,'text':s} for a,b,s,_ in F['subs']],open('$HERE/out/cues.json','w'))"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/death-of-beautiful-art.srt"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/death-of-beautiful-art.mp4" 30 0
node core/render/still.mjs "$HERE" 168 --prefix p_ --out "$HERE/out" && cp "$HERE/out/p_168.jpg" "$HERE/poster.jpg"
echo "done: $HERE/death-of-beautiful-art.mp4"
