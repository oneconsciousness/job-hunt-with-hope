# skills-roadmap

Nothing in this folder is loaded by the shipped plugin. Only `skills/` ships as skills. Three kinds of content live here: skills for later releases, the skills retired in 2.0, and the custom-apps specs.

## Skills for later releases

These are drafted but not shipped. They may return in a later release.

| Folder | What it is for |
|---|---|
| [`cover-letter/`](cover-letter/) | A cover letter for one role. In 2.0, cover letters come from the shipped `write` skill. |
| [`decision/`](decision/) | Closing the loop: accepting an offer, declining others, the follow-ups. |
| [`negotiation/`](negotiation/) | After an offer: what to negotiate, how, and comparing offers. |
| [`resume-tailor/`](resume-tailor/) | A résumé tailored to one role. In 2.0, the same résumé goes with every application unless the user asks otherwise. |
| [`enrich/`](enrich/) | Pulling public work (GitHub, Behance, a personal site and more) into the career file. Activates with custom apps. |
| [`custom-apps/`](custom-apps/) | The specs for custom portfolio sections, role packs, enrichment, and realtime adaptation (below). |

## Retired in 2.0

These three skills shipped in 1.5. The real hunt never ran them, so they no longer load with the plugin. They are kept here so nothing is lost.

| Folder | What it did | What replaced it |
|---|---|---|
| [`retired/skill-gap/`](retired/skill-gap/) | Measured the gap between the user and a target role, with a spreadsheet export (`skill_gap_xlsx.py`, moved here from `scripts/`). | An honest fit read for each role, inside `discovery` (the shortlist) and `application` (`APPLICATION-ANSWERS.md`). |
| [`retired/proof-projects/`](retired/proof-projects/) | Picked one or two projects to build to close the gaps Skill Gap found. | The same honest fit read: each role's gaps are named where the user decides whether to apply. |
| [`retired/dashboard/`](retired/dashboard/) | A designed one-page brief of the whole hunt. Its template (`template/`) and the earlier `dashboard-v0.html` moved here from `assets/templates/`. | The `tracker` skill and `job-tracker.xlsx`, the one live log of the hunt. |

The superseded v0.1 scaffolds for `application/`, `discovery/`, `dashboard/`, `interview/`, and `hope/` were removed in 2.0, because shipped skills replaced them: `application`, `discovery`, and `interview` ship in `skills/`, `start` took over the routing job of `hope/`, and the dashboard scaffold had already been replaced by the shipped dashboard, now retired above. They remain in git history.

## Custom apps · role packs · enrichment · realtime adaptation (designed 2026-06-10)

Feature specs for a future release — custom portfolio sections as first-class "apps" in the section grid, per-field presets, web-source enrichment, and in-session adaptation for fields without a preset. Activation is a planned operation, not a rediscovery: the runbook is [`custom-apps/ACTIVATION.md`](custom-apps/ACTIVATION.md).

| Doc | What it holds |
|---|---|
| [`custom-apps/SPEC-custom-apps.md`](custom-apps/SPEC-custom-apps.md) | The custom-apps contract registry (R1–R18 — the ONE home of every cross-file id/token), the six pane layouts, the CustomSection schema extension, print/published-mode posture |
| [`custom-apps/SPEC-role-packs.md`](custom-apps/SPEC-role-packs.md) | Twelve role packs (emphasis order, apps, sources, tone, gates) + the pack-offer MCQ |
| [`custom-apps/SPEC-enrichment.md`](custom-apps/SPEC-enrichment.md) | The `hope-enrich` protocol — privacy posture, fetch-decision tree, fourteen source adapters, consent grammar, failure modes |
| [`custom-apps/SPEC-realtime-adaptation.md`](custom-apps/SPEC-realtime-adaptation.md) | The in-session research protocol for no-pack roles, with hard guardrails |
| [`custom-apps/ACTIVATION.md`](custom-apps/ACTIVATION.md) | The activation runbook — moves, the exact edits to currently-frozen files, produce-and-inspect verification, release/sync steps |

The specs defer to the live canon (`references/design-tokens.md`, `skills/portfolio/SKILL.md`, `references/career-graph-schema.md`, the voice/user-story/computer-use guides) and reference contract values by registry entry number — values are written once, in the registry.
