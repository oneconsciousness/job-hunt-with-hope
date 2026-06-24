#!/usr/bin/env python3
"""verify_portfolio_structure.py — sequence, placement & SEO gate for Hope portfolios.

The PDF checker (verify_portfolio_pdf.py) proves a portfolio *renders*; this
one proves it's *assembled right*.

**v2 — HEADLESS-RENDER MODE (spec §F, BLOCKING).** The portfolio body is now
JS-rendered from `window.HOPE_DATA` (spec §B): `index.html` ships an empty
skeleton, and `portfolio.js` builds every `.section-pane` and `id="tl-*"` card
at load. The v1 verifier regexed `data-pane`/`tl-` out of the RAW `index.html`
string — which after this change is empty → every agreement/containment/order
check finds an empty card set and PASSES VACUOUSLY (false PASS). A gate that
can't see the artifact is worse than a failing gate.

So this verifier now **loads shell + data.js + portfolio.js in headless Chrome,
dumps the RENDERED DOM, and asserts against THAT** — validating the renderer,
not just the data. It reuses verify_portfolio_pdf.py's harness verbatim:
`--headless --dump-dom --virtual-time-budget=10000` driven under a watchdog
that polls the dumped DOM until `</html>` lands, then terminates Chrome (pages
with animation loops never self-exit).

Invariants asserted on the RENDERED DOM:

  * AGREEMENT    every `timeline[].id` with `pane:X` has a matching card
                 `id="tl-{id}"` rendered from array X (join key = `pane`
                 PLURAL, never `type` singular — spec §A.10), and every
                 rendered `tl-` card has a timeline entry — no dead rail
                 clicks, no orphan cards.
  * CONTAINMENT  each card physically sits inside the `.section-pane` its
                 timeline entry names (an experience card never nested in
                 the projects pane).
  * ORDER        within each pane, cards run reverse-chronological
                 (newest first) — what recruiters expect.
  * GATES        `overview.show` ⇔ `#pane-overview` present;
                 `social.length>0` ⇔ `#pane-social` present.
  * DIRECT-CHILD `.wrap > .section-pane`, `.identity-card > .identity-row`,
                 `.identity-card > #throughline` (spec §B.2 / §C.7 — wrapper
                 divs silently break the ≥1440px rail layout).
  * HEAD↔DATA    head `<title>`/`og:title`/`og:description`/`canonical`/
                 `hope:share-url` and the `.seo-fallback` text MATCH
                 `data.js` `meta.*` (catches the `sonnet-4-6`≠`opus-4-8`
                 drift class — spec §F.4).
  * SEO PRESENT  `index.html` CONTAINS `<link rel="canonical">`,
                 `<meta name="description">`, `og:title/description/type`,
                 `twitter:card`, and JSON-LD with non-placeholder
                 `description`/`url`/`sameAs` (presence, not absence-of-token).

`window.HOPE_DATA` is parsed with node (the only reliable reader of JS-literal
syntax); a stdlib JSON fallback covers a generated data.js whose arrays are
valid JSON when node is absent.

**Data-only fallback (Chrome absent):** structural checks fall back to parsing
the RAW index.html, exactly as v1 did — but the run is LOUDLY marked
"renderer NOT validated" (a WARN on every structural section + the banner), and
it MUST NOT be treated as the authoritative gate. The spec mandates the
headless mode; this fallback exists only so an environment without Chrome can
still sanity-check the data, never as the sole gate.

Usage:
  scripts/verify_portfolio_structure.py [portfolio-folder | .../index.html] \
      [--chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"] \
      [--data-only] [--keep]

Default subject: assets/fixtures/persona-jane-doe/sample-portfolio/

Exit code: 0 = all invariants hold, 1 = at least one FAIL,
2 = environment/usage error (folder/data/index.html unreadable, or
--data-only NOT requested but Chrome is missing — fail loud, don't silently
downgrade the authoritative gate).
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

REPO = Path(__file__).resolve().parent.parent
SUBJECT_DEFAULT = (REPO / "assets" / "fixtures" / "persona-jane-doe" / "sample-portfolio")

CHROME_DEFAULT = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Panes that hold dated cards. "overview" (stat-only), "skills" (chips) and
# "social" (feed) are real panes but carry no tl- cards, so they're excluded
# from order/containment-by-date.
CARD_PANES = ("experience", "projects", "education", "certifications")

# Join key = pane PLURAL (spec §A.10). The plural pane names a timeline entry
# may carry; the verifier never keys off the singular `type`.
KNOWN_PANES = ("overview", "experience", "skills", "education", "certifications", "projects", "social")


# ── Result plumbing (mirrors verify_portfolio_pdf.py) ────────────────────────
@dataclass
class Check:
    section: str
    name: str
    status: str  # PASS | FAIL | WARN | INFO
    detail: str


@dataclass
class Report:
    checks: list[Check] = field(default_factory=list)

    def add(self, section: str, name: str, status: str, detail: str) -> None:
        self.checks.append(Check(section, name, status, detail))

    @property
    def hard_failures(self) -> list[Check]:
        return [c for c in self.checks if c.status == "FAIL"]


# ── Subject resolution ───────────────────────────────────────────────────────
def resolve_folder(subject: Path) -> Path:
    """Accept a portfolio folder (containing index.html) or its index.html."""
    if subject.is_dir():
        if not (subject / "index.html").is_file():
            raise FileNotFoundError(f"folder has no index.html: {subject}")
        return subject
    if subject.is_file():
        if (subject.parent / "index.html").is_file():
            return subject.parent
        raise FileNotFoundError(f"not a portfolio folder/index.html: {subject}")
    raise FileNotFoundError(f"subject not found: {subject}")


# ── HOPE_DATA parse — node first (handles JS literal), JSON fallback ──────────
def data_files(folder: Path) -> list[Path]:
    """The script(s) that define window.HOPE_DATA. A generated portfolio ships
    one data.js; the multi-persona sample sets HOPE_DATA inside data/<default>.js
    and registers the rest into HOPE_PERSONAS — load every data/ script so the
    default persona's HOPE_DATA is present."""
    if (folder / "data.js").is_file():
        return [folder / "data.js"]
    return sorted((folder / "data").glob("*.js")) if (folder / "data").is_dir() else []


