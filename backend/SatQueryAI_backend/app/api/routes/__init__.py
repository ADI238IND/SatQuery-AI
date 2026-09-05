"""API routes package."""

from app.api.routes.analyses import router as analyses_router
from app.api.routes.health import router as health_router
from app.api.routes.images import router as images_router

__all__ = ["health_router", "images_router", "analyses_router"]

