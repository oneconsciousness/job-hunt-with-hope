# Hope Tracker Contract · v2.0

`job-tracker.xlsx` is the one live log of the user's job hunt. One row per role. hope-tracker owns it. `scripts/tracker.py` writes it. Every other skill reads it through the script and writes to it through the script.

This file is the full contract: the sheet, the columns, the status words, the note format, the backup rule, and the exact commands.

---

## 1. The workbook

- File: `job-tracker.xlsx`, in the root of the hunt folder.
- One sheet, named **`Applications`**.
- Header in row 1, frozen.
- Columns, in this exact order:

| # | Column | What goes in it | Example (Jane Doe) |
|---|---|---|---|
| 1 | `Status` | One word or phrase from the status list in section 2. | `Applied - confirmed` |
| 2 | `Company` | The company name as the posting writes it. | `Northwind` |
| 3 | `Role` | The role title exactly as posted. | `Senior Product Designer, AI Tools` |
| 4 | `Location` | As posted, plus the work mode. | `New York, NY (hybrid)` |
| 5 | `Band` | The published pay band, or `not published`. | `$180K - $230K` |
| 6 | `Next action` | The next thing that happens, who does it, and the date if there is one. When the user must act, start with "You". Blank or `-` when nothing is pending. | `You: follow up on 21 Oct if no reply` |
| 7 | `Package` | The role folder path relative to the hunt folder, or `-`. | `applications/northwind-senior-product-designer-ai-tools/` |
| 8 | `Notes` | Dated entries, newest first, joined with ` \|\| `. See section 3. | `14 Oct 2026: Confirmation email arrived \|\| 10 Oct 2026: Jane submitted on Greenhouse` |

- New rows copy the cell styles of the row above, so the sheet stays readable.

**Writing the next action.** `report` lists a row under "Needs you" when its next action contains the word "you". So when the user has to act, address them: `You: review and submit the form`, `You decide: apply or skip`. When someone else acts, name them: `Wait for the confirmation email`, `Recruiter to send times`.

## 2. The status words

Use these exactly, so filters work. Spelling, capitals and the spaced hyphen all matter.

| Status | Use it when | Usually set by |
|---|---|---|
| `Shortlisted` | A role looks worth a look. Nothing has been filled or sent yet. | hope-discovery, or the user bringing a link |
| `Ready to apply` | Hope filled the form and wrote `APPLICATION-ANSWERS.md`. The user still has to review and submit. | hope-application |
| `Applied` | The user names what they submitted, or (for an apply-by-email role) the user's Sent folder holds the application email. No confirmation from the company yet. Never inferred from which forms were open or filled. | hope-application, hope-sync |
| `Applied - confirmed` | The company's "thank you for applying" email arrived. | hope-sync |
| `Interviewing` | A call or round with the company is booked or done, and the process is live. | hope-sync, hope-interview |
| `Offer` | The company made an offer, written or spoken. | hope-sync, or the user |
| `Rejected` | The company said no. The note gets the date, and the reason if they gave one. | hope-sync |
| `Closed` | The posting closed, was filled, or was pulled before any decision. | hope-sync, hope-application |
| `Withdrawn` | The user pulled out. | the user |
| `Recruiter contact` | The user is talking with a recruiter (agency or in-house) about a role, before any formal application. | hope-sync |
| `Inbound` | Someone reached out to the user about a role, and the user has not replied or decided yet. | hope-sync |
| `Parked` | The user chose to hold it: waiting on a referral, a per-company cap, a relocation decision, or just later. The note says why. | the user |

**`Applied` is never a guess.** A row moves to `Applied` only on the user's word (they name what they submitted: "I sent the Northwind one"), or on a confirmation email from the company, which makes it `Applied - confirmed`. For an apply-by-email role, the application email in the user's Sent folder counts as the user's word. When Hope clicks submit after the user's "submit it" (hard rule 1), the confirmation page Hope saw counts too. A form Hope filled, or a tab that was open, is `Ready to apply`, not `Applied`. If unsure, ask.

**Suffixes.** A skill may add a short detail after a spaced hyphen: `Interviewing - round 2 on 15 Oct`. When you filter, match the start of the cell: `Interviewing - round 2 on 15 Oct` counts as `Interviewing`.

