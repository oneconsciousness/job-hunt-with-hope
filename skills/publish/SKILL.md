---
name: hope-publish
description: Use when a user wants to put their generated portfolio on the web — get a shareable link, deploy it, host it, make it live. Trigger phrases include "publish my portfolio", "put my portfolio online", "deploy my portfolio", "host it", "give me a link to share", "make it live", "get it on the web", or any request to turn the local portfolio HTML into a public URL. A portfolio nobody can visit gets no interview calls — this is the step that makes the work reachable.
user-invocable: true
---

<!-- hope-skill-version: 1.2.0 -->

# Hope Publish · Presentation, completed

You are running Hope's publish step. The user has a generated portfolio sitting as a local folder. Your job is to get it onto a real, public URL they own — one link they can drop in any application — **and to carry the entire technical load yourself.**

**Who you're serving:** often someone who has never used GitHub, doesn't know what "a repo" is, and will get scared and quit if you ask a technical question. So you don't ask technical questions. You explain in plain words, pick sensible defaults, set up what's missing one gentle step at a time, and do the work. The **only** thing you ever ask is one simple, human yes/no before anything goes public.

## Locating bundled files (do this first)

This skill references a file that ships **inside the Hope plugin** (`references/computer-use-guardrails.md`) — it is **not** in the user's project folder. Your working directory is the user's job-hunt folder, so the plain relative path will not resolve. Resolve the plugin root once, then read the bundled file from there:

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

Read `$PLUGIN_ROOT/references/computer-use-guardrails.md` first. Publishing creates a **public** artifact — the confirm-before-irreversible discipline applies.

Also read `user-story.md` in the project folder if it exists (per `$PLUGIN_ROOT/references/user-story-guide.md`) — its "How they like to work" section tells you how technical this user is, which calibrates every word of the setup help below.

## What this skill outputs

- A **live, public URL** — the clean root `https://<login>.github.io/` by default (a sub-route only if the root was taken) — hosting the portfolio.
- A **publish record** at `.publish.json` (`{ host, owner, repo, url, branch, published_at }`) so re-publishing updates the same site instead of making a duplicate — `published_at` (ISO timestamp) is refreshed on EVERY publish, so the update-check in hope-portfolio can tell when the live site is behind the local file.
- The site lives in the **user's own account** — Hope hosts nothing and owns nothing. Data ownership, applied to hosting.

## HARD GUARDRAILS (these protect the user — never bypass)

1. **One simple confirm before going public.** Never run a deploy / `gh repo create` until the user has said yes to a plain-English "this will be public, ok?" (step 5). Public is irreversible in spirit — recruiters and crawlers cache it instantly. This is the one question you always ask.
2. **Publish an allowlist, never a whole directory.** The allowlist is **exactly four files**, copied from the portfolio folder to a clean staging dir — `index.html`, `portfolio.css`, `portfolio.js`, `data.js` — plus, in step 6c, **exactly two** generated share images (`og-image.png`, `og-image-square.png`). `career.json`, `user-story.md`, notes, drafts, the `share-card*.html` sources, and the rest of the job-hunt folder **never** leave the machine.
3. **Scan before you push.** Grep the staging dir for secret shapes before any deploy. Contact info in a portfolio is intentional — don't block on it.
4. **Set up *with* them, never *as* them.** If GitHub isn't ready, guide them through it warmly — they click the browser login; you can't and don't run `gh auth login` for them. Never silently auto-install global tools. And never cold-halt with a wall of commands — walk them through it like a patient friend, one step at a time.

## Don't quiz — decide

For a non-technical user, **make these calls yourself; do not ask:**

- **Host:** GitHub Pages. Always, by default.
- **Owner:** resolve it with `gh api user --jq .login` — **never** parse `gh auth status`, whose displayed label can be a stale/renamed account (e.g. it shows `arun98aol` while the real login is `oneconsciousness`, which would silently publish to the wrong `*.github.io`). If `gh` has **multiple** accounts logged in, that's the one case to confirm: "Publishing under your GitHub account **<login>** — right?"
- **Site at the ROOT, by default.** A recruiter-facing portfolio belongs at the clean root `https://<login>.github.io/`, not a sub-route. So default to the **user site** — a repo named **`<login>.github.io`** (GitHub serves it at the root domain). The *one* place you DON'T just decide silently is when that root is already taken — then you offer the user a choice rather than clobbering anything (step 3b).
- **Public vs private:** a portfolio is public *by design* — that's the whole point. Don't frame it as a choice; frame it as the goal ("so recruiters can see it").
- **Branch, Pages settings, build options:** never surface these. They're yours.

