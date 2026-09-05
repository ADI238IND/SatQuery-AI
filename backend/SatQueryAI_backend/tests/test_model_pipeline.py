from datetime import datetime, timezone
from typing import Any, Dict
import pytest

from app.core.exceptions import ValidationException
from app.models.base import BaseSpecialistModel
from app.models.placeholders import (
    PlaceholderChangeDetectionModel,
    PlaceholderGroundingModel,
    PlaceholderOpticalSARFusionModel,
    PlaceholderVQAModel,
)
from app.router.model_selector import PlaceholderModelSelector
from app.schemas.image import ImageContext
from app.schemas.model_result import ModelResult, ModelSelectionResult
from app.services.pipeline_service import ModelPipelineService
from app.specialists.change_detection_adapter import ChangeDetectionAdapter
from app.specialists.grounding_adapter import RegionGroundingAdapter
from app.specialists.optical_sar_fusion_adapter import OpticalSARFusionAdapter
from app.specialists.registry import SpecialistRegistry, create_default_specialist_registry
from app.specialists.vqa_adapter import VisualVQAAdapter


def _create_mock_image_context(
    image_id: str = "0093af25-c50a-4c2c-a052-ac8c0a75aa4a",
    source: str = "Sentinel-2",
    sensor: str = "MSI",
) -> ImageContext:
    """Helper to create dummy ImageContext for testing."""
    return ImageContext(
        image_id=image_id,
        file_name="scene.png",
        file_type="image/png",
        file_size=1024,
        storage_path=f"satellite-images/uploads/{image_id}.png",
        image_bytes=b"dummy_binary_bytes",
        source=source,
        capture_date=None,
        latitude=37.7749,
        longitude=-122.4194,
        resolution_m=10.0,
        metadata={"satellite_name": source, "sensor": sensor},
        created_at=datetime.now(timezone.utc),
    )


def test_placeholder_model_selector():
    """Test PlaceholderModelSelector returns controlled placeholder selection without fake heuristics."""
    selector = PlaceholderModelSelector(default_specialist="vqa")
    img = _create_mock_image_context()
    selection = selector.select_specialist(query="What is visible?", images=[img])

    assert isinstance(selection, ModelSelectionResult)
    assert selection.selected_specialist == "vqa"
    assert selection.confidence == 0.0
    assert "Placeholder selector" in selection.reason
    assert selection.signals["mode"] == "placeholder"


def test_vqa_adapter_input_preparation_and_execution():
    """Test VisualVQAAdapter converts ImageContext to raw dict and calls placeholder model."""
    adapter = VisualVQAAdapter()
    img = _create_mock_image_context()
    result = adapter.process(query="Is there flooding?", images=[img])

    assert isinstance(result, ModelResult)
    assert result.status == "NOT_IMPLEMENTED"
    assert result.model_name == "Placeholder-VQA-v1"
    assert len(result.limitations) > 0


def test_vqa_adapter_empty_images_raises_validation_exception():
    """Test VisualVQAAdapter raises ValidationException when no images are provided."""
    adapter = VisualVQAAdapter()
    with pytest.raises(ValidationException, match="requires at least one satellite image"):
        adapter.process(query="Is there flooding?", images=[])


def test_change_detection_adapter_validation():
    """Test ChangeDetectionAdapter strictly validates mandatory 2-image count requirement."""
    adapter = ChangeDetectionAdapter()
    img1 = _create_mock_image_context(image_id="11111111-1111-1111-1111-111111111111")
    img2 = _create_mock_image_context(image_id="22222222-2222-2222-2222-222222222222")
    img3 = _create_mock_image_context(image_id="33333333-3333-3333-3333-333333333333")

    # 0 images -> raises ValidationException
    with pytest.raises(ValidationException, match="requires exactly 2 satellite images"):
        adapter.process(query="Compare images", images=[])

    # 1 image -> raises ValidationException
    with pytest.raises(ValidationException, match="requires exactly 2 satellite images"):
        adapter.process(query="Compare images", images=[img1])

    # 3 images -> raises ValidationException
    with pytest.raises(ValidationException, match="requires exactly 2 satellite images"):
        adapter.process(query="Compare images", images=[img1, img2, img3])

    # 2 images -> succeeds returning NOT_IMPLEMENTED
    res = adapter.process(query="Compare images", images=[img1, img2])
    assert res.status == "NOT_IMPLEMENTED"
    assert res.model_name == "Placeholder-ChangeDetection-v1"


