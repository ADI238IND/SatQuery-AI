from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.models.base import BaseSpecialistModel
from app.schemas.image import ImageContext
from app.schemas.model_result import ModelResult


class BaseSpecialistAdapter(ABC):
    """
    Abstract base class for satellite reasoning specialist adapters.

    The adapter sits between the application (which works with ImageContext objects and queries)
    and the underlying framework-agnostic AI model implementation (BaseSpecialistModel).

    Responsibilities:
    1. Validate specialist-specific inputs (e.g. image counts, modalities).
    2. Convert application-level ImageContext objects into a raw, model-specific input dict.
    3. Delegate execution to the injected BaseSpecialistModel instance.
    """

    def __init__(self, name: str, model: Optional[BaseSpecialistModel] = None):
        self.name = name
        self.model = model

    @abstractmethod
    def prepare_inputs(self, query: str, images: List[ImageContext]) -> Dict[str, Any]:
        """
        Validates and converts ImageContext objects and query into a framework-agnostic
        input dictionary for the underlying AI model.
        """
        pass

    def process(self, query: str, images: List[ImageContext]) -> ModelResult:
        """
        Validates inputs, formats them for the model, and executes inference via model interface.
        """
        if self.model is None:
            raise RuntimeError(f"No BaseSpecialistModel instance configured for adapter '{self.name}'.")

        inputs = self.prepare_inputs(query, images)
        return self.model.process(inputs)
