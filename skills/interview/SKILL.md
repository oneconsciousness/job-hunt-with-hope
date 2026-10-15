---
name: hope-interview
description: Use the moment the user has a call coming with a company (a recruiter screen, a hiring manager round, a panel, a technical round, a comp or offer call), and again after the call. Before the call, Hope says to record it, sets a reminder with the brief inside, and writes the prep file. After the call, Hope transcribes the recording on the user's machine, writes a debrief with a question-by-question read, grows the question bank, and drafts the follow-up for the user to send. Trigger phrases include "I have an interview", "they want to talk", "call scheduled", "recruiter screen", "prep me", "interview prep", "debrief", "here's the recording", "transcribe this", "how did I do", "comp call", "offer call", "what should I ask them", or any email, invite or message that books a call.
user-invocable: true
---

<!-- hope-skill-version: 2.0.0 -->

# Hope Interview · Prep, record, debrief, follow-up

The moment a call is known, Hope tells the user to record it and sets a reminder with the brief inside. Hope writes one prep file per company, with a one-screen sheet for the call itself. After the call, Hope transcribes the recording on the user's machine, reads all of it, and writes an honest debrief with the fixes for the next round. Then it drafts the follow-up. The user sends it.

## Before you start

- Find the plugin root. Copy this block exactly:

```bash
# Find the Hope plugin root (references/, assets/, scripts/ live there).
# $CLAUDE_PLUGIN_ROOT is not expanded inside this Markdown, so resolve it in the shell.
# Works whether Hope is installed, marketplace-cached, or run with --plugin-dir, in bash or zsh.
PLUGIN_ROOT=""
if [ -n "$CLAUDE_PLUGIN_ROOT" ] && [ -f "$CLAUDE_PLUGIN_ROOT/plugin.json" ]; then PLUGIN_ROOT="$CLAUDE_PLUGIN_ROOT"; fi
if [ -z "$PLUGIN_ROOT" ]; then
  c="$(find "$HOME/.claude/plugins/cache/hope/hope" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -V | tail -1)"   # newest cached version
  if [ -n "$c" ] && [ -f "${c%/}/plugin.json" ]; then PLUGIN_ROOT="${c%/}"; fi
fi
if [ -z "$PLUGIN_ROOT" ] && [ -f "$HOME/.claude/plugins/marketplaces/hope/plugin.json" ]; then PLUGIN_ROOT="$HOME/.claude/plugins/marketplaces/hope"; fi
if [ -z "$PLUGIN_ROOT" ]; then f="$(find "$HOME/.claude/plugins" -path '*hope*/plugin.json' -print -quit 2>/dev/null)"; if [ -n "$f" ]; then PLUGIN_ROOT="$(dirname "$f")"; fi; fi
echo "PLUGIN_ROOT=$PLUGIN_ROOT"   # check this before reading bundled files; empty means ask the user where Hope is
```

- Run every command from the hunt folder (the folder that holds `applications/` and `job-tracker.xlsx`). Every path below is relative to it.
- Read these references:
  - `$PLUGIN_ROOT/references/interview-kit.md`: the main contract. Section 1 (record every call), 2 (checklist), 5 (prep file), 6 (debrief), 8 (question bank). Section 3 for roles that face customers. Section 4 for questions with a meaning behind them. Section 7 for stories.
  - `$PLUGIN_ROOT/references/hard-rules.md`
  - `$PLUGIN_ROOT/references/hunt-folder.md`: section 5.5 (role folder files, "What you have told them").
  - `$PLUGIN_ROOT/references/tracker-contract.md`: sections 2 and 7.
  - `$PLUGIN_ROOT/references/writing-rules.md`: section 3.8 (the follow-up after a round).
  - `$PLUGIN_ROOT/references/failure-patterns.md`: P1 and lesson 14.
  - `$PLUGIN_ROOT/references/visa-and-sponsorship.md`: section 6, when work authorization may come up.
- Read `user-story.md` and `WORKING-PAD.md` if they exist.
- Never delay the record line (step 1) to read files. Say it first, then read.
- The user's time zone is the `Time zone` row in `applications/_common/profile.md` section 1. Missing: ask once, then add the row with their answer.
- `applications/_common/profile.md` or `HUNT-PROTOCOL.md` missing: run the quick path. Steps 1, 3 (with what you have), 4, 5 and 7. Fill the brief with what you have. Then offer `hope-onboarding` (part 2). Full prep needs the canon.

