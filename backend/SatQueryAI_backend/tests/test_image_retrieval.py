"""
Tests for Phase 5: Image Retrieval, Supabase Storage Download, and ImageContext.

These tests verify:
1. GET /api/v1/images/{image_id} returns metadata for valid IDs
2. GET /api/v1/images/{invalid_id} returns 404 NotFoundException
3. ImageContext model construction and convenience properties
4. ImageService.get_image_context() combines DB record + image bytes
5. ImageRepository.download_image_bytes() path parsing
6. Existing upload flow is NOT broken
"""

import io
from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.core.exceptions import NotFoundException
from app.main import app
from app.repositories.image_repository import image_repository
from app.schemas.image import ImageContext, ImageResponseData
from app.services.image_service import image_service

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_png_bytes(size=(32, 32), color="blue") -> bytes:
    """Creates a minimal valid PNG in memory."""
    buf = io.BytesIO()
    Image.new("RGB", size, color=color).save(buf, format="PNG")
    return buf.getvalue()


def _upload_test_image(filename="retrieval_test.png", **form_data) -> dict:
    """Uploads a test image and returns the response JSON data dict."""
    raw = _create_png_bytes()
    resp = client.post(
        "/api/v1/images/upload",
        files={"file": (filename, raw, "image/png")},
        data=form_data,
    )
    assert resp.status_code == 201
    return resp.json()["data"]


# ---------------------------------------------------------------------------
# 1. GET endpoint – valid image_id returns metadata
# ---------------------------------------------------------------------------

class TestGetImageEndpoint:
    """Tests for GET /api/v1/images/{image_id} (already existing endpoint)."""

    def test_valid_image_id_returns_metadata(self):
        """Upload → GET by ID → verify all satellite_images fields present."""
        uploaded = _upload_test_image(
            filename="phase5_test.png",
            source="Sentinel-2",
            capture_date="2024-08-15",
            latitude="40.7128",
            longitude="-74.0060",
            resolution_m="10.0",
        )
        image_id = uploaded["image_id"]

        response = client.get(f"/api/v1/images/{image_id}")
        assert response.status_code == 200

        data = response.json()["data"]
        assert data["image_id"] == image_id
        assert data["file_name"].endswith("phase5_test.png")
        assert data["storage_path"] is not None
        assert data["file_type"] == "image/png"
        assert data["file_size"] > 0
        assert data["source"] == "Sentinel-2"
        assert data["capture_date"] == "2024-08-15"
        assert data["latitude"] == 40.7128
        assert data["longitude"] == -74.006
        assert data["resolution_m"] == 10.0
        assert "metadata" in data
        assert data["metadata"]["format"] == "PNG"

    def test_invalid_image_id_returns_404(self):
        """Non-existent UUID returns 404 NotFoundException."""
        response = client.get("/api/v1/images/ffffffff-ffff-ffff-ffff-ffffffffffff")
        assert response.status_code == 404

        body = response.json()
        assert body["status"] == "error"
        assert body["error_type"] == "NotFoundException"
        assert "ffffffff-ffff-ffff-ffff-ffffffffffff" in body["message"]

    def test_random_string_id_returns_404(self):
        """Arbitrary non-UUID string returns 404."""
        response = client.get("/api/v1/images/not-a-real-id")
        assert response.status_code == 404
        assert response.json()["error_type"] == "NotFoundException"


# ---------------------------------------------------------------------------
# 2. ImageContext model – construction and properties
# ---------------------------------------------------------------------------

