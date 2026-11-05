#!/bin/sh
# Join out/pieces/<start>_<end>.mp4 (must cover every frame) into out/video.mp4, master it with out/mix.wav → bug-boy.mp4
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
cd "$HERE/out/pieces"
ls [0-9]*_[0-9]*.mp4 | sort | awk '{print "file \x27" $0 "\x27"}' > list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -c copy ../video.mp4
echo "video frames: $(ffprobe -v error -count_frames -show_entries stream=nb_read_frames -of csv=p=0 ../video.mp4)"
# the mix is already mastered to -14 LUFS with a peak limiter (mix.py), so encode with mux.sh's settings minus its second loudnorm pass
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -filter_complex "[0:v]fps=30,format=yuv420p[v];[1:a]aresample=48000,apad=whole_dur=194.7[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -r 30 -c:a aac -b:a 256k -movflags +faststart -shortest "$HERE/bug-boy.mp4"
ffmpeg -hide_banner -nostats -i "$HERE/bug-boy.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