## What you make

| File (in `applications/<slug>/` unless shown) | Part | What it is |
|---|---|---|
| `INTERVIEW-PREP.md` | A | One prep file per company, by round. Shape: `interview-kit.md` section 5.2. |
| Calendar events | A | The record reminder, the call (if missing), prep blocks (if asked). |
| `record-reminder-<YYYY-MM-DD>.ics`, `call-<YYYY-MM-DD>.ics` | A | Only when the host has no calendar tool. |
| `recording.<ext>` | B | The user's recording, copied in. |
| `transcript-<YYYY-MM-DD>-<who>.txt` | B | Made on the user's machine by `scripts/transcribe.py`. |
| `debrief-<who>-<YYYY-MM-DD>.md` | B | Shape: `interview-kit.md` section 6. |
| `email-draft-<who>-<YYYY-MM-DD>.md` | B | The follow-up. The user sends. |
| `applications/_common/question-bank.md` | B | Every question asked, by category. Shape: `interview-kit.md` section 8. |

Also updated: `applications/_common/interview-stories.md`, "What you have told them" in `APPLICATION-ANSWERS.md`, `job-tracker.xlsx`, `WORKING-PAD.md` (a call within the hour), and `user-story.md`.

`<who>` is the person's name exactly as the source gives it, lowercase, with hyphens (`sam-lee`). Note the order: the transcript puts the date first, the debrief puts the name first.

## Steps

### Part A: when a call is known

A call is known when it is in an email, an invite, a `hope-sync` report, or the user says so.

**A call within the next hour outranks everything.** Do step 1. Add a "Paused" entry to `WORKING-PAD.md` for the work it interrupts. Then do only the live-call sheet (step 3), the consent note (step 4) and the reminder (step 5). Say in one line that everything else waits until after the call.

1. **Say "Record this one. Start Voice Memos before you join." as the first line of your reply.** Then run `date "+%A %d %B %Y %H:%M %Z"`. Convert the call time to the user's time zone with a command, never in your head. Use full zone names: PT is `America/Los_Angeles`, MT `America/Denver`, CT `America/Chicago`, ET `America/New_York`. Change the date, the time and both zone names:

   ```bash
   python3 -c "from datetime import datetime; from zoneinfo import ZoneInfo as Z; t=datetime(2026,10,15,10,0,tzinfo=Z('America/Los_Angeles')); print(t.astimezone(Z('America/New_York')).strftime('%A %d %b %Y, %I:%M %p %Z'))"
   ```

   Take the call's zone from the invite or the email. None given, or the invite, `JD.md` and `profile.md` disagree: treat it as unknown and ask. The time is not fixed yet: say the record line now, and do step 5 once it is.

   **Check:** your reply opens with the record line, and gives the call's weekday, date and time in the user's zone.

2. **Read before you write.**
   - The role folder: `JD.md`, `APPLICATION-ANSWERS.md` (read "What you have told them" closely), every `debrief-*.md` (its "Fix before ..." list), every `sent-*.md`, every `transcript-*.txt`.
   - `HUNT-PROTOCOL.md` (the canon), `applications/_common/profile.md` (sections 1, 2, 3, 4, 7), `applications/_common/interview-stories.md`, `applications/_common/question-bank.md`.
   - No role folder for this company (`ls applications/`): make one first. With a posting link: `python3 "$PLUGIN_ROOT/scripts/fetch_jd.py" "<posting url>" --slug auto --hunt-dir "<hunt folder>" --source "<where the link came from>"`. Exit code 2 or no link: make the folder by hand and ask the user to paste the job text into `JD.md`. An agency that does not name its client: use the agency name as the company.

   **Check:** you can say in one line each: the round, who it is with, what the user already told this company, and the open fixes from the last debrief.

