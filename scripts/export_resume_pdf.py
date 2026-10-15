#!/usr/bin/env python3
"""export_resume_pdf.py - save the portfolio's résumé as the one résumé PDF.

Hope keeps one résumé at applications/_common/resume.pdf, exported from the
portfolio's résumé view. This script does what the user would do by hand:
open the portfolio, click Save as PDF, pick the content, style, font and fit,
and save. It drives the page's own export chooser in headless Chrome, so the
PDF is exactly what the chooser makes.

How it works:
  1. Copy the portfolio folder to a temp folder (the original is never changed).
  2. Add a small script to the copy's index.html. It waits for the page data,
     opens the chooser (#export-modal), ticks the radios, turns window.print
     into a no-op, and clicks #export-confirm. The page is then in the same
     résumé print state the chooser makes.
  3. Measure pass: read the résumé view's height at the print width (710.4px,
     Letter minus the 0.55in side margins) and count bullets that wrap past
     two lines.
  4. Print pass: headless Chrome --print-to-pdf at Letter, then count the
     pages in the PDF.
  5. Print one summary line and write the PDF.

Usage:
  export_resume_pdf.py <portfolio-folder>
  export_resume_pdf.py career-graph/documents/portfolios/jane-doe-2026-10-14 \\
      --out applications/_common/resume.pdf
  export_resume_pdf.py <portfolio-folder> --content top5 --style modern --fit auto
  export_resume_pdf.py <portfolio-folder> --hunt-dir ~/job-hunt

Defaults are the chooser's own: content highlights, style classic, the
style's font (classic: georgia; modern and compact: inter), fit comfortable.
Relative --out paths start at --hunt-dir (default: the current folder).

Output: one summary line, e.g.
  Résumé PDF: 1 page, 0 bullets over two lines, content fills 0.65 pages
  (content highlights, style classic, font georgia, fit comfortable)
  -> applications/_common/resume.pdf
then one line per bullet that runs past two lines, if any. The page count is
read from the PDF itself; "content fills" is the measured height / 960px.

Needs Google Chrome or Chromium (found automatically, or pass --chrome).
Exit codes: 0 = PDF written, 2 = a problem you can fix (the message says what).
Stdlib only.
"""
from __future__ import annotations

import argparse
import html
import json
import logging
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

sys.dont_write_bytecode = True  # importing the sibling verifier must not leave a __pycache__
sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_portfolio_pdf import (  # noqa: E402  (sibling script in this folder)
    analyze_pdf,
    dump_dom,
    inject_before_body_close,
    print_to_pdf,
    resolve_subject,
    stage_siblings,
)

log = logging.getLogger(__name__)

PRINT_WIDTH_PX = 710.4  # Letter 816px minus the template's 0.55in side margins
# Letter 1056px minus the template's 0.5in top and bottom @page margins. Same
# figure portfolio.js uses for its own auto-fit (RESUME_PAGE_CONTENT_H_PX).
PAGE_CONTENT_H_PX = 960

CONTENTS = ["highlights", "top5", "complete"]
STYLES = ["classic", "modern", "compact"]
FONTS = ["georgia", "times", "inter"]
FITS = ["comfortable", "auto"]
DEFAULT_FONT = {"classic": "georgia", "modern": "inter", "compact": "inter"}

CHROME_MAC = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
]
CHROME_ON_PATH = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"]
CHROME_WINDOWS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]

NO_CHROME_MESSAGE = (
    "Chrome was not found. Install Google Chrome (https://www.google.com/chrome/) or pass "
    "--chrome <path>; or open the portfolio's index.html, click Save as PDF, and save the "
    "file as applications/_common/resume.pdf."
)

