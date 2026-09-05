from typing import List, Optional, Tuple
from app.core.logging import get_logger
from app.router.model_selector import BaseModelSelector, PlaceholderModelSelector
from app.schemas.image import ImageContext
from app.schemas.model_result import ModelResult, ModelSelectionResult
from app.specialists.registry import SpecialistRegistry, create_default_specialist_registry

logger = get_logger(__name__)


class ModelPipelineService:
    """
    Orchestration service connecting model selection router with specialist adapters.

    Pipeline Flow:
      ImageContext[] + query
            │
            ▼
      ModelSelector (BaseModelSelector)
            │
            ▼ (ModelSelectionResult)
      SpecialistRegistry (gets matching BaseSpecialistAdapter)
            │
            ▼
      SpecialistAdapter (prepares inputs & calls BaseSpecialistModel)
            │
            ▼
      Standardized ModelResult

    Demonstrates strict loose coupling: Depends strictly on interfaces (BaseModelSelector,
    SpecialistRegistry) rather than directly instantiating concrete model libraries.
    All components are fully injectable.
    """

    def __init__(
        self,
        selector: Optional[BaseModelSelector] = None,
        registry: Optional[SpecialistRegistry] = None,
    ):
        self.selector = selector or PlaceholderModelSelector()
        self.registry = registry or create_default_specialist_registry()

    def run_pipeline(
        self,
        query: str,
        images: List[ImageContext],
        force_specialist: Optional[str] = None,
    ) -> Tuple[ModelSelectionResult, ModelResult]:
        """
        Executes model pipeline for the provided query and imagery contexts.

        Args:
            query: Natural language query.
            images: List of loaded ImageContext domain objects.
            force_specialist: Optional specialist key to override selector decision.

        Returns:
            Tuple[ModelSelectionResult, ModelResult]: Router decision and model output.
        """
        if force_specialist:
            selection = ModelSelectionResult(
                selected_specialist=force_specialist,
                confidence=1.0,
                reason=f"Explicit specialist override: '{force_specialist}'",
                signals={"override": True},
            )
        else:
            selection = self.selector.select_specialist(query=query, images=images)

        logger.info(
            f"Pipeline selected specialist '{selection.selected_specialist}' "
            f"with confidence={selection.confidence:.2f} (reason: {selection.reason})."
        )

        adapter = self.registry.get(selection.selected_specialist)
        model_result = adapter.process(query=query, images=images)

        return selection, model_result


# Global singleton instance with default injection
pipeline_service = ModelPipelineService()
