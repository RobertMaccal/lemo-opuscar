"""plan.py — the single timeline of ONE MORE SCROLL.

Every shot, its duration, the dialogue placed in it, its sound cues and ambience, and the music sections.
Writes:  story/shots.json (for the aiTrends renderer), scenes/_timeline.js (line windows + mouth envelopes
for lip sync, shot start times), input/voiceover.wav (all dialogue at its place), timeline/lines.json,
<name>.srt.   Run:  python plan.py
"""
import json, os
import numpy as np, soundfile as sf

H = os.path.dirname(os.path.abspath(__file__)); SR = 48000
VO = os.path.join(H, 'audio', 'vo_trim')
WHO = {'j': 'JEFF', 'b': 'BOSS', 'p': 'PRIYA', 'm': 'MARK', 's': 'STRANGER', 'v': 'PHONE'}
TEXT = {
    'j01': "Okay... I think it's time to sleep.", 'm02': 'Morning, Jeff!', 'j03': '...morning.',
    'p04': 'Jeff, the boss needs you. He wants to see you in his office.',
    'b05': "Jeff! Do you have any idea what you're doing?",
    'b06': "Your work has been terrible lately. You come here every single day looking like you're dead!",
    'b07': "The sales are going down. You're barely doing anything! Honestly, I'm going to have to fire you, Jeff.",
    'j08': 'Whatever, boss...', 'b09': 'ARE YOU EVEN LISTENING TO ME, JEFF?! I SAID I MIGHT HAVE TO FIRE YOU!',
    'j10': 'Yeah... whatever, boss.', 'b11': "GET OUT! We'll talk later. Go!",
    'j12': 'Who the hell are you? What are you doing in my place?', 's13': 'I was like that yesterday, Jeff.',
    'j14': 'Who the hell are you?', 's15': 'I am you.', 's16': "And you're in trouble.",
    'v1': "As a doctor, I strongly recommend eight hours of sleep! Anyway, I haven't slept in three days. Follow for more!",
    'v3': "Twelve chairs. One jump. Let's GO!", 'v5': 'POOL DAY, BABY!',
}

# (id, seconds, set, picture, {lines: [(lineId, at)], sfx: [(at, name, gain, extra)], amb: (name, gain), in: transition, bars})
S = []
def shot(i, d, st, scene, lines=(), sfx=(), amb=None, tin=None, bars=None, **kw):
    S.append(dict(id=i, dur=d, set=st, scene=scene, lines=list(lines), sfx=list(sfx), amb=amb, tin=tin, bars=bars, **kw))

