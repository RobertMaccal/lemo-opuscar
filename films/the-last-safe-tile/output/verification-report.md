# THE LAST SAFE TILE: verification report

File: `output/the_last_safe_tile_45s.mp4` (18.6 MB)

| Property | Value |
|---|---|
| Resolution | 1080 × 1920 (9:16) |
| Frame rate | 60/1 |
| Frames | 2700 |
| Video duration | 45.000 s |
| Video | h264 High, yuv420p |
| Audio | aac 48000 Hz stereo, -17.8 LUFS, true peak -2.8 dBTP |
| Seed | 326 (simulation checksum 250558a6) |
| Survivors | 1 |
| Winner | GOLD ball #43 (#FFD34D) |
| Gold ball | survives |
| Balls alive at 10 / 20 / 30 / 39 / 43 s | 70 / 41 / 24 / 6 / 1 |
| Near misses (escapes) | 10 (6) |

## Checks

- ✅ **video codec H.264**: h264 (High)
- ✅ **resolution 1080×1920 (9:16)**: 1080×1920
- ✅ **frame rate 60 fps**: r=60/1 avg=60/1
- ✅ **exactly 2,700 frames**: decoded 2700
- ✅ **pixel format yuv420p**: yuv420p
- ✅ **video duration 45.000 s**: 45.000 s
- ✅ **audio AAC 48 kHz stereo**: aac 48000 Hz 2ch
- ✅ **audio duration ≈ 45 s**: 45.000 s
- ✅ **container duration**: 45.000 s
- ✅ **fast start (moov before mdat)**: moov@36 mdat@-1
- ✅ **loop seam: last frame ≈ first frame**: mean |Δ| 0.862/255, 0.005% px differ by >40
- ✅ **no black-screen glitches**: 0 black intervals
- ✅ **no unintended duplicate frames**: 0 frames identical to the previous one (loop hold frames are expected)
- ✅ **loudness for phones (−18…−13 LUFS)**: -17.8 LUFS integrated
- ✅ **no clipping (true peak ≤ −1 dBTP)**: -2.8 dBTP
- ✅ **no full-scale samples**: 0 samples at full scale
- ✅ **audio–video sync at tile collapses**: median onset offset 0.7 ms over 12 collapses

Overall: **PASSED**

QC stills: `output/qc/` (0, 2, 5, 10, 15, 20, 25, 30, 35, 39, 41, 43, 44.5 s) and `output/qc/contact_sheet.jpg`.
