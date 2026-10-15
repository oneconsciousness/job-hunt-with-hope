#!/usr/bin/env python3
"""make_ics.py - write a one-event calendar file (.ics) the user can double-click.

Hope uses this when the agent has no calendar tool. The interview skill uses it
for the "record the call" reminder: an event 10 minutes before the call, 10
minutes long, marked free, with pop-up alarms at 10 and 0 minutes.

The file has one VEVENT with UID, DTSTAMP, DTSTART (local "floating" time, so
it shows at that clock time wherever the user is), DURATION, SUMMARY,
DESCRIPTION and one VALARM per --alarm. Text is escaped and long lines are
folded at 75 octets, as RFC 5545 asks. No attendees, so no invites go out.

Usage:
  make_ics.py --title "🔴 RECORD THE CALL - Acme / Sam Lee in 10 min" \\
      --start 2026-10-15T12:50 --minutes 10 --alarm 10 --alarm 0 --free \\
      --description "Start the recording before you join." --out reminder.ics
  make_ics.py --title "Prep: Acme round 2" --start 2026-10-15T09:00 --minutes 45 \\
      --description-file applications/acme-senior-product-designer/INTERVIEW-PREP.md \\
      --out prep.ics

Without --out the file text is printed to the screen.
Exit codes: 0 = written, 2 = a problem you can fix (message says what).
Stdlib only.
"""
from __future__ import annotations

import argparse
import logging
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

log = logging.getLogger(__name__)

LINE_LIMIT = 75  # octets per line, not counting CRLF (RFC 5545 section 3.1)
START_FORMATS = ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S")


def escape_text(text: str) -> str:
    """Escape a TEXT value: backslash, semicolon, comma, and newlines as \\n."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
    return text.replace("\n", "\\n")


def fold(line: str) -> str:
    """Fold a content line so no physical line is over 75 octets.

    Continuation lines start with one space, which counts toward their 75.
    A multi-byte character is never split.
    """
    if len(line.encode("utf-8")) <= LINE_LIMIT:
        return line
    pieces: List[str] = []
    current = ""
    size = 0
    for ch in line:
        width = len(ch.encode("utf-8"))
        if size + width > LINE_LIMIT:
            pieces.append(current)
            current, size = " ", 1
        current += ch
        size += width
    pieces.append(current)
    return "\r\n".join(pieces)


def duration(minutes: int) -> str:
    """ISO 8601 duration for DURATION: 10 -> PT10M, 90 -> PT1H30M, 60 -> PT1H."""
    hours, mins = divmod(minutes, 60)
    if hours and mins:
        return f"PT{hours}H{mins}M"
    if hours:
        return f"PT{hours}H"
    return f"PT{mins}M"


def trigger(minutes: int) -> str:
    """Alarm trigger N minutes before the start; 0 means at the start."""
    return "PT0M" if minutes == 0 else f"-PT{minutes}M"


def parse_start(text: str) -> Optional[datetime]:
    """Read --start like 2026-10-15T12:50. Returns None if it does not parse."""
    for fmt in START_FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt)
        except ValueError:
            continue
    return None


def build_calendar(title: str, start: datetime, minutes: int, description: str,
                   alarms: List[int], free: bool, uid: Optional[str] = None,
                   stamp: Optional[datetime] = None) -> str:
    """Return the full .ics text with CRLF line endings."""
    stamp = stamp or datetime.now(timezone.utc)
    summary = escape_text(title)
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hope//make_ics.py//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid or str(uuid.uuid4()) + '@hope'}",
        f"DTSTAMP:{stamp.strftime('%Y%m%dT%H%M%SZ')}",
        f"DTSTART:{start.strftime('%Y%m%dT%H%M%S')}",
        f"DURATION:{duration(minutes)}",
        f"SUMMARY:{summary}",
    ]
    if description:
        lines.append(f"DESCRIPTION:{escape_text(description)}")
    if free:
        lines.append("TRANSP:TRANSPARENT")
    for minutes_before in alarms:
        lines += [
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            f"DESCRIPTION:{summary}",
            f"TRIGGER:{trigger(minutes_before)}",
            "END:VALARM",
        ]
    lines += ["END:VEVENT", "END:VCALENDAR"]
    return "\r\n".join(fold(line) for line in lines) + "\r\n"


def main(argv: List[str]) -> int:
    """Entry point. Returns the exit code."""
    logging.basicConfig(level=logging.WARNING, format="%(message)s")
    parser = argparse.ArgumentParser(
        description="Write a one-event .ics file with alarms. Open the file to add the "
                    "event to any calendar.",
        epilog="example:\n  make_ics.py --title \"🔴 RECORD THE CALL - Acme / Sam Lee in 10 min\" "
               "--start 2026-10-15T12:50 --minutes 10 --alarm 10 --alarm 0 --free "
               "--description \"Start the recording before you join.\" --out reminder.ics",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--title", required=True, help="the event title")
    parser.add_argument("--start", required=True,
                        help="local start time, e.g. 2026-10-15T12:50 (no time zone)")
    parser.add_argument("--minutes", type=int, default=30,
                        help="length in minutes (default: 30)")
    parser.add_argument("--alarm", type=int, action="append", default=[],
                        help="pop-up N minutes before the start; repeat for more; 0 = at the start")
    text = parser.add_mutually_exclusive_group()
    text.add_argument("--description", default="", help="the event notes")
    text.add_argument("--description-file", type=Path, help="read the event notes from a file")
    parser.add_argument("--free", action="store_true",
                        help="show the time as free, not busy")
    parser.add_argument("--out", type=Path, help="where to write the .ics (default: print it)")
    args = parser.parse_args(argv)

    start = parse_start(args.start)
    if start is None:
        print(f"--start must look like 2026-10-15T12:50, not '{args.start}'.", file=sys.stderr)
        return 2
    if args.minutes <= 0:
        print("--minutes must be more than 0.", file=sys.stderr)
        return 2
    if any(a < 0 for a in args.alarm):
        print("--alarm takes minutes before the start, so 0 or more.", file=sys.stderr)
        return 2
    description = args.description
    if args.description_file:
        if not args.description_file.is_file():
            print(f"No file at {args.description_file}.", file=sys.stderr)
            return 2
        description = args.description_file.read_text(encoding="utf-8")

    calendar = build_calendar(args.title, start, args.minutes, description.strip(),
                              args.alarm, args.free)
    if args.out is None:
        sys.stdout.write(calendar)
        return 0
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="") as f:
        f.write(calendar)
    print(f"Wrote {args.out}. Open it to add the event to your calendar.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
