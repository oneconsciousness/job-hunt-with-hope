---
name: hope-onboarding
description: Use when a user is starting their job hunt with Hope for the first time, OR when they explicitly say "let's start over." Part 1 meets the person (who they are, their work, their aim, their constraints) and writes the career file (Person, Goal, Skills, Experiences, Education, Projects, Memories, Documents). Part 2 sets up the hunt folder (the hunt protocol, the application profile with every answer a form asks, the voice file, the one résumé, the tracker, the job-board list, the working pad). Part 2 runs right after Part 1, later when hope-start finds it missing, or whenever the user asks. Users coming from Hope 1.5 run Part 2 once. Trigger phrases include "start my job hunt", "I want to use Hope", "set me up", "I'm looking for a new role", "let's begin", "introduce me to Hope", "onboard me", "set up my hunt folder", "application profile", "set me up to apply", or any first-time engagement where no Person node exists in the graph yet.
user-invocable: true
---

<!-- hope-skill-version: 2.0.1 -->

# Hope Onboarding · Your story, then your setup

Part 1 meets the user as a person and builds their career file. Part 2 sets up the hunt folder: their rulebook, their application profile, their voice file, the one résumé, the tracker and the job-board list. Every answer comes from the user. Hope never guesses one.

## Before you start

- Find the plugin root. Run this block once, first. Every other skill copies it from here:

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

  The reference files and scripts live in the plugin, not in the user's folder. If `PLUGIN_ROOT` comes back empty, ask the user where the Hope plugin is checked out (`AskUserQuestion`). Never guess a relative path: a bare `references/...` read looks in the user's folder and fails. Shell variables do not carry over between commands: in later commands, use the path the block printed wherever you see `$PLUGIN_ROOT`.
- Read for both parts: `$PLUGIN_ROOT/references/hard-rules.md`, `$PLUGIN_ROOT/references/voice-guide.md`, `$PLUGIN_ROOT/references/milestones.md`, `$PLUGIN_ROOT/references/user-story-guide.md`.
- Read for Part 1: `$PLUGIN_ROOT/references/career-graph-schema.md`.
- Read for Part 2: `$PLUGIN_ROOT/references/hunt-folder.md` (sections 3 to 5), `$PLUGIN_ROOT/references/hunt-protocol-template.md`, `$PLUGIN_ROOT/references/tracker-contract.md` (sections 2 and 7), `$PLUGIN_ROOT/references/visa-and-sponsorship.md` (sections 1, 7 and 9), and lesson 14 in `$PLUGIN_ROOT/references/failure-patterns.md`.
- The hunt folder is the folder this chat runs in. Below, `<hunt folder>` means its absolute path (`pwd`). Run every command from it. Read `user-story.md` if it exists.
- Pick the part with this table. The first row that matches wins.

| What you find | Do this |
|---|---|
| No `career-graph/career.json`, or `python3 "$PLUGIN_ROOT/scripts/graph_query.py"` prints "No Person node yet" | Part 1. A first-time user gets the welcome tour. Part 2 follows when the user is ready (Part 1 step 9). |
| The user said "let's start over" | Confirm with a plain yes/no. Then Part 1 again, no tour. Deterministic IDs merge; nothing is downgraded. |
| A Person node, and `HUNT-PROTOCOL.md`, `applications/_common/profile.md` or the tracker (`job-tracker.xlsx` or `job-tracker.csv`) is missing, or the user asks for Part 2 | Part 2. No tour. |
| A Person node and every Part 2 file | A returning user. Say what you have in two lines. Ask what changed (`AskUserQuestion`), update only that, then hand over to `hope-start`. |

- **Stale-session check (returning users).** This file says `hope-skill-version: 2.0.0`. Read the installed version:

```bash
LIVE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$PLUGIN_ROOT/plugin.json" 2>/dev/null \
  || grep -m1 '"version"' "$PLUGIN_ROOT/plugin.json" | grep -oE '[0-9]+(\.[0-9]+)+')"
echo "This chat loaded Hope 2.0.0. Installed: $LIVE"
```

  Installed is newer: say in bold **Recommendation: start a fresh chat to get the newest Hope (v<LIVE>).** Add: "Nothing will be lost. Everything lives in this folder, and a new chat reads it right back." Give a handoff of 10 lines or fewer, built from `user-story.md` as the user-story guide says. Same version, or this file is newer: carry on.

## What you make

### Part 1: the career file

`career-graph/career.json`. The schema is `$PLUGIN_ROOT/references/career-graph-schema.md`. `<user-slug>` is the user's name in lowercase with hyphens (`jane-doe`). If a Person node already exists, reuse its `user_id` and slug.

