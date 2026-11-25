#!/usr/bin/env python3
"""Speak the demo video's narration (scripts/demo-narration.json) with Kokoro, an open text-to-speech model.

Used by scripts/record-demo.mjs, which runs it before recording so that the pictures can wait for the voice.
Each line becomes one WAV file; voice.json records its length and when each sentence starts and ends (for the
subtitles). Lines whose words and voice have not changed are not spoken again.

Needs Python 3.10+ and, once:
    pip install kokoro-onnx soundfile
and the model files kokoro-v1.0.onnx and voices-v1.0.bin from
    https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
in one folder, passed as --model (or in the DEMO_VOICE_MODEL environment variable).

    python scripts/demo-voice.py --narration scripts/demo-narration.json --out <work>/voice --model <folder>
"""

import argparse
import hashlib
import json
import os
import re
import sys

PAUSE = 0.32  # seconds of silence between sentences
SAMPLE_RATE = 24000


ABBREVIATIONS = ("Dr.", "Mr.", "Mrs.", "Ms.", "e.g.", "i.e.", "vs.", "St.")


def sentences(text):
    """Split a line into sentences, keeping their punctuation ("Dr. Firstname" stays together)."""
    out = []
    for part in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'“‘])", text.strip()):
        if out and out[-1].endswith(ABBREVIATIONS):
            out[-1] += " " + part
        elif part.strip():
            out.append(part.strip())
    return out


def spoken(text, pronounce):
    """The words as they are said: listed words are respelled (IVF as "I V F", for example). Write respellings in
    lower case: words in capitals are spelled out letter by letter. ICSI needs none (it is said "ick-see")."""
    for word, say in pronounce.items():
        text = re.sub(rf"(?<![\w-]){re.escape(word)}(?![\w-])", say, text)
    return text


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--narration", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default=os.environ.get("DEMO_VOICE_MODEL", ""))
    args = ap.parse_args()

    with open(args.narration, encoding="utf-8") as f:
        narration = json.load(f)
    voice = narration.get("voice", "af_heart")
    speed = float(narration.get("speed", 1.0))
    lang = narration.get("lang", "en-us")
    pronounce = narration.get("pronounce", {})
    os.makedirs(args.out, exist_ok=True)
    index_path = os.path.join(args.out, "voice.json")
    try:
        with open(index_path, encoding="utf-8") as f:
            previous = json.load(f).get("lines", {})
    except (OSError, ValueError):
        previous = {}

    kokoro = None
    lines = {}
    for line in narration["lines"]:
        text = line["text"].strip()
        said = [spoken(s, pronounce) for s in sentences(text)]
        key = hashlib.sha1(json.dumps([voice, speed, lang, said, PAUSE]).encode()).hexdigest()[:16]
        file = f"{line['id']}.wav"
        old = previous.get(line["id"])
        if old and old.get("hash") == key and os.path.exists(os.path.join(args.out, file)):
            lines[line["id"]] = old
            continue
        if kokoro is None:
            if not args.model or not os.path.isdir(args.model):
                sys.exit("demo-voice: pass --model <folder with kokoro-v1.0.onnx and voices-v1.0.bin> (see the top of this file)")
            import numpy as np
            import soundfile as sf
            from kokoro_onnx import Kokoro

            kokoro = Kokoro(os.path.join(args.model, "kokoro-v1.0.onnx"), os.path.join(args.model, "voices-v1.0.bin"))
        chunks, segments, t = [], [], 0.0
        for i, (shown, say) in enumerate(zip(sentences(text), said)):
            audio, rate = kokoro.create(say, voice=voice, speed=speed, lang=lang)
            if rate != SAMPLE_RATE:
                sys.exit(f"demo-voice: unexpected sample rate {rate}")
            # Trim the model's own leading and trailing silence, so the pauses are ours.
            loud = np.nonzero(np.abs(audio) > 0.01)[0]
            if len(loud):
                audio = audio[max(0, loud[0] - 240) : loud[-1] + 480]
            if i:
                chunks.append(np.zeros(int(PAUSE * SAMPLE_RATE), dtype=np.float32))
                t += PAUSE
            segments.append({"text": shown, "start": round(t, 3), "end": round(t + len(audio) / SAMPLE_RATE, 3)})
            t += len(audio) / SAMPLE_RATE
            chunks.append(audio.astype(np.float32))
        sf.write(os.path.join(args.out, file), np.concatenate(chunks), SAMPLE_RATE, subtype="PCM_16")
        lines[line["id"]] = {"hash": key, "file": file, "duration": round(t, 3), "segments": segments}
        print(f"demo-voice: {line['id']}: {t:.1f} s", flush=True)

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump({"voice": voice, "speed": speed, "lines": lines}, f, indent=1)
    total = sum(l["duration"] for l in lines.values())
    print(f"demo-voice: {len(lines)} lines, {total:.0f} s of speech", flush=True)


if __name__ == "__main__":
    main()