3. **Write or update `applications/<slug>/INTERVIEW-PREP.md`** in the shape in `interview-kit.md` section 5.2. Update it in place. Never add a second copy of a section. Remove any round that is over.
   1. The top: the posting link, the folder path, the band, the location.
   2. The round line: weekday, date, time in the user's zone, length, who (name and title exactly as the invite gives them), the meeting link, what this round decides, the record and consent note.
   3. **The live-call sheet**: two columns, "Question" and "Keywords". One screen. Aim for under ten words a cell. Keyword bullets, never sentences to read aloud. "Tell me about yourself" holds the three beats. "Pay, if asked" holds one number, then "Stop." "Keep the same" holds what is already settled (pay said, location, start date, work authorization, other processes), matching "What you have told them".
   4. **Company brief**: their own one-line description, their customers, what they buy and why, dated news, and this role's part in that. Look each line up fresh every time you rebuild the prep, with a link and the date (P1). Never from memory. A source you cannot reach: write "unverified" next to that line. Check the brief against `JD.md`.
   5. **Overlap**: what the JD asks, in its words, next to the user's evidence from the canon and `interview-stories.md`.
   6. **Gaps**: a primer of two or three plain lines, then one true adjacent line in keywords. Pitch it at the depth people speak in the room: decisions and trade-offs, not trivia.
   7. **Questions to ask**: three or four, specific to this person and this company, modelled on the user's best past questions in `question-bank.md` ("Closing"). Never generic. Offer them through `AskUserQuestion`. The user picks two. Put those two on the sheet.
   8. **Likely questions**: from `question-bank.md` first. Add the follow-ups the user's own numbers will trigger ("37% of what?").
   9. **Recap of earlier calls** (a follow-up call with the same company): built from the transcripts, as a short play script grouped by topic (`interview-kit.md` section 5.3).

   Fact-check the user's own talking points. Every number on the sheet needs a hit:

   ```bash
   grep -n "<number>" HUNT-PROTOCOL.md applications/_common/profile.md career-graph/career.json applications/_common/interview-stories.md
   ```

   No hit: ask the user. Never leave an unchecked number on the sheet.

   **Check:** `grep -n "^## \|^### " applications/<slug>/INTERVIEW-PREP.md` shows this round, "Live-call sheet", "Company brief", "Overlap", "Gaps" and "Questions to ask", and no finished round. Every number on the sheet had a hit.

4. **Write the consent note** into the round line. Clues to where the other person is: their email signature, the invite's time zone, the company's office in `JD.md`. All-party US states include California, Connecticut, Delaware, Florida, Illinois, Maryland, Massachusetts, Michigan, Montana, Nevada, New Hampshire, Oregon, Pennsylvania and Washington. If the person may be in one, the clues disagree, or you do not know: the user asks first ("Do you mind if I record this so I can take proper notes?"), or records only their own side. Outside the US, check the country's rule. This is background, not legal advice. The user decides.

   **Check:** the round line has a consent note that names the likely place and the action.

5. **Put it on the calendar**, after steps 3 and 4. Use the host's calendar tool if it has one. Use the user's personal calendar, never a work calendar their employer can see (rule 14). Not sure which calendar: ask. Never add attendees. Never send invites. Guest notifications: none.

   | Event | Title | Start | Length | Show as | Alarms | Description |
   |---|---|---|---|---|---|---|
   | The reminder | `🔴 RECORD THE CALL - <Company> / <Person> in 10 min` | 10 min before the call | 10 min | free | 10 and 0 min | The brief, below |
   | The call, if not already there | `<Company> - <round> with <Person>` | The call time | The call length | busy | 60 and 15 min | The meeting link, and `Full prep: applications/<slug>/INTERVIEW-PREP.md` |
   | Prep blocks, only if asked | `Prep: <Company> - <focus line>` | When the user says | As asked | busy | The calendar default | The focus line, never just "prep" |

   The brief (`interview-kit.md` section 1). The user has not picked questions yet: use the first two options, and update the event once they pick.

   ```
   Round: <round>, <length>. This call decides: <one line>.
   Three beats: 1) <...> 2) <...> 3) <...>
   Have ready: the résumé as sent, the one comp number, the two questions, water.
   Ask: 1) <picked question> 2) <picked question>
   Already settled (do not reopen): <pay said / location / work authorization / start date>
   Consent: <Person> may be in <place>. <Ask first, or record only your side.>
   Full prep: applications/<slug>/INTERVIEW-PREP.md
   ```

   No calendar tool: ask whether the invite is already on the user's calendar. Then make the `.ics` files. As in `interview-kit.md` section 1, the description file is `INTERVIEW-PREP.md` itself: its top holds the round line and the live-call sheet. `--start` is the user's own clock time, with no zone.

   ```bash
   python3 "$PLUGIN_ROOT/scripts/make_ics.py" --title "🔴 RECORD THE CALL - Acme Design Systems / Alex Kim in 10 min" --start "2026-10-15T12:50" --minutes 10 --alarm 10 --alarm 0 --free --description-file "applications/acme-senior-product-designer/INTERVIEW-PREP.md" --out "applications/acme-senior-product-designer/record-reminder-2026-10-15.ics"
   python3 "$PLUGIN_ROOT/scripts/make_ics.py" --title "Acme Design Systems - hiring manager call with Alex Kim" --start "2026-10-15T13:00" --minutes 45 --alarm 60 --alarm 15 --description "Join: https://zoom.example/j/123 · Full prep: applications/acme-senior-product-designer/INTERVIEW-PREP.md" --out "applications/acme-senior-product-designer/call-2026-10-15.ics"
   ```

   Skip the second command if the invite is already on their calendar. Tell the user to double-click each `.ics` file to add it.

   **Check:** read the events back from the calendar tool. Or run `grep -E "SUMMARY|DTSTART|TRANSP|TRIGGER" applications/<slug>/*.ics`: the reminder starts 10 minutes before the call and shows `TRANSP:TRANSPARENT`, `TRIGGER:-PT10M` and `TRIGGER:PT0M`.

