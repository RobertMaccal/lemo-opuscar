@AGENTS.md

## Narration settings (this user's films)

These settings override the voice parts of AGENTS.md, DIRECTOR.md and TECHNIQUE.md §4 (Kokoro / edge-tts) for every film made here. Everything else in the Lemo-Opuscar guides stays as written.

```
DEFAULT_NARRATION_PROVIDER: ElevenLabs
DEFAULT_NARRATOR: Spuds Oxley - Grandpa
DEFAULT_VOICE_ID: NOpBlnGInO9m6vDvFkFC
DEFAULT_LANGUAGE: English
VOICE_CONSISTENCY: Mandatory
VOICE_SUBSTITUTION: Requires user approval
DEFAULT_TTS_MODEL: eleven_v4
```

- The Voice ID was read from the user's connected ElevenLabs account with `creative_list_voices` (search "Spuds Oxley"); it is a library voice (professional, American, old, male). Never invent or change it. Before each film, confirm with `creative_list_voices` that it is still accessible; if it is not, stop and tell the user (they add it again from the ElevenLabs Voice Library: search "Spuds Oxley", "Add to my voices").
- **Narration goes through the connected ElevenLabs MCP tools only** (`creative_generate_speech`). Do not use Kokoro (`core/tts/tts.py`), edge-tts (`core/tts/tts_zh.py`) or any Bing/Microsoft TTS as a substitute, and do not switch to another voice or another narrator for emotion or character. Any change of voice needs the user's explicit approval first.
- Credentials: the ElevenLabs connector handles authentication. Never write API keys, tokens or signed URLs into the repository.

### Performance

Use `eleven_v4` with inline audio tags (one tag holds until the next; change tags only where the delivery changes; describe how the line is spoken, not stage actions). Pace with punctuation, `…`, `—`, `[pause]` / `[long pause]`, and sparing CAPITALS for emphasis. Leave `voice_settings` at their defaults unless the user asks; if takes drift from the voice's identity, raise `stability` (≈0.6–0.7) and `similarity` (≈0.85) rather than changing the voice.

| Scene | Delivery |
|---|---|
| Suspense | `[cautiously]`, `[softly]`, `[pause]` / `[long pause]` before the reveal, CAPITALS on one key word |
| Science / explainer | `[curious]`, `[excited]`, `[warmly]`; conversational, short sentences |
| Comedy | deadpan line, `[short pause]`, then `[chuckles]` / `[mischievously]`; never stack laughs |
| Emotional | `[gently]`, `[softly]`, `[warmly]`; slower punctuation, no shouting |

Keep it natural: at most one or two tags per sentence, no exaggerated effects.

### Pipeline (replaces TECHNIQUE.md §4 "Voice")

1. Write `voices/lines.json` in the project folder: `[{id, text, el_prompt}]`. `text` is the plain spoken words (for subtitles and the speech check); `el_prompt` is the same words with audio tags.
2. One `creative_generate_speech` call per line (or per paragraph for flow), `voice_id` `NOpBlnGInO9m6vDvFkFC`, `model_id` `eleven_v4`, language English unless the user asks for another. Use one flow per film (`creative_create_flow` first). Credits are spent per call: price long scripts with `estimate_only` and get the user's OK before spending a lot; never re-call to retry.
3. Poll `creative_get_flow_run_status`; download the chosen take's audio URL with `curl` into `voices/src/<id>.<ext>`.
4. Convert to the library's format: `ffmpeg -i voices/src/<id>.mp3 -ar 48000 -ac 1 -c:a pcm_s24le voices/<id>.wav`; write `voices/dur.json` (`{id: seconds}`, from `ffprobe`), the same format `tts.py` writes.
5. Check and time: `.venv/bin/python core/tts/asr_check.py voices/lines.json voices --lang en` (Whisper, local) must exit 0; its `words.json` gives the word timestamps for subtitles and cue placement.
6. Build the timeline from the real durations in `dur.json` (never from estimates), keep natural pauses, and place subtitles from `words.json`.
7. Mix as usual (TECHNIQUE.md §6): compress the voice, keep it ~10 dB above music, duck music under narration, SFX on `window.EV` times, `limit()` before writing; `mux.sh` then masters to −14 LUFS, −1.2 dBTP. Check no clipping (peak < 0 dBFS in `mix.wav`).
8. `CREDITS`: "Narration: ElevenLabs text-to-speech, voice “Spuds Oxley - Grandpa” (ElevenLabs Voice Library)".

### Output defaults

1080×1920 (9:16) Instagram Reels / YouTube Shorts: `--size 1080x1920` on every render tool, `--fps 30` unless the style's `STYLE.md` sets a rate, mux with `LEMO_COLOR=bt709` and grain 0 unless the style needs grain. Send the finished MP4 to the user with the file-send tool (`/films/` is git-ignored and the cloud VM is temporary).
