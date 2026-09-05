from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnalysisCreateRequest(BaseModel):
    """Payload submitted to request a satellite imagery analysis."""

    model_config = ConfigDict(extra="ignore")

    image_ids: List[UUID] = Field(
        ...,
        min_length=1,
        description="List of valid satellite image UUIDs to analyze",
        examples=[["0093af25-c50a-4c2c-a052-ac8c0a75aa4a"]],
    )
    query: str = Field(
        ...,
        min_length=1,
        description="Natural language query or question about the imagery",
        examples=["What is visible in this satellite image?"],
    )

    @field_validator("image_ids")
    @classmethod
    def validate_unique_image_ids(cls, v: List[UUID]) -> List[UUID]:
        if not v:
            raise ValueError("image_ids list cannot be empty.")
        if len(v) != len(set(v)):
            raise ValueError("Duplicate image_ids are not allowed in the request.")
        return v

    @field_validator("query")
    @classmethod
    def validate_query_not_whitespace(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Query cannot be empty or contain only whitespace.")
        return v.strip()


class AnalysisResponseData(BaseModel):
    """Structure matching the database 'analyses' and bridge mapping."""

    model_config = ConfigDict(extra="ignore")

    analysis_id: str = Field(..., description="Unique UUID for the analysis request")
    image_ids: List[str] = Field(..., description="List of associated satellite image UUIDs")
    query: str = Field(..., description="The query string submitted for analysis")
    workflow_type: str = Field(..., description="Determined workflow type ('vqa' or 'change_detection')")
    status: str = Field(default="pending", description="Current analysis status")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Record creation timestamp with timezone (UTC)",
    )
    started_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when processing started (NULL until AI execution)",
    )
    completed_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when processing completed (NULL until AI execution)",
    )


class AnalysisCreateResponse(BaseModel):
    """Standard API envelope response returned after creating an analysis request."""

    model_config = ConfigDict(extra="ignore")

    status: str = Field(default="success", description="Operation status", examples=["success"])
    message: str = Field(
        default="Analysis request created successfully.",
        description="Human-readable result message",
    )
    data: AnalysisResponseData = Field(
        ...,
        description="Analysis record matching DB schema",
    )


class AnalysisDetailResponse(BaseModel):
    """Standard API envelope response returned when retrieving analysis details."""

    model_config = ConfigDict(extra="ignore")

    status: str = Field(default="success", description="Operation status", examples=["success"])
    data: AnalysisResponseData = Field(
        ...,
        description="Analysis record matching DB schema",
    )

