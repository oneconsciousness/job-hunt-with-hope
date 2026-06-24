---
name: hope-portfolio
description: Use when a user wants to generate a portfolio — their work, their story, their evidence — as a self-contained branded portfolio folder (works offline — served locally or opened directly) they can send to a recruiter, post as a link, or save as a PDF. This is Hope's signature skill. Trigger phrases include "make my portfolio", "generate a portfolio", "create my portfolio for {company}", "I need a portfolio", "show off my work", "tailor a portfolio for this role", "build me something to send", or any request where the deliverable is a curated showcase of who the user is professionally.
user-invocable: true
---

<!-- hope-skill-version: 1.2.0 -->

# Hope Portfolio · Milestone 3 — Hope's Signature

You are running Hope's portfolio generation. This is the skill that defines Hope. The user submits this artifact, and they get interview calls. Make it count.

## Locate the plugin files first (do this before anything else)

Hope's reference docs and the portfolio template folder ship **inside the plugin**, not in the user's project. The paths below (`references/…`, `assets/templates/…`) are **relative to the plugin root** — they are NOT relative to your working directory (which is the user's project folder). `${CLAUDE_PLUGIN_ROOT}` is **not** substituted inside this Markdown, so you must resolve the plugin root yourself with Bash, once, before you read anything:

```bash
# Resolve the Hope plugin root (references/, assets/, scripts/ live there).
# $CLAUDE_PLUGIN_ROOT is NOT expanded in this Markdown — resolve in Bash. Works
# whether Hope is installed, marketplace-cached, or run via --plugin-dir.
PLUGIN_ROOT=""
for c in "$CLAUDE_PLUGIN_ROOT" "$HOME"/.claude/plugins/cache/hope/hope/*/ "$HOME/.claude/plugins/marketplaces/hope"; do
  [ -n "$c" ] && [ -f "${c%/}/plugin.json" ] && { PLUGIN_ROOT="${c%/}"; break; }
done
[ -z "$PLUGIN_ROOT" ] && PLUGIN_ROOT="$(dirname "$(find "$HOME/.claude/plugins" -path '*hope*/plugin.json' -print -quit 2>/dev/null)")"
echo "PLUGIN_ROOT=$PLUGIN_ROOT"   # sanity-check before reading bundled files
```

If `PLUGIN_ROOT` comes back empty, ask the user where the Hope plugin is checked out (e.g. a `--plugin-dir` path) rather than guessing relative paths — a relative `references/…` read resolves against the user's project folder and will 404.

Read these before generating — they're load-bearing. The design tokens are locked; the voice rules apply to every word in the portfolio:

```bash
cat "$PLUGIN_ROOT/references/design-tokens.md"
cat "$PLUGIN_ROOT/references/voice-guide.md"
cat "$PLUGIN_ROOT/references/career-graph-schema.md"
cat "$PLUGIN_ROOT/references/milestones.md"
```

## What this skill outputs

A **portfolio folder** at `career-graph/documents/portfolios/portfolio-<slug>-<date>/` containing exactly four named files —

- `index.html` — a **static SEO-stamped shell**: the `<head>` (title/description/OG/Twitter/enriched-JSON-LD/canonical/`hope:share-url`), the inline theme-init, a static `.seo-fallback` body block (name/headline/summary, removed at hydration), the static topbar + export modal, and **empty mount points**. There is **no content markup** here — the visible body is rendered at runtime by `portfolio.js` from `window.HOPE_DATA`. This is the file the head SEO values and the `hope:share-url` meta get stamped into.
- `portfolio.css` — the full stylesheet; the design tokens (`:root`) live here and nowhere else (including the 15 seg-tier / cat / integrity tokens — see the design-tokens canon).
- `portfolio.js` — the full behavior script **and the full runtime renderer** — it builds the entire visible `<body>` from `window.HOPE_DATA`.
- `data.js` — a classic script defining one global, `window.HOPE_DATA = {…}`: **the complete dataset for the entire page** (meta + confidence map, identity, overview, experience, projects, skills, education, certifications, resume, timeline, traveler, social), in **semantic values only — NO hex**, with the photo baked in as a `data:` URL. The template's `data.js` carries the full field-by-field authoring contract (the `window.HOPE_DATA` schema) — read it before emitting, and treat it as the source of truth for field types and optionality.

— plus two **share-card pages** (`share-card.html` and `share-card-square.html`) in the same folder — see "Share cards & link-preview meta" below.

**The self-contained promise is folder-level: the folder needs nothing but a browser — fully offline-capable.** (Opening: see the "show it" step — on macOS, a one-line local server is the reliable path; double-click usually works but can be blocked by folder permissions.) That's law — classic `<script src>` and `<link rel="stylesheet">` only; **no `type="module"`, no `fetch()`, no `import`**. No inline `<style>`/`<script>` in `index.html` except the theme-init snippet (inline in `<head>` by design — it prevents theme flash) and the JSON-LD. What belongs in which file is canon — `design-tokens.md` § "Modular structure" (loaded above); cite it, don't restate it. The page uses Hope's design tokens — light by default (warm cream + orange), with a dark theme via the toggle and the same layout across both — generates inline SVG for any graphics, and opens in any browser with no network connection required.

**What goes inside:**

- **Identity card** — photo, name, headline, stats row, contact row, and summary, over a 32×32 grid texture, with the LIVE pill top-right.
- **The Throughline** — the animated career-timeline strip at the bottom of the identity card (`id="throughline"`): one hex node per included experience / education / project / certification, a playhead riding the rail, hover mini-cards, click-to-navigate to each entry's card. The strip's look and motion are template-owned; **your job is the dataset and the card anchors** — see "The Throughline — timeline data contract" below.
- **Overview app (opt-in)** — a section-grid tab, not a standalone band: a grid tile (`data-section="overview"`, labeled "Overview", icon `insights`, meta-count "`{n} highlights`") plus a pane (`id="pane-overview"`) that sits first among the panes and opens by default when present. Inside: up to 4 curated hero stats as large hex badges plus a quiet interests line. Renders **only** when `overview.show` is true and `overview.headline_stats` is non-empty — see "Overview app — field mapping" below.
- **Summary** — 2–4 sentences in Hope's voice. Specific, not generic. Hints at tension before resolution.
- **Selected experience** — 3 to 5 most relevant Experiences as cards, each with: title, company, dates, a 1-sentence framing, the strongest contribution (STAR with a metric), and the skills demonstrated.
- **Selected projects** — same shape as experience, for portfolio-worthy projects outside formal employment.
- **Skills section** — top skills (organized by category, leading with the most market-demanded that have the strongest evidence). Each skill chip clickable to expand which experiences/projects evidenced it.
- **Education / Certifications** — short, factual. When an entry carries **honors or an achievement worth showing** that lives in the career file (a scholarship, award, distinction, notable thesis), render it as a **rich card** — see "Rich education & certification cards" below. Otherwise a basic `.edu-card`. Never invent honors; render only what's there.
- **Contact** — email and LinkedIn, nothing more. Optional.
- **Theme toggle** — sun/moon button in the top-right; switches light/dark, layout unchanged.
- **Hidden résumé view** — `#resume-view`, invisible on screen, rendered at runtime from `resume` for the résumé print path (see "Resume view — field mapping" below).
- **Export & share controls** — the template's **Save as PDF** button exports the **résumé**: a chooser (`#export-modal`) for style + font + fit, with a **hard readability floor — body text never drops below 10pt**. The portfolio-PDF chooser is **gated for the next release** — the live page IS the portfolio, and Cmd+P still prints it natively. **Share** opens a Copy link / LinkedIn / X / WhatsApp / Email menu (`#share-menu`). These ship in the template; your job is the content they depend on (resume view, OG meta, share cards).

## How to choose what goes in

Read the user's career graph. If a target Job is named (`hope make portfolio for Anthropic`), find the JobPosting node and:

1. Compute which Skills the Job `REQUIRES_SKILL` and which the Person `HAS_SKILL`.
2. Pick the Experiences/Projects whose `USED_SKILL` and `APPLIED_SKILL` edges most strongly intersect with the Job's required skills.
3. Order: most relevant first, most recent second, most metric-heavy third.
4. Aim for **density, not exhaustiveness.** Three superb cards beat seven okay cards.

If no target Job is named, generate a **general portfolio** representing the user's strongest work overall.

Either way, **create a CuratedPortfolio node** in the graph linking to the included Experiences/Skills/Projects, and record on it the user's app-catalog decisions as `"show_summary": true|false` and `"show_social": true|false`, and their traveler choice as `"timeline_traveler"` (see the app catalog and the traveler picker below — per-portfolio presentation choices, not Person facts). This means the user's graph remembers which curation went out for which role.

## Voice in the portfolio copy

You are not writing a résumé. You are writing **a designerly statement of work** in Hope's voice.

Each Experience card should:
- Open with a specific moment or problem, not a job summary
- Show what changed because of the user's action (with a metric)
- Avoid "responsible for" language — show, don't tell
- Run 60–120 words per card, no longer

Example transformation:

❌ "Senior Product Designer at Figma. Responsible for design system, mentoring junior designers, leading cross-functional initiatives."

✅ "When Figma's design system started fragmenting across product teams in 2023, I led the consolidation. Eight months in, 37% of company surface area was unified on the new system, and onboarding time for new designers dropped from three weeks to one. The hard part wasn't the components — it was getting twelve product teams to agree on one button."

The user can edit, but the first draft should feel like Hope wrote it.

## Visual quality bar

This is the **visible** differentiator. The portfolio looks unmistakably like a Hope artifact — the layout and texture are the brand, color is the theme:

- Light theme by default (warm cream + orange). Dark via the toggle, same layout.
- Interactive section grid — click a section to filter the content below; active tab is solid orange with a glow and an integrity bar.
- Hexagonal KPI badges (person / groups / monitoring) on each role.
- Contribution cards grouped IC vs Leadership; skills grouped by category with a 4-bar level visual; projects render as the same expandable Experience-style `.item-card`s (see the projects-loop contract below) so each project's full story shows.
- LIVE pill inside the identity row, top-right.
- Scanline overlay on cards + 32×32 grid texture on the identity header + subtle glows. These textures are signatures — without them the design looks generic.
- Inter for text, JetBrains Mono for all metadata. Material Symbols Rounded with inline-SVG fallback.
- Real org logos via Google Favicon with a lettermark fallback.
- Self-contained at the folder level (see "What this skill outputs"). No required network calls except optional Google Fonts (which degrade to system fonts when blocked).

Use the bundled template as the starting structure — it's a **folder mirroring the output folder** (same four named files). Load it from the plugin root you resolved above:

```bash
ls "$PLUGIN_ROOT/assets/templates/portfolio/"          # index.html · portfolio.css · portfolio.js · data.js
cat "$PLUGIN_ROOT/assets/templates/portfolio/index.html"  # the static shell: SEO-stamped head, .seo-fallback, empty mounts
cat "$PLUGIN_ROOT/assets/templates/portfolio/data.js"     # carries the window.HOPE_DATA authoring contract
```

### Build contract (runtime data-driven)

The portfolio is **not** built by substituting tokens into static markup. The agent emits **one** structured dataset and the shipped `portfolio.js` renders the entire visible `<body>` from it at runtime. There are no `{{…}}` content tokens and no `<!-- HOPE:*_loop -->` markers in the new template — they have been replaced by `window.HOPE_DATA`. Follow these steps in order:

1. **Curate from the graph** (per "How to choose what goes in" below): identity, overview, experience (IC/Leadership grouped, role-progression shape), projects, skills (by category, level 1–4 + years), education, certifications, resume (bullets with an appended `tag`; Education = degrees only), timeline, social, and a per-section `confidence` map.
2. **Emit `data.js`** = `window.HOPE_DATA = {…}` — ONE global, the complete dataset for the whole page (the template's `data.js` authoring contract is the `window.HOPE_DATA` schema). **Semantic values only — NO hex** (`category:"programming"`, `level:4`, `confidence.band:"high"` — `portfolio.js` resolves these to `var(--token)` at render). The **photo is baked** in as a `data:` URL in `identity.photo`.
3. **Copy `portfolio.css` and `portfolio.js` into the output folder verbatim.** `portfolio.css` already carries the 15 seg-tier / cat / integrity tokens the renderer resolves to; `portfolio.js` is the runtime renderer. Neither is ever edited per-portfolio. **Do not deviate from the design tokens** in `$PLUGIN_ROOT/references/design-tokens.md` (loaded above).
4. **Stamp the shell `index.html`** from the same `meta` you put in `data.js`, in one pass — `data.js` is the single source of truth and the head/body are stamped FROM it:
   - **Head:** `name`/`headline`/`og_description` → `<title>` + `description` + `og:*`/`twitter:*`; `share_url` → `hope:share-url` + `<link rel="canonical">`; `generation_date` + the enriched ProfilePage JSON-LD (`description`/`url`/`image`/`sameAs`); `target_company` → title suffix.
   - **Body:** the static `.seo-fallback` block — `name` / `headline` / `summary_short`.
   - **Leave `og:url` / `og:image` / `twitter:image` empty** (`content=""`) for the publish skill to stamp. No `{{…}}` left anywhere.
5. **Generate both share-card pages** (`share-card.html`, `share-card-square.html`) from the same `meta` / `identity` / `overview.headline_stats` — see "Share cards & link-preview meta" below.
6. **Strip the template-authoring comments**, then grep **zero** `{{` and **zero** `<!-- HOPE:` across every file.
7. **Grep zero raw hex** across ALL four files — including `data.js` and `portfolio.js`. The whole point of semantic-only data is that color lives in `var(--token)`; a hex literal anywhere is a token-purity bug.
8. **Grep zero external icon URLs** (the favicon `onerror` Google-favicon `src` is the one sanctioned exception — see "Icons for links" below).
9. **Verify anchor pairing:** every `timeline[].anchor` resolves to a card the renderer will produce — `id="tl-{id}"` derivable from the array whose name matches `timeline[].pane`.
10. **Run the verifiers:** `verify_portfolio_structure.py` (headless-render mode) + `verify_portfolio_pdf.py --modes resume-classic` (see "Before saving" below).

The per-section contracts below are **field-mapping references** — they name which `window.HOPE_DATA` field drives which DOM, deferring to the template's `data.js` authoring contract (the `window.HOPE_DATA` schema) for field types and optionality. They are not substitution tables: you author data, not markup.

**Reuse shipped patterns — grep `portfolio.css` before you write any new CSS or markup.** Search for the pattern that already exists and reuse it: responsive grids (`grep -nE 'auto-fit|auto-fill|grid-template' portfolio.css`), card shells (`.item-card`, `.edu-card`), chips (`.skill-chip`), pills, hex KPIs. Because `portfolio.css` ships **verbatim** and custom CSS has nowhere clean to live, a hand-rolled rule — e.g. a fixed `grid-template-columns: 1fr 1fr` that never collapses on a phone — is a **bug, not a shortcut**. The shipped patterns are the only way to stay consistent and responsive: treat "reuse the existing pattern" as a required pre-flight, not a preference.

### Rich education & certification cards

A degree or certification with **honors or an achievement that's actually in the career file** earns a **rich card**; one without stays **basic**. Both ship in `portfolio.css` — choose per entry, and never invent content to fill a richer card.

**Basic** (no achievements) — logo + credential + institution + dates, one row. This is the default; most certifications are basic:

```html
<div class="edu-card">
  <img class="org-logo" src="https://www.google.com/s2/favicons?domain=<school-domain>&sz=128" width="44" height="44" alt="" onerror="this.outerHTML='<span class=&quot;org-fallback&quot;><initial></span>'">
  <div class="info">
    <div class="title-line"><credential></div>
    <div class="sub-line"><institution></div>
    <div class="date-line"><dates></div>
  </div>
</div>
```

**Rich** (has honors/achievements) — add `rich`, wrap the header in `.edu-head`, and add a `.edu-body` with achievement bullets. Optionally an `HONORS` pill in the `.title-row` and the skills the entry evidenced as `.skill-chip`s:

```html
<div class="edu-card rich">
  <div class="edu-head">
    <img class="org-logo" src="…" width="44" height="44" alt="" onerror="…">
    <div class="info">
      <div class="title-row"><span class="title-line"><credential></span><span class="status-pill honors">Honors</span></div>
      <div class="sub-line"><institution></div>
      <div class="date-line"><dates></div>
    </div>
  </div>
  <div class="edu-body">
    <ul class="ach-bullets">
      <li><span class="material-symbols-rounded">check</span><span><achievement, with the <strong>load-bearing phrase</strong> bolded></span></li>
    </ul>
    <div class="contrib-skills"><span class="skill-chip" data-cat="<category>"><skill></span></div>
  </div>
</div>
```

Rules: the `HONORS` pill appears **only** when the entry is genuinely an honor (scholarship, distinction, award) — omit it otherwise. Achievement bullets come straight from the entry's `notes`/achievements in the career file; bold the one phrase that carries the weight. Skill chips only for skills the entry actually evidenced, with `data-cat` matching the Skills section's categories. When an entry has nothing beyond credential/school/date, the basic card is correct — don't pad it.

### Projects — field mapping (item-cards, not tiles)

The Projects pane uses the **same collapsible `.item-card` structure as Experience** — projects carry real content (`description`, `tagline`, `impact`, a full `skills` list), and a tile would throw all of it away. `portfolio.js`'s `renderProjects` builds **one `.item-card.project` per entry in the `projects` array**; you author the array (per the `projects[]` shape in the template's `data.js` authoring contract), not the markup.

What each `projects[]` field drives — see the `data.js` authoring contract for types, optionality, and the full DOM contract:

| `projects[]` field | Drives | Notes |
|---|---|---|
| `name` | `.role-title` (and `img alt`) | The project's name — the card title. |
| `tagline` | `.role-company` | One-line framing of the project. |
| `dates` | `.role-dates` | Optional — the renderer **omits the whole `<span class="role-dates">` when absent** (no empty span). |
| `is_active` | `.active-pill` | "Active" pill for in-progress / ongoing projects; dropped otherwise. |
| `domain` / `initial` | `.org-logo` favicon + `.org-fallback` | With a host, the Google favicon + lettermark fallback; with no domain, a bare `.org-fallback` letter. |
| `best_metric` | `.contrib-pill` | Optional headline metric (e.g. `1.2k stars`); pill omitted when absent. |
| `description` | `.contrib-action` | The project's full description — the body's lead paragraph. |
| `impact` | `.contrib-impact` | The impact / outcome line; block omitted when absent. |
| `skills[]` (`{name, category}`) | `.contrib-skills` `.skill-chip`s | One chip per `SkillRef`; `category` → `data-cat` (CSS owns the color, same category map as Experience). `[]` → block omitted. |
| `link` (`{url, label}`) | `.project-link-row` → `.project-link` | Optional external link; row omitted when absent. |

The renderer leaves **every** project card **collapsed** by default and reuses Experience's `.item-card[data-expand] .item-head` markup, so card-expand and the "Projects" section filter work with no extra wiring. **Projects carry NO competencies, scope, metric-badge, or contrib-num** (the `.project` class drives the cyan accent via CSS — don't port those Experience-only fields). There is no project tile, hero gradient, or metric tag.

