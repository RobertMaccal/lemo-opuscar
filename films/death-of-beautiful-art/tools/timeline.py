"""Build film.json, the one timeline the page, the mix and the subtitles share.
Voice starts are set here; word times come from voice/edit.json (Whisper, remapped through the pause edit).
Subtitle cues: display text + the spoken words they cover, aligned to the Whisper words, so each cue
starts on its first word and ends just after its last.   usage: python3 -I tools/timeline.py"""
import json, os, re, difflib
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(f'{HERE}/voice/edit.json'))
VO = {'1': 1.6, '2': 22.1, '3': 44.3, '4': 69.4, '5': 90.5, '6': 113.6, '7': 144.4, '8': 164.3}
DUR = 178.2
# section = [start, end) of each sequence's picture
SECT = {'s1': [0, 21.8], 's2': [21.8, 44.0], 's3': [44.0, 69.1], 's4': [69.1, 90.2], 's5': [90.2, 113.3],
        's6': [113.3, 144.1], 's7': [144.1, 164.0], 's8': [164.0, DUR]}
# (display text, spoken text) — the spoken text is the slice of the narration the cue covers
CUES = {
 '1': [("A banana. A piece of tape.", "A banana. A piece of tape."),
       ("$6,240,000.", "Six million, two hundred and forty thousand dollars."),
       ("That's what Maurizio Cattelan's Comedian\nsold for at Sotheby's in November 2024.", "That's what Maurizio Cattelan's Comedian sold for at Sotheby's in November 2024."),
       ("So how did we get from Van Gogh painting the night sky…", "So how did we get from Van Gogh painting the night sky"),
       ("…to millions for fruit on a wall?", "to millions for fruit on a wall?")],
 '2': [("Once, art mostly meant skill, observation and imagination.", "Once, art mostly meant skill, observation and imagination."),
       ("Van Gogh turned the view from his asylum window\ninto a sky that moves.", "Van Gogh turned the view from his asylum window into a sky that moves."),
       ("Picasso broke the human figure apart,\nand showed it from several sides at once.", "Picasso broke the human figure apart, and showed it from several sides at once."),
       ("In Guernica, he turned the bombing of a town\ninto a cry against war.", "In Guernica, he turned the bombing of a town into a cry against war.")],
 '3': [("But the real break came twenty years before Guernica.", "But the real break came twenty years before Guernica."),
       ("In 1917, Marcel Duchamp signed a urinal with a fake name,", "In 1917, Marcel Duchamp signed a urinal with a fake name,"),
       ("and sent it to an exhibition that promised to show everything.", "and sent it to an exhibition that promised to show everything."),
       ("They hid it behind a partition.", "They hid it behind a partition."),
       ("A small magazine defended it in three words.\nHe chose it.", "A small magazine defended it in three words. He chose it."),
       ("What if the artist's idea mattered more\nthan the artist's hand?", "What if the artist's idea mattered more than the artist's hand?")],
 '4': [("In 1964, Andy Warhol showed boxes\nthat looked just like supermarket cartons.", "In 1964, Andy Warhol showed boxes that looked just like supermarket cartons."),
       ("A philosopher asked why those were art,\nand the ones in the stockroom weren't.", "A philosopher asked why those were art, and the ones in the stockroom weren't."),
       ("His answer: an artworld.", "His answer: an artworld."),
       ("By the late sixties, art could be an instruction.", "By the late sixties, art could be an instruction."),
       ("An ordinary object. A question.", "An ordinary object. A question.")],
 '5': [("Fast-forward to 2021.", "Fast-forward to 2021."),
       ("Salvatore Garau sold a sculpture called Io Sono\nfor €15,000.", "Salvatore Garau sold a sculpture called Io Sono for fifteen thousand euros."),
       ("It is invisible.", "It is invisible."),
       ("The buyer got a certificate, and instructions:", "The buyer got a certificate, and instructions:"),
       ("display it in a space five feet square, free of obstructions.", "display it in a space five feet square, free of obstructions."),
       ("Yes. Empty space.", "Yes. Empty space.")],
 '6': [("And then, the banana.", "And then, the banana."),
       ("But here's the detail.\nThe collector wasn't really paying for fruit.", "But here's the detail. The collector wasn't really paying for fruit."),
       ("Comedian comes with a certificate of authenticity\nand instructions.", "Comedian comes with a certificate of authenticity and instructions."),
       ("The banana itself is meant to be replaced.", "The banana itself is meant to be replaced."),
       ("The one at Sotheby's was reportedly bought\nfrom a fruit stand outside. For 35 cents.", "The one at Sotheby's was reportedly bought from a fruit stand outside. For thirty-five cents."),
       ("So what was the buyer buying?\nAn idea? A symbol?", "So what was the buyer buying? An idea? A symbol?"),
       ("Or proof that prestige, scarcity and publicity\ncan create a price?", "Or proof that prestige, scarcity and publicity can create a price?")],
 '7': [("Supporters say conceptual art challenges the way we think.", "Supporters say conceptual art challenges the way we think."),
       ("Critics ask whether almost anything becomes valuable\nonce the right institutions call it art.", "Critics ask whether almost anything becomes valuable once the right institutions call it art."),
       ("Both are worth asking. Painting never disappeared.", "Both are worth asking. Painting never disappeared."),
       ("But art no longer has to be beautiful to be called art.", "But art no longer has to be beautiful to be called art.")],
 '8': [("So maybe the question isn't\nwhether art has become ridiculous.", "So maybe the question isn't whether art has become ridiculous."),
       ("Maybe it's this.", "Maybe it's this."),
       ("When did the price of art\nbecome part of the artwork itself?", "When did the price of art become part of the artwork itself?")],
}
N2W = {'2024': 'twenty twenty four', '1917': 'nineteen seventeen', '1964': 'nineteen sixty four', '2021': 'twenty twenty one',
       '20': 'twenty', '35': 'thirty five', '15,000': 'fifteen thousand', '60s': 'sixties', '$6,240,000': 'six million two hundred and forty thousand dollars'}
