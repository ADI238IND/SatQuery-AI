import time
from typing import Any, Dict
from app.models.base import BaseSpecialistModel
from app.schemas.model_result import ModelResult


class PlaceholderVQAModel(BaseSpecialistModel):
    """Placeholder model implementation for Visual Question Answering."""

    def __init__(self):
        super().__init__(model_name="Placeholder-VQA-v1", model_version="1.0.0")

    def process(self, inputs: Dict[str, Any]) -> ModelResult:
        start_time = time.perf_counter()
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return ModelResult(
            status="NOT_IMPLEMENTED",
            result={"message": "VQA model execution not implemented yet. Pipeline abstraction ready for AI model integration."},
            confidence=0.0,
            evidence={},
            limitations=["Placeholder model implementation - no actual AI inference executed."],
            model_name=self.model_name,
            model_version=self.model_version,
            processing_time_ms=elapsed_ms,
            metadata={"inputs_received": list(inputs.keys())},
        )


class PlaceholderGroundingModel(BaseSpecialistModel):
    """Placeholder model implementation for Region Grounding."""

    def __init__(self):
        super().__init__(model_name="Placeholder-Grounding-v1", model_version="1.0.0")

    def process(self, inputs: Dict[str, Any]) -> ModelResult:
        start_time = time.perf_counter()
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return ModelResult(
            status="NOT_IMPLEMENTED",
            result={"message": "Region Grounding model execution not implemented yet. Pipeline abstraction ready for AI model integration."},
            confidence=0.0,
            evidence={},
            limitations=["Placeholder model implementation - no actual AI inference executed."],
            model_name=self.model_name,
            model_version=self.model_version,
            processing_time_ms=elapsed_ms,
            metadata={"inputs_received": list(inputs.keys())},
        )


class PlaceholderChangeDetectionModel(BaseSpecialistModel):
    """Placeholder model implementation for Change Detection."""

    def __init__(self):
        super().__init__(model_name="Placeholder-ChangeDetection-v1", model_version="1.0.0")

    def process(self, inputs: Dict[str, Any]) -> ModelResult:
        start_time = time.perf_counter()
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return ModelResult(
            status="NOT_IMPLEMENTED",
            result={"message": "Change Detection model execution not implemented yet. Pipeline abstraction ready for AI model integration."},
            confidence=0.0,
            evidence={},
            limitations=["Placeholder model implementation - no actual AI inference executed."],
            model_name=self.model_name,
            model_version=self.model_version,
            processing_time_ms=elapsed_ms,
            metadata={"inputs_received": list(inputs.keys())},
        )


class PlaceholderOpticalSARFusionModel(BaseSpecialistModel):
    """Placeholder model implementation for Optical-SAR Fusion."""

    def __init__(self):
        super().__init__(model_name="Placeholder-Fusion-v1", model_version="1.0.0")

    def process(self, inputs: Dict[str, Any]) -> ModelResult:
        start_time = time.perf_counter()
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return ModelResult(
            status="NOT_IMPLEMENTED",
            result={"message": "Optical-SAR Fusion model execution not implemented yet. Pipeline abstraction ready for AI model integration."},
            confidence=0.0,
            evidence={},
            limitations=["Placeholder model implementation - no actual AI inference executed."],
            model_name=self.model_name,
            model_version=self.model_version,
            processing_time_ms=elapsed_ms,
            metadata={"inputs_received": list(inputs.keys())},
        )