Read their dev-familiarity lightly — *"Have you used GitHub before?"* is fine — but **only** to decide how much to explain, never to gate or to hand them a decision.

## The flow

### 1. Locate the portfolio
Find the generated portfolio **folder** (default `career-graph/documents/portfolios/portfolio-*/` — a folder is a portfolio when it contains an `index.html`, i.e. match `portfolio-*/index.html`). If none exists, route to `hope-portfolio` first.

### 2. Stage a clean publish dir
Create `site/` and copy **only** the four allowlisted siblings from the portfolio folder (guardrail 2): `index.html`, `portfolio.css`, `portfolio.js`, `data.js` — same names, no renaming. As always, `career.json` and `user-story.md` **never** ship; neither do notes or drafts. The folder is self-contained, so this is exactly four copies.

### 3. Pre-flight — re-publish check, then setup
- If `.publish.json` exists → **re-publish**: reuse the recorded repo/URL, re-run step 6 (share-link + link-preview stamps, share images, published-mode stamp), then take step 7's re-publish path.
- Else (first publish): quietly check for `git`, `gh`, and `gh auth status`.
  - **All present** → say it simply ("Setup's good — I can put this online for you"), then scan + confirm.
  - **Something missing** → **Setup help** (below). Guide, don't dump.

### Setup help (when GitHub isn't ready)
Walk them through it warmly, **one step at a time**, in plain words. For a user with no GitHub:
> "To host your portfolio for free, you'll need a GitHub account — it's the standard free home for a page like this, about two minutes. Want me to walk you through it?"

Then, surfacing only the *next single step*:
- `gh` not installed → give the one install line for their OS, plainly ("paste this — it installs the GitHub helper").
- Login → have them run `gh auth login` and choose the browser option: "a browser window opens, sign in or make a free account, and you're done." You wait; you don't run it for them.
- `git config user.name/user.email` unset → set it with their details (or sensible values from their graph).

**Never show the whole technical sequence at once** — that's what scares people. One step, then the next.

### 3b. Pick the site — root by default, with a graceful fallback
Default to the **user site** so the portfolio sits at the clean root. Check if that repo is free:
```bash
gh api "repos/<login>/<login>.github.io" --jq '.name + " — " + (.description // "no description")' 2>/dev/null
```
- **Not found (free)** → use repo `<login>.github.io`. **SITE_URL = `https://<login>.github.io/`** (the clean root). This is the default — no need to ask.
- **It already exists** → don't clobber it silently. Show what's there and offer a choice — multiple choice, recommended option first (this is the only decision you hand the user here):
  > "Heads up — you already have a site at **`<login>.github.io`** ([show its description/repo]). Where should your portfolio go?
  >  **1. Update that site with your portfolio** *(recommended)* — keeps the clean link `https://<login>.github.io/`. This **replaces** what's there.
  >  **2. Use a separate page** — lives at `https://<login>.github.io/<name>-portfolio/`, and your existing site stays untouched.
  >  (Or name the web address yourself — tell me in your own words.)"
  - **Option 1** → repo `<login>.github.io`, **SITE_URL = root**, and the push **overwrites** the existing site — treat this as the irreversible case: step 5's confirm must spell out *"this replaces your current `<login>.github.io` site."*
  - **Option 2** → repo `<login>-portfolio` (auto-clean name), **SITE_URL = `https://<login>.github.io/<login>-portfolio/`**.

**SITE_URL rule — use this exact URL everywhere below (stamp, .publish.json, the confirm, the final link):** if the repo is `<login>.github.io` → `https://<login>.github.io/`; otherwise → `https://<login>.github.io/<repo>/`.

### 4. Secret / PII scan
Grep the staging dir for obvious secret patterns. If found, stop and show the user. Expected contact info → note it, continue.

### 5. The one question — a plain-English confirm
Not a technical card. A human sentence. Wait for yes:
> "I'm ready to put your portfolio on the web at **<url>**. It'll be public — that's the point, so recruiters can open it. Your career file and everything private stays on your computer. Shall I?"

That's the whole gate. No repo jargon, no file list unless they ask.

### 6. Stamp the live URL + build the share images (all of this *before* any push)

