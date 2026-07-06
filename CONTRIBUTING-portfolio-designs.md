# Contributing a Portfolio Design to Hope

Thank you for designing for Hope. A great new look is one of the most valuable
things you can contribute — it directly helps job seekers stand out.

This guide is the **contract a design must obey**. It exists so your work merges
smoothly the first time, and so *every* design — yours and the next
contributor's — renders **any** person's career from the **same data file**.
Read it once before you build; keep it open while you do.

> **The one-sentence model:** A Hope portfolio is a self-contained, offline,
> framework-free folder driven by **one data file**. A *design* is a new **look**
> over that shared data. The data and the behavior are shared and fixed; you own
> the **layout and styling**.

---

## The three laws (non-negotiable)

**Law 1 — Self-contained and offline.**
The portfolio must open by double-clicking `index.html` with **no server, no
network, no build step, and no framework**. Classic `<script src>` and
`<link rel="stylesheet">` only — **no `type="module"`, no `fetch()`, no
`import`, no React/Vue/Svelte, no bundler, no CDN it depends on at runtime.**
*Why:* a recruiter opens a file with nothing installed; the page must last for
years with zero dependency rot; and it's a free public good — reach and
longevity are the point. (React renders fine on GitHub Pages — that's not the
reason. The reason is offline + no-build + durability.)

**Law 2 — One data file drives everything.**
Your design reads the canonical `window.HOPE_DATA` object from `data.js` — the
**same object every template reads**. Your renderer is a pure function of that
data. The bar: your design must render **all nine demo people** (Elon,
Dominique the chef, Fei-Fei the scientist, …) correctly **by swapping only
`data.js`** — nothing else.

**Law 3 — Obey the whole contract, not your sample.**
Render **every contractual area** of the schema and **every optional/empty
case** — not just the fields your test persona happened to have. A design that
looks perfect for one person but drops `projects`, the résumé view, or an empty
section for another has not met the bar. Design for the contract, then check it
against real personas.

---

## The data contract (schema v2)

The **authoritative schema** is the header comment of
[`assets/templates/portfolio/data.js`](assets/templates/portfolio/data.js). Read
it first — it is the source of truth for field types and optionality. Every
surface below is driven entirely by `window.HOPE_DATA`; your design must render
each one:

| Surface | Data | Notes |
|---|---|---|
| **Identity** | `identity`, `meta` | name, headline, photo (baked `data:` URL), contact links, stats trio. Phone is résumé-only — never in the contact row. |
| **Overview** (opt-in) | `overview.show`, `headline_stats`, `interests` | `show` is the sole gate. `show:false`/absent → render nothing, zero residue. |
| **Experience** | `experience[]` | Newest-first. Nested `groups[] → contributions[]`, `kpis`, `metric` (direction ↑/↓/✓). |
| **Projects** | `projects[]` | Active-first. No competencies/scope/metric-badge (experience-only). |
| **Skills** | `skills.order[]`, `categories{}`, optional `radar[]` | `level` (1–4) drives lit segments **and** tier color; `category` drives only the header accent. |
| **Education / Certifications** | `education[]`, `certifications[]` | Newest-first. Cert `date` may be absent → "No date". |
| **Résumé (ATS)** | `resume` | See "The résumé view" below. Load-bearing. |
| **Throughline** | `timeline[]`, `traveler`, `timeline_ridge?` | Chronological; each entry `anchor` = `tl-{id}` of a card your renderer produces. |
| **Social** (opt-in) | `social[]` | Key present only when added; omit entirely otherwise. |
| **Footer / provenance** | `meta` | "Generated with Hope" credit + JSON-LD; keep it. |

**Two global rules that trip people up:**