# ---------------- 1. THE WORLD AT NIGHT ----------------
shot('s01', 8.6, 'space', '3D: Earth in darkness, night side lit by city networks, sun limb; slow push in', sfx=[(5.6, 'riser', -12, {'dur': 3})], amb=('hum', -30), bars='scope')
shot('s02', 3.0, 'clouds', 'dive through a cloud layer, city lights appear through gaps (hidden cut)', sfx=[(0.0, 'whoosh', -6, {'dur': 1.4}), (1.2, 'wind', -14, {'dur': 2})], amb=('wind', -22), bars='scope')
shot('s03', 8.6, 'city3d', '3D: aerial city at night, traffic streams, tilt from top-down to skyline, glide toward one apartment block', sfx=[(0.6, 'carpass', -14), (4.2, 'carpass', -12), (6.8, 'carpass', -16)], amb=('city', -18), bars='wide')
shot('s04', 2.6, 'facade', 'apartment facade, grid of windows, one warm window; push until the window frame passes the lens', sfx=[(1.4, 'whoosh', -12, {'dur': 1})], amb=('city', -20))
shot('s05', 3.4, 'bedroom', 'inside: Jeff lies in bed, face lit by the phone; camera settles', amb=('roomtone', -24))
# ---------------- 2. INSTICKRAM ----------------
shot('s06', 2.6, 'bedroom', 'insert: bedside clock 12:00 AM, rack focus from Jeff to the clock', sfx=[(0.3, 'tick', -16), (1.3, 'tick', -16), (2.3, 'tick', -16)], amb=('roomtone', -24))
shot('s07', 3.0, 'phone', 'OTS on the phone: INSTICKRAM app opens, logo animation', sfx=[(0.3, 'pop', -12), (0.9, 'shimmer', -16)], amb=('roomtone', -26))
shot('s08', 4.6, 'vid', 'push into the phone: video 1, stickman doctor in a clinic lecturing about sleep', lines=[('v1', 0.3)], sfx=[(0.0, 'swish', -12)], amb=('roomtone', -28))
shot('s09', 2.0, 'bedroom', 'giant face: Jeff smirks, phone light on his face', amb=('roomtone', -26))
shot('s10', 2.2, 'vid', 'doctor video ends: hearts burst, follow button', sfx=[(1.2, 'blip', -14)], amb=('roomtone', -28))
shot('s11', 3.2, 'vid', 'swipe: video 2, a cat pushes a glass off a table and stares at camera', sfx=[(0.0, 'swish', -10), (1.7, 'hit', -12, {'pitch': 1.8}), (1.8, 'glass', -10)], amb=('roomtone', -28))
shot('s12', 2.2, 'bedroom', 'time-lapse: clock spins to 12:45, the lamp clicks off', sfx=[(0.0, 'clockspin', -12, {'dur': 1.4}), (1.4, 'click', -8)], amb=('roomtone', -26))
shot('s13', 4.8, 'vid', 'video 3: stickman tries to jump over twelve chairs, runs, leaps, crashes', lines=[('v3', 0.15)], sfx=[(0.0, 'swish', -10), (3.55, 'impact', -10), (3.7, 'crash', -10)], amb=('roomtone', -28))
shot('s14', 2.2, 'bedroom', 'medium side: Jeff raises his eyebrows, phone glow', amb=('roomtone', -26))
shot('s15', 1.6, 'bedroom', 'clock 1:30, moonlight shifts across the wall', sfx=[(0.0, 'clockspin', -14, {'dur': 1})], amb=('roomtone', -26))
shot('s16', 2.4, 'vid', 'video 4: a stickman dances, looping', sfx=[(0.0, 'swish', -10)], amb=('roomtone', -28))
shot('s17', 2.0, 'bedroom', 'extreme close-up: Jeff eyes, the dancing video reflected in them', amb=('roomtone', -26))
shot('s18', 2.0, 'bedroom', 'clock races 2:15 to 2:50, faster', sfx=[(0.0, 'clockspin', -12, {'dur': 1.8})], amb=('roomtone', -26))
shot('s19', 3.6, 'vid', 'video 5: a guy cannonballs into a muddy puddle like a swimming pool', lines=[('v5', 1.0)], sfx=[(0.0, 'swish', -10), (2.55, 'splash', -6)], amb=('roomtone', -28))
shot('s20', 5.8, 'bedroom', 'medium in bed: Jeff laughs, the laugh fades; "time to sleep"; clock 3:00 AM in frame', lines=[('j01', 1.7)], sfx=[(0.1, 'chuckle', -12)], amb=('roomtone', -26))
shot('s21', 2.2, 'bedroom', 'he puts the phone face down, the glow dies; darkness', sfx=[(0.5, 'thud', -14, {'pitch': 1.6}), (0.7, 'click', -14)], amb=('roomtone', -30))
shot('s22', 4.0, 'title', 'black: ONE MORE SCROLL title in the silence', bars='none')
# ---------------- 3. 4:30 AM ----------------
shot('s23', 2.6, 'bedroom', 'SMASH: extreme close-up phone alarm 4:30 AM buzzing across the nightstand', sfx=[(0.0, 'alarm', -4, {'dur': 2.6}), (0.0, 'phonebuzz', -8, {'dur': 2.6})], tin='flash')
shot('s24', 3.0, 'bedroom', 'giant face sideways on the pillow: one puffy eye opens', sfx=[(0.0, 'alarm', -9, {'dur': 3.0}), (1.0, 'groan', -12)], amb=('roomtone', -26))
shot('s25', 3.0, 'bedroom', 'arm flops out, slaps the nightstand twice, finds the phone, alarm stops', sfx=[(0.0, 'alarm', -8, {'dur': 2.1}), (0.7, 'slap', -8), (1.3, 'slap', -8), (2.1, 'click', -6)], amb=('roomtone', -26))
shot('s26', 3.0, 'bedroom', 'wide, cold blue: Jeff sits up like a zombie, hair wrecked, slumps', sfx=[(0.4, 'cloth', -14), (1.8, 'sigh', -14)], amb=('roomtone', -26))
shot('s27', 2.6, 'bath', 'bathroom: light switch, fluorescent flickers on, Jeff squints', sfx=[(0.3, 'click', -6), (0.4, 'flicker', -10, {'dur': 1.4}), (1.0, 'buzz', -22, {'dur': 1.6})], amb=('hum', -26))
shot('s28', 3.6, 'bath', 'mirror: Jeff and his reflection, eye bags; he stares at himself', sfx=[(0.0, 'buzz', -24, {'dur': 3.6})], amb=('hum', -26))
shot('s29', 4.2, 'bath', 'faucet, he splashes water into his face twice, droplets fly, blinks: still tired', sfx=[(0.2, 'water', -10, {'dur': 3.6}), (1.2, 'splash', -14, {'pitch': 1.4}), (2.4, 'splash', -14, {'pitch': 1.4})], amb=('hum', -26))
# ---------------- 4. THE COMMUTE ----------------
shot('s30', 2.6, 'kitchen', 'kitchen insert: toast pops, he grabs it with his mouth, the door slams', sfx=[(0.3, 'pop', -6, {'pitch': 0.6}), (2.2, 'doorslam', -6)], amb=('roomtone', -26))
shot('s31', 4.2, 'street', 'side tracking down a grey dawn street, Jeff shuffles with toast', sfx=[(0.3, 'footstep', -16), (0.95, 'footstep', -16), (1.6, 'footstep', -16), (2.25, 'footstep', -16), (2.9, 'footstep', -16), (3.55, 'footstep', -16)], amb=('city', -22))
shot('s32', 4.4, 'busstop', 'bus stop wide: a jogger bounces, a woman with coffee, Jeff sways in the middle', amb=('city', -20))
shot('s33', 2.6, 'busstop', 'the bus arrives, brakes hiss, doors fold open', sfx=[(0.0, 'bus', -6, {'dur': 2.6}), (1.6, 'hiss', -8)], amb=('city', -20))
shot('s34', 6.4, 'bus', 'inside by the window, city reflections slide over the glass; head drops, snaps up, drops, thunk on the glass', sfx=[(0.0, 'busrumble', -12, {'dur': 6.4}), (5.0, 'thunk', -6)], amb=('city', -28))
# ---------------- 5. THE OFFICE ----------------
shot('s35', 4.0, 'office3d', '3D: open-plan office, grey and beige desk rows, ceiling panels; Jeff walks in', sfx=[(0.5, 'footstep', -18), (1.1, 'footstep', -18), (1.7, 'footstep', -18), (2.3, 'footstep', -18)], amb=('murmur', -26))
shot('s36', 4.2, 'office', 'coworkers wave "Morning, Jeff!"; Jeff lifts two fingers, "...morning."', lines=[('m02', 0.35), ('j03', 2.0)], amb=('murmur', -26))
shot('s37', 2.4, 'desk', 'Jeff sits, presses the power button, the monitor boots', sfx=[(0.3, 'chair', -12), (1.2, 'click', -8), (1.5, 'boot', -12)], amb=('murmur', -28))
shot('s38', 3.2, 'desk', 'OTS on the screen: a spreadsheet, slow typing, backspace', sfx=[(0.4, 'key', -12), (1.1, 'key', -12), (1.9, 'key', -12), (2.6, 'key', -10)], amb=('murmur', -28))
shot('s39', 3.6, 'office', 'time-lapse: wall clock 9 to 11, coworkers blur around a frozen Jeff', sfx=[(0.0, 'clockspin', -14, {'dur': 3.4}), (0.0, 'typing', -16, {'dur': 3.6})], amb=('murmur', -26))
shot('s40', 2.6, 'desk', 'close: his head sinks to the keyboard, jjjjjjj fills the cell', sfx=[(1.4, 'thunk', -12, {'pitch': 1.3})], amb=('murmur', -28))
shot('s41', 5.4, 'office', 'Priya taps his shoulder: "the boss needs you"; Jeff turns slowly, deadpan', lines=[('p04', 0.5)], sfx=[(0.2, 'tap', -10)], amb=('murmur', -28))
shot('s42', 2.6, 'office', 'Jeff stands and shuffles toward the boss office door', sfx=[(0.2, 'chair', -14), (0.9, 'footstep', -16), (1.6, 'footstep', -16)], amb=('murmur', -28))
# ---------------- 6. THE BOSS ----------------
shot('s43', 3.4, 'boss', 'wide from behind the boss desk: the door opens, Jeff enters, window blinds stripe the room', sfx=[(0.3, 'door', -8)], amb=('roomtone', -26))
shot('s44', 3.6, 'boss', 'boss medium, low angle, backlit by the blinds', lines=[('b05', 0.25)], amb=('roomtone', -28))
shot('s45', 1.6, 'boss', 'Jeff medium, flat framing, barely reacts', amb=('roomtone', -28))
shot('s46', 6.0, 'boss', 'boss medium-close, big gestures', lines=[('b06', 0.2)], amb=('roomtone', -28))
shot('s47', 7.3, 'boss', 'boss close; the sales chart on the wall drops behind him', lines=[('b07', 0.2)], amb=('roomtone', -28))
shot('s48', 2.8, 'boss', 'Jeff close, half-lidded', lines=[('j08', 0.5)], amb=('roomtone', -28))
shot('s49', 1.4, 'boss', 'giant face: the boss boils, brows dive, face reddens', sfx=[(0.0, 'riser', -12, {'dur': 1.4})], amb=('roomtone', -28))
shot('s50', 2.4, 'boss', 'SLAM: hand hits the desk, time freezes with papers, pens and coffee hanging in the air', sfx=[(0.12, 'impact', -2), (0.14, 'slam', -2), (0.16, 'freeze', -10)], tin='flash', bars='scope')
shot('s51', 4.8, 'boss', 'boss extreme close-up, shouting, slight roll', lines=[('b09', 0.15)], amb=('roomtone', -28))
shot('s52', 3.4, 'boss', 'Jeff close, identical framing: deadpan', lines=[('j10', 0.6)], amb=('roomtone', -28))
shot('s53', 3.8, 'boss', 'boss stands, low angle, arm across frame pointing to the door', lines=[('b11', 0.25)], sfx=[(0.1, 'chair', -10), (0.3, 'swish', -14)], amb=('roomtone', -28))
shot('s54', 3.0, 'boss', 'Jeff turns and shuffles out; the boss fumes; the door clicks', sfx=[(0.4, 'footstep', -16), (1.1, 'footstep', -16), (2.3, 'door', -8)], amb=('roomtone', -28))
# ---------------- 7. LUNCH AND THE END OF THE DAY ----------------
shot('s55', 3.0, 'cafeteria', 'cafeteria: Jeff at the microwave, it hums, it beeps', sfx=[(0.0, 'microwave', -12, {'dur': 2.2}), (2.2, 'beep', -8)], amb=('murmur', -22))
shot('s56', 5.0, 'cafeteria', 'wide, slow pull back: Jeff eats alone at a long table, other tables chatter in blur', sfx=[(1.0, 'fork', -18), (2.6, 'fork', -18), (4.0, 'fork', -18)], amb=('murmur', -22))
shot('s57', 6.0, 'office', 'office time-lapse: wall clock 1 to 6 PM, light swings to orange sunset, desks empty out around him', sfx=[(0.0, 'clockspin', -14, {'dur': 5.6}), (0.0, 'typing', -20, {'dur': 3.0})], amb=('murmur', -30))
shot('s58', 4.0, 'office', 'monitor off, he grabs his bag and walks out, sunset to blue', sfx=[(0.4, 'blip', -12, {'pitch': 0.6}), (1.2, 'footstep', -16), (1.9, 'footstep', -16), (2.6, 'footstep', -16)], amb=('hum', -30))
# ---------------- 8. THE SECOND NIGHT ----------------
shot('s59', 4.0, 'bedroom', 'apartment door opens, keys and bag drop, he falls face-first onto the bed in his clothes', sfx=[(0.2, 'door', -10), (0.9, 'keys', -10), (1.3, 'thud', -10), (2.3, 'bedflop', -6)], amb=('roomtone', -26), tin='dip')
shot('s60', 2.4, 'phone', 'his hand finds the phone; Instickram opens again', sfx=[(0.6, 'pop', -12), (1.0, 'shimmer', -18)], amb=('roomtone', -26))
shot('s61', 2.0, 'montage', 'montage: video flash, face in blue light, clock 10:30 PM', sfx=[(0.0, 'swish', -12), (1.0, 'blip', -16)], amb=('roomtone', -28))
shot('s62', 2.0, 'montage', 'montage: clock 11:45 PM, phone reflected in eyes', sfx=[(0.0, 'swish', -12), (1.0, 'blip', -16)], amb=('roomtone', -28))
shot('s63', 1.8, 'montage', 'montage: clock 12:30 AM, faster', sfx=[(0.0, 'swish', -12)], amb=('roomtone', -28))
shot('s64', 1.8, 'montage', 'montage: clock 1:30 AM, eyes heavy', sfx=[(0.0, 'swish', -12)], amb=('roomtone', -28))
shot('s65', 3.8, 'bedroom', 'his eyes close; the phone stays on in his hand, still playing, lighting his sleeping face', sfx=[(0.5, 'phonevid', -22, {'dur': 3.2})], amb=('roomtone', -28))
shot('s66', 6.8, 'bedroom', 'the alarm rings and rings, each ring the frame tightens; he slaps it off and sinks back', sfx=[(0.0, 'alarm', -8, {'dur': 1.3}), (1.7, 'alarm', -8, {'dur': 1.3}), (3.4, 'alarm', -7, {'dur': 1.4}), (4.9, 'slap', -8), (5.0, 'click', -8)], amb=('roomtone', -28))
# ---------------- 9. THE STRANGER ----------------
shot('s67', 3.0, 'bedroom', 'black-blue room. KNOCK KNOCK KNOCK. Jeff does not move', sfx=[(0.6, 'knock', -4), (0.95, 'knock', -4), (1.3, 'knock', -4)], amb=('roomtone', -30), tin='dip')
shot('s68', 3.4, 'hall', 'KNOCK KNOCK KNOCK, louder; the camera tracks down the dark hallway toward the bedroom door', sfx=[(0.3, 'knock', -1), (0.62, 'knock', -1), (0.94, 'knock', -1), (2.4, 'creak', -14)], amb=('roomtone', -30))
shot('s69', 3.0, 'bedroom', 'the bedroom door swings open, a slab of cold light, a silhouette in it', sfx=[(0.2, 'creak', -8, {'dur': 2.2}), (2.4, 'footstep', -14)], amb=('roomtone', -30))
shot('s70', 4.4, 'bedroom', 'giant face: Jeff turns his head, eyes barely open, confused', lines=[('j12', 0.4)], amb=('roomtone', -30))
shot('s71', 3.6, 'bedroom', 'the silhouette stands still; a short silence; then it speaks', lines=[('s13', 1.3)], amb=('roomtone', -32))
shot('s72', 2.4, 'bedroom', 'Jeff sits up', lines=[('j14', 0.45)], sfx=[(0.1, 'cloth', -14)], amb=('roomtone', -32))
shot('s73', 6.0, 'bedroom', 'the stranger steps into the light: giant close-up, Jeff face but steady and cold. "I am you." pause "And you\'re in trouble."', lines=[('s15', 1.0), ('s16', 3.0)], sfx=[(0.35, 'footstep', -10)], amb=('roomtone', -34), bars='scope')
shot('s74', 1.6, 'title', 'cut to black, silence', bars='none')
shot('s75', 5.0, 'title', 'TO BE CONTINUED...', bars='none', tin='fade')