Every stamping sed in this step targets `site/index.html` **only** — `portfolio.css`, `portfolio.js`, and `data.js` ship verbatim, never sed-touched.

**a) The share link.** The portfolio's `index.html` carries an empty placeholder in its `<head>` (note it's self-closing):
```html
<meta name="hope:share-url" content="" />
```
The portfolio's **Share** button reads this tag: if `content` is set, it copies that canonical published URL; if empty, it falls back to `window.location.href`. So the live URL must be stamped into the file **before** it goes up — otherwise the Share button on the published page copies whatever address the visitor happens to be on, not the clean one you'd hand a recruiter.

The live URL is the **SITE_URL** you computed in step 3b (root for a user site, sub-route for a project repo) — deterministic, so you can stamp it now, no waiting on the build. Stamp it into **both** copies:

1. **The staged file** (`site/index.html`) — what actually gets pushed:
   ```bash
   sed -i '' -E 's|(<meta name="hope:share-url" content=")[^"]*(")|\1<SITE_URL>\2|' site/index.html
   ```
   (On Linux, `sed -i -E '...'` — drop the `''`.) The closing capture is just `(")`, not `(">)` — the tag is self-closing (`content="" />`), so anchoring on `">` would silently never match.
2. **The user's local saved copy** — the `index.html` inside the *one* portfolio folder you staged from in step 1. Resolve and reuse that exact path; do **not** glob `portfolio-*/index.html`, or you'll overwrite the Share link on other portfolios the user built for different targets/repos:
   ```bash
   sed -i '' -E 's|(<meta name="hope:share-url" content=")[^"]*(")|\1<SITE_URL>\2|' "<portfolio-folder-from-step-1>/index.html"
   ```

**b) The link-preview tags (`og:url`, `og:image`, `twitter:image`).** The same `<head>` carries empty Open Graph / Twitter placeholders — these are what make the link unfurl as a rich card when pasted on LinkedIn / X / WhatsApp, and the crawlers require **absolute** `https://` URLs (relative paths silently fail). Derive them from **SITE_URL** — it always ends in `/`, so plain concatenation works: `og:image` = `<SITE_URL>og-image.png`. Use the **same self-closing-safe sed pattern** as the share-url stamp — the closing capture is `(")`, never `(">)`:

```bash
# Note: og tags use property=, twitter tags use name=.
# og:url — always stamp:
sed -i '' -E 's|(<meta property="og:url" content=")[^"]*(")|\1<SITE_URL>\2|' site/index.html
# og:image + twitter:image — stamp ONLY if og-image.png actually landed in site/ (see c):
sed -i '' -E 's|(<meta property="og:image" content=")[^"]*(")|\1<SITE_URL>og-image.png\2|' site/index.html
sed -i '' -E 's|(<meta name="twitter:image" content=")[^"]*(")|\1<SITE_URL>og-image.png\2|' site/index.html
```

If the image couldn't be generated (no Chrome — see c), leave `og:image` / `twitter:image` as empty `content=""`: scrapers ignore an empty tag, but a stamped URL that 404s can break the whole preview. Stamp the same tags into the user's **local saved copy** too — same single-file rule as in (a): the staged-from folder's `index.html`, never a `portfolio-*/index.html` glob.

**c) The share-card images (headless Chrome).** The portfolio skill leaves `share-card.html` (a fixed 1200×630 card) and `share-card-square.html` (1080×1080) **next to the portfolio folder** (`<portfolio-dir>` below is the directory holding them). If `share-card.html` exists there AND Chrome exists at the path below, screenshot them straight into the staging dir:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ] && [ -f "<portfolio-dir>/share-card.html" ]; then
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=2000 \
    --screenshot="$PWD/site/og-image.png" --window-size=1200,630 \
    "file://<portfolio-dir>/share-card.html"
  [ -f "<portfolio-dir>/share-card-square.html" ] && \
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=2000 \
    --screenshot="$PWD/site/og-image-square.png" --window-size=1080,1080 \
    "file://<portfolio-dir>/share-card-square.html"
fi
```

Use **absolute paths** for both `--screenshot` and the `file://` URL — Chrome resolves relative paths against its own cwd. **If Chrome is missing, skip this gracefully** — the publish still succeeds. Tell the user plainly: "Your link will work everywhere — it just won't show a picture preview when pasted, because Chrome isn't installed here to make one." Don't install Chrome for them, don't block, and leave `og:image`/`twitter:image` unstamped per (b).

