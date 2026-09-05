from abc import ABC, abstractmethod
from typing import List
from app.schemas.image import ImageContext
from app.schemas.model_result import ModelSelectionResult


class BaseModelSelector(ABC):
    """
    Abstract interface for model selector routers.

    Decouples query/image analysis from the rest of the application.
    Can be subclassed later by ML or LLM-based intelligent routers without changing
    the service, controller, or specialist adapter layer.
    """

    @abstractmethod
    def select_specialist(self, query: str, images: List[ImageContext]) -> ModelSelectionResult:
        """
        Analyzes query and input imagery to select the appropriate specialist workflow.

        Args:
            query: Natural language request.
            images: List of loaded ImageContext objects.

        Returns:
            ModelSelectionResult: Decision result with selected_specialist key, confidence, and signals.
        """
        pass


class PlaceholderModelSelector(BaseModelSelector):
    """
    True placeholder implementation of BaseModelSelector.
    Returns a controlled placeholder selection with zero confidence and explicit signals.
    Does not use pseudo-intelligent heuristics.
    """

    def __init__(self, default_specialist: str = "vqa"):
        self.default_specialist = default_specialist

    def select_specialist(self, query: str, images: List[ImageContext]) -> ModelSelectionResult:
        return ModelSelectionResult(
            selected_specialist=self.default_specialist,
            confidence=0.0,
            reason="Placeholder selector - ML/LLM router not integrated.",
            signals={
                "mode": "placeholder",
                "image_count": len(images),
                "query_length": len(query) if query else 0,
            },
        )