# Injected before </body>, after portfolio.js. Drives the export chooser the
# way a person would, then (measure pass only) writes the numbers into a
# data attribute on <html> for --dump-dom to carry out.
DRIVER_SCRIPT = """
<script id="hope-export-driver">
(function () {
  var OPTS = %(opts)s;
  window.print = function () { window.__hopePrinted = true; };
  function report(obj) {
    document.documentElement.setAttribute('data-hope-export', JSON.stringify(obj));
  }
  function setRadio(name, value) {
    if (!document.querySelector('input[name="' + name + '"]')) return 'missing';
    var el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (!el) return 'no-option';
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  }
  function measure(view) {
    var prevWidth = document.body.style.width;
    document.body.style.width = OPTS.printWidth + 'px';
    void view.offsetHeight;
    var over = [];
    view.querySelectorAll('li, .resume-bullet').forEach(function (el) {
      var cs = getComputedStyle(el);
      var lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.2) || 14;
      var lines = Math.round(el.getBoundingClientRect().height / lh);
      var text = el.textContent.trim();
      if (lines > 2 && text.length > 40) over.push({ lines: lines, text: text.slice(0, 90) });
    });
    var height = view.scrollHeight;
    document.body.style.width = prevWidth;
    return { height: height, over: over };
  }
  function run() {
    var modal = document.getElementById('export-modal');
    var btn = document.getElementById('export-confirm');
    var view = document.getElementById('resume-view');
    var res = { modal: !!modal, confirm: !!btn, view: !!view, radios: {}, clicked: false };
    if (!modal || !btn || !view) { report(res); return; }
    modal.hidden = false;
    setRadio('export-doc', 'resume');  /* only in portfolios that offered a portfolio PDF */
    res.radios['export-content-resume'] = setRadio('export-content-resume', OPTS.content);
    if (res.radios['export-content-resume'] === 'missing' && OPTS.content === 'highlights') {
      res.radios['export-content-resume'] = 'absent';  /* older portfolio: one résumé view only */
    }
    res.radios['export-style-resume'] = setRadio('export-style-resume', OPTS.style);
    res.radios['export-font-resume'] = setRadio('export-font-resume', OPTS.font);
    res.radios['export-fit-resume'] = setRadio('export-fit-resume', OPTS.fit);
    for (var k in res.radios) {
      if (res.radios[k] !== 'ok' && res.radios[k] !== 'absent') { report(res); return; }
    }
    btn.click();
    res.clicked = true;
    res.printCalled = !!window.__hopePrinted;
    res.entries = view.querySelectorAll('.resume-entry').length;
    if (OPTS.measure) {
      var m = measure(view);
      res.height = m.height;
      res.over = m.over;
    }
    report(res);
  }
  function whenDataReady(fn) {
    var waited = 0;
    (function poll() {
      if (window.HOPE_DATA || waited >= 3000) { setTimeout(fn, 400); return; }
      waited += 100;
      setTimeout(poll, 100);
    })();
  }
  function start() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { whenDataReady(run); }, function () { whenDataReady(run); });
    } else {
      whenDataReady(run);
    }
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
</script>
"""


def find_chrome(explicit: Optional[str]) -> Optional[str]:
    """Return a Chrome or Chromium binary: --chrome, then $CHROME_PATH, then the usual places."""
    if explicit:  # an explicit path that does not exist is a mistake; do not guess past it
        return explicit if Path(explicit).is_file() else None
    env_path = os.environ.get("CHROME_PATH")
    for path in ([env_path] if env_path else []) + CHROME_MAC + CHROME_WINDOWS:
        if Path(path).is_file():
            return path
    for name in CHROME_ON_PATH:
        found = shutil.which(name)
        if found:
            return found
    return None


def stage_copy(src_html: Path, dest_dir: Path, opts: Dict[str, object]) -> Path:
    """Copy the portfolio folder into dest_dir and add the driver script to index.html."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    stage_siblings(src_html, dest_dir)
    page = src_html.read_text(encoding="utf-8")
    page = inject_before_body_close(page, DRIVER_SCRIPT % {"opts": json.dumps(opts)})
    out = dest_dir / src_html.name
    out.write_text(page, encoding="utf-8")
    return out


def read_driver_report(dom: str) -> Optional[Dict[str, object]]:
    """Pull the driver's JSON report out of the dumped DOM, or None if it never ran."""
    m = re.search(r'data-hope-export="([^"]*)"', dom)
    if not m:
        return None
    try:
        data = json.loads(html.unescape(m.group(1)))
    except ValueError as exc:
        log.warning(f"[export-resume] read_driver_report: bad JSON from the page: {exc}")
        return None
    return data if isinstance(data, dict) else None


def explain_missing(report: Dict[str, object], content: str) -> Optional[str]:
    """Say which part of the export chooser is missing, or None if everything was found."""
    parts = [name for name, key in (("#export-modal", "modal"), ("#export-confirm", "confirm"),
                                    ("#resume-view", "view")) if not report.get(key)]
    if parts:
        return ("This portfolio has no résumé export (missing " + ", ".join(parts) + "). "
                "Rebuild it with hope-portfolio from the current template.")
    radios = report.get("radios")
    bad: List[str] = []
    if isinstance(radios, dict):
        for name, state in radios.items():
            if state == "missing":
                bad.append(f"{name} (the whole choice)")
            elif state == "no-option":
                bad.append(f"{name} (no option for the value asked)")
    if bad:
        hint = ""
        if any(b.startswith("export-content-resume") for b in bad) and content != "highlights":
            hint = " Older portfolios only offer highlights: re-run without --content."
        return ("The Save as PDF chooser in this portfolio is missing: " + "; ".join(bad) + "."
                + hint + " Rebuild the portfolio with hope-portfolio from the current template, "
                "or open index.html and use Save as PDF.")
    return None


