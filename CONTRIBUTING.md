# Contributing to Hope — Agent Operating Guide

You are a coding agent contributing to **Hope** — Claude Code, Cowork, Cursor, Copilot, Codex, or whatever comes next. You are the highest-level agent operating on this repo, and this file is your contract. Read it before you touch anything.

This is the **public** contract: the essentials, addressed to you, the agent. Humans contribute too and the same rules bind them — but the framing here assumes you're the one holding the keyboard.

---

## Hard invariants — read these first

These five are non-negotiable. They protect the trust Hope is built on. Breaking one is not a bug, it's a betrayal of the promise.

1. **Data ownership is sacred.** Never add telemetry, analytics, or anything that phones home. Never move a user's secret or career-data file off their machine (`curl`/`scp`/`rsync` upload, `source .env`, `--env-file`, `--data @file`). Hope's flagship promise is *your data stays on your machine, nothing phones home.* No exceptions, no override.
2. **Confirm-before-submit on `application` is permanent.** The confirm-before-submit guardrail on Computer Use auto-fill is part of Hope's brand promise. You never remove it. The same posture (confirm-before-irreversible) extends to every irreversible action on the user's external assets — see §7.
3. **Design tokens are locked.** The visual identity in `references/design-tokens.md` (`--accent-orange`, `--accent-cyan`, the layout, the texture) is the brand. Changes require explicit maintainer sign-off. See §10.
4. **No secrets or user career data in commits.** `career.json`, `user-story.md`, `.env`, `*.pem`, `credentials.*` are gitignored on purpose. Never commit them, never read-and-print them into your context. User-managed only. See §13.
5. **No silent spec deviation.** When you work from a written spec — a schema, a plan, a payload contract, an output format — the spec is ground truth. Silent additions, omissions, or "improvements" are failures even when tests pass. Ask first. See §9.

If you're unsure whether something violates one of these, **treat it as a violation and ask.** A 30-second pause is cheaper than an irreversible mistake.

---

## 1. What Hope is (and what you're maintaining)

Hope is a **free, open-source (MIT) Claude plugin for the job hunt.** It is for **job seekers**, anyone looking for work, not recruiters. Hope runs the whole hunt with the person: it helps them **present themselves, find roles worth their time, apply well, and keep score.** Other job-search plugins can run alongside it (skills are namespaced).

The hunt is organized around the person, not a pipeline. **Ten skills** live under `skills/<folder>/SKILL.md`. Each one's frontmatter name is `hope-<folder>` (for example `hope-start`).

| Group | Skill (`skills/<folder>/`) | What it does |
|---|---|---|
| Set up | `start` | The front door. Reads the hunt folder, tells the user where they are, routes them to the right skill, and teaches the daily rhythm. |
| | `onboarding` | Meets the person and builds the career file. Then builds the application profile and the hunt folder. |
| Show your work | `portfolio` | **The signature output.** The designed portfolio and the one résumé. |
| | `publish` | Puts the portfolio on a free website the user owns. |
| Run the hunt | `discovery` | Sweeps job boards through their public APIs, matches on the description, screens against the user's rules, skips what is already in the tracker, and writes a shortlist. |
| | `application` | One job link in: the posting saved, the role folder made, the form filled with real keystrokes, the answers file written, the tracker row added. Stops at submit. |
| | `write` | Any message in the user's own voice, saved to a file. The user sends. |
| | `interview` | The record-the-call reminder, the prep file, the calendar. After the call: transcript, debrief, follow-up draft. |
| | `sync` | Reads email and LinkedIn (read-only), updates the tracker, and reports what changed and what needs the user. |
| Keep score | `tracker` | Owns `job-tracker.xlsx`: where the user stands, what needs them, the weekly review. |

Three 1.5 skills retired in 2.0 (`skill-gap`, `proof-projects`, `dashboard`). They live in `skills-roadmap/retired/` and do not load with the plugin.

**The signature artifact** is a designed, self-contained **HTML portfolio website**, built from a personal **career graph**: a single file (`career.json`) that lives on the user's own machine. Hope can now **publish** that portfolio to a free website the user owns (GitHub Pages).

