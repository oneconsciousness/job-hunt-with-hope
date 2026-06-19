"""
Hope graph query helpers.

Pure stdlib + optional networkx. Skills invoke these to query and update
the user's career graph stored at career-graph/career.json.

Usage from a skill:

    import sys
    sys.path.insert(0, "<plugin>/scripts")
    from graph_query import load_graph, save_graph, skills_for_job, add_node

    g = load_graph()
    matched, missing = skills_for_job(g, job_id="job:anthropic:product-designer:2026-05")
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

# Project-folder relative (the folder the user runs Hope in) — NOT a home dir.
# Callers should pass an explicit path; this default assumes cwd is the job-hunt folder.
DEFAULT_GRAPH_PATH = Path("career-graph") / "career.json"
SCHEMA_VERSION = "1.1"

# --------- IO ---------

def load_graph(path: Path | str | None = None) -> dict:
    """Load the career graph. Returns the empty starter shape if file doesn't exist."""
    p = Path(path) if path else DEFAULT_GRAPH_PATH
    if not p.exists():
        return _empty_graph()
    with p.open("r", encoding="utf-8") as f:
        graph = json.load(f)
    _validate_shape(graph)
    return graph


def save_graph(graph: dict, path: Path | str | None = None) -> Path:
    """Save the graph atomically. Updates updated_at."""
    graph["updated_at"] = _now()
    p = Path(path) if path else DEFAULT_GRAPH_PATH
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    tmp.replace(p)
    return p


def _empty_graph() -> dict:
    now = _now()
    return {
        "hope_schema_version": SCHEMA_VERSION,
        "created_at": now,
        "updated_at": now,
        "user_id": None,
        "nodes": {
            "Person": [], "Goal": [], "Skill": [], "Experience": [], "Education": [],
            "Certification": [], "Project": [], "JobPosting": [], "Company": [],
            "Memory": [], "Document": [], "CuratedPortfolio": [],
            "Application": [], "Interview": [], "Offer": [], "Connection": [],
        },
        "edges": [],
    }


def _validate_shape(graph: dict) -> None:
    if "hope_schema_version" not in graph:
        raise ValueError("graph file missing hope_schema_version")
    for required_key in ("nodes", "edges"):
        if required_key not in graph:
            raise ValueError(f"graph file missing required key: {required_key}")


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --------- Node operations ---------

def find_node(graph: dict, node_type: str, identifier: str) -> dict | None:
    """Find a node by id (or 'name' for Skill) within the given type bucket."""
    bucket = graph["nodes"].get(node_type, [])
    key_field = "name" if node_type == "Skill" else (
        "user_id" if node_type == "Person" else
        "canonical_id" if node_type == "Company" else "id"
    )
    for n in bucket:
        if n.get(key_field) == identifier:
            return n
    return None


def add_node(graph: dict, node_type: str, node: dict, *, merge: bool = True) -> dict:
    """Add or merge a node. Returns the resulting node (existing if merged)."""
    if node_type not in graph["nodes"]:
        graph["nodes"][node_type] = []
    key_field = "name" if node_type == "Skill" else (
        "user_id" if node_type == "Person" else
        "canonical_id" if node_type == "Company" else "id"
    )
    identifier = node.get(key_field)
    if not identifier:
        raise ValueError(f"node of type {node_type} missing key field {key_field}")

    existing = find_node(graph, node_type, identifier)
    if existing and merge:
        # Merge — never downgrade confidence/level/years
        for k, v in node.items():
            if k in ("confidence", "level", "years"):
                continue  # only upgrade via explicit logic below
            if k == "updated_at":
                existing[k] = v
                continue
            if v is not None:
                existing[k] = v
        # Upgrade-only fields
        if "confidence" in node and node["confidence"] > existing.get("confidence", 0):
            existing["confidence"] = node["confidence"]
        if "years" in node and node["years"] > existing.get("years", 0):
            existing["years"] = node["years"]
        return existing
    elif existing and not merge:
        return existing
    else:
        graph["nodes"][node_type].append(node)
        return node


def add_edge(graph: dict, from_id: str, to_id: str, edge_type: str, **properties) -> dict:
    """Add an edge if it doesn't already exist (idempotent on type + endpoints)."""
    for e in graph["edges"]:
        if e["from"] == from_id and e["to"] == to_id and e["type"] == edge_type:
            # Update properties on existing edge
            for k, v in properties.items():
                if v is not None:
                    e[k] = v
            return e
    edge = {"from": from_id, "to": to_id, "type": edge_type, **properties}
    graph["edges"].append(edge)
    return edge


# --------- Query helpers ---------

def get_person(graph: dict) -> dict | None:
    persons = graph["nodes"].get("Person", [])
    return persons[0] if persons else None


def get_active_goal(graph: dict) -> dict | None:
    """Return the most recent Goal node (by created_at), or None."""
    goals = graph["nodes"].get("Goal", [])
    if not goals:
        return None
    return sorted(goals, key=lambda g: g.get("created_at", ""), reverse=True)[0]


