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

Hope is a **free, open-source (MIT) Claude plugin for the job hunt.** It is for **job seekers** — anyone looking for work — not recruiters. It does **not** specialize in *finding* job listings — other plugins do that, and they coexist with Hope (skills are namespaced). Hope's strength is helping a person **present themselves and apply well.**

The hunt is organized as **milestones**, not pipelines — seeker-centric, not item-centric. **Twelve skills** live under `skills/<name>/SKILL.md`:

| Milestone | Skills |
|---|---|
| 1 · Onboarding — meet the person, build the career graph | `onboarding` |
| 2 · Discovery — find roles worth pursuing | `discovery` |
| 3 · Presentation — **the signature output** | `portfolio` · `resume-tailor` · `cover-letter` · `publish` |
| 4 · Application — submit, with confirm-before-submit guardrails | `application` |
| 5 · Interview — prep, rehearse, reflect | `interview` |
| 6 · Negotiation — comp, scripts, competing offers | `negotiation` |
| 7 · Decision — accept, decline, close out | `decision` |
| Cross-cut — the pulse of the hunt | `dashboard` |
| Orchestrator — routes the user to the right skill | `hope` |

**The signature artifact** is a designed, self-contained **HTML portfolio website**, built from a personal **career graph** — a single file (`career.json`) that lives on the user's own machine. Hope can now **publish** that portfolio to a free website the user owns (GitHub Pages).

**Brand promises you must not break:** your data stays on your machine (no telemetry, nothing phones home); the design is consistent (light/dark themes, fixed layout); the voice is honest and warm. Works wherever Claude Code runs — CLI, Cowork desktop, claude.ai.

**Voice, in one line:** warm, plain, specific, honest, quiet — a thoughtful friend who knows how this works, not a hype-y chatbot. **Read `references/voice-guide.md` in full before touching any user-facing text.** See §11.

---

## 2. Setup and fixture verification

Hope is a content-and-skills plugin — there's no build step and **no Python test suite yet.** Verification is **fixture-driven.**

1. Clone the repo. The scripts (`scripts/graph_query.py`, `scripts/markdown_graph_convert.py`) use the standard library first; `networkx` is optional.
2. The persona fixture lives at **`assets/fixtures/persona-jane-doe/`** (`profile.json`, `resume.txt`, `sample-portfolio.html`). It's your smoke test for every change.
3. To test a skill or template end-to-end: run the skill against `assets/fixtures/persona-jane-doe/profile.json`, generate the artifact, and verify it in **both** themes.

**Fixture-driven verification is the gate.** If you can't verify a change against the fixture, you can't claim it works.

---

## 3. Architecture — where everything lives

```
skills/<name>/SKILL.md     the main unit of work — loads on demand by frontmatter description
assets/templates/*.html    the visual identity — self-contained HTML, inline CSS, design tokens
assets/fixtures/           the persona fixture you verify against
references/                schema · voice · design tokens · milestones · Computer Use guardrails
scripts/                   graph_query.py, markdown_graph_convert.py
plugin.json                the plugin manifest (+ .claude-plugin/marketplace.json)
```

**The career graph schema is the data contract.** Every skill reads and writes the shape documented in **`references/career-graph-schema.md`** — node types, fields, deterministic IDs, confidence propagation, source attribution. Reference fields by their canonical names from that file. See §13.

