/* data.js — the SINGLE SOURCE OF TRUTH for the portfolio. ONE global, classic
   script — no type=module, no fetch(), no import (file:// law, references/
   design-tokens.md § "Modular structure"). index.html loads this BEFORE
   portfolio.js, so window.HOPE_DATA exists when the renderers run. portfolio.js
   renders every visible surface (identity, overview, experience, projects,
   skills, education, certifications, resume, throughline, footer, social) from
   this object — index.html ships only a static SEO-stamped shell (spec §B).

   ============================================================================
   AUTHORING CONTRACT  (generator side: skills/portfolio/SKILL.md · spec §A)
   ============================================================================

   Type-notation key:  T  required ·  T?  optional (key may be absent or null)
                       T[]  array ·  "a"|"b"  enum literal.
   Empty-but-required arrays ship as []  (never absent) so renderers branch
   deterministically.

   ── TWO LOAD-BEARING GLOBAL RULES ──────────────────────────────────────────

   NO-HEX RULE (canon §10, spec §A.7): data.js carries SEMANTIC values ONLY —
     never a hex color, rgb(), or var(--token). Authoring emits taxonomy/level/
     band tokens (category:"programming", level:4, band:"high"); portfolio.js
     resolves them to var(--token) at render. A zero-token grep runs across
     data.js + portfolio.js — any "#RRGGBB" here fails the build.

   SEG-COLOR = LEVEL TIER, NOT CATEGORY (LOCKED — spec §A.7, Q6 resolved):
     A skill's level (1|2|3|4) drives BOTH how many segments are lit AND the
     segment color tier. Category drives ONLY --cat-color (the header ledge +
     name), NEVER the segments. Mapping:
       level 4 = expert     → var(--skill-expert)     · 4 segs lit
       level 3 = advanced   → var(--skill-advanced)   · 3 segs lit
       level 2 = proficient → var(--skill-proficient) · 2 segs lit
       level 1 = beginner   → var(--skill-beginner)   · 1 seg lit
     Unlit segs = same tier @ 20% alpha. data.js never names these colors — it
     only states `level` and `category`; the renderer owns the resolution.

   ── A.0  TOP-LEVEL SHAPE ────────────────────────────────────────────────────
   {
     schema_version: int        — bump on breaking changes; portfolio.js checks.
     meta:        object  (req) — head/SEO/chrome values + confidence map.
     identity:    object  (req) — person card.
     overview:    object  (req) — gate is overview.show.
     experience:  object[] (req, may be []) — role cards, newest-first.
     projects:    object[] (req, may be []) — project cards, active-first.
     skills:      object  (req) — grouped by category, preserves order.
     education:   object[] (req, may be []) — degree cards, newest-first.
     certifications: object[] (req, may be []) — cert cards, newest-first.
     resume:      object  (req) — #resume-view source of truth.
     timeline:    object[] (req, may be []) — Throughline entries.
     social:      object[] (OPTIONAL — omit the key entirely when no Social app).
     traveler:    string | {inline:"<svg>"}  — Throughline playhead glyph.
   }

   ── A.1  meta  (also dual-stamped into <head> + .seo-fallback; data.js wins) ──
     name:            string  (req) — display name. Drives h1.name, resume h1,
                                       .seo-fallback, share card, head title/og.
     headline:        string  (req) — job-title line. May contain & (escape).
     og_description:  string  (req) — 1–2 sent. third-person recruiter hook.
     summary_short:   string  (req) — 1–2 sent. first-person, .seo-fallback body.
     site_url:        string? (opt) — canonical published URL (advisory only).
     share_url:       string? (opt) — canonical; empty pre-publish, publish stamps.
     target_company:  string? (opt) — tailoring target; null/""/absent identical
                                       → footer omits the " · For {co}" clause.
     generation_date: string  (req) — ISO YYYY-MM-DD. Footer + JSON-LD.
     confidence:      { [section]: { pct:number, band:"high"|"mid"|"low" } } (req)
                      — per-section integrity bar. Keys ONLY: experience, skills,
                        education, certifications, projects. overview/social have
                        NO bar (omit those keys). pct → bar width + .pct text;
                        band → var(--integrity-{band}). (No hex here.)
     [REMOVED in v2: show_summary, show_social — gates derived at render.]

   ── A.2  identity ───────────────────────────────────────────────────────────
     photo:    string?  (opt) — baked data:image/jpeg;base64,… (~480px). Present
                                → .photo-upload.has-photo; absent → dashed box.
     location: string?  (opt) — .contact-row .item.location. Omit if absent.
     email:    string?  (opt) — .contact-row mailto item. Omit if absent.
     phone:    string?  (opt) — RESUME contact line ONLY. renderIdentity MUST NOT
                                emit phone in .contact-row (privacy/layout).
     links:    Link[]   (req, may be []) — brand links, ordered.
     summary:  string?  (opt) — .summary paragraph (full). Omit <p> if absent.
     stats:    IdentityStats (req) — the .stats-row trio.

     Link:  { kind, label, url, resume? }
       kind:   "linkedin"|"github"|"x"|"website"|"instagram"|"behance"|
               "dribbble"|"medium"|"youtube"|"whatsapp"|"other"  (req)
               — picks inline brand SVG; other/unknown → globe.
       label:  string (req) — app-name label ("LinkedIn"). NEVER a URL/handle.
       url:    string (req) — href.
       resume: boolean? (opt) — include as worded resume anchor. Default true for
               linkedin/github/website.

     IdentityStats:  { skills:number, roles:number, contributions:number }  (all req)

   ── A.4  overview ───────────────────────────────────────────────────────────
     show:           boolean (req) — SOLE master gate. false → no tile, no pane,
                                     no TOC entry; default-open → Experience.
     headline_stats: Stat[] (req when show; max 4) — hero KPIs. Empty + show:true
                            is INVALID (set show:false instead).
     interests:      string[] (req when show; max 6) — neutral .skill-chip (no
                            data-cat). May be []; when empty, renderer OMITS the
                            .summary-interests element ENTIRELY (CSS :has() needs
                            it absent — never emit empty).

     Stat:  { icon, value, label }
       icon:  string (req) — Material Symbols name (rocket_launch, payments…).
       value: string (req) — hero number ("$2M+", "10+").
       label: string (req) — short label ("client pipeline").

   ── A.5  experience[]  (newest-first: is_current first, then date_start desc) ─
     id:                 string (req) — slug; card id="tl-{id}"; MUST match a
                                        timeline[].id whose pane:"experience".
     role_title:         string (req) — .role-title. Progression carries arrow
                                        form: "Associate Analyst → Business Analyst".
     company:            string (req) — .role-company, <img alt>.
     company_domain:     string? (opt) — favicon; absent → bare .org-fallback.
     company_initial:    string (req) — first-letter fallback (baked into onerror).
     dates:              string (req) — .role-dates ("Jan 2025 — Present").
     is_current:         boolean (req) — true → .is-current + .active-pill.
     contribution_count: number (req) — .contrib-pill (renderer pluralizes).
     kpis:               { ic:number, lead:number, metric:number } (req) — hex-KPIs.
     groups:             ContribGroup[] (req; 1–2, IC first then Leadership).

     ContribGroup:  { kind, contributions }
       kind:          "ic"|"lead" (req).
       contributions: Contribution[] (req, ordered).

     Contribution:  { num, icon, domain?, scope?, metric?, action, impact?,
                      skills, competencies }
       num:          number (req) — .contrib-num; AUTHORITATIVE, renderer never
                                    auto-indexes.
       icon:         string (req) — Material name.
       domain:       string? (opt) — .contrib-domain. Omit span if absent.
       scope:        "team"|"department"|"company-wide"|"industry"? (opt) — badge.
       metric:       Metric? (opt) — .metric-badge. Omit block if absent.
       action:       string (req) — .contrib-action.
       impact:       string? (opt) — .contrib-impact <p>. Omit if absent.
       skills:       SkillRef[] (req, may be []) — chips. [] → omit block.
       competencies: string[] (req, may be []) — labels. [] → omit block.

     Metric:  { value, direction, subject }
       value:     string (req) — .val ("5 of 10+").
       direction: "up"|"down"|"achieved" (req) — up→↑, down→↓, achieved→✓ AND
                  .metric-badge gets .achieved class (cyan). Two coupled outputs.
       subject:   string (req) — .subj.

     SkillRef:  { name, category? }
       name:     string (req) — chip text.
       category: SkillCategory? (opt) — emitted as data-cat; CSS owns the color,
                 renderer writes NO hex. Absent → no data-cat (orange default).

   ── A.6  projects[]  (active-first, then date_start desc) ────────────────────
     Render to .item-card.project (the .project class is REQUIRED) with a single
     flat .contrib.ic body. Projects have NO competencies, NO scope, NO
     metric-badge, NO contrib-num (do not port those from experience).
     id:          string (req) — card id="tl-{id}"; matches timeline pane:"projects".
     name:        string (req) — .role-title, <img alt>.
     tagline:     string (req) — .role-company.
     dates:       string? (opt) — .role-dates. OMIT the whole span when absent.
     is_active:   boolean (req) — .active-pill.
     domain:      string? (opt) — favicon; absent → bare .org-fallback.
     initial:     string (req) — .org-fallback letter.
     best_metric: string? (opt) — .contrib-pill. Omit pill if absent.
     description: string (req) — .contrib-action.
     impact:      string? (opt) — .contrib-impact. Omit if absent.
     skills:      SkillRef[] (req, may be []) — .contrib-skills. [] → omit.
     link:        { url:string, label:string }? (opt) — .project-link-row. Omit
                  row if absent.

   ── A.7  skills  (grouped object — preserves category order) ─────────────────
     order:      string[] (req) — ordered display-name keys into categories.
     categories: { [displayName]: SkillCat } (req) — keyed by display name.

     SkillCat:  { category, items }
       category: SkillCategory (req) — taxonomy enum → --cat-color (header ledge +
                 name ONLY) via catColorVar(). NOT the segs (segs = level tier).
       items:    SkillItem[] (req).

     SkillItem:  { name, level, years? }
       name:  string (req) — .skill-cell .name.
       level: 1|2|3|4 (req) — drives BOTH lit-seg count AND seg tier color (see
              the LOCKED seg-color rule at top). NO hex — only the level number.
       years: number? (opt) — .years "{n}y". Omit span if absent.

     SkillCategory enum: "tools"|"programming"|"languages"|"methods"|
       "analytical"|"design"|"domain"|"interpersonal"
       (renderer maps to --cat-* tokens; unknown → var(--accent-cyan) fallback).

     radar: RadarAxis[]? (opt) — a spider/radar chart of broad market-domain
       competency axes, rendered ABOVE the level-bar HUD. OMIT entirely when
       there is no clear market-axis story → the section degrades to the HUD
       alone (back-compat). The renderer needs >= 3 valid axes or it draws
       nothing. These axes are DIFFERENT from the category buckets above: they
       are 5-8 broad competency DOMAINS named in the person's own field
       vocabulary (see SKILL.md "Skills section — radar axes" for how to choose
       and name them). NO hex — semantic values only.

       RadarAxis:  { axis, score, source?, inDemand? }
         axis:     string (req) — the domain label, e.g. "Drain, Waste & Vent".
                   Title Case, <= 4 words. Recruiter-legible in THIS field.
         score:    1|2|3|4 (req) — same 1-4 scale as level (clamped at render).
                   Drives the vertex radius. NEVER a percentage, never a verdict.
         source:   string? (opt) — provenance (the framework the axis is named
                   from, e.g. "ACF" / "SFIA 9"). Not rendered in v1; kept for
                   future tooltips + auditability.
         inDemand: boolean? (opt) — currently in-demand for this field; renders
                   the vertex + label in the accent color. NON-blocking signal.

   ── A.8  education[] / certifications[]  (both → .edu-card, newest-first) ─────
     education[]:  { id, degree_line, institution, institution_domain?,
                     institution_initial, dates }
       id:                  string (req) — id="tl-{id}"; timeline pane:"education".
       degree_line:         string (req) — .title-line (long form).
       institution:         string (req) — .sub-line, <img alt>.
       institution_domain:  string? (opt) — favicon.
       institution_initial: string (req) — .org-fallback (baked into onerror).
       dates:               string (req) — .date-line.

     certifications[]:  { id, name, issuer, issuer_domain?, issuer_initial, date? }
       id:             string (req) — id="tl-{id}"; timeline pane:"certifications".
       name:           string (req) — .title-line (long form).
       issuer:         string (req) — .sub-line, <img alt>.
       issuer_domain:  string? (opt) — favicon.
       issuer_initial: string (req) — .org-fallback.
       date:           string? (opt) — .date-line. Absent/null → render
                       <span class="no-date">No date</span>.

   ── A.9  resume  (#resume-view source of truth) ─────────────────────────────
     contact_line_parts: { location?, email?, phone?, links:[{label,url}] } (req)
       — renderer joins with " · ": location (text), email (mailto), phone (plain),
         links (worded <a>), + Portfolio anchor when the stamped head share_url is
         non-empty (injected at render from head meta, NOT meta.site_url).
     summary:     string (req) — .resume-summary (2–3 sentences, resume register).
     experience:  ResumeEntry[] (req) — one .resume-entry per role.
     education:   ResumeEdu[] (req) — one per DEGREE. Certifications are NOT folded.
     skills_line: string (req) — .resume-skills (10–14 comma-joined skill names).

     ResumeEntry:  { role_title, company, dates, bullets:[{text, tag}] }
       — bullet rule: tag is an APPENDED short metric chip, NOT an in-text wrap.
         Renderer emits <li>{esc(text)} <strong>{esc(tag)}</strong></li>; escape
         separately. Exactly ONE <strong> per <li> (ATS). 2–4 bullets/role. Empty
         tag → log WARNING, emit <li>{esc(text)}</li>.
     ResumeEdu:   { degree_line, institution, dates }

   ── A.10  timeline[] / traveler / social[]  (UNCHANGED contract) ─────────────
     timeline[]:  { id, type, date_start, date_end, label, org, domain, metric,
                    skills[], pane, anchor, featured? }
       id:         string (req) — unique slug; matching card carries id="tl-{id}".
       type:       "experience"|"education"|"project"|"certification" (singular).
       date_start: "YYYY-MM" (req).
       date_end:   "YYYY-MM" | null (null = ongoing).
       label:      short phrase ≤40 chars ("Lead AI Engineer @ EY") — not a sentence.
       org:        string | null.
       domain:     string | null (favicon lookup).
       metric:     string | null (one short line).
       skills:     string[] (≤4).
       pane:       "experience"|"projects"|"education"|"certifications" (PLURAL) —
                   the section pane holding the card. JOIN KEY for the verifier
                   is pane (plural), NOT type (singular).
       anchor:     the DOM id of the target card ("tl-{id}").
       featured:   true? (opt) — surface in the Overview Highlights board.

     traveler:  "dot" (default soft-orange glow) | "<slug>" (one of
                assets/icons/travelers/: paper-plane, car, train, sailboat,
                bicycle, rocket, footprints) | { inline: "<svg…>" } (custom).

     social[]:  OPTIONAL key — present ONLY when the Social Feed app is added;
                omit the key entirely otherwise. One entry per featured post:
       platform: "youtube"|"vimeo"|"spotify"|"soundcloud"|"applemusic"|"figma"|
                 "codepen"|"loom"|"bluesky"|"linkedin"|"substack"|"flickr"|
                 "tiktok"|"instagram"|"x"|"threads"|"pinterest"|"dribbble"|
                 "behance"|"medium"|"gist"|"link"  ("link" = generic card).
       url:      string (req) — public permalink; renderer derives the embed.
       title:    string? (opt) — label for the always-present "View on …" link.
       caption:  string? (opt) — one short line shown above the embed.
       pinned:   boolean? (opt) — true surfaces in Overview "Latest from" (max 2).
       Social posts are NOT career events: no tl- id, never on the Throughline.
   ============================================================================ */