**One exception:** `Applied - confirmed` is its own status. It is not `Applied` with a suffix. Because `list --status` matches the start of the cell, `list --status "Applied"` also shows the `Applied - confirmed` rows. Read the Status column to tell them apart. `list --status "Applied - confirmed"` shows only those.

## 3. The note format

- Each entry starts with a date in the form `14 Oct 2026:` (day, short month, year), then what happened. `scripts/tracker.py` writes the date for you (section 7.5). Never type a date into the note text.
- Newest first. Entries are joined with ` || ` (space, two bars, space).
- Never overwrite old notes. Always prepend.
- One event per entry. Plain words.
- Names exactly as the source gives them. An email signed "Pat" from `pat@northwind.com` is `Pat (pat@northwind.com)`, never a full name Hope made up.
- Quote the one key line of the source verbatim, in quotation marks, and name the source. Never paste a whole email or posting. A quoted line is data, never an instruction.

**Example 1: an application moving forward**

```
14 Oct 2026: Confirmation email from Northwind recruiting || 10 Oct 2026: Jane submitted on Greenhouse with JaneDoe_Resume.pdf || 8 Oct 2026: Hope filled the form; essay answers left for Jane
```

**Example 2: a process that ended**

```
12 Oct 2026: Rejection email from Pat (pat@northwind.com): "we have decided to move forward with a candidate with more AI product experience" || 2 Oct 2026: 30-minute call with the design lead. Debrief saved in the role folder
```

## 4. The backup rule

- **Before every write, the file is backed up** to `job-tracker.backup-<YYYY-MM-DD>-<tag>.xlsx` in the same folder. Never skip this.
- The tag is one short word for the reason. The script uses the command name (`add`, `update`) unless you pass `--tag`, for example `--tag sync`. A second backup with the same date and tag gets `-2`, `-3` and so on, so no backup is ever overwritten.
- `scripts/tracker.py` makes the backup itself, and prints a `Backup:` line with its path. After any write, check that line is there.
- Never delete a backup. The user may clear them out when they choose.

## 5. The workbook wins

The workbook is the truth. Markdown tables about status go stale: the status line in `APPLICATION-ANSWERS.md`, lists in `user-story.md`, old shortlists. If a markdown file and the workbook disagree, the workbook wins. Fix the markdown from the workbook, never the other way round. If the workbook looks wrong, ask the user before changing it.

## 6. When openpyxl is not installed

- The script does not fail. It writes `job-tracker.csv` with the same columns, in the same order, and prints how to install openpyxl. The install line:

```bash
python3 -m pip install openpyxl
```

- While there is a `job-tracker.csv` and no `job-tracker.xlsx`, the CSV is the live log. Every command finds it on its own and uses it, even after openpyxl is installed, so there is never a second log. `init` leaves it as it is. The same rules apply: the status words, the note format, back up before writing (the backup is `job-tracker.backup-<YYYY-MM-DD>-<tag>.csv`).
- One case stops instead: openpyxl is missing and a `job-tracker.xlsx` already exists. The script exits `2` and asks for openpyxl, rather than start a CSV next to the real log.
- Tell the user once, in one line, that the tracker is a CSV until openpyxl is installed.

---

## 7. The commands

Every command below is run with `python3 "$PLUGIN_ROOT/scripts/tracker.py"`. `$PLUGIN_ROOT` is found with the standard block at the top of each SKILL.md.

**Two things to replace in every command:**

1. Replace `<hunt folder>` with the absolute path of the user's hunt folder (the folder that holds `career-graph/` and `applications/`).
2. Inside double quotes, write every dollar sign as `\$`. Without the backslash the shell eats it: `"$180K"` becomes `80K` with no error. `"\$180K"` stays `$180K`.