6. **A comp or offer call gets one more page.** Add the "Comp call" section to `INTERVIEW-PREP.md` (`interview-kit.md` section 5.4):
   1. The numbers on file: the floor, the ask and the ATS value from `profile.md` section 3, and what was already said, from "What you have told them".
   2. The "if they say, you say" table, filled only from those numbers. Include the offer-below-the-floor row. Full lines are fine here: in a pay talk the exact words matter.
   3. A monthly take-home estimate for the state where the user will work, from a current public paycheck calculator, marked "estimate", with the link and the date.
   4. Benefits from `JD.md` (bonus, equity, retirement match, health, time off). "not stated" where the posting is silent. Those become questions.
   5. Moving costs, if the role needs a move.

   Pay stays out of writing until the call. Never cite an offer that has lapsed or does not exist.

   **Check:** every number in the table appears in `profile.md` section 3 or "What you have told them".

7. **Update the tracker and the working pad.**

   ```bash
   python3 "$PLUGIN_ROOT/scripts/tracker.py" update --hunt-dir "<hunt folder>" --match "<Company>" --role "<role words>" --status "Interviewing - <round> on <D Mon>" --next "You: record the call; then hand Hope the file" --note "<round> with <Person> booked for <D Mon>, <time> <zone>"
   ```

   A call within the hour: add it under "Urgent" in `WORKING-PAD.md`. Say the record line again in the last message you send before the call. That is the one the user will see.

   **Check:** the script printed `Updated row`, `Notes now start:` and `Backup:`.

### Part B: after the call

8. **Get the recording.** Ask for the file. A recap from memory is not a substitute: say so once, kindly. Copy it to `applications/<slug>/recording.<ext>`, keeping its extension. A `recording.<ext>` from an earlier call is already there: never overwrite it. Name the new one `recording-<YYYY-MM-DD>-<who>.<ext>`. No recording at all: ask for the phone's or meeting tool's transcript. Nothing at all: write only the facts the user recalls (the process, the next step, what they said about themselves), marked "From memory, no recording. No verdicts."

   **Check:** `ls -la applications/<slug>/recording*` shows the file, larger than zero bytes.

9. **Transcribe it on the user's machine.** Use the file name step 8 saved.

   ```bash
   python3 "$PLUGIN_ROOT/scripts/transcribe.py" "applications/<slug>/<recording file>" --out "applications/<slug>/transcript-<YYYY-MM-DD>-<who>.txt"
   ```

   Exit code 2: read what it printed. faster-whisper not installed: the script prints the install line. Offer it once, or use the fallback: the transcript the phone made (Voice Memos and Notes make one), or a paste from the meeting tool. Save a pasted transcript under the same file name.

   The script prints the audio length. Compare it with the booked length. Much shorter: tell the user the recording is partial before any verdict, and judge only what it covers.

   **Check:** `head -3 applications/<slug>/transcript-<YYYY-MM-DD>-<who>.txt` shows `[mm:ss]` lines.