class TestImageContextModel:
    """Unit tests for the ImageContext Pydantic model."""

    def _make_context(self, **overrides) -> ImageContext:
        defaults = dict(
            image_id="abc-123",
            file_name="scene.png",
            file_type="image/png",
            file_size=4096,
            storage_path="satellite-images/uploads/scene.png",
            image_bytes=b"\x89PNG\r\n\x1a\n" + b"\x00" * 100,
            source="Sentinel-2",
            capture_date=date(2024, 6, 15),
            latitude=37.7749,
            longitude=-122.4194,
            resolution_m=10.0,
            metadata={
                "format": "PNG",
                "dimensions": {"width": 64, "height": 64, "channels": 3},
                "crs": "EPSG:4326",
                "bounding_box": {"min_lat": 37.0, "max_lat": 38.0, "min_lon": -123.0, "max_lon": -122.0},
                "checksum_sha256": "abc123def456",
            },
            created_at=datetime(2024, 6, 15, 12, 0, 0, tzinfo=timezone.utc),
        )
        defaults.update(overrides)
        return ImageContext(**defaults)

    def test_all_fields_present(self):
        ctx = self._make_context()
        assert ctx.image_id == "abc-123"
        assert ctx.file_name == "scene.png"
        assert ctx.file_type == "image/png"
        assert ctx.file_size == 4096
        assert ctx.storage_path == "satellite-images/uploads/scene.png"
        assert ctx.source == "Sentinel-2"
        assert ctx.capture_date == date(2024, 6, 15)
        assert ctx.latitude == 37.7749
        assert ctx.longitude == -122.4194
        assert ctx.resolution_m == 10.0
        assert ctx.created_at is not None

    def test_has_image_bytes_true(self):
        ctx = self._make_context()
        assert ctx.has_image_bytes is True

    def test_has_image_bytes_false_when_none(self):
        ctx = self._make_context(image_bytes=None)
        assert ctx.has_image_bytes is False

    def test_has_image_bytes_false_when_empty(self):
        ctx = self._make_context(image_bytes=b"")
        assert ctx.has_image_bytes is False

    def test_dimensions_property(self):
        ctx = self._make_context()
        dims = ctx.dimensions
        assert dims["width"] == 64
        assert dims["height"] == 64
        assert dims["channels"] == 3

    def test_crs_property(self):
        ctx = self._make_context()
        assert ctx.crs == "EPSG:4326"

    def test_bounding_box_property(self):
        ctx = self._make_context()
        bb = ctx.bounding_box
        assert bb["min_lat"] == 37.0
        assert bb["max_lon"] == -122.0

    def test_properties_none_when_no_metadata(self):
        ctx = self._make_context(metadata=None)
        assert ctx.dimensions is None
        assert ctx.crs is None
        assert ctx.bounding_box is None

    def test_image_bytes_excluded_from_json(self):
        """image_bytes must not appear in JSON serialization."""
        ctx = self._make_context()
        json_dict = ctx.model_dump(mode="json")
        assert "image_bytes" not in json_dict


# ---------------------------------------------------------------------------
# 3. ImageService.get_image_context() – integration with mocked storage
# ---------------------------------------------------------------------------

