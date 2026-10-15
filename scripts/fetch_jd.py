#!/usr/bin/env python3
"""fetch_jd.py - save a job posting as JD.md, straight from the job board's own API.

Give it a job link. It works out which applicant tracking system (ATS) hosts
the posting, fetches the posting through that system's public JSON API, and
writes JD.md in the shape the application skill expects (see
references/hunt-folder.md):

  # <Company> - <Role title> (<req id>)
  **Posting:** ... **Apply:** ... **Captured:** ... **Posted:** ... **Source:** ...
  **Location:** ... **Pay:** ... **Sponsorship:** <the posting's exact words>
  **Caps / limits:** ...
  ## The role / ## Must-haves / ## Nice-to-haves

Supported links:
  Greenhouse       job-boards.greenhouse.io/<board>/jobs/<id>
                   boards.greenhouse.io/<board>/jobs/<id>
                   .../embed/job_app?for=<board>&token=<id>
  Ashby            jobs.ashbyhq.com/<org>/<uuid>
  Lever            jobs.lever.co/<org>/<uuid>
  Workday          <tenant>.wdN.myworkdayjobs.com/<lang>/<site>/job/<path>
  SmartRecruiters  jobs.smartrecruiters.com/<Company>/<id>-<slug>
  Oracle HCM       <host>/.../sites/<site>/job/<id>  or  .../jobs/preview/<id>

Anything else (including LinkedIn) is not fetched: the script says to open the
link in the browser and paste the text, and exits 2.

Usage:
  fetch_jd.py <url>                                   print JD.md to the screen
  fetch_jd.py <url> --out applications/acme-designer/JD.md
  fetch_jd.py <url> --slug auto                       write applications/<company>-<role>/JD.md
  fetch_jd.py <url> --slug auto --hunt-dir ~/job-hunt --source "Recruiter email"

Exit codes: 0 = done, 2 = a problem you can fix (message says what).
Stdlib only (urllib). 20 second timeout per request.
"""
from __future__ import annotations

import argparse
import html
import json
import logging
import re
import socket
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

log = logging.getLogger(__name__)

USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
TIMEOUT_SECONDS = 20

UNKNOWN_SITE_MESSAGE = ("Hope cannot fetch this site by API. Open it in your browser "
                        "and paste the text; I will write JD.md from that.")

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# "$150,000 - $180,000", "$150,000.00 to $180,000.00 USD", "$150K - $180K".
PAY_PATTERN = re.compile(
    r"\$\s?\d{2,3},\d{3}(?:\.\d{2})?(?:\s*(?:USD|CAD|AUD))?\s*(?:-|\u2013|\u2014|to)\s*"
    r"\$?\s?\d{2,3},\d{3}(?:\.\d{2})?(?:\s*(?:USD|CAD|AUD))?"
    r"|\$\d{2,3}(?:\.\d)?[Kk]\s*(?:-|\u2013|\u2014|to)\s*\$?\d{2,3}(?:\.\d)?[Kk]")
SPONSOR_PATTERN = re.compile(
    r"sponsor|\bvisas?\b|H-?1B|work authoriz|authorized to work|right to work",
    re.IGNORECASE)
CAPS_PATTERN = re.compile(
    r"\bappl(?:y|ies|ied|ying|ications?)\b.*?\b(\d+)\b.*?\b(days?|months?)\b",
    re.IGNORECASE)

NICE_HEADINGS = ("nice to have", "nice-to-have", "nice to haves", "preferred", "bonus",
                 "strong candidates may also", "pluses", "a plus", "even better",
                 "extra credit", "would be great", "ideally")
MUST_HEADINGS = ("requirement", "qualification", "you'll need", "you will need",
                 "what you need", "looking for", "you have", "you bring", "good fit",
                 "about you", "who you are", "must have", "must-have", "we require",
                 "skills and experience", "your experience", "what you'll bring")

BLOCK_TAGS = {"p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol",
              "table", "tr", "section", "article", "header", "footer",
              "blockquote", "pre", "hr", "dl", "dt", "dd"}


