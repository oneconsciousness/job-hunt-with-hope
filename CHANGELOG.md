# Changelog

All notable changes to the Hope plugin are documented here. Versions track `plugin.json` / `.claude-plugin/marketplace.json`.

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