window.HOPE_DATA = {
  schema_version: 2,

  meta: {
    name: "Ada Example",
    headline: "Staff Engineer · Distributed Systems & Developer Tooling",
    og_description: "Staff engineer who builds the platforms other teams build on — scaled a deploy pipeline to 200+ services and cut CI time in half.",
    summary_short: "I build the platforms other teams build on. Scaled deploys to 200+ services and halved CI time.",
    site_url: "",
    share_url: "",
    target_company: null,
    generation_date: "2026-06-24",
    confidence: {
      experience:     { pct: 95, band: "high" },
      skills:         { pct: 88, band: "mid"  },
      education:      { pct: 96, band: "high" },
      certifications: { pct: 80, band: "mid"  },
      projects:       { pct: 90, band: "high" }
    }
  },

  identity: {
    photo: null,
    location: "Remote",
    email: "ada@example.com",
    summary: "I build the platforms other teams build on, and I care most about the seams — the deploy step, the failing test, the slow query nobody owns.",
    links: [
      { kind: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/example", resume: true },
      { kind: "github",   label: "GitHub",   url: "https://github.com/example",      resume: true }
    ],
    stats: { skills: 12, roles: 2, contributions: 3 }
  },

  overview: {
    show: true,
    headline_stats: [
      { icon: "rocket_launch", value: "200+", label: "services on the platform" },
      { icon: "timer",         value: "50%",  label: "CI time cut" },
      { icon: "groups",        value: "40",   label: "engineers unblocked" }
    ],
    interests: ["typography", "trail running"]
  },

  experience: [
    {
      id: "acme",
      role_title: "Staff Engineer",
      company: "Acme",
      company_domain: "acme.com",
      company_initial: "A",
      dates: "Mar 2023 — Present",
      is_current: true,
      contribution_count: 2,
      kpis: { ic: 1, lead: 1, metric: 2 },
      groups: [
        {
          kind: "ic",
          contributions: [
            {
              num: 1,
              icon: "deployed_code",
              domain: "Platform Engineering",
              scope: "company-wide",
              metric: { value: "50%", direction: "down", subject: "CI pipeline time" },
              action: "Rebuilt the CI pipeline around a remote build cache and selective test execution.",
              impact: "Cut median CI time in half across 200+ services; the slow build stopped being the bottleneck.",
              skills: [
                { name: "Bazel", category: "tools" },
                { name: "Go",    category: "programming" }
              ],
              competencies: ["systems design", "developer experience"]
            }
          ]
        },
        {
          kind: "lead",
          contributions: [
            {
              num: 2,
              icon: "groups",
              scope: "team",
              metric: { value: "40", direction: "achieved", subject: "engineers onboarded to the platform" },
              action: "Led the platform-adoption working group and mentored the rollout across product teams.",
              impact: "All 40 engineers shipping through the new platform within a quarter.",
              skills: [
                { name: "Technical Leadership", category: "interpersonal" }
              ],
              competencies: ["mentorship"]
            }
          ]
        }
      ]
    }
  ],

  projects: [
    {
      id: "buildcache",
      name: "BuildCache",
      tagline: "Maintainer / Author",
      dates: null,
      is_active: true,
      domain: "github.com",
      initial: "B",
      best_metric: "2k★",
      description: "Open-source remote build cache with content-addressed storage and a Bazel-compatible API.",
      impact: "Adopted by several mid-size engineering orgs to share build artifacts across CI runners.",
      skills: [
        { name: "Rust", category: "programming" }
      ],
      link: { url: "https://github.com/example/buildcache", label: "View on GitHub" }
    }
  ],

  skills: {
    order: ["Languages", "Platform & Infra"],
    categories: {
      "Languages": {
        category: "languages",
        items: [
          { name: "Go",   level: 4, years: 7 },
          { name: "Rust", level: 3, years: 3 }
        ]
      },
      "Platform & Infra": {
        category: "tools",
        items: [
          { name: "Bazel",      level: 4, years: 5 },
          { name: "Kubernetes", level: 2, years: 2 }
        ]
      }
    }
  },

  education: [
    {
      id: "bs-cs",
      degree_line: "Bachelor of Science (B.S.), Computer Science",
      institution: "State University",
      institution_domain: "stateuniversity.edu",
      institution_initial: "S",
      dates: "Sep 2014 — Jun 2018"
    }
  ],

  certifications: [
    {
      id: "cka",
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "CNCF",
      issuer_domain: "cncf.io",
      issuer_initial: "C",
      date: "Apr 2022"
    }
  ],

  resume: {
    contact_line_parts: {
      location: "Remote",
      email: "ada@example.com",
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/example" },
        { label: "GitHub",   url: "https://github.com/example" }
      ]
    },
    summary: "Staff engineer focused on developer platforms. I ship the tooling and infrastructure that lets product teams move faster, and I measure my work in the bottlenecks I remove.",
    experience: [
      {
        role_title: "Staff Engineer",
        company: "Acme",
        dates: "Mar 2023 — Present",
        bullets: [
          { text: "Rebuilt the CI pipeline around a remote build cache and selective tests, halving median build time across 200+ services.", tag: "50% faster" },
          { text: "Led platform adoption across product teams, onboarding every engineer onto shared deploy tooling within a quarter.", tag: "40 engineers" }
        ]
      }
    ],
    education: [
      {
        degree_line: "Bachelor of Science (B.S.), Computer Science",
        institution: "State University",
        dates: "Sep 2014 — Jun 2018"
      }
    ],
    skills_line: "Go, Rust, Bazel, Kubernetes, CI/CD, Distributed Systems, Developer Tooling, Remote Build Caching, Systems Design, Technical Leadership"
  },

  timeline: [
    {
      id: "acme",
      type: "experience",
      date_start: "2023-03",
      date_end: null,
      label: "Staff Engineer @ Acme",
      org: "Acme",
      domain: "acme.com",
      metric: "50% CI time cut",
      skills: ["Bazel", "Go", "Technical Leadership"],
      pane: "experience",
      anchor: "tl-acme",
      featured: true
    },
    {
      id: "buildcache",
      type: "project",
      date_start: "2021-06",
      date_end: null,
      label: "BuildCache (maintainer)",
      org: null,
      domain: "github.com",
      metric: "2k★",
      skills: ["Rust"],
      pane: "projects",
      anchor: "tl-buildcache"
    },
    {
      id: "cka",
      type: "certification",
      date_start: "2022-04",
      date_end: "2022-04",
      label: "Certified Kubernetes Administrator",
      org: "CNCF",
      domain: "cncf.io",
      metric: null,
      skills: ["Kubernetes"],
      pane: "certifications",
      anchor: "tl-cka"
    },
    {
      id: "bs-cs",
      type: "education",
      date_start: "2014-09",
      date_end: "2018-06",
      label: "B.S. Computer Science",
      org: "State University",
      domain: "stateuniversity.edu",
      metric: null,
      skills: [],
      pane: "education",
      anchor: "tl-bs-cs"
    }
  ],

  traveler: "footprints"
};
