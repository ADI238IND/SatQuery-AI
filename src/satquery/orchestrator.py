from __future__ import annotations

from dataclasses import asdict

from .routing import route_query


def plan_analysis(query: str, image_count: int = 1, modalities: list[str] | None = None) -> dict:
    decision = route_query(query=query, image_count=image_count, modalities=modalities)
    return {
        "query": query,
        "tasks": [task.value for task in decision.tasks],
        "routing_confidence": decision.confidence,
        "reason": decision.reason,
        "status": "planned",
        "note": "Specialist model execution is intentionally left as a pluggable implementation step.",
    }
