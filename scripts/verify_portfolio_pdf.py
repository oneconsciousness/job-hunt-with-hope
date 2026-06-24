#!/usr/bin/env python3
"""verify_portfolio_pdf.py — headless-Chrome PDF verification for Hope portfolios.

Renders a portfolio (a modular FOLDER of index.html + portfolio.css +
portfolio.js + data scripts, or a legacy single HTML file) to PDF via
headless Chrome in several export modes and asserts the verify bar:

  * GEOMETRY   (continuous) exactly 1 page, 612 pt wide, height == measured
               scrollHeight x 0.75 within +/-2 pt; (paginated/resume) Letter.
  * BLANK      trailing-blank scan: continuous <= 3%; paginated <= 25% on any
               non-last page. Needs pdftoppm; skipped with WARNING otherwise.
  * SIZE       per-mode byte budgets (+300 KB allowance if a headshot JPEG
               is baked in).
  * RASTER     stdlib XObject scan: <= 25 rasters (an image + its /SMask
               soft-mask pair counts as ONE raster), <= 5 Mpx total,
               <= 150 KB image bytes (photo-less).
  * SHADINGS   zero /ShadingType 4 (function/mesh-based) shading objects.
  * TEXT       text operators present; >= word floor via pdftotext when
               available (ATS-dead check).
  * LINKS      TOC modes: >= 6 /Link annotations and /Dest-based internal
               destinations present (grep raw bytes for /Dest, never /GoTo).

Modes driven: continuous x {classic, ink, showcase}, paginated x classic,
resume x classic, and default (no body classes).

Continuous is rendered with a two-pass approach that replicates the
template's export-modal JS:
  pass 1: a /tmp copy gets body classes + a script that pins body width to
          816px, forces reflow, and writes document.scrollHeight into a DOM
          attribute; Chrome --headless --dump-dom recovers the value.
  pass 2: a second copy carries the body classes statically plus
          <style id="continuous-page">@page{size:816px Hpx;margin:0}</style>
          appended LAST in <head> (H = measured + 1px slack, capped at
          19200px), then Chrome --print-to-pdf renders it.

Stdlib-first: page count, MediaBox, image XObjects, shadings, text bytes and
link annotations are all parsed with re/zlib over the raw PDF. poppler
(pdftoppm/pdftotext/pdfimages) and PyMuPDF are used only behind
feature-detection and skip gracefully when absent.

Staging is FOLDER-AWARE: the subject may be a portfolio folder or its
index.html. Every sibling of index.html (portfolio.css, portfolio.js,
data/ scripts, og images, ...) is copied verbatim into each /tmp mode dir;
only the index.html content is rewritten (body classes, measure script,
@page style), so relative <link>/<script src> references keep resolving.

Usage:
  scripts/verify_portfolio_pdf.py [path/to/portfolio-folder | path/to/index.html] \
      [--chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"] \
      [--modes continuous-classic,paginated-classic] [--keep]

Default subject: assets/fixtures/persona-jane-doe/sample-portfolio/index.html
(resolved relative to this script's repo).

Exit code: 0 = all hard asserts passed, 1 = at least one hard FAIL,
2 = environment/usage error (Chrome missing, HTML unreadable).
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import zlib
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

# ── Constants ────────────────────────────────────────────────────────────────
PAGE_W_PX = 816  # continuous page width in CSS px (== 612 pt Letter width)
PX_TO_PT = 0.75  # Chrome CSS px -> PDF pt
CAP_PX = 19200  # continuous height cap (px)
SLACK_PX = 1  # rounding slack added to the measured scrollHeight
LETTER_W_PT, LETTER_H_PT = 612.0, 792.0
GEOM_TOL_PT = 2.0

KB = 1024
MB = 1024 * 1024
HEADSHOT_ALLOWANCE = 300 * KB
HEADSHOT_MIN_BYTES = 30 * KB  # a DCTDecode image at least this big == baked headshot

RASTER_MAX_XOBJECTS = 25  # effective rasters: an image + its /SMask pair == 1
RASTER_MAX_MPX = 5.0
RASTER_MAX_BYTES = 150 * KB

CONTINUOUS_TRAILING_BLANK_MAX = 0.03
PAGINATED_TRAILING_BLANK_MAX = 0.25

MIN_LINK_ANNOTS = 6

CHROME_DEFAULT = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Default subject: the converted persona fixture folder's index.html,
# resolved relative to this script so the repo can live anywhere.
SUBJECT_DEFAULT = (Path(__file__).resolve().parent.parent
                   / "assets" / "fixtures" / "persona-jane-doe"
                   / "sample-portfolio" / "index.html")

MEASURE_SCRIPT = """
<script id="verify-measure">
window.addEventListener('load', function () {
  function measure() {
    document.body.classList.add('print-continuous');
    document.body.style.width = '%(width)dpx';
    void document.body.offsetHeight; /* force reflow before reading */
    var h = Math.max(document.documentElement.scrollHeight,
                     document.body.scrollHeight);
    document.documentElement.setAttribute('data-scroll-height', String(h));
    document.title = 'SCROLLHEIGHT:' + h;
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(measure);
    setTimeout(measure, 1500); /* belt-and-braces if fonts.ready stalls */
  } else { measure(); }
});
</script>
"""


# ── Mode table ───────────────────────────────────────────────────────────────
@dataclass(frozen=True)
class Mode:
    name: str
    body_classes: str  # classes added to <body> for this export mode
    continuous: bool
    is_resume: bool
    toc_expected: bool  # portfolio print modes must carry the print-TOC links
    size_budget: int  # hard cap, bytes
    size_target: Optional[int] = None  # soft target -> WARN when exceeded
    min_words: int = 500


MODES: list[Mode] = [
    Mode("continuous-classic", "print-doc-portfolio print-style-classic print-continuous",
         continuous=True, is_resume=False, toc_expected=True,
         size_budget=int(1.5 * MB), size_target=int(1.2 * MB)),
    Mode("continuous-ink", "print-doc-portfolio print-style-ink print-continuous",
         continuous=True, is_resume=False, toc_expected=True,
         size_budget=1 * MB),
    Mode("continuous-showcase", "print-doc-portfolio print-style-showcase print-continuous",
         continuous=True, is_resume=False, toc_expected=True,
         size_budget=int(1.5 * MB)),
    Mode("paginated-classic", "print-doc-portfolio print-style-classic",
         continuous=False, is_resume=False, toc_expected=True,
         size_budget=int(1.5 * MB), size_target=int(1.2 * MB)),
    Mode("resume-classic", "print-doc-resume print-style-classic",
         continuous=False, is_resume=True, toc_expected=False,
         size_budget=1 * MB, min_words=150),
    Mode("default", "",
         continuous=False, is_resume=False, toc_expected=True,
         size_budget=int(1.5 * MB)),
]


# ── Result plumbing ──────────────────────────────────────────────────────────
@dataclass
class Check:
    mode: str
    name: str
    status: str  # PASS | FAIL | WARN | SKIP | INFO
    detail: str


@dataclass
class Report:
    checks: list[Check] = field(default_factory=list)

    def add(self, mode: str, name: str, status: str, detail: str) -> None:
        self.checks.append(Check(mode, name, status, detail))

    @property
    def hard_failures(self) -> list[Check]:
        return [c for c in self.checks if c.status == "FAIL"]


# ── Feature detection ────────────────────────────────────────────────────────
def which(tool: str) -> Optional[str]:
    return shutil.which(tool)


def has_pymupdf() -> bool:
    try:
        import fitz  # noqa: F401
        return True
    except Exception:
        return False


# ── Subject resolution + staging ─────────────────────────────────────────────
def resolve_subject(subject: Path) -> Path:
    """Accept a portfolio folder (containing index.html) or an HTML file path.

    Returns the HTML file to verify; its parent is the folder whose siblings
    get staged alongside every /tmp copy.
    """
    if subject.is_dir():
        index = subject / "index.html"
        if not index.is_file():
            raise FileNotFoundError(f"folder has no index.html: {subject}")
        return index
    if subject.is_file():
        return subject
    raise FileNotFoundError(f"subject not found: {subject}")


def stage_siblings(src_html: Path, dest_dir: Path) -> None:
    """Copy every sibling of the subject HTML verbatim into dest_dir.

    FOLDER-AWARE staging (M6): the rewritten HTML copies live in dest_dir, so
    relative <link>/<script src> references (portfolio.css, portfolio.js,
    data/*.js, ...) must resolve there. Only the HTML itself is rewritten —
    siblings are copied byte-for-byte, subfolders recursively.
    """
    for entry in src_html.parent.iterdir():
        if entry.name == src_html.name or entry.name.startswith("."):
            continue
        if entry.is_dir():
            shutil.copytree(entry, dest_dir / entry.name, dirs_exist_ok=True)
        else:
            shutil.copy2(entry, dest_dir / entry.name)


# ── HTML preparation ─────────────────────────────────────────────────────────
def load_html(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def set_body_classes(html: str, classes: str, inline_width_px: Optional[int]) -> str:
    """Rewrite the real <body> tag (the first one after </head>) with classes/style."""
    head_end = html.find("</head>")
    if head_end == -1:
        raise ValueError("no </head> found in HTML")
    m = re.compile(r"<body([^>]*)>").search(html, head_end)
    if not m:
        raise ValueError("no <body> tag found after </head>")
    attrs = m.group(1)
    # Merge into any existing class="..." attribute, else add one.
    if classes:
        cm = re.search(r'class="([^"]*)"', attrs)
        if cm:
            attrs = attrs[:cm.start(1)] + (cm.group(1) + " " + classes).strip() + attrs[cm.end(1):]
        else:
            attrs += f' class="{classes}"'
    if inline_width_px is not None:
        attrs += f' style="width:{inline_width_px}px"'
    return html[:m.start()] + f"<body{attrs}>" + html[m.end():]


def inject_head_last(html: str, snippet: str) -> str:
    """Insert snippet immediately before </head> so it is the LAST head child."""
    idx = html.find("</head>")
    if idx == -1:
        raise ValueError("no </head> found in HTML")
    return html[:idx] + snippet + "\n" + html[idx:]


def inject_before_body_close(html: str, snippet: str) -> str:
    idx = html.rfind("</body>")
    if idx == -1:
        raise ValueError("no </body> found in HTML")
    return html[:idx] + snippet + "\n" + html[idx:]


# ── Chrome driving ───────────────────────────────────────────────────────────
# NB: pages with long-lived JS (animation loops, intervals) can keep headless
# Chrome alive after the output is fully written. We therefore run Chrome
# under a watchdog: poll the output file until its size is non-zero and
# stable across consecutive polls, then terminate the browser ourselves.
def _run_chrome_watchdog(
    chrome: str,
    work: Path,
    args: list[str],
    out_file: Path,
    done: Callable[[bytes], bool],
    timeout_s: int = 120,
) -> bool:
    import time

    profile = work / f"chrome-profile-{abs(hash(tuple(args))) % 10_000}"
    profile.mkdir(exist_ok=True)
    cmd = [
        chrome,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        f"--user-data-dir={profile}",
        "--virtual-time-budget=10000",
        *args,
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.monotonic() + timeout_s
    last_size = -1
    stable = 0
    try:
        while time.monotonic() < deadline:
            if proc.poll() is not None:  # clean exit — trust the output check
                return out_file.exists() and done(out_file.read_bytes())
            if out_file.exists():
                size = out_file.stat().st_size
                if size > 0 and size == last_size:
                    stable += 1
                else:
                    stable = 0
                last_size = size
                if stable >= 2 and done(out_file.read_bytes()):
                    return True
            time.sleep(0.5)
        return False
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()


def dump_dom(chrome: str, work: Path, html_path: Path, profile_name: str = "chrome-profile-dump") -> str:
    """Render html_path headless and return the post-JS-render DOM string.

    --dump-dom writes the serialized DOM to stdout; we redirect it to a file so
    the watchdog can poll it even if Chrome never exits (pages with animation
    loops / intervals keep the browser alive after the DOM is fully written).
    Poll until `</html>` lands, let the tail flush, then terminate Chrome.
    """
    import time

    dump_path = html_path.with_suffix(".dump.html")
    if dump_path.exists():
        dump_path.unlink()
    profile = work / profile_name
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
    return dump_path.read_text(encoding="utf-8", errors="replace") if dump_path.exists() else ""


def measure_scroll_height(chrome: str, work: Path, html_path: Path) -> Optional[int]:
    """Pass 1: --dump-dom the measurement copy and recover data-scroll-height."""
    dom = dump_dom(chrome, work, html_path)
    m = re.search(r'data-scroll-height="(\d+)"', dom)
    if not m:
        m = re.search(r"SCROLLHEIGHT:(\d+)", dom)
    return int(m.group(1)) if m else None


def count_resume_entries(chrome: str, work: Path, html_path: Path) -> Optional[int]:
    """Spec §F guard: --dump-dom the prepared (body-classed) HTML and count
    `.resume-entry` elements physically INSIDE `#resume-view`.

    A blank `#resume-view` that prints cleanly is a false PASS: the resume mode
    adds `print-doc-resume` to <body> and the print engine prints only
    `#resume-view`, so a renderer that never populates it yields a blank-but-
    valid PDF. Verifying "Chrome waits" is not enough — we must observe that the
    renderer actually filled the view. Returns the count, or None if
    `#resume-view` can't be located in the dumped DOM (treated as a hard fail
    by the caller).
    """
    dom = dump_dom(chrome, work, html_path, profile_name="chrome-profile-resume")
    if not dom or "</html>" not in dom:
        return None
    # Strip HTML comments first: an authoring/marker comment containing a
    # literal class="…resume-entry…" example would otherwise inflate the count
    # (same comment-blindness class fixed in verify_portfolio_structure.py).
    dom = re.sub(r"<!--.*?-->", "", dom, flags=re.S)
    m = re.search(r'id\s*=\s*"resume-view"', dom)
    if not m:
        return None
    # Slice from #resume-view's open tag to EOF (it's the last .wrap child),
    # then count .resume-entry occurrences within that slice.
    return len(re.findall(r'class\s*=\s*"[^"]*\bresume-entry\b[^"]*"', dom[m.start():]))


def print_to_pdf(chrome: str, work: Path, html_path: Path, pdf_path: Path) -> bool:
    return _run_chrome_watchdog(
        chrome, work,
        ["--no-pdf-header-footer", f"--print-to-pdf={pdf_path}", html_path.as_uri()],
        out_file=pdf_path,
        done=lambda b: b.startswith(b"%PDF") and b.rstrip().endswith(b"%%EOF"),
    )


# ── Stdlib PDF parsing ───────────────────────────────────────────────────────
@dataclass
class PdfStats:
    n_pages: int
    media_boxes: list[tuple[float, float, float, float]]
    n_image_xobjects: int  # raw image XObject stream count
    n_image_rasters: int  # effective count: image + its /SMask pair == 1
    image_mpx: float
    image_bytes: int
    has_headshot_jpeg: bool
    shading_type_counts: Counter
    text_op_count: int
    text_operand_bytes: int
    est_glyphs: int
    n_link_annots: int
    n_dest_refs: int
    uris: list[str]


def _stream_spans(data: bytes) -> list[tuple[int, int, bytes]]:
    """All (start, end, dict_window) byte spans of stream...endstream bodies."""
    spans: list[tuple[int, int, bytes]] = []
    pos = 0
    while True:
        s = data.find(b"stream", pos)
        if s == -1:
            break
        # Reject matches inside words like 'endstream'.
        if data[max(0, s - 3):s] == b"end":
            pos = s + 6
            continue
        body_start = s + 6
        if data[body_start:body_start + 2] == b"\r\n":
            body_start += 2
        elif data[body_start:body_start + 1] == b"\n":
            body_start += 1
        e = data.find(b"endstream", body_start)
        if e == -1:
            break
        dict_window = data[max(0, s - 600):s]
        spans.append((body_start, e, dict_window))
        pos = e + 9
    return spans


def analyze_pdf(pdf_path: Path) -> PdfStats:
    data = pdf_path.read_bytes()

    # Page count: prefer counting /Type /Page leaf objects; fall back to /Count.
    page_positions = [m.start() for m in re.finditer(rb"/Type\s*/Page(?![s])", data)]
    n_pages = len(page_positions)
    if n_pages == 0:
        cm = re.search(rb"/Type\s*/Pages[^>]*?/Count\s+(\d+)", data, re.S)
        n_pages = int(cm.group(1)) if cm else 0

    # MediaBox per page: search a window around each page object.
    media_boxes: list[tuple[float, float, float, float]] = []
    for pos in page_positions:
        obj_start = data.rfind(b" obj", max(0, pos - 2000), pos)
        window = data[max(0, obj_start):pos + 2000]
        bm = re.search(rb"/MediaBox\s*\[\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*\]", window)
        if bm:
            x0, y0, x1, y1 = (float(bm.group(i)) for i in range(1, 5))
            media_boxes.append((x0, y0, x1, y1))
    if not media_boxes:  # inherited MediaBox on the Pages node
        for bm in re.finditer(rb"/MediaBox\s*\[\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*\]", data):
            x0, y0, x1, y1 = (float(bm.group(i)) for i in range(1, 5))
            media_boxes.append((x0, y0, x1, y1))

    # Image XObjects: count, megapixels, encoded stream bytes, headshot JPEG.
    # A /SMask is the alpha channel of its parent image, not an independent
    # raster — an image + its soft-mask pair counts as ONE effective raster
    # against the count budget. Mpx and byte totals still include both streams.
    n_images = 0
    image_mpx = 0.0
    image_bytes = 0
    has_headshot = False
    image_obj_nums: list[Optional[int]] = []
    spans = _stream_spans(data)
    smask_refs = {int(m.group(1)) for m in re.finditer(rb"/SMask\s+(\d+)\s+\d+\s+R", data)}
    for body_start, body_end, dict_window in spans:
        if b"/Subtype" in dict_window and re.search(rb"/Subtype\s*/Image", dict_window):
            n_images += 1
            obj_num: Optional[int] = None
            for om in re.finditer(rb"(\d+)\s+\d+\s+obj\b", dict_window):
                obj_num = int(om.group(1))  # last 'N G obj' before the stream
            image_obj_nums.append(obj_num)
            wm = re.search(rb"/Width\s+(\d+)", dict_window)
            hm = re.search(rb"/Height\s+(\d+)", dict_window)
            if wm and hm:
                image_mpx += (int(wm.group(1)) * int(hm.group(1))) / 1e6
            nbytes = body_end - body_start
            image_bytes += nbytes
            if b"/DCTDecode" in dict_window and nbytes >= HEADSHOT_MIN_BYTES:
                has_headshot = True
    # Effective rasters: drop streams that some image references as its /SMask.
    # Streams whose object number can't be recovered count conservatively.
    n_rasters = sum(1 for n in image_obj_nums if n is None or n not in smask_refs)

    # Shadings: raw scan plus decompressed Flate streams (belt-and-braces).
    shading_counts: Counter = Counter(
        int(m.group(1)) for m in re.finditer(rb"/ShadingType\s+(\d)", data)
    )
    decompressed: list[bytes] = []
    for body_start, body_end, dict_window in spans:
        if b"/FlateDecode" not in dict_window:
            continue
        try:
            decompressed.append(zlib.decompress(data[body_start:body_end]))
        except zlib.error:
            continue  # predictor-coded or partial streams: not content streams
    for blob in decompressed:
        for m in re.finditer(rb"/ShadingType\s+(\d)", blob):
            shading_counts[int(m.group(1))] += 1

    # Text heuristic: text-showing operators + operand bytes in content streams.
    text_ops = 0
    operand_bytes = 0
    est_glyphs = 0
    content_streams = [b for b in decompressed if b"BT" in b and b"Tf" in b]
    # Uncompressed content streams, if any:
    for body_start, body_end, dict_window in spans:
        if b"/FlateDecode" in dict_window or re.search(rb"/Subtype\s*/Image", dict_window):
            continue
        raw = data[body_start:body_end]
        if b"BT" in raw and b"Tf" in raw:
            content_streams.append(raw)
    # Skia often emits one Tj per glyph with 1-byte codes (<89> Tj), so the
    # glyph estimate is bytes-based with a floor of 1 glyph per non-empty op.
    for cs in content_streams:
        for m in re.finditer(rb"<([0-9A-Fa-f\s]+)>\s*Tj", cs):
            text_ops += 1
            hexlen = len(re.sub(rb"\s", b"", m.group(1)))
            operand_bytes += hexlen // 2
            est_glyphs += max(1, hexlen // 4) if hexlen else 0
        for m in re.finditer(rb"\(((?:[^()\\]|\\.)*)\)\s*Tj", cs, re.S):
            text_ops += 1
            operand_bytes += len(m.group(1))
            est_glyphs += len(m.group(1))
        for m in re.finditer(rb"\[((?:[^\[\]\\]|\\.)*)\]\s*TJ", cs, re.S):
            text_ops += 1
            arr = m.group(1)
            for hm in re.finditer(rb"<([0-9A-Fa-f\s]+)>", arr):
                hexlen = len(re.sub(rb"\s", b"", hm.group(1)))
                operand_bytes += hexlen // 2
                est_glyphs += max(1, hexlen // 4) if hexlen else 0
            for sm in re.finditer(rb"\(((?:[^()\\]|\\.)*)\)", arr, re.S):
                operand_bytes += len(sm.group(1))
                est_glyphs += len(sm.group(1))

    # Link annotations + internal destinations. NB: grep /Dest, never /GoTo —
    # Chrome does not emit GoTo actions for internal links.
    n_links = len(re.findall(rb"/Subtype\s*/Link", data))
    n_dests = len(re.findall(rb"/Dest", data))
    uris = [
        m.group(1).decode("latin-1")
        for m in re.finditer(rb"/URI\s*\(((?:[^()\\]|\\.)*)\)", data)
    ]

    return PdfStats(
        n_pages=n_pages,
        media_boxes=media_boxes,
        n_image_xobjects=n_images,
        n_image_rasters=n_rasters,
        image_mpx=image_mpx,
        image_bytes=image_bytes,
        has_headshot_jpeg=has_headshot,
        shading_type_counts=shading_counts,
        text_op_count=text_ops,
        text_operand_bytes=operand_bytes,
        est_glyphs=est_glyphs,
        n_link_annots=n_links,
        n_dest_refs=n_dests,
        uris=uris,
    )


# ── Optional-tool helpers ────────────────────────────────────────────────────
def pdftotext_words(pdf_path: Path) -> Optional[int]:
    tool = which("pdftotext")
    if not tool:
        return None
    proc = subprocess.run([tool, str(pdf_path), "-"], capture_output=True, timeout=120)
    if proc.returncode != 0:
        return None
    return len(proc.stdout.split())


def _parse_pgm(path: Path) -> tuple[int, int, bytes]:
    """Minimal binary PGM (P5) reader — pdftoppm -gray output."""
    data = path.read_bytes()
    tokens: list[bytes] = []
    i = 0
    while len(tokens) < 4 and i < len(data):
        c = data[i:i + 1]
        if c == b"#":  # comment to end of line
            i = data.find(b"\n", i)
            if i == -1:
                break
            i += 1
        elif c.isspace():
            i += 1
        else:
            j = i
            while j < len(data) and not data[j:j + 1].isspace():
                j += 1
            tokens.append(data[i:j])
            i = j
    if len(tokens) < 4 or tokens[0] != b"P5":
        raise ValueError(f"not a binary PGM: {path}")
    w, h, maxval = int(tokens[1]), int(tokens[2]), int(tokens[3])
    if maxval > 255:
        raise ValueError("16-bit PGM unsupported")
    pixels = data[i + 1:i + 1 + w * h]
    if len(pixels) < w * h:
        raise ValueError(f"truncated PGM: {path}")
    return w, h, pixels


def trailing_blank_fraction(pgm_path: Path) -> float:
    """Bottom-up ink scan: fraction of trailing rows matching the background."""
    w, h, pix = _parse_pgm(pgm_path)
    bottom_rows = pix[max(0, (h - 5)) * w:]
    bg = Counter(bottom_rows).most_common(1)[0][0]
    noise_budget = max(1, w // 100)
    blank = 0
    for row in range(h - 1, -1, -1):
        r = pix[row * w:(row + 1) * w]
        nonbg = sum(1 for v in r if abs(v - bg) > 4)
        if nonbg > noise_budget:
            break
        blank += 1
    return blank / h if h else 0.0


def render_pages_pgm(pdf_path: Path, out_dir: Path, dpi: int = 72) -> Optional[list[Path]]:
    tool = which("pdftoppm")
    if not tool:
        return None
    prefix = out_dir / (pdf_path.stem + "-pg")
    proc = subprocess.run(
        [tool, "-r", str(dpi), "-gray", str(pdf_path), str(prefix)],
        capture_output=True, timeout=300,
    )
    if proc.returncode != 0:
        return None
    pages = sorted(
        out_dir.glob(pdf_path.stem + "-pg-*.pgm"),
        key=lambda p: int(re.search(r"-pg-(\d+)\.pgm$", p.name).group(1)),  # type: ignore[union-attr]
    )
    return pages or None


def pymupdf_shading_type4(pdf_path: Path) -> Optional[int]:
    try:
        import fitz
    except Exception:
        return None
    try:
        doc = fitz.open(str(pdf_path))
        count = 0
        for xref in range(1, doc.xref_length()):
            try:
                obj = doc.xref_object(xref, compressed=True)
            except Exception:
                continue
            if obj and re.search(r"/ShadingType\s+4\b", obj):
                count += 1
        doc.close()
        return count
    except Exception:
        return None


# ── Per-mode verification ────────────────────────────────────────────────────
def verify_mode(
    mode: Mode,
    src_html: Path,
    base_html: str,
    chrome: str,
    work: Path,
    report: Report,
) -> None:
    mode_dir = work / mode.name
    mode_dir.mkdir(exist_ok=True)
    stage_siblings(src_html, mode_dir)  # folder-aware: siblings verbatim, HTML rewritten below
    pdf_path = mode_dir / f"{mode.name}.pdf"

    expected_h_pt: Optional[float] = None

    try:
        if mode.continuous:
            # Pass 1 — measure scrollHeight with the print-continuous layout live.
            measure_html = set_body_classes(base_html, mode.body_classes, inline_width_px=PAGE_W_PX)
            measure_html = inject_before_body_close(measure_html, MEASURE_SCRIPT % {"width": PAGE_W_PX})
            measure_path = mode_dir / "measure.html"
            measure_path.write_text(measure_html, encoding="utf-8")
            scroll_h = measure_scroll_height(chrome, work, measure_path)
            if scroll_h is None:
                report.add(mode.name, "measure", "FAIL", "pass 1 could not recover scrollHeight from --dump-dom")
                return
            page_h_px = min(scroll_h + SLACK_PX, CAP_PX)
            capped = page_h_px == CAP_PX
            expected_h_pt = page_h_px * PX_TO_PT
            report.add(mode.name, "measure", "INFO",
                       f"scrollHeight={scroll_h}px -> @page 816px x {page_h_px}px"
                       f"{' (CAPPED)' if capped else ''} -> expect {expected_h_pt:.1f}pt")

            # Pass 2 — static replica of the export-modal JS: classes + @page LAST in <head>.
            print_html = set_body_classes(base_html, mode.body_classes, inline_width_px=PAGE_W_PX)
            print_html = inject_head_last(
                print_html,
                f'<style id="continuous-page">@page{{size:{PAGE_W_PX}px {page_h_px}px;margin:0}}</style>',
            )
        else:
            print_html = set_body_classes(base_html, mode.body_classes, inline_width_px=None)

        print_path = mode_dir / "print.html"
        print_path.write_text(print_html, encoding="utf-8")
    except ValueError as exc:
        report.add(mode.name, "prepare", "FAIL", f"HTML rewrite failed: {exc}")
        return

    # 0 — RESUME NON-BLANK (spec §F): before --print-to-pdf, --dump-dom the
    # body-classed resume HTML and assert #resume-view has > 0 .resume-entry
    # children. portfolio.js runs under --virtual-time-budget=10000, so
    # renderResumeView() should have populated #resume-view; a blank view that
    # prints cleanly is a false PASS. Hard FAIL on 0 entries / missing view.
    if mode.is_resume:
        n_entries = count_resume_entries(chrome, work, print_path)
        if n_entries is None:
            report.add(mode.name, "resume-entries", "FAIL",
                       "#resume-view not found in rendered DOM (renderResumeView never built it)")
            return
        if n_entries == 0:
            report.add(mode.name, "resume-entries", "FAIL",
                       "#resume-view rendered with 0 .resume-entry children — blank resume would "
                       "print as a false PASS (renderResumeView produced no entries)")
            return
        report.add(mode.name, "resume-entries", "PASS",
                   f"#resume-view has {n_entries} .resume-entry children before print")

    if not print_to_pdf(chrome, work, print_path, pdf_path):
        report.add(mode.name, "render", "FAIL", "Chrome --print-to-pdf produced no output")
        return

    stats = analyze_pdf(pdf_path)
    size = pdf_path.stat().st_size

    # 1 — GEOMETRY
    if mode.continuous:
        if stats.n_pages == 1:
            report.add(mode.name, "geometry-pages", "PASS", "1 page")
        else:
            report.add(mode.name, "geometry-pages", "FAIL", f"{stats.n_pages} pages (want exactly 1)")
        if stats.media_boxes:
            x0, y0, x1, y1 = stats.media_boxes[0]
            w_pt, h_pt = x1 - x0, y1 - y0
            ok_w = abs(w_pt - LETTER_W_PT) <= GEOM_TOL_PT
            ok_h = expected_h_pt is not None and abs(h_pt - expected_h_pt) <= GEOM_TOL_PT
            report.add(mode.name, "geometry-size", "PASS" if (ok_w and ok_h) else "FAIL",
                       f"MediaBox {w_pt:.1f}x{h_pt:.1f}pt (want 612x{expected_h_pt:.1f} +/-{GEOM_TOL_PT}pt)")
        else:
            report.add(mode.name, "geometry-size", "FAIL", "no MediaBox found")
    else:
        bad = [
            (i, x1 - x0, y1 - y0)
            for i, (x0, y0, x1, y1) in enumerate(stats.media_boxes, 1)
            if abs((x1 - x0) - LETTER_W_PT) > GEOM_TOL_PT or abs((y1 - y0) - LETTER_H_PT) > GEOM_TOL_PT
        ]
        if stats.media_boxes and not bad:
            report.add(mode.name, "geometry-size", "PASS",
                       f"{stats.n_pages} page(s), all Letter 612x792pt")
        elif not stats.media_boxes:
            report.add(mode.name, "geometry-size", "FAIL", "no MediaBox found")
        else:
            first = bad[0]
            report.add(mode.name, "geometry-size", "FAIL",
                       f"{len(bad)} non-Letter page(s); e.g. page {first[0]}: {first[1]:.1f}x{first[2]:.1f}pt")

    # 2 — TRAILING BLANK (poppler-gated)
    if not mode.is_resume:
        pgms = render_pages_pgm(pdf_path, mode_dir)
        if pgms is None:
            report.add(mode.name, "trailing-blank", "SKIP",
                       "WARNING: pdftoppm not available/failed — blank-space scan skipped")
        else:
            fracs = [trailing_blank_fraction(p) for p in pgms]
            if mode.continuous:
                f = fracs[0]
                report.add(mode.name, "trailing-blank",
                           "PASS" if f <= CONTINUOUS_TRAILING_BLANK_MAX else "FAIL",
                           f"page 1 trailing blank {f:.1%} (max {CONTINUOUS_TRAILING_BLANK_MAX:.0%})")
            else:
                offenders = [
                    (i, f) for i, f in enumerate(fracs[:-1], 1)
                    if f > PAGINATED_TRAILING_BLANK_MAX
                ]
                if not offenders:
                    worst = max(fracs[:-1], default=0.0)
                    report.add(mode.name, "trailing-blank", "PASS",
                               f"worst non-last page {worst:.1%} (max {PAGINATED_TRAILING_BLANK_MAX:.0%})")
                else:
                    desc = ", ".join(f"p{i}={f:.0%}" for i, f in offenders[:4])
                    report.add(mode.name, "trailing-blank", "FAIL",
                               f"{len(offenders)} page(s) over {PAGINATED_TRAILING_BLANK_MAX:.0%}: {desc}")

    # 3 — SIZE BUDGET
    budget = mode.size_budget + (HEADSHOT_ALLOWANCE if stats.has_headshot_jpeg else 0)
    note = " (+300KB headshot allowance)" if stats.has_headshot_jpeg else ""
    if size <= budget:
        status = "PASS"
        if mode.size_target is not None and size > mode.size_target + (HEADSHOT_ALLOWANCE if stats.has_headshot_jpeg else 0):
            status = "WARN"
        report.add(mode.name, "size-budget", status,
                   f"{size / MB:.2f}MB <= {budget / MB:.2f}MB hard{note}")
    else:
        report.add(mode.name, "size-budget", "FAIL",
                   f"{size / MB:.2f}MB > {budget / MB:.2f}MB hard cap{note}")

    # 4 — RASTER BUDGET (scroll-smoothness proxy), stdlib XObject scan
    if not mode.is_resume:
        rb = RASTER_MAX_BYTES + (HEADSHOT_ALLOWANCE if stats.has_headshot_jpeg else 0)
        ok = (stats.n_image_rasters <= RASTER_MAX_XOBJECTS
              and stats.image_mpx <= RASTER_MAX_MPX
              and stats.image_bytes <= rb)
        report.add(mode.name, "raster-budget", "PASS" if ok else "FAIL",
                   f"{stats.n_image_rasters} rasters from {stats.n_image_xobjects} XObject streams "
                   f"(image+smask pair = 1; max {RASTER_MAX_XOBJECTS}), "
                   f"{stats.image_mpx:.2f}Mpx (max {RASTER_MAX_MPX}), "
                   f"{stats.image_bytes / KB:.0f}KB (max {rb / KB:.0f}KB){note}")

    # 5 — ZERO FUNCTION-BASED SHADINGS. The laggy baseline carried 40 of
    # these as ShadingType 1 (function-based); Type 4 (mesh) is equally
    # banned. Type 2/3 axial/radial gradients are cheap and only reported.
    n_fb = stats.shading_type_counts.get(1, 0) + stats.shading_type_counts.get(4, 0)
    others = {k: v for k, v in stats.shading_type_counts.items() if k not in (1, 4)}
    detail = (f"function-based (Type 1+4) count {n_fb}"
              + (f"; other shading types {dict(others)}" if others else ""))
    report.add(mode.name, "shadings", "PASS" if n_fb == 0 else "FAIL", detail)
    fitz_t4 = pymupdf_shading_type4(pdf_path)
    if fitz_t4 is not None and fitz_t4 != stats.shading_type_counts.get(4, 0):
        report.add(mode.name, "shadings-pymupdf", "FAIL",
                   f"PyMuPDF xref scan found {fitz_t4} Type-4 shadings "
                   f"(stdlib found {stats.shading_type_counts.get(4, 0)})")

    # 6 — TEXT ALIVE
    if stats.text_op_count == 0 or stats.text_operand_bytes == 0:
        report.add(mode.name, "text-alive", "FAIL",
                   "no text-showing operators — a filter leaked into print (ATS-dead)")
    else:
        words = pdftotext_words(pdf_path)
        if words is not None:
            report.add(mode.name, "text-alive", "PASS" if words >= mode.min_words else "FAIL",
                       f"pdftotext {words} words (min {mode.min_words}); "
                       f"stdlib: {stats.text_op_count} ops, ~{stats.est_glyphs} glyphs")
        else:
            report.add(mode.name, "text-alive", "WARN",
                       f"stdlib only (pdftotext absent): {stats.text_op_count} text ops, "
                       f"~{stats.est_glyphs} glyphs, {stats.text_operand_bytes} operand bytes — "
                       f"word floor ({mode.min_words}) not verified")

    # 7 — LINKS (TOC modes)
    if mode.toc_expected:
        has_dest = stats.n_dest_refs >= 1
        ok = stats.n_link_annots >= MIN_LINK_ANNOTS and has_dest
        uri_hosts = ", ".join(sorted({u.split("/")[2] if "://" in u else u.split(":")[0] for u in stats.uris})[:6]) or "none"
        report.add(mode.name, "links", "PASS" if ok else "FAIL",
                   f"{stats.n_link_annots} /Link annots (min {MIN_LINK_ANNOTS}), "
                   f"{stats.n_dest_refs} /Dest refs (min 1); URI targets: {uri_hosts}")

    report.add(mode.name, "artifact", "INFO", str(pdf_path))


# ── Reporting ────────────────────────────────────────────────────────────────
def print_table(report: Report) -> None:
    cols = ("MODE", "CHECK", "STATUS", "DETAIL")
    rows = [(c.mode, c.name, c.status, c.detail) for c in report.checks]
    w0 = max(len(cols[0]), *(len(r[0]) for r in rows)) if rows else len(cols[0])
    w1 = max(len(cols[1]), *(len(r[1]) for r in rows)) if rows else len(cols[1])
    w2 = max(len(cols[2]), *(len(r[2]) for r in rows)) if rows else len(cols[2])
    line = f"{{:<{w0}}}  {{:<{w1}}}  {{:<{w2}}}  {{}}"
    print(line.format(*cols))
    print(line.format("-" * w0, "-" * w1, "-" * w2, "-" * 40))
    for r in rows:
        print(line.format(*r))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Verify Hope portfolio PDF export via headless Chrome.")
    parser.add_argument("subject", type=Path, nargs="?", default=SUBJECT_DEFAULT,
                        help="portfolio folder or its index.html "
                             f"(default: {SUBJECT_DEFAULT})")
    parser.add_argument("--chrome", default=CHROME_DEFAULT, help=f"Chrome binary (default: {CHROME_DEFAULT})")
    parser.add_argument("--modes", default=",".join(m.name for m in MODES),
                        help="comma-separated subset of: " + ", ".join(m.name for m in MODES))
    parser.add_argument("--keep", action="store_true", help="keep the /tmp work directory (always printed)")
    args = parser.parse_args(argv)

    try:
        src_html = resolve_subject(args.subject)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    if not Path(args.chrome).is_file():
        print(f"ERROR: Chrome binary not found: {args.chrome}", file=sys.stderr)
        return 2

    wanted = [m.strip() for m in args.modes.split(",") if m.strip()]
    unknown = [m for m in wanted if m not in {x.name for x in MODES}]
    if unknown:
        print(f"ERROR: unknown mode(s): {', '.join(unknown)}", file=sys.stderr)
        return 2
    modes = [m for m in MODES if m.name in wanted]

    print(f"verify_portfolio_pdf: {src_html}")
    print(f"chrome: {args.chrome}")
    for tool in ("pdftoppm", "pdftotext", "pdfimages"):
        print(f"feature: {tool}: {'yes (' + which(tool) + ')' if which(tool) else 'no — dependent checks will SKIP'}")
    print(f"feature: PyMuPDF: {'yes' if has_pymupdf() else 'no — cross-check skipped'}")

    work = Path(tempfile.mkdtemp(prefix="verify-portfolio-pdf-"))
    print(f"workdir: {work}\n")

    base_html = load_html(src_html)
    report = Report()
    for mode in modes:
        verify_mode(mode, src_html, base_html, args.chrome, work, report)

    print_table(report)

    n_fail = len(report.hard_failures)
    n_pass = sum(1 for c in report.checks if c.status == "PASS")
    n_warn = sum(1 for c in report.checks if c.status == "WARN")
    n_skip = sum(1 for c in report.checks if c.status == "SKIP")
    print(f"\nRESULT: {'FAIL' if n_fail else 'PASS'} — "
          f"{n_pass} pass, {n_fail} fail, {n_warn} warn, {n_skip} skip")
    if not args.keep and not n_fail:
        shutil.rmtree(work, ignore_errors=True)
    else:
        print(f"artifacts kept: {work}")
    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