> **Agent-local, not in the public repo:** `CLAUDE.md` (your deeper rulebook), `references/design-cookbook.md` and `references/design-system.md` (maintainers' design deep-dive), `tasks/`, and `.claude/`. These are gitignored on purpose. **Never commit them.** If you're operating in a cloned workspace, CLAUDE.md is your local technical layer — but the load-bearing rules are all here too.

---

## 4. Contribution types and their verification gates

| You touched… | Gate before you open a PR |
|---|---|
| a **skill** (`skills/<name>/SKILL.md`) | Run it against the persona fixture. The **output shape must match the skill's spec.** Keep the frontmatter `description` precise — it's what Claude reads to decide when to invoke the skill. Don't add scope; propose a new skill instead. |
| a **template** (`assets/templates/*.html`) | Render it in **both dark and light** themes. Open **each** render, enumerate every visible defect, and confirm the theme toggle works and persists. See the rule below. |
| the **schema** (`references/career-graph-schema.md`) | Bump `hope_schema_version`, document the migration path, update `scripts/graph_query.py` **and** `scripts/markdown_graph_convert.py`, and update the persona fixture so it still conforms. |
| a **script** (`scripts/*.py`) | Run it **end-to-end** against the persona fixture. |
| the **publish path** (GitHub Pages) | After publishing, fetch the **live URL cache-busted** (e.g. `?v=<timestamp>` or a no-cache request) and confirm it serves the **new** content — not just that `git push` or the Pages Action went green. Pages has deploy lag + CDN caching; that's an **external wait**, and "the Action is green" is not "the new site is live." |
| **anything a user will feel** (a new or upgraded skill, a roadmap skill published from here on, a visible template change) | Add a **user-facing changelog entry** — see *"Every user-visible change earns a changelog line"* below. A skill that ships without one is an **incomplete ship.** |

**Captured is not correct.** When a change touches a template, theme, or the portfolio, **open every render and name each defect** — truncation, leaked layout, a token that resolved wrong, a broken toggle. Never report success from a single glance. "Rendered" is not "correct," and "10/10 generated" without a per-render defect list is not a passing report.

**Choosing between variants** (two layouts, two cover-letter tones, a theme tweak)? Render both, have a **separate reviewer** — a second agent or a human — judge them against the voice guide and design tokens, and record **problem → options → findings → pick** in the PR. **You never grade your own variant** — the implementer is biased toward its own work.

**If you can't verify a change, say so explicitly in the PR.** Don't claim success you didn't earn.

**Every user-visible change earns a changelog line.** A skill that ships — a new one, an upgrade to one that exists, **any roadmap skill published from here on** — is **not done until a non-technical, benefit-first entry lands in the user-facing changelog**: `agenthope.ai`'s `_data/changelog.yml`, rendered on `/skills/`. Adding it is one YAML row; the format makes consistency automatic. This is a **release gate**, not an afterthought — shipping a skill without a changelog line is an incomplete ship, the same as shipping it without bumping the version. Write for the **job seeker, not the engineer**: the `headline` is the **one thing they gain**, in plain words (this is the skim target); the `body` is a sentence on what it means for them. **No jargon** (`graph`, `node`, `schema`, filenames), no version numbers, no internal mechanics — what matters to *them* is what matters.

> Good — *"Hope now learns your goal and your timeline."*
> Bad — *"Added a Goal node to the career-graph schema (v1.1)."*

---

## 5. Branch and commit discipline

**Branches** are lowercase, hyphenated, type-prefixed. No spaces, no underscores, no camelCase, no personal names, **no quality claims.**

- Prefixes: `feature/` · `fix/` · `docs/` · `chore/` · `refactor/` · `perf/` · `test/`
- ✅ `feature/portfolio-light-mode-fix` · `fix/dashboard-theme-toggle` · `docs/voice-guide-examples`
- ❌ `arun-fix` · `claude-update` · `tmp` · `wip` · `my-changes`
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
fix(dashboard): persist theme toggle on reload
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

- Skills: `skills/<name>/SKILL.md`
- Templates: `assets/templates/*.html`
- Persona fixture: `assets/fixtures/persona-jane-doe/`
- Schema: `references/career-graph-schema.md`
- Voice: `references/voice-guide.md`
- Design tokens (locked canon): `references/design-tokens.md`
- Computer Use guardrails: `references/computer-use-guardrails.md`
- Milestones: `references/milestones.md`
- Scripts: `scripts/graph_query.py`, `scripts/markdown_graph_convert.py`
- Manifest: `plugin.json`, `.claude-plugin/marketplace.json`

**Local-only (gitignored — never commit):** `CLAUDE.md` · `references/design-cookbook.md` · `references/design-system.md` · `tasks/` · `.claude/`

---

## 17. When you're unsure or blocked

If you don't know whether something violates the rules, **treat it as a violation and ask.** Use the kind-stop protocol (§8) to surface the deviation, name the specific concern, and offer a path forward. Ambiguity resolves toward the user's trust and Hope's promises — never away from them.

---

By contributing, you agree your contributions are released under the **MIT License**.

Hope is a gift. Make it better without breaking the promise.
