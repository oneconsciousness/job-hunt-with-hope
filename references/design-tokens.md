# Hope Design Tokens

The locked design tokens for every Hope artifact — portfolios, dashboards, résumés, cover letters, and any HTML the plugin generates. **Read this before generating or editing any visual output.**

Hope's identity is **structural**: the layout, the interactive patterns, and the texture are the brand. **Color is themeable** — every artifact ships a light theme (default) and a dark theme that swap cleanly without changing a single element of the layout. That separation is deliberate: a Hope portfolio is recognizable as Hope's whether it's light, dark, or recolored, because the *structure* never moves.

The canonical values below match what `assets/templates/*.html` actually ship. If a template and this file ever disagree, the template is the bug — fix it to match here, or update here and re-derive the templates. Don't let them drift.

---

## 1. The theme mechanism

- Every artifact sets `data-theme` on `<html>` (`light` | `dark` | `custom`) and declares `color-scheme: light dark` so native form controls match.
- All colors are CSS custom properties on `:root` (light values). `[data-theme="dark"]` overrides the **same variable names** with dark values. Components reference `var(--token)` only — never a raw hex.
- A sun/moon toggle (top-right) flips `data-theme` and persists the choice to `localStorage` under `hope-portfolio-theme` (or a skill-specific key).
- **Default is light** when no preference is stored. This is a deliberate brand choice — warm cream + orange is Hope's face. Do not auto-switch to dark based on OS preference; let the user choose.

Because every component reads `var(--token)`, recoloring is a token swap, never a layout edit.

## 2. Light theme (default)

```css
:root {
  color-scheme: light dark;
  --bg: #F0EBE3; --surface: #E8E2D8; --surface-2: #EDE8DF;
  --card-bg: #F5F0E8; --card-bg-hover: #FAF6EE; --card-bg-active: #FFFCF3;
  --text-primary: #1A1612; --text-secondary: #5C4F3D; --text-muted: #8C7E6D; --text-dim: #B5AC9E;
  --accent-orange: #D97706; --accent-orange-hover: #B45309;
  --accent-orange-bg: rgba(217,119,6,0.10); --accent-orange-glow: 0 4px 14px rgba(217,119,6,0.22);
  --accent-cyan: #0891B2; --accent-cyan-soft: rgba(8,145,178,0.08); --accent-cyan-edge: rgba(8,145,178,0.20);
  --accent-emerald: #16A34A; --accent-emerald-bg: rgba(22,163,74,0.10);
  --accent-emerald-edge: rgba(22,163,74,0.30); --accent-emerald-glow: 0 0 10px rgba(22,163,74,0.20);
  --accent-violet: #7C5BBF; --accent-violet-bg: rgba(124,91,191,0.10); --accent-violet-edge: rgba(124,91,191,0.25);
  --accent-amber: #C27D0E; --accent-amber-bg: rgba(194,125,14,0.12); --accent-amber-edge: rgba(194,125,14,0.30);
  --accent-rose: #D43450;
  --accent-slate: #4A6FA5; --accent-slate-bg: rgba(74,111,165,0.10); --accent-slate-edge: rgba(74,111,165,0.30);
  --border-default: rgba(31,22,14,0.10); --border-subtle: rgba(31,22,14,0.05); --border-hover: rgba(31,22,14,0.20);
  --radius-card: 8px; --radius-panel: 10px; --radius-button: 6px; --radius-pill: 9999px; --radius-tight: 3px;
  --shadow-sm: 0 1px 2px rgba(31,22,14,0.04); --shadow-md: 0 2px 8px rgba(31,22,14,0.06);
  --grid-line: rgba(31,22,14,0.04); --scan-line: rgba(31,22,14,0.02);
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;
}
```

## 3. Dark theme (toggle alternate)

A **warm dark** — near-black browns, not a cold blue HUD. Light remains the default; dark is the alternate.

