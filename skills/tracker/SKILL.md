---
name: hope-tracker
description: Use when the user wants to know where their job hunt stands or what needs them, wants to see, change or add rows in their tracker, or wants the weekly review. This skill owns job-tracker.xlsx, the one spreadsheet the user owns that logs every role in the hunt. Trigger phrases include "where do I stand", "what needs me", "show my tracker", "update the tracker", "add this to my tracker", "weekly review", "how's the hunt going", "funnel", "what's live", "mark X as rejected".
user-invocable: true
---

<!-- hope-skill-version: 2.0.0 -->

# Hope Tracker · One sheet you own

`job-tracker.xlsx` is the live log of the whole hunt: one sheet, one row per role, owned by the user. This skill keeps its shape, answers "where do I stand?", makes the changes the user asks for, and runs the weekly review. Every write goes through `scripts/tracker.py`, which backs the file up first.

## Before you start

Find the plugin root:

```bash
# Resolve the Hope plugin root (references/, assets/, scripts/ live there).
PLUGIN_ROOT=""
for c in "$CLAUDE_PLUGIN_ROOT" "$HOME"/.claude/plugins/cache/hope/hope/*/ "$HOME/.claude/plugins/marketplaces/hope"; do
  [ -n "$c" ] && [ -f "${c%/}/plugin.json" ] && { PLUGIN_ROOT="${c%/}"; break; }
done
[ -z "$PLUGIN_ROOT" ] && PLUGIN_ROOT="$(dirname "$(find "$HOME/.claude/plugins" -path '*hope*/plugin.json' -print -quit 2>/dev/null)")"
echo "PLUGIN_ROOT=$PLUGIN_ROOT"
```

If `PLUGIN_ROOT` is empty, ask the user where the Hope plugin is. Do not guess. **Check:** `ls "$PLUGIN_ROOT/scripts/tracker.py"` finds the file. If not, that folder is an older Hope: ask the user where Hope 2.0 is installed. Then read:

- `$PLUGIN_ROOT/references/tracker-contract.md`, all of it. It is this skill's contract.
- `$PLUGIN_ROOT/references/hard-rules.md`
- `$PLUGIN_ROOT/references/voice-guide.md` (principle 6: every question is a set of choices)
- In the hunt folder: `user-story.md`, `HUNT-PROTOCOL.md` (sections 4 and 5), `applications/_common/profile.md` (section 5, the per-company cap).

`<hunt folder>` below means the absolute path of the folder that holds `job-tracker.xlsx` and `applications/`.

## What you make

- Changes to `job-tracker.xlsx`, only through `$PLUGIN_ROOT/scripts/tracker.py` (`init`, `add`, `update`). The sheet `Applications` has eight columns, in this order: `Status` · `Company` · `Role` · `Location` · `Band` · `Next action` · `Package` · `Notes`.
- A backup before every write, made by the script: `job-tracker.backup-<YYYY-MM-DD>-<tag>.xlsx`.
- Answers in chat: where the user stands, and the weekly review. No markdown or CSV copy of the tracker is kept.
- One dated line in `user-story.md`.

## Steps

`tracker.py` below is short for `python3 "$PLUGIN_ROOT/scripts/tracker.py"`. Always run step 1. Then pick the step for what the user asked: "where do I stand", "what needs me", "what's live", "show my tracker" or "how's the hunt going" is step 2. A change is steps 3 and 4. A new role is steps 3 and 5. "Weekly review" is step 6, and "funnel" is its first part.

1. **Find the tracker.** Run `ls "<hunt folder>"/job-tracker.xlsx "<hunt folder>"/job-tracker.csv` and pick the case (backup files do not count):
   - `job-tracker.xlsx` is there: go on.
   - Only `job-tracker.csv` (no `.xlsx`): openpyxl is missing, and the CSV is the live log. Add `--file job-tracker.csv` to every `tracker.py` command, and use `job-tracker.csv` in the notes view. Never run `init` while it exists: that starts a second, empty log. Tell the user once: `python3 -m pip install openpyxl`.
   - Neither, and `applications/_common/profile.md` is missing too: offer hope-onboarding (part 2). It sets up the whole hunt folder, the tracker included.
   - Neither, but the profile exists: run `python3 "$PLUGIN_ROOT/scripts/tracker.py" init --hunt-dir "<hunt folder>"`.

   **Check:** `python3 "$PLUGIN_ROOT/scripts/tracker.py" report --hunt-dir "<hunt folder>"` exits `0` (with `--file job-tracker.csv` in the CSV case).

2. **"Where do I stand?"** Run `tracker.py report --hunt-dir "<hunt folder>"`, then the notes view below. The notes view prints each row with its status, role folder, the age of its newest note, and the start of its notes. Pass `live` to skip `Rejected`, `Closed` and `Withdrawn` rows, or `all` for every row.

