from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(..., description="Overall service status", examples=["ok"])
    project_name: str = Field(..., description="Project name", examples=["Satquery"])
    version: str = Field(..., description="Application version", examples=["0.1.0"])
    environment: str = Field(..., description="Current environment", examples=["development"])
    timestamp: datetime = Field(..., description="UTC timestamp of the health check")