def test_change_detection_adapter_custom_model_injection():
    """Test ChangeDetectionAdapter with custom BaseSpecialistModel injected."""

    class CustomChangeDetectionModel(BaseSpecialistModel):
        def __init__(self):
            super().__init__(model_name="Custom-SiamUNet-CD", model_version="1.5.0")

        def process(self, inputs: Dict[str, Any]) -> ModelResult:
            assert "image_1" in inputs
            assert "image_2" in inputs
            return ModelResult(
                status="success",
                result={"change_map": "change_mask.png", "changed_area_sqkm": 2.4},
                confidence=0.89,
                model_name=self.model_name,
                model_version=self.model_version,
            )

    custom_model = CustomChangeDetectionModel()
    adapter = ChangeDetectionAdapter(model=custom_model)

    img1 = _create_mock_image_context(image_id="11111111-1111-1111-1111-111111111111")
    img2 = _create_mock_image_context(image_id="22222222-2222-2222-2222-222222222222")

    result = adapter.process(query="Detect changes", images=[img1, img2])
    assert result.status == "success"
    assert result.confidence == 0.89
    assert result.model_name == "Custom-SiamUNet-CD"
    assert result.result["changed_area_sqkm"] == 2.4



def test_optical_sar_fusion_adapter_modality_detection():
    """Test OpticalSARFusionAdapter detects Optical and SAR modalities from metadata."""
    adapter = OpticalSARFusionAdapter()
    opt_img = _create_mock_image_context(image_id="11111111-1111-1111-1111-111111111111", source="Sentinel-2")
    sar_img = _create_mock_image_context(image_id="22222222-2222-2222-2222-222222222222", source="Sentinel-1")

    result = adapter.process(query="Fuse optical and SAR data", images=[opt_img, sar_img])
    assert result.status == "NOT_IMPLEMENTED"
    assert result.model_name == "Placeholder-Fusion-v1"


def test_optical_sar_fusion_adapter_unresolvable_modality_raises_exception():
    """Test OpticalSARFusionAdapter raises ValidationException when modalities cannot be determined."""
    adapter = OpticalSARFusionAdapter()
    img1 = _create_mock_image_context(image_id="11111111-1111-1111-1111-111111111111", source="UnknownPlatform")
    img2 = _create_mock_image_context(image_id="22222222-2222-2222-2222-222222222222", source="UnknownPlatform")

    with pytest.raises(ValidationException, match="Incompatible or missing metadata"):
        adapter.process(query="Fuse optical and SAR data", images=[img1, img2])


def test_model_replaceability_custom_model_injection():
    """
    Demonstrates model replaceability:
    Replacing a placeholder model with a concrete AI model implementation (e.g. PyTorch/HuggingFace wrapper)
    requires ONLY subclassing BaseSpecialistModel and passing it to the adapter.
    Zero changes are required in adapters, services, routers, or repositories!
    """

    class CustomPyTorchVQAModel(BaseSpecialistModel):
        def __init__(self):
            super().__init__(model_name="Custom-PyTorch-VQA-ResNet", model_version="2.1.0")

        def process(self, inputs: Dict[str, Any]) -> ModelResult:
            # Simulate real AI model output
            return ModelResult(
                status="success",
                result={"answer": "Urban building detected with high density", "box": [10, 20, 100, 200]},
                confidence=0.92,
                evidence={"heatmaps": "attention_map.png"},
                limitations=["Trained on daylight imagery only."],
                model_name=self.model_name,
                model_version=self.model_version,
                processing_time_ms=45.2,
                metadata={"inputs_processed": list(inputs.keys())},
            )

    # Inject custom AI model into VisualVQAAdapter
    custom_adapter = VisualVQAAdapter(model=CustomPyTorchVQAModel())
    img = _create_mock_image_context()

    result = custom_adapter.process(query="What is in this region?", images=[img])

    assert result.status == "success"
    assert result.confidence == 0.92
    assert result.model_name == "Custom-PyTorch-VQA-ResNet"
    assert result.result["answer"] == "Urban building detected with high density"


def test_pipeline_service_end_to_end():
    """Test ModelPipelineService end-to-end execution with dependency injection."""
    pipeline = ModelPipelineService()
    img = _create_mock_image_context()

    selection, model_result = pipeline.run_pipeline(query="Describe scene", images=[img])

    assert selection.selected_specialist == "vqa"
    assert model_result.status == "NOT_IMPLEMENTED"
    assert model_result.model_name == "Placeholder-VQA-v1"


def test_pipeline_service_forced_specialist_override():
    """Test ModelPipelineService with forced specialist override."""
    pipeline = ModelPipelineService()
    opt_img = _create_mock_image_context(image_id="11111111-1111-1111-1111-111111111111", source="Sentinel-2")
    sar_img = _create_mock_image_context(image_id="22222222-2222-2222-2222-222222222222", source="Sentinel-1")

    selection, model_result = pipeline.run_pipeline(
        query="Fuse scene data",
        images=[opt_img, sar_img],
        force_specialist="optical_sar_fusion",
    )

    assert selection.selected_specialist == "optical_sar_fusion"
    assert selection.signals["override"] is True
    assert model_result.status == "NOT_IMPLEMENTED"
    assert model_result.model_name == "Placeholder-Fusion-v1"
