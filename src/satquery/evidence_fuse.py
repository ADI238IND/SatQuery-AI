from __future__ import annotations

from collections import defaultdict

from .types import Evidence, FusedClaim


def _clip(value: float) -> float:
    return max(0.0, min(1.0, value))


def evidence_reliability(e: Evidence, weights: dict[str, float] | None = None) -> float:
    """Simple transparent baseline; weights must eventually be calibrated on validation data."""
    weights = weights or {
        "model_confidence": 0.35,
        "sensor_quality": 0.20,
        "grounding": 0.20,
        "agreement": 0.15,
        "registration": 0.10,
    }
    positive = (
        weights["model_confidence"] * _clip(e.confidence)
        + weights["sensor_quality"] * _clip(e.sensor_quality)
        + weights["grounding"] * _clip(e.grounding_score)
        + weights["agreement"] * _clip(e.agreement_score)
        + weights["registration"] * _clip(e.registration_quality)
    )
    domain_penalty = 0.25 * _clip(e.domain_shift_score)
    return _clip(positive - domain_penalty)


def fuse_evidence(evidence: list[Evidence], abstain_threshold: float = 0.60) -> FusedClaim:
    if not evidence:
        return FusedClaim(
            claim="Insufficient evidence.",
            confidence=0.0,
            evidence=[],
            abstained=True,
            warnings=["No specialist evidence was produced."],
        )

    grouped: dict[str, list[tuple[Evidence, float]]] = defaultdict(list)
    for item in evidence:
        grouped[item.claim.strip().lower()].append((item, evidence_reliability(item)))

    best_key = max(grouped, key=lambda key: sum(score for _, score in grouped[key]) / len(grouped[key]))
    best_items = grouped[best_key]
    score = sum(value for _, value in best_items) / len(best_items)
    warnings = [warning for item, _ in best_items for warning in item.warnings]

    if len(grouped) > 1:
        warnings.append("Specialists produced competing claims; review evidence before acting.")
        score *= 0.90

    score = _clip(score)
    if score < abstain_threshold:
        return FusedClaim(
            claim="Insufficient reliable evidence to make a confident claim.",
            confidence=score,
            evidence=[item for item, _ in best_items],
            abstained=True,
            warnings=warnings,
        )

    return FusedClaim(
        claim=best_items[0][0].claim,
        confidence=score,
        evidence=[item for item, _ in best_items],
        abstained=False,
        warnings=warnings,
    )