class FetchError(Exception):
    """A problem the user can fix. The message is printed as is; exit code 2."""

    def __init__(self, message: str, code: Optional[int] = None) -> None:
        super().__init__(message)
        self.code = code


@dataclass
class Posting:
    """One job posting, the same shape for every ATS."""

    ats: str
    company: str
    title: str
    url: str
    apply_url: str = ""
    req_id: str = ""
    locations: List[str] = field(default_factory=list)
    is_remote: bool = False
    pay: str = ""
    text: str = ""
    posted: Optional[date] = None
    updated: Optional[date] = None
    posted_note: str = ""


# ---------------------------------------------------------------- http

def http_get_json(url: str) -> Any:
    """GET a URL and parse the JSON body. Raises FetchError with a plain message."""
    host = urllib.parse.urlsplit(url).netloc
    request = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    })
    log.debug("GET %s", url)
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = response.read()
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise FetchError("The posting was not found (HTTP 404). It may be closed, "
                             "or the link may be wrong.", exc.code)
        if exc.code in (401, 403):
            raise FetchError(f"The site refused the request (HTTP {exc.code}). Open the "
                             "link in your browser and paste the text.", exc.code)
        if exc.code == 429:
            raise FetchError("The site says too many requests (HTTP 429). Wait a minute "
                             "and try again.", exc.code)
        raise FetchError(f"The site answered HTTP {exc.code}. Try again later, or open "
                         "the link in your browser and paste the text.", exc.code)
    except (socket.timeout, TimeoutError):
        raise FetchError(f"{host} took longer than {TIMEOUT_SECONDS} seconds to answer. "
                         "Try again.")
    except urllib.error.URLError as exc:
        raise FetchError(f"Could not reach {host} ({exc.reason}). Check the link and "
                         "your internet connection.")
    try:
        return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise FetchError("The site did not return job data. Open the link in your "
                         "browser and paste the text.")


# ---------------------------------------------------------------- text helpers

