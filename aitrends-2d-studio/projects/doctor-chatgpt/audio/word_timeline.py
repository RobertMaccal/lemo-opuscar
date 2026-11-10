"""Word timings for every placed line (Whisper on each clip, offset to the line start) -> timeline/words.json.
Each word carries its speaker and line id so lip-sync and subtitles know who is talking.
Whisper's spellings of the brand name vary, so the scripted text is mapped back onto the timed words."""
import json, os, re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(P, "..", "..", "tools"))
from common import sentences_from_words, write_timeline
L = json.load(open(os.path.join(P, "timeline", "lines.json")))
m = WhisperModel("small", device="cpu", compute_type="int8")
words = []
for ln in L["lines"]:
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(P, ln["clip"]), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(a, language="en", word_timestamps=True)
    ws = []
    for w in (w for s in segs for w in s.words):   # rejoin split contractions ("I" + "'VE")
        if ws and (w.word.strip().startswith("'") or (ws[-1][0].lower() == 'chat' and w.word.strip().upper().startswith('GPT'))): ws[-1] = [ws[-1][0] + w.word.strip(), ws[-1][1], w.end]
        else: ws.append([w.word.strip(), w.start, w.end])
    script = ln["text"].replace("—", "— ").replace("...", "... ").split()
    if len(script) != len(ws): print("count mismatch", ln["id"], len(script), len(ws), [w[0] for w in ws])
    dur = len(a) / 16000
    for i, (wt, ws0, we0) in enumerate(ws):
        txt = script[i] if len(script) == len(ws) else wt
        words.append({"word": txt, "start": round(ln["start"] + ws0, 3), "end": round(ln["start"] + min(we0, dur), 3), "speaker": ln["speaker"], "line": ln["id"]})
# a word window never spans a long pause (keeps lip-sync closed during hesitations)
for w in words:
    w["end"] = round(min(w["end"], w["start"] + 0.2 + 0.075 * len(w["word"])), 3)
write_timeline(os.path.join(P, "timeline"), words, sentences_from_words(words), "elevenlabs-lines+whisper")