### Promotion / tenure within one company

A role progression at one employer — "Associate Analyst → Business Analyst at Nova Healthcare" — is common; render it **natively**, not as a hand-patched one-off. Two shapes, pick by the work:

- **One card, progression in the title** (default) — when the two roles share one continuous story and metric set: title reads "Associate Analyst → Business Analyst", `.role-company` is the org, `.role-dates` spans the whole tenure (earliest start → latest end), one timeline entry / one `tl-` id. Cleanest when the promotion is really "same thread, bigger scope."
- **Two cards, same org** — when each role earned its own distinct contributions: two `.item-card`s sharing the `.role-company` + org logo, each with its own dates and `tl-` id + timeline entry. They sort **newest-first** like any other cards (the structural gate enforces it — the later role leads), so the progression reads top-down on its own.

Either way, don't invent ad-hoc "Promoted" pills or bespoke markup — use the shipped `.item-card` structure and let date order carry the story.

### Overview app — field mapping (opt-in, zero residue)

The old standalone `#summary-band` between the identity card and the section grid is **gone** — its content (the hex-stat row + interests row) now lives in an **Overview app** inside the section grid, built by `portfolio.js`'s `renderOverview` from the `overview` object. The renderer produces two pieces:

- **Tile** — `<button class="section-btn" data-section="overview">`, labeled "Overview", Material Symbols icon `insights`, meta-count line "`{n} highlights`" (`n` = `overview.headline_stats.length`).
- **Pane** — `<div class="section-pane" data-pane="overview" id="pane-overview">`, placed **first** among the panes. Inside, the band's content classes are unchanged — `.summary-stats` / `.summary-stat` / `.stat-value` / `.stat-label` / `.summary-interests` — so the premium styling carries over (a KPI row of up to 4 large hex badges, a quiet interests line of neutral pill chips), and the pane's inner panel keeps the 32×32 grid texture.

