# Persona Fixture · Jane Doe

A fictional persona used for testing Hope skills without requiring real user PII.

## Who Jane is

- **Name:** Jane Doe
- **Role:** Senior Product Designer
- **Years experience:** 9
- **Location:** Brooklyn, NY
- **Domain:** B2B SaaS, focus on developer tools and design systems
- **Companies (chronological):** Indie design studio (2017–2019), Linear (2019–2022), Figma (2022–present)
- **Standout work:** Led Figma's design-system consolidation across 12 product teams, achieving 37% surface-area unification in 8 months.
- **Looking for:** Senior IC role at AI-first or design-mature company. Prefers hybrid; SF/NYC/remote OK.
- **Constraint to remember:** Has a young child; unable to travel >25%.

## Files

- **`resume.txt`**: plain text résumé. Use this to test the Onboarding skill's résumé-extraction flow.
- **`profile.json`**: pre-populated career graph in Hope's schema. Use this to test downstream skills (Portfolio, Find jobs, Apply, and so on) without re-running Onboarding.
- **`sample-portfolio/`**: a built portfolio, for the Portfolio and Publish skills.
- **`hunt/`**: Jane's hunt folder in the middle of a hunt (Hope 2.0). This is the folder a user runs Hope in, minus `career-graph/` (copy `profile.json` there when a skill needs it).

### The `hunt/` tree

```
hunt/
  HUNT-PROTOCOL.md                       Jane's rulebook: canon, rules, lessons (filled from the template)
  job-tracker.xlsx                       the one live log, built by scripts/tracker.py (3 rows, see below)
  applications/
    _common/
      profile.md                         the application profile: every answer a form asks
      my-voice.md                        fictional writing samples and learned edit patterns
      interview-stories.md               the detail behind each résumé bullet
    _research/
      boards.txt                         3 real public boards: greenhouse:anthropic, ashby:ramp, lever:palantir
      shortlist-2026-10-14.md            produced by scripts/sweep_boards.py on 14 Oct 2026 (live data, will go stale)
      shortlist-2026-10-14.json          the JSON copy the sweep writes next to it
    acme-senior-product-designer/        one role folder, Acme Design Systems / Senior Product Designer
      JD.md
      APPLICATION-ANSWERS.md
      INTERVIEW-PREP.md
      debrief-sam-lee-2026-10-02.md
```

The tracker has one row per stage, all invented companies:

| Status | Company | Role | Package |
|---|---|---|---|
| Shortlisted | Northwind Labs | Senior Product Designer, Design Systems | - |
| Applied - confirmed | Contoso | Senior Product Designer | - |
| Interviewing - hiring manager round next | Acme Design Systems | Senior Product Designer | `applications/acme-senior-product-designer/` |

It was built with `tracker.py init`, three `add` calls and two `update` calls, so the Acme row shows the note format (`2 Oct 2026: ... || 29 Sep 2026: ... || 18 Sep 2026: ...`). The backups those writes made were deleted; only `job-tracker.xlsx` ships.

## How to use in testing

Run every command from the repo root. Commands that write files point at a copy of the hunt folder, so the fixture stays as it is:

```bash
cp -R assets/fixtures/persona-jane-doe/hunt /tmp/jane-hunt
```

1. **Test Onboarding:** Start a fresh session, upload `resume.txt`, and let Hope onboard Jane. Compare the resulting graph to `profile.json`. For part 2 (the application profile and the hunt folder), compare what Hope writes with `hunt/applications/_common/profile.md` and `hunt/HUNT-PROTOCOL.md`.

2. **Test Portfolio:** Copy `profile.json` to `career-graph/career.json` and ask Hope to "make my portfolio for Anthropic." Verify the generated HTML matches Hope's design system and the content is sensible.

3. **Test Tracker:** Read the fixture tracker. Expect 3 rows and one "Needs you" row (Acme).

   ```bash
   python3 scripts/tracker.py report --hunt-dir assets/fixtures/persona-jane-doe/hunt
   python3 scripts/tracker.py list --hunt-dir assets/fixtures/persona-jane-doe/hunt --status Applied
   ```

   To test a write, use the copy. Check that a `job-tracker.backup-<date>-update.xlsx` appears next to it and that the new note sits in front of the old ones:

   ```bash
   python3 scripts/tracker.py update --hunt-dir /tmp/jane-hunt --match "Contoso" --status Rejected --note "Rejection email, no reason given"
   ```

   Then ask Hope "where do I stand?" with `/tmp/jane-hunt` as the hunt folder.

4. **Test Find jobs (discovery):** Sweep the three boards in `boards.txt`, dedupe against the tracker, and write a fresh shortlist into the copy:

   ```bash
   python3 scripts/sweep_boards.py --hunt-dir /tmp/jane-hunt \
     --include "design system,product designer" --exclude-title "Intern,Manager"
   ```

   Expect all three boards to load and a `shortlist-<today>.md` with the rules, the boards, the blind spot and the dedupe method at the top. Compare it with `shortlist-2026-10-14.md`.

5. **Test Apply (application):** Pick any live Greenhouse job (the list is at `https://boards-api.greenhouse.io/v1/boards/anthropic/jobs`) and save its JD into the copy:

   ```bash
   python3 scripts/fetch_jd.py "https://job-boards.greenhouse.io/anthropic/jobs/<id>" --slug auto --hunt-dir /tmp/jane-hunt
   ```

   Expect `applications/anthropic-<role words>/JD.md` with the posting link, pay, the sponsorship sentence in the posting's own words, and the must-haves. Compare its shape with `acme-senior-product-designer/JD.md`. A LinkedIn or unknown link should print "Hope cannot fetch this site by API..." and exit 2.

6. **Test Interview:** Make the record-the-call reminder and open it in a calendar app:

   ```bash
   python3 scripts/make_ics.py --title "RECORD THE CALL - Acme / Sam Lee in 10 min" \
     --start 2026-10-15T12:50 --minutes 10 --alarm 10 --alarm 0 --free \
     --description "Start the recording before you join." --out /tmp/jane-hunt/reminder.ics
   ```

   Then transcribe any short recording (needs `pip install faster-whisper`; without it the script prints the install line and the fallback, and exits 2):

   ```bash
   python3 scripts/transcribe.py recording.m4a \
     --out /tmp/jane-hunt/applications/acme-senior-product-designer/transcript-2026-10-15-sam-lee.txt
   ```

   Compare the debrief Hope writes with `acme-senior-product-designer/debrief-sam-lee-2026-10-02.md`.

7. **Test the résumé export:** Save the sample portfolio's résumé as a PDF into the copy, the way the portfolio skill makes `applications/_common/resume.pdf`:

   ```bash
   python3 scripts/export_resume_pdf.py assets/fixtures/persona-jane-doe/sample-portfolio --hunt-dir /tmp/jane-hunt
   ```

   Expect one summary line, `Résumé PDF: 2 pages, 0 bullets over two lines, ... -> /tmp/jane-hunt/applications/_common/resume.pdf`, and a note that this older sample has no Content choice. Adding `--content top5` should exit 2 and name the missing choice. Without Chrome the script says how to install it or use Save as PDF, and exits 2.

## Why fictional

Hope's public repo never ships real user data. Jane is generic enough to test all skills, specific enough to feel real. The maker's actual data (which is what they really test with) stays private. The companies in the tracker and the Acme role folder are invented. The boards in `boards.txt` are real public job boards, and the shortlist lists their public postings as they were on 14 Oct 2026.
