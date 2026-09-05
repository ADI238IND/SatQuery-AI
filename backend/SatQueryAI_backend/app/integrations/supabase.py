from typing import Any, Optional
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_supabase_client: Optional[Any] = None


def get_supabase_client() -> Optional[Any]:
    """
    Initializes and returns the Supabase client singleton.
    Returns None if default placeholder credentials are in place or initialization fails.
    """
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY

    is_placeholder = (
        not url
        or not key
        or "your-project-id" in url
        or "your-supabase" in key
    )

    if is_placeholder:
        logger.info(
            "Supabase credentials in .env are placeholder values. "
            "Please configure SUPABASE_URL and SUPABASE_KEY in .env when ready."
        )
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