The look is template-owned and token-driven — your job is the `overview` data.

**Render gate:** `overview.show` is the **sole master gate** (it replaces the old `show_summary`). When `overview.show` is `true`, `overview.headline_stats` MUST be non-empty (an empty stats list with `show:true` is invalid — set `show:false` instead). When `overview.show` is `false`/absent, the renderer emits **no Overview tile, no pane, no TOC entry** — zero residue — and the default-open app falls back to Experience.

**Default-open:** on load, the active app is **Overview when the pane exists, else Experience** — `portfolio.js` sets the first present pane active deterministically as it builds (no static `active` fallback in the shell). Don't fight that init logic.

What each `overview` field drives — see the `data.js` authoring contract for types and limits:

| `overview` field | Drives | Notes |
|---|---|---|
| `headline_stats[].icon` | `.summary-stat.hex-kpi` icon | Material Symbols name, e.g. `rocket_launch`, `payments`, `groups`, `public`. |
| `headline_stats[].value` | `.stat-value` | The hero number, e.g. `$2M+` — bold sans over the label. Max **4** stats. |
| `headline_stats[].label` | `.stat-label` | Short, e.g. `client pipeline` — mono uppercase, muted. |
| `interests[]` | `.summary-interests` neutral `.skill-chip`s | Genuinely personal (typography, trail running), not skill keywords. Max **6**. **When `interests` is `[]` the renderer omits `.summary-interests` entirely** (CSS `:has()` auto-hide needs the element absent — never emit it empty). |

Stats are **curated by the human — never auto-summed**: metrics are heterogeneous, so don't invent, aggregate, or derive them from other graph nodes.

**Print behavior is template-owned, but don't break it:** the Overview pane prints **first** among the panes (DOM order), and the print TOC carries a **conditional Overview entry** — the TOC chips' numbers are CSS counters, not static 01–05, so numbering self-adjusts when Overview is absent. Every **résumé** print mode still hides all of it. Never duplicate stats or interests into `#resume-view`.

### The Throughline — timeline data contract

The Throughline strip itself — rail, hex nodes, playhead, pause/hover/click/print behavior — is template-owned (`portfolio.css` + `portfolio.js`, token-styled per canon). **You generate what it reads**: the `timeline` and `traveler` keys of `window.HOPE_DATA` in `data.js`. These keys keep their exact prior contract — they are a subset of the unified dataset, unchanged by the runtime rearchitecture. The only relationship change is that their `anchor`/`id` now point at cards `portfolio.js` itself renders (still `id="tl-{id}"`).

**`timeline`** — an **ordered, chronological array**, one entry per Experience, Education, Project, and Certification included in the portfolio:

| Field | Contract |
|---|---|
| `id` | Stable slug, unique in the array — it also names the entry's anchor (below). |
| `type` | `experience` \| `education` \| `project` \| `certification` — drives the node's token color (template-owned; colors are tokens per canon, never restate hex values). |
| `date_start` / `date_end` | `YYYY-MM` strings (the template's parser format — full ISO `YYYY-MM-DD` also accepted, day ignored) position the node proportionally on the rail; `date_end: null` = ongoing (renders the emerald edge). |
| `label` | Short phrase, **≤40 chars** — see the label rules below. |
| `org` | Organization name, or `null`. |
| `domain` | Hostname for the favicon, or `null`. |
| `metric` | ONE short line — the entry's strongest number — or `null`. |
| `skills` | ≤4 strings; the hover mini-card renders them as `.skill-chip`s. |
| `pane` | `"experience"` \| `"education"` \| `"projects"` \| `"certifications"` — the section-grid pane a click activates. |
| `anchor` | The DOM id of the entry's card — `tl-{id}` — that the renderer will produce. |

**Anchors — the renderer derives every card id from your data.** `portfolio.js` gives each card it builds a stable `id="tl-{id}"` taken from the matching section-array entry's `id` (the experience/projects/education/certifications entry whose `id` equals the timeline entry's `id`). Your job is **consistency across arrays**: each `timeline[]` entry's `id` and `pane` must match exactly one entry in the array named by `pane` (the join key is `pane`, plural — `experience`/`projects`/`education`/`certifications` — not `type`, singular). Click-to-navigate activates the pane, scrolls to the anchor, and highlights the card — a timeline `anchor` with no matching array entry is a dead click. Verify the pairing before saving (see the verification checklist below).

**Label rules** — labels float above the playhead in small type and must scan in under a second:

- **Short phrases, never sentences.** "Lead AI Engineer @ EY" — not "Worked as a Lead AI Engineer at EY where I…".
- **Voice: specific, not generic.** "Unified Figma's design system" beats "Design work". Same specificity bar as the cards, compressed to ≤40 chars.

**`traveler`** — the playhead glyph the user chose (see the traveler picker in "What to ask the user before generating"): `"dot"` (the default soft-orange glow dot) · `"<slug>"` for one of the bundled travelers in `$PLUGIN_ROOT/assets/icons/travelers/` (`paper-plane`, `car`, `train`, `sailboat`, `bicycle`, `rocket`, `footprints`) · `{"inline": "<svg…>"}` for a found or hand-made glyph, which **you inline at generation**. **No picker UI ships in the artifact** — choosing happens in chat; the artifact just renders the choice.

### Social Feed app — field mapping (opt-in, live embeds)

The Social Feed is an **optional app** (offered via the app catalog — see "What to ask the user before generating"). Like every section now, it is **entirely runtime-driven** — `portfolio.js`'s `renderSocial` builds both pieces from the `social` array:

- **Tile** — `<button class="section-btn" data-section="social">`, labeled "Social", Material Symbols icon `rss_feed`, meta-count line "`{n} posts`" / "`1 post`" (renderer pluralizes from `social.length`). No integrity bar — a curated feed carries no confidence score.
- **Pane** — `<div class="section-pane" data-pane="social" id="pane-social">`, placed **after** the Projects pane (before `#resume-view`), containing an empty `<div class="social-grid" id="social-grid"></div>`. The existing social engine then fills the cards from `window.HOPE_DATA.social`, exactly as it renders the Throughline from `window.HOPE_DATA.timeline`.

**Render gate:** the gate is **`Array.isArray(social) && social.length > 0`** (it replaces the old `show_social` flag — derived at render, no separate boolean). When the user didn't add the Social Feed, leave `social` as `[]` or omit the key entirely; the renderer emits **no Social tile, no pane** — zero residue.

**Posts are not career events** — they carry **no `tl-` id** and never appear on the Throughline (the structural gate `verify_portfolio_structure.py` only checks tl- carded cards, so the social pane is correctly outside its scope).

**What you write:** the `social` array in `data.js` — one object per post (this keeps its exact prior contract; the field-by-field authoring shape is stated once in the template's `data.js` comment). Per post:

| Field | Contract |
|---|---|
| `platform` | one of — **post/video embed (iframe):** `youtube` `vimeo` `spotify` `soundcloud` `applemusic` `figma` `codepen` `loom` `bluesky` `linkedin` `substack` `flickr`; **post embed (script):** `tiktok` `instagram` `x` `threads` `pinterest`; **profile-only (always a profile card):** `dribbble` `behance` `medium` `gist` `link`. `link` = a generic profile card (globe) for any URL. Remember the URL decides the template: a *post/video* URL on an embed platform → embed card; a *profile/channel* URL → profile card. Note: **Behance** and **Medium** have embed endpoints but aren't yet validated to render reliably in a real browser (a headless render is not proof), so they stay profile-only until confirmed — only promote a platform to an embed once it's verified rendering in a real browser. |
| `url` | the public permalink. The renderer derives the embed from it — **you never write embed HTML**. |
| `title` | optional label for the always-present "View on …" link (defaults to "View on {platform}"). |
| `caption` | optional one short line shown above the embed. |
| `pinned` | optional boolean — promotes an **embeddable** post (video / embeddable post) to the Overview's "Latest from" (max 2 embeds). Ignored on profile/link socials: those always route to the **headline contact row** as app-name pills, never the Overview. |

**How it renders — two templates, you pick per the user's content (template-owned, don't reinvent):** `portfolio.js` turns each post into **one of two cards**:
- an **embed card** — a live `<iframe>` or the platform's `<blockquote>` + async script — when the URL is a specific embeddable **post or video**;
- a **designed, brand-coloured profile card** — a chip in the platform's colour + name + caption + handle + an arrow — when the URL is a **profile, channel, or site** (or when an embed can't be resolved).

**There are NO bland link cards.** The renderer auto-selects (an embeddable post/video URL resolves to an embed; anything else becomes a profile card), so **Hope chooses the template by choosing the URL**: give a *post/video* link to embed the work itself; give a *profile/channel/site* link for a branded tile that links out. Pick per the user's need — a designer's Dribbble/Behance are profiles (tiles), a talk is a video (embed). The embed card also carries a quiet "View on …" link as the offline fallback (embeds need the published `https` site + a connection). The grid is **masonry** (CSS columns) — short and tall cards pack with no dead space, responsive with no media query. Brand colours/glyphs for every platform live in the renderer's `B` map; an unknown platform gets a lettermark chip + the generic globe.

**Platform fit by field** (suggest, don't impose): designers → Behance, Figma, Dribbble, Instagram, CodePen · developers → GitHub Gist, CodePen, X, YouTube · marketers → LinkedIn, X, Instagram, TikTok, YouTube · writers → Medium, Substack, X, Threads, Bluesky · video → YouTube, Vimeo, TikTok, Loom · music → Spotify, SoundCloud, Apple Music · photographers → Instagram, Flickr. **LinkedIn** only embeds posts the author marked embeddable; **X** is the least reliable (its widget degrades). When a platform won't embed, its branded profile card still works — never block on an embed.

**Print / résumé:** embeds never print — `@media print` hides `.social-embed` and shows the link list only; `#resume-view` carries no social content.

### Featured board — surface the best of any section in the Overview

The Overview isn't a fixed panel — it's a **curated board the user fills** to make the strongest first screen, and like everything Hope does it's a **recommendation the user re-picks** (or overrides, or forks — it's their MIT file). Beyond the stat row + interests, two opt-in strips render inside the Overview pane (both JS-built by `portfolio.js`, both **hidden until filled — zero residue**):

- **"Latest from"** — up to **2 promoted EMBED socials** (a video, an embeddable post — **never** a profile/link card). Mark them with **`pinned: true`** on an *embeddable* social post (`window.HOPE_DATA.social`); the renderer surfaces the pinned **embeds** (max 2) here as live cards + a **"See all →"** to the full Social pane. **Profile/link socials (Dribbble, Behance, a personal site, a channel page…) never render here** — the renderer auto-injects them into the **headline contact row** as app-name pills, so a short link card can never stretch beside a tall embed and leave a gap.
- **"Highlights"** — featured **work items**: a standout **project**, a key **experience**, a **degree (education)**, a **certification** — *any* timeline entry. Mark them with **`featured: true`** on the timeline entry (`window.HOPE_DATA.timeline`). Each renders as a compact card whose chip is the **org logo** (favicon from the entry's `domain`; the type icon is the fallback only when there's no domain) and which **jumps to its full entry** (activates the pane, scrolls, pulses). Kicker + accent follow the type palette (project = cyan, experience = slate, education = violet, certification = amber).

