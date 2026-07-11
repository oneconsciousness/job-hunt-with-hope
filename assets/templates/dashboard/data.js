/* data.js — the dataset the Career Dashboard reads. ONE global, classic
   script — no type=module, no fetch(), no import (file:// law,
   references/design-tokens.md § "Modular structure"). dashboard.html loads
   this BEFORE dashboard.js, so window.HOPE_DATA exists when the script runs.

   When the dashboard is generated NEXT TO a portfolio, reuse the portfolio's
   data.js (one dataset, two surfaces) and ADD the `target` block below to it.
   The dashboard reads only `meta.name` from the shared dataset plus
   everything under `target`; the topbar's Portfolio button links to the
   sibling index.html.

   AUTHORING CONTRACT (generator side: skills/dashboard/SKILL.md):

   window.HOPE_DATA.target — the mission-brief dataset, one object:
     role        string  — the target role, rendered as the hero title
     from        string  — the current role (forward-throughline start node)
     readiness   0–100   — the honest readiness read (gauge + playhead)
     window      string  — when offers land, e.g. "Offer window · Aug–Sep"
     comp        string | null — comp band chip, e.g. "$180K–$220K band"
     northStar   string  — first-person, one sentence; quoted in the hero
     positioning string  — the "you're not starting from zero" line (ch. 02)
     stats       [≤6]    — proof the user ALREADY has:
                   { icon: Material Symbol name, value: short, label: short }
     matrix      { headline, source, gaps: [rows], moat: [rows] } where row =
                   { skill, current: 0–5, target: 0–5, star?: true, note }
                   — star marks the ONE door-opener gap (exactly one).
                   Level words map to dots: Aware 1 · Practicing 2–3 ·
                   Proficient 4 · Expert 5. `source` NAMES the role research
                   (postings, guides, dates) — never invent it.
     plan        { intro, phases: [≤3] } where phase =
                   { num "01", title, window, clock: "your clock" |
                     "market's clock", status: "active"|"next"|"later", why,
                     moves: [≤3 of { label, desc, date,
                       status: "done"|"active"|"todo", closes? }] }
                   — 2–3 phases, ≤7 moves total. Build phases run on the
                   user's clock (days, AI-speed); only market-paced phases
                   (loops, offers) take "market's clock".
     projects    [≤3]   — the proof artifacts:
                   { name, tagline, featured?: true, ship, status:
                     "active"|"planned", closes, builtWith, runsOn, desc }
                   — exactly one featured (the signature artifact).
     posts       [≤6]   — build-in-public drafts, ready to copy:
                   { day, platform: "linkedin"|"link", hook, body, cta,
                     tags: [string] }
     board       [≤8]   — OPTIONAL · the validated target-roles board (written
                   by hope-discovery, statuses updated by hope-application):
                   { company, role, url?, grade "A".."F", status: human words
                     ("Found"|"Interested"|"Applied"|"Interview"|"Offer"|"Closed"),
                     warmPath?: "who/how", note?: short, next?: "the next move" }
                   — chapter renders only when rows exist.
     boardNote   string | null — one-line provenance note under the board.
     guidance    — Hope's take (opinionated, autonomy-respecting):
                   { take, moves: [2 of { title, desc }], then,
                     deprioritize: [≤4 of { thing, why }], autonomy }

   The SAMPLE below is shape-reference only (a fictional seeker) so a
   contributor can double-click dashboard.html and see every surface render.
   The generator replaces the whole object with the user's real read. */

