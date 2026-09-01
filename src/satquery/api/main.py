from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field

from satquery.orchestrator import plan_analysis

app = FastAPI(
    title="SatQuery AI API",
    version="0.1.0",
    description="MVP API scaffold for SIH26167 SatQuery AI",
)


class RouteRequest(BaseModel):
    query: str = Field(min_length=1)
    image_count: int = Field(default=1, ge=0, le=8)
    modalities: list[str] = Field(default_factory=list)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "satquery-ai"}


@app.post("/route")
def route(request: RouteRequest) -> dict:
    return plan_analysis(request.query, request.image_count, request.modalities)
