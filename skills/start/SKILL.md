---
name: hope-start
description: Use at the start of any Hope session, and whenever the user wants to know where they stand or what to do next. It reads the hunt folder, tells the user where they are in five lines or fewer, and hands over to the right Hope skill. It also runs the daily rhythm of the hunt. Use it as well when another Hope skill is asked for but the hunt folder is not set up yet. Trigger phrases include "use Hope", "run my job hunt with Hope", "start my job hunt", "what's next", "where am I", "what should I do today", "help me with my job search", "morning", "let's go", "I'm back", or any job-hunt request that does not name a specific skill.
user-invocable: true
---

<!-- hope-skill-version: 2.0.2 -->

# Hope Start · Where you stand, what's next

This is Hope's front door. It reads the user's hunt folder and says where things stand in five lines or fewer. Then it offers the one next step and hands over to the skill that does it. It answers the user's own question first, every time.

## Before you start

- Find the plugin root. Run this block once (the standard block from `skills/onboarding/SKILL.md`):

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

  If `PLUGIN_ROOT` comes back empty, ask the user where the Hope plugin is checked out (`AskUserQuestion`). Never guess a relative path. Shell variables do not carry over between commands: in later commands, use the path the block printed wherever you see `$PLUGIN_ROOT`.
- Read `$PLUGIN_ROOT/references/hard-rules.md` and `$PLUGIN_ROOT/references/milestones.md` (the daily rhythm). Read sections 1 and 6 of `$PLUGIN_ROOT/references/hunt-folder.md` (the tree and the quick check). Read `$PLUGIN_ROOT/references/user-story-guide.md`.
- The hunt folder is the folder this chat runs in. Run `pwd`. If it prints the home folder or the plugin folder, ask which folder holds the hunt (`AskUserQuestion`). Below, `<hunt folder>` means that absolute path. Run every command from it.

## What you make

No new files. This skill reads the hunt folder and keeps two files current:

- `WORKING-PAD.md`: what is urgent, what is paused, and exactly where to resume. Shape in `$PLUGIN_ROOT/references/hunt-folder.md` section 5.7.
- `user-story.md`: its "Now" section names the next step. Rules in `$PLUGIN_ROOT/references/user-story-guide.md`.

## Steps

1. **Check the date, the time and the time zone.** Run `date "+%A %d %B %Y %H:%M %Z"`. The user's zone is the "Time zone" row in section 1 of `applications/_common/profile.md`. No profile yet: use the zone `date` printed, unless `user-story.md` puts the user in another city. If the two disagree, ask which zone to use. Never assume. **Check:** you can write today's weekday, date, time and zone.

2. **Read `WORKING-PAD.md` first.** Read "Urgent" and "Paused". If a calendar tool is connected, list today's events too. A call that starts within the next hour outranks everything. Say so in one line, write a "Paused" entry for anything in flight, and go straight to `hope-interview` to prep that call. Skip the rest of these steps. No `WORKING-PAD.md` means nothing is paused. **Check:** you know whether a call starts within the hour, and what is paused.

3. **Read the rest of the hunt folder, in this order.** First run this:

   ```bash
   cd "<hunt folder>"
   for f in HUNT-PROTOCOL.md user-story.md career-graph/career.json .publish.json \
            applications/_common/profile.md applications/_common/resume.pdf \
            job-tracker.xlsx job-tracker.csv; do
     if [ -e "$f" ]; then echo "OK      $f"; else echo "MISSING $f"; fi
   done
   echo "Newest portfolio: $(ls -dt career-graph/documents/portfolios/*/ 2>/dev/null | head -1)"
   python3 "$PLUGIN_ROOT/scripts/graph_query.py"
   ```

   Then read each file that exists:
   1. `HUNT-PROTOCOL.md`: the canon and "My rules". Missing means Part 2 of onboarding has not run.
   2. `user-story.md`: the "Now" section and the newest three lines of "The journey so far".
   3. `career-graph/career.json`: the `graph_query.py` line. "No Person node yet" means onboarding has not run.
   4. The newest portfolio folder (the "Newest portfolio" line). Blank means no portfolio yet.
   5. `.publish.json`: the `url` and `published_at`.
   6. `applications/_common/profile.md`: count the gaps with `grep -c "TODO (ask" applications/_common/profile.md`.
   7. The tracker: `python3 "$PLUGIN_ROOT/scripts/tracker.py" report --hunt-dir "<hunt folder>"`. Exit code 2 with "No tracker" means there is no tracker yet.

   **Check:** you have one line for each item above: what it says, or "missing". Nothing is guessed.