# music sections: (cue file, start shot, offset into cue, fade in, end shot (exclusive) or None, fade out, gain dB)
MUSIC = [
    ('m1_orbit', 's01', 0.0, 0.5, 's07', 1.5, 2),
    ('m2_feed', 's07', 0.0, 0.3, 's21', 0.4, -4),     # cut hard on "time to sleep" landing
    ('m3_morning', 's24', 0.0, 2.0, 's35', 2.0, -3),
    ('m4_office', 's35', 0.0, 1.0, 's43', 1.5, -5),
    ('m5_tension', 's43', 0.0, 1.0, 's55', 2.0, -4),
    ('m6_sunset', 's55', 0.0, 1.0, 's59', 1.5, -4),
    ('m7_loop', 's60', 0.0, 0.5, 's67', 1.2, -5),
    ('m8_visitor', 's68', 0.0, 1.5, 's73', 1.4, -3),  # silence before the knocks; gone before "I am you"
]

# ---------------- build ----------------
t = 0.0; shots = []; lines = []; starts = {}
for s in S:
    starts[s['id']] = round(t, 3)
    for lid, at in s['lines']:
        x, sr = sf.read(os.path.join(VO, lid + '.wav')); d = len(x) / sr
        hop = sr // 30; env = [float(np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2))) for i in range(int(len(x) / hop) + 1)]
        m = max(env) or 1; env = [round(min(1, v / m * 1.3), 2) for v in env]
        lines.append(dict(id=lid, who=WHO[lid[0]], t0=round(t + at, 3), t1=round(t + at + d, 3), text=TEXT[lid], env=env))
    e = dict(id=s['id'], start=round(t, 3), end=round(t + s['dur'], 3), line=' '.join(TEXT[l] for l, _ in s['lines']), scene=s['scene'], set=s['set'],
             bars=s['bars'], **({'in': {'type': s['tin'], 'dur': 0.35 if s['tin'] == 'flash' else 0.6}} if s['tin'] else {}),
             sfx=[dict(at=a, name=n, gain=g, **(x[0] if x else {})) for a, n, g, *x in s['sfx']], amb=dict(name=s['amb'][0], gain=s['amb'][1]) if s['amb'] else None, notes='')
    shots.append(e); t += s['dur']
