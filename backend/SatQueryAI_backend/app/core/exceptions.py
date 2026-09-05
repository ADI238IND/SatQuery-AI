from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.logging import get_logger

logger = get_logger(__name__)


class SatqueryException(Exception):
    """Base exception for all Satquery custom domain exceptions."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class NotFoundException(SatqueryException):
    """Exception raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, details=details)


class ValidationException(SatqueryException):
    """Exception raised when domain validation fails."""

    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, details=details)


async def satquery_exception_handler(request: Request, exc: SatqueryException) -> JSONResponse:
    """FastAPI exception handler for custom Satquery exceptions."""
    logger.warning(
        f"SatqueryException on {request.method} {request.url.path}: {exc.message} | Details: {exc.details}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error_type": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback FastAPI exception handler for unhandled exceptions."""
    logger.exception(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error_type": "InternalServerError",
            "message": "An unexpected error occurred. Please try again later.",
            "details": {},
        },
    )