def make_goal_id(user_id: str, date: str) -> str:
    """goal:<user-slug>:<YYYY-MM-DD>. Strips the 'person:' prefix from user_id."""
    user_part = user_id.split(":", 1)[1] if ":" in user_id else user_id
    return f"goal:{user_part}:{date}"


def list_skills(graph: dict, *, min_confidence: float = 0.0,
                category: str | None = None) -> list[dict]:
    skills = graph["nodes"].get("Skill", [])
    out = []
    for s in skills:
        if s.get("confidence", 0) < min_confidence:
            continue
        if category and s.get("category") != category:
            continue
        out.append(s)
    return sorted(out, key=lambda s: (-s.get("confidence", 0), -s.get("years", 0)))


def edges_from(graph: dict, from_id: str, *, edge_type: str | None = None) -> list[dict]:
    return [e for e in graph["edges"]
            if e["from"] == from_id and (edge_type is None or e["type"] == edge_type)]


def edges_to(graph: dict, to_id: str, *, edge_type: str | None = None) -> list[dict]:
    return [e for e in graph["edges"]
            if e["to"] == to_id and (edge_type is None or e["type"] == edge_type)]


def skills_for_job(graph: dict, job_id: str) -> tuple[list[str], list[str]]:
    """Return (skills_user_has_that_job_requires, skills_user_lacks_that_job_requires)."""
    person = get_person(graph)
    if not person:
        return [], []
    user_skills = {e["to"] for e in edges_from(graph, person["user_id"], edge_type="HAS_SKILL")}
    required = {e["to"] for e in edges_from(graph, job_id, edge_type="REQUIRES_SKILL")}
    matched = list(user_skills & required)
    missing = list(required - user_skills)
    return matched, missing


def experiences_demonstrating_skill(graph: dict, skill_name: str, *, top_k: int = 3) -> list[dict]:
    """Return Experiences/Projects that have USED_SKILL or APPLIED_SKILL edges to this skill."""
    relevant = [e for e in graph["edges"]
                if e["to"] == skill_name and e["type"] in ("USED_SKILL", "APPLIED_SKILL")]
    out = []
    for edge in relevant:
        for type_bucket in ("Experience", "Project", "Education"):
            for n in graph["nodes"].get(type_bucket, []):
                if n.get("id") == edge["from"]:
                    out.append(n)
                    break
    # Sort by confidence then by recency (start_date desc when available)
    return sorted(out, key=lambda n: (
        -n.get("confidence", 0),
        -(int(n.get("start_date", "0000-00-00")[:4]) if n.get("start_date") else 0),
    ))[:top_k]


def match_score(graph: dict, job_id: str) -> dict:
    """Compute a 0-10 fit score for a job.

    Weighted by user's skill confidence on matching required skills,
    penalized for missing required skills.
    """
    matched, missing = skills_for_job(graph, job_id)
    if not (matched or missing):
        return {"score": 0.0, "matched": [], "missing": [], "reasoning": "no required skills found on job posting"}

    person = get_person(graph)
    skill_index = {s["name"]: s for s in graph["nodes"].get("Skill", [])}

    matched_score = 0.0
    for s in matched:
        skill = skill_index.get(s, {})
        matched_score += skill.get("confidence", 0.5)

    missing_penalty = len(missing) * 0.5
    raw = matched_score - missing_penalty
    total_required = len(matched) + len(missing)
    normalized = max(0.0, min(10.0, (raw / total_required) * 10)) if total_required else 0.0

    return {
        "score": round(normalized, 1),
        "matched": matched,
        "missing": missing,
        "reasoning": f"{len(matched)} of {total_required} required skills present; {len(missing)} missing"
    }


# --------- ID generation ---------

def make_experience_id(user_id: str, company_slug: str, role_slug: str, start_year: int) -> str:
    # Strip "person:" prefix if present
    user_part = user_id.split(":", 1)[1] if ":" in user_id else user_id
    return f"exp:{user_part}:{company_slug}:{role_slug}:{start_year}"


def make_company_canonical_id(name: str, domain: str | None = None) -> str:
    if domain:
        slug = domain.replace(".", "-").lower()
        return f"company:{slug}"
    slug = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
    return f"company:{slug}"


def make_skill_name(raw: str) -> str:
    """Normalize skill name for deduplication."""
    return raw.strip().lower().replace("-", " ").replace("_", " ")


# --------- CLI for ad-hoc inspection ---------

if __name__ == "__main__":
    import sys
    g = load_graph()
    p = get_person(g)
    if not p:
        print("No Person node yet. Onboarding hasn't run.")
        sys.exit(0)
    print(f"Person: {p['name']} · {p.get('headline', '')}")
    print(f"Skills: {len(g['nodes'].get('Skill', []))}")
    print(f"Experiences: {len(g['nodes'].get('Experience', []))}")
    print(f"Job postings: {len(g['nodes'].get('JobPosting', []))}")
    print(f"Applications: {len(g['nodes'].get('Application', []))}")
    print(f"Edges: {len(g['edges'])}")
