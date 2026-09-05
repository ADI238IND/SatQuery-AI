from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ModelSelectionResult(BaseModel):
    """Result from model selection router identifying the chosen specialist workflow."""

    model_config = ConfigDict(extra="ignore")

    selected_specialist: str = Field(
        ...,
        description="Identified specialist adapter name (e.g. 'vqa', 'change_detection', 'region_grounding', 'optical_sar_fusion')",
        examples=["vqa"],
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence score for the selection decision",
        examples=[1.0],
    )
    reason: str = Field(
        default="Selector decision",
        description="Reasoning or signals justifying the specialist selection",
        examples=["Single image visual query"],
    )
    signals: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extracted feature signals used by the router",
    )


class ModelResult(BaseModel):
    """
    Standardized result returned by all AI specialist models and adapters.
    Aligns with execution tracking table structure.
    """

    model_config = ConfigDict(extra="ignore")

    status: str = Field(
        ...,
        description="Execution status ('NOT_IMPLEMENTED', 'success', 'error', 'INCOMPATIBLE_MODALITY')",
        examples=["NOT_IMPLEMENTED"],
    )
    result: Any = Field(
        default=None,
        description="Core output prediction, textual answer, or bounding boxes",
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Overall prediction confidence score if produced by model",
    )
    evidence: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Supporting evidence (attention maps, bounding boxes, feature heatmaps)",
    )
    limitations: List[str] = Field(
        default_factory=list,
        description="Known model boundaries, warnings, or assumptions",
        examples=[["Placeholder implementation - no AI inference executed."]],
    )
    model_name: str = Field(
        ...,
        description="Identifier of the executing model implementation",
        examples=["Placeholder-VQA-v1"],
    )
    model_version: str = Field(
        default="1.0.0",
        description="Version string of the executing model",
        examples=["1.0.0"],
    )
    processing_time_ms: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Execution duration in milliseconds",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional technical metrics or metadata",
    )