**The hunt's live log** is `job-tracker.xlsx` in the user's hunt folder: one row per role, written through `scripts/tracker.py`. If a markdown file and the workbook disagree, the workbook wins.

**Brand promises you must not break:** your data stays on your machine (no telemetry, nothing phones home); Hope never sends anything in the user's name (it drafts and fills; the user sends); LinkedIn and email are read-only; the design is consistent (light/dark themes, fixed layout); the voice is honest and warm. The full list is `references/hard-rules.md`. Works wherever Claude Code runs: CLI, Cowork desktop, claude.ai.

**Voice, in one line:** warm, plain, specific, honest, quiet. A thoughtful friend who knows how this works, not a hype-y chatbot. **Read `references/voice-guide.md` in full before touching any user-facing text.** See §11.

---

## 2. Setup and fixture verification

Hope is a content-and-skills plugin. There's no build step and **no Python test suite yet.** Verification is **fixture-driven.**

1. Clone the repo. The scripts use the standard library first. Optional dependencies degrade gracefully: `networkx` (graph scripts), `openpyxl` (`tracker.py` writes a CSV without it), `faster-whisper` (`transcribe.py` prints the install line without it).
2. The persona fixture lives at **`assets/fixtures/persona-jane-doe/`** (`profile.json`, `resume.txt`, `sample-portfolio/`). It's your smoke test for every change.
3. **`assets/fixtures/persona-jane-doe/hunt/`** is a worked hunt folder for the hunt skills and scripts: the tracker (`job-tracker.xlsx`), the application profile and voice file (`applications/_common/profile.md`, `my-voice.md`), the protocol (`HUNT-PROTOCOL.md`), a sample application folder (`applications/acme-senior-product-designer/`: `JD.md`, `APPLICATION-ANSWERS.md`, `INTERVIEW-PREP.md`, a debrief), the boards list (`applications/_research/boards.txt`), and a dated shortlist in `applications/_research/`.
4. To test a skill or template end-to-end: run the skill against `assets/fixtures/persona-jane-doe/profile.json`, generate the artifact, and verify it in **both** themes. For the hunt skills (`start`, `discovery`, `application`, `write`, `interview`, `sync`, `tracker`), copy `hunt/` to a temp folder and run the skill there, so the fixture stays clean. A quick read-only check: `python3 scripts/tracker.py report --hunt-dir assets/fixtures/persona-jane-doe/hunt`.

**Fixture-driven verification is the gate.** If you can't verify a change against the fixture, you can't claim it works.

---

## 3. Architecture: where everything lives

```
skills/<folder>/SKILL.md   the main unit of work: ten skills, one shape, loaded on demand by frontmatter description
assets/templates/          the visual identity: portfolio, résumé, cover-letter templates (self-contained HTML, inline CSS, design tokens)
assets/fixtures/           the persona fixture you verify against (career file + a worked hunt folder)
references/                the shared rules, file contracts, and guides every skill reads (listed below)
scripts/                   the mechanical work, so the model does not improvise (listed below)
skills-roadmap/            not loaded by the plugin: later-release skills and the retired 1.5 skills
plugin.json                the plugin manifest (+ .claude-plugin/marketplace.json)
```

**`references/`**

| File | What it holds |
|---|---|
| `hard-rules.md` | The rules every skill follows (never sends, read-only LinkedIn and email, never invents a fact, and the rest). |
| `hunt-folder.md` | The user's hunt folder and the contract for every file in it. |
| `hunt-protocol-template.md` | The empty `HUNT-PROTOCOL.md` a new user gets. |
| `tracker-contract.md` | `job-tracker.xlsx`: the columns, the status words, the note format, the backup rule. |
| `ats-playbook.md` | Per ATS: how to get the posting, form quirks, what to read back. |
| `writing-rules.md` | Email and cover-letter shapes, plain English, how to learn from an edit. |
| `interview-kit.md` | The record-the-call protocol, the prep file and debrief shapes. |
| `failure-patterns.md` | Seven ways an agent goes wrong, with the check for each. |
| `visa-and-sponsorship.md` | Work authorization in plain words. Not legal advice; the user states their own status. |
| `search-surfaces.md` | Where good roles come from and how to read each one, read-only. |
| `career-graph-schema.md` · `voice-guide.md` · `design-tokens.md` · `user-story-guide.md` · `computer-use-guardrails.md` · `milestones.md` | Kept from 1.5. `milestones.md` now describes the 2.0 journey. |