10. **Read the whole transcript, then write the debrief.** No verdict before the last line is read. Never from the user's recap.
    1. List every question the interviewer asked, with its timestamp. A timestamp is the `[mm:ss]` that starts the line the words are in. Each line covers about 30 seconds.
    2. The script does not mark speakers, and one line can hold a question and its answer. Name the speaker where it is obvious from context. Otherwise write "speaker unclear".
    3. Names in a transcript are machine-spelled. Check each against the invite, an email signature, or the user before you write it. Confirm with the user who actually joined.
    4. Write `applications/<slug>/debrief-<who>-<YYYY-MM-DD>.md` in the shape in `interview-kit.md` section 6. Start it with the posting link and the folder path (rule 16). Then: what happened (timestamps, short quotes, the speaker), the process they described (rounds, timing, who decides), the question-by-question table (Strong, Weak or Missed, one line why), what worked, "Fix before the <next round's name>" (keywords, true details only), anything the user agreed to (explained in two or three plain lines), the tape counts (filler phrases; approximate, because the transcript drops some fillers), the consistency check against "What you have told them" and the submitted answers, and the next step.
    5. Compare the process they described with earlier debriefs and `JD.md`. A difference goes in the debrief as a question for the user or the recruiter.
    6. A fact the user said on the call that is not on file: quote it in the debrief marked "NOT CONFIRMED", and ask the user whether it is true. It goes into the canon only after they confirm.
    7. A better answer that needs a story not on file: add an "Open - needs <user>" row to `interview-stories.md`. Never invent the story.

    **Check:** the table has one row for every question on your list from item 1, and every quote has a timestamp.

11. **Feed the other files.**
    1. `applications/_common/question-bank.md`: every question, in their words, under its category, with company, round, date and timestamp, the verdict, and keywords for next time. Add each row inside its category's table, never at the end of the file. A repeat gets its own row. No file yet: create it from `interview-kit.md` section 8.
    2. The drift check: add the user's self-introduction to "Self-introductions across calls". Compare it with earlier rows and the canon. A changed fact (a number, a date, a title, a reason for leaving) is drift: tell the user, and fix it before the next call. No self-introduction on this call: skip the row and say so in the debrief.
    3. `interview-stories.md`: new story details the user confirmed, in their words, with the source (`transcript <date> <mm:ss>`).
    4. "What you have told them" in `APPLICATION-ANSWERS.md`: `<YYYY-MM-DD> · call with <Person> · said: <...>`. A claim not yet confirmed carries "NOT CONFIRMED". A claim that has lapsed gets a new dated line with the true state.
    5. `INTERVIEW-PREP.md`: remove the finished round. Add this call to "Recap of earlier calls". Mark the questions the user asked as used, and refresh "Questions to ask". Put the debrief's fixes on the next round's sheet if that round is known.
    6. `WORKING-PAD.md`: clear the "Urgent" entry for this call.
    7. Look across all debriefs. A question rated Weak or Missed in two or more calls is a pattern worth facing. Say it in one line, and put it at the top of the next prep.

    **Check:** `grep -c "<YYYY-MM-DD of the call>" applications/_common/question-bank.md` is at least the number of rows in the debrief table, plus one if there was a self-introduction.

12. **Draft the follow-up and close the loop.**
    1. The same day, draft the follow-up with the `hope-write` shape "A thank-you after a call" (`writing-rules.md` section 3.8): thanks, at most one line about the conversation, then ask about next steps. No recap of the call. Send it to the person who ran the call, unless they named someone else. No address on file: write the To line as `hope-write` step 6 says. Run `hope-write` steps 5 and 6 on it (the checklist and the save), as `applications/<slug>/email-draft-<who>-<YYYY-MM-DD>.md`. The user sends.
    2. Update the tracker, with the call's date:

       ```bash
       python3 "$PLUGIN_ROOT/scripts/tracker.py" update --hunt-dir "<hunt folder>" --match "<Company>" --role "<role words>" --status "Interviewing - <next round> next" --next "<who does what, by when>" --note "<round> with <Person>: <verdict in one line>. Debrief saved." --date <YYYY-MM-DD of the call>
       ```

       Turned down: `--status "Rejected"`. An offer: `--status "Offer"`. Use the same command with that status.

    3. Write one dated line in `user-story.md`.

    **Check:** the draft file exists, the tracker printed `Updated row` and `Backup:`, and `user-story.md` has today's line.

## Rules for this skill

