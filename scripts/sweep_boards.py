#!/usr/bin/env python3
"""sweep_boards.py - sweep many job boards at once and write a dated shortlist.

Reads a boards file (one board per line), pulls every posting from each board
through its public JSON API, and keeps the postings that:

  1. use one of your include words in the title OR the full description
     (whole word, any case, a plural "s" is allowed),
  2. do not have an excluded word in the title (whole word, any case),
  3. are in one of your locations, if you gave any ("Remote" also matches
     postings the board flags as remote),
  4. are not already in the tracker (same company and same posting link, or
     same company and same title).

It writes the shortlist markdown (applications/_research/shortlist-<date>.md)
and a JSON copy next to it (same name, .json). The top of the file states the
rules applied, the boards swept (and which failed, with the error), what the
method cannot see, and how dedupe works.

boards.txt format:
  # comment lines start with #
  greenhouse:anthropic
  ashby:ramp
  lever:palantir

Usage:
  sweep_boards.py --include "design system,product designer" \\
      --exclude-title "Intern,Manager" --locations "Remote,New York"
  sweep_boards.py --hunt-dir ~/job-hunt --boards applications/_research/boards.txt \\
      --tracker job-tracker.xlsx --out applications/_research/shortlist-2026-10-14.md \\
      --include "agent,RAG,LLM" --exclude-title "Senior,Staff,Principal,Manager"

Requests run one at a time with a 0.5 second pause and a 20 second timeout.
A board that fails is reported in the file; it never stops the sweep.

Exit codes: 0 = shortlist written, 2 = a problem you can fix (message says what).
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
import urllib.parse
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Pattern, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fetch_jd import (  # noqa: E402
    FetchError,
    Posting,
    ashby_posting,
    extract_pay,
    extract_sponsorship,
    extract_years,
    format_day,
    greenhouse_posting,
    http_get_json,
    lever_posting,
)
from tracker import TrackerError, TrackerRow, read_rows  # noqa: E402

log = logging.getLogger(__name__)

PAUSE_SECONDS = 0.5
BOARD_KINDS = ("greenhouse", "ashby", "lever")
DEFAULT_BOARDS = "applications/_research/boards.txt"
DEFAULT_TRACKER = "job-tracker.xlsx"

METHOD = ("Each board's public job API, read in full (title and description), "
          "one board at a time.")
BLIND_SPOT = ("Only these boards; roles whose title and description use none of the "
              "include words are invisible; postings behind a login are invisible.")


@dataclass
class Board:
    """One line of boards.txt."""

    spec: str
    kind: str
    slug: str


@dataclass
class BoardResult:
    """What happened when we pulled one board."""

    spec: str
    ok: bool
    postings: int = 0
    error: str = ""


@dataclass
class Candidate:
    """A posting with its keyword hits and, if dropped, the reason."""

    posting: Posting
    board: str
    hits: int
    matched: Dict[str, int]
    title_hit: bool
    reason: str = ""

    def location(self) -> str:
        """All locations in one string, with a remote flag if the board sets one."""
        text = "; ".join(self.posting.locations) or "not stated"
        if self.posting.is_remote and "remote" not in text.lower():
            text += " (remote allowed)"
        return text

    def band(self) -> str:
        """The pay band from the ATS field, else from the text."""
        return self.posting.pay or "; ".join(extract_pay(self.posting.text)) or "not published"

    def why(self) -> str:
        """One line: which include words matched and how often."""
        words = ", ".join(f"{k} ({v})" for k, v in self.matched.items())
        where = "title and description" if self.title_hit else "description"
        noun = "hit" if self.hits == 1 else "hits"
        return f"{self.hits} {noun} in the {where}: {words}"


# ---------------------------------------------------------------- inputs

def split_list(text: Optional[str]) -> List[str]:
    """'a, b,c' -> ['a', 'b', 'c'] (blank items dropped)."""
    return [part.strip() for part in (text or "").split(",") if part.strip()]


def read_boards(path: Path) -> Tuple[List[Board], List[BoardResult]]:
    """Parse boards.txt. Bad lines come back as failed results, not errors."""
    boards: List[Board] = []
    bad: List[BoardResult] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        kind, _, slug = line.partition(":")
        kind, slug = kind.strip().lower(), slug.strip()
        if kind not in BOARD_KINDS or not slug:
            bad.append(BoardResult(spec=line, ok=False,
                                   error="not a board line (use greenhouse:, ashby: or lever:)"))
            continue
        boards.append(Board(spec=f"{kind}:{slug}", kind=kind, slug=slug))
    return boards, bad


def word_pattern(word: str, plural: bool) -> Pattern[str]:
    """Whole-word, any-case pattern; spaces match any whitespace."""
    body = r"\s+".join(re.escape(part) for part in word.split())
    tail = r"(?:s|es)?" if plural else ""
    return re.compile(rf"(?<![A-Za-z0-9]){body}{tail}(?![A-Za-z0-9])", re.IGNORECASE)


# ---------------------------------------------------------------- fetching

def fetch_board(board: Board) -> List[Posting]:
    """Pull every posting on one board."""
    slug = urllib.parse.quote(board.slug)
    if board.kind == "greenhouse":
        data = http_get_json(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true")
        return [greenhouse_posting(job, board.slug) for job in data.get("jobs") or []]
    if board.kind == "ashby":
        data = http_get_json(
            f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true")
        return [ashby_posting(job, board.slug) for job in data.get("jobs") or []
                if job.get("isListed", True)]
    data = http_get_json(f"https://api.lever.co/v0/postings/{slug}?mode=json")
    if not isinstance(data, list):
        raise FetchError("Lever did not return a list of postings.")
    return [lever_posting(job, board.slug) for job in data]


def sweep(boards: List[Board]) -> Tuple[List[Tuple[str, Posting]], List[BoardResult]]:
    """Fetch boards one by one with a pause. A failed board is recorded, not fatal."""
    found: List[Tuple[str, Posting]] = []
    results: List[BoardResult] = []
    for i, board in enumerate(boards):
        if i:
            time.sleep(PAUSE_SECONDS)
        try:
            postings = fetch_board(board)
        except FetchError as exc:
            if exc.code == 404:
                reason = "HTTP 404: no board with that name (check the slug in the board's link)"
            elif exc.code:
                reason = f"HTTP {exc.code}: {exc}"
            else:
                reason = str(exc)
            log.warning("[sweep] %s failed (%s); going on with the other boards",
                        board.spec, f"HTTP {exc.code}" if exc.code else "no answer")
            results.append(BoardResult(spec=board.spec, ok=False, error=reason))
            continue
        results.append(BoardResult(spec=board.spec, ok=True, postings=len(postings)))
        found.extend((board.spec, p) for p in postings)
    return found, results


# ---------------------------------------------------------------- dedupe

def norm_company(name: str) -> str:
    """Compare companies loosely: 'HappyRobot', 'happyrobot.ai', 'Happyrobot Inc.' match."""
    low = re.sub(r"\.(?:ai|io|com|co|dev|app|so)\b", "", name.lower())
    low = re.sub(r"[^a-z0-9]", "", low)
    return re.sub(r"(?:inc|llc|ltd|corp|corporation)$", "", low)


def same_company(a: str, b: str) -> bool:
    """Equal, or one starts with the other ('palantir' and 'palantirtechnologies').

    Loose on purpose: a company match alone never drops a posting; the link or
    the title must match too.
    """
    if not a or not b:
        return False
    short, long_ = sorted((a, b), key=len)
    return short == long_ or (len(short) >= 4 and long_.startswith(short))


def norm_title(title: str) -> str:
    """Lowercase words only, single spaces."""
    return " ".join(re.findall(r"[a-z0-9]+", title.lower()))


def norm_url(url: str) -> str:
    """Drop scheme, www, query, fragment and trailing slash."""
    parts = urllib.parse.urlsplit(url.strip().lower())
    host = parts.netloc[4:] if parts.netloc.startswith("www.") else parts.netloc
    return f"{host}{parts.path}".rstrip("/")


def posting_keys(posting: Posting) -> List[str]:
    """Strings that identify a posting: its links and its job id."""
    keys = [norm_url(u) for u in (posting.url, posting.apply_url) if u]
    last = [s for s in urllib.parse.urlsplit(posting.url).path.split("/") if s]
    if last and len(last[-1]) >= 6 and last[-1] not in ("apply", "application"):
        keys.append(last[-1].lower())
    return [k for k in keys if k]


@dataclass
class TrackerIndex:
    """Tracker rows prepared for dedupe."""

    path: Optional[Path]
    rows: List[TrackerRow] = field(default_factory=list)
    blobs: Dict[int, str] = field(default_factory=dict)
    note: str = ""

    def match(self, posting: Posting) -> Optional[TrackerRow]:
        """The tracker row this posting duplicates, if any."""
        company = norm_company(posting.company)
        title = norm_title(posting.title)
        keys = posting_keys(posting)
        for row in self.rows:
            if not same_company(norm_company(row.company), company):
                continue
            if norm_title(row.role) == title:
                return row
            blob = self.blobs.get(row.number, "")
            if any(key in blob for key in keys):
                return row
        return None


def load_tracker(path: Path, hunt_dir: Path) -> TrackerIndex:
    """Read the tracker through tracker.py. Missing or unreadable means no dedupe."""
    if not path.exists() and not path.with_suffix(".csv").exists():
        return TrackerIndex(path=None, note=f"no tracker found at {path}, so nothing was deduped")
    try:
        rows = read_rows(path)
    except TrackerError as exc:
        log.warning("[sweep] could not read the tracker (%s); no dedupe this run", exc)
        return TrackerIndex(path=None, note=f"could not read the tracker ({exc}), so nothing was deduped")
    index = TrackerIndex(path=path, rows=rows)
    root = hunt_dir.resolve()
    for row in rows:
        blob = " ".join([row.notes, row.package, row.next_action]).lower()
        package = row.package.strip()
        if package and package != "-":
            jd = (root / package / "JD.md").resolve()
            if jd.is_relative_to(root) and jd.is_file():
                blob += " " + jd.read_text(encoding="utf-8", errors="replace").lower()
        index.blobs[row.number] = blob
    return index


# ---------------------------------------------------------------- filtering

def screen(found: List[Tuple[str, Posting]], include: List[str], exclude: List[str],
           locations: List[str], tracker: TrackerIndex) -> Tuple[List[Candidate], List[Candidate], int]:
    """Split postings into kept, skipped (with reason) and a count of no-match postings."""
    inc = [(word, word_pattern(word, plural=True)) for word in include]
    exc = [(word, word_pattern(word, plural=False)) for word in exclude]
    kept: List[Candidate] = []
    skipped: List[Candidate] = []
    no_match = 0
    for board, posting in found:
        matched: Dict[str, int] = {}
        title_hit = False
        for word, pattern in inc:
            in_title = len(pattern.findall(posting.title))
            count = in_title + len(pattern.findall(posting.text))
            if count:
                matched[word] = count
            title_hit = title_hit or in_title > 0
        if not matched:
            no_match += 1
            continue
        cand = Candidate(posting=posting, board=board, hits=sum(matched.values()),
                         matched=matched, title_hit=title_hit)
        bad_word = next((word for word, pattern in exc if pattern.search(posting.title)), None)
        if bad_word:
            cand.reason = f'title has "{bad_word}"'
        elif locations and not location_ok(posting, locations):
            cand.reason = "location not in your list"
        else:
            dup = tracker.match(posting)
            if dup is not None:
                cand.reason = f"already in the tracker (row {dup.number}, {dup.status})"
        (skipped if cand.reason else kept).append(cand)
    order = lambda c: (-c.hits, c.posting.company.lower(), c.posting.title.lower())  # noqa: E731
    kept.sort(key=order)
    skipped.sort(key=order)
    return kept, skipped, no_match


def location_ok(posting: Posting, locations: List[str]) -> bool:
    """True if any wanted location is in the posting's locations (or remote matches the flag)."""
    where = " ".join(posting.locations).lower()
    for wanted in locations:
        low = wanted.lower()
        if low in where or (low == "remote" and posting.is_remote):
            return True
    return False


