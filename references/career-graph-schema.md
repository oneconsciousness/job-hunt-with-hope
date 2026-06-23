# Hope Career Graph Schema · v1.1

This document defines Hope's portable career graph — the personal data model every Hope skill reads and writes. The schema is a port of the original Hope MVP's Neo4j schema, adapted for file-based storage so the user owns their data without running a database server.

## Why a graph

A career is a network of relationships, not a list. Skills connect to experiences. Experiences happen at companies. Projects demonstrate skills. Job postings require skills. Cover letters reference experiences. The graph form lets Hope reason about *paths* — "which of my projects best evidence this required skill" — not just lookups.

Markdown alternative is available for users who don't want a graph file. The structure below has a markdown-equivalent representation; Hope ships a converter (`scripts/markdown_graph_convert.py`) so users can switch formats without losing data.

## File structure

Default location: `career-graph/career.json`

The user picks the storage backend (Layer 3 control). Default is local. Opt-ins: Google Drive, Box, Dropbox, Notion, GitHub repo (private), or pure in-memory (no persistence).

```
career-graph/
├── career.json           # The full graph (typical: 1–10 MB)
├── documents/            # Generated artifacts referenced by graph nodes
│   ├── resumes/
│   ├── cover-letters/
│   ├── portfolios/
│   └── interview-prep/
└── .hope-meta.json       # Schema version, last_updated, user preferences
```

## Top-level JSON shape

```json
{
  "hope_schema_version": "1.1",
  "created_at": "2026-05-06T22:00:00Z",
  "updated_at": "2026-05-06T22:00:00Z",
  "user_id": "deterministic-from-email-or-uuid",
  "nodes": {
    "Person": [...],
    "Skill": [...],
    "Experience": [...],
    "Education": [...],
    "Certification": [...],
    "Project": [...],
    "JobPosting": [...],
    "Company": [...],
    "Memory": [...],
    "Document": [...],
    "CuratedPortfolio": [...],
    "Application": [...],
    "Interview": [...],
    "Offer": [...],
    "Connection": [...]
  },
  "edges": [...]
}
```

## Node types (16 total)

The first 11 are ported directly from Hope MVP. Four new ones (Application, Interview, Offer, Connection) extend the schema to cover the milestones beyond Presentation.

### Person — root anchor (1 per graph)

```json
{
  "type": "Person",
  "user_id": "person:jane-doe-3a8f",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": null,
  "headline": "Product Designer · Type & Systems",
  "summary": "...",
  "location": "Brooklyn, NY",
  "linkedin": "https://linkedin.com/in/janedoe",
  "headline_stats": [
    {"icon": "rocket_launch", "value": "$2M+", "label": "client pipeline"},
    {"icon": "groups", "value": "12", "label": "designers mentored"}
  ],
  "interests": ["trail running", "letterpress printing", "sci-fi novels"],
  "created_at": "2026-05-06T22:00:00Z",
  "updated_at": "2026-05-06T22:00:00Z"
}
```

Two **optional** fields feed the portfolio's summary band:

- `headline_stats` — up to **4** hero numbers, each `{"icon": str, "value": str, "label": str}` where `icon` is a Material Symbols name (e.g. `rocket_launch`, `payments`, `groups`, `public`). **Curated by the human, never auto-summed** — the metrics are heterogeneous (dollars, headcounts, percentages, countries), so any automatic aggregation across them produces nonsense. Hope asks the user for their proudest numbers and records them verbatim.
- `interests` — up to **6** genuinely personal interests (typography, trail running) — **not skill keywords**. Skills earn their own nodes with evidence edges; interests are who the person is off the org chart.

### Goal — the seeker's structured aim (added v1.1)

The target of the hunt. Before v1.1, the aim lived only as free-text in a Memory node; that made it unqueryable and easy to lose. The Goal node makes the aim a first-class, mergeable, history-carrying entity that every downstream skill reads to size and rank its work.

```json
{
  "type": "Goal",
  "id": "goal:jane-doe:2026-06-12",
  "target_role": "Senior Backend Engineer",
  "target_level": "senior",
  "target_industry": "AI / developer tools",
  "target_geo": "SF / NYC / remote",
  "comp_floor": {"amount": 180000, "currency": "USD"},
  "time_per_week": "~10 hrs",
  "deadline": "2026-09-01",
  "deadline_reason": "H1B status — 60-day clock if current role ends",
  "confidence": 0.70,
  "source": "conversation",
  "created_at": "2026-06-12T00:00:00Z",
  "updated_at": "2026-06-12T00:00:00Z"
}
```

**ID:** `goal:<user-slug>:<date>` — deterministic on user + capture date, so re-running onboarding on the same day MERGES (idempotent); a goal captured on a later date creates a NEW Goal node, preserving how the aim shifted.

