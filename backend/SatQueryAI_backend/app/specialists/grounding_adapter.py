from typing import Any, Dict, List, Optional
from app.core.exceptions import ValidationException
from app.models.base import BaseSpecialistModel
from app.models.placeholders import PlaceholderGroundingModel
from app.schemas.image import ImageContext
from app.specialists.base import BaseSpecialistAdapter


class RegionGroundingAdapter(BaseSpecialistAdapter):
    """Specialist adapter for Region Grounding and target localization on satellite imagery."""

    def __init__(self, model: Optional[BaseSpecialistModel] = None):
        super().__init__(name="RegionGrounding", model=model or PlaceholderGroundingModel())

    def prepare_inputs(self, query: str, images: List[ImageContext]) -> Dict[str, Any]:
        """
        Prepares inputs for Region Grounding model.
        Requires at least one ImageContext object.
        """
        if not images:
            raise ValidationException(
                message="Region Grounding specialist requires at least one satellite image.",
                details={"specialist": self.name, "images_provided": 0},
            )

        target_img = images[0]
        return {
            "query": query,
            "image_id": target_img.image_id,
            "file_name": target_img.file_name,
            "storage_path": target_img.storage_path,
            "image_bytes": target_img.image_bytes,
            "source": target_img.source,
            "latitude": target_img.latitude,
            "longitude": target_img.longitude,
            "resolution_m": target_img.resolution_m,
            "metadata": target_img.metadata or {},
        }
