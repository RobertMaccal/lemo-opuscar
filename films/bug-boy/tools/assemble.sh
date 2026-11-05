#!/bin/sh
# Join out/pieces/<start>_<end>.mp4 (must cover every frame) into out/video.mp4, master it with out/mix.wav → bug-boy.mp4
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
cd "$HERE/out/pieces"
ls [0-9]*_[0-9]*.mp4 | sort | awk '{print "file \x27" $0 "\x27"}' > list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -c copy ../video.mp4
echo "video frames: $(ffprobe -v error -count_frames -show_entries stream=nb_read_frames -of csv=p=0 ../video.mp4)"
cd "$LIB" && sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/bug-boy.mp4" 30 0
