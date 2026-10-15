#!/usr/bin/env python3
"""transcribe.py - turn a call recording into a timestamped transcript, on this machine.

The interview skill asks the user for the recording after every call, then runs
this script. It uses faster-whisper (a local speech-to-text model) if it is
installed: model small.en, int8, beam size 5, with voice activity detection so
silence is skipped. Nothing is uploaded anywhere.

The transcript is plain text, one line per ~30 seconds of speech:

  [00:00] Thanks for making the time today. Before we start...
  [00:31] Sure. The short version is that I led the design system...

If faster-whisper is not installed, the script prints the install line and a
fallback (ask the user to paste a transcript, or use the phone's own
transcript) and exits 2.

Usage:
  transcribe.py recording.m4a --out applications/acme-senior-product-designer/transcript-2026-10-15-sam-lee.txt
  transcribe.py recording.m4a --out transcript.txt --model base.en

Exit codes: 0 = transcript written, 2 = a problem you can fix (message says what).
Stdlib only, apart from the optional faster-whisper import.
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

log = logging.getLogger(__name__)

DEFAULT_MODEL = "small.en"
GROUP_SECONDS = 30.0

INSTALL_MESSAGE = (
    "faster-whisper is not installed, so I cannot transcribe the recording on this machine.\n"
    "To install it: pip install faster-whisper (the first run downloads the speech model, "
    "a few hundred MB).\n"
    "Fallback: ask the user to paste a transcript, or use the Voice Memos / Notes transcript "
    "on their phone.")


def stamp(seconds: float) -> str:
    """'[mm:ss]' for a time in seconds. Minutes keep counting past 59 ('[75:10]')."""
    total = max(int(seconds), 0)
    return f"[{total // 60:02d}:{total % 60:02d}]"


def group_segments(segments: Iterable[Tuple[float, str]],
                   every: float = GROUP_SECONDS) -> List[Tuple[float, str]]:
    """Join (start, text) segments into blocks that start roughly every `every` seconds."""
    groups: List[Tuple[float, str]] = []
    block_start: Optional[float] = None
    texts: List[str] = []
    for start, text in segments:
        text = " ".join(text.split())
        if not text:
            continue
        if block_start is None:
            block_start = start
        elif start - block_start >= every:
            groups.append((block_start, " ".join(texts)))
            block_start, texts = start, []
        texts.append(text)
    if block_start is not None and texts:
        groups.append((block_start, " ".join(texts)))
    return groups


def format_transcript(groups: List[Tuple[float, str]]) -> str:
    """One '[mm:ss] text' line per block."""
    return "".join(f"{stamp(start)} {text}\n" for start, text in groups)


def transcribe(audio: Path, model_name: str) -> Tuple[List[Tuple[float, str]], float]:
    """Run faster-whisper. Returns ((start, text) segments, audio length in seconds).

    Raises ImportError if faster-whisper is not installed.
    """
    from faster_whisper import WhisperModel

    model = WhisperModel(model_name, compute_type="int8")
    segments, info = model.transcribe(str(audio), beam_size=5, vad_filter=True)
    found = [(float(seg.start), str(seg.text)) for seg in segments]
    return found, float(getattr(info, "duration", 0.0) or 0.0)


def main(argv: List[str]) -> int:
    """Entry point. Returns the exit code."""
    logging.basicConfig(level=logging.WARNING, format="%(message)s")
    parser = argparse.ArgumentParser(
        description="Transcribe a call recording locally with faster-whisper. Writes "
                    "'[mm:ss] text' lines, about one every 30 seconds.",
        epilog="example:\n  transcribe.py recording.m4a --out transcript-2026-10-15-sam-lee.txt",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("audio", type=Path, help="the recording (m4a, mp3, wav, ...)")
    parser.add_argument("--out", type=Path, required=True, help="where to write the transcript")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"faster-whisper model name (default: {DEFAULT_MODEL})")
    args = parser.parse_args(argv)

    if not args.audio.is_file():
        print(f"No audio file at {args.audio}.", file=sys.stderr)
        return 2
    try:
        segments, length = transcribe(args.audio, args.model)
    except ImportError:
        print(INSTALL_MESSAGE, file=sys.stderr)
        return 2
    except Exception as exc:  # faster-whisper raises many types (decode, download, model)
        log.warning("[transcribe] transcribe.main failed for %s: %s", args.audio.name, exc)
        print(f"Could not transcribe {args.audio.name} ({type(exc).__name__}). Check that the "
              "file plays, or ask the user to paste a transcript.", file=sys.stderr)
        return 2

    groups = group_segments(segments)
    if not groups:
        print(f"No speech found in {args.audio.name}. Check that the recording has sound.",
              file=sys.stderr)
        return 2
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(format_transcript(groups), encoding="utf-8")
    print(f"Wrote {args.out} ({len(groups)} lines, {stamp(length)} of audio).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
