from typing import Any, Dict, List, Optional
from app.core.exceptions import ValidationException
from app.models.base import BaseSpecialistModel
from app.models.placeholders import PlaceholderOpticalSARFusionModel
from app.schemas.image import ImageContext
from app.specialists.base import BaseSpecialistAdapter


class OpticalSARFusionAdapter(BaseSpecialistAdapter):
    """Specialist adapter for Optical-SAR multi-modal sensor fusion reasoning."""

    OPTICAL_INDICATORS = ("sentinel-2", "landsat", "optical", "planet", "modis", "rgb")
    SAR_INDICATORS = ("sentinel-1", "sar", "radar", "terrasar", "capella", "c-band")

    def __init__(self, model: Optional[BaseSpecialistModel] = None):
        super().__init__(name="OpticalSARFusion", model=model or PlaceholderOpticalSARFusionModel())

    def _detect_modality(self, img: ImageContext) -> Optional[str]:
        """
        Determines modality ('optical' or 'sar') from source and metadata.
        Returns None if modality cannot be conclusively determined.
        """
        search_terms = []
        if img.source:
            search_terms.append(img.source.lower())
        if img.metadata:
            for key in ("satellite_name", "sensor", "modality", "platform"):
                val = img.metadata.get(key)
                if val and isinstance(val, str):
                    search_terms.append(val.lower())

        text = " ".join(search_terms)
        is_opt = any(indicator in text for indicator in self.OPTICAL_INDICATORS)
        is_sar = any(indicator in text for indicator in self.SAR_INDICATORS)

        if is_opt and not is_sar:
            return "optical"
        if is_sar and not is_opt:
            return "sar"
        return None

    def prepare_inputs(self, query: str, images: List[ImageContext]) -> Dict[str, Any]:
        """
        Prepares inputs for Optical-SAR Fusion model.
        Validates that provided images include at least one Optical and one SAR scene.
        Raises ValidationException if modality cannot be determined or required pair is missing.
        """
        if len(images) < 2:
            raise ValidationException(
                message=f"Optical-SAR Fusion specialist requires at least 2 images (1 Optical and 1 SAR), but received {len(images)}.",
                details={"specialist": self.name, "images_provided": len(images)},
            )

        optical_img: Optional[ImageContext] = None
        sar_img: Optional[ImageContext] = None

        for img in images:
            modality = self._detect_modality(img)
            if modality == "optical" and optical_img is None:
                optical_img = img
            elif modality == "sar" and sar_img is None:
                sar_img = img

        if optical_img is None or sar_img is None:
            raise ValidationException(
                message=(
                    "Incompatible or missing metadata for Optical-SAR Fusion. "
                    "Could not definitively resolve 1 Optical image and 1 SAR image from provided metadata."
                ),
                details={
                    "specialist": self.name,
                    "optical_found": optical_img is not None,
                    "sar_found": sar_img is not None,
                },
            )

        return {
            "query": query,
            "optical_image": {
                "image_id": optical_img.image_id,
                "file_name": optical_img.file_name,
                "storage_path": optical_img.storage_path,
                "image_bytes": optical_img.image_bytes,
                "source": optical_img.source,
            },
            "sar_image": {
                "image_id": sar_img.image_id,
                "file_name": sar_img.file_name,
                "storage_path": sar_img.storage_path,
                "image_bytes": sar_img.image_bytes,
                "source": sar_img.source,
            },
        }
