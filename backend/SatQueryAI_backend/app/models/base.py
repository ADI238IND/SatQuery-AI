from abc import ABC, abstractmethod
from typing import Any, Dict
from app.schemas.model_result import ModelResult


class BaseSpecialistModel(ABC):
    """
    Abstract framework-agnostic interface for AI specialist model implementations.

    Concrete subclasses (e.g. PyTorch models, HuggingFace wrappers, ONNX models,
    or external API clients) receive raw Python data structures (bytes, dicts, numbers)
    and return a standardized ModelResult.

    This ensures complete decoupling: AI model implementations do NOT depend on
    application-level objects like ImageContext, FastAPI, or Supabase.
    """

    def __init__(self, model_name: str, model_version: str = "1.0.0"):
        self.model_name = model_name
        self.model_version = model_version

    @abstractmethod
    def process(self, inputs: Dict[str, Any]) -> ModelResult:
        """
        Executes model inference on raw input dictionary.

        Args:
            inputs: Framework-agnostic dictionary containing raw input data
                    (e.g., {"query": str, "image_bytes": bytes, ...}).

        Returns:
            ModelResult: Standardized output abstraction.
        """
        pass
