#!/bin/sh
# Review stills tiled into one sheet:  sh films/that-one-friend/tools/review.sh <name> <t> [<t> ...]   (run from the library root)
HERE=$(cd "$(dirname "$0")/.." && pwd); n=$1; shift; O=${OUT:-$HERE/../out}; mkdir -p "$O"
rm -rf "$O/rev_$n"; node core/render/still.mjs "$HERE" "$@" --size 1080x1920 --out "$O/rev_$n" 2>&1 | grep -v "note\]" | grep -iv "\.jpg " ; 
.venv/bin/python core/render/sheet.py "$O/$n.jpg" $(ls "$O/rev_$n"/*.jpg | sort -t_ -k3 -n) --cols ${COLS:-6} --w ${TW:-300} >/dev/null && echo "$O/$n.jpg"
