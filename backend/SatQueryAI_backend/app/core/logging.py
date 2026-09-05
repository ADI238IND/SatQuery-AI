import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """Configures root logging with custom format and level based on settings."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Set external loggers to match log level
    logging.getLogger("uvicorn.access").setLevel(log_level)


def get_logger(name: str) -> logging.Logger:
    """Returns a logger instance for the given module name."""
    return logging.getLogger(name)
