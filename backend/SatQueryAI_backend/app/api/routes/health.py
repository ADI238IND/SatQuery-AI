from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Returns the operational status, service metadata, and server timestamp.",
)
async def health_check() -> HealthResponse:
    """Endpoint verifying service health."""
    return HealthResponse(
        status="ok",
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENV,
        timestamp=datetime.now(timezone.utc),
    )