4. **Run the stale-session check.** This file says `hope-skill-version: 2.0.0`. Read the installed version:

   ```bash
   LIVE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$PLUGIN_ROOT/plugin.json" 2>/dev/null \
     || grep -m1 '"version"' "$PLUGIN_ROOT/plugin.json" | grep -oE '[0-9]+(\.[0-9]+)+')"
   echo "This chat loaded Hope 2.0.0. Installed: $LIVE"
   ```

   - **Same version:** say nothing about it.
   - **Installed is newer:** this chat loaded an older Hope. At the end of your reply, add a bold line: **Recommendation: start a fresh chat to get the newest Hope (v<LIVE>).** Then: "Nothing will be lost. Everything lives in this folder, and a new chat reads it right back." Then give a handoff: a summary of 10 lines or fewer to paste into the new chat. Build it from `user-story.md` as the guide's "How the handoff summary is derived" says.
   - **This file is newer than installed:** a development build. Treat the chat as up to date. Mention the mismatch in one line.

   **Check:** you compared `2.0.0` with `$LIVE` and know which case applies.

5. **Pick the route.** Use the routing table below. Read it top to bottom. The first row that matches wins. **Check:** you can name the row number and the skill.

6. **Tell the user where they are.** Use the five-line shape in "What to tell the user when you finish".
   - Row 2 with no hunt files at all (a first-time user): skip the report. Say the row's one line and start `hope-onboarding` at once. Its first message is the welcome tour.
   - Rows 2 to 5 otherwise: the five lines, then the next step as an `AskUserQuestion` with 2 to 4 options. The routed step is the "(recommended)" option.
   - Rows 6 to 12 (the user asked for something specific): skip the report. Say one line only if something is urgent or paused. Then start that skill.
   - Row 13: the five lines. Line 5 says "Next: the morning sync. Running it now." Run `hope-sync`. When it finishes, ask the next step with `AskUserQuestion`. If sync already ran in this chat in the last three hours, offer it instead of running it.

   **Check:** the report is five lines or fewer, and every fact in it came from steps 1 to 4.

7. **Hand over and keep the files current.** Start the routed skill by its name (for example `hope-onboarding`). If your agent cannot start a skill by name, read `$PLUGIN_ROOT/skills/<folder>/SKILL.md` and follow it. Before you switch:
   - Work left unfinished goes into `WORKING-PAD.md` under "Paused": why it paused, what is done, the exact place to resume.
   - A paused item the user picks up stays on the pad until that work is done. Then the skill that finished it clears it.
   - Rewrite "Now" in `user-story.md` with the next step. Add a dated line to "The journey so far" only when something real changed (for example "Back after a week away; picked up the Acme follow-up"). A plain check-in gets no line.

   **Check:** `WORKING-PAD.md` (if the folder has one) lists everything paused with a "Resume at" line, and "Now" names the next step.

### The routing table

| # | When this is true | Go to | Say first, in one line |
|---|---|---|---|
| 1 | A call starts within the next hour (`WORKING-PAD.md` "Urgent", the calendar, a tracker row, or the user says so). | `hope-interview`: prep that call. | "Your call with <who> is at <time, user's zone>. Prepping that first. Everything else waits." |
| 2 | No `career-graph/career.json`, or `graph_query.py` prints "No Person node yet". | `hope-onboarding`, Part 1. | "First I need to know you. That is onboarding, one sitting." If the user gave a link, save it under "Paused" in `WORKING-PAD.md`. |
| 3 | A career file, no portfolio folder, no `applications/_common/resume.pdf`, the tracker is missing or has no rows (the hunt has not started), and the user asked for nothing specific. | `hope-portfolio`. | "Your career file is in. Next is your portfolio and the résumé it exports." |
| 4 | A portfolio folder, no `.publish.json`, the user asked for nothing specific, and "Decisions" in `user-story.md` does not say they chose not to publish. | Offer `hope-publish`. Options: publish now (recommended) / skip it and set up the hunt. A skip goes under "Decisions" in `user-story.md`. | "Your portfolio is built but not online yet." |
| 5 | `HUNT-PROTOCOL.md`, `applications/_common/profile.md` or the tracker (`job-tracker.xlsx` or `job-tracker.csv`) is missing, and the user asks to find jobs, apply, sync, write, prep an interview, or update the tracker, or asks for nothing specific. | `hope-onboarding`, Part 2. | "Forms and the tracker read your application profile, so we set that up first. One sitting." |
| 6 | The user gives a job link. | `hope-application`. | - |
| 7 | "find me jobs", "any new roles", "new since yesterday". | `hope-discovery`. | - |
| 8 | "sync", "any news", "check my email", "did they reply". | `hope-sync`. | - |
| 9 | "draft", "reply", "write", "cover letter", "message". | `hope-write`. | - |
| 10 | "interview", "call", "screen", "they want to talk". | `hope-interview`. | - |
| 11 | "where do I stand", "where am I", "what needs me", "update the tracker". For "where am I" give the five-line report (step 5) and then route by the rest of the table. | `hope-tracker`. | - |
| 12 | "portfolio", "résumé", "publish", "put it online". | `hope-portfolio` or `hope-publish`. | - |
| 13 | Anything else, or nothing specific ("morning", "let's go", "what's next", "I'm back"). | The daily rhythm: run `hope-sync`, then offer the next step. | "Next: the morning sync. Running it now." |