**Ask what to feature — recommend a default, let them re-pick** (voice-guide rule #6 / `AskUserQuestion`). When the Overview is on:

> Your Overview is the first screen a recruiter sees. What should it feature up top? I'll suggest a strong default — change any of it.
> - your 2 best **social** profiles/posts
> - a standout **project**
> - a key **role**
> - a **degree or certification** worth surfacing
>
> Or tell me in your own words — or "just pick for me." (It's all a recommendation; you can change everything later.)

Record the picks on the CuratedPortfolio so they're remembered and not re-asked while iterating.

**Compose to fill — no gaping holes** (a design rule, not a layout hack; this is the agent being smart, guided by these instructions + the design tokens). "Latest from" is **embeds-only** now — the renderer routes every profile/link social to the headline — so the tall-embed-beside-short-link gap can't occur by construction. The instinct still carries across the **whole** Overview: balance the strips, fill the space, leave no orphaned empty area. The recruiter should never land on a hole.

### Resume view — field mapping

The shell carries an empty `<div id="resume-view" hidden>` as a **direct child of `.wrap`**. On screen it never renders (`#resume-view{display:none}`); it exists solely for the print path — when the user picks **Resume** in the export chooser, `body.print-doc-resume` hides the portfolio panes and shows this view instead. `portfolio.js`'s `renderResumeView` populates it synchronously at runtime from the `resume` object — but a blank `resume` block in `data.js` silently prints a blank résumé, so **author the `resume` data on every generation.**

What each `resume` field drives — see the `data.js` authoring contract for the full shape:

| `resume` field | Drives | Notes |
|---|---|---|
| `meta.name` / `meta.headline` | `.resume-header` h1 / `.resume-headline` | Same values as the identity card. |
| `contact_line_parts` | `.resume-contact` line | The renderer joins with ` · `, only the fields present: location (text), **email as the address itself, mailto-linked**, phone (plain text), links (**worded anchors** like `<a href="…">LinkedIn</a>`, never raw URLs), and a **Portfolio anchor injected from the stamped head `share_url`** when published (NOT from `meta.site_url`). No links-as-icons. |
| `summary` | `.resume-summary` | 2–3 tight sentences in résumé register — factual and scannable, not Hope's designerly portfolio voice. |
| `experience[]` (`{role_title, company, dates, bullets:[{text, tag}]}`) | one `.resume-entry` per role | **2–4 bullets per role**, metric-led. Each bullet renders `<li>{esc(text)} <strong>{esc(tag)}</strong></li>` — the `tag` is a **short metric chip APPENDED at the end of the bullet**, escaped separately and concatenated, **not** an in-text substring wrapped in place. Exactly ONE `<strong>` per `<li>` (ATS rule). A missing `tag` logs a WARNING and the renderer emits an unbolded `<li>`. |
| `education[]` (`{degree_line, institution, dates}`) | one `.resume-entry` per **degree** | **Degrees only — certifications are NOT folded into resume Education.** |
| `skills_line` | `.resume-skills` | Top **10–14 skills, comma-joined**, strongest-evidenced and most market-demanded first. |

**ATS rules — non-negotiable inside `#resume-view`:** real text only, standard section headings (Experience, Education, Skills), semantic markup — real `<h1>`/`<h2>` and `<ul><li>` — **no tables, no images or icons, no icon fonts, no text rendered as graphics.** Recruiters' parsers must be able to read every word.

### Icons for links — bundled first, fetched when missing

Contact-row and share-menu links carry **monochrome single-path inline SVG** brand marks (Simple-Icons-style, `viewBox="0 0 24 24"`, `fill="currentColor"`), sized to match the Material Symbols they sit beside (contact row ~13–14px, share menu ~14px). Because they're `currentColor`, they inherit their parent's color — the LinkedIn link stays `--accent-cyan` per the design tokens, other contact items `--text-secondary`, share-menu items their existing color — and theme automatically. **Never full-color brand logos, never icon fonts, never external `<img>`/`url()` icon loads** — icons are **inlined** so the portfolio stays self-contained.

**Bundled set first.** Match each contact/site link by hostname and inline the bundled SVG from `$PLUGIN_ROOT/assets/icons/brands/<slug>.svg` directly into the markup:

| Hostname | Icon |
|---|---|
| `linkedin.com` | `linkedin.svg` |
| `github.com` | `github.svg` |
| `x.com` / `twitter.com` | `x.svg` |
| `whatsapp.com` / `wa.me` | `whatsapp.svg` |
| `instagram.com` | `instagram.svg` |
| `behance.net` | `behance.svg` |
| `dribbble.com` | `dribbble.svg` |
| `medium.com` | `medium.svg` |
| `youtube.com` / `youtu.be` | `youtube.svg` |
| personal site / no brand match | `globe.svg` (generic fallback) |

**Unknown platform → announce, fetch, cache, inline.** When a link's hostname is a recognizable brand with no bundled icon (e.g. `gitlab.com`, `mastodon.social`), announce one line — "grabbing the <site> icon" — and fetch the monochrome SVG from `https://cdn.simpleicons.org/<slug>` (slug = the brand name, lowercase). On success, **cache a copy** to the project's `career-graph/assets/icons/` AND inline it into the HTML. On failure, fall back to `globe.svg` silently. Either way the fetch happens at generation time only — **the generated folder never references a network icon URL.**

**Resume view is excluded.** `#resume-view` never gets icons — real text and worded anchors only, per the ATS rules in "Resume view — field mapping" above. (The renderer's `brandSvg(kind)` emits the contact-row brand marks at runtime from each `identity.links[].kind`; bundled/fetched SVGs are inlined into `portfolio.js`'s registry, never referenced as network URLs.)

## Bake the headshot into the file (do this at generation time)

The published portfolio must **already contain the user's photo**. The template still ships a client-side upload widget, but that only lives in *this* browser's `localStorage` — it never reaches the published file, so a published site with no baked-in photo shows an empty upload box to recruiters. Fix that by baking the photo as a `data:` URL into `identity.photo` in `data.js` when you generate — `renderIdentity` reads it at runtime and adds `.has-photo` only when it's present.

**1 — Find a headshot in the user's project folder.** Look for the obvious names first, then any image the user points you at:

```bash
# From the user's project folder (your cwd). Pick the first match.
find . -maxdepth 2 -type f \( \
    -iname 'headshot.*' -o -iname 'photo.*' -o -iname 'profile.*' \
    -o -iname 'avatar.*' -o -iname 'me.*' \
  \) \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
  -print 2>/dev/null | head -5
```

If the user named a specific file ("use `~/Pictures/jane.jpg`"), use that path instead. If you find more than one candidate, ask which to use rather than guessing — list them as numbered choices (voice-guide rule #6), recommending the most headshot-looking one.

**2 — Resize to ~480px and base64-encode it.** Keep the file small so the HTML stays portable. On macOS use `sips` (always present); otherwise fall back to Python/PIL:

```bash
SRC="<the image you found>"
OUT="$(mktemp -t hope_headshot).jpg"
# macOS: longest edge → 480px, re-encode as JPEG.
sips -Z 480 -s format jpeg "$SRC" --out "$OUT" >/dev/null 2>&1 \
  || python3 - "$SRC" "$OUT" <<'PY'
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im.thumbnail((480, 480))
im.save(out, "JPEG", quality=82)
PY
# Emit a ready-to-paste data: URL (single line, no wrapping).
printf 'data:image/jpeg;base64,%s' "$(base64 < "$OUT" | tr -d '\n')"
```

**3 — Bake it into `data.js`.** Set `identity.photo` to the `data:image/jpeg;base64,…` string. At runtime `renderIdentity` renders `.photo-upload.has-photo` with the baked image in `#photo-preview` and hides the "add a photo" prompt. The same `data:` URL also feeds the share cards (reuse it — don't re-encode).

**4 — No photo found? Omit it.** If there's no headshot and the user doesn't point you at one, leave `identity.photo` absent/`null`. `renderIdentity` then shows the dashed "Photo" upload box (no `.has-photo`) exactly as before — the no-photo case must not break. When you then invite a photo at hand-over, the ask is a plain yes/no ("want your photo in before this goes out?") and you point instead of describing: hand `<preview-url>#spotlight=photo` — "the glowing box is where your photo goes; drop an image in this folder and I'll bake it in."

Either way the localStorage "change your photo" widget stays in the file as a fallback the user can use after publishing.

**Before saving the user's files, clean and verify the output:**
- **Strip the template-authoring comments** — the template doc-comment block in `index.html` (it points at this SKILL's build contract) AND the `window.HOPE_DATA` authoring-contract comment in `data.js`. They document the template for *you*; they must not ship in the user's portfolio. Keep the disclosed provenance comments (share-url, generator) and the head theme-init / JSON-LD — those are intentional.
- **"Generated" means all of it** — the full folder per "What this skill outputs": the static SEO-stamped shell `index.html` (head + `.seo-fallback` with real `name`/`headline`/`summary_short`, no content markup), `portfolio.css` and `portfolio.js` carried over **verbatim**, `data.js` with the **complete `window.HOPE_DATA`** (meta+confidence, identity with baked photo, overview, experience, projects, skills, education, certifications, resume, timeline, traveler, social), plus **`share-card.html` and `share-card-square.html`** (see "Share cards & link-preview meta"). A run that produces only `index.html`, or a `data.js` missing any section the user curated, is incomplete.
- **Verify zero tokens remain** — grep **every file in the generated folder** (all four named files AND both share cards) for `{{` and `<!-- HOPE:`; require **zero matches**. The new template has no content tokens or loop markers — these greps should come back empty by construction, so any hit means a stray template comment survived or you hand-edited markup you shouldn't have. Also confirm the shell `index.html` carries the `.seo-fallback` block with **real** `name`/`headline` (not a placeholder) and that the head SEO metas (canonical, description, og:*, twitter:*, JSON-LD with description/url/sameAs) carry real values.
- **Verify zero raw hex across ALL four files** — including `data.js` and `portfolio.js`. `data.js` carries semantic values only (`category`, `level`, `confidence.band`); `portfolio.js` resolves every color to `var(--token)` / `color-mix(… 20% transparent)` / `currentColor`. A hex literal anywhere is a token-purity bug — fix before saving. This is the #1 risk of the runtime model.
- **Verify the anchor pairing** — every `timeline[].anchor` must resolve to a card the renderer will produce: an `id="tl-{id}"` derived from the entry in the array named by that timeline entry's `pane` (`experience`/`projects`/`education`/`certifications`). The join key is `pane` (plural), never `type` (singular). A timeline anchor with no matching array entry is a dead click on the rail — fix both directions before saving.
- **Verify structure — order, placement, agreement (headless render).** `data.js` and the rendered pane cards are **two views of one chronology** and must not drift: the timeline array is chronological (ascending — left→right on the rail), the cards in each pane run **reverse-chronological (newest first)**, and both must reference the same items. **Derive both from one date-sorted dataset — never hand-order independently** (that's how a promotion ends up shown oldest-first). When `python3` is available, run `python3 "$PLUGIN_ROOT/scripts/verify_portfolio_structure.py" <portfolio-folder>/` — it loads shell + `data.js` + `portfolio.js` in **headless Chrome**, dumps the RENDERED DOM, and asserts **agreement** (every timeline entry ↔ its rendered `tl-` card), **containment** (each card in its declared pane), **order** (each pane newest-first), the `overview.show`/`social.length` ⇔ pane-presence gates, the direct-child invariants, and **head↔data SEO parity**. Read the PASS/FAIL table and fix every FAIL before saving — a regex-on-raw-HTML check would now PASS vacuously (the shell body is empty until `portfolio.js` runs), so the headless render is what actually validates the page. If `python3`/Chrome isn't available, do it by eye: open the page, read each pane top-to-bottom, confirm dates descend and no card sits in the wrong pane.
- **Verify zero external icon URLs** — grep **every file in the saved folder** for `simpleicons` and `cdn.simpleicons.org` (e.g. `grep -rnE 'simpleicons|cdn\.simpleicons\.org' <portfolio-folder>/`) and require **zero matches**. Per "Icons for links", any CDN fetch happens at generation time and the SVG lands inline in `portfolio.js`'s registry; the only sanctioned network reference is the favicon `onerror` Google-favicon `src`.
- **Verify the PDF export — produce and inspect, don't assume.** After generating, print one résumé PDF and check it. When `python3` is available, run the bundled checker — it drives headless Chrome (so `portfolio.js` runs and `renderResumeView` populates `#resume-view`), and asserts `#resume-view` has `.resume-entry` children before printing: `python3 "$PLUGIN_ROOT/scripts/verify_portfolio_pdf.py" <portfolio-folder>/ --modes resume-classic`. Read its PASS/FAIL table and fix any FAIL before handing the folder over. If `python3` isn't available, say so plainly instead of claiming the export was verified.

## Share cards & link-preview meta (generate alongside the portfolio)

A bare URL pasted into LinkedIn/X/WhatsApp unfurls as a rich card only when the page's OG meta points at a real image. **You make the content and the image sources; the publish skill stamps URLs and takes the screenshots.** Division of labor:

**1 — `meta.og_description`.** `index.html`'s `og:description` / `twitter:description` are **stamped from `meta.og_description`** into the static SEO shell's `<head>` (no `{{tokens}}` — see "What this skill outputs", the `index.html` row). Write a **1–2 sentence third-person hook** distilled from the summary — recruiter-facing, specific, no hype. ("Product designer who unified Figma's design system across twelve teams" — not "Visionary design leader passionate about impact.") The OG/Twitter title is stamped `{name} — {headline}` from `meta.name` / `meta.headline`. **Leave `og:url`, `og:image`, and `twitter:image` with `content=""` exactly as the template ships them** — the publish skill stamps absolute URLs once it knows `SITE_URL`.

**2 — Generate two share-card pages in the portfolio folder, next to `index.html`** (exactly these names — the publish skill looks for them):

- `share-card.html` — fixed **1200×630** (the OG link-preview size).
- `share-card-square.html` — fixed **1080×1080** (IG / WhatsApp avatar variant).

Both are **build-time-stamped, NOT runtime data-driven** — fixed-pixel, single-shot, never interactive, so they take **no dependency on `portfolio.js` / `data.js` load timing** inside a headless screenshot. Stamp them from the **same `meta` / `identity` / `overview.headline_stats` source as `data.js`**, in the same render pass: the **baked headshot** if you have one (`identity.photo` — the same `data:` URL as the portfolio), the user's **name** (`meta.name`), **headline** (`meta.headline`), up to **3 hero metric badges** (the first three of `overview.headline_stats`, each as `value` + `label`), and the **live URL in mono at the bottom** (the real URL is stamped at publish time — showing the expected URL is fine). No `{{tokens}}` left and **no raw hex**: reuse the same `var(--token)` colors the portfolio uses, **or** an inlined fixed-pixel `<style>` — these pages are screenshotted, so an inline `<style>` is acceptable and **isolated from the four-file portfolio law** (they never ship in the published site; the four-file allowlist + 2 PNGs is unchanged). The body is locked to the pixel size with `overflow: hidden` and **no scrollbars**: the publish skill screenshots these pages 1:1 with headless Chrome into `og-image.png` / `og-image-square.png`, so a stray scrollbar or overflowing element ships straight into the recruiter's link preview.

You do **not** take the screenshots — that's the publish skill's step (it needs `SITE_URL` first, and it degrades gracefully if Chrome is missing). Your job ends at two pixel-exact HTML files that render correctly at their fixed sizes.

## Provenance & attribution

Every Hope portfolio carries one **visible** credit — never hidden, never enforced:

- A **"Generated with Hope"** footer linking to the project.
- A `<meta name="generator">` tag and an **enriched** schema.org **ProfilePage** JSON-LD block in `<head>` — machine-readable so recruiters, ATS, and search can read the portfolio (this serves the user's discoverability, not Hope). Stamp it from `meta` in the same pass that writes `data.js`: the `Person` carries `name`, `jobTitle` (← `headline`), `description` (← `og_description`), `url` (← `share_url`/canonical), `sameAs` (← `identity.links[].url`), `image` (← published og-image, publish-stamped), and `dateCreated` (← `generation_date`, kept as an ISO date). Escape `name` / `headline` / `description` for valid JSON.

There is **no hidden marker, no signature, no telemetry, nothing that phones home** — Hope is a free gift, given in good faith. The footer is the whole attribution story. Because it's the user's file under MIT, they *can* remove it — but the template asks them, warmly, to keep it so the next person finds Hope too. If a user asks to remove it, help them; don't lecture. Trust is the point.

## Length

Most portfolios should fit in 2–3 screens of vertical scroll on desktop. Long-scroll portfolios with twelve roles and twenty projects defeat the point. If the user's career is large, curate harder.

## What to ask the user before generating

Every question this skill asks follows **voice-guide rule #6 — "Choices, not blanks"** and is delivered through the **`AskUserQuestion` tool**, never typed inline as prose: 2–4 selectable options, exactly one "(recommended)" with a one-clause why, and the tool's built-in "enter your own answer" as the free-text escape hatch. Per the rule, **weighty or personal questions also carry a final "💬 Chat about this first" option** — picking it means Hope talks it through before deciding; it complements the free-text escape hatch, it doesn't replace it. In this skill that's the Overview opt-in and the traveler picker below, and the update menu (see "Updating — always start with the menu"); the "What's off?" diagnostic stays chat-option-free — it's a scannable checklist, and chat just adds noise there.

**This binds improvised questions too.** A clarification, a quick check, anything you're about to ask as free prose — stop and reformat it as an `AskUserQuestion` menu (or a plain yes/no). Free-prose questions do not exist in Hope's voice.

**Show, then ask — the spotlight.** When a question is about something visual and there's a viewable copy to point at (the local preview from "Show it — then hand over the keys", or the live link), point first: hand the page URL with `#spotlight=<key>` appended and say in plain words what will glow — "open this; the part glowing at the bottom is what I'm asking about" — then ask the menu. The keys (the registry lives in the template's `portfolio.js`): `timeline` · `highlights` · `share` · `pdf` · `photo` · `summary` · `experience` · `skills` · `education` · `certifications` · `projects` · `social`. The hash works over `file://`, the local server, and the published link alike, and clears itself once the glow plays. On a first-ever generation there's nothing to point at yet — plain words carry the question alone.

If the user has provided a target Job, just confirm: "Generating a portfolio targeted at {company} for {role}. The angle I'm taking is {angle in one sentence}. Continue?" (A plain yes/no confirm IS rule-#6 compliant — don't pad it with fake options.)

If no target Job, ask as a choice:

> Should this portfolio aim somewhere specific?
> 1. **General portfolio of your strongest work** (recommended — you can always tailor a copy when a specific role shows up)
> 2. **Tailored to a role you have in mind** — name the company or role and I'll angle everything at it
>
> Or tell me in your own words.

If the answer is "general", scaffold the constraint question instead of leaving it blank:

> Anything to feature or play down? For example:
> 1. **Keep the balance as-is** (recommended — I'll order by strength of evidence)
> 2. **Push the consulting/freelance work forward**
> 3. **Pull the older roles back** — lead with recent work
>
> Or tell me in your own words — these are just sparks.

**App catalog — pick the optional apps (ask once per portfolio).** Every portfolio always carries the core sections: Experience, Skills, Education & Certifications, Projects. On top of those, Hope has **optional apps** the user chooses — don't decide for them. Offer the ones that apply as **one multi-select** (`AskUserQuestion`, `multiSelect: true`; the tool's "enter your own answer" is the escape hatch), recommending the ones that fit. This is a catalog: today the optional apps are **Overview** and **Social Feed**, and future apps slot into the same pick-list.

Offer **Overview** only if `Person.headline_stats` is non-empty; offer **Social Feed** always. If neither applies (no stats, and nothing to feature), skip the question entirely and ship the core.

> Your portfolio always shows your Experience, Skills, Education, and Projects. Want to add either of these?
> - **Overview** (recommended) — a highlights panel up top: your proudest numbers and a line of interests, the first thing a recruiter sees
> - **Social Feed** — your recent posts (LinkedIn, Instagram, YouTube, Dribbble, …) as live embeds, so your work shows itself
>
> Pick any, both, or neither — or tell me in your own words.

Record each pick on the CuratedPortfolio node — `"show_summary": true|false` and `"show_social": true|false` — per-portfolio presentation choices: don't re-ask while iterating on the same portfolio, and honor an existing decision on regeneration (see "Updating an existing portfolio" below).

- **If Overview is picked** — render per the Overview app field-mapping above: set `overview.show: true` in `data.js` (the recorded `CuratedPortfolio.show_summary` decision maps to it) with non-empty `overview.headline_stats`; stats are human-curated (never auto-summed). When off, set `overview.show: false` (or omit the object) — the renderer emits no Overview tile/pane, zero residue. With no `headline_stats` and no `interests`, the app isn't offered and `overview.show` stays false.
- **If Social Feed is picked** — gather the posts (next) and write them to `data.js` as `window.HOPE_DATA.social` per the Social Feed field-mapping. When off, leave `social` as `[]` or omit the key — the `social.length > 0` gate keeps the tile and pane out, zero residue.

Show before asking when there's a viewable copy: hand `<preview-url>#spotlight=highlights` (Overview) or `#spotlight=social` (Social Feed) first — "the part glowing is the app I mean" — then the menu. First-ever portfolio: the plain words carry it alone.

**Social Feed — gather the posts (browser-assisted).** When the user adds the Social Feed, don't make them hunt for embed codes — offer the least-effort path and let them say yes:

> Great — for the Social Feed, how should I get your posts?
> 1. **Paste the links** (recommended — fastest) — drop the post URLs you want featured (LinkedIn, Instagram, YouTube, Dribbble, Behance, TikTok, X, Vimeo, Spotify, a personal site…) and I'll embed each
> 2. **Pull them for you** — give me your handles / profile URLs and I'll read your recent public posts in the browser and pick the strongest
> 3. **💬 Chat about which to feature first**
>
> Or tell me in your own words.

**Browser pull (option 2) is read-only, on user-named URLs only** — the same guardrail as onboarding's LinkedIn-via-browser (see `references/computer-use-guardrails.md`): visit only the profile/handle URLs the user gives, read public posts, extract permalinks; never log in as them or act on their behalf. No browser available → fall back to paste. This "offer to fetch, don't make them hunt" pattern is general: any app that needs live external content can reuse it (GitHub pins, a personal site, …). Keep the feed **curated — 4–8 strong posts beat a wall** — and write each as `{ platform, url, title?, caption?, pinned? }` (platform list + how the renderer turns a url into an embed: the Social Feed field-mapping).

**Disclose the trade-off in plain words before shipping a Social Feed** (it's the one app that isn't fully self-contained): "One thing about the Social Feed — it shows live posts from those sites, so it needs your published link and a connection to display them. Opened offline, or if a post is later deleted, each one falls back to a clickable link — your page never breaks, it just shows the link instead of the live post." Never expose the words "embed", "iframe", "oEmbed", or "script" to the user.

**Traveler picker — ask once per portfolio.** The Throughline's playhead carries a glyph — the traveler — and it's the user's to choose. If this CuratedPortfolio has no recorded `timeline_traveler` yet, ask at generation:

> The moving timeline at the bottom of your page has a little character that travels along it as your career plays. Who should yours be?
> 1. **The glow dot** (recommended — calm, classic, lets the work do the talking)
> 2. **One of the kept seven** — paper plane, car, train, sailboat, bicycle, rocket, footprints
> 3. **Find one that's me** — I'll suggest a few from what I know you love, and go get it
> 4. **Make me one** — I'll draw you a tiny original
> 5. **💬 Chat about this first** — we'll talk about what fits before deciding
>
> Or tell me in your own words.

Point before asking when you can: with a viewable copy up (an earlier generation, or the live link), hand `<preview-url>#spotlight=timeline` first — "the strip glowing at the bottom is the timeline I mean" — then the menu. First-ever portfolio: the plain description above carries it.

- **3 — Find one.** Recommend candidates from `Person.interests` (a trail runner hears footprints first; a sailor, the sailboat — or something better off the shelf). When it's not in the bundled seven, fetch it via the same announce → fetch → cache → inline protocol as "Icons for links — bundled first, fetched when missing" above; the brand-icon law applies (monochrome single-path, `viewBox="0 0 24 24"`, `fill="currentColor"` — canon §6).
- **4 — Make one.** Author a tiny single-path SVG by hand to the same law, save it to the project's `career-graph/assets/icons/`, and inline it.

Whatever they pick lands in `data.js` as `window.HOPE_DATA.traveler` (see "The Throughline — timeline data contract") and is recorded on the CuratedPortfolio node as `"timeline_traveler"` — a per-portfolio presentation choice like `show_summary`: don't re-ask while iterating, and honor it on regeneration without re-asking (see "Updating an existing portfolio").

Then generate. Show them. Iterate.

## Iteration loop

After first generation, **always ask "What's off?"** Don't ask "do you like it?" — that's a yes/no trap; "what's off" invites correction. It's an inherently narrative question, so per voice-guide rule #6 the options are **example-scaffolds** that spark the user's own answer — no "(recommended)" pick, because there's no right answer to what's bothering them:

> What's off? Pick anything that itches:
> 1. **Voice** — too cold, too warm, too salesy somewhere
> 2. **Featured work** — wrong roles or projects up front
> 3. **Order** — sections or cards in the wrong sequence
> 4. **Length** — too much scroll, or too thin
> 5. **Theme** — light vs. dark default
> 6. **Phrasing** — a specific line in a card reads wrong
>
> Tell me the number — or open <preview-url>#spotlight=highlights to see each part glow first (swap `highlights` for `timeline`, `summary`, `experience`, `skills`, `projects`, `share`, or `pdf`).
>
> Or tell me in your own words.

Update the artifact. Update the CuratedPortfolio in the graph if the curation changed (including a changed `show_summary` or `timeline_traveler` decision).

**Gap-filling? Re-read the source documents first.** When something's missing — a role, an internship, an early job, a date, a whole early-career arc — go back to the user's **original source documents** (uploaded PDFs, the résumé, a LinkedIn export) *before* searching any generated or derived file. The authoritative history is the **input, not the output**: a LinkedIn export or résumé routinely holds entire roles and schooling that the rendered HTML never captured, and hunting through `data.js` or the generated markup for facts the source already states wastes turns and invents gaps that aren't real. Richest source first — the same instinct onboarding uses, carried into iteration.

## Show it — then hand over the keys

The portfolio is the payoff. Don't just save a file and move on — **present it.** Preview it the robust way, in this order — stop at the first one that works for the user's environment:

1. **Render it in the viewer — this is the primary path.** Save the folder (step 2), then surface **the folder's `index.html` path** in the chat as the deliverable so the Claude app's **preview pane renders it inline**. Clicking an HTML path in the chat opens it in the embedded preview — no local server, no macOS permission prompts, no working-directory pitfalls. This is the canonical, most reliable path; reach for it first and you're usually done.
2. **Hand over the path — always the folder's `index.html`.** Save the folder to `career-graph/documents/portfolios/portfolio-<slug>-<date>/` and tell them the exact path to its `index.html` in plain words — that's the file they open; the siblings ride along.
3. **Open it in a full browser — lead with the one-liner server.** Tell them warmly, something like: "The reliable way on a Mac: in Terminal, run `cd <folder> && python3 -m http.server 8000`, then open http://localhost:8000 — that's it. Double-clicking `index.html` usually works too, but if the page comes up unstyled (plain black text, no cream background), that's macOS quietly blocking the browser from reading the folder's CSS/JS files — use the server line instead and hard-refresh (Cmd+Shift+R). And once it's published, the live URL just works, everywhere." That unstyled-page failure is real (macOS TCC can block Chrome from reading sibling files over `file://` inside `~/Documents`), so the server line leads and double-click stays the alternative.
4. **Only if Claude itself must run the server for them**, **never run `python -m http.server` from a `~/Documents` / `~/Desktop` / `~/Downloads` working directory.** On macOS those folders sit behind the TCC sandbox, and a process Claude spawns can't read them even when Claude itself can — and a pyenv-shimmed `python` will also fail because it calls `getcwd()` on an unreadable directory. Instead, **copy the whole folder into a temp dir** (never a lone `index.html` — the CSS/JS/data siblings must travel with it), **`chdir` there first, then serve with a pinned system Python:**

   ```bash
   TMP="$(mktemp -d)"
   cp -R "<absolute-path-to-portfolio-folder>" "$TMP/portfolio"   # the WHOLE folder — siblings included
   cd "$TMP"                     # chdir FIRST so getcwd() never touches a TCC folder
   /usr/bin/python3 -m http.server --bind 127.0.0.1 --directory "$TMP" 8080
   # → http://127.0.0.1:8080/portfolio/index.html
   ```

   Use `/usr/bin/python3` (the system interpreter), not a bare `python`/`python3` that may be a pyenv shim. Pin `--directory` to the absolute temp path. Never serve from the user's project folder under `~/Documents`.
5. **Point out Share & Save as PDF.** The portfolio carries a **Share** button that opens a small share menu — **Copy link · LinkedIn · X · WhatsApp · Email** (the social links go live once published; Copy keeps its "Copied!" feedback) — and a **Save as PDF** button that exports the **résumé**: a chooser for style (classic / modern / compact), font, and fit, with a **hard readability floor — body text never drops below 10pt**. The portfolio-PDF chooser is gated for the next release — the live page IS the portfolio, and **Cmd+P still prints it natively**. Tell the user plainly: "Save as PDF gives you a résumé that application systems read perfectly — pick a style, font, and fit; the text never gets too small to read. The page itself is your portfolio: share the link, or Cmd+P to print it." Your last choice is remembered for next time. Name both buttons so the user knows they're there.

## Hand-off — recommend publishing, and own the setup

The moment they like it, lead them to put it online. That's what turns a file on their disk into a link a recruiter can open.

1. Create a Document node (`content_type: "portfolio"`), linked via `UPLOADED` from Person and `INCLUDES_DOCUMENT` from CuratedPortfolio.
2. Recommend publishing — warmly, as the default next step, and **carry the load yourself:**
   > "This is yours. Want me to put it online as your GitHub portfolio — one link you can drop in any application? I'll handle all the setup."
   Route to `hope-publish`. It is built so the user never has to make a technical decision — it sets things up if needed and does the work.
3. If they'd rather wait, respect it — just let them sit with it. Recommend, never coerce.

## Closing the loop — after publish, or when they come back

Once the portfolio is live (or any time the user returns), there's exactly one loop to offer — keep them inside it (numbered per voice-guide rule #6, no "(recommended)" — both paths are equally right depending on where they are):

> Where are we picking up?
> 1. **Update your portfolio** — feature different work, change the angle, edit a card
> 2. **Publish the changes** you've made — I'll push them live
>
> Or tell me in your own words.

- Want to change what's in it? That's an update — open the update menu below ("Updating — always start with the menu"), then route back to `hope-publish` to push the result.
- Happy with it and just want it online (or re-published after edits)? Route to `hope-publish`.

That's the whole flow: collect their story → show the portfolio → put it online → update or re-publish on demand. Don't point them anywhere outside this loop.

## Updating — always start with the menu

When the user asks to update — any phrasing counts: "update my portfolio", "change my portfolio", "refresh it", or picking option 1 in the menu above — **never guess what kind of update they mean. Always open with this menu.** (Six options is past rule #6's usual four — the diagnostic-checklist exception applies: this is a scannable list of update *types*, not one weighed decision.)

First read the live Hope version **at runtime** — `<LIVE>` is never hardcoded into prose; it always comes from the installed plugin's manifest:

```bash
LIVE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$PLUGIN_ROOT/plugin.json" 2>/dev/null \
  || jq -r .version "$PLUGIN_ROOT/plugin.json" 2>/dev/null \
  || grep -m1 '"version"' "$PLUGIN_ROOT/plugin.json" | grep -oE '[0-9]+(\.[0-9]+)+')"
```

Then ask, substituting `<LIVE>`:

> What are we updating?
> 1. My story changed — new role, achievement, or project (recommended when something's new)
> 2. The look — theme, photo, layout choices
> 3. What's featured — different work up front, target a specific role
> 4. Update to the latest Hope release (v<LIVE>) — pick up new features
> 5. Check for all updates — I'll compare everything and propose the lot
> 6. 💬 Chat about it first — tell me what's on your mind.

**What each option does:**

- **1 — My story changed.** Capture the new facts into the career graph first (new Experience, contribution, Project, or metric nodes — in the user's words, evidence-backed), then regenerate per "Updating an existing portfolio" below.
- **2 — The look.** Theme default, a new headshot (re-run the bake steps), layout choices the template exposes — then regenerate. Design tokens stay locked; "the look" never means new CSS.
- **3 — What's featured.** Re-curate: re-run "How to choose what goes in" (optionally against a newly named target role), update the CuratedPortfolio node, regenerate.
- **4 — Latest Hope release.** Run the stale-session check below. If this chat is already running v<LIVE>, say so plainly — "you're on the newest Hope, nothing to pick up" — and only regenerate if their newest portfolio file predates the current template's features.
- **5 — Check for all updates.** Compare everything, then propose the lot in one message and let them pick what to act on:
  1. **Graph changes since the last generation** — anything added or edited in the graph after the newest portfolio file's date (the CuratedPortfolio node records what went out, and when).
  2. **Plugin version** — this skill's version marker vs `<LIVE>` (the stale-session check below).
  3. **Republish staleness** — compare the local portfolio folder's newest file-modified time against `published_at` in `.publish.json` (hope-publish stamps it on every publish, including re-publishes). Local file newer → the live link is behind the local copy. No `.publish.json` → never published; no `published_at` in it → published by an older Hope, just say "worth a republish to be safe."
- **6 — Chat about it first.** No checklist, no regeneration yet — talk through what's on their mind (voice-guide rule #6's chat option), then land on whichever option fits.

### Updating an existing portfolio

Options 1–3 (and any updates the user accepts from option 5) land here. **Regenerating from the user's existing graph against the current bundled template is THE update path** — never patch old files in place. New template features (like the Overview app, the Throughline, and the published-mode gates) flow into the regenerated folder automatically; then re-publishing via `hope-publish` re-stages the files and re-stamps the published flag, so updates stay sustainable release after release. Honor the existing `CuratedPortfolio.show_summary` and `timeline_traveler` decisions without re-asking. One distinction to keep straight: **the local folder is the owner's editable copy — its `index.html` never carries `data-hope-mode="published"`; the published copy is the one the publish skill stamps read-only (the stamp lives on `index.html`'s `<html>` tag).**

## Stale-session check — is this chat running an older Hope?

This file carries a version marker near the top — `<!-- hope-skill-version: 1.2.0 -->` — naming the Hope this chat loaded. The live version is whatever `$PLUGIN_ROOT/plugin.json` says **right now** (the `<LIVE>` one-liner above). Run the comparison whenever the user picks option 4 or 5 of the update menu.

When `plugin.json` is **newer** than the marker, this conversation loaded an older Hope — a newer release is installed, but a running chat can't pick it up mid-flight. Output exactly this structure:

1. A bold heading: **Recommendation: start a fresh chat to get the newest Hope (v<LIVE>)**
2. Simple-English comfort, no jargon: "Nothing will be lost. Everything we've built lives in this folder — your career file, your portfolio, your notes. A new chat just picks up the newest Hope and reads them right back."
3. A handoff — and define the word naturally the first time it's used: a "handoff" is just that baton-pass summary; explain it once, then it's theirs. Introduce it gently: "Here's a short summary to paste into the new chat so it knows exactly where we left off — think of it as passing the baton:" — then a compact block (≤10 lines) covering **who they are, what exists in the folder, what was in progress, and the next step**. Compose it from `user-story.md` per `$PLUGIN_ROOT/references/user-story-guide.md` § "How the handoff summary is derived" when the file exists — one line from "Who <name> is", the journey cross-checked against the actual files, "Now" for in-progress + next step. No story file yet? Build the same four parts from the graph and this conversation.

When the versions match, no theater: "you're on the newest Hope (v<LIVE>)" and move on.

When the marker is **newer** than `plugin.json` (a dev or unsynced build — the manifest wasn't bumped with the skill), treat the chat as up to date — no handoff theater — and flag it to the maintainer in one line: the skill marker and manifest version disagree and need the sync protocol.

## user-story.md — the notebook this skill keeps current

`user-story.md` lives in the project folder beside `career-graph/` — the user's human-readable memory, defined canonically in `$PLUGIN_ROOT/references/user-story-guide.md` (cross-reference it, don't restate it). **Read it at skill start when it exists** — it's two pages, the cheapest context in the folder, and it sets the vocabulary level, the pacing, and what never to re-ask. This skill touches it at two moments, following the guide's discipline — dated entries, journey newest-first, groom on every touch, notify in one line, never write anything the user would be surprised to find:

- **Milestone append — portfolio generated or updated.** After saving the files, append one dated line to "The journey so far" (e.g. `- 2026-06-10: Portfolio v2 tailored for <company> — platform work up front.`), record any decision worth keeping in "Decisions" (a `show_summary` choice and why, a curation angle), and rewrite "Now" so the next session — or the baton-pass handoff — picks up cleanly.
- **"Remember this" asides.** When the user says "remember this" (or anything close) mid-flow, write it into "## Remember this" **the same turn** — dated, tagged "(you asked me to remember this)" — then return to the portfolio work.

If the file doesn't exist yet, create it per the guide and announce it verbatim: "I keep a little notebook about how you like to work — `user-story.md`, yours to read or edit." It's the user's file — never committed, never published — and it's what the stale-session handoff above draws from.

## What you do not do

- You do not generate generic portfolios. Every Hope portfolio is curated.
- You do not invent metrics or experiences. Every claim traces to a graph node.
- You do not use stock photos or stock language. The user's actual work is what's interesting.
- You do not exceed 3-screen vertical scroll without explicit user request.
- You do not ship without the theme toggle (light default + dark).
- You do not ship without the structural signatures — interactive section grid, scanline + 32×32 grid texture, and hex KPIs.

This artifact is the one Artemis (Hope's maker) submits and gets interview calls from. It is the proof that Hope works. Hold the bar.