# ---------------------------------------------------------------- output

def cell(text: str, limit: int = 0) -> str:
    """Make text safe for one markdown table cell."""
    text = " ".join(str(text).split()).replace("|", "\\|")
    if limit and len(text) > limit:
        text = text[: limit - 3].rstrip() + "..."
    return text


def sponsorship_line(posting: Posting) -> str:
    """The posting's first sponsorship sentence in quotes, or 'not stated'."""
    hits = extract_sponsorship(posting.text)
    return f'"{hits[0]}"' if hits else "not stated"


def candidate_row(c: Candidate) -> str:
    """One shortlist table row."""
    p = c.posting
    role = f"[{cell(p.title)}]({p.url})" if p.url else cell(p.title)
    return (f"| {cell(p.company)} | {role} | {cell(c.location(), 80)} | {cell(c.band(), 60)} | "
            f"{cell(extract_years(p.text) or 'not stated')} | {cell(sponsorship_line(p), 140)} | "
            f"{cell(c.why())} |")


def render_markdown(day: date, include: List[str], exclude: List[str], locations: List[str],
                    results: List[BoardResult], tracker: TrackerIndex, tracker_label: str,
                    kept: List[Candidate], skipped: List[Candidate], no_match: int) -> str:
    """Write the shortlist file text."""
    header = "| Company | Role | Location | Band | Bar | Sponsorship | Why |\n|---|---|---|---|---|---|---|"
    tier1 = [c for c in kept if c.title_hit]
    tier2 = [c for c in kept if not c.title_hit]
    if tracker.path is not None:
        dedupe = (f"against {tracker_label} ({len(tracker.rows)} rows). A posting is dropped when "
                  "its company matches a tracker row (same name, or one name starts with the "
                  "other) AND either its link or job id appears in that row's notes, package or "
                  "JD.md, or its title matches the row's role.")
    else:
        dedupe = tracker.note + "."
    lines = [
        f"# Shortlist - {format_day(day)}",
        "",
        f"Made by `scripts/sweep_boards.py` on {format_day(day)}. Every row is a live posting "
        "that is not in the tracker yet. Read the JD before you apply; nothing here is checked "
        "against your rules beyond what is listed below.",
        "",
        "## Rules applied",
        "",
        "- **Include words** (title or full description; whole word; any case; plural s allowed): "
        + (", ".join(include) or "none"),
        "- **Title exclusions** (whole word; any case; \"Intern\" does not drop \"Internship\"): "
        + (", ".join(exclude) or "none"),
        "- **Locations kept:** " + (", ".join(locations) + ' ("Remote" also matches the board\'s '
                                    'remote flag)' if locations else "any (no location rule given)"),
        "",
        "## Boards swept",
        "",
        "| Board | Postings read | Result |",
        "|---|---|---|",
    ]
    for r in results:
        lines.append(f"| {cell(r.spec)} | {r.postings if r.ok else '-'} | "
                     f"{'loaded' if r.ok else 'failed: ' + cell(r.error)} |")
    lines += [
        "",
        f"**Method:** {METHOD}",
        f"**Blind spot:** {BLIND_SPOT}",
        f"**Dedupe:** {dedupe}",
        "",
        f"## Tier 1 - an include word is in the title ({len(tier1)})",
        "",
    ]
    lines += [header] + [candidate_row(c) for c in tier1] if tier1 else ["None."]
    lines += ["", f"## Tier 2 - include words only in the description ({len(tier2)})", ""]
    lines += [header] + [candidate_row(c) for c in tier2] if tier2 else ["None."]
    lines += ["", f"## Skipped and why ({len(skipped)})", ""]
    if skipped:
        lines += ["| Company | Role | Why skipped |", "|---|---|---|"]
        for c in skipped:
            role = f"[{cell(c.posting.title)}]({c.posting.url})" if c.posting.url else cell(c.posting.title)
            lines.append(f"| {cell(c.posting.company)} | {role} | {cell(c.reason)} |")
    else:
        lines.append("Nothing that matched an include word was skipped.")
    lines += ["", f"Also not listed: {no_match} postings used none of the include words.", ""]
    return "\n".join(lines)