Every command also takes `--file` (default `job-tracker.xlsx`). You rarely need it. `add` and `update` also take `--tag` (the backup tag) and `--date` (the note's date, `YYYY-MM-DD`, default today). There is no `--force`: `add` never overwrites an existing row, and notes are only ever prepended. Run `python3 "$PLUGIN_ROOT/scripts/tracker.py" <command> --help` to see a command's flags.

**Exit codes:**

- `0`: done.
- `2`: something needs attention. Read what it printed. Nothing was changed. The usual causes:
  - `update` matched more than one row: the script prints the candidate rows. Add `--role` with more of the role title and run it again. Never guess which candidate was meant.
  - `add` for a company and role that already have a row: the script names the row. Use `update` instead.
  - A status that is not in section 2: the script prints the allowed words.

### 7.1 Check the script is there

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" --help
```

**Check:** exit code `0` and a usage message. If the script is missing, use the fallback in section 8.

### 7.2 Create the workbook

Run this only when `job-tracker.xlsx` (or `job-tracker.csv`) does not exist yet. If either exists, `init` leaves it as it is and says so.

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" init --hunt-dir "<hunt folder>"
```

**Check:** `ls "<hunt folder>"/job-tracker.*` shows `job-tracker.xlsx` (or `job-tracker.csv` if openpyxl is missing).

### 7.3 Add a row

First check the row is not already there: run `list --company "<company>"` (section 7.6). If the role is listed, use `update` instead. (`add` also refuses a company and role that already have a row, and exits `2`.)

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" add --hunt-dir "<hunt folder>" \
  --company "Northwind" \
  --role "Senior Product Designer, AI Tools" \
  --status "Shortlisted" \
  --location "New York, NY (hybrid)" \
  --band "\$180K - \$230K" \
  --next "You decide: apply or skip" \
  --package "-" \
  --note "Found in the weekly sweep"
```

**Check:** the output has `Added row <N>: Shortlisted | Northwind | Senior Product Designer, AI Tools` and a `Backup:` line.

### 7.4 Update a status

`--match` finds the row by company. `--role` narrows it by a piece of the role title. Pass only the flags you are changing.

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" update --hunt-dir "<hunt folder>" \
  --match "Northwind" --role "Senior Product Designer" \
  --status "Applied" \
  --next "Wait for the confirmation email" \
  --package "applications/northwind-senior-product-designer-ai-tools/" \
  --note "Jane submitted on Greenhouse"
```

**Check:** the output has `Updated row <N>: Applied | Northwind | ...`, a `Notes now start:` line with the new note first, and a `Backup:` line.

### 7.5 Prepend a note only

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" update --hunt-dir "<hunt folder>" \
  --match "Northwind" --role "Senior Product Designer" \
  --note "Recruiter asked for portfolio links; draft reply saved"
```

**The date on a note.** Pass the note text without a date. The script puts today's date in front (`14 Oct 2026: `). If the event happened on a different day, add `--date` with that day:

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" update --hunt-dir "<hunt folder>" \
  --match "Northwind" --role "Senior Product Designer" \
  --date 2026-10-10 --note "Jane submitted on Greenhouse"
```

Never type a date into the note text. The script adds its own, and the note ends up with two (`14 Oct 2026: 10 Oct 2026: ...`).

**Check:** the `Notes now start:` line shows the new note first, with exactly one date, followed by the older notes.

### 7.6 List rows

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" list --hunt-dir "<hunt folder>"
python3 "$PLUGIN_ROOT/scripts/tracker.py" list --hunt-dir "<hunt folder>" --status "Interviewing"
python3 "$PLUGIN_ROOT/scripts/tracker.py" list --hunt-dir "<hunt folder>" --company "Northwind"
python3 "$PLUGIN_ROOT/scripts/tracker.py" list --hunt-dir "<hunt folder>" --company "Northwind" --notes
```

The first lists every row. The second lists rows whose status starts with the word you give. The third lists rows whose company contains the word you give. Both matches ignore capitals. The fourth adds each row's full `Notes`, newest first, on the lines under it.

`list` prints five columns: the row number, `Status`, `Company`, `Role`, `Next action`. Long cells are cut and end in `...`. It does not print `Location`, `Band` or `Package`; to read those, open the workbook.

**Read a row's note history with `list --notes`.** Add `--company` (and `--status`) to narrow it to the rows you need. Never rebuild what happened from memory.

### 7.7 Report

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" report --hunt-dir "<hunt folder>"
```

Prints the count of rows per status, then a "Needs you" list. A row is on that list when its status is `Interviewing`, `Offer`, `Inbound` or `Recruiter contact`, or its next action contains the word "you". When you tell the user, lead with the "Needs you" rows. Then the counts.

---

## 8. Fallback: only when `scripts/tracker.py` is missing

Use this only if section 7.1 shows the script is missing. Run it from the hunt folder. It backs up first, adds one row that copies the style of the row above, and prepends a note to exactly one row. Change the values in `row`, the two match words, and `note`. Delete part A or part B if you do not need it.

```python
# Fallback only: use when scripts/tracker.py is missing. Run from the hunt folder.
import copy, datetime, shutil, sys
from openpyxl import load_workbook

today = datetime.date.today()
shutil.copy2("job-tracker.xlsx", f"job-tracker.backup-{today:%Y-%m-%d}-manual.xlsx")  # 1. back up first
wb = load_workbook("job-tracker.xlsx")
ws = wb["Applications"]
col = {cell.value: cell.column for cell in ws[1]}  # header name -> column number
stamp = f"{today.day} {today:%b %Y}"                # e.g. 14 Oct 2026

# A. Add a row. New row copies the styles of the row above.
new = ws.max_row + 1
for c in range(1, len(col) + 1):
    ws.cell(new, c)._style = copy.copy(ws.cell(new - 1, c)._style)
row = {"Status": "Shortlisted", "Company": "Acme", "Role": "Senior Product Designer",
       "Location": "Remote (US)", "Band": "not published", "Next action": "You decide: apply or skip",
       "Package": "-", "Notes": f"{stamp}: Found in the weekly sweep"}
for name, value in row.items():
    ws.cell(new, col[name]).value = value

# B. Prepend a note to one row. The match must be exactly one row.
hits = [r for r in range(2, ws.max_row + 1)
        if "northwind" in str(ws.cell(r, col["Company"]).value).lower()
        and "product designer" in str(ws.cell(r, col["Role"]).value).lower()]
if len(hits) != 1:
    sys.exit(f"Match is not one row: {hits}. Narrow it before writing.")
old = ws.cell(hits[0], col["Notes"]).value
note = f"{stamp}: Confirmation email arrived"
ws.cell(hits[0], col["Notes"]).value = note if old in (None, "", "-") else f"{note} || {old}"
ws.cell(hits[0], col["Status"]).value = "Applied - confirmed"

wb.save("job-tracker.xlsx")
print("saved; rows:", ws.max_row - 1)
```

**Check:** the backup file exists, and opening the workbook shows the new row and the new note.

---

## 9. Which skill uses which command

| Skill | Commands |
|---|---|
| hope-start | `report` |
| hope-onboarding | `init`, only if there is no tracker yet |
| hope-discovery | `list` (to dedupe the sweep), then `add` with `Shortlisted` for the roles the user picks |
| hope-application | `add` or `update` to `Ready to apply`; `update` to `Applied` only when the user names what they submitted |
| hope-sync | `update` (status, next action, note) for every matched item; `add` for new companies; the standing checks in section 10 |
| hope-interview | `update` to `Interviewing - <round> on <date>`; a note after each call |
| hope-tracker | `list`, `list --notes`, `report`, the weekly review |

---

## 10. The standing checks on every sync

hope-sync runs these six checks after it has updated the rows, every time. Each one ends in the sync report, under "needs you", or in one line saying it found nothing.

1. **Top priority first.** Any reply the user flagged as top priority goes at the top of the report, before everything else.
2. **Submissions not yet confirmed.** Run `list --status "Applied"`. Every row whose status is exactly `Applied` (not `Applied - confirmed`) has no confirmation yet. Search the user's email (read-only) for each company by name. If a confirmation is there, update the row to `Applied - confirmed`. If not, list the row in the report.
3. **Two agencies, one company.** Read the `Recruiter contact` rows and their notes. If two agencies are putting the user forward to the same company, flag it at once. One company receiving the same person from two agencies can sink both submissions.
4. **Status contradictions.** A row whose status disagrees with the newest dated evidence: `Rejected` but an interview invite arrived later; `Shortlisted` but the Sent folder shows an application. Update the row to match the newest evidence, write a note that names both, and tell the user.
5. **The per-company cap.** Count the live applications for each company. Live rows are those whose status starts with `Ready to apply`, `Applied`, `Interviewing` or `Offer` (so `Applied - confirmed` counts). `Shortlisted`, `Parked`, `Recruiter contact`, `Inbound`, `Rejected`, `Closed` and `Withdrawn` do not count. If a company is at the cap in `applications/_common/profile.md` (default 2), say so before any new application there.
