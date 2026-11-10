"""Assemble the three-voice dialogue track from the chosen ElevenLabs takes.

  python3 projects/doctor-chatgpt/audio/assemble_dialogue.py

Each line: trimmed to its speech, levelled per delivery (shout / normal / whisper),
optional internal-pause tightening, the chatbot gets a light phone-speaker EQ.
Writes input/dialogue.wav (48 kHz mono) and timeline/lines.json (where each line sits).
"""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
DOC, NUR, BOT = "doctor", "nurse", "chatbot"
# id, take, speaker, start (s), target speech RMS dBFS, extra
# id, take, speaker, gap before (s, after the previous line ends; first = absolute start), target speech RMS dBFS, extra
LINES = [
    ("N1", "N1_b", NUR, 0.55, -18, {}),
    ("D1", "D1_b", DOC, 0.25, -19, {}),
    ("D2", "D2_a", DOC, 1.50, -22, {}),   # doctor bursts in, everyone turns, phone comes out
    ("C1", "C1_a", BOT, 0.35, -20, {}),
    ("D3", "D3_b", DOC, 0.30, -19, {}),
    ("N2", "N2_b", NUR, 1.95, -18, {}),   # cabinet, cartoon tablet, nurse's head snaps round
    ("D4", "D4_b", DOC, 0.35, -20, {"hard_end": True}),
    ("D5", "D5_b", DOC, 0.50, -17, {}),   # the freeze: he realises what he said
    ("N3", "N3_b", NUR, 0.40, -18, {}),
    ("D6", "D6_b", DOC, 0.30, -22, {}),
    ("C2", "C2_b", BOT, 0.40, -20, {}),
    ("D7", "D7_a", DOC, 1.55, -19, {}),   # confused blink, idea, one tap, screen goes green
    ("N4", "N4_a", NUR, 0.50, -17, {}),   # one beat of complete disbelief
    ("N5", "N5_a", NUR, 0.40, -18, {}),
    ("D8", "D8_a", DOC, 2.35, -24, {}),   # flatline, team rushes in, doctor frozen, phone rises
    ("C3", "C3_a", BOT, 0.85, -20, {"max_pause": 0.42}),   # music stops; silence; the apology
]
HOLD_END = 0.75   # silent reaction after the last word, then cut to black
BLACK = 0.35
TEXT = {
    "N1": "WE NEED A DOCTOR! NOW! WE'RE LOSING HIM!", "D1": "I'm coming! I'm coming! I've got this!",
    "D2": "ChatGPT! How do I stop severe bleeding?!", "C1": "Great question! Give him ibuprofen! You're doing amazing!",
    "D3": "Perfect!", "N2": "DOCTOR! DID YOU JUST GIVE HIM IBUPROFEN?!", "D4": "Relax! ChatGPT—", "D5": "I MEAN, I'VE GOT THIS!",
    "N3": "HE'S STILL BLEEDING! DO SOMETHING!", "D6": "ChatGPT! He's getting worse! What now?!",
    "C2": "Try making the monitor green. Green means healthy!", "D7": "See? He's green!", "N4": "THAT'S THE SCREEN!",
    "N5": "NO PULSE! CODE BLUE!", "D8": "ChatGPT... was the ibuprofen a bad idea?",
    "C3": "Yes, you're right! Ibuprofen should not be used to stop severe bleeding. You needed immediate bleeding control. I'm sorry about that. Would you like more recommendations on how to stop bleeding?",
}


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def env_db(x, hop=0.01):
    h = int(SR * hop); n = len(x) // h
    fr = np.sqrt((x[: n * h].reshape(n, h) ** 2).mean(1) + 1e-12)
    return 20 * np.log10(fr), h


def trim(x, thr=-36, pad_in=0.03, pad_out=0.08):
    e, h = env_db(x); on = np.where(e > thr)[0]
    a = max(0, on[0] * h - int(pad_in * SR)); b = min(len(x), (on[-1] + 1) * h + int(pad_out * SR))
    return x[a:b]


def tighten(x, max_pause, thr=-42, min_gap=0.3):
    """shorten silent gaps longer than max_pause (keeps the delivery, tightens the timing)"""
    e, h = env_db(x); quiet = e < thr; out = []; i = 0; n = len(e)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            gap = (j - i) * h / SR
            if gap > max_pause and i > 0 and j < n:
                keep = int(max_pause * SR / h); half = keep // 2
                out.append(x[i * h:(i + half) * h]); out.append(x[(j - (keep - half)) * h:j * h])
            else:
                out.append(x[i * h:j * h])
            i = j
        else:
            j = i
            while j < n and not quiet[j]: j += 1
            out.append(x[i * h:j * h]); i = j
    out.append(x[n * h:])
    return np.concatenate(out)


def level(x, target):
    e, h = env_db(x); act = e > (e.max() - 30)
    cur = 10 * np.log10(np.mean(10 ** (e[act] / 10)))
    return x * 10 ** ((target - cur) / 20)


def phone_eq(x):
    sos = butter(2, [230, 7200], btype="band", fs=SR, output="sos")
    y = sosfilt(sos, x)
    pres = sosfilt(butter(2, [2200, 4200], btype="band", fs=SR, output="sos"), x)
    return 0.85 * y + 0.25 * pres


def fade(x, a=0.006, b=0.02):
    na, nb = int(a * SR), int(b * SR); x = x.copy()
    x[:na] *= np.linspace(0, 1, na); x[-nb:] *= np.linspace(1, 0, nb); return x


track = np.zeros(int(90 * SR), np.float32)
cursor = 0.0
meta = []
os.makedirs(os.path.join(P, "build", "lines"), exist_ok=True)
for k, (lid, take, spk, gap, tgt, ex) in enumerate(LINES):
    x = trim(load(os.path.join(P, "input", "lines", take + ".mp3")), pad_out=0.02 if ex.get("hard_end") else 0.08)
    if ex.get("max_pause"): x = tighten(x, ex["max_pause"])
    if spk == BOT: x = phone_eq(x)
    x = level(x, tgt)
    x = fade(x, b=0.012 if ex.get("hard_end") else 0.03)
    start = gap if k == 0 else cursor + gap; cursor = start + len(x) / SR
    i = int(start * SR); track[i:i + len(x)] += x[: len(track) - i]
    clip = os.path.join(P, "build", "lines", lid + ".wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", clip], input=x.astype(np.float32).tobytes(), check=True)
    meta.append({"id": lid, "speaker": spk, "take": take, "start": round(start, 3), "end": round(start + len(x) / SR, 3), "text": TEXT[lid], "clip": f"build/lines/{lid}.wav"})
    print(f"{lid:3s} {spk:8s} {start:6.2f} -> {start + len(x) / SR:6.2f}  {TEXT[lid]}")
for a, b in zip(meta, meta[1:]):
    if b["start"] < a["end"]: print("OVERLAP", a["id"], b["id"], a["end"], b["start"])
total = round(cursor + HOLD_END + BLACK, 2); track = track[: int(total * SR)]
pk = np.abs(track).max(); track *= min(1.0, 0.89 / pk)
os.makedirs(os.path.join(P, "timeline"), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", os.path.join(P, "input", "dialogue.wav")], input=track.tobytes(), check=True)
json.dump({"duration": total, "cut_to_black": round(cursor + HOLD_END, 2), "lines": meta}, open(os.path.join(P, "timeline", "lines.json"), "w"), indent=1)
print("wrote input/dialogue.wav", total, "s")