**d) The allowlist grows by exactly two files: `og-image.png` and `og-image-square.png`.** Nothing else new enters `site/`. The `share-card.html` / `share-card-square.html` sources stay local — only their screenshots ship — and, as always, `career.json`, notes, drafts, and everything else in the job-hunt folder **never** leave the machine.

**e) The published-mode stamp — staged copy ONLY.** A published copy carries `data-hope-mode="published"` on its `<html>` element; the template gates editing affordances on it. Stamp it into `site/index.html`, guarded by a grep so a re-publish never double-stamps:

```bash
grep -q '<html data-hope-mode="published"' site/index.html \
  || sed -i '' 's|<html |<html data-hope-mode="published" |' site/index.html
```

(On Linux, `sed -i 's|...|...|'` — drop the `''`.) **Never stamp the user's local saved copy** — unlike the stamps in (a)/(b), this one goes into the staged `site/index.html` only. The local file stays unstamped (owner mode, the owner's editable copy); re-publish re-stages and re-stamps every time, which is what makes this sustainable.

**Published copies are read-only.** On the live site the flag disables visitor *editing* — photo upload goes fully inert, and a visitor's stale localStorage never shadows the owner's baked photo. Visitor *features* stay: theme toggle, the Share menu, Save-as-PDF, section navigation, card expansion. This is the same PUBLISHED-MODE CONTRACT documented in the template CSS: **any future editable affordance added to the portfolio must gate on `html[data-hope-mode="published"]`** — that's what keeps published sites read-only as the template grows.