| Node | How many | What goes in it |
|---|---|---|
| Person | 1 | `name`, `headline`, `summary`, `location`; `email` and `linkedin` if given. Optional `headline_stats` (max 4) and `interests` (max 6), only when the user shares them (Part 1 step 6). |
| Goal | 1 per capture date | `target_role`, `target_level`, `goal`, `time_per_week`, `deadline`, `deadline_reason`. ID `goal:<user-slug>:<date>`. A `HAS_GOAL` edge from the Person node. `source: "conversation"`, `confidence: 0.70`. |
| Experience | at least 3, or as many as the user has | Structured `contributions` (below). ID `exp:<user-slug>:<company-slug>:<role-slug>:<start-year>`. |
| Skill | at least 5 | Each one has a `USED_SKILL` edge from an Experience, Project or Education. A skill earns its place by being shown. Never a flat list. |
| Education | any formal training the user mentions | |
| Project | portfolio-worthy work outside a job | |
| Memory | 2 to 5, plus the hand-off Memory | Preferences, constraints and aims that should shape every later step. |
| Document | 1 per file the user gives (résumé, portfolio PDF) | |

**Contributions.** For each role or project, capture: situation, task, action, result, metric (a number, if there is one), skills applied (these become `USED_SKILL` edges), scope (team, department, company-wide, industry), domain (B2B SaaS, fintech, consumer), and competencies (systems thinking, stakeholder management).

**How to write it.** Use the helpers in `$PLUGIN_ROOT/scripts/graph_query.py` from a short Python snippet, or edit the JSON directly. Running `graph_query.py` with no arguments only prints a summary. Example (Jane Doe; pass the plugin path as the first argument):

```bash
python3 - "$PLUGIN_ROOT" <<'PY'
import sys
sys.path.insert(0, sys.argv[1] + "/scripts")
from graph_query import load_graph, add_node, add_edge, save_graph
g = load_graph()   # reads career-graph/career.json, or starts a new empty graph
add_node(g, "Person", {"type": "Person", "user_id": "person:jane-doe", "name": "Jane Doe",
                       "headline": "Senior Product Designer", "source": "document", "confidence": 0.85})
add_node(g, "Goal", {"type": "Goal", "id": "goal:jane-doe:2026-10-14", "target_role": "Senior Product Designer",
                     "source": "conversation", "confidence": 0.70})
add_edge(g, "person:jane-doe", "goal:jane-doe:2026-10-14", "HAS_GOAL", source="conversation", confidence=0.70)
save_graph(g)
PY
```

Link every node with the edges the schema names: `HAS_EXPERIENCE`, `HAS_SKILL`, `HAS_EDUCATION`, `HAS_PROJECT`, `HAS_MEMORY`, `HAS_GOAL` and `UPLOADED` (Documents) from the Person node; `USED_SKILL` from an Experience, Project or Education to a Skill; `AT_COMPANY` from an Experience to its Company.

**Rules for writing the graph:**

1. Check whether a node exists before you create it. Deterministic IDs make this cheap, and re-runs MERGE instead of duplicating.
2. Set `source` and `confidence` on every node and edge: `document` 0.85 (files, a LinkedIn PDF), `conversation` 0.70 (chat), `github` 0.95, `web_enrichment` 0.90 (the browser or a web fetch: LinkedIn, Behance, a personal site).
3. Never downgrade. A Skill with `years: 8` stays 8 when new evidence says 6. A Goal field left blank on a later run keeps its old value.
4. A new graph file carries `hope_schema_version: "1.1"`. `graph_query.py` writes it for you.
5. The user's data stays in the hunt folder. Never write it anywhere else.

Part 1 also makes `user-story.md` (the notebook, per `$PLUGIN_ROOT/references/user-story-guide.md`) and the protective `.gitignore`.

### Part 2: the hunt folder

The contracts are in `$PLUGIN_ROOT/references/hunt-folder.md` section 5.

| File | What goes in it |
|---|---|
| `HUNT-PROTOCOL.md` | The user's rulebook: the one principle, the canon of confirmed facts, open discrepancies, their rules, lessons learned, the recording protocol. |
| `applications/_common/profile.md` | Every answer a form asks that is not on the résumé. Nine sections. Unknowns are `TODO (ask <name>)`. |
| `applications/_common/my-voice.md` | Writing samples, word for word, and the signature block. `hope-write` adds patterns later. |
| `applications/_common/resume.pdf` | The one résumé every application uses. |
| `job-tracker.xlsx` | The one live log, empty and ready. |
| `applications/_research/boards.txt` | The job boards `hope-discovery` sweeps. Each one tested. |
| `WORKING-PAD.md` | What is in flight. Starts with nothing paused. |
| `.gitignore` | The full protective block. |
| `user-story.md` | One dated journey line and a new "Now". |

## Steps

### Part 1: your career file