```css
[data-theme="dark"] {
  --bg: #1A1612; --surface: #221D17; --surface-2: #2A241D;
  --card-bg: #1F1A14; --card-bg-hover: #261F18; --card-bg-active: #2D261D;
  --text-primary: #F0E7D5; --text-secondary: #B5A78F; --text-muted: #8C7E6D; --text-dim: #5C4F3D;
  --accent-orange: #FB923C; --accent-orange-hover: #FDBA74;
  --accent-orange-bg: rgba(251,146,60,0.14); --accent-orange-glow: 0 4px 14px rgba(251,146,60,0.30);
  --accent-cyan: #22D3EE; --accent-cyan-soft: rgba(34,211,238,0.10); --accent-cyan-edge: rgba(34,211,238,0.25);
  --accent-emerald: #34D572; --accent-emerald-bg: rgba(52,213,114,0.14);
  --accent-emerald-edge: rgba(52,213,114,0.30); --accent-emerald-glow: 0 0 12px rgba(52,213,114,0.25);
  --accent-violet: #A78BFA; --accent-violet-bg: rgba(167,139,250,0.12); --accent-violet-edge: rgba(167,139,250,0.30);
  --accent-amber: #F59E0B; --accent-amber-bg: rgba(245,158,11,0.14); --accent-amber-edge: rgba(245,158,11,0.30);
  --accent-rose: #F43F5E;
  --accent-slate: #7FA3D7; --accent-slate-bg: rgba(127,163,215,0.14); --accent-slate-edge: rgba(127,163,215,0.30);
  --border-default: rgba(240,231,213,0.08); --border-subtle: rgba(240,231,213,0.04); --border-hover: rgba(240,231,213,0.20);
  --grid-line: rgba(240,231,213,0.04); --scan-line: rgba(240,231,213,0.02);
}
```

## 3b. Runtime renderer tokens (skill-tier · skill-category · integrity)

The runtime data-driven portfolio (`data.js` → `portfolio.js`) carries **semantic** values only — `level:4`, `category:"programming"`, `confidence.band:"high"` — and resolves them to `var(--token)` at render. That requires **15 `:root` tokens** that the old build-time template stamped as per-element inline hex. They are added to `portfolio.css` (`:root` + `[data-theme="dark"]` + the print-ink overrides, matching the existing accent pattern) so the renderer emits zero hex and the zero-token grep stays green across all four files.

Most alias an existing accent, so light/dark/print already track with no new hex.

**4 skill-tier tokens** — color the 4-bar skill-level visual (§9). **Seg color = LEVEL tier, never category** (locked below):

| Token | Tier (level) | Alias |
|---|---|---|
| `--skill-expert` | level 4 — expert | `var(--accent-cyan)` |
| `--skill-advanced` | level 3 — advanced | `var(--accent-emerald)` |
| `--skill-proficient` | level 2 — proficient | `var(--accent-amber)` |
| `--skill-beginner` | level 1 — beginner | `var(--accent-violet)` |

Lit segs use the tier token; unlit segs use `color-mix(in srgb, var(--skill-{tier}) 20%, transparent)` — never a separate hex.

**8 skill-category tokens** — drive `--cat-color` for each skill-category. Values are the css-contract §13 cat palette, defined once in `:root` with dark/print overrides:

`--cat-programming` · `--cat-tools` · `--cat-languages` · `--cat-methods` · `--cat-analytical` · `--cat-design` · `--cat-domain` · `--cat-interpersonal`

> **LOCKED — seg color = LEVEL tier; `--cat-color` colors ledge + name only.** The 4 skill-bar segs are colored by the skill's `level` tier (the `--skill-*` tokens above), entirely decoupled from category. `--cat-color` (one of the 8 `--cat-*` tokens) colors ONLY the `.skill-cat-header .ledge` and the `.name` — it never touches the segs. An unknown category omits `--cat-color` and the CSS falls back to `var(--accent-cyan)`.

**3 integrity tokens** — the per-section confidence bars (§9), via `--conf-color`:

| Token | Band | Alias |
|---|---|---|
| `--integrity-high` | high-confidence bar | `var(--accent-emerald)` |
| `--integrity-mid` | medium-confidence bar | `var(--accent-amber)` |
| `--integrity-low` | low-confidence bar | `var(--accent-rose)` |

## 4. Custom themes (extension point)

A user may recolor without breaking the brand, because layout is independent of color. The supported, safe path:

- Add `[data-theme="custom"] { ... }` overriding **only the accent tokens** (`--accent-orange` is the primary; `--accent-cyan` the secondary) and, if needed, the neutral ramp.
- **Never let a custom palette touch the layout, radii, type scale, or texture** — those are the brand, not the theme.
- Keep `--text-*` on `--bg`/`--card-bg` at WCAG AA contrast (≥ 4.5:1 for body text). If you derive a palette from a single seed accent, leave the neutral ramps on one of the locked light/dark sets rather than recoloring backgrounds and text together.

Treat custom as "swap the accent(s), keep everything else." That's the whole feature — resist building a per-token editor.

## 5. Color usage