def main(argv: List[str]) -> int:
    """Entry point. Returns the exit code."""
    logging.basicConfig(level=logging.WARNING, format="%(message)s")
    parser = argparse.ArgumentParser(
        description="Save the portfolio's résumé as a PDF by driving its own Save as PDF "
                    "chooser in headless Chrome.",
        epilog="examples:\n"
               "  export_resume_pdf.py career-graph/documents/portfolios/<build> "
               "--out applications/_common/resume.pdf\n"
               "  export_resume_pdf.py <portfolio-folder> --content top5 --fit auto",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("portfolio", type=Path, help="the portfolio folder (or its index.html)")
    parser.add_argument("--content", choices=CONTENTS, default="highlights",
                        help="which bullets: highlights (the curated résumé), top5 (5 per role), "
                             "complete (every contribution). Default: highlights")
    parser.add_argument("--style", choices=STYLES, default="classic", help="default: classic")
    parser.add_argument("--font", choices=FONTS,
                        help="default: the style's font (classic: georgia; modern, compact: inter)")
    parser.add_argument("--fit", choices=FITS, default="comfortable",
                        help="auto shrinks type (never below 10pt) to save a page. "
                             "Default: comfortable")
    parser.add_argument("--out", default="applications/_common/resume.pdf",
                        help="where to write the PDF; relative paths start at --hunt-dir "
                             "(default: applications/_common/resume.pdf)")
    parser.add_argument("--hunt-dir", type=Path, default=Path("."),
                        help="the hunt folder (default: .)")
    parser.add_argument("--chrome", help="path to Chrome or Chromium (default: found automatically)")
    args = parser.parse_args(argv)

    try:
        src_html = resolve_subject(args.portfolio)
    except FileNotFoundError as exc:
        print(f"{exc}. Pass the portfolio folder (the one with index.html in it).", file=sys.stderr)
        return 2

    chrome = find_chrome(args.chrome)
    if chrome is None:
        prefix = f"No Chrome at {args.chrome}. " if args.chrome else ""
        print(prefix + NO_CHROME_MESSAGE, file=sys.stderr)
        return 2

    font = args.font or DEFAULT_FONT[args.style]
    out = Path(args.out).expanduser()
    if not out.is_absolute():
        out = args.hunt_dir.expanduser() / out
    opts: Dict[str, object] = {"content": args.content, "style": args.style, "font": font,
                               "fit": args.fit, "printWidth": PRINT_WIDTH_PX, "measure": False}

    work = Path(tempfile.mkdtemp(prefix="hope-export-resume-"))
    try:
        # Measure pass: drive the chooser, then read the numbers back from the DOM.
        measure_html = stage_copy(src_html, work / "measure", {**opts, "measure": True})
        report = read_driver_report(dump_dom(chrome, work, measure_html))
        if report is None:
            print("The page did not finish loading in headless Chrome, so nothing was saved. "
                  "Open index.html, click Save as PDF, and save the file as "
                  "applications/_common/resume.pdf.", file=sys.stderr)
            return 2
        problem = explain_missing(report, args.content)
        if problem:
            print(problem, file=sys.stderr)
            return 2
        if report.get("radios", {}).get("export-content-resume") == "absent":
            log.warning("Note: this portfolio has no Content choice, so it prints its one résumé view.")
        if not report.get("entries"):
            print("The résumé view is empty (no roles rendered), so nothing was saved. Check the "
                  "resume section of the portfolio's data.js, then run this again.", file=sys.stderr)
            return 2

        # Print pass: same chooser clicks, then Chrome's own PDF printer.
        print_html = stage_copy(src_html, work / "print", opts)
        pdf_tmp = work / "resume.pdf"
        if not print_to_pdf(chrome, work, print_html, pdf_tmp):
            print("Chrome did not produce a PDF. Open index.html, click Save as PDF, and save "
                  "the file as applications/_common/resume.pdf.", file=sys.stderr)
            return 2
        pages = analyze_pdf(pdf_tmp).n_pages
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(pdf_tmp, out)
    finally:
        shutil.rmtree(work, ignore_errors=True)

    over = report.get("over") if isinstance(report.get("over"), list) else []
    height = report.get("height")
    measured = (f", content fills {float(height) / PAGE_CONTENT_H_PX:.2f} pages"
                if isinstance(height, (int, float)) else "")
    print(f"Résumé PDF: {pages} page{'s' if pages != 1 else ''}, {len(over)} bullet"
          f"{'s' if len(over) != 1 else ''} over two lines{measured} (content {args.content}, "
          f"style {args.style}, font {font}, fit {args.fit}) -> {out}")
    for item in over:
        if isinstance(item, dict):
            print(f"  over two lines ({item.get('lines')} lines): {item.get('text')}")
    if over or pages > 2:
        where = ("resume.experience[].bullets" if args.content == "highlights"
                 else "experience[].groups[].contributions")
        print(f"  To tighten: shorten the bullets above in the portfolio's data.js ({where}), "
              "or re-run with --fit auto.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