- **Rule 1.** Hope never sends. The follow-up is a draft. Calendar events have no attendees and send no invites.
- **Rule 4.** Never invent a fact. Every number on the sheet has a source. Names from a transcript are checked first.
- **Rule 11.** Record every call. The record line opens the first reply about the call and the last message before it.
- **Rule 14.** Nothing from the rest of the hunt reaches an employer. No interview events on a work calendar. Before a shared screen or a take-home: a clean folder with only what this company needs. Close the tracker, prep notes, other role folders and other companies' tabs.
- **Rule 16.** Do what was asked, first. Every prep file, debrief and report about a role starts with the posting link and the folder path.
- **Rule 17.** Weekday, date and time zone by command. Read the thread before drafting the follow-up.
- Prep is keyword bullets, never scripts. The comp table is the one exception.
- One screen during the call. Update the prep file in place. Remove rounds that are over.
- Questions for them are specific to that person and that company, offered as options. Never generic.
- Verdicts only after reading the whole transcript, with timestamps and the speaker where it is clear.
- No pay numbers and no negotiation plans in any email or message before the call. A form that asks for pay still gets the number from `profile.md`.
- Outside facts (the company, its news, how it interviews) are looked up fresh, with a link and the date. A user correction about the outside world is checked against a primary source before it goes into `HUNT-PROTOCOL.md`.
- Technical rounds: AI assistants and autocomplete off, unless the round allows them.
- "Keep the same" must match "What you have told them", and everything there must be true.

## What to tell the user when you finish

**Part A**, when the call is set. Example for Jane Doe:

```
Record this one. Start Voice Memos before you join.

Acme Design Systems, hiring manager call with Alex Kim (Design Director): Thursday 15 Oct, 1:00 pm your time (10:00 am Pacific), 45 min.
https://jobs.ashbyhq.com/acme-design-systems/7c1e2f40-5a6b-4c3d-9e8f-0a1b2c3d4e5f
applications/acme-senior-product-designer/

Prep: applications/acme-senior-product-designer/INTERVIEW-PREP.md. The live-call sheet carries the three fixes from Sam's screen.
Calendar:
- 🔴 RECORD THE CALL - Acme Design Systems / Alex Kim in 10 min · Thu 12:50 pm · alarms at 10 and 0
- Acme Design Systems - hiring manager call with Alex Kim · Thu 1:00 pm · alarms at 60 and 15
Consent: the invite is in Pacific time, so Alex may be in California, an all-party state. Ask first: "Do you mind if I record this so I can take proper notes?"

Needs you:
1. Pick two questions to ask (three options in the prep file).
2. The difficult-stakeholder story is still open. Ten minutes on it before Thursday?
```

**Part B**, after the debrief. The link and folder first, then the outcome, the three biggest fixes, and the next step. Example from Jane's recruiter screen:

```
https://jobs.ashbyhq.com/acme-design-systems/7c1e2f40-5a6b-4c3d-9e8f-0a1b2c3d4e5f
applications/acme-senior-product-designer/

Debrief: applications/acme-senior-product-designer/debrief-sam-lee-2026-10-02.md (whole transcript read, 27 min)
Outcome: moving to the hiring manager round.

The three biggest fixes:
1. Why now: lead with the work. Pay only if asked.
2. Design tokens: open with the governance work. Drop "not really".
3. Pay: one number. You said "around 190". The form says 195000. Which one stands?

Next: Sam sends hiring manager times by 7 Oct. Follow-up draft: email-draft-sam-lee-2026-10-02.md. You send.
Six questions added to question-bank.md. Tracker updated.
```

## Done when

- [ ] Part A: the record line opened the first reply about the call.
- [ ] Part A: `INTERVIEW-PREP.md` starts with the posting link, has every section for this round, and its live-call sheet fits one screen.
- [ ] Part A: the reminder and the call are on the calendar, or the `.ics` files exist and the user has them.
- [ ] Part A: the round line and the brief have a consent note, and the tracker row says `Interviewing - <round> on <date>`.
- [ ] Part B: the transcript file exists, and the debrief starts with the posting link and has a row for every question, with timestamps.
- [ ] Part B: `question-bank.md`, `interview-stories.md` and "What you have told them" are updated, and the finished round is gone from `INTERVIEW-PREP.md`.
- [ ] Part B: the follow-up draft is saved, the tracker has a dated note, and `user-story.md` has a dated line.
- [ ] Hope sent nothing.

## Next

- After Part A: "After the call, send me the recording file and I'll do the debrief."
- After Part B: the user edits and sends the follow-up (`hope-write` learns from the edit). `hope-sync` picks up their reply. `hope-tracker` shows where everything stands.
