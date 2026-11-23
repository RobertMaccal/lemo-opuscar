#!/bin/sh
# Rebuild the film from the library root:  sh films/brides/build.sh
set -e
D=films/brides
.venv/bin/python $D/audio/prep_vo.py
.venv/bin/python $D/audio/mix.py
ffmpeg -v error -y -i $D/audio/mix.wav -af "alimiter=limit=0.5:attack=1:release=60:level=false" -c:a pcm_f32le $D/audio/mix_lim.wav
node core/render/video.mjs $D --fps 30 --workers 3 --size 1080x1920 --out $D/out/picture.mp4
LEMO_COLOR=bt709 sh core/render/mux.sh $D/out/picture.mp4 $D/audio/mix_lim.wav $D/out/brides-in-the-bath.mp4 30 2
ffmpeg -v error -y -i $D/out/brides-in-the-bath.mp4 -c:v libx264 -preset slow -crf 19 -maxrate 7M -bufsize 14M -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy $D/out/brides-in-the-bath-share.mp4
node $D/cover.mjs