class _HtmlText(HTMLParser):
    """Collect readable text from HTML: blocks become lines, list items '- ' lines."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: List[str] = []
        self.skip = 0

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag in ("script", "style"):
            self.skip += 1
        elif tag == "li":
            self.parts.append("\n- ")
        elif tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_startendtag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag in ("br", "hr"):
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        elif tag == "li" or tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip:
            self.parts.append(re.sub(r"\s*\n\s*", " ", data))


def tidy_text(raw: str) -> str:
    """Collapse spaces, join lone '-' with their text, keep at most one blank line."""
    raw = raw.replace("\xa0", " ").replace("\u200b", "").replace("\r", "")
    lines: List[str] = []
    pending_bullet = False
    for line in raw.split("\n"):
        line = re.sub(r"[ \t\f\v]+", " ", line).strip()
        if line in ("-", "- "):
            pending_bullet = True
            continue
        if pending_bullet and line:
            line = line if line.startswith("- ") else "- " + line
            pending_bullet = False
        lines.append(line)
    next_text = [""] * len(lines)
    upcoming = ""
    for i in range(len(lines) - 1, -1, -1):
        next_text[i] = upcoming
        if lines[i]:
            upcoming = lines[i]
    out: List[str] = []
    for i, line in enumerate(lines):
        if not line:
            prev = out[-1] if out else ""
            if not prev or (prev.startswith("- ") and next_text[i].startswith("- ")):
                continue
        out.append(line)
    text = "\n".join(out)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def html_to_text(markup: Optional[str]) -> str:
    """Turn posting HTML into clean text. Entities are unescaped; lists become '- ' lines."""
    if not markup:
        return ""
    parser = _HtmlText()
    parser.feed(markup)
    parser.close()
    return tidy_text("".join(parser.parts))


def sentences(text: str) -> List[str]:
    """Split text into sentences (line by line, then on . ! ?)."""
    found: List[str] = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("- "):
            line = line[2:]
        for part in re.split(r"(?<=[.!?])\s+", line):
            part = part.strip()
            if part:
                found.append(part)
    return found


def tidy_range(value: str) -> str:
    """Write pay ranges with a plain hyphen: '$150K' + dash + '$180K' -> '$150K - $180K'."""
    value = re.sub(r"\s*[\u2013\u2014]\s*", " - ", value)
    value = re.sub(r"(\d)-(\$)", r"\1 - \2", value)
    return " ".join(value.split())


def extract_pay(text: str) -> List[str]:
    """Pay ranges written in the text, e.g. '$150,000 - $180,000 USD'. Unique, max 3."""
    seen: List[str] = []
    for match in PAY_PATTERN.finditer(text):
        value = tidy_range(match.group(0))
        if value not in seen:
            seen.append(value)
    return seen[:3]


def extract_sponsorship(text: str) -> List[str]:
    """Sentences that mention sponsorship, visas or work authorization. Max 3."""
    hits: List[str] = []
    for sentence in sentences(text):
        if SPONSOR_PATTERN.search(sentence) and sentence not in hits:
            hits.append(sentence)
    return hits[:3]


def extract_caps(text: str) -> List[str]:
    """Sentences that limit how often you may apply, e.g. '3 applications in 6 months'."""
    hits: List[str] = []
    for sentence in sentences(text):
        if CAPS_PATTERN.search(sentence) and sentence not in hits:
            hits.append(sentence)
    return hits[:2]


def extract_years(text: str) -> str:
    """The first 'N+ years' bar in a sentence that mentions experience, or ''."""
    pattern = re.compile(
        r"\b\d{1,2}\s*\+?\s*(?:(?:-|\u2013|to)\s*\d{1,2}\s*\+?\s*)?years?\b", re.IGNORECASE)
    for sentence in sentences(text):
        if "experience" in sentence.lower():
            match = pattern.search(sentence)
            if match:
                return tidy_range(match.group(0))
    return ""


def _heading_kind(line: str) -> Optional[str]:
    """'must' or 'nice' if a short line reads like a requirements heading."""
    low = line.lower().replace("\u2019", "'").rstrip(":").strip()
    if any(word in low for word in NICE_HEADINGS):
        return "nice"
    if any(word in low for word in MUST_HEADINGS):
        return "must"
    return None


def pick_lists(text: str) -> Tuple[List[str], List[str]]:
    """Find the bullet lists under requirement-style and nice-to-have-style headings."""
    must: List[str] = []
    nice: List[str] = []
    current: Optional[str] = None
    bullets_since_heading = 0
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("- "):
            if current == "must":
                must.append(line)
            elif current == "nice":
                nice.append(line)
            bullets_since_heading += 1
            continue
        if len(line) <= 90:
            current = _heading_kind(line)
            bullets_since_heading = 0
        elif bullets_since_heading:
            current = None
    return must, nice


def parse_day(value: Any) -> Optional[date]:
    """Read the date part of an ISO string ('2026-10-02T...') or epoch milliseconds."""
    if isinstance(value, (int, float)) and value > 0:
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).date()
    if isinstance(value, str):
        match = re.match(r"(\d{4})-(\d{2})-(\d{2})", value)
        if match:
            try:
                return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
            except ValueError:
                return None
    return None


def format_day(day: Optional[date]) -> str:
    """'14 Oct 2026', the date style used across the hunt folder."""
    if day is None:
        return ""
    return f"{day.day} {MONTHS[day.month - 1]} {day.year}"


def name_from_slug(slug: str) -> str:
    """'happyrobot.ai' -> 'Happyrobot', 'acme-labs' -> 'Acme Labs'."""
    base = slug.split(".")[0]
    return " ".join(w.capitalize() for w in re.split(r"[-_\s]+", base) if w)


def slugify(company: str, title: str, max_role_words: int = 6) -> str:
    """'<company>-<role words>' in lowercase with hyphens."""
    def words(text: str) -> List[str]:
        text = re.sub(r"\([^)]*\)", " ", text)
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
        return re.findall(r"[a-z0-9]+", text.lower())
    return "-".join(words(company) + words(title)[:max_role_words])


def _money(amount: float, currency: str) -> str:
    """'$150,000' for dollars, '150,000 EUR' otherwise."""
    if currency.upper() in ("USD", "CAD", "AUD", ""):
        return f"${amount:,.0f}"
    return f"{amount:,.0f} {currency}"


# ---------------------------------------------------------------- per-ATS converters

def greenhouse_posting(job: Dict[str, Any], board: str) -> Posting:
    """Convert a Greenhouse job object (list or detail endpoint)."""
    text = html_to_text(html.unescape(job.get("content") or ""))
    pay_parts: List[str] = []
    ranges = job.get("pay_input_ranges") or []
    for item in ranges:
        low, high = item.get("min_cents"), item.get("max_cents")
        if low is None or high is None:
            continue
        currency = item.get("currency_type") or ""
        value = f"{_money(low / 100, currency)} - {_money(high / 100, currency)} {currency}".strip()
        label = (item.get("title") or "").strip().rstrip(":")
        pay_parts.append(f"{label}: {value}" if label and len(ranges) > 1 else value)
    location = ((job.get("location") or {}).get("name") or "").strip()
    job_id = str(job.get("id") or "")
    return Posting(
        ats="Greenhouse",
        company=(job.get("company_name") or name_from_slug(board)).strip(),
        title=(job.get("title") or "").strip(),
        url=job.get("absolute_url") or "",
        apply_url=(f"https://job-boards.greenhouse.io/embed/job_app?for={board}&token={job_id}"
                   if job_id else ""),
        req_id=str(job.get("requisition_id") or "").strip(),
        locations=[location] if location else [],
        is_remote="remote" in location.lower(),
        pay="; ".join(pay_parts),
        text=text,
        posted=parse_day(job.get("first_published")),
        updated=parse_day(job.get("updated_at")),
    )


def ashby_posting(job: Dict[str, Any], org: str) -> Posting:
    """Convert one job object from the Ashby job-board API."""
    locations = [job.get("location") or ""]
    locations += [(s or {}).get("location") or "" for s in job.get("secondaryLocations") or []]
    comp = job.get("compensation") or {}
    pay = comp.get("compensationTierSummary") or comp.get("scrapeableCompensationSalarySummary") or ""
    text = html_to_text(job.get("descriptionHtml")) or tidy_text(job.get("descriptionPlain") or "")
    return Posting(
        ats="Ashby",
        company=name_from_slug(org),
        title=(job.get("title") or "").strip(),
        url=job.get("jobUrl") or "",
        apply_url=job.get("applyUrl") or "",
        locations=[l.strip() for l in locations if l and l.strip()],
        is_remote=bool(job.get("isRemote")) or (job.get("workplaceType") or "").lower() == "remote",
        pay=tidy_range(pay),
        text=text,
        posted=parse_day(job.get("publishedAt")),
    )


def lever_posting(job: Dict[str, Any], org: str) -> Posting:
    """Convert one Lever posting object."""
    cats = job.get("categories") or {}
    locations = cats.get("allLocations") or ([cats["location"]] if cats.get("location") else [])
    parts = [job.get("description") or ""]
    for block in job.get("lists") or []:
        parts.append(f"<h3>{block.get('text') or ''}</h3><ul>{block.get('content') or ''}</ul>")
    parts.append(job.get("additional") or "")
    salary = job.get("salaryRange") or {}
    pay = ""
    if salary.get("min") is not None and salary.get("max") is not None:
        currency = salary.get("currency") or ""
        interval = (salary.get("interval") or "").replace("-", " ")
        pay = (f"{_money(float(salary['min']), currency)} - "
               f"{_money(float(salary['max']), currency)} {currency} {interval}").strip()
    return Posting(
        ats="Lever",
        company=name_from_slug(org),
        title=(job.get("text") or "").strip(),
        url=job.get("hostedUrl") or "",
        apply_url=job.get("applyUrl") or "",
        locations=[l.strip() for l in locations if l and l.strip()],
        is_remote=(job.get("workplaceType") or "").lower() == "remote",
        pay=" ".join(pay.split()),
        text=html_to_text("".join(parts)),
        posted=parse_day(job.get("createdAt")),
    )


# ---------------------------------------------------------------- link detection

def detect(url: str) -> Optional[Tuple[str, Dict[str, str]]]:
    """Return (ats, params) for a supported job link, or None."""
    parts = urllib.parse.urlsplit(url.strip())
    host = (parts.hostname or "").lower()
    segs = [urllib.parse.unquote(s) for s in parts.path.split("/") if s]
    query = urllib.parse.parse_qs(parts.query)

    if host.endswith("greenhouse.io"):
        if "for" in query and "token" in query:
            return "greenhouse", {"board": query["for"][0], "id": query["token"][0]}
        if len(segs) >= 3 and segs[1] == "jobs" and segs[2].isdigit():
            return "greenhouse", {"board": segs[0], "id": segs[2]}
        return None
    if host == "jobs.ashbyhq.com" and len(segs) >= 2:
        return "ashby", {"org": segs[0], "id": segs[1]}
    if host in ("jobs.lever.co", "jobs.eu.lever.co") and len(segs) >= 2:
        api = "api.eu.lever.co" if ".eu." in host else "api.lever.co"
        return "lever", {"org": segs[0], "id": segs[1], "api": api}
    wd = re.match(r"^([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com$", host)
    if wd and "job" in segs:
        cut = segs.index("job")
        before = segs[:cut]
        if before and re.match(r"^[a-z]{2}(-[A-Za-z]{2})?$", before[0]):
            before = before[1:]
        if before and len(segs) > cut + 1:
            return "workday", {"host": host, "tenant": wd.group(1), "site": before[-1],
                               "path": "/".join(segs[cut + 1:])}
        return None
    if host in ("jobs.smartrecruiters.com", "careers.smartrecruiters.com") and len(segs) >= 2:
        match = re.match(r"^(\d+)", segs[1])
        if match:
            return "smartrecruiters", {"company": segs[0], "id": match.group(1)}
        return None
    full = parts.path + ("#" + parts.fragment if parts.fragment else "")
    if host.endswith(".oraclecloud.com") or "/hcmUI/CandidateExperience/" in full:
        match = re.search(r"/(?:job|jobs/preview|requisitions/preview)/(\d+)", full)
        if match:
            site = re.search(r"/sites/([^/?#]+)", full)
            return "oracle", {"host": host, "id": match.group(1),
                              "site": site.group(1) if site else "CX_1"}
    return None


# ---------------------------------------------------------------- fetchers

def fetch_greenhouse(p: Dict[str, str], url: str) -> Posting:
    """Greenhouse job board API (questions and pay ranges included)."""
    api = (f"https://boards-api.greenhouse.io/v1/boards/{urllib.parse.quote(p['board'])}"
           f"/jobs/{p['id']}?questions=true&pay_transparency=true")
    return greenhouse_posting(http_get_json(api), p["board"])


def fetch_ashby(p: Dict[str, str], url: str) -> Posting:
    """Ashby job-board API; the board lists every posting, so pick ours by id."""
    api = (f"https://api.ashbyhq.com/posting-api/job-board/{urllib.parse.quote(p['org'])}"
           "?includeCompensation=true")
    data = http_get_json(api)
    for job in data.get("jobs") or []:
        if str(job.get("id")) == p["id"]:
            return ashby_posting(job, p["org"])
    raise FetchError(f"That posting is not on the {p['org']} board now. It may be closed.")


def fetch_lever(p: Dict[str, str], url: str) -> Posting:
    """Lever postings API, one posting by id."""
    api = (f"https://{p['api']}/v0/postings/{urllib.parse.quote(p['org'])}/"
           f"{urllib.parse.quote(p['id'])}")
    return lever_posting(http_get_json(api), p["org"])


def fetch_workday(p: Dict[str, str], url: str) -> Posting:
    """Workday candidate-experience API; the posting is in jobPostingInfo."""
    api = (f"https://{p['host']}/wday/cxs/{p['tenant']}/{p['site']}/job/"
           f"{urllib.parse.quote(p['path'], safe='/')}")
    info = (http_get_json(api) or {}).get("jobPostingInfo") or {}
    if not info:
        raise FetchError("Workday returned no posting for that link. It may be closed.")
    locations = [info.get("location") or ""] + list(info.get("additionalLocations") or [])
    return Posting(
        ats="Workday",
        company=name_from_slug(p["tenant"]),
        title=(info.get("title") or "").strip(),
        url=url,
        req_id=str(info.get("jobReqId") or "").strip(),
        locations=[l.strip() for l in locations if l and l.strip()],
        text=html_to_text(info.get("jobDescription")),
        posted=parse_day(info.get("startDate")),
        posted_note=(info.get("postedOn") or "").strip(),
    )


def fetch_smartrecruiters(p: Dict[str, str], url: str) -> Posting:
    """SmartRecruiters postings API; the text lives in jobAd.sections."""
    api = (f"https://api.smartrecruiters.com/v1/companies/{urllib.parse.quote(p['company'])}"
           f"/postings/{p['id']}")
    data = http_get_json(api)
    sections = ((data.get("jobAd") or {}).get("sections") or {})
    parts = []
    for key in ("companyDescription", "jobDescription", "qualifications", "additionalInformation"):
        sec = sections.get(key) or {}
        if sec.get("text"):
            parts.append(f"<h3>{sec.get('title') or ''}</h3>{sec['text']}")
    loc = data.get("location") or {}
    return Posting(
        ats="SmartRecruiters",
        company=((data.get("company") or {}).get("name") or p["company"]).strip(),
        title=(data.get("name") or "").strip(),
        url=data.get("postingUrl") or url,
        apply_url=data.get("applyUrl") or "",
        req_id=str(data.get("refNumber") or "").strip(),
        locations=[loc["fullLocation"]] if loc.get("fullLocation") else [],
        is_remote=bool(loc.get("remote")),
        text=html_to_text("".join(parts)),
        posted=parse_day(data.get("releasedDate")),
    )


def fetch_oracle(p: Dict[str, str], url: str) -> Posting:
    """Oracle HCM recruiting API (requisition details by id and site)."""
    api = (f"https://{p['host']}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails"
           f"?expand=all&onlyData=true&finder=ById;Id=%22{p['id']}%22,siteNumber={p['site']}")
    items = (http_get_json(api) or {}).get("items") or []
    if not items:
        raise FetchError("Oracle returned no posting for that link. It may be closed, or "
                         "the site number may be different.")
    item = items[0]
    parts = [item.get(k) or "" for k in
             ("ExternalDescriptionStr", "ExternalResponsibilitiesStr", "ExternalQualificationsStr")]
    locations = [item.get("PrimaryLocation") or ""]
    locations += [(s or {}).get("Name") or "" for s in item.get("secondaryLocations") or []]
    return Posting(
        ats="Oracle HCM",
        company=name_from_slug(p["host"].split(".")[0]),
        title=(item.get("Title") or "").strip(),
        url=url,
        req_id=str(item.get("Id") or p["id"]),
        locations=[l.strip() for l in locations if l and l.strip()],
        is_remote=(item.get("WorkplaceTypeCode") or "").upper() == "ORA_REMOTE",
        text=html_to_text("".join(parts)),
        posted=parse_day(item.get("ExternalPostedStartDate")),
    )


FETCHERS = {
    "greenhouse": fetch_greenhouse,
    "ashby": fetch_ashby,
    "lever": fetch_lever,
    "workday": fetch_workday,
    "smartrecruiters": fetch_smartrecruiters,
    "oracle": fetch_oracle,
}


# ---------------------------------------------------------------- JD.md

def render_jd(posting: Posting, link: str, captured: date, source: str) -> str:
    """Write the JD.md text in the hunt-folder shape."""
    title = f"# {posting.company} - {posting.title}"
    if posting.req_id:
        title += f" ({posting.req_id})"
    apply_url = posting.apply_url if posting.apply_url and posting.apply_url != link else "same link"
    posted = format_day(posting.posted) or posting.posted_note or "not shown"
    if posting.updated and posting.updated != posting.posted:
        posted += f" (updated {format_day(posting.updated)})"
    pay = posting.pay or "; ".join(extract_pay(posting.text)) or "not published"
    spons = extract_sponsorship(posting.text)
    caps = extract_caps(posting.text)
    location = "; ".join(posting.locations) or "not stated"
    if posting.is_remote and "remote" not in location.lower():
        location += " (remote allowed)"
    must, nice = pick_lists(posting.text)
    missing = "Not picked out automatically. Read The role above and copy them here."
    lines = [
        title,
        "",
        f"**Posting:** {link} · **Apply:** {apply_url} · **Captured:** {format_day(captured)}"
        f" · **Posted:** {posted} · **Source:** {source}",
        f"**Location:** {location} · **Pay:** {pay} · **Sponsorship:** "
        + (" / ".join(f'"{s}"' for s in spons) if spons else "not stated"),
        "**Caps / limits:** " + (" / ".join(f'"{c}"' for c in caps) if caps else "none stated"),
        "",
        "## The role",
        "",
        posting.text or "(The posting had no description text.)",
        "",
        "## Must-haves",
        "",
        "\n".join(must) if must else missing,
        "",
        "## Nice-to-haves",
        "",
        "\n".join(nice) if nice else missing,
        "",
    ]
    return "\n".join(lines)


def resolve_out(args: argparse.Namespace, posting: Posting) -> Tuple[Optional[Path], str]:
    """Work out where JD.md goes. Returns (path or None for the screen, slug)."""
    slug = ""
    if args.slug:
        slug = slugify(posting.company, posting.title) if args.slug == "auto" else args.slug
    if args.out:
        out = Path(args.out.replace("<slug>", slug) if slug else args.out)
    elif slug:
        out = Path("applications") / slug / "JD.md"
    else:
        return None, slug
    if not out.is_absolute():
        out = args.hunt_dir / out
    return out, slug


def main(argv: List[str]) -> int:
    """Entry point. Returns the exit code."""
    logging.basicConfig(level=logging.WARNING, format="%(message)s")
    parser = argparse.ArgumentParser(
        description="Fetch a job posting through its ATS API and write JD.md. "
                    "Supports Greenhouse, Ashby, Lever, Workday, SmartRecruiters, Oracle HCM.",
        epilog="examples:\n"
               "  fetch_jd.py https://job-boards.greenhouse.io/acme/jobs/123\n"
               "  fetch_jd.py https://jobs.ashbyhq.com/acme/<uuid> --slug auto\n"
               "  fetch_jd.py https://jobs.lever.co/acme/<uuid> --out applications/acme-designer/JD.md",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("url", help="the job link")
    parser.add_argument("--out", help="where to write JD.md (may contain <slug>); "
                                      "default: print to the screen")
    parser.add_argument("--slug", help="'auto' for <company>-<role words>, or your own slug; "
                                       "without --out, writes applications/<slug>/JD.md")
    parser.add_argument("--hunt-dir", default=".", type=Path,
                        help="the hunt folder; relative --out paths start here (default: .)")
    parser.add_argument("--source", default="not recorded",
                        help="where the link came from, e.g. 'Recruiter email' (default: not recorded)")
    parser.add_argument("--company", help="company name to use instead of the one the API gives")
    parser.add_argument("--force", action="store_true",
                        help="replace an existing JD.md (the first capture is the record)")
    args = parser.parse_args(argv)

    found = detect(args.url)
    if found is None:
        print(UNKNOWN_SITE_MESSAGE, file=sys.stderr)
        return 2
    ats, params = found
    try:
        posting = FETCHERS[ats](params, args.url)
    except FetchError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    if args.company:
        posting.company = args.company.strip()
    if not posting.title:
        print("The site returned a posting with no title. Open the link in your browser "
              "and paste the text.", file=sys.stderr)
        return 2

    markdown = render_jd(posting, args.url.strip(), date.today(), args.source)
    out, slug = resolve_out(args, posting)
    if out is None:
        print(markdown)
        return 0
    if out.exists() and not args.force:
        print(f"{out} already exists. The first capture is the record; pass --force to "
              "replace it.", file=sys.stderr)
        return 2
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(markdown, encoding="utf-8")
    print(f"Wrote {out} ({posting.ats}: {posting.company} - {posting.title}).")
    if slug:
        print(f"Folder slug: {slug}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
