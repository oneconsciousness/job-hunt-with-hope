---
name: hope-portfolio
description: Use when a user wants to generate a portfolio of their work, their story, and their evidence, as a self-contained branded portfolio folder. The folder works offline (served locally or opened directly). They can send it to a recruiter, post it as a link, or save it as a PDF, and it exports their résumé. This is Hope's signature skill. Trigger phrases include "make my portfolio", "generate a portfolio", "create my portfolio for {company}", "I need a portfolio", "show off my work", "tailor a portfolio for this role", "build me something to send", or any request where the deliverable is a curated showcase of who the user is professionally.
user-invocable: true
---

<!-- hope-skill-version: 2.0.2 -->

# Hope Portfolio · The page recruiters stop for

You are running Hope's portfolio skill. This is the skill that defines Hope. It turns the user's career file into a portfolio folder they can send, publish, or print, and the same folder exports their résumé. The user sends this to recruiters and gets interview calls from it. Make it count.

## Before you start

### 1. Find the plugin root

Hope's reference files and the portfolio template folder ship **inside the plugin**, not in the user's project. The paths below (`references/…`, `assets/templates/…`) are **relative to the plugin root**. They are NOT relative to your working directory, which is the user's project folder. `${CLAUDE_PLUGIN_ROOT}` is **not** filled in inside this Markdown. So resolve the plugin root yourself with Bash, once, before you read anything:

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

If `PLUGIN_ROOT` comes back empty, ask the user where the Hope plugin is checked out (for example a `--plugin-dir` path). Do not guess relative paths: a relative `references/…` read resolves against the user's project folder and will 404.

### 2. Read the reference files

Read these before generating. They are required. The design tokens are locked, and the voice rules apply to every word in the portfolio:

```bash
cat "$PLUGIN_ROOT/references/design-tokens.md"
cat "$PLUGIN_ROOT/references/voice-guide.md"
cat "$PLUGIN_ROOT/references/career-graph-schema.md"
cat "$PLUGIN_ROOT/references/milestones.md"
```

Also read `$PLUGIN_ROOT/references/hard-rules.md` (the rules every Hope skill follows). If `user-story.md` exists in the project folder, read it too (see "The notebook: user-story.md").

### 3. Read the template

Use the bundled template as the starting structure. It is a **folder that mirrors the output folder** (the same four named files). Load it from the plugin root you resolved above:

```bash
ls "$PLUGIN_ROOT/assets/templates/portfolio/"          # index.html · portfolio.css · portfolio.js · data.js
cat "$PLUGIN_ROOT/assets/templates/portfolio/index.html"  # the static shell: SEO-stamped head, .seo-fallback, empty mounts
cat "$PLUGIN_ROOT/assets/templates/portfolio/data.js"     # carries the window.HOPE_DATA authoring contract
```

### 4. Check the precondition

- **No career file** (`career-graph/career.json`) → route to `hope-onboarding` first. Every line of the portfolio comes from the career file or the user's own words, so there is nothing to build from yet.

## What you make

### The portfolio folder

A **portfolio folder** at `career-graph/documents/portfolios/portfolio-<slug>-<date>/`. It contains exactly four named files:

- `index.html`: a **static, SEO-stamped shell**. It holds the `<head>` (title, description, OG, Twitter, enriched JSON-LD, canonical, `hope:share-url`), the inline theme-init, a static `.seo-fallback` body block (name, headline, summary; removed when `portfolio.js` renders the page), the static topbar and export modal, and **empty mount points**. There is **no content markup** here. `portfolio.js` renders the visible body at runtime from `window.HOPE_DATA`. This is the file the head SEO values and the `hope:share-url` meta get stamped into.
- `portfolio.css`: the full stylesheet. The design tokens (`:root`) live here and nowhere else. That includes the 15 seg-tier / cat / integrity tokens (see `design-tokens.md`).
- `portfolio.js`: the full behavior script **and the full runtime renderer**. It builds the entire visible `<body>` from `window.HOPE_DATA`.
- `data.js`: a classic script that defines one global, `window.HOPE_DATA = {…}`. It is **the complete dataset for the whole page**: meta and confidence map, identity, overview, experience, projects, skills, education, certifications, resume, timeline, traveler, social. It holds **semantic values only, NO hex**, and the photo is baked in as a `data:` URL. The template's `data.js` carries the full field-by-field authoring contract (the `window.HOPE_DATA` schema). Read it before you write data, and treat it as the source of truth for field types and optionality.

Also in the same folder:

- **Two share-card pages**, `share-card.html` and `share-card-square.html` (see "Share cards and link-preview meta").
- **If the user picks all six looks:** the five alternate pages, `template-utils.js`, and `switcher.js` (see "The look is the user's choice").

### The folder needs nothing but a browser

**The self-contained promise is folder-level: the folder needs nothing but a browser, and it works fully offline.** (To open it, see "Show it, then hand over the keys". On macOS a one-line local server is the reliable path. Double-click usually works but can be blocked by folder permissions.) This is law:

- Classic `<script src>` and `<link rel="stylesheet">` only. **No `type="module"`, no `fetch()`, no `import`.**
- No inline `<style>` or `<script>` in `index.html`, except the theme-init snippet (inline in `<head>` on purpose, because it prevents a theme flash) and the JSON-LD.
- What belongs in which file is set in `design-tokens.md` § "Modular structure" (read in "Before you start"). Cite it; do not restate it.
- The page uses Hope's design tokens: light by default (warm cream and orange), a dark theme via the toggle, and the same layout in both. It draws any graphics as inline SVG, and it opens in any browser with no network connection.

### What goes on the page

- **Identity card**: photo, name, headline, stats row, contact row, and summary, over a 32×32 grid texture, with the LIVE pill top-right.
- **The Throughline**: the animated career-timeline strip at the bottom of the identity card (`id="throughline"`). It has one hex node per included experience, education, project, or certification, a playhead riding the rail, hover mini-cards, and click-to-navigate to each entry's card. The template owns its look and motion. **Your job is the dataset and the card anchors** (see "The Throughline - timeline data contract").
- **Overview app (opt-in)**: a section-grid tab, not a standalone band. It is a grid tile (`data-section="overview"`, labeled "Overview", icon `insights`, meta-count "`{n} highlights`") plus a pane (`id="pane-overview"`). The pane sits first among the panes and opens by default when present. Inside: up to 4 curated hero stats as large hex badges, plus a quiet interests line. It renders **only** when `overview.show` is true and `overview.headline_stats` is non-empty (see "Overview app - field mapping").
- **Summary**: 2 to 4 sentences in Hope's voice. Specific, not generic. It hints at tension before resolution.
- **Selected experience**: the 3 to 5 most relevant Experiences as cards. Each has a title, company, dates, a one-sentence framing, the strongest contribution (STAR, with a metric), and the skills it shows.
- **Selected projects**: the same shape as experience, for portfolio-worthy projects outside formal employment.
- **Skills section**: top skills, by category, leading with the most market-demanded skills that have the strongest evidence. Each skill chip expands on click to show which experiences or projects proved it.
- **Education / Certifications**: short and factual. An entry with **honors or an achievement worth showing** in the career file (a scholarship, award, distinction, notable thesis) gets a **rich card** (see "Rich education and certification cards"). Otherwise it gets a basic `.edu-card`. Never invent honors; render only what is there.
- **Contact**: email and LinkedIn, nothing more. Optional.
- **Theme toggle**: a sun/moon button top-right. It switches light and dark; the layout does not change.
- **Hidden résumé view**: `#resume-view`. It is invisible on screen. It is rendered at runtime from `resume` for the résumé print path (see "Resume view - field mapping").
- **Export and share controls**: the template's **Save as PDF** button exports the **résumé**. It opens a chooser (`#export-modal`) for style, font, and fit, with a **hard readability floor: body text never drops below 10pt**. The portfolio-PDF chooser is **held back for the next release**: the live page IS the portfolio, and Cmd+P still prints it natively. **Share** opens a menu: Copy link, LinkedIn, X, WhatsApp, Email (`#share-menu`). These ship in the template. Your job is the content they depend on: the résumé view, the OG meta, and the share cards.

### Records you write

- A **CuratedPortfolio** node in the graph (see "How to choose what goes in").
- A **Document** node (`content_type: "portfolio"`) once the user likes the result (see "Hand-off: recommend publishing").
- Dated lines in `user-story.md` (see "The notebook: user-story.md").

### The one résumé

The résumé view in this folder is the source of the user's one résumé: `applications/_common/resume.pdf`. See the one-résumé rule in "Rules for this skill". Make the PDF with one command, run from the hunt folder:

```bash
python3 "$PLUGIN_ROOT/scripts/export_resume_pdf.py" <portfolio-folder> --out applications/_common/resume.pdf
```

**Check:** the summary line it prints shows 1 or 2 pages and 0 bullets over two lines. If not, shorten the bullets it lists (in `data.js`, `resume.experience[].bullets`, keeping every true claim) and run it again.

Fallback, if the script exits 2 (no Chrome, or an older portfolio): open `index.html`, click **Save as PDF**, pick the style, and save the file as `applications/_common/resume.pdf`.

## Steps

Follow these in order. Each step points to a section below for the details.