**Fields** (all optional except `id` — Hope gap-fills missing ones over time): `target_role`, `target_level` (`junior`/`mid`/`senior`/`staff`/`lead`/`pivot`), `target_industry`, `target_geo`, `comp_floor` (`{"amount", "currency"}` or `null`), `time_per_week` (**sizes every later plan**), `deadline` (ISO date or `null`), `deadline_reason` (why the clock exists — load-bearing for urgency + tone). `comp_floor`/`deadline` are nullable so a skill can tell "unstated" from "no constraint".

**Edge:** `HAS_GOAL` — Person → Goal. A Person may own multiple Goal nodes over time; the most recent (by `created_at`) is the active aim.

### Skill — global, shared across users in spirit (deduped within graph)

```json
{
  "type": "Skill",
  "name": "typography",
  "category": "design",
  "subcategory": "type",
  "level": "advanced",
  "years": 8,
  "confidence": 0.92,
  "market_demand": "high",
  "aliases": ["type design", "typesetting"],
  "description": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

Skills are **derived deterministically from contributions, not extracted as a flat list.** Every skill earns its place by being demonstrated in an Experience, Project, or Education node. No orphan skills.

### Experience

```json
{
  "type": "Experience",
  "id": "exp:jane-doe:figma:senior-designer:2023",
  "title": "Senior Product Designer",
  "description": "...",
  "start_date": "2023-01-15",
  "end_date": null,
  "is_current": true,
  "responsibilities": [...],
  "achievements": [...],
  "contributions": [
    {
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "...",
      "metric": {"value": "37%", "of": "design system adoption"},
      "skills_applied": ["typography", "design systems"],
      "skills_categories": ["design"],
      "scope": "company-wide",
      "domain": "B2B SaaS",
      "competencies": ["systems thinking", "stakeholder management"]
    }
  ],
  "confidence": 0.95,
  "source": "document",
  "created_at": "...",
  "updated_at": "..."
}
```

### Education, Certification, Project

Same shape — `id`, descriptive fields, `contributions` (STAR with metrics), `confidence`, `source`, timestamps.

### JobPosting

```json
{
  "type": "JobPosting",
  "id": "job:anthropic:product-designer:2026-05",
  "title": "Senior Product Designer",
  "company": "Anthropic",
  "location": "San Francisco / Remote",
  "remote_type": "hybrid",
  "description": "...",
  "salary_range": {"min": 180000, "max": 240000, "currency": "USD"},
  "source_url": "https://anthropic.com/careers/...",
  "status": "discovered | targeted | applied | interviewing | offered | declined | closed",
  "source": "user-pasted | portal-scanner | manual",
  "created_at": "...",
  "updated_at": "..."
}
```

### Company — canonical resolution

```json
{
  "type": "Company",
  "canonical_id": "company:anthropic-com",
  "name": "Anthropic",
  "domain": "anthropic.com",
  "is_enriched": true,
  "icon_url": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

Canonical IDs prefer domain (slug-of-domain) and fall back to slugified name. This deduplicates "Anthropic" / "Anthropic PBC" / "anthropic.com" into one node.

### Memory

```json
{
  "type": "Memory",
  "id": "mem:jane-doe:0001",
  "topic": "interview-style-preference",
  "content": "Prefers conversational interviews; finds whiteboard pressure-tests anxiety-inducing.",
  "category": "interview | networking | values | constraint | aspiration",
  "importance": 0.8,
  "session_id": "...",
  "session_context": "...",
  "extracted_at": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

Memories let Hope remember personal context across sessions — preferences, constraints, aspirations, what worked and didn't.

### Document

```json
{
  "type": "Document",
  "id": "doc:resume-anthropic-2026-05-06",
  "filename": "resume-anthropic-2026-05-06.pdf",
  "content_type": "resume | cover-letter | portfolio | interview-prep | offer-letter",
  "tags": ["anthropic", "product-designer"],
  "status": "draft | sent | archived",
  "uploaded_at": "...",
  "created_at": "..."
}
```

### CuratedPortfolio — the crown jewel

A subgraph curated for one specific job. Picks subset of skills, experiences, projects, education that best match the JobPosting.

```json
{
  "type": "CuratedPortfolio",
  "id": "portfolio:jane-doe:anthropic-product-designer:2026-05-06",
  "job_id": "job:anthropic:product-designer:2026-05",
  "title": "Jane Doe — for Anthropic",
  "summary": "...",
  "relevance_notes": "Emphasizes design systems and stakeholder narrative.",
  "show_summary": true,
  "created_at": "...",
  "updated_at": "..."
}
```

`show_summary` (boolean, optional) — whether this portfolio renders the summary band (the Person's `headline_stats` + `interests`). A **presentation choice per portfolio, not a Person fact** — the same person may show the band for one role and hide it for another. Absent → the band is omitted.

### Application — NEW (Milestone 4)

```json
{
  "type": "Application",
  "id": "app:jane-doe:anthropic:product-designer:2026-05-06",
  "job_id": "job:anthropic:product-designer:2026-05",
  "submitted_at": "2026-05-06T15:30:00Z",
  "status": "submitted | rejected | screening | interviewing | offered | withdrawn",
  "submitted_via": "company-portal | linkedin | referral | email",
  "documents_used": ["doc:resume-anthropic-...", "doc:cover-letter-anthropic-..."],
  "cover_message": "...",
  "follow_up_due": "2026-05-13",
  "created_at": "...",
  "updated_at": "..."
}
```

### Interview — NEW (Milestone 5)

```json
{
  "type": "Interview",
  "id": "iv:jane-doe:anthropic:round-1-screen:2026-05-10",
  "application_id": "app:jane-doe:anthropic:...",
  "round": "screen | technical | systems-design | behavioral | onsite | final",
  "interviewer_connection_id": "conn:alice-anthropic",
  "scheduled_at": "2026-05-10T14:00:00Z",
  "format": "video | phone | onsite | take-home",
  "prep_doc_id": "doc:interview-prep-anthropic-round-1",
  "outcome": "advanced | rejected | pending | declined",
  "reflection": "Felt strong on systems; weak on ambiguous product framing.",
  "created_at": "...",
  "updated_at": "..."
}
```

### Offer — NEW (Milestone 6)

```json
{
  "type": "Offer",
  "id": "offer:jane-doe:anthropic:2026-05-25",
  "application_id": "app:jane-doe:anthropic:...",
  "received_at": "2026-05-25T17:00:00Z",
  "compensation": {
    "base": 220000,
    "equity": "0.05% over 4 years, 1-year cliff",
    "signing_bonus": 25000,
    "currency": "USD"
  },
  "title": "Senior Product Designer",
  "start_date": "2026-06-15",
  "deadline": "2026-06-01",
  "decision": "accepted | declined | negotiating | pending",
  "negotiation_notes": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

### Connection — NEW (network)

```json
{
  "type": "Connection",
  "id": "conn:alice-anthropic",
  "name": "Alice Smith",
  "headline": "Design Lead at Anthropic",
  "company_id": "company:anthropic-com",
  "linkedin": "...",
  "email": null,
  "relationship_strength": "weak | medium | strong",
  "last_contacted_at": "2026-05-04T12:00:00Z",
  "notes": "Met at Config 2025. Strong on type systems.",
  "created_at": "...",
  "updated_at": "..."
}
```

## Edge types (30 total)

Edges live in a flat `edges` array, each with `from`, `to`, `type`, and optional properties.

### Person-to-asset edges (ownership)

- `HAS_SKILL` — Person → Skill (with `level`, `years`, `confidence`, `source`)
- `HAS_EXPERIENCE` — Person → Experience
- `HAS_EDUCATION` — Person → Education
- `HAS_CERTIFICATION` — Person → Certification
- `HAS_PROJECT` — Person → Project
- `HAS_MEMORY` — Person → Memory
- `HAS_GOAL` — Person → Goal (the seeker's structured aim; most recent by `created_at` is active)
- `UPLOADED` — Person → Document
- `HAS_CURATED_PORTFOLIO` — Person → CuratedPortfolio
- `KNOWS` — Person → Connection
- `TARGETING` — Person → JobPosting

### Demonstration edges (where skills were used)

- `USED_SKILL` — Experience/Education/Project → Skill (with context)
- `APPLIED_SKILL` — Experience/Education/Project → Skill (with context)

### Career-entity-to-company edges

- `AT_COMPANY` — Experience → Company
- `AT_INSTITUTION` — Education → Company (where company.type=school)
- `ISSUED_BY` — Certification → Company

### Job edges

- `REQUIRES_SKILL` — JobPosting → Skill
- `WORKS_AT` — Connection → Company

### CuratedPortfolio inclusion edges

- `INCLUDES_EXPERIENCE` — CuratedPortfolio → Experience
- `INCLUDES_SKILL` — CuratedPortfolio → Skill
- `INCLUDES_PROJECT` — CuratedPortfolio → Project
- `INCLUDES_EDUCATION` — CuratedPortfolio → Education
- `INCLUDES_CERTIFICATION` — CuratedPortfolio → Certification
- `INCLUDES_DOCUMENT` — CuratedPortfolio → Document (e.g. the generated portfolio file itself)

### Application/Interview/Offer edges

- `APPLIED_THROUGH` — Application → JobPosting
- `USED_PORTFOLIO` — Application → CuratedPortfolio
- `INCLUDED_DOCUMENT` — Application → Document
- `INTERVIEW_FOR` — Interview → Application
- `INTERVIEWED_BY` — Interview → Connection
- `RESULTED_IN_OFFER` — Application → Offer

## Load-bearing design patterns (inherited from Hope MVP)

These are the patterns the original Hope team got right. The port preserves them.

**Deterministic IDs.** All node IDs are generated from `user_id + identifying_fields`. Re-uploading the same résumé MERGES onto existing nodes instead of creating duplicates. Idempotent by default.

**Contribution-driven skills.** Skills don't appear out of nowhere. Every skill node has at least one `USED_SKILL` or `APPLIED_SKILL` edge from an Experience/Project/Education with structured STAR-method evidence (situation, task, action, result, metric, scope, domain, competencies). This means every skill claim has receipts.

**Canonical company resolution.** Companies dedupe via `canonical_id` derived from domain (preferred) or slugified name. "Anthropic" / "Anthropic PBC" / "anthropic.com" collapse to one node. Person and Education share company nodes (school = company with type=school).

**Confidence propagation.** Every node and edge carries a `confidence` score (0.0–1.0). Skills have base confidences from source: `document=0.85`, `conversation=0.70`, `github=0.95`, `web_enrichment=0.90`, `inferred=0.40`. **Confidence never downgrades** — when re-extracting, `level` and `years` only upgrade.

**Source attribution.** Every node records its `source`: `document`, `conversation`, `github`, `web_enrichment`, `inferred`. Enables disambiguation when sources conflict.

**JSON for nested data.** Contributions, achievements, technologies, requirements live as JSON arrays inside node properties. Skills get edges (because traversal matters); structured details live as data (because depth matters).

**Schema versioning.** Every graph file carries `hope_schema_version`. Future Hope versions auto-migrate older graphs.

## How each milestone touches the graph

- **Onboarding** — creates the Person node and seeds Skills, Experiences, Education, Projects from résumé/conversation. Writes initial Memories about preferences and constraints.
- **Discovery** — creates JobPosting nodes (one per role found). Adds `TARGETING` edges from Person. Adds `REQUIRES_SKILL` edges. Computes match scores via graph traversal (which Person.HAS_SKILL edges intersect Job.REQUIRES_SKILL edges).
- **Presentation** — creates CuratedPortfolio nodes per Job. Picks INCLUDES_* subset. Generates Documents (résumés, cover letters, portfolios) and links via UPLOADED.
- **Application** — creates Application nodes. Links to CuratedPortfolio used. Records submission state.
- **Interview** — creates Interview nodes per round. Links to Connection (if known). Records reflection. Updates Application status.
- **Negotiation** — creates Offer nodes. Records compensation, deadlines, negotiation state.
- **Decision** — finalizes Offer.decision. Updates Application status to `accepted`/`declined`. Writes a closing Memory.
- **Dashboard (cross-cut)** — reads across all node types and renders the visualization. Pure read; never writes.

## Markdown alternative (for users who don't want JSON)

`career.md` with one H2 per node-type, frontmatter inline, and edges as wiki-style links:

```markdown
# Jane Doe — Career

## Person
- **Name:** Jane Doe
- **Email:** jane@example.com
- **Headline:** Product Designer · Type & Systems

## Skills
- [[typography]] — advanced, 8 years, demonstrated in [[exp:jane:figma:senior-designer-2023]]
- [[design systems]] — advanced, 6 years, demonstrated in [[exp:jane:figma:senior-designer-2023]], [[proj:typebook-2024]]

## Experiences
### [[exp:jane:figma:senior-designer-2023]] — Senior Product Designer at Figma
2023-01-15 – present
Contributions:
- Led the rebrand of Figma's design system, achieving 37% adoption company-wide.
  - Skills applied: [[typography]], [[design systems]]
```

The `markdown_graph_convert.py` script translates losslessly between the two formats.

## Querying the graph

`scripts/graph_query.py` provides Python helpers using `networkx` (a near-universal Python graph library):

```python
from graph_query import load_graph, skills_for_job, similar_experiences

graph = load_graph("career-graph/career.json")

# Find which of my skills match a target job
matched, missing = skills_for_job(graph, job_id="job:anthropic:product-designer:2026-05")

# Find which of my past experiences best evidence a required skill
ranked = similar_experiences(graph, target_skill="design systems", top_k=3)
```

Hope skills invoke these helpers via the script-running capability available inside skills. The graph never leaves the user's machine unless they explicitly choose a cloud backend.