1. **Scan the folder, then open with one message.** Before you say anything, look for: résumé-like files (`*.pdf`, `*.docx` or `*.txt` with "resume" or "cv" in the name, or any lone PDF), headshot candidates (`headshot.*`, `photo.*`, `profile.*`, any portrait image), and `career-graph/career.json`. Then send ONE first message with these parts, in order:
   1. **The welcome tour (first-time users only).** Show `$PLUGIN_ROOT/assets/readme/how-hope-works.png` as a markdown image with its absolute path. If it is missing, use `$PLUGIN_ROOT/assets/readme/publish-flow.png`. Under it, three plain lines:
      > "Here's the whole journey. You hand me what you already have, and I build your career file. It stays on your computer.
      > Then we make your portfolio and résumé, and put them online on one link you own.
      > Then we run the hunt together: find roles, fill forms (you always press send), write in your voice, prep for calls, and keep one tracker. Let's start."

      Do not pause. No "did you see this?", no "ready?". Flow straight on in the same message.
   2. **What you found**, as a statement: "I see `resume.pdf` and `headshot.jpg` in this folder. I'll use those." Never ask for something already in the folder.
   3. **The inventory question.** If the scan found nothing, this is the opener. It has six options, more than `AskUserQuestion` allows. It is the voice guide's one multi-select inventory, so send it as an inline numbered list:
      > "What do you already have? Any combination, like '1 and 3', or say it your way:
      > 1. A résumé or CV (recommended: the richest single source)
      > 2. Your LinkedIn profile
      > 3. GitHub, Behance, or a personal site
      > 4. A professional photo
      > 5. A folder on this computer with career files: old résumés, bios, project write-ups. Just point me to it
      > 6. None of these. We'll build it from a conversation, and that works too."

   Any subset in any phrasing counts ("check my linkedin, that's all I have"). Whatever they name becomes the work list. The answer is also a vocabulary read: "pull my repos" and "the website thing" are different registers. Match their words from your next reply on (voice-guide rule 4, "Meet them at their words").
   **Check:** your first message holds the tour (first-timers only), what you found, and the inventory. You have a work list.

2. **Ask the aim: role, goal, time, runway.** Ask everyone, on every path, right after the inventory. Four asks in one `AskUserQuestion` call. Build the options from what the scan shows (for a senior backend engineer, the "step up" option names the next level). Each has one "(recommended)" with a one-clause why. The two personal asks (the goal and the clock) also offer "💬 Chat about this first".
   1. "What role are you aiming for next?" For example: "A step up: senior in what I do now (recommended: most strong hunts start from proven ground)" / "Same level, new company or industry" / "A real pivot into something new". Fills `target_role` and `target_level`.
   2. "What does winning look like?" For example: "My first role in this field (recommended for new entrants: it shapes the whole plan)" / "Higher pay or a bigger title" / "Out of a bad situation, fast" / 💬. Fills `goal`.
   3. "How much time per week can you put into this?" For example: "A few hours" / "About 10 hours (recommended baseline: real progress without burning out)" / "This is my full-time job right now". Fills `time_per_week`. Every later plan is sized by it.
   4. "Is there a clock on this?" For example: "No hard deadline (recommended to say if true: it lets us build properly)" / "A few months" / "Weeks: it's urgent" / 💬 "There's a visa or situation you should know about". Fills `deadline` and `deadline_reason`. The 💬 path matters most. A visa clock or a family deadline goes into `deadline_reason` and into a `constraint` Memory tagged "(you asked me to remember this)".

   If the user already said any of these ("a senior PM role, about two months"), say what you have and ask only the gaps. The Goal node is written in step 4.
   **Check:** each of the six Goal fields has an answer or a skip.

3. **Gather, cheapest first.** Say each move before you make it. If a source is not in hand yet, ask for it in the same line: "drop the file here, or paste the link."
   1. **Files in this folder:** read them now.
   2. **A folder they point you to** (for example `~/Documents/career-stuff`): read it where it lives, read-only. List what you found and confirm which to use, as a plain yes/no ("I found 3 résumés and 2 photos. The 2024 résumé and `headshot.jpg` look right. Use those?"). Never reorganize or change their folder. Copy only what you use (for example the chosen headshot) into the hunt folder, and say so. If the path is missing or unreadable, say so plainly and offer the drop-it-here fallback. (macOS may ask permission for Documents, Desktop or Downloads. That prompt is theirs to answer.)
   3. **Public links** (GitHub, Behance, a personal site): fetch them directly. Use `gh api` for the GitHub profile, the pinned or top repos, and their READMEs. Use a web fetch for Behance and personal sites. Say it first: "Pulling your GitHub. It's public; I'm only reading."
   4. **LinkedIn** is behind a login, so it needs the user's own browser. If a browser tool is connected, ask (plain yes/no): "LinkedIn needs your logged-in browser. Want me to read your profile there? I'll only read the page you give me. Nothing else, no clicks." No browser tool, or they say no: "No problem. On your profile, click More (or Resources), then Save to PDF. Drop the file here or paste the text." Never fetch a linkedin.com address with a plain web fetch. Never sign in or get past the login yourself.
   5. **Photo:** confirm the one you found, or invite one. It is optional and openly skippable.

   **Check:** every source on the work list was read, or the user got the fallback for it.

4. **Extract and merge, all sources in one pass.** Write the Person node and the Goal node (from step 2, with its `HAS_GOAL` edge). Pull Experiences, Education, Projects and Skills, with contributions, from everything gathered. Add a Document node for each file the user gave. Merge with the deterministic IDs, so overlap and re-runs merge instead of duplicating. Set `source` per node: `document` for files, `conversation` for chat, `github` for GitHub, `web_enrichment` for LinkedIn, Behance and personal sites. Never downgrade existing data.
   **Check:** `python3 "$PLUGIN_ROOT/scripts/graph_query.py"` prints the Person line and the Skill and Experience counts.