1. **Ask before you build.** Ask the questions in "Questions to ask before you build": the target, the look, the optional apps (and the social posts, if they add the Social Feed), and the traveler. Use `AskUserQuestion` (voice-guide rule #6). When regenerating, honor the app and traveler choices already recorded on this portfolio's `CuratedPortfolio` instead of re-asking.
   **Check:** you have an answer for the target, the look, the apps, and the traveler, each from the user or from the recorded `CuratedPortfolio`.
2. **Choose what goes in.** Follow "How to choose what goes in". Create (or update) the `CuratedPortfolio` node with the included Experiences, Skills, and Projects, and record `show_summary`, `show_social`, and `timeline_traveler` on it.
   **Check:** the `CuratedPortfolio` node exists and records all three choices.
3. **Bake the headshot.** Follow "Bake the headshot into data.js": find a photo, resize it to about 480px, and base64-encode it.
   **Check:** you have a `data:image/jpeg;base64,…` string for `identity.photo`, or there is no photo and `identity.photo` will be absent or `null`.
4. **Build the folder.** Follow "The build contract" steps 1 to 5: write `data.js`, copy `portfolio.css` and `portfolio.js` verbatim, stamp the shell `index.html`, and make both share cards. Add the alternates and the design dock if the user picked all six looks. Write every line of copy by "Writing the portfolio copy".
   **Check:** `ls <portfolio-folder>/` shows `index.html`, `portfolio.css`, `portfolio.js`, `data.js`, `share-card.html`, and `share-card-square.html` (plus the alternates, `template-utils.js`, and `switcher.js` if picked).
5. **Clean and verify.** Follow "Clean and verify before saving": strip the authoring comments, run every grep, check the anchor pairing, and run both verifiers.
   **Check:** every grep returns zero matches, and both verifier tables show PASS. If `python3` or Chrome is missing, you checked by eye and told the user plainly what could not be verified.
6. **Make the one résumé.** Follow "The one résumé" under "What you make": run `export_resume_pdf.py` so `applications/_common/resume.pdf` exists. If the user keeps their own résumé file there and does not want it replaced, skip this step and say so. **Check:** the script's summary line shows 1 or 2 pages and 0 bullets over two lines.
7. **Show it.** Follow "Show it, then hand over the keys": give the path to the folder's `index.html`, say how to open it, and point out Share and Save as PDF.
   **Check:** your reply contains the exact path to `index.html`.
8. **Ask "What's off?" and iterate.** Follow "Iteration loop". After each change, update the files and, if the curation changed, the `CuratedPortfolio`.
   **Check:** the user says nothing is off, or picks a next step.
9. **Hand off: recommend publishing.** Follow "Hand-off: recommend publishing": create the Document node, then offer `hope-publish` in one line.
   **Check:** the Document node is linked (`UPLOADED` from Person, `INCLUDES_DOCUMENT` from CuratedPortfolio), and you offered to publish once.
10. **Keep the notebook current.** Follow "The notebook: user-story.md": one dated line in "The journey so far", any decision worth keeping in "Decisions", and a fresh "Now".
   **Check:** `user-story.md` has today's dated line.

When the user comes back later to change the portfolio or publish it again, follow "Coming back: update or re-publish".

## Questions to ask before you build

### How every question is asked

- Every question this skill asks follows **voice-guide rule #6, "Choices, not blanks"**. It goes through the **`AskUserQuestion` tool**, never typed inline as prose. Give 2 to 4 selectable options, exactly one marked "(recommended)" with a one-clause reason, and the tool's built-in "enter your own answer" as the free-text option.
- Per the rule, **weighty or personal questions also carry a final "💬 Chat about this first" option.** Picking it means Hope talks it through before deciding. It adds to the free-text option; it does not replace it. In this skill that means the Overview opt-in, the traveler picker, and the update menu (see "Coming back: update or re-publish"). The "What's off?" checklist has no chat option: it is a scannable checklist, and a chat option just adds noise there.
- **This binds improvised questions too.** A clarification, a quick check, anything you are about to ask as free prose: stop and reformat it as an `AskUserQuestion` menu (or a plain yes/no). Free-prose questions do not exist in Hope's voice.
- **Show, then ask: the spotlight.** When a question is about something visual and there is a viewable copy (the local preview from "Show it, then hand over the keys", or the live link), point first. Hand the page URL with `#spotlight=<key>` added, and say in plain words what will glow: "open this; the part glowing at the bottom is what I'm asking about". Then ask the menu. The keys (the list lives in the template's `portfolio.js`): `timeline` · `highlights` · `share` · `pdf` · `photo` · `summary` · `experience` · `skills` · `education` · `certifications` · `projects` · `social`. The hash works over `file://`, the local server, and the published link alike, and it clears itself once the glow plays. On a first-ever generation there is nothing to point at yet, so plain words carry the question alone.

### 1. The target

If the user named a target job, just confirm: "Generating a portfolio targeted at {company} for {role}. The angle I'm taking is {angle in one sentence}. Continue?" (A plain yes/no confirm IS rule-#6 compliant. Do not pad it with fake options.)

If there is no target, ask as a choice:

> Should this portfolio aim somewhere specific?
> 1. **General portfolio of your strongest work** (recommended: you can always tailor a copy when a specific role shows up)
> 2. **Tailored to a role you have in mind**: name the company or role and I'll angle everything at it
>
> Or tell me in your own words.

If the answer is "general", offer the constraint question as choices instead of leaving it blank:

> Anything to feature or play down? For example:
> 1. **Keep the balance as-is** (recommended: I'll order by strength of evidence)
> 2. **Push the consulting/freelance work forward**
> 3. **Pull the older roles back**: lead with recent work
>
> Or tell me in your own words. These are just sparks.

### 2. The look (always asked, never assumed)

The look of their portfolio is one of the most personal calls in the whole hunt. Our first users taught us this by coming back with their own designs. Before generating, show them where to browse: "have a look at agenthope.ai/styles: all six looks, previewable across nine very different careers". Then ask. This question carries the 💬 option, because it is personal:

> Which look should your portfolio lead with?
> 1. **Standard, with all six looks + the design dock included** (recommended: you keep every option and can flip anytime, offline too)
> 2. **Standard only**: the lean folder, one signature look
> 3. **One of the alternates leading**: Editorial, Swiss Minimal, Terminal, Warm Refined, or Executive. Tell me which, and I'll hand you its direct link to share
> 4. 💬 Chat about this first: tell me the vibe you're after and I'll point at the closest look
>
> Or tell me in your own words.

Never present the six looks with rankings or "best for your field" labels. Show them all with equal weight, and let taste decide (the mechanics are in "The look is the user's choice"). If they describe a vibe in their own words ("something print-like", "dark and technical"), map it honestly to the closest design, and *say which one you picked and why* so they can veto it.

### 3. The optional apps (ask once per portfolio)

Every portfolio always carries the core sections: Experience, Skills, Education & Certifications, Projects. On top of those, Hope has **optional apps** the user chooses. Do not decide for them. Offer the ones that apply as **one multi-select** (`AskUserQuestion`, `multiSelect: true`; the tool's "enter your own answer" is the free-text option), and recommend the ones that fit. This is a catalog: today the optional apps are **Overview** and **Social Feed**, and future apps join the same pick-list.

Offer **Overview** only if `Person.headline_stats` is non-empty. Offer **Social Feed** always. If neither applies (no stats, and nothing to feature), skip the question and ship the core.

> Your portfolio always shows your Experience, Skills, Education, and Projects. Want to add either of these?
> - **Overview** (recommended): a highlights panel up top, your proudest numbers and a line of interests, the first thing a recruiter sees
> - **Social Feed**: your recent posts (LinkedIn, Instagram, YouTube, Dribbble, …) shown live on the page, so your work shows itself
>
> Pick any, both, or neither, or tell me in your own words.

Record each pick on the CuratedPortfolio node as `"show_summary": true|false` and `"show_social": true|false`. These are per-portfolio presentation choices: do not re-ask while iterating on the same portfolio, and honor an existing decision on regeneration (see "Updating an existing portfolio").

- **If Overview is picked:** render it per "Overview app - field mapping". Set `overview.show: true` in `data.js` (the recorded `CuratedPortfolio.show_summary` decision maps to it), with non-empty `overview.headline_stats`. Stats are curated by the human, never auto-summed. When it is off, set `overview.show: false` (or omit the object). The renderer then emits no Overview tile or pane: zero residue. With no `headline_stats` and no `interests`, the app is not offered and `overview.show` stays false. When Overview is on, also ask what to feature (see "Featured board").
- **If Social Feed is picked:** gather the posts (next) and write them to `data.js` as `window.HOPE_DATA.social`, per "Social Feed app - field mapping". When it is off, leave `social` as `[]` or omit the key. The `social.length > 0` gate keeps the tile and pane out: zero residue.

Show before asking when there is a viewable copy. Hand `<preview-url>#spotlight=highlights` (Overview) or `#spotlight=social` (Social Feed) first ("the part glowing is the app I mean"), then the menu. On a first-ever portfolio, the plain words carry it alone.

#### Social Feed: gather the posts (browser-assisted)

When the user adds the Social Feed, do not make them hunt for embed codes. Offer the least-effort path and let them say yes:

> Great. For the Social Feed, how should I get your posts?
> 1. **Paste the links** (recommended: fastest). Drop the post URLs you want featured (LinkedIn, Instagram, YouTube, Dribbble, Behance, TikTok, X, Vimeo, Spotify, a personal site…) and I'll add each one
> 2. **Pull them for you**: give me your handles or profile URLs and I'll read your recent public posts in the browser and pick the strongest
> 3. **💬 Chat about which to feature first**
>
> Or tell me in your own words.

- **The browser pull (option 2) is read-only, on URLs the user names.** It is the same guardrail as onboarding's LinkedIn-via-browser (see `references/computer-use-guardrails.md`). Visit only the profile or handle URLs the user gives, read public posts, and pull out the permalinks. Never log in as them or act on their behalf. Open any linkedin.com page in the browser they signed into, never with a plain web fetch (hard rule 2). No browser available → fall back to paste.
- This "offer to fetch, don't make them hunt" pattern is general. Any app that needs live outside content can reuse it (GitHub pins, a personal site, …).
- Keep the feed **curated: 4 to 8 strong posts beat a wall.** Write each post as `{ platform, url, title?, caption?, pinned? }`. The platform list, and how the renderer turns a url into an embed, are in "Social Feed app - field mapping".

**Disclose the trade-off in plain words before shipping a Social Feed.** It is the one app that is not fully self-contained: "One thing about the Social Feed: it shows live posts from those sites, so it needs your published link and a connection to display them. Opened offline, or if a post is later deleted, each one falls back to a clickable link. Your page never breaks; it just shows the link instead of the live post." Never say the words "embed", "iframe", "oEmbed", or "script" to the user.

### 4. The traveler (ask once per portfolio)

The Throughline's playhead carries a glyph, the traveler, and it is the user's to choose. If this CuratedPortfolio has no recorded `timeline_traveler` yet, ask at generation:

> The moving timeline at the bottom of your page has a little character that travels along it as your career plays. Who should yours be?
> 1. **The glow dot** (recommended: calm, classic, lets the work do the talking)
> 2. **One of the kept seven**: paper plane, car, train, sailboat, bicycle, rocket, footprints
> 3. **Find one that's me**: I'll suggest a few from what I know you love, and go get it
> 4. **Make me one**: I'll draw you a tiny original
> 5. **💬 Chat about this first**: we'll talk about what fits before deciding
>
> Or tell me in your own words.

Point before asking when you can. With a viewable copy up (an earlier generation, or the live link), hand `<preview-url>#spotlight=timeline` first ("the strip glowing at the bottom is the timeline I mean"), then the menu. On a first-ever portfolio, the plain description above carries it.

- **3. Find one.** Suggest candidates from `Person.interests`: a trail runner hears footprints first, a sailor the sailboat, or something better off the shelf. When it is not in the bundled seven, fetch it with the same announce → fetch → cache → inline steps as "Icons for links - bundled first, fetched when missing". The brand-icon law applies: monochrome single-path, `viewBox="0 0 24 24"`, `fill="currentColor"` (`design-tokens.md` §6).
- **4. Make one.** Draw a tiny single-path SVG by hand to the same law, save it to the project's `career-graph/assets/icons/`, and inline it.

Whatever they pick goes into `data.js` as `window.HOPE_DATA.traveler` (see "The Throughline - timeline data contract"). It is also recorded on the CuratedPortfolio node as `"timeline_traveler"`. Like `show_summary`, it is a per-portfolio presentation choice: do not re-ask while iterating, and honor it on regeneration without re-asking (see "Updating an existing portfolio").

Then go on to step 2 in "Steps": build it, show them, iterate.

## How to choose what goes in

Read the user's career graph. If a target job is named (`hope make portfolio for Anthropic`), find the JobPosting node and:

1. Work out which Skills the Job `REQUIRES_SKILL` and which the Person `HAS_SKILL`.
2. Pick the Experiences and Projects whose `USED_SKILL` and `APPLIED_SKILL` edges overlap most with the Job's required skills.
3. Order them: most relevant first, most recent second, most metric-heavy third.
4. Aim for **density, not completeness.** Three superb cards beat seven okay cards.

If no target job is named, generate a **general portfolio** of the user's strongest work overall.

Either way, **create a CuratedPortfolio node** in the graph that links to the included Experiences, Skills, and Projects. Record on it the user's app-catalog decisions as `"show_summary": true|false` and `"show_social": true|false`, and their traveler choice as `"timeline_traveler"`. These are per-portfolio presentation choices, not Person facts. This way the user's graph remembers which curation went out for which role.

### Length

Most portfolios should fit in 2 to 3 screens of vertical scroll on desktop. A long scroll with twelve roles and twenty projects defeats the point. If the user's career is large, curate harder.

## Writing the portfolio copy

**Hope never invents a fact about the user.** Every line you write (a bullet, a grade, a plan, a claim) must trace back to the career file or the user's own words in this chat. A claim you cannot source is a claim you do not make. This is a stated promise on Hope's site, and every skill keeps it.

You are not writing a résumé. You are writing **a designerly statement of work** in Hope's voice.

Each Experience card should:

- Open with a specific moment or problem, not a job summary.
- Show what changed because of the user's action (with a metric).
- Avoid "responsible for" language. Show, don't tell.
- Run 60 to 120 words per card, no longer.

Example:

❌ "Senior Product Designer at Figma. Responsible for design system, mentoring junior designers, leading cross-functional initiatives."

✅ "When Figma's design system started fragmenting across product teams in 2023, I led the consolidation. Eight months in, 37% of company surface area was unified on the new system, and onboarding time for new designers dropped from three weeks to one. The hard part wasn't the components. It was getting twelve product teams to agree on one button."

The user can edit, but the first draft should feel like Hope wrote it.

## The build contract

### Build contract (runtime data-driven)

The portfolio is **not** built by filling tokens into static markup. You write **one** structured dataset, and the shipped `portfolio.js` renders the entire visible `<body>` from it at runtime. The new template has no `{{…}}` content tokens and no `<!-- HOPE:*_loop -->` markers; `window.HOPE_DATA` replaced them. Follow these steps in order:

1. **Curate from the graph** (per "How to choose what goes in"): identity, overview, experience (grouped IC/Leadership, in the role-progression shape), projects, skills (by category, level 1–4 + years), education, certifications, resume (bullets with an appended `tag`; Education = degrees only), timeline, social, and a per-section `confidence` map.
2. **Write `data.js`** = `window.HOPE_DATA = {…}`. It is ONE global, the complete dataset for the whole page (the template's `data.js` authoring contract is the `window.HOPE_DATA` schema). **Semantic values only, NO hex** (`category:"programming"`, `level:4`, `confidence.band:"high"`; `portfolio.js` resolves these to `var(--token)` at render). The **photo is baked** in as a `data:` URL in `identity.photo`.
3. **Copy `portfolio.css` and `portfolio.js` into the output folder verbatim.** `portfolio.css` already carries the 15 seg-tier / cat / integrity tokens the renderer resolves to. `portfolio.js` is the runtime renderer. Neither is ever edited per portfolio. **Do not deviate from the design tokens** in `$PLUGIN_ROOT/references/design-tokens.md` (read in "Before you start").
4. **Stamp the shell `index.html`** from the same `meta` you put in `data.js`, in one pass. `data.js` is the single source of truth; the head and body are stamped FROM it:
   - **Head:** `name`/`headline`/`og_description` → `<title>` + `description` + `og:*`/`twitter:*`; `share_url` → `hope:share-url` + `<link rel="canonical">`; `generation_date` + the enriched ProfilePage JSON-LD (`description`/`url`/`image`/`sameAs`); `target_company` → title suffix.
   - **Body:** the static `.seo-fallback` block: `name` / `headline` / `summary_short`.
   - **Leave `og:url` / `og:image` / `twitter:image` empty** (`content=""`) for the publish skill to stamp. No `{{…}}` left anywhere.
5. **Make both share-card pages** (`share-card.html`, `share-card-square.html`) from the same `meta` / `identity` / `overview.headline_stats` (see "Share cards and link-preview meta").
6. **Strip the template-authoring comments**, then grep for **zero** `{{` and **zero** `<!-- HOPE:` across every file.
7. **Grep for zero raw hex** across ALL four files, including `data.js` and `portfolio.js`. The whole point of semantic-only data is that color lives in `var(--token)`. A hex literal anywhere is a token-purity bug.
8. **Grep for zero external icon URLs.** The favicon `onerror` Google-favicon `src` is the one allowed exception (see "Icons for links - bundled first, fetched when missing").
9. **Verify the anchor pairing:** every `timeline[].anchor` resolves to a card the renderer will produce: `id="tl-{id}"`, found in the array whose name matches `timeline[].pane`.
10. **Run the verifiers:** `verify_portfolio_structure.py` (headless-render mode) + `verify_portfolio_pdf.py --modes resume-classic` (see "Clean and verify before saving").

The per-section contracts below are **field-mapping references**. They name which `window.HOPE_DATA` field drives which part of the page, and they defer to the template's `data.js` authoring contract (the `window.HOPE_DATA` schema) for field types and optionality. They are not substitution tables: you write data, not markup.

### The look is the user's choice: offer it, never assume it

Hope ships **six designs**. Real users have real taste: our first users came back wanting their *own* look, not the one we picked for them. The template folder carries them all:

- **Standard** (`index.html` + runtime renderer): the flagship, with every feature (résumé export, share menu, social feed, print modes). It is always the folder's entry page.
- **Five alternates**: `01-editorial.html` · `02-swiss-minimal.html` · `03-terminal.html` · `04-warm-refined.html` · `05-executive.html`. Each is a complete visual re-rendering that reads the same `data.js` at runtime. Each is self-contained, but needs `template-utils.js` beside it.
- **The design dock** (`switcher.js`): a floating switcher that lets the user flip between all six looks plus light/dark, on any page of the folder.

Ask for the look with the design question (in "Questions to ask before you build"), then follow the answer exactly:

- **All six + the dock (the recommended default):** copy the five alternate pages + `template-utils.js` + `switcher.js` into the output folder alongside the Standard files. Add `<script src="switcher.js"></script>` at the end of `index.html`'s body (copy how the alternates include it). The user can flip looks anytime, offline, and keeps every option. The alternates ship **verbatim except** the `<title>`/OG-title, which you personalize the same way the agenthope.ai demos do.
- **Standard only:** the lean folder: the four named files plus the share cards, no dock.
- **If the user falls in love with one alternate** and wants *it* to lead: the entry page stays `index.html`, because Standard carries the résumé, share, and print machinery. The alternate is one click away on the dock, and its direct link (for example `<site>/01-editorial.html`) can be shared on its own. Offer that link as the one they put in their bio. Never rename an alternate to `index.html`: the dock navigates by filename and would break.

Point them at the live gallery before they choose: **agenthope.ai/styles**, all six looks, each previewable across nine very different careers.

### Reuse shipped patterns first

**Grep `portfolio.css` before you write any new CSS or markup.** Search for the pattern that already exists and reuse it: responsive grids (`grep -nE 'auto-fit|auto-fill|grid-template' portfolio.css`), card shells (`.item-card`, `.edu-card`), chips (`.skill-chip`), pills, hex KPIs. `portfolio.css` ships **verbatim**, so custom CSS has nowhere clean to live. A hand-rolled rule (for example a fixed `grid-template-columns: 1fr 1fr` that never collapses on a phone) is a **bug, not a shortcut**. The shipped patterns are the only way to stay consistent and responsive. "Reuse the existing pattern" is a required check before you write, not a preference.

### Rich education and certification cards

A degree or certification with **honors or an achievement that is actually in the career file** gets a **rich card**. One without stays **basic**. Both ship in `portfolio.css`. Choose per entry, and never invent content to fill a richer card.

**Basic** (no achievements): logo + credential + institution + dates, one row. This is the default. Most certifications are basic:

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

**Rich** (has honors or achievements): add `rich`, wrap the header in `.edu-head`, and add an `.edu-body` with achievement bullets. Optionally add an `HONORS` pill in the `.title-row`, and the skills the entry proved as `.skill-chip`s:

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

Rules:

- The `HONORS` pill appears **only** when the entry is truly an honor (scholarship, distinction, award). Omit it otherwise.
- Achievement bullets come straight from the entry's `notes`/achievements in the career file. Bold the one phrase that matters most.
- Skill chips only for skills the entry actually proved, with `data-cat` matching the Skills section's categories.
- When an entry has nothing beyond credential, school, and date, the basic card is correct. Do not pad it.

### Projects - field mapping (item-cards, not tiles)

The Projects pane uses the **same collapsible `.item-card` structure as Experience**. Projects carry real content (`description`, `tagline`, `impact`, a full `skills` list), and a tile would throw all of it away. `portfolio.js`'s `renderProjects` builds **one `.item-card.project` per entry in the `projects` array**. You write the array (per the `projects[]` shape in the template's `data.js` authoring contract), not the markup.

What each `projects[]` field drives (see the `data.js` authoring contract for types, optionality, and the full page contract):

| `projects[]` field | Drives | Notes |
|---|---|---|
| `name` | `.role-title` (and `img alt`) | The project's name: the card title. |
| `tagline` | `.role-company` | One-line framing of the project. |
| `dates` | `.role-dates` | Optional. The renderer **omits the whole `<span class="role-dates">` when absent** (no empty span). |
| `is_active` | `.active-pill` | "Active" pill for in-progress or ongoing projects; dropped otherwise. |
| `domain` / `initial` | `.org-logo` favicon + `.org-fallback` | With a host: the Google favicon + lettermark fallback. With no domain: a bare `.org-fallback` letter. |
| `best_metric` | `.contrib-pill` | Optional headline metric (for example `1.2k stars`); pill omitted when absent. |
| `description` | `.contrib-action` | The project's full description: the body's lead paragraph. |
| `impact` | `.contrib-impact` | The impact or outcome line; block omitted when absent. |
| `skills[]` (`{name, category}`) | `.contrib-skills` `.skill-chip`s | One chip per `SkillRef`. `category` → `data-cat` (CSS owns the color, same category map as Experience). `[]` → block omitted. |
| `link` (`{url, label}`) | `.project-link-row` → `.project-link` | Optional external link; row omitted when absent. |

The renderer leaves **every** project card **collapsed** by default. It reuses Experience's `.item-card[data-expand] .item-head` markup, so card-expand and the "Projects" section filter work with no extra wiring. The `.project` class drives the cyan accent via CSS. There is no project tile, hero gradient, or metric tag.

### Skills section - radar axes (optional)

Above the by-category level-bar list, the Skills pane can open with a **competency radar**: a spider chart of **5 to 8 broad competency DOMAINS** of the person's own craft. Examples: a chef's *Modernist Cuisine · Garde Manger · Menu Development · Kitchen Leadership · Cost Control*; an AI engineer's *Machine Learning · Software Development · Data Engineering*. It shows the **shape** of who they are at a glance; the category list below stays as the detail. You write it as `skills.radar` (see the `data.js` authoring contract). **Omit it when there is no clear domain story.** The section then falls back to the list alone. A radar needs at least 3 axes to draw.

**This works for EVERY profession** (chef, nurse, electrician, teacher, founder), because every serious field has a recognized competency framework that a hiring manager already trusts. **Your job is to find that field's vocabulary, never to invent one.**

Run this each time:

1. **Work out the field and seniority** from the person's experiences and skills (for example "ICU charge nurse", "residential plumber / shop owner", "AI-leaning product lead").
2. **Web-search that field's recognized competency framework** and name the axes from it. If a field is not listed below, search `"{profession}" competency framework OR certification exam domains {current year}`. Anchors:
   - Chef → **ACF** (Master/Executive Chef domains) · Physician → **ACGME** six core competencies + specialty milestones · Nurse → **AACN Essentials / QSEN** · Skilled trades (plumber, electrician) → **NCCER** / DOL apprenticeship / licensing-exam domains · Teacher → **InTASC / Danielson / NGSS** · Software → **SFIA** · Product → **SVPG** · Design → recognized UX/visual-design competency models · Nonprofit → **CNP / CFRE** · Public sector → **OECD DGPF / UK DDaT**.
3. **Pick 5 to 8 axes at one level**: broad competency AREAS of that craft. **Not** micro-skills ("knife sharpening", "Python"), and **not** vague traits ("hard-working"). Use **Title Case, 4 words or fewer**, instantly clear to a hiring manager **in that field**. **Never let tech or office vocabulary leak onto a non-tech person.** A plumber's radar reads like a plumbing supervisor wrote it.
4. **Score each axis 1 to 4** (`level`'s scale: 1 foundational … 4 master), from the person's evidence. **Aim for a T-shape:** 1 or 2 *deep* core-craft axes at 4, the rest at 2 or 3. **Never ship an all-4s radar.** A filled blob carries no signal; even a master has relative strengths. An axis needs **at least 2 pieces of evidence** to qualify. If fewer than 5 axes clear that bar, **ship 4 clean axes. Never pad or invent.**
5. **Tag what is in demand (optional, never blocking):** web-search `LinkedIn "Skills on the Rise" {current year}`. Use the **actual current year**: the list is re-published every year. Set `inDemand: true` on matching axes. This only adds an accent. **Never rename or drop a core axis just because it is not trending.**

`score` is a 1 to 4 shape input. It is **never a percentage and never shown as a verdict**. Semantic values only: **no hex, no color** in `data.js`.

### Promotion or tenure within one company

A role progression at one employer ("Associate Analyst → Business Analyst at Nova Healthcare") is common. Render it with the built-in structure, not a hand-patched one-off. There are two shapes; pick by the work:

- **One card, progression in the title** (default): use this when the two roles share one continuous story and metric set. The title reads "Associate Analyst → Business Analyst", `.role-company` is the org, and `.role-dates` spans the whole tenure (earliest start → latest end), with one timeline entry and one `tl-` id. This is cleanest when the promotion is really "same thread, bigger scope."
- **Two cards, same org**: use this when each role earned its own distinct contributions. Two `.item-card`s share the `.role-company` and org logo, and each has its own dates, `tl-` id, and timeline entry. They sort **newest-first** like any other cards (the structural check enforces it: the later role leads), so the progression reads top-down on its own.

Either way, do not invent ad-hoc "Promoted" pills or custom markup. Use the shipped `.item-card` structure and let date order carry the story.

### Overview app - field mapping (opt-in, zero residue)

The old standalone `#summary-band` between the identity card and the section grid is **gone**. Its content (the hex-stat row + interests row) now lives in an **Overview app** inside the section grid. `portfolio.js`'s `renderOverview` builds it from the `overview` object. The renderer produces two pieces:

- **Tile**: `<button class="section-btn" data-section="overview">`, labeled "Overview", Material Symbols icon `insights`, meta-count line "`{n} highlights`" (`n` = `overview.headline_stats.length`).
- **Pane**: `<div class="section-pane" data-pane="overview" id="pane-overview">`, placed **first** among the panes. Inside, the band's content classes are unchanged (`.summary-stats` / `.summary-stat` / `.stat-value` / `.stat-label` / `.summary-interests`), so the premium styling carries over: a KPI row of up to 4 large hex badges, and a quiet interests line of neutral pill chips. The pane's inner panel keeps the 32×32 grid texture.

The template owns the look, and it is token-driven. Your job is the `overview` data.

**Render gate:** `overview.show` is the **only master gate** (it replaces the old `show_summary`). When `overview.show` is `true`, `overview.headline_stats` MUST be non-empty. An empty stats list with `show:true` is invalid; set `show:false` instead. When `overview.show` is `false` or absent, the renderer emits **no Overview tile, no pane, and no TOC entry** (zero residue), and the app that opens by default falls back to Experience.

**Default-open:** on load, the active app is **Overview when the pane exists, else Experience**. `portfolio.js` sets the first present pane active as it builds (there is no static `active` fallback in the shell). Do not fight that start-up logic.

What each `overview` field drives (see the `data.js` authoring contract for types and limits):

| `overview` field | Drives | Notes |
|---|---|---|
| `headline_stats[].icon` | `.summary-stat.hex-kpi` icon | Material Symbols name, for example `rocket_launch`, `payments`, `groups`, `public`. |
| `headline_stats[].value` | `.stat-value` | The hero number, for example `$2M+`: bold sans over the label. Max **4** stats. |
| `headline_stats[].label` | `.stat-label` | Short, for example `client pipeline`: mono uppercase, muted. |
| `interests[]` | `.summary-interests` neutral `.skill-chip`s | Truly personal (typography, trail running), not skill keywords. Max **6**. **When `interests` is `[]`, the renderer omits `.summary-interests` entirely** (the CSS `:has()` auto-hide needs the element absent; never emit it empty). |

Stats are **curated by the human, never auto-summed.** Metrics are of different kinds, so do not invent, add up, or derive them from other graph nodes.

**The template owns print behavior, but do not break it.** The Overview pane prints **first** among the panes (DOM order), and the print TOC carries a **conditional Overview entry**. The TOC chips' numbers are CSS counters, not a fixed 01–05, so the numbering adjusts itself when Overview is absent. Every **résumé** print mode still hides all of it. Never copy stats or interests into `#resume-view`.

### The Throughline - timeline data contract

The template owns the Throughline strip itself: the rail, hex nodes, playhead, and pause/hover/click/print behavior (`portfolio.css` + `portfolio.js`, styled with tokens per `design-tokens.md`). **You generate what it reads:** the `timeline` and `traveler` keys of `window.HOPE_DATA` in `data.js`. These keys keep their exact earlier contract. They are a subset of the unified dataset and did not change when the renderer moved to runtime. The only change is that their `anchor`/`id` now point at cards that `portfolio.js` itself renders (still `id="tl-{id}"`).

**`timeline`**: an **ordered, chronological array**, one entry per Experience, Education, Project, and Certification included in the portfolio:

| Field | Contract |
|---|---|
| `id` | Stable slug, unique in the array. It also names the entry's anchor (below). |
| `type` | `experience` \| `education` \| `project` \| `certification`. Drives the node's token color (the template owns it; colors are tokens per `design-tokens.md`, never restate hex values). |
| `date_start` / `date_end` | `YYYY-MM` strings (the template's parser format; full ISO `YYYY-MM-DD` is also accepted, day ignored). They place the node on the rail in proportion. `date_end: null` = ongoing (renders the emerald edge). |
| `label` | Short phrase, **≤40 chars** (see the label rules below). |
| `org` | Organization name, or `null`. |
| `domain` | Hostname for the favicon, or `null`. |
| `metric` | ONE short line (the entry's strongest number), or `null`. |
| `skills` | ≤4 strings. The hover mini-card renders them as `.skill-chip`s. |
| `pane` | `"experience"` \| `"education"` \| `"projects"` \| `"certifications"`: the section-grid pane a click opens. |
| `anchor` | The DOM id of the entry's card (`tl-{id}`) that the renderer will produce. |

**Anchors: the renderer derives every card id from your data.** `portfolio.js` gives each card it builds a stable `id="tl-{id}"`, taken from the `id` of the matching entry in the section array (the experience, projects, education, or certifications entry whose `id` equals the timeline entry's `id`). Your job is **consistency across arrays**. Each `timeline[]` entry's `id` and `pane` must match exactly one entry in the array named by `pane`. The join key is `pane`, plural (`experience`/`projects`/`education`/`certifications`), not `type`, singular. Click-to-navigate opens the pane, scrolls to the anchor, and highlights the card. A timeline `anchor` with no matching array entry is a dead click. Verify the pairing before saving (see "Clean and verify before saving").

**Label rules.** Labels float above the playhead in small type and must scan in under a second:

- **Short phrases, never sentences.** "Senior Product Designer @ Figma", not "Worked as a Senior Product Designer at Figma where I…".
- **Voice: specific, not generic.** "Unified Figma's design system" beats "Design work". It is the same specificity bar as the cards, squeezed to ≤40 chars.

**`traveler`**: the playhead glyph the user chose (see "4. The traveler" in "Questions to ask before you build"):

- `"dot"`: the default soft-orange glow dot.
- `"<slug>"`: one of the bundled travelers in `$PLUGIN_ROOT/assets/icons/travelers/` (`paper-plane`, `car`, `train`, `sailboat`, `bicycle`, `rocket`, `footprints`).
- `{"inline": "<svg…>"}`: a found or hand-made glyph, which **you inline at generation**.

**No picker UI ships in the artifact.** Choosing happens in chat; the artifact just renders the choice.

**`timeline_ridge` (opt-in, default off)**: a top-level boolean next to `timeline`. **Leave it out for the default flat Throughline.** The nodes ride one clean baseline, which reads cleanest for most careers. Set `timeline_ridge: true` to draw the **density "mountain ridge"** outline as a **static backdrop behind the flat nodes**: busy eras rise, quiet stretches stay near the baseline. The nodes do **not** move. The ridge sits behind them, styled with tokens per `design-tokens.md` (no hex). It suits careers with clearly clustered seasons. A single-thread career renders near-flat even when it is on, so omit it there. Omitting the key (or setting `false`) gives output byte-identical to the flat default.

### Social Feed app - field mapping (opt-in, live embeds)

The Social Feed is an **optional app** (offered in the app catalog; see "3. The optional apps" in "Questions to ask before you build"). Like every section now, it is **built entirely at runtime**. `portfolio.js`'s `renderSocial` builds both pieces from the `social` array:

- **Tile**: `<button class="section-btn" data-section="social">`, labeled "Social", Material Symbols icon `rss_feed`, meta-count line "`{n} posts`" / "`1 post`" (the renderer picks the plural from `social.length`). No integrity bar: a curated feed carries no confidence score.
- **Pane**: `<div class="section-pane" data-pane="social" id="pane-social">`, placed **after** the Projects pane (before `#resume-view`). It contains an empty `<div class="social-grid" id="social-grid"></div>`. The existing social engine then fills the cards from `window.HOPE_DATA.social`, the same way it renders the Throughline from `window.HOPE_DATA.timeline`.

**Render gate:** the gate is **`Array.isArray(social) && social.length > 0`** (it replaces the old `show_social` flag; it is worked out at render, with no separate boolean). When the user did not add the Social Feed, leave `social` as `[]` or omit the key. The renderer then emits **no Social tile and no pane**: zero residue.

**Posts are not career events.** They carry **no `tl-` id** and never appear on the Throughline. The structural check `verify_portfolio_structure.py` only checks `tl-` carded cards, so the social pane is correctly outside its scope.

**What you write:** the `social` array in `data.js`, one object per post. It keeps its exact earlier contract; the field-by-field shape is stated once in the template's `data.js` comment. Per post:

| Field | Contract |
|---|---|
| `platform` | One of these. **Post or video embed (iframe):** `youtube` `vimeo` `spotify` `soundcloud` `applemusic` `figma` `codepen` `loom` `bluesky` `linkedin` `substack` `flickr`. **Post embed (script):** `tiktok` `instagram` `x` `threads` `pinterest`. **Profile-only (always a profile card):** `dribbble` `behance` `medium` `gist` `link`. `link` = a generic profile card (globe) for any URL. The URL decides the template: a *post or video* URL on an embed platform → embed card; a *profile or channel* URL → profile card. Note: **Behance** and **Medium** have embed endpoints but are not yet proven to render reliably in a real browser (a headless render is not proof). So they stay profile-only until confirmed. Only promote a platform to an embed once it is verified rendering in a real browser. |
| `url` | The public permalink. The renderer builds the embed from it. **You never write embed HTML.** |
| `title` | Optional label for the always-present "View on …" link (defaults to "View on {platform}"). |
| `caption` | Optional: one short line shown above the embed. |
| `pinned` | Optional boolean. It promotes an **embeddable** post (a video or embeddable post) to the Overview's "Latest from" (max 2 embeds). It is ignored on profile or link socials: those always go to the **headline contact row** as app-name pills, never the Overview. |

**Every caption and title MUST describe the REAL post.** A recruiter reads the `caption` (and any `title` you set) as the truth about that post. It is also the **only** thing shown when an embed cannot paint, which is the routine case for Instagram and X without a token: the card falls back to chip + caption + "View on …". So **check it against the actual post** before you write it. Read the post (browser pull) or have the user confirm it, and write a caption that matches what is actually there. **Never make up a caption, and never carry one over from another post or an old draft.** A caption that does not match the post is worse than none. When you cannot confirm what a post says, **omit `caption` entirely or keep it generic** ("Latest on LinkedIn") instead of guessing. This is the same don't-assert-what-you-can't-verify rule that governs every fact on the page.

**How it renders: two templates, and you pick per the user's content** (the template owns them; do not reinvent them). `portfolio.js` turns each post into **one of two cards**:

- an **embed card**: a live `<iframe>`, or the platform's `<blockquote>` + async script, when the URL is a specific embeddable **post or video**;
- a **designed, brand-colored profile card**: a chip in the platform's color + name + caption + handle + an arrow, when the URL is a **profile, channel, or site** (or when an embed cannot be resolved).

**There are NO bland link cards.** The renderer picks automatically: an embeddable post or video URL becomes an embed, and anything else becomes a profile card. So **Hope chooses the template by choosing the URL.** Give a *post or video* link to embed the work itself. Give a *profile, channel, or site* link for a branded tile that links out. Pick per the user's need: a designer's Dribbble and Behance are profiles (tiles); a talk is a video (embed). The embed card also carries a quiet "View on …" link as the offline fallback (embeds need the published `https` site and a connection). The grid is **masonry** (CSS columns): short and tall cards pack with no dead space, and it is responsive with no media query. Brand colors and glyphs for every platform live in the renderer's `B` map. An unknown platform gets a lettermark chip + the generic globe.

**Platform fit by field** (suggest, don't impose): designers → Behance, Figma, Dribbble, Instagram, CodePen · developers → GitHub Gist, CodePen, X, YouTube · marketers → LinkedIn, X, Instagram, TikTok, YouTube · writers → Medium, Substack, X, Threads, Bluesky · video → YouTube, Vimeo, TikTok, Loom · music → Spotify, SoundCloud, Apple Music · photographers → Instagram, Flickr. **LinkedIn** only embeds posts the author marked embeddable. **X** is the least reliable (its widget degrades). When a platform will not embed, its branded profile card still works. Never block on an embed.

**Print and résumé:** embeds never print. `@media print` hides `.social-embed` and shows the link list only. `#resume-view` carries no social content.

### Featured board: surface the best of any section in the Overview

The Overview is not a fixed panel. It is a **curated board the user fills** to make the strongest first screen. Like everything Hope does, it is a **recommendation the user re-picks** (or overrides, or forks: it is their MIT file). Beyond the stat row and interests, two opt-in strips render inside the Overview pane. `portfolio.js` builds both, and both stay **hidden until filled: zero residue**.

- **"Latest from"**: up to **2 promoted EMBED socials** (a video, an embeddable post; **never** a profile or link card). Mark them with **`pinned: true`** on an *embeddable* social post (`window.HOPE_DATA.social`). The renderer shows the pinned **embeds** (max 2) here as live cards, plus a **"See all →"** link to the full Social pane. **Profile and link socials (Dribbble, Behance, a personal site, a channel page…) never render here.** The renderer puts them in the **headline contact row** as app-name pills, so a short link card can never stretch beside a tall embed and leave a gap.
- **"Highlights"**: featured **work items**: a standout **project**, a key **experience**, a **degree (education)**, a **certification**. *Any* timeline entry works. Mark them with **`featured: true`** on the timeline entry (`window.HOPE_DATA.timeline`). Each renders as a compact card. Its chip is the **org logo** (favicon from the entry's `domain`; the type icon is the fallback only when there is no domain), and a click **jumps to its full entry** (opens the pane, scrolls, pulses). The kicker and accent follow the type palette (project = cyan, experience = slate, education = violet, certification = amber).

**Ask what to feature: recommend a default, and let them re-pick** (voice-guide rule #6, `AskUserQuestion`). When the Overview is on:

> Your Overview is the first screen a recruiter sees. What should it feature up top? I'll suggest a strong default. Change any of it.
> - your 2 best **social** profiles/posts
> - a standout **project**
> - a key **role**
> - a **degree or certification** worth surfacing
>
> Or tell me in your own words, or "just pick for me." (It's all a recommendation; you can change everything later.)

Record the picks on the CuratedPortfolio so they are remembered and not re-asked while iterating.

**Compose to fill: no gaping holes.** This is a design rule, not a layout hack. "Latest from" is **embeds-only** now: the renderer sends every profile or link social to the headline, so the tall-embed-beside-short-link gap cannot happen. The instinct still applies to the **whole** Overview: balance the strips, fill the space, and leave no empty area. The recruiter should never land on a hole.

### Resume view - field mapping

The shell carries an empty `<div id="resume-view" hidden>` as a **direct child of `.wrap`**. It never renders on screen (`#resume-view{display:none}`). It exists only for the print path: when the user picks **Resume** in the export chooser, `body.print-doc-resume` hides the portfolio panes and shows this view instead. `portfolio.js`'s `renderResumeView` fills it at runtime from the `resume` object. A blank `resume` block in `data.js` silently prints a blank résumé, so **write the `resume` data on every generation.**

What each `resume` field drives (see the `data.js` authoring contract for the full shape):

| `resume` field | Drives | Notes |
|---|---|---|
| `meta.name` / `meta.headline` | `.resume-header` h1 / `.resume-headline` | Same values as the identity card. |
| `contact_line_parts` | `.resume-contact` line | The renderer joins the parts with ` · `, only the fields present: location (text), **email as the address itself, mailto-linked**, phone (plain text), links (**worded anchors** like `<a href="…">LinkedIn</a>`, never raw URLs), and a **Portfolio anchor injected from the stamped head `share_url`** when published (NOT from `meta.site_url`). No links-as-icons. |
| `summary` | `.resume-summary` | 2 to 3 tight sentences in résumé register: factual and scannable, not Hope's designerly portfolio voice. |
| `experience[]` (`{role_title, company, dates, bullets:[{text, tag}]}`) | one `.resume-entry` per role | **2 to 4 bullets per role**, metric-led. Each bullet renders `<li>{esc(text)} <strong>{esc(tag)}</strong></li>`. The `tag` is a **short metric chip ADDED at the end of the bullet**, escaped separately and joined on. It is **not** a substring inside the text, bolded in place. Exactly ONE `<strong>` per `<li>` (ATS rule). A missing `tag` logs a WARNING, and the renderer emits an unbolded `<li>`. |
| `education[]` (`{degree_line, institution, dates}`) | one `.resume-entry` per **degree** | **Degrees only. Certifications are NOT folded into résumé Education.** |
| `skills_line` | `.resume-skills` | Top **10 to 14 skills, comma-joined**, strongest-evidenced and most market-demanded first. |

**ATS rules: non-negotiable inside `#resume-view`.** Real text only. Standard section headings (Experience, Education, Skills). Semantic markup: real `<h1>`/`<h2>` and `<ul><li>`. **No tables, no images or icons, no icon fonts, no text rendered as graphics.** Recruiters' parsers must be able to read every word.

**Why these rules hold across every system, and what not to break.** The big applicant-tracking systems (Workday, Greenhouse, Taleo, iCIMS) each parse résumés their own way. The résumé view's rules above (real text, standard section headings, no icon fonts) are exactly the overlap that survives all of them. The template meets them by construction, so your job during generation is to not break them. Concretely:

- Keep the standard reverse-chronological shape with the literal headings "Experience", "Education", "Skills". They parse everywhere; a creative rename defeats section detection.
- Write dates in one consistent `Month YYYY` format across every entry.
- Keep company name and role title on their own lines. `role_title` and `company` are separate fields for a reason; never fold the company into the title string.
- Never add tables, multi-column layout, or text-in-images anywhere in the résumé path.

Do not claim or assume anything about a specific system's internals beyond these widely documented parsing basics. This floor is the contract.

### Icons for links - bundled first, fetched when missing

Contact-row and share-menu links carry **monochrome single-path inline SVG** brand marks (Simple-Icons-style, `viewBox="0 0 24 24"`, `fill="currentColor"`). They are sized to match the Material Symbols they sit beside (contact row ~13–14px, share menu ~14px). Because they use `currentColor`, they take their parent's color and follow the theme on their own: the LinkedIn link stays `--accent-cyan` per the design tokens, other contact items `--text-secondary`, and share-menu items keep their existing color. **Never full-color brand logos, never icon fonts, never external `<img>`/`url()` icon loads.** Icons are **inlined**, so the portfolio stays self-contained.

**Bundled set first.** Match each contact or site link by hostname, and inline the bundled SVG from `$PLUGIN_ROOT/assets/icons/brands/<slug>.svg` directly into the markup:

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

**Unknown platform → announce, fetch, cache, inline.** When a link's hostname is a known brand with no bundled icon (for example `gitlab.com`, `mastodon.social`), say one line ("grabbing the <site> icon"). Fetch the monochrome SVG from `https://cdn.simpleicons.org/<slug>` (slug = the brand name, lowercase). On success, **cache a copy** to the project's `career-graph/assets/icons/` AND inline it into the HTML. On failure, fall back to `globe.svg` silently. Either way, the fetch happens at generation time only. **The generated folder never references a network icon URL.**

**The résumé view gets no icons.** `#resume-view` never gets icons: real text and worded anchors only, per the ATS rules in "Resume view - field mapping". (The renderer's `brandSvg(kind)` emits the contact-row brand marks at runtime from each `identity.links[].kind`. Bundled or fetched SVGs are inlined into `portfolio.js`'s registry, never referenced as network URLs.)

## Bake the headshot into data.js

The published portfolio must **already contain the user's photo**. The template still ships a client-side upload widget, but it only lives in *this* browser's `localStorage`. It never reaches the published file, so a published site with no baked-in photo shows recruiters an empty upload box. Fix that by baking the photo as a `data:` URL into `identity.photo` in `data.js` when you generate. `renderIdentity` reads it at runtime and adds `.has-photo` only when it is present.

**1. Find a headshot in the user's project folder.** Look for the obvious names first, then any image the user points you at:

```bash
# From the user's project folder (your cwd). Pick the first match.
find . -maxdepth 2 -type f \( \
    -iname 'headshot.*' -o -iname 'photo.*' -o -iname 'profile.*' \
    -o -iname 'avatar.*' -o -iname 'me.*' \
  \) \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
  -print 2>/dev/null | head -5
```

If the user named a specific file ("use `~/Pictures/jane.jpg`"), use that path instead. If you find more than one candidate, ask which to use instead of guessing. List them as numbered choices (voice-guide rule #6), and recommend the one that looks most like a headshot.

**2. Resize to ~480px and base64-encode it.** Keep the file small so the HTML stays portable. On macOS use `sips` (always present); otherwise fall back to Python/PIL:

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

**3. Bake it into `data.js`.** Set `identity.photo` to the `data:image/jpeg;base64,…` string. At runtime `renderIdentity` renders `.photo-upload.has-photo` with the baked image in `#photo-preview` and hides the "add a photo" prompt. The same `data:` URL also feeds the share cards. Reuse it; do not re-encode.

**4. No photo found? Omit it.** If there is no headshot and the user does not point you at one, leave `identity.photo` absent or `null`. `renderIdentity` then shows the dashed "Photo" upload box (no `.has-photo`), exactly as before. The no-photo case must not break. When you invite a photo at hand-over, ask a plain yes/no ("want your photo in before this goes out?"), and point instead of describing: hand `<preview-url>#spotlight=photo` and say "the glowing box is where your photo goes; drop an image in this folder and I'll bake it in."

Either way, the localStorage "change your photo" widget stays in the file as a fallback the user can use after publishing.

## Clean and verify before saving

Before saving the user's files, clean and verify the output:

- **Strip the template-authoring comments.** That means the template doc-comment block in `index.html` (it points at this skill's build contract) AND the `window.HOPE_DATA` authoring-contract comment in `data.js`. They document the template for *you*; they must not ship in the user's portfolio. Keep the disclosed credit comments (the "Provenance" block: share-url, generator) and the head theme-init and JSON-LD. Those are intentional.
- **"Generated" means all of it.** The full folder per "What you make": the static SEO-stamped shell `index.html` (head + `.seo-fallback` with real `name`/`headline`/`summary_short`, no content markup); `portfolio.css` and `portfolio.js` carried over **verbatim**; `data.js` with the **complete `window.HOPE_DATA`** (meta + confidence, identity with baked photo, overview, experience, projects, skills, education, certifications, resume, timeline, traveler, social); plus **`share-card.html` and `share-card-square.html`** (see "Share cards and link-preview meta"). A run that produces only `index.html`, or a `data.js` missing any section the user curated, is incomplete.
- **Verify zero tokens remain.** Grep **every file in the generated folder** (all four named files AND both share cards) for `{{` and `<!-- HOPE:`. Require **zero matches**. The new template has no content tokens or loop markers, so these greps come back empty by construction. Any hit means a stray template comment survived, or you hand-edited markup you should not have. Also confirm the shell `index.html` carries the `.seo-fallback` block with a **real** `name`/`headline` (not a placeholder), and that the head SEO metas (canonical, description, og:*, twitter:*, JSON-LD with description/url/sameAs) carry real values.
- **Verify zero raw hex across ALL four files**, including `data.js` and `portfolio.js`. `data.js` carries semantic values only (`category`, `level`, `confidence.band`). `portfolio.js` resolves every color to `var(--token)` / `color-mix(… 20% transparent)` / `currentColor`. A hex literal anywhere is a token-purity bug: fix it before saving. This is the #1 risk of the runtime model.
- **Verify the anchor pairing.** Every `timeline[].anchor` must resolve to a card the renderer will produce: an `id="tl-{id}"` from the entry in the array named by that timeline entry's `pane` (`experience`/`projects`/`education`/`certifications`). The join key is `pane` (plural), never `type` (singular). A timeline anchor with no matching array entry is a dead click on the rail. Fix both directions before saving.
- **Verify structure: order, placement, agreement (headless render).** `data.js` and the rendered pane cards are **two views of one chronology** and must not drift. The timeline array is chronological (ascending, left→right on the rail). The cards in each pane run **reverse-chronological (newest first)**. Both must reference the same items. **Derive both from one date-sorted dataset; never order them by hand separately** (that is how a promotion ends up shown oldest-first). When `python3` is available, run `python3 "$PLUGIN_ROOT/scripts/verify_portfolio_structure.py" <portfolio-folder>/`. It loads the shell + `data.js` + `portfolio.js` in **headless Chrome**, dumps the RENDERED DOM, and checks: **agreement** (every timeline entry ↔ its rendered `tl-` card), **containment** (each card in its declared pane), **order** (each pane newest-first), the `overview.show`/`social.length` ⇔ pane-presence gates, the direct-child rules, and **head↔data SEO parity**. Read the PASS/FAIL table and fix every FAIL before saving. A regex check on the raw HTML would PASS with nothing checked, because the shell body is empty until `portfolio.js` runs. The headless render is what actually validates the page. If `python3` or Chrome is not available, check by eye: open the page, read each pane top to bottom, and confirm the dates descend and no card sits in the wrong pane.
- **Verify zero external icon URLs.** Grep **every file in the saved folder** for `simpleicons` and `cdn.simpleicons.org` (for example `grep -rnE 'simpleicons|cdn\.simpleicons\.org' <portfolio-folder>/`) and require **zero matches**. Per "Icons for links - bundled first, fetched when missing", any CDN fetch happens at generation time, and the SVG lands inline in `portfolio.js`'s registry. The only allowed network reference is the favicon `onerror` Google-favicon `src`.
- **Verify the PDF export: produce it and look, don't assume.** After generating, print one résumé PDF and check it. When `python3` is available, run the bundled checker. It drives headless Chrome (so `portfolio.js` runs and `renderResumeView` fills `#resume-view`), and checks that `#resume-view` has `.resume-entry` children before printing: `python3 "$PLUGIN_ROOT/scripts/verify_portfolio_pdf.py" <portfolio-folder>/ --modes resume-classic`. Read its PASS/FAIL table and fix any FAIL before handing the folder over. If `python3` is not available, say so plainly instead of claiming the export was verified.

## Share cards and link-preview meta

Make these alongside the portfolio. A bare URL pasted into LinkedIn, X, or WhatsApp shows a rich card only when the page's OG meta points at a real image. **You make the content and the image sources; the publish skill stamps the URLs and takes the screenshots.** The split of work:

**1. `meta.og_description`.** `index.html`'s `og:description` and `twitter:description` are **stamped from `meta.og_description`** into the static SEO shell's `<head>` (no `{{tokens}}`; see the `index.html` entry in "What you make"). Write a **1 to 2 sentence third-person hook** drawn from the summary: recruiter-facing, specific, no hype. ("Product designer who unified Figma's design system across twelve teams", not "Visionary design leader passionate about impact.") The OG/Twitter title is stamped from `meta.name` / `meta.headline` in the template's exact form: the name, a space, the template's em-dash separator, a space, then the headline. Copy that separator character from the template's `og:title`; do not swap it for a hyphen. `verify_portfolio_structure.py` checks the exact string. **Leave `og:url`, `og:image`, and `twitter:image` with `content=""` exactly as the template ships them.** The publish skill stamps absolute URLs once it knows `SITE_URL`.

**2. Make two share-card pages in the portfolio folder, next to `index.html`.** Use exactly these names; the publish skill looks for them:

- `share-card.html`: fixed **1200×630** (the OG link-preview size).
- `share-card-square.html`: fixed **1080×1080** (the Instagram / WhatsApp avatar version).

Both are **stamped at build time, NOT built at runtime from data**. They are fixed-pixel, single-shot, and never interactive, so they **do not depend on `portfolio.js` / `data.js` load timing** inside a headless screenshot. Stamp them from the **same `meta` / `identity` / `overview.headline_stats` source as `data.js`**, in the same pass:

- the **baked headshot** if you have one (`identity.photo`, the same `data:` URL as the portfolio);
- the user's **name** (`meta.name`) and **headline** (`meta.headline`);
- up to **3 hero metric badges** (the first three of `overview.headline_stats`, each as `value` + `label`);
- the **live URL in mono at the bottom** (the real URL is stamped at publish time; showing the expected URL is fine).

No `{{tokens}}` left, and **no raw hex**. Reuse the same `var(--token)` colors the portfolio uses, **or** an inlined fixed-pixel `<style>`. These pages are screenshotted, so an inline `<style>` is acceptable and **separate from the four-file portfolio law**. (They never ship in the published site; the four-file allow-list + 2 PNGs is unchanged.) Lock the body to the pixel size with `overflow: hidden` and **no scrollbars**. The publish skill screenshots these pages 1:1 with headless Chrome into `og-image.png` / `og-image-square.png`, so a stray scrollbar or overflowing element ships straight into the recruiter's link preview.

You do **not** take the screenshots. That is the publish skill's step: it needs `SITE_URL` first, and it degrades gracefully if Chrome is missing. Your job ends at two pixel-exact HTML files that render correctly at their fixed sizes.

## Credit and attribution

Every Hope portfolio carries one **visible** credit. It is never hidden and never enforced:

- A **"Generated with Hope"** footer linking to the project.
- A `<meta name="generator">` tag and an **enriched** schema.org **ProfilePage** JSON-LD block in `<head>`. They are machine-readable, so recruiters, ATS, and search can read the portfolio. This serves the user's discoverability, not Hope. Stamp it from `meta` in the same pass that writes `data.js`. The `Person` carries `name`, `jobTitle` (← `headline`), `description` (← `og_description`), `url` (← `share_url`/canonical), `sameAs` (← `identity.links[].url`), `image` (← the published og-image, stamped at publish), and `dateCreated` (← `generation_date`, kept as an ISO date). Escape `name` / `headline` / `description` for valid JSON.

There is **no hidden marker, no signature, no telemetry, nothing that phones home.** Hope is a free gift, given in good faith. The footer is the whole attribution story. It is the user's file under MIT, so they *can* remove it, but the template asks them warmly to keep it, so the next person finds Hope too. If a user asks to remove it, help them; do not lecture. Trust is the point.

## Iteration loop

After the first generation, **always ask "What's off?"** Do not ask "do you like it?": that is a yes/no trap, and "what's off" invites correction. It is an open, narrative question, so per voice-guide rule #6 the options are **example prompts** that spark the user's own answer. There is no "(recommended)" pick, because there is no right answer to what is bothering them:

> What's off? Pick anything that itches:
> 1. **Voice**: too cold, too warm, too salesy somewhere
> 2. **Featured work**: wrong roles or projects up front
> 3. **Order**: sections or cards in the wrong sequence
> 4. **Length**: too much scroll, or too thin
> 5. **Theme**: light vs. dark default
> 6. **Phrasing**: a specific line in a card reads wrong
>
> Tell me the number, or open <preview-url>#spotlight=highlights to see each part glow first (swap `highlights` for `timeline`, `summary`, `experience`, `skills`, `projects`, `share`, or `pdf`).
>
> Or tell me in your own words.

Update the artifact. Update the CuratedPortfolio in the graph if the curation changed (including a changed `show_summary` or `timeline_traveler` decision).

**Filling a gap? Re-read the source documents first.** When something is missing (a role, an internship, an early job, a date, a whole early-career stretch), go back to the user's **original source documents** (uploaded PDFs, the résumé, a LinkedIn export) *before* searching any generated or derived file. The true history is the **input, not the output**. A LinkedIn export or résumé often holds whole roles and schooling that the rendered HTML never captured. Hunting through `data.js` or the generated markup for facts the source already states wastes turns and invents gaps that are not real. Start with the richest source: the same instinct onboarding uses, carried into iteration.

## Show it, then hand over the keys

The portfolio is the payoff. Do not just save a file and move on: **present it.** Preview it the reliable way, in this order. Stop at the first one that works for the user's setup:

1. **Render it in the viewer. This is the main path.** Save the folder (item 2), then put **the folder's `index.html` path** in the chat as the deliverable, so the Claude app's **preview pane renders it inline**. Clicking an HTML path in the chat opens it in the built-in preview: no local server, no macOS permission prompts, no working-directory traps. This is the most reliable path. Reach for it first, and you are usually done.
2. **Hand over the path: always the folder's `index.html`.** Save the folder to `career-graph/documents/portfolios/portfolio-<slug>-<date>/` and tell them the exact path to its `index.html` in plain words. That is the file they open; the other files come along with it.
3. **Open it in a full browser: lead with the one-line server.** Tell them warmly, something like: "The reliable way on a Mac: in Terminal, run `cd <folder> && python3 -m http.server 8000`, then open http://localhost:8000. That's it. Double-clicking `index.html` usually works too. But if the page comes up unstyled (plain black text, no cream background), that's macOS quietly blocking the browser from reading the folder's CSS and JS files. Use the server line instead, and hard-refresh (Cmd+Shift+R). Once it's published, the live URL just works, everywhere." That unstyled-page failure is real (macOS TCC can block Chrome from reading sibling files over `file://` inside `~/Documents`). So the server line leads, and double-click stays the alternative.
4. **Only if Claude itself must run the server for them:** **never run `python -m http.server` from a `~/Documents`, `~/Desktop`, or `~/Downloads` working directory.** On macOS those folders sit behind the TCC sandbox. A process Claude spawns cannot read them even when Claude itself can, and a pyenv-shimmed `python` also fails because it calls `getcwd()` on an unreadable directory. Instead, **copy the whole folder into a temp folder** (never a lone `index.html`: the CSS, JS, and data files must travel with it), **`chdir` there first, then serve with a pinned system Python:**

   ```bash
   TMP="$(mktemp -d)"
   cp -R "<absolute-path-to-portfolio-folder>" "$TMP/portfolio"   # the WHOLE folder - siblings included
   cd "$TMP"                     # chdir FIRST so getcwd() never touches a TCC folder
   /usr/bin/python3 -m http.server --bind 127.0.0.1 --directory "$TMP" 8080
   # → http://127.0.0.1:8080/portfolio/index.html
   ```

   Use `/usr/bin/python3` (the system interpreter), not a bare `python` or `python3` that may be a pyenv shim. Pin `--directory` to the absolute temp path. Never serve from the user's project folder under `~/Documents`.
5. **Point out Share and Save as PDF.** The portfolio has a **Share** button that opens a small share menu: **Copy link · LinkedIn · X · WhatsApp · Email**. The social links go live once published, and Copy keeps its "Copied!" feedback. It also has a **Save as PDF** button that exports the **résumé**: a chooser for style (classic / modern / compact), font, and fit, with a **hard readability floor: body text never drops below 10pt**. The portfolio-PDF chooser is held back for the next release: the live page IS the portfolio, and **Cmd+P still prints it natively**. Tell the user plainly: "Save as PDF gives you a résumé that application systems read perfectly. Pick a style, font, and fit; the text never gets too small to read. The page itself is your portfolio: share the link, or Cmd+P to print it." Their last choice is remembered for next time. Name both buttons so the user knows they are there.

## Hand-off: recommend publishing

The moment they like it, lead them to put it online. That is what turns a file on their disk into a link a recruiter can open.

1. Create a Document node (`content_type: "portfolio"`), linked via `UPLOADED` from Person and `INCLUDES_DOCUMENT` from CuratedPortfolio.
2. Recommend publishing warmly, as the default next step, and **carry the load yourself:**
   > "This is yours. Want me to put it online as your GitHub portfolio, one link you can drop in any application? I'll handle all the setup."

   Route to `hope-publish`. It is built so the user never has to make a technical decision: it sets things up if needed and does the work.
3. If they would rather wait, respect it. Let them sit with it. Recommend; never pressure.

## Coming back: update or re-publish

### Closing the loop

Once the portfolio is live (or any time the user returns), there is exactly one loop to offer. Keep them inside it. Number the options per voice-guide rule #6, with no "(recommended)": both paths are equally right, depending on where they are.

> Where are we picking up?
> 1. **Update your portfolio**: feature different work, change the angle, edit a card
> 2. **Publish the changes** you've made. I'll push them live
>
> Or tell me in your own words.

- Want to change what is in it? That is an update. Open the update menu (next), then route back to `hope-publish` to push the result.
- Happy with it and just want it online (or re-published after edits)? Route to `hope-publish`.

That is the whole flow: collect their story → show the portfolio → put it online → update or re-publish on demand. Do not point them anywhere outside this loop.

### The update menu (always start here)

When the user asks to update (any phrasing counts: "update my portfolio", "change my portfolio", "refresh it", or picking option 1 above), **never guess what kind of update they mean. Always open with this menu.** It has six options, more than rule #6's usual four. The checklist exception applies: this is a scannable list of update *types*, not one weighed decision.

First read the live Hope version **at runtime**. `<LIVE>` is never hardcoded into prose; it always comes from the installed plugin's manifest:

```bash
LIVE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$PLUGIN_ROOT/plugin.json" 2>/dev/null \
  || jq -r .version "$PLUGIN_ROOT/plugin.json" 2>/dev/null \
  || grep -m1 '"version"' "$PLUGIN_ROOT/plugin.json" | grep -oE '[0-9]+(\.[0-9]+)+')"
```

Then ask, filling in `<LIVE>`:

> What are we updating?
> 1. My story changed: new role, achievement, or project (recommended when something's new)
> 2. The look: theme, photo, layout choices
> 3. What's featured: different work up front, target a specific role
> 4. Update to the latest Hope release (v<LIVE>): pick up new features
> 5. Check for all updates: I'll compare everything and propose the lot
> 6. 💬 Chat about it first: tell me what's on your mind.

**What each option does:**

- **1. My story changed.** Capture the new facts into the career graph first (new Experience, contribution, Project, or metric nodes, in the user's words, backed by evidence). Then regenerate per "Updating an existing portfolio".
- **2. The look.** Theme default, a new headshot (re-run the bake steps), and layout choices the template exposes. Then regenerate. Design tokens stay locked: "the look" never means new CSS.
- **3. What's featured.** Re-curate: re-run "How to choose what goes in" (optionally against a newly named target role), update the CuratedPortfolio node, and regenerate.
- **4. Latest Hope release.** Run the stale-session check (see "Stale-session check"). If this chat is already running v<LIVE>, say so plainly ("you're on the newest Hope, nothing to pick up"). Regenerate only if their newest portfolio file is older than the current template's features.
- **5. Check for all updates.** Compare everything, then propose the lot in one message, and let them pick what to act on:
  1. **Graph changes since the last generation:** anything added or edited in the graph after the newest portfolio file's date (the CuratedPortfolio node records what went out, and when).
  2. **Plugin version:** this skill's version marker vs `<LIVE>` (the stale-session check).
  3. **Republish staleness:** compare the local portfolio folder's newest file-modified time against `published_at` in `.publish.json` (hope-publish stamps it on every publish, including re-publishes). Local file newer → the live link is behind the local copy. No `.publish.json` → never published. No `published_at` in it → published by an older Hope; just say "worth a republish to be safe."
- **6. Chat about it first.** No checklist and no regeneration yet. Talk through what is on their mind (voice-guide rule #6's chat option), then land on whichever option fits.

### Updating an existing portfolio

Options 1 to 3 (and any updates the user accepts from option 5) land here. **Regenerating from the user's existing graph against the current bundled template is THE update path.** Never patch old files in place. New template features (like the Overview app, the Throughline, and the published-mode gates) flow into the regenerated folder automatically. Re-publishing via `hope-publish` then re-stages the files and re-stamps the published flag, so updates keep working release after release. Honor the existing `CuratedPortfolio.show_summary` and `timeline_traveler` decisions without re-asking.

Keep one distinction straight: **the local folder is the owner's editable copy. Its `index.html` never carries `data-hope-mode="published"`. The published copy is the one the publish skill stamps read-only (the stamp lives on `index.html`'s `<html>` tag).**

## Stale-session check

Is this chat running an older Hope? This file carries a version marker near the top (the `hope-skill-version` comment). It names the Hope this chat loaded. The live version is whatever `$PLUGIN_ROOT/plugin.json` says **right now** (the `<LIVE>` one-liner in "The update menu"). Run the comparison whenever the user picks option 4 or 5 of the update menu.

When `plugin.json` is **newer** than the marker, this conversation loaded an older Hope. A newer release is installed, but a running chat cannot pick it up mid-flight. Output exactly this structure:

1. A bold heading: **Recommendation: start a fresh chat to get the newest Hope (v<LIVE>)**
2. Comfort in simple English, no jargon: "Nothing will be lost. Everything we've built lives in this folder: your career file, your portfolio, your notes. A new chat just picks up the newest Hope and reads them right back."
3. A handoff. Define the word naturally the first time you use it: a "handoff" is just that baton-pass summary; explain it once, and then it is theirs. Introduce it gently: "Here's a short summary to paste into the new chat so it knows exactly where we left off. Think of it as passing the baton:". Then give a compact block (10 lines or fewer) covering **who they are, what exists in the folder, what was in progress, and the next step**. When `user-story.md` exists, build it from that file per `$PLUGIN_ROOT/references/user-story-guide.md` § "How the handoff summary is derived": one line from "Who <name> is", the journey checked against the actual files, and "Now" for what is in progress and the next step. No story file yet? Build the same four parts from the graph and this conversation.

When the versions match, no fuss: "you're on the newest Hope (v<LIVE>)", and move on.

When the marker is **newer** than `plugin.json` (a dev or unsynced build: the manifest was not bumped with the skill), treat the chat as up to date, with no handoff. Flag it to the maintainer in one line: the skill marker and the manifest version disagree and need the sync protocol.

## The notebook: user-story.md

`user-story.md` lives in the project folder beside `career-graph/`. It is the user's human-readable memory, defined in `$PLUGIN_ROOT/references/user-story-guide.md` (point to it; do not restate it). **Read it at skill start when it exists.** It is two pages, the cheapest context in the folder, and it sets the vocabulary level, the pacing, and what never to re-ask. This skill touches it at two moments, following the guide's habits: dated entries, journey newest-first, groom on every touch, tell the user in one line, and never write anything the user would be surprised to find.

- **Journey line: portfolio generated or updated.** After saving the files, append one dated line to "The journey so far" (for example `- 10 Jun 2026: Portfolio v2 tailored for <company>, platform work up front.`). Record any decision worth keeping in "Decisions" (a `show_summary` choice and why, a curation angle). Rewrite "Now" so the next session, or the baton-pass handoff, picks up cleanly.
- **"Remember this" asides.** When the user says "remember this" (or anything close) mid-flow, write it into "## Remember this" **the same turn**, dated and tagged "(you asked me to remember this)". Then return to the portfolio work.

If the file does not exist yet, create it per the guide and announce it in exactly these words: "I keep a little notebook about how you like to work: `user-story.md`, yours to read or edit." It is the user's file: never committed, never published. The stale-session handoff above draws from it.

## Rules for this skill

### Hard rules this skill touches (from `$PLUGIN_ROOT/references/hard-rules.md`)

- **Never invent a fact** (rule 4). Every claim traces to the career file or the user's words in this chat. Not on file → ask.
- **Ask before removing a true claim or skill** from the résumé (rule 9). Removing a true claim is as bad as adding a false one. Missing from Hope's context is not missing from the user's record.
- **Confidentiality** (rule 8). No client names and no internal project names from the user's employer in the portfolio or résumé. Describe the work by what it does.
- **LinkedIn is read-only** (rule 2). Reading posts for the Social Feed is fine, in the browser the user signed into, never with a plain web fetch. Hope never posts, likes, follows, or messages.
- **Plain English** (rule 12) in everything the user reads, including portfolio and résumé text.
- **No em dashes** (rule 13) in anything that goes out in the user's name: portfolio text, résumé text, alt text, share-card text. The one exception is the title separator the template ships in `<title>`, `og:title`, and `twitter:title`. Keep it exactly as the template has it, because `verify_portfolio_structure.py` checks it.

### The one résumé

- Hope keeps **one** canonical résumé PDF at `applications/_common/resume.pdf`, exported from this portfolio's résumé view (Save as PDF).
- Every application uses that file, unless the user asks for a tailored cut for a specific role.
- Tailoring happens in the cover letter and the answers, not in the résumé. A keyword swap is allowed only when the keyword is missing from the résumé and true for the user, and only after it is shown as a table first (rule 15).
- Ask before removing any true claim or skill from the résumé. Removing a true claim is as bad as adding a false one.

### This skill's own rules

- The folder is self-contained: classic `<script src>` and `<link rel="stylesheet">` only. No `type="module"`, no `fetch()`, no `import`.
- `portfolio.css` and `portfolio.js` ship verbatim. Never edit them per portfolio. Before writing any CSS or markup, grep `portfolio.css` and reuse the shipped pattern.
- `data.js` holds semantic values only. Zero raw hex in any file.
- Stats are curated by the human, never auto-summed. Honors are never invented. Captions always describe the real post.
- Ask every question as choices through `AskUserQuestion` (voice-guide rule #6). Never ask in free prose.
- Never rename an alternate design to `index.html`.
- Update by regenerating from the graph against the current template. Never patch old files in place.
- The local `index.html` never carries `data-hope-mode="published"`. Only the publish skill stamps that, on the published copy.
- Never say "embed", "iframe", "oEmbed", or "script" to the user.

### What you do not do

- You do not generate generic portfolios. Every Hope portfolio is curated.
- You do not invent metrics or experiences. Every claim traces to a graph node.
- You do not use stock photos or stock language. The user's actual work is what is interesting.
- You do not go past 3 screens of vertical scroll without an explicit request from the user.
- You do not ship without the theme toggle (light default + dark).
- You do not ship without the structural signatures: the interactive section grid, the scanline + 32×32 grid texture, and hex KPIs.

## What to tell the user when you finish

Keep it short and warm, in this order:

1. **Where it is.** The exact path to the folder's `index.html`, shown so the preview pane renders it. Then the one-line server tip for a full browser (see "Show it, then hand over the keys").
2. **What it can do.** The **Share** button and the **Save as PDF** button, in the plain words from item 5 of "Show it, then hand over the keys".
3. **The one résumé.** Hope saved it at `applications/_common/resume.pdf`; it is the file every application uses. Save as PDF on the page makes a fresh one any time.
4. **What needs them.** Anything you could not verify (say plainly which check could not run), a missing photo (the plain yes/no ask), and the "What's off?" question.
5. **The notebook.** One line: the portfolio is noted in `user-story.md`.
6. **What comes next.** The one-line publish offer from "Next".

## Done when

The visual bar is the **visible** difference. The portfolio looks unmistakably like a Hope artifact: the layout and texture are the brand, and color is the theme.

### The look

- [ ] Light theme by default (warm cream and orange). Dark via the toggle, same layout.
- [ ] Interactive section grid: clicking a section filters the content below. The active tab is solid orange with a glow and an integrity bar.
- [ ] Hexagonal KPI badges (person / groups / monitoring) on each role.
- [ ] Contribution cards grouped IC vs Leadership. Skills grouped by category with a 4-bar level visual. Projects render as the same expandable Experience-style `.item-card`s (see "Projects - field mapping"), so each project's full story shows.
- [ ] LIVE pill inside the identity row, top-right.
- [ ] Scanline overlay on cards + 32×32 grid texture on the identity header + subtle glows. These textures are signatures: without them the design looks generic.
- [ ] Inter for text, JetBrains Mono for all metadata. Material Symbols Rounded with an inline-SVG fallback.
- [ ] Real org logos via Google Favicon, with a lettermark fallback.
- [ ] Self-contained at the folder level (see "What you make"). No required network calls except optional Google Fonts, which fall back to system fonts when blocked.
- [ ] It fits in 3 screens of vertical scroll on desktop or fewer (2 to 3 is typical), unless the user asked for more.

### The build

- [ ] The folder has all four named files and both share cards. `data.js` holds every section the user curated, and the résumé data is filled in.
- [ ] Zero `{{`, zero `<!-- HOPE:`, zero raw hex, and zero `simpleicons` matches across the folder.
- [ ] Every `timeline[].anchor` has a matching card.
- [ ] `verify_portfolio_structure.py` and `verify_portfolio_pdf.py --modes resume-classic` show PASS, or you told the user plainly which could not run.
- [ ] `og:url`, `og:image`, and `twitter:image` are still empty (`content=""`) for the publish skill.
- [ ] No em dashes in any user-facing text (portfolio copy, résumé, share cards, alt text), except the template's title separator.

### The records

- [ ] The `CuratedPortfolio` records the curation and `show_summary`, `show_social`, `timeline_traveler`.
- [ ] A Document node links the portfolio once the user likes it.
- [ ] `user-story.md` has today's dated line.

Hope's maker sends this same kind of portfolio and gets interview calls from it. It is the proof that Hope works. Hold the bar.

## Next

Usually `hope-publish`. Offer it in one line: "This is yours. Want me to put it online as your GitHub portfolio, one link you can drop in any application? I'll handle all the setup." If they would rather wait, respect it. When they come back to change it, start with the update menu in "Coming back: update or re-publish", then route to `hope-publish`.
