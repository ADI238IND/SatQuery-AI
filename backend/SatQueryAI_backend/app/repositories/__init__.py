"""Data access repositories module."""

from app.repositories.analysis_repository import AnalysisRepository, analysis_repository
from app.repositories.image_repository import ImageRepository, image_repository

__all__ = ["ImageRepository", "image_repository", "AnalysisRepository", "analysis_repository"]