5. **Fill the gaps, and only the gaps.** Show the user what you captured. Then ask only about what is missing. No grilling. Never ask what a source already answered.
   - **Missing metrics** on the strongest contributions:
     > "Was there a number on this one? Rough is fine. Any of these shapes:
     > 1. A percentage: adoption, growth, something that dropped (recommended: the commonest shape, and 'about 40% of the team adopted it' counts)
     > 2. Money or time: saved, earned, cut
     > 3. People: team size, users reached, customers
     > 'No number' is a real answer too. The story still stands."
   - **Aim fields still blank** after step 2.
   - **The constraint question.** Data rarely answers it, so it is almost always a gap:
     > "What should I quietly keep in mind the whole way through?
     > 1. A pay floor (recommended: it shapes everything else, and I'll never raise it without asking)
     > 2. Geography or remote: where life needs you to be
     > 3. Something you worry reads badly: a gap, a pivot, your age"

     The answer goes into a Memory node, and in plain words into "What matters to them" in `user-story.md`.

   **The no-assets path** (inventory option 6, or nothing found). Build it from a conversation: the aim (step 2), then two more questions, no more and no fewer:
   - "Tell me about something you've done that you're proud of." Options: "You built or shipped something and a number moved (recommended: a metric makes the strongest opening)" / "You led people through something hard" / "You rescued something that was failing". This becomes the first Experience or Project.
   - The constraint question above.

   Then offer, with no "(recommended)" because their energy decides: "I'd like to hear about a couple more roles you've held. 1. Keep going now 2. Pick it back up later: everything so far is saved." Respect the answer. They can stop at any point.
   **Check:** at least one Experience has a contribution with a metric (or the user said there is no number), and the constraint question was asked.

6. **Headline stats and interests (skippable).** Run this after the contributions and before the confirm. Never blocking. A skip costs nothing: the portfolio hides its highlights panel when these are absent.
   - **Proudest numbers.** Build the options from metrics you already captured:
     > "I spotted these numbers in your story. Which belong at the top of your portfolio? Up to four:
     > 1. $2M+ client pipeline (recommended: your biggest)
     > 2. 37% adoption company-wide
     > 3. 6 engineers mentored
     > Or type your own, or skip. We can add these later."

     Max 4, picked by the user, never summed across (dollars next to percentages next to headcounts make no total). You pick each icon: a Material Symbols name that fits (`rocket_launch` for launches, `payments` for revenue, `groups` for people, `public` for reach). Keep `value` short and display-ready ("$2M+", "37%", "6"). Keep `label` a quiet lowercase phrase ("client pipeline").
   - **Interests.** "Last one, and it's skippable. Anything off the clock worth knowing? The kind of thing a future teammate would remember." Options: "A craft: typography, woodworking, film photography (recommended: concrete and human beats a list of adjectives)" / "Something physical: trail running, climbing, swimming" / "Something communal: mentoring, a local club, open-source weekends". Max 6, genuinely personal, not skills. If they offer a skill ("Python"), ask for the off-the-clock version.
   - Write both to the Person node as optional fields:

     ```json
     {
       "headline_stats": [
         { "icon": "payments", "value": "$2M+", "label": "client pipeline" },
         { "icon": "groups", "value": "6", "label": "engineers mentored" }
       ],
       "interests": ["typography", "trail running"]
     }
     ```

     Skipped, or no metrics: write nothing. No empty arrays, no placeholders. Whether the panel shows is not onboarding's call: `show_summary` lives on the CuratedPortfolio node, and `hope-portfolio` asks.
   **Check:** `headline_stats` has 4 or fewer entries and `interests` 6 or fewer, or the field is absent.

7. **Confirm the career file with the user.** Show it. Hold to this bar before going on:
   - The Person summary sounds like them, not boilerplate.
   - At least one Experience has a contribution with a metric.
   - At least 5 Skills have `USED_SKILL` edges.

   Ask "Anything off?" as a plain yes/no. If yes, send the fix menu (the voice guide's diagnostic exception, inline): "1. A date, title, or number that's wrong (recommended starting point: the most common miss) 2. A skill that's missing or doesn't belong 3. Something about how I've summarized you. Or just point at the line." Fix it before going on. The career file is theirs. It has to feel right to them.
   **Check:** the user said nothing is off, and all three bar items hold.

8. **Write the hand-off.** Four things, in this order:
   1. **The hand-off Memory node.** Every other skill reads it first:

      ```json
      {
        "id": "mem:<user-slug>:onboarding-complete:<date>",
        "topic": "onboarding-complete",
        "content": "Onboarded on <date>. User is aiming for <role> (<level>). Goal this hunt: <goal>. Time available: <time_per_week>/week. Runway: <deadline> (<deadline_reason if any>). Top skills: <list>. Constraints: <list>. Style preferences: <list>.",
        "category": "constraint",
        "importance": 0.95
      }
      ```
   2. **`user-story.md`**, beside `career-graph/`, in the layout from the user-story guide. Seed it from what you learned:
      - "Now": stage onboarded; next step the portfolio. Carry the aim and the clock: target role and level, the goal, time per week, and the runway (with the reason, if they gave one).
      - "Who <name> is": 2 to 3 sentences in their words, from the confirmed Person summary.
      - "How they like to work": the vocabulary read from step 1, their pace, how they took to the numbered choices. Add one line on working with AI: the modern hire ships with AI, so later steps lean toward real, shipped work built with an agent, not grinding alone.
      - "What matters to them": the constraint answer in plain words. It echoes the Memory node as prose. Never paste JSON.
      - "The journey so far": one dated line: onboarded, career file built from <sources>.

      Announce it in these words: "I keep a little notebook about how you like to work: `user-story.md`, yours to read or edit." Then show what you wrote.
   3. **Where the files live** (first run only): "I'll keep your whole job hunt right here in this folder: your career file, your portfolio, everything in one place you own: `<full path>`." Nothing goes to a hidden folder.
   4. **The protective `.gitignore`.** Use the block in `$PLUGIN_ROOT/references/hunt-folder.md` section 4. No `.gitignore` yet: create it with the block. One exists: append only the lines that are missing. Never delete the user's own lines. (The publish skill also uses a strict allowlist, so the live site never carries the career file.)

   **Check:** `grep -c "^## " user-story.md` prints 7, and `grep -c "career-graph/career.json" .gitignore` prints 1 or more.

9. **Show them their story.** If the user came in to apply right away (a job link in hand, or "set me up to apply"), go to Part 2 next. Otherwise go straight to the portfolio. Someone who just told you their story wants to see it. Say it plainly, then do it: "Your story's in. Now let me show you what it looks like." Start `hope-portfolio` for a general portfolio of their strongest work (no target role needed yet). Part 2 runs later, when `hope-start` finds it missing or the user asks.
   **Check:** the user is in `hope-portfolio`, or in Part 2 step 1.

**"Remember this", at any point.** If the user says "remember this" before `user-story.md` exists, create it right then (seeded minimally, per the guide). Write the note under "Remember this", dated, the same turn. Finish seeding it at step 8. A remember-ask never waits.

### Part 2: your hunt folder

Part 2 needs the career file. No Person node: run Part 1 first. In every step below, if the file already exists, never overwrite it (each copy command below skips a file that exists). Show what is there, ask what to change, and show any change as a table first (hard rule 15).

Group up to four related questions in one `AskUserQuestion` call. Each question has one "(recommended)" option, except where a step says there is no honest default. Dates inside these files follow `hunt-folder.md` section 3.

1. **Create `HUNT-PROTOCOL.md`.**
   1. Copy the template (everything below its `===` line):

      ```bash
      [ -e HUNT-PROTOCOL.md ] || sed '1,/^===$/d' "$PLUGIN_ROOT/references/hunt-protocol-template.md" | sed '/./,$!d' > HUNT-PROTOCOL.md
      ```
   2. Replace `<Name>` with the user's preferred name. Set "Last updated" to today.
   3. Delete every row marked `(example)`. They are Jane Doe samples that show the shape.
   4. **Seed the canon (section 2)** from the career file and the newest portfolio (if there is one): every title, company, date range, degree, and number the portfolio shows. One row each. Compute any "N years" claim with the lesson 14 command in `failure-patterns.md`. Never do it in your head.
   5. **Confirm every row with the user.** Up to four rows per `AskUserQuestion` call. Each question shows the fact and its wording. Options: "Confirm" / "Fix it" / "Drop it". No "(recommended)": only the user knows. A fixed row takes the user's wording. "Verified how" reads `<Name>, in chat, <date>`.
   6. **Anything that disagrees** (for example LinkedIn dates against résumé dates) goes in section 3, "Open discrepancies", with the action to reconcile.
   7. **Their standing rules (section 4).** Ask "Any standing rules for me?" as a multi-select. Options: "Ask before removing anything from my résumé (recommended: removing a true claim hurts as much as adding a false one)" / "Titles I never want, like Manager or Director" / "A pay floor I never go below" / "None for now". Write each rule they give: dated, in their words, with what Hope does about it. Step 2 reuses these answers. Never ask the same thing twice.
   8. **The recording protocol (section 6).** Ask the two `TODO` lines in one call. The app they record with: "Voice Memos (recommended: built into Mac and iPhone)" / "My meeting tool's recorder" / "Not sure yet". Where they usually take calls from: their state or country from the career file (recommended) / somewhere else. "Not sure yet" leaves the line as it is.

   **Check:** `grep -c "(example)" HUNT-PROTOCOL.md` prints `0`. `grep -c "^## " HUNT-PROTOCOL.md` prints `6`. `grep -n "<Name>" HUNT-PROTOCOL.md` prints nothing.

2. **Create `applications/_common/profile.md`, one section at a time.**
   1. Copy the template from `hunt-folder.md` section 5.2:

      ```bash
      mkdir -p applications/_common applications/_research
      [ -e applications/_common/profile.md ] || awk '/^### 5.2/{f=1} f&&/^````markdown$/{p=1;next} p&&/^````$/{exit} p' "$PLUGIN_ROOT/references/hunt-folder.md" > applications/_common/profile.md
      ```
   2. Replace `<Name>` and `<name>` with the user's preferred name, and `<country>` with the country they answer for. Set "Last updated" to today.
   3. Walk sections 1 to 7 in order, with the table below. Before each section, say its one-line why. The reason behind all of them: forms ask these. Answered once here, Hope never guesses them later.
   4. Prefill what you already know (the Person node, the Goal node, Part 2 step 1). Offer it as the "(recommended)" option: "Use what you told me: <value>".
   5. Anything the user skips or does not know stays `TODO (ask <name>)`. Never fill a blank with a guess.

   | Section | What to ask | The one-line why |
   |---|---|---|
   | 1. Identity and contact | Confirm email, phone, city and ZIP, mailing address, LinkedIn, GitHub. The portfolio URL comes from `.publish.json` if it exists. The legal name: the user types it, exactly as on their ID. The time zone (see below the table). | Every form starts here. A legal name that differs from the ID can stall a background check. Hope gives every call time and deadline in this time zone. |
   | 2. Work authorization | First: the country (or countries) they will work in. Then each question in the table, word for word. The user answers in their own words. | Forms ask three questions that sound alike and are not (`visa-and-sponsorship.md` section 1). A wrong answer can end an application. |
   | 3. Compensation rules | The floor, the screen, the ask policy, the written phrasing for recruiters, the number for numeric form fields, base vs OTE. | Forms ask for a number and reject blanks. A number typed in a hurry becomes the ceiling. |
   | 4. Location and relocation | Where they work from, cities they would move to, remote stance, relocation help, notice period or earliest start. | Forms ask where and when. Find jobs skips roles that fail it. |
   | 5. What they want and do not want | Target role shapes (from the Goal node), the verb test, title exclusions, seniority exclusions, role families that are out, the per-company cap (default 2), industries or companies excluded. | Find jobs and Apply skip what is ruled out here. |
   | 6. Voluntary self-identification | For each question: their answer, "leave blank", or "decline to self-identify". Plus any rule they want ("disclose at large companies, blank at startups"). | These are voluntary. Hope shows the choice again at every form review, so they can change it per company. |
   | 7. Standard answers | Why are you leaving (short and true). How did you hear about us. References. Start date. | Most forms ask these. "Why us" is written fresh for each company by `hope-write`. |

   For the time zone row, offer this computer's zone as the recommended option. This prints it (for example `America/New_York`):

   ```bash
   readlink /etc/localtime | sed 's#.*zoneinfo/##'
   ```

   Section 8 (hard limits for Hope) and section 9 (ATS notes learned) stay as the template has them. Section 8's one setting (fill factual fields without re-showing them) stays at its default, no. Only the user turns it on, in their own words. Mention once that it exists.

   **Work authorization and self-identification have no honest default.** Offer options with no "(recommended)", for example "Yes" / "No" / "It depends: I'll explain" / "Skip for now". Copy each answer exactly. Never work one answer out from another. Never infer status from a name, a school, or a past country. Never ask for or store a document number. If the sponsorship answer is anything but a plain "No", also ask the two extra lines in `visa-and-sponsorship.md` section 7 (the rule for "no sponsorship" postings, and how to say it to an agency recruiter). Add them under the section 2 table.

   **Check:** `grep -c "^## " applications/_common/profile.md` prints `9`. `grep -n "<Name>\|<name>\|<country>" applications/_common/profile.md` prints nothing. `grep -c "TODO (ask" applications/_common/profile.md` gives the count of gaps for the final report.

3. **Create `applications/_common/my-voice.md`.**
   1. Copy the template from `hunt-folder.md` section 5.4, then replace `<name>` and set "Last updated":

      ```bash
      [ -e applications/_common/my-voice.md ] || awk '/^### 5.4/{f=1} f&&/^````markdown$/{p=1;next} p&&/^````$/{exit} p' "$PLUGIN_ROOT/references/hunt-folder.md" > applications/_common/my-voice.md
      ```
   2. Ask for two or three real samples. Options: "An email I sent (recommended: emails are what Hope drafts most)" / "A cover letter" / "A LinkedIn post" / "No samples yet". Then ask them to paste each one in their next message. Store each one under "Samples", word for word, with its type and date. Never edit a sample.
   3. Fill "The signature block" from an email sample if one has it: name, city, phone, email, links, the separator style, the sign-off. No sample with a signature: build one from profile section 1 and confirm it (plain yes/no).
   4. Delete every placeholder line you did not fill (a line with `<...>` outside an HTML comment). Keep the HTML comments. Keep "No em dashes." in "Banned words and shapes".
   5. No samples yet: "Samples" and "Patterns Hope learned" stay empty. Tell the user `hope-write` fills this file from their edits.

   **Check:** `grep -c "^## " applications/_common/my-voice.md` prints `4`. `grep -n "<[A-Za-z]" applications/_common/my-voice.md` prints nothing. Each sample matches the paste, word for word.

4. **Put the one résumé at `applications/_common/resume.pdf`.**
   - **A portfolio exists** (a folder in `career-graph/documents/portfolios/`): run `python3 "$PLUGIN_ROOT/scripts/export_resume_pdf.py" <portfolio-folder> --out applications/_common/resume.pdf` (the portfolio skill's "The one résumé" explains it). If the script exits 2, ask the user to open the portfolio's `index.html`, click **Save as PDF**, and save the file as `applications/_common/resume.pdf`; wait until they say it is saved, and copy it here if they saved it elsewhere.
   - **The user has their own PDF:** copy it here as `applications/_common/resume.pdf`. Say the portfolio can replace it later.
   - **Neither:** leave it missing. `hope-portfolio` becomes the next step.

   Then say one line: LinkedIn and every job-site profile they keep (talent portals, ATS accounts) should match this résumé exactly. `hope-application` checks that when it applies.
   **Check:** `ls -l applications/_common/resume.pdf` shows the file, or the final report lists it as missing.

5. **Create the tracker.**

   ```bash
   python3 "$PLUGIN_ROOT/scripts/tracker.py" init --hunt-dir "<hunt folder>"
   python3 "$PLUGIN_ROOT/scripts/tracker.py" report --hunt-dir "<hunt folder>"
   ```

   `init` leaves an existing tracker as it is. Without openpyxl the script writes `job-tracker.csv` and prints the install line. Tell the user that once.
   Then ask: "Do you already track roles somewhere?" Options: "Yes, in a spreadsheet or notes: add them now (recommended: one log from day one)" / "No, starting fresh". If yes, read their file. Show the rows you would add as a table first. Then add one row per role with `tracker.py add` (the status words and the command are in `tracker-contract.md` sections 2 and 7.3). Mark a row `Applied` only when the user says they submitted it.
   **Check:** `ls job-tracker.*` shows the file, and `report` exits 0 with the row count you expect.

6. **Create `applications/_research/boards.txt`.**
   1. Ask "Which companies would you love to work at?" Options: "I'll list a few now (recommended: five to ten is plenty)" / "💬 Help me think of some first" / "Skip: Find jobs builds this list later". Their typed answer holds the names. Skip: write no `boards.txt` and go to step 7. `hope-discovery` creates it on its first run.
   2. For each company, try the obvious slug (lowercase, no spaces) on all three boards. Test them in a temporary folder, so nothing lands in the hunt folder:

      ```bash
      CHECK="$(mktemp -d)"
      printf '%s\n' greenhouse:acme ashby:acme lever:acme > "$CHECK/boards.txt"
      python3 "$PLUGIN_ROOT/scripts/sweep_boards.py" --boards "$CHECK/boards.txt" --include "<one target word>" --out "$CHECK/check.md"
      ```

      Replace `acme` with each slug, and `<one target word>` with a word from their target role (for example `designer`). Read the `Swept N board(s): X loaded, Y failed` line and every `Failed:` line.
   3. A company with no board that loads: open its careers page and read the apply link to find the real slug (the table in `$PLUGIN_ROOT/references/search-surfaces.md` section 2). Test again. Still nothing: it likely uses another system (Workday, its own site). Write it as a comment line: `# <company>: not on Greenhouse, Ashby or Lever. Check by hand.`
   4. Write only the boards that loaded to `applications/_research/boards.txt`, one per line. Tell the user which companies did not work, and that `hope-discovery` sweeps this list.

   **Check:** run the same sweep command with `--boards applications/_research/boards.txt` (keep `--out` in the temporary folder). The `Swept` line shows no failed boards.

7. **Create `WORKING-PAD.md`.**

   ```bash
   [ -e WORKING-PAD.md ] || awk '/^### 5.7/{f=1} f&&/^````markdown$/{p=1;next} p&&/^````$/{exit} p' "$PLUGIN_ROOT/references/hunt-folder.md" > WORKING-PAD.md
   ```

   Set "Last updated" to now (date, time, the user's zone, from `date`). Delete every placeholder line, including the `### <task>` block under "Paused". Then write one line under each heading: "Urgent" gets `- Nothing urgent.`, "Paused" gets `- Nothing paused. Hunt folder set up <date>.`, "Waiting on someone" gets `- Nobody yet.` If `hope-start` saved a job link under "Paused", keep that entry instead.
   **Check:** `grep -c "^## " WORKING-PAD.md` prints `3`, and `grep -n "<[A-Za-z]" WORKING-PAD.md` prints nothing.

8. **Extend the protective `.gitignore`.** Append every line of the block in `$PLUGIN_ROOT/references/hunt-folder.md` section 4 that is missing. Never delete the user's own lines.
   **Check:** run `git check-ignore -v HUNT-PROTOCOL.md WORKING-PAD.md job-tracker.xlsx applications/_common/profile.md`. In a git repository, all four paths print. Not a repository: the error is fine, and the block is ready if they ever run `git init`.

9. **Keep the notebook current.** Add one dated line to "The journey so far" in `user-story.md`, for example: "Hunt folder set up: protocol, profile (2 TODOs left), voice file, tracker, 4 boards." Rewrite "Now": the hunt is set up, and the next step. Tell the user in one line.
   **Check:** the newest journey line has today's date, and "Now" names the next step.

## Rules for this skill

Hard rules from `$PLUGIN_ROOT/references/hard-rules.md`:

- **Rule 2.** LinkedIn is read-only. Read it only in the user's signed-in browser, with their OK. Never a plain web fetch. No clicks.
- **Rule 4.** Never invent a fact. Every node, canon row and profile answer traces to a file or the user's words. Not on file: ask, or write `TODO (ask <name>)`.
- **Rule 5.** Never ask for or store passwords, payment details, SSN, passport, visa document or I-94 numbers. Never create accounts.
- **Rule 9.** Ask before removing a true claim or skill. Missing from Hope's context is not missing from the user's record.
- **Rules 12 and 13.** Plain English and no em dashes in everything the user reads and every file Hope writes for them.
- **Rule 15.** Show a change to an approved file as a table first: where, now, proposed, why.
- **Rule 16.** Do what was asked, first. Restate a long dictated message as a numbered list and get a yes before acting.
- **Rule 17.** Run `date` before writing any date.

Rules for this skill:

- **Hope never invents a fact about the user.** Every line (a bullet, a claim, an answer) traces to the career file or the user's own words in this chat. A claim you cannot source is a claim you do not make.
- **Every question is a choice.** Use `AskUserQuestion` (voice-guide rule 6): 2 to 4 options, exactly one "(recommended)" with a one-clause why. The tool's "enter your own answer" is the free-text escape hatch. This binds improvised questions too. The only exceptions: the inventory and the "anything off?" fix menu (inline numbered lists), plain yes/no confirms, and questions with no honest default (work authorization, self-identification, canon confirms, "keep going?"), which skip the "(recommended)".
- **Warm and curious, not a form.** A friend helping them get clear on their own story. Example: "Walk me through the last big role. 1. Start with the day-to-day (recommended: the texture is where the story lives) 2. Start with what changed because of you." When they say something interesting, follow up. When they are brief, don't pad. When they say "that's all", accept it.
- **The user attests work authorization and sponsorship in their own words.** Hope never infers them.
- **Their folders are theirs.** Read a pointed-to folder read-only. Never reorganize it. Copy only what you use, and say so.
- **Announce public fetches before they run.** Browser reads are read-only, and only on pages the user gave you.
- **When the user corrects Hope, write it the same turn.** A fact goes to the canon in `HUNT-PROTOCOL.md` (once it exists). A preference goes to "How they like to work" in `user-story.md`.

## What to tell the user when you finish

**After Part 1:** one line, "Your story's in. Now let me show you what it looks like.", then `hope-portfolio` (or Part 2, if they came in to apply now).

**After Part 2:** a short table of what was made, the TODOs still open in the profile, and the one next step. Example for Jane Doe:

| File | What it holds |
|---|---|
| `HUNT-PROTOCOL.md` | 12 confirmed facts, 1 open discrepancy (Linear end date), 2 rules in your words |
| `applications/_common/profile.md` | 9 sections. 2 TODOs: mailing address, references |
| `applications/_common/my-voice.md` | 2 samples (an email, a cover letter) and your signature block |
| `applications/_common/resume.pdf` | Saved from your portfolio |
| `job-tracker.xlsx` | Empty and ready |
| `applications/_research/boards.txt` | 4 boards that work. Northwind Labs is not on Greenhouse, Ashby or Lever, so it is listed to check by hand |
| `WORKING-PAD.md` | Nothing paused |

Then one line on the TODOs: "I'll ask for the mailing address and references when a form needs them." Then the next step as an `AskUserQuestion`: `hope-portfolio` if there is no portfolio yet. Otherwise `hope-discovery` ("Sweep your boards for roles that fit", recommended), or `hope-application` if they already have a job link.

## Done when

Part 1:

- [ ] `python3 "$PLUGIN_ROOT/scripts/graph_query.py"` prints a Person line.
- [ ] A Goal node with a `HAS_GOAL` edge holds the aim.
- [ ] At least 5 Skills have `USED_SKILL` edges, and at least one Experience has a contribution with a metric (or the user said there is no number).
- [ ] The user said nothing is off.
- [ ] The hand-off Memory node is written.
- [ ] `user-story.md` exists, was announced, and was shown.
- [ ] `.gitignore` protects `career-graph/career.json`.

Part 2:

- [ ] `HUNT-PROTOCOL.md` has no `(example)` rows, and the user confirmed every canon row.
- [ ] `applications/_common/profile.md` has 9 sections. Every answer was typed or confirmed by the user, or is `TODO (ask <name>)`.
- [ ] `applications/_common/my-voice.md` exists. Any samples are word for word.
- [ ] `applications/_common/resume.pdf` exists, or the report lists it as missing with the next step.
- [ ] `job-tracker.xlsx` (or `job-tracker.csv`) exists, and `report` exits 0.
- [ ] `applications/_research/boards.txt` holds only boards that loaded, or the user chose Skip.
- [ ] `WORKING-PAD.md` exists.
- [ ] `git check-ignore` passes, or the folder is not a git repository.
- [ ] `user-story.md` has today's journey line and a new "Now".

## Next

- **After Part 1:** `hope-portfolio`. "Your story's in. Now let me show you what it looks like."
- **After Part 2:** `hope-portfolio` if there is no portfolio yet. Otherwise `hope-discovery`: "Want me to sweep your boards for roles that fit?" If the user already has a job link, `hope-application`.
