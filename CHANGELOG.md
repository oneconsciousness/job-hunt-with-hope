# Changelog

All notable changes to the Hope plugin are documented here. Versions track `plugin.json` / `.claude-plugin/marketplace.json`.

## 2.0.1

- The website now shows copy-paste instructions for Claude Code and for OpenAI Codex (a terminal agent), instead of ChatGPT web chat, which was never tested. Claude is named as Claude Code everywhere. No skill behavior changed.
- README: the agents named are Claude Code and Codex.

## 2.0.0

Hope 2.0 makes the plugin match a real job hunt, end to end. Its maker ran a full hunt with an AI partner, and every habit that helped is now a skill, a reference file, or a script. Every skill is also rewritten so a smaller model (Claude Sonnet) can run it reliably.

### New

- **Start** (`skills/start/`). The front door. It reads your hunt folder, tells you where you are, routes you to the right skill, and teaches the daily rhythm.
- **Write** (`skills/write/`). Any message in your own voice: emails, LinkedIn messages, cover letters, form answers, nudges, replies to recruiters. Each draft is saved to a file, and you send it. Hope learns from every edit you make and records the pattern in `applications/_common/my-voice.md`.
- **Interview** (`skills/interview/`). The moment a call is known: a reminder to record it with your prep inside, a prep file, and prep blocks if you want them. After the call: a transcript made on your machine, a debrief with a question-by-question read, and the follow-up draft.
- **Sync** (`skills/sync/`). Reads your email and LinkedIn, read-only. Updates the tracker. Tells you what changed and what needs you. Never sends.
- **Tracker** (`skills/tracker/`). Owns `job-tracker.xlsx`, the one live log of the hunt: every role, its status, the next action, and dated notes. Answers "where do I stand" and "what needs me", and runs the weekly review.
- **The application profile** (`applications/_common/profile.md`). Every answer a job form asks that is not on the résumé: contact details, work authorization in your own words, pay rules, location, what you want and do not want, your self-identification choices, and standard answers. Asked once. Anything unknown is written as a to-do, never guessed.
- **The hunt folder.** One folder on your machine holds the whole hunt: your career file, `job-tracker.xlsx`, `HUNT-PROTOCOL.md`, and `applications/`, with one folder per role (the posting, the answers entered, drafts, interview prep, transcripts, debriefs).
- **`HUNT-PROTOCOL.md`, a rulebook that learns from your corrections.** Your settled facts and their approved wording, your standing rules, and lessons learned. When you correct Hope, it writes the correction down the same turn, with the date and your words, so it stops repeating the mistake.
- **Five scripts** that do the mechanical work, so the model does not have to improvise:
  - `scripts/tracker.py`: creates and updates `job-tracker.xlsx`, backs it up before every write, and falls back to a CSV file if `openpyxl` is missing.
  - `scripts/fetch_jd.py`: fetches a job posting through the job board's public API (Greenhouse, Ashby, Lever, Workday, SmartRecruiters, Oracle HCM) and writes `JD.md`.
  - `scripts/sweep_boards.py`: sweeps many job boards at once, matches on the job description, drops excluded titles and locations, skips roles already in the tracker, and writes a shortlist.
  - `scripts/make_ics.py`: writes a one-event calendar file when the AI has no calendar tool, so you can double-click it.
  - `scripts/transcribe.py`: transcribes a call recording on your machine with faster-whisper if it is installed. If not, it prints the install line and asks for a pasted transcript instead.
- **New reference files** in `references/`: `hard-rules.md` (the rules every skill follows), `hunt-folder.md`, `hunt-protocol-template.md`, `tracker-contract.md`, `ats-playbook.md`, `writing-rules.md`, `interview-kit.md`, `failure-patterns.md`, `visa-and-sponsorship.md`, `search-surfaces.md`.
- **A worked hunt folder for testing** at `assets/fixtures/persona-jane-doe/hunt/`.

### Changed