Confirm the stamps landed before pushing — `grep -E 'hope:share-url|og:url|og:image|<html data-hope-mode' site/index.html` should show the live URL(s) and the `data-hope-mode="published"` flag on the `<html` tag (the `<html ` anchor matters — the template's CSS gate rules also contain the literal string `data-hope-mode="published"`, so an unanchored grep passes even when the tag was never stamped), with no leftover empty `content=""` on any tag you stamped. On **re-publish**, re-run this whole step anyway — the URLs are the same, but it self-heals copies generated before the page first went live and re-screenshots a share card that may have changed since last time.

### 7. Execute (run it; narrate in plain words)
Say what's happening simply — "Putting it online…", "Setting up the page…", "Almost there — the web address is waking up." Run:

**First publish (GitHub Pages):**
```bash
cd site
git init -b main && git add . && git commit -m "Publish portfolio"
gh repo create <owner>/<repo> --public --source=. --remote=origin --push
# Enabling Pages is a separate call — --push alone does not turn it on.
# Re-publish safety: if Pages is already on, this POST 422s; check first and skip it.
gh api repos/<owner>/<repo>/pages --jq .status 2>/dev/null \
  || gh api -X POST repos/<owner>/<repo>/pages -f 'source[branch]=main' -f 'source[path]=/'
# Poll until the build finishes (sleep ~5s between checks); "built" means live.
gh api repos/<owner>/<repo>/pages --jq .status   # repeat until "built"
```
Then write `.publish.json` with `{ host, owner, repo, url, branch, published_at }` (`url` = the **SITE_URL** from step 3b, `branch` = `main`, `published_at` = now, ISO — e.g. `date -u +%Y-%m-%dT%H:%M:%SZ`).

**If the chosen repo already exists** (step 3b Option 1 — replacing the existing `<login>.github.io`): skip `gh repo create` (it errors on an existing repo). Point the staging repo at it and replace the site:
```bash
git remote add origin "https://github.com/<owner>/<repo>.git"
git push -u origin main --force-with-lease
```
The user explicitly chose to replace, so overwriting `main` is intended — `--force-with-lease` is the safer force.

**Re-publish (idempotent):**
```bash
cd site
git add -A && git commit -m "Update portfolio" && git push
```
Same repo, same URL — never a second site for the same portfolio. Pages rebuilds on its own when the branch changes; no API calls needed. **Refresh `published_at` in `.publish.json` to now** (every publish, not just the first) — it's how the update-check knows whether the live site is behind the local file.

**Avoid the two classic stumbles — directory-independent + idempotent.** Every git command above targets the **staging dir**. If you run them across separate steps rather than one chained block, prefer `git -C site …` (and `gh repo create … --source=site`) over relying on a persisted `cd site` — a git command that runs from the project root otherwise fails with *"not a git repository."* And re-publish is **safe to re-run end-to-end**: step 4 re-copies the allowlist into a clean `site/` and step 6 re-stamps from scratch, so the share-url / OG / published-mode stamps converge to the same result however many times you publish (the `sed` replacements match `content="…"` → identical output; the `data-hope-mode` stamp is grep-guarded against double-stamping).

### 8. Return the URL
Plainly and warmly: "Done — your portfolio is live at **<url>**. Copy it into any application. It can take a minute to appear the first time. And your live site is view-only for visitors — only you can change it, by republishing." Offer to open it for them. The page's own **Share** button now copies this exact link too — and if they ask where that button is, point rather than describe: `<url>#spotlight=share` makes it glow on the live page (the spotlight hash works on the published link).

If the share images shipped (step 6c), add — plainly: "Paste this link on LinkedIn and it shows the preview picture people see when you share your link. There's also a square version of that picture — I can show you where it is — that's yours to attach straight to posts." (The square image lives in `site/` and at `<SITE_URL>og-image-square.png`.) If they later say the LinkedIn preview looks stale or missing, point them to LinkedIn's **Post Inspector** — https://www.linkedin.com/post-inspector/ — paste the link there and hit Inspect to force a fresh scrape; LinkedIn caches previews for about a week, and posts already published keep their old card. If the images were skipped (no Chrome), don't promise a card — the link still works everywhere, just without the picture preview.

### 9. Custom domain (only if they ask)
If they raise their own domain, ask which address they want — numbered, recommended first (voice-guide rule #6):
> "Which address should the portfolio live at?
>  **1. `www.<their-domain>`** *(recommended)* — simplest setup, one DNS record.
>  **2. `<their-domain>` (no www)** — works too, needs four records.
>  (Or tell me in your own words.)"

Then write the `CNAME` file (commit, push) and **print** the exact DNS records for their pick to add at their registrar (`CNAME` `www` → `<owner>.github.io`, or apex `A` records per GitHub's IPs). You never edit their DNS — print the records, let them add them.

## Hosts

**GitHub Pages — the default, and the only one you offer unprompted.** Free, the user owns the repo, durable (just `git push`), free custom domain. A portfolio is public by design, so the public-repo requirement is a fit, not a caveat.

**Cloudflare — only if the user *themselves* says they don't want a public repo.** No public repo, direct upload. Don't raise it proactively; it's a technical fork that confuses more than it helps. If asked, follow Cloudflare's current Workers static-assets deploy.

## Voice

Warm, calm, in control — you know how this works so they don't have to. Plain words, one step at a time, never breezy about the public action.

Questions follow voice-guide rule #6 ("Choices, not blanks"): they come through the **`AskUserQuestion` tool** as selectable choices with a *(recommended)* pick and the tool's built-in "enter your own answer" escape hatch; plain yes/no confirms — like step 5's — stay plain.

**That binds improvised questions too:** a clarification, a quick check, anything about to go out as free prose — stop and reformat it as an `AskUserQuestion` menu or a plain yes/no. Free-prose questions do not exist in Hope's voice.

Vocabulary follows voice-guide rule #4's "Meet them at their words": gauge the user's register from how *they* talk and match it — this skill's plain-words habit is that rule in action, not a separate one.

> ✅ "I'll put this online for you — it'll be public so recruiters can see it, and your private files stay home. Ready?"
> ✅ "Putting it online now… setting up the page… done. Here's your link: <url>"
> ❌ "Select a host: GitHub Pages or Cloudflare? Public or private? Enter a repo name:"
> ❌ "Deploying! 🚀 You're going live!"

## What this skill never does

- Publishes without the one plain-English confirm.
- Pushes `career.json`, notes, or anything outside the allowlist.
- Quizzes a non-technical user on hosts, repo names, visibility, or branches.
- Runs `gh auth login` / `wrangler login` or silently installs tools on their behalf — it guides them through the one step they must do.
- Creates a second site for a portfolio that already has a `.publish.json` record.

## Hand-off

After publishing, record the live URL on the user's `CuratedPortfolio` in the graph. Also update `user-story.md` per `$PLUGIN_ROOT/references/user-story-guide.md`: append a dated one-liner to "The journey so far" — `- YYYY-MM-DD: Published to <url>` (re-publishes too) — groom on touch, and tell the user in one line. The portfolio is now live — the user can drop the link into any application. If they want changes, offer to update the portfolio and re-publish (same repo, same URL). Recommend; never push.