**`scripts/`**

| Script | What it does |
|---|---|
| `tracker.py` | Creates and updates `job-tracker.xlsx`. Backs up before every write. CSV fallback. |
| `fetch_jd.py` | Fetches a posting through the ATS's public API and writes `JD.md`. |
| `sweep_boards.py` | Sweeps many boards, matches on the description, skips roles already tracked, writes a shortlist. |
| `make_ics.py` | Writes a one-event calendar file when the agent has no calendar tool. |
| `transcribe.py` | Transcribes a call recording locally with faster-whisper, if installed. |
| `graph_query.py` · `markdown_graph_convert.py` · `verify_portfolio_structure.py` · `verify_portfolio_pdf.py` | Kept from 1.5. |

**The career graph schema is the data contract.** Every skill reads and writes the shape documented in **`references/career-graph-schema.md`**: node types, fields, deterministic IDs, confidence propagation, source attribution. Reference fields by their canonical names from that file. See §13. The hunt files (`job-tracker.xlsx`, `applications/`, `HUNT-PROTOCOL.md`) have their own contracts in `references/hunt-folder.md` and `references/tracker-contract.md`.

> **Agent-local, not in the public repo:** `CLAUDE.md` (your deeper rulebook), `references/design-cookbook.md` and `references/design-system.md` (maintainers' design deep-dive), `tasks/`, and `.claude/`. These are gitignored on purpose. **Never commit them.** If you're operating in a cloned workspace, CLAUDE.md is your local technical layer, but the load-bearing rules are all here too.

---

## 4. Contribution types and their verification gates

| You touched… | Gate before you open a PR |
|---|---|
| a **skill** (`skills/<folder>/SKILL.md`) | Run it against the persona fixture. The **output shape must match the skill's spec.** Keep the frontmatter `description` precise: it's what Claude reads to decide when to invoke the skill. Don't add scope; propose a new skill instead. **Keep the seven-heading shape**, in order (`Before you start` · `What you make` · `Steps` · `Rules for this skill` · `What to tell the user when you finish` · `Done when` · `Next`), keep the `hope-skill-version` marker, and pass the 2.0 checks: **no em dashes**, **none of the maker's personal data** (examples use Jane Doe), and **every `references/` and `scripts/` file the skill cites exists.** Maintainers run these checks locally as `tasks/verify-2.0.sh`; `grep` covers each one. |
| a **template** (`assets/templates/*.html`) | Render it in **both dark and light** themes. Open **each** render, enumerate every visible defect, and confirm the theme toggle works and persists. See the rule below. |
| the **schema** (`references/career-graph-schema.md`) | Bump `hope_schema_version`, document the migration path, update `scripts/graph_query.py` **and** `scripts/markdown_graph_convert.py`, and update the persona fixture so it still conforms. |
| a **script** (`scripts/*.py`) | Run it **end-to-end** against the persona fixture (the hunt scripts run against a temp copy of `assets/fixtures/persona-jane-doe/hunt/`). `python3 scripts/<name>.py --help` exits 0. Standard library first; optional dependencies degrade gracefully. |
| the **publish path** (GitHub Pages) | After publishing, fetch the **live URL cache-busted** (e.g. `?v=<timestamp>` or a no-cache request) and confirm it serves the **new** content, not just that `git push` or the Pages Action went green. Pages has deploy lag + CDN caching; that's an **external wait**, and "the Action is green" is not "the new site is live." |
| **anything a user will feel** (a new or upgraded skill, a roadmap skill published from here on, a visible template change) | Add a **user-facing changelog entry**. See *"Every user-visible change earns a changelog line"* below. A skill that ships without one is an **incomplete ship.** |

**Captured is not correct.** When a change touches a template, theme, or the portfolio, **open every render and name each defect**: truncation, leaked layout, a token that resolved wrong, a broken toggle. Never report success from a single glance. "Rendered" is not "correct," and "10/10 generated" without a per-render defect list is not a passing report.

**Choosing between variants** (two layouts, two cover-letter tones, a theme tweak)? Render both, have a **separate reviewer** (a second agent or a human) judge them against the voice guide and design tokens, and record **problem → options → findings → pick** in the PR. **You never grade your own variant**: the implementer is biased toward its own work.

**If you can't verify a change, say so explicitly in the PR.** Don't claim success you didn't earn.

**Every user-visible change earns a changelog line.** A skill that ships (a new one, an upgrade to one that exists, **any roadmap skill published from here on**) is **not done until a non-technical, benefit-first entry lands in the user-facing changelog**: `agenthope.ai`'s `_data/changelog.yml`, rendered on `/skills/`. Adding it is one YAML row; the format makes consistency automatic. This is a **release gate**, not an afterthought: shipping a skill without a changelog line is an incomplete ship, the same as shipping it without bumping the version. Write for the **job seeker, not the engineer**: the `headline` is the **one thing they gain**, in plain words (this is the skim target); the `body` is a sentence on what it means for them. **No jargon** (`graph`, `node`, `schema`, filenames), no version numbers, no internal mechanics. What matters to *them* is what matters.

> Good: *"Hope now learns your goal and your timeline."*
> Bad: *"Added a Goal node to the career-graph schema (v1.1)."*

---

## 5. Branch and commit discipline

**Branches** are lowercase, hyphenated, type-prefixed. No spaces, no underscores, no camelCase, no personal names, **no quality claims.**

- Prefixes: `feature/` · `fix/` · `docs/` · `chore/` · `refactor/` · `perf/` · `test/`
- ✅ `feature/portfolio-light-mode-fix` · `fix/portfolio-theme-toggle` · `docs/voice-guide-examples`
- ❌ `jane-fix` · `claude-update` · `tmp` · `wip` · `my-changes`
- ❌ `portfolio-final` · `fix-actually-working` · `theme-v2-fixed` · `passing` — a quality claim in the name primes the next reviewer toward confirmation instead of skepticism. The assessment lives inside the file's summary, not in its name.

Skill self-fixes use a reserved pattern (see §12): `chore/skills/<skill-name>/<issue-kebab>`.

**Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description in imperative mood, ≤ 72 chars

Optional body wrapped at 72 — explain *why*, not *what*.

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat` · `fix` · `refactor` · `perf` · `chore` · `docs` · `test`. Common scopes: `skill`, `template`, `schema`, `dashboard`, `portfolio`, `resume`, `cover-letter`, `discovery`, `application`, `publish`, `voice`, `design`.

```
feat(portfolio): add light-mode section break
fix(portfolio): persist theme toggle on reload
docs(voice): add met-not-processed example pair
```

**Never commit or push directly to `main`.** Hope is single-branch today — every change goes through a feature branch + PR. One atomic change per commit.

---

## 6. Pull request protocol

**Before you open one:** the fixture/theme gate (§4) must pass, and the PR is **one concept.** If you're tempted to bundle, open two.

Use this template:

```markdown
## What
One paragraph: what does this PR change?

## Why
Link the issue or describe the user-visible problem. (Why, not what — the diff answers what.)

## How to test
Step-by-step, verifiable in < 5 min. Which fixture / theme / skill invocation to run.
For visual changes: open both theme renders and name each defect you checked.

## Risks / rollback
What could break? How to revert?

## Screenshots
If anything visual changed: dark + light theme screenshots.
```

**Merge gate:** one reviewer minimum, CI green, **squash-merge** to `main`. **Post-merge fixes go in a NEW PR** off `main` — never amend, force-push over, or revert-and-recommit on the merged branch. The history stays linear and every change keeps its own review record.

---

## 7. Confirm-before-irreversible — external actions on the user's assets

Hope can act on things the user owns **outside this repo**: their GitHub repo, their live portfolio site, an actual job submission. Any **irreversible** action of that kind requires an explicit confirm gate. You **prepare and show** the action; the user **confirms** (or runs it):

- a short card stating **(a) exactly what will happen** and **(b) what is hard or impossible to undo**, then you wait for an explicit yes.

This generalizes the confirm-before-submit guardrail to every irreversible external move: `gh repo create`, overwriting a published Pages site, deleting or renaming the site repo, submitting an application. **Confirm-before-submit on `application` is a hard invariant** (above); `publish` gates the same way. The Computer Use guardrail philosophy is documented in `references/computer-use-guardrails.md` — apply it, never weaken it.

---

## 8. The kind-stop protocol — when you're about to break a rule

The goal is **not** to block work. It's to **catch the deviation early**, explain it without condescension, and offer a path that reaches the same outcome through the right channel. Assume good faith. Keep the warning short, kind, specific.

**Stop and warn before:**

1. Committing or pushing directly to `main` (no branch / no PR).
2. Force-pushing to `main` or any branch someone else may be on.
3. A personal-name, vague, or quality-claim branch name.
4. Skipping the fixture/theme verification (§4) before a PR.
5. A commit message that isn't Conventional Commits.
6. Opening a PR without the standard template, or bundling more than one concept.
7. Modifying design tokens without maintainer approval (§10).
8. Removing or weakening a Computer Use / confirm-before-submit guardrail (§7).
9. Adding telemetry, analytics, or anything that phones home.
10. Committing files that are gitignored on purpose (`career.json`, `user-story.md`, `.env`, `CLAUDE.md`, `references/design-cookbook.md`, `tasks/`, `.claude/`).

**Warning format:** restate the request neutrally → say why you're pausing (the specific rule + one plain-language sentence on why it exists) → suggest a concrete path forward → offer the override ("reply *proceed anyway* and I'll do it, and note the deviation in the PR"). One warning per deviation; once they've chosen, don't re-warn the same thing.

**Tone:** lead with the request, not the rule. No "you violated." No lectures — one sentence on why. Always offer a path. Always offer the override, and treat it kindly. Soft language is fine; vague language is not.

**Refuse outright — no override:** force-push to `main`; delete `main`; commit a secret, `career.json`, `user-story.md`, or any gitignored internal doc; anything that breaks user data ownership (telemetry, exfiltration). For these, say plainly that you can't do it even with "proceed anyway," name what breaks, and step back — the user does it manually with full awareness of the blast radius.

---

## 9. Plan adherence — ask, don't assume

When you work from a written spec — a plan, a column list, the schema in `references/career-graph-schema.md`, a payload contract, an output format — **the spec is the source of truth and silent deviation is forbidden.**

1. **Diff before declaring done.** Compare every field / column / key in your output against the spec. Anything missing is a bug. Anything extra without sign-off is unsanctioned drift. Both are failures even if tests pass.
2. **Plan contradictions = STOP and ask.** A recommendation inside an unlocked open-questions section is a candidate for human review, not a default to silently follow. Surface the contradiction; let the human lock the answer before you code.
3. **Default to replacement, not addition.** When a plan says swap X for Y, ship a swap. "Keep X as a fallback gated by a flag" is dual-path complexity sold as safety — it needs a **named, real failure mode**, not a hypothetical rail.
4. **Rollout ramps live in deploy config, not in the artifact.** The artifact ships the new behavior as the only behavior; ops decides which version is live.
5. **"Improvement" is not an exception.** "I'll add this column since we expanded scope" and "I'll drop that one since it seems redundant" are both unsanctioned drift. Ask first.

When **porting between iterations** (a v0.1 schema → v0.2, an old template → a new one), diff against the prior version. Forgetting a field is the same severity as adding one without sign-off.

---

## 10. Design system and templates

Templates live in `assets/templates/` and are **self-contained HTML** — inline CSS that references design tokens, inline SVG, **no external dependencies** (Mermaid is the one allowed CDN). They are visible to every user, so the bar for changes is high.

**Two kinds of visual work — know which you're doing:**

- **The Signature template** (the default look) — its layout, texture, and tokens
  are the locked brand identity (hard-invariant #3). The rules in this section
  govern it; a *theme* here swaps **only accent tokens** — never layout, type, or
  texture.
- **An alternate template** (a contributed design — Editorial, Terminal, Executive…)
  — a *distinct look* over the **same data contract**. Alternate templates are
  **free to define their own layout, type, and texture**, but are bound to the
  data-driven `HOPE_DATA` v2 contract, the self-contained/offline law, and the
  functional requirements. Contributing one is governed by
  **[`CONTRIBUTING-portfolio-designs.md`](CONTRIBUTING-portfolio-designs.md)** — read it first.

**`references/design-tokens.md` is the locked canon.** Read it before generating or editing any visual output. Key rules it encodes:

- **Identity is structural** — the layout, the interactive section grid, the textures (scanline + 32×32 grid + subtle glows) are the brand. **Color is themeable.**
- **Default is light** (warm cream + orange); dark is the alternate. Never auto-switch by OS preference.
- Every component reads `var(--token)` — **never a raw hex.** A theme is a token swap, never a layout edit.
- **The theme toggle is mandatory on every artifact** and persists to `localStorage`. Test both themes (§4).
- Custom themes may swap **only the accent tokens** — never layout, type, radii, or texture.

**Do not modify design tokens without explicit maintainer approval** (hard invariant #3). The deeper rationale — per-component anatomy, schema→UI mapping, production lineage — lives in the maintainers' design cookbook, which is local-only; the principles in `design-tokens.md` are the shippable canon every skill and template depends on.

---

## 11. Voice and user-facing text

**Read `references/voice-guide.md` in full before writing any user-facing text** — chat replies, cover letters, portfolio narratives, dashboard copy, error messages, prep packets.

Six principles:

1. **Met, not processed** — "I've gone through your résumé," not "we parsed and extracted 14 skills."
2. **Specific, not generic** — name the company, the role, the moment.
3. **Honest, not boosterish** — no "amazing!", no "you've got this!" Tell the truth, including hard truths, with care.
4. **Plain, not corporate** — talk like a person. No "leverage your synergies."
5. **Quiet, not loud** — calm UI, calm voice. No exclamation points unless the user used one first.
6. **Choices, not blanks** — every question is 2–4 numbered options with exactly one (recommended) and a one-clause why; free text always honored as the escape hatch.

Apply the same voice to **your PR descriptions, issue reports, and code comments.** Specific over generic, honest over boosterish, plain over corporate, quiet over loud.

---

## 12. Skills — the self-improvement rule

Skills live in `skills/<name>/SKILL.md` and load on demand when a user request matches the frontmatter `description`.

**When a skill's instructions don't work in your environment** (OS difference, missing dependency, ambiguous step), **do not silently work around it:**

1. **Stop.** Don't paper over the broken step. Stash the user's current state if needed; note their branch.
2. Branch off `main`: `chore/skills/<skill-name>/<issue-kebab>`.
3. Fix the broken step in `SKILL.md`. Tag the fix with the environment where you verified it.
4. Commit (`chore(skills): fix <skill-name> for <env/issue>`), push, open a PR.
5. Switch back to the user's original branch, restore their state, and **resume the original task using the now-fixed skill.**

The `chore/skills/…` pattern is intentional — maintainers filter skill fixes via `gh pr list --search "chore/skills/"`. **Silent workarounds defeat the protocol.** The skill set heals through use: every session either works or improves the skill for the next one.

---

## 13. Schema, migrations, and secrets discipline

**Schema.** The career graph schema (`references/career-graph-schema.md`) is the single source of truth for node types, fields, and contracts. All schema changes go through a migration: bump `hope_schema_version`, document the path, update `scripts/graph_query.py` + `scripts/markdown_graph_convert.py`, and update the persona fixture. Reference fields by their canonical names.

**Secrets and career data are user-managed, never agent-managed.** `career.json`, `user-story.md` (the user's personal notebook), `.env`, `*.pem`, `*.key`, `credentials.*`, `secrets.*`, `~/.ssh/*` belong to the user.

- **You never write or edit a secrets file** (`Edit`/`Write`/`MultiEdit`). Even when you hold the new value, the write is the user's — print the proposed change as text and let them paste it.
- **You never read-and-print a secret into your context** — no `cat`/`head`/`tail`/`less`/`grep` (without `-l`/`-c`/`-q`)/`awk` on a secret or career-data path. The contents would land in your transcript and become exposable.
- **You never move these files off the machine** — no `curl`/`wget`/`scp`/`sftp`/`rsync`/`nc`/`ftp` upload of a secret, `career.json`, or `user-story.md`, no `source .env` / `. .env`, no `--env-file <secret>`, no `--data @<secret>` / `-F field=@<secret>`. This is the data-ownership promise enforced as behavior, not just config. **Refuse outright** (§8).
- **Allowed:** metadata-only and in-place ops that don't expose or exfiltrate — `ls -la`, `wc -l`, `chmod`, `mv`/`cp` between user-owned paths, `grep -l/-c/-q`, `sed -i 's/^KEY=.*/KEY=<new>/'`, `echo "KEY=value" >> .env` (a value the user gave you, on a file you haven't read).