def candidate_json(c: Candidate, tier: Optional[int]) -> Dict[str, Any]:
    """The JSON copy of one candidate."""
    p = c.posting
    item: Dict[str, Any] = {
        "company": p.company, "title": p.title, "url": p.url, "apply_url": p.apply_url,
        "board": c.board, "location": c.location(), "remote": p.is_remote, "band": c.band(),
        "bar": extract_years(p.text), "sponsorship": extract_sponsorship(p.text),
        "posted": p.posted.isoformat() if p.posted else None,
        "hits": c.hits, "matched": c.matched,
    }
    if tier is not None:
        item["tier"] = tier
    if c.reason:
        item["reason"] = c.reason
    return item


def render_json(day: date, include: List[str], exclude: List[str], locations: List[str],
                results: List[BoardResult], tracker: TrackerIndex, tracker_label: str,
                kept: List[Candidate], skipped: List[Candidate], no_match: int) -> str:
    """Write the JSON sidecar text."""
    data = {
        "date": day.isoformat(),
        "made_by": "scripts/sweep_boards.py",
        "rules": {"include": include, "exclude_title": exclude, "locations": locations},
        "boards": [{"board": r.spec, "ok": r.ok, "postings": r.postings, "error": r.error or None}
                   for r in results],
        "method": METHOD,
        "blind_spot": BLIND_SPOT,
        "tracker": ({"file": tracker_label, "rows": len(tracker.rows)}
                    if tracker.path is not None else None),
        "shortlist": [candidate_json(c, 1 if c.title_hit else 2) for c in kept],
        "skipped": [candidate_json(c, None) for c in skipped],
        "no_include_match": no_match,
    }
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def main(argv: List[str]) -> int:
    """Entry point. Returns the exit code."""
    logging.basicConfig(level=logging.WARNING, format="%(message)s")
    parser = argparse.ArgumentParser(
        description="Sweep Greenhouse, Ashby and Lever boards through their public APIs, "
                    "match your words in the description (not just the title), dedupe "
                    "against the tracker, and write a dated shortlist.",
        epilog="example:\n  sweep_boards.py --include \"design system,product designer\" "
               "--exclude-title \"Intern,Manager\" --locations \"Remote,New York\"",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--hunt-dir", default=".", type=Path,
                        help="the hunt folder; relative paths start here (default: .)")
    parser.add_argument("--boards", default=DEFAULT_BOARDS,
                        help=f"boards file (default: {DEFAULT_BOARDS})")
    parser.add_argument("--include", required=True,
                        help="comma list of words to find in the title or description")
    parser.add_argument("--exclude-title", default="",
                        help="comma list of whole words that drop a posting by its title")
    parser.add_argument("--locations", default="",
                        help="comma list; keep postings whose location contains one of these")
    parser.add_argument("--tracker", default=DEFAULT_TRACKER,
                        help=f"tracker to dedupe against (default: {DEFAULT_TRACKER})")
    parser.add_argument("--out", help="shortlist path (default: "
                                      "applications/_research/shortlist-<date>.md)")
    parser.add_argument("--date", help="date for the file, YYYY-MM-DD (default: today)")
    args = parser.parse_args(argv)

    try:
        day = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else date.today()
    except ValueError:
        print(f"--date must look like 2026-10-14, not '{args.date}'.", file=sys.stderr)
        return 2
    include, exclude, locations = (split_list(args.include), split_list(args.exclude_title),
                                   split_list(args.locations))
    if not include:
        print("--include needs at least one word, e.g. --include \"product designer\".",
              file=sys.stderr)
        return 2

    hunt = args.hunt_dir
    boards_path = Path(args.boards) if Path(args.boards).is_absolute() else hunt / args.boards
    if not boards_path.is_file():
        print(f"No boards file at {boards_path}. Make one with lines like greenhouse:acme.",
              file=sys.stderr)
        return 2
    boards, bad = read_boards(boards_path)
    if not boards:
        print(f"{boards_path} has no board lines. Add lines like greenhouse:acme.", file=sys.stderr)
        return 2
    tracker_path = Path(args.tracker) if Path(args.tracker).is_absolute() else hunt / args.tracker
    tracker = load_tracker(tracker_path, hunt)

    found, results = sweep(boards)
    results = bad + results
    kept, skipped, no_match = screen(found, include, exclude, locations, tracker)

    out = Path(args.out) if args.out else Path(f"applications/_research/shortlist-{day.isoformat()}.md")
    if not out.is_absolute():
        out = hunt / out
    out.parent.mkdir(parents=True, exist_ok=True)
    pieces = (day, include, exclude, locations, results, tracker, args.tracker,
              kept, skipped, no_match)
    out.write_text(render_markdown(*pieces), encoding="utf-8")
    sidecar = out.with_suffix(".json")
    sidecar.write_text(render_json(*pieces), encoding="utf-8")

    loaded = [r for r in results if r.ok]
    failed = [r for r in results if not r.ok]
    tier1 = sum(1 for c in kept if c.title_hit)
    print(f"Swept {len(results)} board(s): {len(loaded)} loaded, {len(failed)} failed. "
          f"{len(found)} postings read.")
    for r in failed:
        print(f"  Failed: {r.spec}: {r.error}")
    print(f"Shortlist: {len(kept)} (Tier 1: {tier1}, Tier 2: {len(kept) - tier1}). "
          f"Skipped: {len(skipped)}. No include word: {no_match}.")
    if tracker.path is None:
        print(f"Note: {tracker.note}.")
    print(f"Wrote {out}")
    print(f"Wrote {sidecar}")
    if not loaded:
        print("No board loaded. Check the board names in the boards file and your connection.",
              file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