- **Orange (`--accent-orange`) — THE Hope brand color.** Active section tab (filled orange, white text, glow), CTA / primary action, default skill chip, section icon container, current-role accent bar, hex-KPI icon, expanded chevron.
- **Cyan (`--accent-cyan`) — secondary accent.** Headline under the name, role company names, the LinkedIn link (other links stay `--text-secondary`), education/cert institution, IC contribution group header.
- **Emerald (`--accent-emerald`) — status / positive.** LIVE dot (pulse), ACTIVE pill, high-confidence bars, metric increase/decrease, achievement checks.
- **Violet (`--accent-violet`) — leadership / scope.** Leadership contribution group header, scope badges.
- **Amber (`--accent-amber`) — warning.** "No date" pills, medium-confidence bars.
- **Rose (`--accent-rose`) — destructive.** Photo-remove button, low-confidence bars.
- **Slate (`--accent-slate`) — Experience.** The timeline-type identity color for work history (timeline hexes, the Experience tile's left edge, experience accent bars). **The type palette** — experience slate · projects cyan · education violet · certifications amber — threads from the Throughline into each app's tile and content borders: color is navigation. **Orange is chrome, never a category**; tile fills stay brand orange on the active tile; Overview and Skills aren't timeline types and stay neutral.

## 6. Typography

| Family | Use |
|---|---|
| **Inter** (`--font-sans`) | All body text, headings, labels. **Required — not Space Grotesk** (humanist and warm, not geometric). |
| **JetBrains Mono** (`--font-mono`) | All metadata, dates, counts, badges, IDs, contribution numbers, eyebrow text. |
| **Material Symbols Rounded** | Icons (via Google Fonts when available; fall back to inline SVG). **Brand icons** (LinkedIn, GitHub, …) are monochrome single-path inline SVGs — `viewBox="0 0 24 24"`, `fill="currentColor"` — sized to match the Material Symbols they sit beside, inheriting their parent's color (and theme) via `currentColor`. Never full-color logos, never icon fonts, never external icon loads — always inlined; never inside `#resume-view` (real text only). |

Weights: 400 body · 500 emphasis · 600 headlines/labels/companies · 700 section labels/titles/names/numbers · 800 sparingly. Base size 14.5px. Mono uppercase letter-spacing 0.04–0.10em; large sans headings −0.02em.

## 7. Radii, shadows, spacing

- Radii: button 6 · card 8 · panel 10 · pill 9999 · tight 3. (Soft, pill-rounded badges — not sharp.)
- Shadows: `--shadow-sm` on most cards, `--shadow-md` only on hover/expanded. Subtle — Hope is not a heavy-shadow system. Glow shadows (`--accent-*-glow`) are reserved for the LIVE pill, metric badges, the current-role accent bar, and skill-category ledges.
- Spacing: 4-point grid. Section/card padding usually 14–20px.

## 8. Texture signatures (do not omit)

Three calm textures give Hope its "technical-but-warm" identity. Without them the output looks generic.

1. **Scanline overlay** on role/project cards — `repeating-linear-gradient` of `--scan-line`, 2px stripe, opacity ~0.30.
2. **32×32 grid texture** in the identity header — crossed `--grid-line` gradients at `background-size: 32px 32px`.
3. **Subtle glows** on the LIVE pill, metric badges, current-role accent bar, and skill-category ledges.

## 9. DO / DON'T

**DO**
- Default to light; ship light + dark (and optional custom) with an identical layout.
- Use Inter for text, JetBrains Mono for all metadata.
- Keep the interactive section grid (click to filter) with an orange active state + integrity bars. **The integrity % is a data-confidence diagnostic for the owner** ("this section is thin — add evidence"), never a recruiter-facing grade: it's hidden on published copies (`html[data-hope-mode="published"]`) and never prints (the grid is hidden in all print modes). It exists only on the owner's local screen.
- Use hexagonal KPI badges (person / groups / monitoring) and the 4-bar skill-level visual.
- Group skills by category (colored ledges). Render projects as the **expandable Experience-style `.item-card`** (collapsible head with title / tagline / optional dates + chevron; body with description, impact line, and `skills_applied` chips) — this is the default, because a project's full story (description, tagline, impact, skills) belongs in the card, not thrown away in a tile. The old Instagram-style 3-col tile grid is no longer required.
- Place the LIVE pill inside the identity row, top-right.
- Apply the scanline + grid textures and the subtle glows.
- Render real org logos via Google Favicon with a lettermark fallback.
- Keep artifacts self-contained: inline CSS, inline SVG, no required network calls.

**DON'T**
- Default to dark, or auto-switch by OS preference — light is the deliberate default.
- Use Space Grotesk, glassmorphism `blur(24px)`, a cyan rail, or a saturated `#00D4FF` HUD palette — those are the abandoned v0.2 look, not Hope.
- Let a custom palette touch layout, type, radii, or texture.
- Use raw hex in components — always `var(--token)`.
- Ship without the theme toggle or without the texture signatures.

## 10. Modular structure

A generated portfolio is a **folder of four named files**, opened by double-clicking `index.html` offline — classic `<script src>` / `<link rel="stylesheet">` only. The boundaries are canon:

| File | Owns |
|---|---|
| `index.html` | SEO-stamped `<head>` (title/description/OG/Twitter/enriched-JSON-LD/canonical/hope:share-url) + inline theme-init + static skeleton with empty mount points + a static `.seo-fallback` body block (name/headline/summary, removed at hydration) + static topbar/export-modal. NO other content markup — the visible body is rendered at runtime by `portfolio.js` from `window.HOPE_DATA`. |
| `portfolio.css` | The full stylesheet — including the `:root` token block (§2–§3) |
| `portfolio.js` | The full behavior script **and the full runtime renderer** — builds the entire visible `<body>` from `window.HOPE_DATA`. |
| `data.js` | Exactly one global — `window.HOPE_DATA = {…}` — **now the complete dataset for the entire page** (meta+confidence, identity, overview, experience, projects, skills, education, certifications, resume, timeline, traveler, social), semantic values only (NO hex). |

- **Tokens stay single-source.** `:root` lives in `portfolio.css` and nowhere else; components reference `var(--token)` only (§1).
- **No inline `<style>`/`<script>` in `index.html`**, with the **theme-init snippet** as the one named exception (it MUST stay inline in `<head>` to avoid theme flash) — plus the JSON-LD data block.
- **Cross-file id/class contracts** — any id or class one file defines and another consumes — live in the markup's authoring comments, never implied.
- **DIRECT-CHILD invariants (cross-file contract).** Because the visible body is now JS-rendered, two DOM-nesting invariants are load-bearing — the CSS print order, the wide-screen grid-col-2, and the sticky rail all select with direct-child combinators, so an extra wrapper silently collapses the layout. `portfolio.js` MUST honour both; the structure verifier asserts them:
  - **`.wrap > {.identity-card, .print-toc, .section-pane, .footer, .section-grid, #resume-view}`** — every one of these is a DIRECT child of `.wrap`. In particular `renderPanes` appends `.section-pane` nodes DIRECTLY into `.wrap` (there is **no** `#panes-mount` wrapper).
  - **`.identity-card > {.identity-row, #throughline}`** — `renderIdentity` builds `.identity-row` as a DIRECT child of `.identity-card`, and `#throughline` stays a DIRECT child sibling of it (never nested in an inner wrapper).
- **The zero-token grep** (no raw color values outside the `:root` token blocks) runs across **ALL files in the folder** — and now **MUST pass over `data.js` AND `portfolio.js`** as well. This is the **#1 risk** of the runtime model: `data.js` carries semantic values only (`category:"programming"`, `level:4`, `confidence.band:"high"`), and `portfolio.js` resolves them to `var(--token)` / `color-mix(…)` / `currentColor` at render. The sole sanctioned exception is the favicon `onerror` Google-favicon `src`.

## 11. The Throughline

The career timeline strip. Canon by citation:

- **Structure is brand**: the strip is part of the identity-card structure — full-width at the bottom of the card (`id="throughline"`, `tl-*` classes), thin track on `--border-default`, mono 9px `--text-dim` year ticks, brand-hex nodes. The 32×32 grid texture (§8) does **not** repeat here — the card already carries it.
- **Node colors** follow the accent semantics of §5: experience `--accent-slate` · project `--accent-cyan` · education `--accent-violet` · certification `--accent-amber`; ongoing entries take a subtle `--accent-emerald` edge. Tokens only — never restated hex.
- **The traveler** (playhead glyph) obeys the brand-icon law (§6): monochrome single-path inline SVG, `currentColor`, ~16px. Default is the soft orange glow dot.
- **Animation is `transform`/`opacity` only** — no layout properties. It pauses under exactly four conditions: hover (anywhere on the strip), `document.hidden`, strip off-viewport, and `prefers-reduced-motion` (which renders the static rail instead).

---

*The deep rationale (per-component anatomy, schema→UI mapping, the production lineage) lives in the maintainers' design cookbook. This file is the shippable canon every skill and template depends on.*