def load_data_node(files: list[Path]) -> dict:
    """Parse window.HOPE_DATA with node — the only reliable reader of JS-literal
    syntax (unquoted keys, single quotes, trailing commas). Returns the SUBSET
    of HOPE_DATA the verifier needs (timeline + the gate/meta keys), JSON-safe."""
    js = (
        "globalThis.window = {};"
        "const p = require('path');"
        "for (const f of " + json.dumps([str(f) for f in files]) + ") { try { require(p.resolve(f)); } catch (e) {} }"
        "const d = window.HOPE_DATA || {};"
        "const meta = d.meta || {};"
        "const out = {"
        "  schema_version: d.schema_version,"
        "  timeline: Array.isArray(d.timeline) ? d.timeline : [],"
        "  has_social_key: Object.prototype.hasOwnProperty.call(d, 'social'),"
        "  social_len: Array.isArray(d.social) ? d.social.length : 0,"
        "  overview_show: !!(d.overview && d.overview.show),"
        "  has_overview_key: Object.prototype.hasOwnProperty.call(d, 'overview'),"
        "  meta: {"
        "    name: meta.name, headline: meta.headline,"
        "    og_description: meta.og_description, summary_short: meta.summary_short,"
        "    share_url: meta.share_url, site_url: meta.site_url,"
        "    target_company: meta.target_company,"
        "    has_meta: Object.keys(meta).length > 0"
        "  },"
        "  link_urls: (d.identity && Array.isArray(d.identity.links)) ? d.identity.links.map(l => l && l.url).filter(Boolean) : []"
        "};"
        "process.stdout.write(JSON.stringify(out));"
    )
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=20)
    if out.returncode != 0:
        raise RuntimeError(f"node failed: {out.stderr.strip() or 'unknown error'}")
    return json.loads(out.stdout or "{}")


def load_data_py(files: list[Path]) -> dict:
    """Fallback: extract the timeline array textually + grep a few meta scalars.
    Works when the timeline array is valid JSON (a generated data.js); raises if
    the timeline array can't be isolated. Meta/gate fields degrade to None when
    they can't be read without a real JS engine."""
    src = ""
    for f in files:
        text = f.read_text(encoding="utf-8", errors="replace")
        if "HOPE_DATA" in text:
            src = text
            break
    if not src:
        raise RuntimeError("no window.HOPE_DATA found in data script(s)")
    src = _strip_js_comments(src)
    m = re.search(r'HOPE_DATA\b', src)
    key = re.search(r'["\']?timeline["\']?\s*:', src[m.end():]) if m else None
    if not key:
        raise RuntimeError("no `timeline` key after HOPE_DATA")
    base = m.end() + key.end()
    br = src.find("[", base)
    arr = _balanced_array(src, br) if br != -1 else None
    if arr is None:
        raise RuntimeError("could not isolate the timeline array (install node for JS-literal support)")
    cleaned = re.sub(r",(\s*[}\]])", r"\1", arr)  # drop trailing commas
    timeline = json.loads(cleaned)

    def scalar(field_name: str) -> Optional[str]:
        mm = re.search(rf'\b{field_name}\s*:\s*["\']((?:[^"\'\\]|\\.)*)["\']', src)
        return mm.group(1) if mm else None

    overview_show = bool(re.search(r'\boverview\b[^}]*?\bshow\s*:\s*true', src, re.S))
    return {
        "schema_version": None,
        "timeline": timeline,
        "has_social_key": bool(re.search(r'\bsocial\s*:', src)),
        "social_len": 0,  # not countable textually; treated as unknown below
        "overview_show": overview_show,
        "has_overview_key": bool(re.search(r'\boverview\s*:', src)),
        "meta": {
            "name": scalar("name"),
            "headline": scalar("headline"),
            "og_description": scalar("og_description"),
            "summary_short": scalar("summary_short"),
            "share_url": scalar("share_url"),
            "site_url": scalar("site_url"),
            "target_company": scalar("target_company"),
            "has_meta": bool(re.search(r'\bmeta\s*:', src)),
        },
        "link_urls": [],
        "_py_fallback": True,
    }