- **NO HEX in data or render logic.** `data.js` carries **semantic tokens only**
  (`category:"programming"`, `level:4`, `band:"high"`) — never a hex color. Your
  **CSS** owns all color (that's where hex belongs, resolved via `:root` tokens).
  A zero-hex grep across `data.js` + the render layer gates the build.
- **Empty-but-required arrays ship as `[]`, never absent.** Render nothing for an
  empty section — **no empty tiles, no residue.**

---

## The file shape (exactly four files)

| File | Owns | Editable per design? |
|---|---|---|
| `index.html` | SEO-stamped shell: `<head>` meta/OG/JSON-LD, inline theme-init, `.seo-fallback`, static chrome (Share / Save-as-PDF / theme toggle), **empty mount points**. **No content markup.** | Structure yes — but keep the head contract, the mounts, and the static chrome. |
| `portfolio.css` | Your full design + design tokens (`:root`). | **Yes — this is your canvas.** |
| `portfolio.js` | The **vanilla** renderer: reads `HOPE_DATA`, builds the body into the mounts. | Yes — but vanilla only (Law 1). |
| `data.js` | The person's data. Shared contract — **never** design-specific. | **No.** |

The publish step ships **exactly these four files** (plus two generated share
images). Any extra runtime file (a framework, a second script) falls outside the
allowlist and will not ship.

---

## Required behaviors (the chrome)

Every design keeps these working — reuse Hope's implementation or reimplement in
vanilla: **light/dark theme toggle**, **Share menu**, **Save-as-PDF (résumé)**,
**Throughline** animation, **section navigation**, **print**, and the
`#spotlight=` deep-link glow. *(Roadmap: these are moving into a shared
`hope-core.js` so a design supplies only the render + CSS, not a reimplementation
of the chrome — build against that once it lands.)*

### The résumé view (ATS) — do not skip
`#resume-view` renders from the `resume` object into **real** `<h1>/<h2>` +
`<ul><li>` — standard section headings, one `<strong>` per bullet, **no tables,
no icons, no text-as-graphics**. It's hidden on screen and prints when the user
picks "Save as PDF". A recruiter's parser must read every word.

---

## What you *can* change (design freedom)

Everything visual: **layout, typography, color, texture — the whole design
language.** Hope's flagship signatures (hex KPIs, scanline, section grid) are
*the default look, not a requirement for alternate designs.* Your Editorial,
Swiss, Terminal, or Executive gets to be itself — as long as the three laws and
the full contract hold.

---

## Recommended tooling (optional)

Building the DOM in raw vanilla can get verbose. If Hope ships a tiny vanilla
template helper (a ~1–2 KB tagged-template `html\`\`` renderer), prefer it — it
gives clean, declarative templates with **no framework and no build**. Never
reach for React/JSX/a bundler to get there.

---

## Acceptance checklist (copy into your PR)

- [ ] Opens from `file://` with **no network** (Google Fonts may degrade to system fonts — fine).
- [ ] Renders **all nine demo personas** from their `data.js` by swapping data only.
- [ ] **Every** schema section handled, including optional/empty cases (`overview.show:false`, no projects, empty social, cert with no date…).
- [ ] `#resume-view` renders an **ATS-clean** résumé (real headings, `<ul><li>`, no icons-as-text).
- [ ] **No** framework / build / `type=module` / `fetch()` / `import`; **no hex** in `data.js` or the render layer.
- [ ] Ships within the **four-file** shape; **light + dark** theme toggle works.
- [ ] `python3 scripts/verify_portfolio_structure.py <folder>/` passes.

## Test data
The nine demo personas are already published as v2 `HOPE_DATA` files — one per
person — at `agenthope.ai/demo/<name>/data.js` (Elon, Dominique, Fei-Fei,
Andrej, Dario, Sam, Susan, Reshma, Audrey). Point your design at each in turn,
swap **only** `data.js`, and confirm the checklist against **every** one before
you submit — that's the fastest way to prove the contract holds for any career.

## How to submit
- Branch: `feature/portfolio-theme-<slug>` (one design per PR — keeps review fast).
- Follow the PR template and label rules in [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Changelog gate:** a user-facing design ships with a one-line, benefit-first
  changelog entry (see `CONTRIBUTING.md` §4).
- Credit is yours — we list design contributors in `CREDITS.md`.

Questions or want to pair on the first port? Open a draft PR and tag a maintainer.
We're glad you're here. 🙏