total = round(t, 3)
music = []
for cue, a, off, fi, b, fo, gdb in MUSIC:
    music.append(dict(file=f'audio/music/{cue}.wav', start=starts[a], end=starts[b] if b else total, offset=off, fadeIn=fi, fadeOut=fo, gain=gdb))
os.makedirs(os.path.join(H, 'story'), exist_ok=True); os.makedirs(os.path.join(H, 'timeline'), exist_ok=True)
json.dump(dict(title='One More Scroll', duration=total, shots=shots, music=music), open(os.path.join(H, 'story', 'shots.json'), 'w'), indent=1)
json.dump(dict(duration=total, lines=[{k: v for k, v in l.items() if k != 'env'} for l in lines], music=music, starts=starts), open(os.path.join(H, 'timeline', 'lines.json'), 'w'), indent=1)
with open(os.path.join(H, 'scenes', '_timeline.js'), 'w') as f:
    f.write('// generated by plan.py — do not edit\n')
    f.write('export const LINES = ' + json.dumps(lines) + ';\n')
    f.write('export const START = ' + json.dumps(starts) + ';\n')
    f.write('export const DUR = ' + json.dumps(total) + ';\n')
# dialogue track (phone-video voices are mixed separately, band-limited)
vo = np.zeros(int(total * SR) + SR, np.float32)
for l in lines:
    if l['who'] == 'PHONE': continue
    x, sr = sf.read(os.path.join(VO, l['id'] + '.wav'), dtype='float32'); i = int(l['t0'] * SR); vo[i:i + len(x)] += x
sf.write(os.path.join(H, 'input', 'voiceover.wav'), vo, SR)
# subtitles
def ts(s): ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
srt = []; L = [l for l in lines]
for i, l in enumerate(L):
    end = min(max(l['t1'] + 0.5, l['t0'] + 1.8), L[i + 1]['t0'] - 0.05 if i + 1 < len(L) else total)
    who = '' if l['who'] in ('JEFF', 'BOSS') else ''
    srt.append(f"{i + 1}\n{ts(l['t0'])} --> {ts(end)}\n{('[on phone] ' if l['who'] == 'PHONE' else '') + l['text']}\n")
open(os.path.join(H, 'one-more-scroll.srt'), 'w').write('\n'.join(srt))
print(f'{len(shots)} shots, {len(lines)} lines, duration {total:.2f}s = {int(total // 60)}:{total % 60:05.2f}')
for k in ['s01', 's06', 's23', 's30', 's35', 's43', 's55', 's59', 's67', 's75']: print(k, starts[k])