def _strip_js_comments(s: str) -> str:
    out, i, n, quote = [], 0, len(s), None
    while i < n:
        c = s[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(s[i + 1]); i += 2; continue
            if c == quote:
                quote = None
            i += 1; continue
        if c in "\"'`":
            quote = c; out.append(c); i += 1; continue
        if c == "/" and i + 1 < n and s[i + 1] == "*":
            j = s.find("*/", i + 2); i = j + 2 if j != -1 else n; continue
        if c == "/" and i + 1 < n and s[i + 1] == "/":
            j = s.find("\n", i + 2); i = j if j != -1 else n; continue
        out.append(c); i += 1
    return "".join(out)


def _balanced_array(s: str, start: int) -> Optional[str]:
    depth, i, n, quote = 0, start, len(s), None
    while i < n:
        c = s[i]
        if quote:
            if c == "\\":
                i += 2; continue
            if c == quote:
                quote = None
            i += 1; continue
        if c in "\"'`":
            quote = c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return s[start:i + 1]
        i += 1
    return None


def load_data(folder: Path) -> tuple[dict, str]:
    files = data_files(folder)
    if not files:
        raise RuntimeError(f"no data.js or data/*.js in {folder}")
    src = "data.js" if files[0].name == "data.js" else f"data/*.js ({len(files)} file{'s' if len(files) != 1 else ''})"
    if shutil.which("node"):
        return load_data_node(files), src
    return load_data_py(files), src + " [json fallback — node absent]"


# ── Headless render: dump the RENDERED DOM (reuses pdf-verifier harness) ──────
def stage_siblings(folder: Path, dest_dir: Path) -> None:
    """Copy index.html + every sibling (portfolio.css, portfolio.js, data/,
    photos/, …) verbatim into dest_dir so relative <link>/<script src> resolve.
    Folder-aware staging, identical to verify_portfolio_pdf.py's."""
    for entry in folder.iterdir():
        if entry.name.startswith("."):
            continue
        if entry.is_dir():
            shutil.copytree(entry, dest_dir / entry.name, dirs_exist_ok=True)
        else:
            shutil.copy2(entry, dest_dir / entry.name)


def dump_rendered_dom(chrome: str, work: Path, html_path: Path) -> Optional[str]:
    """Drive headless Chrome and recover the post-JS-render DOM.

    Reuses verify_portfolio_pdf.py's measure_scroll_height() harness verbatim:
    `--headless --dump-dom --virtual-time-budget=10000` writes the serialized
    DOM to stdout; we redirect it to a file and poll under a watchdog until
    `</html>` lands (then let the tail flush), terminating Chrome ourselves
    because pages with animation loops / intervals never self-exit.
    """
    dump_path = html_path.with_suffix(".dump.html")
    if dump_path.exists():
        dump_path.unlink()
    profile = work / "chrome-profile-dump"
    profile.mkdir(exist_ok=True)
    cmd = [
        chrome, "--headless", "--disable-gpu", "--hide-scrollbars",
        "--no-first-run", "--no-default-browser-check", "--disable-extensions",
        f"--user-data-dir={profile}", "--virtual-time-budget=10000",
        "--dump-dom", html_path.as_uri(),
    ]
    with open(dump_path, "wb") as fh:
        proc = subprocess.Popen(cmd, stdout=fh, stderr=subprocess.DEVNULL)
        deadline = time.monotonic() + 120
        try:
            while time.monotonic() < deadline:
                if proc.poll() is not None:
                    break
                if dump_path.exists() and b"</html>" in dump_path.read_bytes():
                    time.sleep(1.0)  # let the tail flush
                    break
                time.sleep(0.5)
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
    if not dump_path.exists():
        return None
    dom = dump_path.read_text(encoding="utf-8", errors="replace")
    return dom or None


def render_dom(folder: Path, chrome: str, work: Path) -> str:
    """Stage the portfolio, render it headless, return the rendered DOM string."""
    stage = work / "render"
    stage.mkdir(exist_ok=True)
    stage_siblings(folder, stage)
    dom = dump_rendered_dom(chrome, work, stage / "index.html")
    if not dom or "</html>" not in dom:
        raise RuntimeError("Chrome --dump-dom produced no usable rendered DOM")
    return dom


# ── DOM parse — panes, cards, gates, direct-child invariants ─────────────────
def parse_panes(html: str) -> dict[str, list[str]]:
    """{pane_name: [tl-id, ...] in DOM order} for cards physically inside each
    pane. Panes are siblings: a pane's slice runs to the next data-pane mark
    (or to #resume-view / EOF for the last), which bounds card membership."""
    marks = sorted((m.start(), m.group(1)) for m in re.finditer(r'data-pane\s*=\s*"([^"]+)"', html))
    rv = re.search(r'id\s*=\s*"resume-view"', html)
    rv_pos = rv.start() if rv else len(html)
    panes: dict[str, list[str]] = {}
    for idx, (pos, name) in enumerate(marks):
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(html)
        end = min(end, rv_pos) if pos < rv_pos else end
        ids = re.findall(r'id\s*=\s*"tl-([^"]+)"', html[pos:end])
        panes.setdefault(name, []).extend(ids)
    return panes


def has_pane_id(html: str, pane: str) -> bool:
    """Whether the rendered DOM has an explicit `id="pane-{pane}"` anchor
    (the link target the print-TOC / back-to-top use). overview & social get
    these ids per spec §C.2."""
    return re.search(rf'id\s*=\s*"pane-{re.escape(pane)}"', html) is not None


def has_pane(html: str, pane: str) -> bool:
    """Whether a `.section-pane[data-pane=pane]` exists at all."""
    return re.search(rf'data-pane\s*=\s*"{re.escape(pane)}"', html) is not None


# ── Direct-child invariants (spec §B.2 / §C.7) ───────────────────────────────
def _tag_open_iter(html: str):
    """Yield (tag, attrs, start, end_of_open_tag) for every open tag, skipping
    void/self-closing forms. Lightweight; good enough to walk the shell tree."""
    for m in re.finditer(r'<([a-zA-Z][\w-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*?)(/?)>', html):
        yield m.group(1).lower(), m.group(2), m.start(), m.end(), bool(m.group(3))


def _direct_children_classes(html: str, parent_open_re: str) -> Optional[list[tuple[str, str]]]:
    """Return [(tag, attrs), ...] for DIRECT children of the first element
    matching parent_open_re. None when the parent isn't found. Walks a tag
    depth counter so only depth-1 descendants are reported."""
    pm = re.search(parent_open_re, html)
    if not pm:
        return None
    parent_tag = re.match(r'<([a-zA-Z][\w-]*)', pm.group(0)).group(1).lower()
    pos = pm.end()
    depth = 0
    children: list[tuple[str, str]] = []
    # token stream: open tags and close tags from pos onward
    token = re.compile(r'<(/?)([a-zA-Z][\w-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*?)(/?)>')
    VOID = {"br", "hr", "img", "input", "meta", "link", "source", "wbr", "area", "base", "col", "embed", "param", "track"}
    for tm in token.finditer(html, pos):
        closing, tag, attrs, selfclose = tm.group(1), tm.group(2).lower(), tm.group(3), tm.group(4)
        if closing:
            if depth == 0:
                break  # closing the parent
            depth -= 1
            continue
        if depth == 0:
            children.append((tag, attrs))
        if not selfclose and tag not in VOID:
            depth += 1
    return children


def _classlist(attrs: str) -> set[str]:
    cm = re.search(r'class\s*=\s*"([^"]*)"', attrs)
    return set(cm.group(1).split()) if cm else set()


def _has_id(attrs: str, ident: str) -> bool:
    im = re.search(r'id\s*=\s*"([^"]*)"', attrs)
    return bool(im) and im.group(1) == ident


def check_direct_child_invariants(html: str, report: Report, label: str) -> None:
    """(f) the DIRECT-CHILD invariants — spec §B.2 / §C.7.

      .wrap > .section-pane          (print order L241-243 / grid-col-2 L1069)
      .identity-card > .identity-row (CSS L1098)
      .identity-card > #throughline  (CSS L1105/1106 :has(> .tl-strip))

    A wrapper div between any of these silently breaks the ≥1440px 3-column
    rail layout (panes still LOOK fine in dev, fail in print/wide). Asserted on
    the RENDERED DOM so it actually catches a renderer that injects a wrapper.
    """
    sec = "direct-child"

    # .wrap > .section-pane (at least one pane is a direct child of .wrap)
    wrap_children = _direct_children_classes(html, r'<div\b[^>]*\bclass\s*=\s*"[^"]*\bwrap\b[^"]*"[^>]*>')
    if wrap_children is None:
        report.add(sec, ".wrap", "FAIL", f"{label}: no .wrap container found")
    else:
        # Count actual .section-pane ELEMENTS, not raw `data-pane=` attributes:
        # the reused Highlights engine (buildFeatureCard) also stamps `data-pane`
        # on feature-card navigation links (spec §C.2), so a raw attribute count
        # over-counts and falsely reports a "nested" pane.
        panes_total = len(re.findall(r'class\s*=\s*"[^"]*\bsection-pane\b[^"]*"', html))
        direct_panes = sum(1 for tag, at in wrap_children if "section-pane" in _classlist(at))
        if panes_total == 0:
            report.add(sec, ".wrap>.section-pane", "WARN", f"{label}: no .section-pane in DOM to check")
        elif direct_panes == 0:
            report.add(sec, ".wrap>.section-pane", "FAIL",
                       f"{label}: {panes_total} pane(s) exist but NONE is a direct child of .wrap "
                       "(a wrapper div breaks print order L241-243 + grid-col-2 L1069)")
        elif direct_panes < panes_total:
            report.add(sec, ".wrap>.section-pane", "FAIL",
                       f"{label}: only {direct_panes}/{panes_total} panes are direct .wrap children "
                       "(some pane is nested in a wrapper)")
        else:
            report.add(sec, ".wrap>.section-pane", "PASS",
                       f"{label}: all {direct_panes} pane(s) are direct .wrap children")

    # .identity-card > .identity-row  AND  .identity-card > #throughline
    ic_children = _direct_children_classes(html, r'<div\b[^>]*\bclass\s*=\s*"[^"]*\bidentity-card\b[^"]*"[^>]*>')
    if ic_children is None:
        report.add(sec, ".identity-card", "FAIL", f"{label}: no .identity-card found")
    else:
        has_row = any("identity-row" in _classlist(at) for _, at in ic_children)
        has_through = any(_has_id(at, "throughline") for _, at in ic_children)
        report.add(sec, ".identity-card>.identity-row", "PASS" if has_row else "FAIL",
                   f"{label}: .identity-row is{'' if has_row else ' NOT'} a direct child of .identity-card (CSS L1098)")
        report.add(sec, ".identity-card>#throughline", "PASS" if has_through else "FAIL",
                   f"{label}: #throughline is{'' if has_through else ' NOT'} a direct child of .identity-card (CSS L1105/1106)")


# ── Date ordering ────────────────────────────────────────────────────────────
_ONGOING = (9999, 12, 31)


def _dt(s) -> Optional[tuple]:
    if s is None:
        return None
    m = re.match(r'\s*(\d{4})-(\d{1,2})(?:-(\d{1,2}))?', str(s))
    return (int(m.group(1)), int(m.group(2)), int(m.group(3) or 1)) if m else None


def _start_key(e: dict) -> tuple:
    return _dt(e.get("date_start")) or (0, 0, 0)


def _end_key(e: dict) -> tuple:
    end = e.get("date_end")
    if end is None or str(end).strip().lower() in ("", "null", "present", "current", "ongoing", "now"):
        return _ONGOING
    return _dt(end) or (0, 0, 0)


def is_older(a: dict, b: dict) -> bool:
    """True only when `a` is UNAMBIGUOUSLY older than `b` — earlier by both
    start AND end date (ongoing counts as the most recent end). When the two
    measures disagree the ordering is defensible, so it isn't flagged."""
    return _start_key(a) < _start_key(b) and _end_key(a) < _end_key(b)


def _span(e: dict) -> str:
    end = e.get("date_end")
    return f"{e.get('date_start') or '?'}→{end or 'now'}"


# ── HTML-entity decode (for head/data parity comparison) ──────────────────────
def _unescape(s: str) -> str:
    return (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
            .replace("&quot;", '"').replace("&#39;", "'").replace("&apos;", "'"))


def _norm(s: Optional[str]) -> str:
    return re.sub(r"\s+", " ", _unescape(s or "")).strip()


# ── HEAD↔DATA parity (spec §F.4) ─────────────────────────────────────────────
def _head_meta(html: str, prop: str, attr: str = "property") -> Optional[str]:
    m = re.search(rf'<meta\s+[^>]*{attr}\s*=\s*"{re.escape(prop)}"[^>]*content\s*=\s*"([^"]*)"', html, re.I)
    if not m:
        m = re.search(rf'<meta\s+[^>]*content\s*=\s*"([^"]*)"[^>]*{attr}\s*=\s*"{re.escape(prop)}"', html, re.I)
    return m.group(1) if m else None


def check_head_data_parity(raw_html: str, data: dict, report: Report) -> None:
    """(g) head↔data parity — title / og:title / og:description / canonical /
    hope:share-url / .seo-fallback must agree with data.js meta.* (spec §F.4).
    Run against the STATIC index.html (the stamped head/fallback) — these are
    authored at gen, not produced by JS."""
    sec = "head-parity"
    meta = data.get("meta", {})
    if not meta.get("has_meta") and not meta.get("name"):
        report.add(sec, "meta", "WARN",
                   "data.js carries no `meta` block (v1 timeline-only data?) — head↔data parity "
                   "cannot be checked; the v2 contract requires meta.*")
        return

    name = meta.get("name")
    headline = meta.get("headline")
    og_desc = meta.get("og_description")
    summary_short = meta.get("summary_short")
    share_url = meta.get("share_url")
    company = meta.get("target_company")

    # title: "{name} — Portfolio[ · {company}]"
    tm = re.search(r"<title>(.*?)</title>", raw_html, re.S | re.I)
    title = _norm(tm.group(1)) if tm else None
    if name is not None:
        want = f"{_norm(name)} — Portfolio"
        if company:
            want += f" · {_norm(company)}"
        report.add(sec, "title", "PASS" if title == want else "FAIL",
                   f"<title>={title!r} want {want!r}" if title != want else f"<title> matches meta.name")

    # og:title: "{name} — {headline}"
    og_title = _head_meta(raw_html, "og:title")
    if name is not None and headline is not None:
        want = f"{_norm(name)} — {_norm(headline)}"
        got = _norm(og_title)
        report.add(sec, "og:title", "PASS" if got == want else "FAIL",
                   f"og:title={got!r} want {want!r}" if got != want else "og:title matches name — headline")

    # og:description == meta.og_description
    if og_desc is not None:
        got = _norm(_head_meta(raw_html, "og:description"))
        report.add(sec, "og:description", "PASS" if got == _norm(og_desc) else "FAIL",
                   "og:description matches meta.og_description" if got == _norm(og_desc)
                   else f"og:description≠data; head={got[:60]!r} data={_norm(og_desc)[:60]!r}")

    # canonical == meta.share_url (both empty pre-publish is allowed)
    cm = re.search(r'<link\s+[^>]*rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]*)"', raw_html, re.I)
    canonical = cm.group(1) if cm else None
    if canonical is None:
        report.add(sec, "canonical", "FAIL", "no <link rel=\"canonical\"> in head (spec §F.4/§B.1)")
    else:
        want = _norm(share_url)
        report.add(sec, "canonical", "PASS" if _norm(canonical) == want else "FAIL",
                   "canonical matches meta.share_url" if _norm(canonical) == want
                   else f"canonical={canonical!r} ≠ meta.share_url={share_url!r}")

    # hope:share-url == meta.share_url
    hsu = _head_meta(raw_html, "hope:share-url", attr="name")
    if hsu is None:
        report.add(sec, "hope:share-url", "FAIL", "no <meta name=\"hope:share-url\"> in head")
    else:
        want = _norm(share_url)
        report.add(sec, "hope:share-url", "PASS" if _norm(hsu) == want else "FAIL",
                   "hope:share-url matches meta.share_url" if _norm(hsu) == want
                   else f"hope:share-url={hsu!r} ≠ meta.share_url={share_url!r}")

    # .seo-fallback text must contain name / headline / summary_short
    fb = re.search(r'<div\s+class\s*=\s*"seo-fallback">(.*?)</div>', raw_html, re.S | re.I)
    if not fb:
        report.add(sec, ".seo-fallback", "FAIL",
                   "no static .seo-fallback <div> in body (spec §B.2 — indexable body text "
                   "for JS-rendered portfolios; must be a visible <div>, not <noscript>)")
    else:
        text = _norm(re.sub(r"<[^>]+>", " ", fb.group(1)))
        missing = [lbl for lbl, val in (("name", name), ("headline", headline), ("summary_short", summary_short))
                   if val and _norm(val) not in text]
        if missing:
            report.add(sec, ".seo-fallback", "FAIL",
                       f".seo-fallback text missing meta {', '.join(missing)} (head↔body↔data drift)")
        else:
            report.add(sec, ".seo-fallback", "PASS", ".seo-fallback text matches meta name/headline/summary_short")


# ── POSITIVE SEO PRESENCE (spec §F.5) ────────────────────────────────────────
_PLACEHOLDER_RE = re.compile(r"\{\{|\}\}|PLACEHOLDER|TODO|XXXX|lorem ipsum", re.I)


def check_seo_presence(raw_html: str, report: Report) -> None:
    """(h) positive SEO presence — spec §F.5. Presence checks, not just
    absence-of-token: canonical, description, og:title/description/type,
    twitter:card, and JSON-LD with non-placeholder description/url/sameAs."""
    sec = "seo-presence"

    checks: list[tuple[str, bool, str]] = [
        ("canonical",
         re.search(r'<link\s+[^>]*rel\s*=\s*"canonical"', raw_html, re.I) is not None,
         "<link rel=\"canonical\"> present"),
        ("meta description",
         _head_meta(raw_html, "description", attr="name") is not None,
         "<meta name=\"description\"> present"),
        ("og:title", _head_meta(raw_html, "og:title") is not None, "og:title present"),
        ("og:description", _head_meta(raw_html, "og:description") is not None, "og:description present"),
        ("og:type", _head_meta(raw_html, "og:type") is not None, "og:type present"),
        ("twitter:card", _head_meta(raw_html, "twitter:card", attr="name") is not None, "twitter:card present"),
    ]
    for name, ok, detail in checks:
        report.add(sec, name, "PASS" if ok else "FAIL",
                   detail if ok else f"{name} MISSING (spec §B.1/§F.5)")

    # JSON-LD: must parse and carry non-placeholder description / url / sameAs.
    blocks = re.findall(r'<script\s+type\s*=\s*"application/ld\+json"\s*>(.*?)</script>', raw_html, re.S | re.I)
    if not blocks:
        report.add(sec, "json-ld", "FAIL", "no <script type=\"application/ld+json\"> block")
        return

    def find_node(obj):
        """Locate the node carrying SEO fields (the ProfilePage or its Person)."""
        nodes = []
        def walk(o):
            if isinstance(o, dict):
                nodes.append(o)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(obj)
        return nodes

    desc_ok = url_ok = sameas_ok = False
    parsed_any = False
    for blk in blocks:
        try:
            obj = json.loads(blk)
        except json.JSONDecodeError:
            continue
        parsed_any = True
        for node in find_node(obj):
            d = node.get("description")
            if isinstance(d, str) and d.strip() and not _PLACEHOLDER_RE.search(d):
                desc_ok = True
            u = node.get("url")
            if isinstance(u, str) and u.strip() and not _PLACEHOLDER_RE.search(u):
                url_ok = True
            sa = node.get("sameAs")
            if isinstance(sa, list) and any(isinstance(x, str) and x.strip() for x in sa) and not _PLACEHOLDER_RE.search(json.dumps(sa)):
                sameas_ok = True
            elif isinstance(sa, str) and sa.strip() and not _PLACEHOLDER_RE.search(sa):
                sameas_ok = True

    if not parsed_any:
        report.add(sec, "json-ld", "FAIL", "JSON-LD block(s) present but none parse as valid JSON")
        return
    for name, ok in (("json-ld.description", desc_ok), ("json-ld.url", url_ok), ("json-ld.sameAs", sameas_ok)):
        report.add(sec, name, "PASS" if ok else "FAIL",
                   f"{name} present + non-placeholder" if ok
                   else f"{name} MISSING/placeholder in JSON-LD (spec §B.1 ENRICHED Person / §F.5)")


# ── Core structural verification (AGREEMENT / CONTAINMENT / ORDER / GATES) ────
def verify_structure(dom_html: str, data: dict, report: Report, label: str) -> None:
    timeline = data.get("timeline", [])
    report.add("parse", "timeline", "INFO", f"{len(timeline)} entries; checking {label}")

    panes = parse_panes(dom_html)
    all_ids = re.findall(r'id\s*=\s*"tl-([^"]+)"', dom_html)
    in_pane = [i for ids in panes.values() for i in ids]
    id_set = set(all_ids)

    by_id: dict[str, dict] = {}
    dupes: list[str] = []
    for e in timeline:
        eid = str(e.get("id", "")).strip()
        if not eid:
            report.add("agreement", "entry-id", "FAIL", f"timeline entry missing id: {e.get('label', e)!r}")
            continue
        if eid in by_id:
            dupes.append(eid)
        by_id[eid] = e
    for d in sorted(set(dupes)):
        report.add("agreement", "entry-id", "FAIL", f"duplicate timeline id: {d}")

    # (a) AGREEMENT — every timeline[].id (join key = pane) has a rendered card,
    #     and every rendered card has a timeline entry.
    anchor_ids = {str(e.get("anchor") or "")[3:] for e in timeline if str(e.get("anchor") or "").startswith("tl-")}
    entry_ids = set(by_id) | anchor_ids
    missing = []
    for eid, e in by_id.items():
        anchor = str(e.get("anchor") or f"tl-{eid}")
        want = anchor[3:] if anchor.startswith("tl-") else anchor
        if want not in id_set:
            missing.append((eid, want))
    for eid, want in sorted(missing):
        report.add("agreement", "card-exists", "FAIL",
                   f'timeline "{eid}" (pane={by_id[eid].get("pane")!r}) → no rendered card id="tl-{want}" (dead rail click)')
    orphans = sorted(c for c in id_set if c not in entry_ids)
    for c in orphans:
        report.add("agreement", "card-orphan", "FAIL", f'rendered card id="tl-{c}" → no timeline entry (orphan)')
    if not missing and not orphans and not dupes:
        report.add("agreement", "dom<->data", "PASS", f"{len(id_set)} rendered cards ↔ {len(by_id)} entries aligned")

    # (b) CONTAINMENT — outside any pane, and pane vs declared `pane` (PLURAL).
    cont_fail = False
    for c in sorted(set(all_ids) - set(in_pane)):
        report.add("containment", "outside-pane", "FAIL", f"card tl-{c} sits outside every section-pane")
        cont_fail = True
    for pane_name, ids in panes.items():
        if pane_name not in CARD_PANES:
            if ids:
                report.add("containment", f"pane:{pane_name}", "WARN",
                           f"non-card pane '{pane_name}' holds tl- ids: {', '.join('tl-' + s for s in ids)}")
            continue
        for c in ids:
            e = by_id.get(c)
            if e is None:
                continue  # flagged as orphan above
            want = str(e.get("pane", "")).strip()  # JOIN KEY = pane PLURAL
            if want != pane_name:
                report.add("containment", f"pane:{pane_name}", "FAIL",
                           f"card tl-{c} is rendered in '{pane_name}' but its timeline entry says pane='{want}'")
                cont_fail = True
    if not cont_fail:
        report.add("containment", "pane-fit", "PASS", "every card sits in its declared pane")

    # (c) ORDER — within each card-pane, reverse-chronological (newest first).
    for pane_name, ids in panes.items():
        if pane_name not in CARD_PANES:
            continue
        active = [(c, by_id[c]) for c in ids if c in by_id]
        if len(active) < 2:
            continue
        problems = [
            f"tl-{ca} ({_span(ea)}) before newer tl-{cb} ({_span(eb)})"
            for (ca, ea), (cb, eb) in zip(active, active[1:])
            if is_older(ea, eb)
        ]
        if problems:
            report.add("order", f"pane:{pane_name}", "FAIL", "not newest-first: " + "; ".join(problems))
        else:
            report.add("order", f"pane:{pane_name}", "PASS", f"{len(active)} cards newest-first")

    # (d) overview.show ⇔ #pane-overview
    ov_show = bool(data.get("overview_show"))
    ov_present = has_pane_id(dom_html, "overview") or has_pane(dom_html, "overview")
    if ov_show == ov_present:
        report.add("gates", "overview", "PASS",
                   f"overview.show={ov_show} ⇔ #pane-overview {'present' if ov_present else 'absent'}")
    else:
        report.add("gates", "overview", "FAIL",
                   f"overview.show={ov_show} but #pane-overview is {'present' if ov_present else 'ABSENT'} "
                   "(gate ⇔ presence must agree — spec §C.2/§F)")

    # (e) social.length>0 ⇔ #pane-social
    soc_present = has_pane_id(dom_html, "social") or has_pane(dom_html, "social")
    if data.get("_py_fallback") and data.get("has_social_key"):
        # Couldn't count social[] textually; only flag the contradiction we CAN see.
        report.add("gates", "social", "WARN",
                   f"social count not readable without node; pane {'present' if soc_present else 'absent'} "
                   "(install node to assert social.length>0 ⇔ #pane-social)")
    else:
        soc_nonempty = data.get("social_len", 0) > 0
        if soc_nonempty == soc_present:
            report.add("gates", "social", "PASS",
                       f"social.length={data.get('social_len', 0)} ⇔ #pane-social {'present' if soc_present else 'absent'}")
        else:
            report.add("gates", "social", "FAIL",
                       f"social.length={data.get('social_len', 0)} but #pane-social is "
                       f"{'present' if soc_present else 'ABSENT'} (gate ⇔ presence must agree — spec §C.2/§F)")

    # (f) DIRECT-CHILD invariants
    check_direct_child_invariants(dom_html, report, label)


# ── Reporting ────────────────────────────────────────────────────────────────
def print_table(report: Report) -> None:
    cols = ("SECTION", "CHECK", "STATUS", "DETAIL")
    rows = [(c.section, c.name, c.status, c.detail) for c in report.checks]
    w0 = max(len(cols[0]), *(len(r[0]) for r in rows)) if rows else len(cols[0])
    w1 = max(len(cols[1]), *(len(r[1]) for r in rows)) if rows else len(cols[1])
    w2 = max(len(cols[2]), *(len(r[2]) for r in rows)) if rows else len(cols[2])
    line = f"{{:<{w0}}}  {{:<{w1}}}  {{:<{w2}}}  {{}}"
    print(line.format(*cols))
    print(line.format("-" * w0, "-" * w1, "-" * w2, "-" * 40))
    for r in rows:
        print(line.format(*r))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Verify Hope portfolio structure on the RENDERED DOM: order, placement, "
                    "timeline↔DOM agreement, gates, head↔data parity, SEO presence.")
    parser.add_argument("subject", type=Path, nargs="?", default=SUBJECT_DEFAULT,
                        help=f"portfolio folder or its index.html (default: {SUBJECT_DEFAULT})")
    parser.add_argument("--chrome", default=CHROME_DEFAULT, help=f"Chrome binary (default: {CHROME_DEFAULT})")
    parser.add_argument("--data-only", action="store_true",
                        help="skip headless render; parse the RAW index.html (LOUDLY marked "
                             "'renderer NOT validated' — NOT the authoritative gate)")
    parser.add_argument("--keep", action="store_true", help="keep the /tmp render dir")
    args = parser.parse_args(argv)

    try:
        folder = resolve_folder(args.subject)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    raw_html = (folder / "index.html").read_text(encoding="utf-8", errors="replace")
    # Strip HTML comments: authoring notes carry literal id="tl-<id>" examples
    # and commented-out cards aren't rendered — both would register as phantoms.
    raw_index = re.sub(r"<!--.*?-->", "", raw_html, flags=re.S)

    print(f"verify_portfolio_structure: {folder}")
    node_path = shutil.which("node")
    print(f"feature: node: {'yes (' + node_path + ')' if node_path else 'no — JSON fallback only'}")

    # Load HOPE_DATA (timeline + gate/meta keys).
    try:
        data, data_src = load_data(folder)
    except Exception as exc:
        print(f"ERROR: could not read window.HOPE_DATA: {exc}", file=sys.stderr)
        return 2
    print(f"feature: data: {data_src}")

    chrome_ok = Path(args.chrome).is_file()
    use_headless = (not args.data_only) and chrome_ok
    if not use_headless and not args.data_only:
        # Authoritative gate REQUIRES headless render; missing Chrome with no
        # explicit --data-only is an environment error, not a silent downgrade.
        print(f"ERROR: Chrome binary not found: {args.chrome}\n"
              f"       The authoritative structure gate renders headless (spec §F).\n"
              f"       Re-run with --chrome <path>, or pass --data-only to use the "
              f"renderer-NOT-validated fallback (NOT a shipping gate).", file=sys.stderr)
        return 2

    report = Report()

    if use_headless:
        print(f"feature: chrome: yes ({args.chrome})")
        print(f"mode: HEADLESS-RENDER — validating the renderer (spec §F)\n")
        work = Path(tempfile.mkdtemp(prefix="verify-portfolio-structure-"))
        try:
            dom = render_dom(folder, args.chrome, work)
        except Exception as exc:
            print(f"ERROR: headless render failed: {exc}", file=sys.stderr)
            if not args.keep:
                shutil.rmtree(work, ignore_errors=True)
            return 2
        report.add("render", "dump-dom", "INFO", f"rendered DOM {len(dom)} bytes via --dump-dom")
        # Strip HTML comments BEFORE structural parsing: Chrome's --dump-dom
        # preserves the shell's authoring comments (MOUNT-POINT OWNERSHIP /
        # PANES / ANCHOR CONTRACT), which carry literal id="tl-<id>" examples
        # and <panes …> pseudo-tags. Un-stripped, those register as phantom
        # cards/elements and corrupt the direct-child depth walker → false
        # FAILs on the canonical artifact. Mirror the data-only path (raw_index).
        dom_structural = re.sub(r"<!--.*?-->", "", dom, flags=re.S)
        verify_structure(dom_structural, data, report, label="rendered DOM")
        if not args.keep:
            shutil.rmtree(work, ignore_errors=True)
        else:
            print(f"render artifacts kept: {work}\n")
    else:
        # ── DATA-ONLY FALLBACK — renderer NOT validated ──────────────────────
        print("mode: DATA-ONLY FALLBACK\n")
        print("=" * 78)
        print("!! WARNING: renderer NOT validated. Parsing the RAW index.html, not the")
        print("!! rendered DOM. Once the body is JS-rendered (spec §B), the raw HTML")
        print("!! carries NO panes/cards and structural checks PASS VACUOUSLY. This mode")
        print("!! is a fast data sanity-check ONLY and MUST NOT be the shipping gate.")
        print("!! Re-run WITHOUT --data-only (with Chrome) for the authoritative result.")
        print("=" * 78 + "\n")
        report.add("MODE", "renderer", "WARN",
                   "DATA-ONLY FALLBACK — renderer NOT validated (raw index.html parsed; not a shipping gate)")
        verify_structure(raw_index, data, report, label="RAW index.html [renderer NOT validated]")

    # (g) HEAD↔DATA parity and (h) POSITIVE SEO PRESENCE — always on the static
    #     index.html (head + .seo-fallback are stamped at gen, not JS-produced).
    check_head_data_parity(raw_html, data, report)
    check_seo_presence(raw_html, report)

    print_table(report)

    n_fail = len(report.hard_failures)
    n_pass = sum(1 for c in report.checks if c.status == "PASS")
    n_warn = sum(1 for c in report.checks if c.status == "WARN")
    result = "FAIL" if n_fail else "PASS"
    if not use_headless and result == "PASS":
        result = "PASS (renderer NOT validated — data-only)"
    print(f"\nRESULT: {result} — {n_pass} pass, {n_fail} fail, {n_warn} warn")
    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
