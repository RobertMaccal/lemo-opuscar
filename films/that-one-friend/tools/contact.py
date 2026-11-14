"""Storyboard contact sheet:  .venv/bin/python films/that-one-friend/tools/contact.py   (run from the library root)"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRE, FONTS = os.path.join(HERE, 'preproduction'), os.path.join(HERE, 'fonts')
INK, PAPER, LAV, ORANGE, RUST = (34, 30, 58), (251, 244, 226), (110, 100, 143), (242, 166, 90), (194, 81, 45)
f = lambda name, size: ImageFont.truetype(os.path.join(FONTS, name), size)
T, HND, UI = 'LilitaOne-Regular.ttf', 'PatrickHand-Regular.ttf', 'Fredoka.ttf'
TILES = [
    ('style-frame-school-hallway', '00 · TITLE', '0:00–0:03', 'WIDE · slow push down the corridor', 'THAT ONE FRIEND AT SCHOOL...'),
    ('storyboard-01-before-exam', '01 · BEFORE EXAM', '0:03–0:22', 'TWO-SHOT · locked, tiny drift', '“Bro... I’m actually cooked.”'),
    ('style-frame-examination', '02a · THE EXAM', '0:22–0:29', 'WIDE · clock ticks, push to YOU', '(silence. pencils. one blank page.)'),
    ('storyboard-02-extra-paper', '02b · THE REVEAL', '0:29–0:37', 'OVER-SHOULDER · hand first, rack focus', '“Could I have another answer booklet?”'),
    ('storyboard-02b-horror-reaction', '02c · HORROR', '0:37–0:44', 'EXTREME CLOSE-UP · dutch tilt', '“Another... WHAT?”'),
    ('storyboard-03-post-exam', '03 · THE SPIRAL', '0:44–1:07', 'DOLLY-ZOOM · YOU sharp, world blurs', '“...I wrote a muscle.”'),
    ('storyboard-04-classroom', '04 · CLASSROOM', '1:07–1:33', 'THREE-SHOT · teacher walks up the aisle', '“Which bone doesn’t articulate...?”'),
    ('storyboard-05-running', '05a · RUNNING', '1:33–1:42', 'TRACKING · side-on sprint', '“Second place.”  “After Jack.”'),
    ('storyboard-06-swimming', '05b · SWIMMING', '1:42–1:50', 'MATCH CUT · wide from the wall', '“...Jack?”  “Jack.”'),
    ('storyboard-07-scoreboard', '05c · THE BOARDS', '1:50–2:04', 'INSERTS · faster every time', '1ST JACK · 2ND YOU  (again. again.)'),
    ('storyboard-08-final-sunset', '06 · SUNSET', '2:04–2:27', 'WIDE · walk-and-talk, crane up', '“I’m just chill.”'),
]
COLS, TW, TH, GAP, LAB, M, HEAD = 6, 384, 683, 26, 132, 60, 210
rows = (len(TILES) + 1 + COLS - 1) // COLS
W, H = M * 2 + COLS * TW + (COLS - 1) * GAP, HEAD + rows * (TH + LAB + GAP) + M
S = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(S)
for x in range(40, W, 80): d.line([(x, 0), (x, H)], fill=(232, 226, 236), width=1)
for y in range(40, H, 80): d.line([(0, y), (W, y)], fill=(232, 226, 236), width=1)
d.text((M, 34), 'THAT ONE FRIEND AT SCHOOL  ·  VISUAL DEVELOPMENT', font=f(UI, 24), fill=LAV)
d.text((M, 66), 'STORYBOARD CONTACT SHEET', font=f(T, 82), fill=INK)
d.rectangle([M, 166, M + 300, 174], fill=ORANGE)
d.text((W - M, 96), 'eleven key frames · 1080 × 1920 · every frame drawn by the animation code, not painted', font=f(HND, 34), fill=(52, 48, 79), anchor='rm')
for k in range(len(TILES) + 1):
    x, y = M + (k % COLS) * (TW + GAP), HEAD + (k // COLS) * (TH + LAB + GAP)
    if k == len(TILES):
        d.rounded_rectangle([x, y, x + TW, y + TH], 22, fill=(246, 234, 208), outline=INK, width=4)
        lines = [('HOW TO READ', T, 40, INK), ('', HND, 12, INK), ('Captions are the film’s', HND, 32, INK), ('own caption style:', HND, 32, INK), ('a paper label with the', HND, 32, INK), ('speaker’s colour tab.', HND, 32, INK),
                 ('', HND, 18, INK), ('Dashed lavender label', HND, 32, LAV), ('= YOU, thinking.', HND, 32, LAV), ('', HND, 18, INK), ('Times follow the draft', HND, 32, INK), ('timeline; real timing', HND, 32, INK), ('locks to the recorded', HND, 32, INK), ('dialogue.', HND, 32, INK)]
        yy = y + 60
        for s, fn, sz, col in lines: d.text((x + 34, yy), s, font=f(fn, sz), fill=col); yy += sz + 8
        continue
    file, code, tc, camera, line = TILES[k]
    im = Image.open(os.path.join(PRE, file + '.png')).convert('RGB').resize((TW, TH), Image.LANCZOS)
    mask = Image.new('L', (TW, TH), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, TW, TH], 22, fill=255)
    d.rounded_rectangle([x + 7, y + 9, x + TW + 7, y + TH + 9], 22, fill=(200, 190, 205))
    S.paste(im, (x, y), mask); d.rounded_rectangle([x, y, x + TW, y + TH], 22, outline=INK, width=4)
    d.text((x + 4, y + TH + 14), code, font=f(T, 30), fill=INK); d.text((x + TW - 4, y + TH + 18), tc, font=f(UI, 22), fill=RUST, anchor='ra')
    d.text((x + 4, y + TH + 54), camera, font=f(UI, 19), fill=LAV); d.text((x + 4, y + TH + 82), line, font=f(HND, 27), fill=(52, 48, 79))
out = os.path.join(PRE, 'storyboard-contact-sheet.png'); S.save(out); print(out, S.size)