def norm(s):
    out = []
    for tok in s.replace('-', ' ').split():
        core = tok.strip('.,;:!?"…').lower()
        core = N2W.get(core, core)
        out += re.sub(r"[^a-z0-9' ]", ' ', core).replace('artworld', 'art world').replace('stockroom', 'stock room').split()
    return out

film = {'dur': DUR, 'sections': SECT, 'vo': VO, 'words': {}, 'subs': []}
for sid, v in E.items():
    t0 = VO[sid]
    ws = [dict(w=w['w'], t0=round(t0 + w['t0'], 3), t1=round(t0 + w['t1'], 3)) for w in v['words']]
    film['words'][sid] = ws
    film['vo_end'] = film.get('vo_end', {}); film['vo_end'][sid] = round(t0 + v['dur'], 3)
    # expand whisper words into normalised tokens, each carrying its word's times
    htoks = []
    for w in ws:
        for tk in norm(w['w']): htoks.append((tk, w['t0'], w['t1']))
    stoks, bounds = [], []
    for disp, spoken in CUES[sid]:
        a = len(stoks); stoks += norm(spoken); bounds.append((a, len(stoks) - 1, disp))
    sm = difflib.SequenceMatcher(None, stoks, [h[0] for h in htoks], autojunk=False)
    m = {}
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): m[blk.a + k] = blk.b + k
    def near(i, d):  # nearest matched script token in direction d
        while i not in m: i += d
        return m[i]
    for a, b, disp in bounds:
        film['subs'].append([round(htoks[near(a, 1)][1], 2), round(htoks[near(b, -1)][2] + .25, 2), disp, sid])
# minimum hold 1.8 s and spoken + 0.6 s: extend into the following silence, never into the next cue
S = film['subs']
for i, c in enumerate(S):
    nxt = S[i + 1][0] - .05 if i + 1 < len(S) else DUR
    want = max(c[0] + 1.8, c[1] + .35)
    c[1] = round(min(max(c[1], want), nxt), 2)
json.dump(film, open(f'{HERE}/film.json', 'w'), indent=1)
for c in S: print(f"{c[0]:7.2f} {c[1]:7.2f} {c[1]-c[0]:4.1f}  {c[2]!r}")
print('voice ends', film['vo_end'])
