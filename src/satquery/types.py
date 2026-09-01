from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Task(str, Enum):
    SINGLE_IMAGE_VQA = "single_image_vqa"
    CAPTION_GROUNDING = "caption_grounding"
    BITEMPORAL_CHANGE = "bitemporal_change"
    OPTICAL_SAR = "optical_sar"
    GIS_MEASUREMENT = "gis_measurement"
    UNKNOWN = "unknown"


@dataclass(slots=True)
class Evidence:
    specialist: str
    claim: str
    confidence: float
    sensor_quality: float = 1.0
    grounding_score: float = 1.0
    agreement_score: float = 1.0
    registration_quality: float = 1.0
    domain_shift_score: float = 0.0
    geometry_ref: str | None = None
    measurement_ref: str | None = None
    warnings: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class FusedClaim:
    claim: str
    confidence: float
    evidence: list[Evidence]
    abstained: bool = False
    warnings: list[str] = field(default_factory=list)