- **Onboarding** adds part 2. After the career file, it builds your application profile, your voice file (`applications/_common/my-voice.md`), `HUNT-PROTOCOL.md`, and the hunt folder. The protective `.gitignore` it writes now also covers `job-tracker*.xlsx`, `applications/`, and `HUNT-PROTOCOL.md`.
- **Find jobs** (`discovery`) is rewritten. It sweeps job boards through their public APIs, matches on the description and not just the title, screens against your rules, skips roles already in your tracker, and writes a dated shortlist file (`applications/_research/shortlist-<date>.md`) that says which method it used and what that method cannot see. You pick.
- **Apply** (`application`) is rewritten around the real form-filling protocol. One job link in: the posting saved as `JD.md`, a folder made for the role, the form filled in your browser with real keystrokes and every value read back, `APPLICATION-ANSWERS.md` written (every field entered, every field left for you and why, drafted answers, an honest fit read), and the tracker row added. A per-ATS playbook (`references/ats-playbook.md`) covers each form's quirks. It stops at submit. You press send.
- **Portfolio & résumé** and **Publish** get a plain-English pass. No contract changes: your career file and portfolio builds work as before. Portfolio adds the one-résumé rule: the same résumé (`applications/_common/resume.pdf`) goes with every application unless you ask for something else, and the tailoring goes into the writing.
- **Every skill is rewritten in plain English** with the same seven headings in the same order (Before you start, What you make, Steps, Rules for this skill, What to tell the user when you finish, Done when, Next): numbered steps, exact file names, and a check after each step, so a smaller model can run it.
- **Version markers** are `2.0.0` in every shipped skill, `plugin.json`, and `.claude-plugin/marketplace.json`.

### Retired

- **Skill Gap, Proof Projects, and Dashboard** moved to `skills-roadmap/retired/` (`skill-gap/`, `proof-projects/`, `dashboard/`). They no longer load with the plugin. Why: the real hunt never ran them. What replaced them: the tracker (`job-tracker.xlsx`) replaced the dashboard, and an honest fit read for each role now lives inside Find jobs and Apply. The dashboard templates moved to `skills-roadmap/retired/dashboard/`, and `scripts/skill_gap_xlsx.py` moved to `skills-roadmap/retired/skill-gap/`. Nothing in them was deleted.
- **The unshipped v0.1 scaffolds** for application, discovery, dashboard, interview, and hope were removed from `skills-roadmap/`. Shipped skills replaced them. They remain in git history.

### Migration (from 1.5)

- **Nothing breaks.** `career.json`, `user-story.md`, and your portfolio builds are unchanged.
- **Update Hope** (see "How to update" in the README), then start a fresh chat.
- **Run onboarding again** to build your application profile and your hunt folder (`HUNT-PROTOCOL.md`, `job-tracker.xlsx`, `applications/`).
- **If you used the dashboard,** the tracker takes its place. Say "where do I stand" and Hope reports from `job-tracker.xlsx`.

## 1.5.1

- **Résumé PDF export — fixed stranded blank pages and orphaned role headers.** The 1.5.0 fix for "a role taller than the remaining page gets pushed whole to the next page" only applied to the Top 5 / Complete content modes. The default **Highlights** mode kept the old keep-together rule, so a real (non-fixture) curated role could still strand up to ~2in of blank page. Also fixed: a role's title/company/dates line could print alone at a page bottom with its bullets pushed to the next page. Both now fixed for every Style/Font/Fit/Content combination.

## 1.5.0

- **Recruiter-first contribution bullets** — the Experience contribution card drops the old 7-layer head row (number, type icon, domain, scope badge, boxed metric badge, competencies row) for a calm 3-layer bullet: the action sentence, an optional soft-slab result line, and a row of skill chips. Figures and the first mention of each skill are auto-bolded so a 7-second skim lands on the numbers and the tech.
- **Optional per-role logo** — `experience[].logo` lets a role point at an explicit local logo file, which wins over the Google-favicon lookup (useful for dead domains or better art).
- **Expanded-card clip fix** — `.item-card.expanded .item-body` max-height raised from 1500px to 5000px; roles with 10+ contributions no longer clip.
- **Resume export content options** — planned for a follow-up commit on this branch (choose curated highlights vs. top-5 vs. every contribution per role when exporting the ATS résumé).

## 1.4.0

- Discovery and application skills, plus a dashboard board.

## 1.3.0

- Fit verdict, referral-first lens, integrity promise, LinkedIn checklist.

## 1.2.0

- Milestone-2 skills: skill gap, proof projects, dashboard.
