"""
Hope: graph ↔ markdown converter.

Lossy in places — markdown can't represent every JSON detail — but round-trippable
for the load-bearing data: Person, Skills, Experiences, Education, Projects, Memories,
edges between them.

Usage:
    python markdown_graph_convert.py to-markdown career-graph/career.json > career.md
    python markdown_graph_convert.py to-graph career.md > career.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def graph_to_markdown(graph: dict) -> str:
    out: list[str] = []
    person = graph["nodes"].get("Person", [{}])[0] if graph["nodes"].get("Person") else {}

    out.append(f"# {person.get('name', 'Career')} — Career Graph")
    out.append("")
    out.append(f"_Hope schema version: {graph.get('hope_schema_version', '1.0')}_")
    out.append(f"_Last updated: {graph.get('updated_at', '')}_")
    out.append("")

    # Person
    out.append("## Person")
    if person:
        for k, v in person.items():
            if k.startswith("_") or k in ("type", "created_at", "updated_at"):
                continue
            if v is None or v == "":
                continue
            out.append(f"- **{k}:** {v}")
    out.append("")

    # Goal
    goals = graph["nodes"].get("Goal", [])
    if goals:
        goal = sorted(goals, key=lambda g: g.get("created_at", ""), reverse=True)[0]
        out.append("## Goal")
        for k in ("target_role", "target_level", "target_industry", "target_geo",
                  "comp_floor", "time_per_week", "deadline", "deadline_reason"):
            v = goal.get(k)
            if v in (None, "", []):
                continue
            out.append(f"- **{k}:** {v}")
        out.append("")

    # Skills
    out.append("## Skills")
    for s in graph["nodes"].get("Skill", []):
        line = f"- [[{s['name']}]] — {s.get('level', '?')}"
        if s.get("years"):
            line += f", {s['years']} years"
        if s.get("category"):
            line += f" ({s['category']})"
        out.append(line)
    out.append("")

    # Experiences
    out.append("## Experiences")
    for e in graph["nodes"].get("Experience", []):
        out.append(f"### [[{e.get('id', '?')}]] — {e.get('title', '?')} at {_company_for(graph, e['id'])}")
        out.append(f"_{e.get('start_date', '?')} – {e.get('end_date') or 'present'}_")
        out.append("")
        if e.get("description"):
            out.append(e["description"])
            out.append("")
        for c in e.get("contributions", []):
            out.append(f"**{c.get('action', '')}**")
            out.append(f"- Result: {c.get('result', '')}")
            if c.get("metric"):
                m = c["metric"]
                out.append(f"- Metric: {m.get('value', '')} ({m.get('of', '')})")
            if c.get("skills_applied"):
                wikilinks = ", ".join(f"[[{s}]]" for s in c["skills_applied"])
                out.append(f"- Skills applied: {wikilinks}")
            out.append("")
    out.append("")

    # Education
    out.append("## Education")
    for e in graph["nodes"].get("Education", []):
        line = f"- **{e.get('institution', '?')}** — {e.get('degree', '?')} in {e.get('field_of_study', '?')}"
        if e.get("start_date") or e.get("end_date"):
            line += f" ({e.get('start_date', '?')[:4]} – {e.get('end_date', '?')[:4] if e.get('end_date') else 'present'})"
        out.append(line)
    out.append("")

    # Projects
    out.append("## Projects")
    for p in graph["nodes"].get("Project", []):
        out.append(f"### [[{p.get('id', '?')}]] — {p.get('name', '?')}")
        if p.get("description"):
            out.append(p["description"])
        out.append("")

    # Memories
    out.append("## Memories")
    for m in graph["nodes"].get("Memory", []):
        out.append(f"- _{m.get('topic', '?')}_ ({m.get('category', '?')}, importance {m.get('importance', '?')}): {m.get('content', '')}")
    out.append("")

    return "\n".join(out)


def _company_for(graph: dict, exp_id: str) -> str:
    for e in graph.get("edges", []):
        if e["from"] == exp_id and e["type"] == "AT_COMPANY":
            for c in graph["nodes"].get("Company", []):
                if c.get("canonical_id") == e["to"]:
                    return c.get("name", e["to"])
    return ""


def markdown_to_graph(md: str) -> dict:
    """Lossy reverse — minimal viable parse. Future versions can be richer."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    graph = {
        "hope_schema_version": "1.1",
        "created_at": now,
        "updated_at": now,
        "user_id": None,
        "nodes": {k: [] for k in [
            "Person", "Goal", "Skill", "Experience", "Education", "Certification",
            "Project", "JobPosting", "Company", "Memory", "Document",
            "CuratedPortfolio", "Application", "Interview", "Offer", "Connection"
        ]},
        "edges": [],
    }
    # NOTE: This is a stub. A full markdown-to-graph parse is meaningful work
    # and is left as a follow-up. For v0.1, treat to-markdown as the primary
    # direction (graph -> human-readable) and edit the JSON directly when needed.
    print("WARNING: markdown-to-graph is a stub in v0.1. Edit career.json directly for now.", file=sys.stderr)
    return graph


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    direction, path = sys.argv[1], sys.argv[2]
    if direction == "to-markdown":
        with open(path, "r", encoding="utf-8") as f:
            graph = json.load(f)
        print(graph_to_markdown(graph))
    elif direction == "to-graph":
        with open(path, "r", encoding="utf-8") as f:
            md = f.read()
        graph = markdown_to_graph(md)
        print(json.dumps(graph, indent=2))
    else:
        print(f"Unknown direction: {direction}")
        sys.exit(1)


if __name__ == "__main__":
    main()
