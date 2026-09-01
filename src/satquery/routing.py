from __future__ import annotations

from dataclasses import dataclass

from .types import Task


@dataclass(slots=True)
class RouteDecision:
    tasks: list[Task]
    confidence: float
    reason: str


def route_query(query: str, image_count: int = 1, modalities: list[str] | None = None) -> RouteDecision:
    """Rules-first MVP router. Replace/augment with a trained classifier later."""
    q = query.lower().strip()
    modalities = [m.lower() for m in (modalities or [])]
    tasks: list[Task] = []
    reasons: list[str] = []

    change_words = {"change", "changed", "increase", "decrease", "before", "after", "between", "new"}
    ground_words = {"locate", "highlight", "where", "show", "mark", "box", "segment"}
    measure_words = {"area", "distance", "count", "how many", "percentage", "percent", "km2", "hectare"}

    if image_count >= 2 and any(word in q for word in change_words):
        tasks.append(Task.BITEMPORAL_CHANGE)
        reasons.append("query requests comparison/change across multiple images")

    if "sar" in q or ("sar" in modalities and any(m in modalities for m in ("optical", "multispectral"))):
        tasks.append(Task.OPTICAL_SAR)
        reasons.append("SAR or optical-SAR multimodal analysis requested/available")

    if any(word in q for word in ground_words):
        tasks.append(Task.CAPTION_GROUNDING)
        reasons.append("query requests spatial localization")

    if any(word in q for word in measure_words):
        tasks.append(Task.GIS_MEASUREMENT)
        reasons.append("query requests a deterministic quantitative measurement")

    if not tasks and image_count >= 1:
        tasks.append(Task.SINGLE_IMAGE_VQA)
        reasons.append("default semantic analysis for a single/multimodal scene")

    if not tasks:
        tasks.append(Task.UNKNOWN)
        reasons.append("no supported task inferred")

    unique_tasks = list(dict.fromkeys(tasks))
    confidence = 0.85 if unique_tasks != [Task.UNKNOWN] else 0.35
    return RouteDecision(tasks=unique_tasks, confidence=confidence, reason="; ".join(reasons))