window.HOPE_DATA = {
  "schema_version": 2,
  "meta": { "name": "Jane Doe" },
  "target": {
    "role": "Senior Product Designer",
    "from": "Product Designer",
    "readiness": 58,
    "window": "Offer window · Oct–Nov",
    "comp": "$150K–$190K band",
    "northStar": "Own a product surface end-to-end — research to shipped pixels — and prove the judgment calls, not just the mockups.",
    "positioning": "You're not starting a climb — you're 58% up it. What's left is proof and packaging, not new craft.",
    "stats": [
      { "icon": "brush", "value": "12", "label": "shipped features across two products" },
      { "icon": "groups", "value": "3", "label": "cross-functional squads led through delivery" },
      { "icon": "trending_up", "value": "+28%", "label": "activation lift from the onboarding redesign" },
      { "icon": "bolt", "value": "6 days", "label": "concept → validated prototype, with AI tooling" }
    ],
    "matrix": {
      "headline": "Your gap isn't craft — it's evidence of end-to-end ownership and the systems-thinking story seniors are scored on.",
      "source": "Read against Senior Product Designer postings and interview guides (sampled this month) — cross-referenced to your career file.",
      "gaps": [
        { "skill": "End-to-end case studies", "current": 2, "target": 5, "star": true, "note": "One story you can draw from memory — problem → research → calls → shipped outcome." },
        { "skill": "Design-system contribution", "current": 3, "target": 4, "note": "You use the system daily; seniors are asked what they added to it." }
      ],
      "moat": [
        { "skill": "Prototype speed", "current": 5, "target": 4, "note": "Validated prototypes in days — lead with this." },
        { "skill": "Research fluency", "current": 4, "target": 4, "note": "You run your own studies; most candidates borrow someone else's." }
      ]
    },
    "plan": {
      "intro": "Two phases, four moves. The first runs on your clock — days. Only the second runs on the market's.",
      "phases": [
        {
          "num": "01", "title": "Ship the proof", "window": "This week", "clock": "your clock", "status": "active",
          "why": "One flagship case study plus a system contribution — the two things the loop actually scores.",
          "moves": [
            { "label": "Write the onboarding case study", "desc": "The +28% activation story, told as problem → research → judgment calls → outcome.", "date": "By Friday", "status": "active", "closes": "Gap 1" },
            { "label": "Contribute one system component", "desc": "Propose, document and land a component in the design system — small, real, linkable.", "date": "Next week", "status": "todo", "closes": "Gap 2" }
          ]
        },
        {
          "num": "02", "title": "Run the market", "window": "Next month", "clock": "market's clock", "status": "later",
          "why": "Loops take weeks — everything before this exists so they convert.",
          "moves": [
            { "label": "Apply with the portfolio leading", "desc": "Every application opens with the case study link, never a résumé.", "date": "Weeks 1–2", "status": "todo" },
            { "label": "Convert loops into a senior offer", "desc": "Panel prep drilled on your own case studies.", "date": "Weeks 3–6", "status": "todo" }
          ]
        }
      ]
    },
    "projects": [
      {
        "name": "Onboarding case study",
        "tagline": "Your flagship end-to-end ownership story",
        "featured": true,
        "ship": "Ship in 3 days",
        "status": "active",
        "closes": "Gap 1",
        "builtWith": "Drafted and structured with your AI agent — you supply the ground truth",
        "runsOn": "Narrative artifact — anchored in the +28% activation outcome",
        "desc": "The onboarding redesign, written as a senior-level story: the ambiguous brief, the research that reframed it, the two judgment calls that mattered, and the shipped result. This is the artifact you draw from memory in every interview."
      },
      {
        "name": "System component RFC",
        "tagline": "A real, linkable design-system contribution",
        "ship": "Next week",
        "status": "planned",
        "closes": "Gap 2",
        "builtWith": "Spec and docs drafted with your AI agent",
        "runsOn": "Live component in the team's system library",
        "desc": "Propose one missing component, document its states and accessibility, and land it. Small on purpose — the signal is that you improved the system others work in."
      }
    ],
    "board": [
      { "company": "Linear", "role": "Senior Product Designer", "url": "https://linear.app/careers", "grade": "A", "status": "Interested", "warmPath": "Maya — design lead, ex-teammate", "next": "Warm intro via Maya this week" },
      { "company": "Figma", "role": "Product Designer, Growth", "url": "https://figma.com/careers", "grade": "B", "status": "Applied", "note": "applied Jul 8", "next": "Follow up Jul 15" }
    ],
    "boardNote": "Chosen together on Jul 11 — graded against your evidenced skills; warm paths first.",
    "posts": [
      {
        "day": "Day 1", "platform": "linkedin",
        "hook": "We lifted activation 28% by deleting half the onboarding. Here's what the research actually said.",
        "body": "Everyone assumed users needed more guidance. Twelve interviews said the opposite — they needed fewer decisions. So we cut the flow from nine steps to four and moved personalization after the first win. The redesign shipped in three weeks.",
        "cta": "What's the last thing you deleted to make a product better?",
        "tags": ["ProductDesign", "UXResearch", "BuildInPublic"]
      }
    ],
    "guidance": {
      "take": "Your craft is already senior — the portfolio just doesn't say so yet. Every loop you'll enter scores end-to-end ownership and system thinking, and you have both; they're simply unwritten. Stop polishing mockups; start writing the story only you can tell.",
      "moves": [
        { "title": "Ship the flagship case study", "desc": "The onboarding story, told end-to-end with the judgment calls named. That's the artifact every interview orbits." },
        { "title": "Land one system contribution", "desc": "A single documented component turns \"I use the system\" into \"I make the system better.\"" }
      ],
      "then": "Then rehearse the portfolio walkthrough — the 30-minute deep-dive is where senior offers are decided.",
      "deprioritize": [
        { "thing": "Another visual-polish pass", "why": "Your visuals already clear the bar; the missing signal is narrative, not pixels." },
        { "thing": "More certificates", "why": "A shipped, linkable story beats a certificate in every senior loop." }
      ],
      "autonomy": "Side-quests are fine if they energize you — just don't let them displace the two moves that actually move a senior offer. What's left is proof and packaging, not new craft."
    }
  }
};