---

## 14. Code style quick reference

- **Markdown skills** — follow the structure of a polished `SKILL.md` (`skills/onboarding/`, `skills/portfolio/`). Precise frontmatter `description`. No scope creep.
- **Python** — type hints on signatures. Standard library first; `networkx` optional. `log = logging.getLogger(__name__)`, never `print()` in real paths.
- **HTML templates** — inline CSS using design tokens. No frameworks. Self-contained.
- **JSON** — 2-space indent.

---

## 15. What Hope won't accept

- Breaking the design system without explicit maintainer approval.
- Removing or weakening Computer Use / confirm-before-submit guardrails.
- Adding telemetry, analytics, or anything that phones home.
- Adding an audience qualifier ("for designers only", "for engineers") — Hope is for **anyone** looking for work.
- Anything that compromises user data ownership.

---

## 16. Where to find things

**Public (committed):**

- Skills: `skills/<folder>/SKILL.md` (`start`, `onboarding`, `portfolio`, `publish`, `discovery`, `application`, `write`, `interview`, `sync`, `tracker`)
- Later-release and retired skills (not loaded): `skills-roadmap/` (retired 1.5 skills in `skills-roadmap/retired/`)
- Templates: `assets/templates/`
- Persona fixture: `assets/fixtures/persona-jane-doe/` (worked hunt folder: `hunt/`)
- Hard rules: `references/hard-rules.md`
- Hunt folder and file contracts: `references/hunt-folder.md`, `references/tracker-contract.md`, `references/hunt-protocol-template.md`
- Applying: `references/ats-playbook.md`, `references/computer-use-guardrails.md`
- Writing: `references/writing-rules.md`
- Interviews: `references/interview-kit.md`
- Finding roles: `references/search-surfaces.md`, `references/visa-and-sponsorship.md`
- Failure patterns: `references/failure-patterns.md`
- Schema: `references/career-graph-schema.md`
- Voice: `references/voice-guide.md`
- Design tokens (locked canon): `references/design-tokens.md`
- The journey: `references/milestones.md`
- Scripts: `scripts/tracker.py`, `scripts/fetch_jd.py`, `scripts/sweep_boards.py`, `scripts/make_ics.py`, `scripts/transcribe.py`, `scripts/graph_query.py`, `scripts/markdown_graph_convert.py`, `scripts/verify_portfolio_structure.py`, `scripts/verify_portfolio_pdf.py`
- Manifest: `plugin.json`, `.claude-plugin/marketplace.json`
- Release notes: `CHANGELOG.md`

**Local-only (gitignored, never commit):** `CLAUDE.md` · `references/design-cookbook.md` · `references/design-system.md` · `tasks/` · `.claude/`

---

## 17. When you're unsure or blocked

If you don't know whether something violates the rules, **treat it as a violation and ask.** Use the kind-stop protocol (§8) to surface the deviation, name the specific concern, and offer a path forward. Ambiguity resolves toward the user's trust and Hope's promises — never away from them.

---

By contributing, you agree your contributions are released under the **MIT License**.

Hope is a gift. Make it better without breaking the promise.