class TestGetImageContext:
    """Tests for ImageService.get_image_context() service method."""

    def test_context_built_from_uploaded_image(self):
        """
        Upload an image, then call get_image_context.
        Since Supabase Storage may not be live in test, we mock
        download_image_bytes to return fake image bytes.
        """
        uploaded = _upload_test_image(
            filename="context_test.png",
            source="Landsat-8",
            latitude="35.0",
            longitude="-120.0",
        )
        image_id = uploaded["image_id"]

        fake_bytes = b"\x89PNG_FAKE_IMAGE_BYTES"
        with patch.object(
            image_repository, "download_image_bytes", return_value=fake_bytes
        ) as mock_dl:
            ctx = image_service.get_image_context(image_id)
            mock_dl.assert_called_once_with(uploaded["storage_path"])

        # Verify all context fields are populated
        assert ctx.image_id == image_id
        assert ctx.file_name.endswith("context_test.png")
        assert ctx.file_type == "image/png"
        assert ctx.file_size > 0
        assert ctx.storage_path == uploaded["storage_path"]
        assert ctx.image_bytes == fake_bytes
        assert ctx.has_image_bytes is True
        assert ctx.source == "Landsat-8"
        assert ctx.latitude == 35.0
        assert ctx.longitude == -120.0
        assert ctx.metadata is not None
        assert ctx.metadata["format"] == "PNG"

    def test_context_with_no_storage_available(self):
        """
        When download_image_bytes returns None (storage unavailable),
        ImageContext should still be built with image_bytes=None.
        """
        uploaded = _upload_test_image(filename="no_storage_test.png")
        image_id = uploaded["image_id"]

        with patch.object(
            image_repository, "download_image_bytes", return_value=None
        ):
            ctx = image_service.get_image_context(image_id)

        assert ctx.image_id == image_id
        assert ctx.image_bytes is None
        assert ctx.has_image_bytes is False
        # Metadata should still be fully populated from DB
        assert ctx.file_name.endswith("no_storage_test.png")
        assert ctx.metadata is not None

    def test_context_raises_404_for_nonexistent_id(self):
        """get_image_context should raise NotFoundException for invalid image_id."""
        with pytest.raises(NotFoundException):
            image_service.get_image_context("00000000-0000-0000-0000-000000000000")


# ---------------------------------------------------------------------------
# 4. Repository.download_image_bytes – path parsing unit tests
# ---------------------------------------------------------------------------

class TestDownloadImageBytesPathParsing:
    """Unit tests for ImageRepository.download_image_bytes() path handling."""

    def test_valid_path_calls_storage_download(self):
        """Verifies bucket/object path is correctly split and passed to Supabase."""
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_client.storage.from_.return_value = mock_bucket
        mock_bucket.download.return_value = b"IMAGE_DATA"

        with patch("app.repositories.image_repository.get_supabase_client", return_value=mock_client):
            result = image_repository.download_image_bytes("satellite-images/uploads/abc_scene.tif")

        mock_client.storage.from_.assert_called_once_with("satellite-images")
        mock_bucket.download.assert_called_once_with("uploads/abc_scene.tif")
        assert result == b"IMAGE_DATA"

    def test_no_client_returns_none(self):
        """When Supabase client is unavailable, returns None gracefully."""
        with patch("app.repositories.image_repository.get_supabase_client", return_value=None):
            result = image_repository.download_image_bytes("satellite-images/uploads/abc.png")
        assert result is None

    def test_invalid_path_format_returns_none(self):
        """A storage_path without '/' separator returns None."""
        mock_client = MagicMock()
        with patch("app.repositories.image_repository.get_supabase_client", return_value=mock_client):
            result = image_repository.download_image_bytes("no_slash_path")
        assert result is None

    def test_download_exception_returns_none(self):
        """If Supabase download raises an exception, returns None gracefully."""
        mock_client = MagicMock()
        mock_bucket = MagicMock()
        mock_client.storage.from_.return_value = mock_bucket
        mock_bucket.download.side_effect = Exception("Storage unavailable")

        with patch("app.repositories.image_repository.get_supabase_client", return_value=mock_client):
            result = image_repository.download_image_bytes("satellite-images/uploads/fail.png")
        assert result is None


# ---------------------------------------------------------------------------
# 5. Existing upload flow still works (regression guard)
# ---------------------------------------------------------------------------

class TestExistingUploadNotBroken:
    """Verify that Phase 4 upload functionality is preserved."""

    def test_png_upload_still_works(self):
        raw = _create_png_bytes(size=(48, 48), color="green")
        resp = client.post(
            "/api/v1/images/upload",
            files={"file": ("regression_test.png", raw, "image/png")},
        )
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["file_type"] == "image/png"
        assert data["metadata"]["format"] == "PNG"

    def test_list_images_still_works(self):
        resp = client.get("/api/v1/images?limit=5&offset=0")
        assert resp.status_code == 200
        payload = resp.json()
        assert payload["status"] == "success"
        assert isinstance(payload["items"], list)
