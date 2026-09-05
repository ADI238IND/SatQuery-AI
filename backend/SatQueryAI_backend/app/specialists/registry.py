from typing import Dict, List, Optional
from app.specialists.base import BaseSpecialistAdapter
from app.specialists.vqa_adapter import VisualVQAAdapter
from app.specialists.grounding_adapter import RegionGroundingAdapter
from app.specialists.change_detection_adapter import ChangeDetectionAdapter
from app.specialists.optical_sar_fusion_adapter import OpticalSARFusionAdapter


class SpecialistRegistry:
    """
    Registry for managing available specialist adapters.
    Allows runtime registration and dependency injection of custom adapters or models.
    """

    def __init__(self):
        self._adapters: Dict[str, BaseSpecialistAdapter] = {}

    def register(self, key: str, adapter: BaseSpecialistAdapter) -> None:
        """Registers a specialist adapter under a unique string key."""
        self._adapters[key.lower()] = adapter

    def get(self, key: str) -> BaseSpecialistAdapter:
        """Retrieves a registered specialist adapter by key."""
        key_clean = key.lower()
        if key_clean not in self._adapters:
            raise KeyError(f"Specialist adapter '{key}' is not registered in SpecialistRegistry.")
        return self._adapters[key_clean]

    def has(self, key: str) -> bool:
        """Checks if a specialist adapter is registered."""
        return key.lower() in self._adapters

    def list_specialists(self) -> List[str]:
        """Lists all registered specialist adapter keys."""
        return list(self._adapters.keys())


def create_default_specialist_registry() -> SpecialistRegistry:
    """Factory creating a SpecialistRegistry with default placeholder adapters."""
    registry = SpecialistRegistry()
    registry.register("vqa", VisualVQAAdapter())
    registry.register("region_grounding", RegionGroundingAdapter())
    registry.register("change_detection", ChangeDetectionAdapter())
    registry.register("optical_sar_fusion", OpticalSARFusionAdapter())
    return registry