**The daily rhythm** (from `$PLUGIN_ROOT/references/milestones.md`). After sync, offer the next step in this order: replies that need a draft (`hope-write`), new links to apply to (`hope-application`), calls that need the record reminder and prep (`hope-interview`). During an active hunt, also offer a "new since yesterday" sweep (`hope-discovery`). On the first check-in of a new week, the recommended option is the weekly review: the tracker report, a wider sweep, and a protocol review (what did the user correct this week, and is it in `HUNT-PROTOCOL.md`?).

## Rules for this skill

Hard rules from `$PLUGIN_ROOT/references/hard-rules.md`:

- **Rule 1.** Hope never sends anything. It drafts, fills, saves, and stops. The user sends.
- **Rule 2.** LinkedIn is read-only. Open it only in the user's signed-in browser, never with a plain web fetch.
- **Rule 3.** Email is read-only. Never send, reply, forward, archive, or delete.
- **Rule 4.** Never invent a fact. The report comes from files and commands. A missing file is "missing", never a guess.
- **Rule 11.** Record every call. The moment a call is known, say "Record this one. Start Voice Memos before you join." Then route to `hope-interview` for the reminder.
- **Rule 16.** Do what was asked, first and only. Answer the user's question before anything else.
- **Rule 17.** Check the date, the time zone and the thread. Run `date` before writing "today", "tomorrow" or a deadline. Give call times in the user's zone.

Rules for this skill:

- A call in the next hour outranks everything. Prep it first, pause the rest in `WORKING-PAD.md`, and say so.
- A long dictated or voice-typed message gets restated as a numbered list of asks. Get a yes before acting on it.
- Answer what was asked first. Never start other work until it is answered.
- "Remind me to X on day D" means a calendar reminder for the user. Work out the real date with `date`. No attendees, no invites. No time given: ask (`AskUserQuestion`, "9:00 am" recommended). No calendar tool: write an `.ics` file and tell the user to double-click it:
  `python3 "$PLUGIN_ROOT/scripts/make_ics.py" --title "Reminder: <what>" --start "<YYYY-MM-DD>T<HH:MM>" --minutes 15 --alarm 0 --out "<folder>/reminder-<YYYY-MM-DD>.ics"`.
  `<folder>` is the role folder when it is about a role, otherwise `applications/_common`. **Check:** read the event back, or open the `.ics` text and confirm the date and time.
- When the user will copy links, give full raw URLs, one per line. No markdown links.
- Keep `WORKING-PAD.md` current. When work is interrupted, write what is paused and where to resume before you switch. Clear the entry when the work is done. No `WORKING-PAD.md` yet: create it from the template in `$PLUGIN_ROOT/references/hunt-folder.md` section 5.7.
- Every question goes through `AskUserQuestion` (voice-guide rule #6), or is a plain yes/no.
- The tracker is the truth. If `user-story.md` or any markdown file disagrees with `job-tracker.xlsx`, the workbook wins.
- During an active hunt, offer sync again each time the user checks in. Run it in this chat, and say when it ran.

## What to tell the user when you finish

Five lines or fewer, in this shape:

```
**Where you are:** <the stage, and the tracker counts by status>
**Needs you:** <the tracker's "Needs you" rows, most urgent first, one short clause each, with the role folder path and the posting link from its `JD.md` after each; or "nothing in the tracker">
**Paused:** <what WORKING-PAD.md holds, and where it resumes; or "nothing">
**Today:** <weekday, date, time and zone; any call today>
**Next:** <the one recommended step>
```

Then the `AskUserQuestion` for the next step (rows 2 to 5), or "Running it now." (row 13).

Example for Jane Doe on a Wednesday morning, after "morning":

```
**Where you are:** Hunt is live. 3 roles in the tracker: 1 shortlisted, 1 applied (confirmed), 1 interviewing.
**Needs you:** Acme Design Systems. Sam's hiring-manager slots were due 7 Oct, and your 9 Oct nudge date has passed.
**Paused:** nothing.
**Today:** Wednesday 14 Oct 2026, 9:05 am Eastern. No calls today.
**Next:** the morning sync (Sam may have replied). Running it now.
```

After the sync, the next-step question for Jane might offer: "Draft the one nudge to Sam (recommended: it is five days overdue)", "Look for new roles since yesterday", "Apply to Northwind Labs".

## Done when

- [ ] Today's weekday, date, time and zone were checked with `date`.
- [ ] `WORKING-PAD.md` was read first. A call within the hour, if any, went straight to `hope-interview`.
- [ ] The user got the five-line report (or one line, for a specific request), built only from files and commands.
- [ ] The user picked the next step, or the daily rhythm started with sync.
- [ ] `WORKING-PAD.md` (if the folder has one) lists everything paused, with where to resume.
- [ ] "Now" in `user-story.md` names the next step.

## Next

The skill the routing table picked. Offer it with its one line from the table, as the "(recommended)" option. Come back to `hope-start` after a break, or whenever the user asks "what's next?".