```bash
date "+%A %d %B %Y"
python3 - "$PLUGIN_ROOT/scripts" "<hunt folder>/job-tracker.xlsx" live <<'PY'
import re, sys
from datetime import date, datetime
from pathlib import Path
sys.path.insert(0, sys.argv[1])
from tracker import read_rows
for r in read_rows(Path(sys.argv[2])):
    if sys.argv[3] == "live" and r.status.startswith(("Rejected", "Closed", "Withdrawn")):
        continue
    m = re.match(r"(\d{1,2} [A-Z][a-z]{2} \d{4}):", r.notes)
    age = (date.today() - datetime.strptime(m.group(1), "%d %b %Y").date()).days if m else "?"
    print(f"Row {r.number} | {r.status} | {r.company} | {r.role} | {r.package} | newest note {age} days ago")
    print(f"    {r.notes[:400]}")
PY
```

   Answer in five to ten lines, in this order:
   1. **Needs you:** every row the report lists under "Needs you" (a next action addressed to the user, or a status of `Interviewing`, `Offer`, `Inbound` or `Recruiter contact`). Each gives the company, the role, the posting link (the `**Posting:**` line in the role's `JD.md`) and the role folder path when the role has them, and the next action.
   2. **Overdue:** a next action whose date has already passed.
   3. **Stale:** a live row (not `Parked`) whose newest note is 14 or more days old, unless its next action names a date still to come.
   4. **The counts,** in one line: "3 roles: 1 shortlisted, 1 applied and confirmed, 1 interviewing."

   **Check:** every row the report printed under "Needs you" is in your answer.

3. **Before every write,** the user's own edits come first. They edit the sheet by hand too.
   - Check the file is not open: `ls -a "<hunt folder>" | grep -E '^(~\$|\.~lock\.)job-tracker'`. If it prints a name, say "Your tracker is open in Excel. Save and close it, then tell me." and wait. A write that fails with "Permission denied" means the same.
   - Read the row first: `tracker.py list --hunt-dir "<hunt folder>" --company "<company>"`. Change only the cells the user asked about, or that new evidence settles. A Status or Next action that no note explains was typed by the user, and it is theirs: ask before replacing it.
   - The script can only change `Status`, `Next action`, `Package` and `Notes`, and it only ever prepends to `Notes`, never replaces them. `Company`, `Role`, `Location` and `Band` are the user's to edit by hand.

   **Check:** the lock check printed nothing, and you know the row's current values.

4. **"Update the tracker" or "Mark X as Y."** One `update` per change, with a note that says what happened and who said so. Use `--date` when it happened on another day. Never type a date into the note text.

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" update --hunt-dir "<hunt folder>" \
  --match "Contoso" --role "Senior Product Designer" --status "Rejected" --next "-" \
  --date 2026-10-13 --note "Rejection email, no reason given (Jane told Hope)"
```

   - Status words come only from the list in "Rules for this skill". A detail may follow a spaced hyphen: `Interviewing - round 2 on 15 Oct`.
   - `Applied` only when the user names what they submitted. A confirmation email makes it `Applied - confirmed`.
   - Exit code `2`: the match fits more than one row, or none. Read the candidates it printed and ask the user which one (`AskUserQuestion`, the candidates as options). Never guess.

   **Check:** the output has `Updated row <N>`, a `Notes now start:` line with the new note first and one date, and a `Backup:` line.

5. **"Add this to my tracker."** Run `tracker.py list --company "<company>"` first. If the role is there, use `update`. Otherwise `add` with all eight columns:

```bash
python3 "$PLUGIN_ROOT/scripts/tracker.py" add --hunt-dir "<hunt folder>" \
  --company "Northwind Labs" --role "Design Engineer, Interfaces" --status "Shortlisted" \
  --location "Remote (US)" --band "not published" --next "You decide: apply or skip" \
  --package "-" --note "Jane added it from a LinkedIn post"
```

   - `Package`: run `ls -d "<hunt folder>"/applications/*/`. If a folder for this company and role exists, pass it (`applications/northwind-design-engineer-interfaces/`). Otherwise `-`.
   - Company, role, location and band come from the posting or the user. Missing: ask, never guess. Inside double quotes write every dollar sign as `\$`: `--band "\$170,000 - \$200,000"`.

   **Check:** the output has `Added row <N>: <status> | <company> | <role>` and a `Backup:` line.

6. **The weekly review.** Run `report`, then the notes view with `all`. Give the user these parts, in order:
   1. **The funnel.** One table, then one line on how you counted (the counts come from the Status column and the notes):

      | Stage | Count the rows where |
      |---|---|
      | Shortlisted | every row (every role that entered the tracker) |
      | Applied | the status starts with `Applied`, `Interviewing` or `Offer`, or a `Rejected` or `Withdrawn` row's notes show the user applied |
      | Screened | the status starts with `Interviewing` or `Offer`, or a `Rejected` or `Withdrawn` row's notes record a call |
      | Interviewed | the status or notes name a round after the first call (hiring manager, panel, round 2, onsite) |
      | Offers | the status starts with `Offer` |
      | Rejected | the status starts with `Rejected` |

   2. **What moved this week:** rows whose newest note is 7 or fewer days old.
   3. **Stale and overdue rows,** as in step 2.
   4. **The per-company cap:** count the rows per company whose status starts with `Ready to apply`, `Applied`, `Interviewing` or `Offer`. Name any company at the cap in `profile.md` section 5 (default 2).
   5. **A pattern worth facing,** only after three or more rejections since the last review (`grep -n "Weekly review" user-story.md` shows its date). Read the rejection notes and any `applications/<slug>/debrief-*.md` fix lists. Say in plain words what the rejections share: the stage, the role shape, the reasons given. Then offer hope-discovery (change the sweep filters) and hope-interview (add it to the next prep). Write nothing into `profile.md` or `HUNT-PROTOCOL.md` without the user's yes.
   6. **What to close or park:** a table (row, why, proposed status). Change only the rows the user picks, one `update` each.
   7. **This week's next actions:** every next action addressed to the user, soonest date first.
   8. **Protocol review:** list the rows dated this week in `HUNT-PROTOCOL.md` sections 4 and 5. Ask: "Did you correct me on anything this week that is not written here?" If yes, write it there the same turn, dated, in the user's words.

   **Check:** every part that applies is in the review (part 5 only after three rejections), and every change the user agreed to printed a `Backup:` line.

7. **Keep the notebook current.** Add one dated line to "The journey so far" in `user-story.md`, for example `- 2026-10-14: Weekly review: 3 tracked, 2 applied, 1 screened. Contoso parked.` Skip it for a quick look that changed nothing. Tell the user in one line. **Check:** `grep -n "$(date +%Y-%m-%d)" user-story.md` shows the line.

## Rules for this skill

- **The workbook wins.** If a markdown file (a status line in `APPLICATION-ANSWERS.md`, a list in `user-story.md`) disagrees with `job-tracker.xlsx`, fix the markdown. If the workbook looks wrong, ask the user before changing it.
- **Status words, exactly:** `Shortlisted` · `Ready to apply` · `Applied` · `Applied - confirmed` · `Interviewing` · `Offer` · `Rejected` · `Closed` · `Withdrawn` · `Recruiter contact` · `Inbound` · `Parked`.
- **`Applied` is never a guess.** Only on the user's word, or a confirmation email (`Applied - confirmed`). A filled form is `Ready to apply`.
- **Writes go through `tracker.py`.** If the script is missing, use the fallback in `references/tracker-contract.md`, section 8. It backs up first.
- **One live log.** No CSV or markdown copy of the tracker is kept as a second truth. Reports live in chat.
- **No openpyxl:** the script writes `job-tracker.csv` instead. Say the install line once: `python3 -m pip install openpyxl`.
- **Never delete** a row, a note or a backup. To end a row, set `Closed`, `Withdrawn` or `Parked`.
- **Rule 4:** never invent a fact. A note says what the user or a source said, and who said it.
- **Rule 14:** the tracker never reaches an employer. Never attach it, and remind the user to close it before a screen share.
- **Rule 15:** a change the user did not ask for (from the weekly review) is shown as a table first.
- **Rule 16:** answer the question the user asked first.
- Questions to the user go through `AskUserQuestion` (two to four options), or a plain yes/no.

## What to tell the user when you finish

For "where do I stand", the step 2 answer: needs you, overdue, stale, then the counts. For the weekly review, the eight parts of step 6, each short.

Example (Jane Doe, Wednesday 14 Oct 2026):

> **Where you stand, Wed 14 Oct**
>
> **Needs you**
> - Acme Design Systems, Senior Product Designer. https://jobs.ashbyhq.com/acme-design-systems/7c1e2f40-5a6b-4c3d-9e8f-0a1b2c3d4e5f · `applications/acme-senior-product-designer/`. Overdue: Sam's hiring manager slots were due 7 Oct and have not come, and your plan was one nudge after 9 Oct. Want a nudge draft?
>
> **Stale:** none. Contoso has been quiet for 19 days, but its next action waits until 16 Oct.
>
> 3 roles: 1 shortlisted, 1 applied and confirmed, 1 interviewing.

## Done when

- [ ] The sheet matches what the user told you. Every change printed `Updated row` or `Added row`.
- [ ] Every write printed a `Backup:` line, and the backup file exists.
- [ ] The answer or the review is out, with the "Needs you" rows first.
- [ ] No second copy of the tracker was made.
- [ ] `user-story.md` has today's line if anything changed.

## Next

- Every day: hope-sync, so the rows follow the inbox. Offer: "Want me to check your email and LinkedIn now?"
- No `Shortlisted` rows left: hope-discovery, for a fresh sweep.
- A nudge or a reply is due: hope-write.
