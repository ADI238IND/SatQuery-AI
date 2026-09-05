from typing import Any, Dict, List, Optional
from app.core.exceptions import ValidationException
from app.models.base import BaseSpecialistModel
from app.models.placeholders import PlaceholderChangeDetectionModel
from app.schemas.image import ImageContext
from app.specialists.base import BaseSpecialistAdapter


class ChangeDetectionAdapter(BaseSpecialistAdapter):
    """Specialist adapter for bi-temporal Change Detection between two satellite scenes."""

    def __init__(self, model: Optional[BaseSpecialistModel] = None):
        super().__init__(name="ChangeDetection", model=model or PlaceholderChangeDetectionModel())

    def prepare_inputs(self, query: str, images: List[ImageContext]) -> Dict[str, Any]:
        """
        Prepares inputs for Change Detection model.
        Validates that exactly two ImageContext objects are provided.
        """
        if len(images) != 2:
            raise ValidationException(
                message=f"Change Detection specialist requires exactly 2 satellite images, but received {len(images)}.",
                details={"specialist": self.name, "images_provided": len(images)},
            )

        return {
            "query": query,
            "image_1": {
                "image_id": images[0].image_id,
                "file_name": images[0].file_name,
                "storage_path": images[0].storage_path,
                "image_bytes": images[0].image_bytes,
                "source": images[0].source,
            },
            "image_2": {
                "image_id": images[1].image_id,
                "file_name": images[1].file_name,
                "storage_path": images[1].storage_path,
                "image_bytes": images[1].image_bytes,
                "source": images[1].source,
            },
        }
