import io
import hashlib
import numpy as np
import pytest
import tifffile
from PIL import Image
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.repositories.image_repository import image_repository
from app.schemas.image import (
    GeoBoundingBox,
    GeoCoordinates,
    ImageDimensions,
    ImageResponseData,
    ImageUploadResponse,
    SatelliteMetadata,
)

client = TestClient(app)


def create_test_image_bytes(format: str = "PNG", size: tuple[int, int] = (128, 128), color: str = "green") -> bytes:
    """Generates valid standard image bytes in memory."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def create_geotiff_bytes(
    size: tuple[int, int] = (64, 64),
    pixel_scale: tuple[float, float, float] = (10.0, 10.0, 0.0),
    tiepoint: tuple[float, float, float, float, float, float] = (0.0, 0.0, 0.0, 500000.0, 4649776.0, 0.0),
    epsg_code: int = 32633,
) -> bytes:
    """Generates valid GeoTIFF bytes in memory with embedded GeoTIFF tags."""
    data = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    bio = io.BytesIO()
    extratags = [
        (33550, "d", 3, pixel_scale, False),  # ModelPixelScaleTag
        (33922, "d", 6, tiepoint, False),  # ModelTiepointTag
        (34735, "H", 12, (1, 1, 0, 2, 1024, 0, 1, 1, 3072, 0, 1, epsg_code), False),  # GeoKeyDirectory
        (306, "s", 20, "2024:06:15 10:30:00\x00", False),  # DateTime
    ]
    tifffile.imwrite(bio, data, description="Sentinel-2", extratags=extratags)
    return bio.getvalue()


# --- Schema Unit Tests ---


def test_satellite_images_table_schema_fields():
    """Verify ImageResponseData has exactly the 12 fields defined in satellite_images table."""
    expected_fields = {
        "image_id",
        "file_name",
        "storage_path",
        "file_type",
        "file_size",
        "source",
        "capture_date",
        "latitude",
        "longitude",
        "resolution_m",
        "metadata",
        "created_at",
    }
    model_fields = set(ImageResponseData.model_fields.keys())
    assert expected_fields.issubset(model_fields)


def test_repository_db_payload_mapping():
    """Verify ImageRepository produces database payload matching satellite_images columns."""
    sample = ImageResponseData(
        image_id="11111111-2222-3333-4444-555555555555",
        file_name="test_scene.tif",
        storage_path="satellite-images/uploads/test_scene.tif",
        file_type="image/tiff",
        file_size=1024,
        source="Sentinel-2",
        latitude=37.7749,
        longitude=-122.4194,
        resolution_m=10.0,
        metadata={"dimensions": {"width": 100, "height": 100}},
    )
    payload = image_repository._to_db_payload(sample)

    assert payload["image_id"] == "11111111-2222-3333-4444-555555555555"
    assert payload["file_name"] == "test_scene.tif"
    assert payload["storage_path"] == "satellite-images/uploads/test_scene.tif"
    assert payload["file_type"] == "image/tiff"
    assert payload["file_size"] == 1024
    assert payload["source"] == "Sentinel-2"
    assert payload["latitude"] == 37.7749
    assert payload["longitude"] == -122.4194
    assert payload["resolution_m"] == 10.0
    assert payload["metadata"]["dimensions"]["width"] == 100
    assert "created_at" in payload


# --- GeoTIFF Geospatial Extraction Tests ---


def test_upload_geotiff_extracts_geospatial_metadata():
    """
    Test uploading a .tiff GeoTIFF file:
    Verifies automatic extraction of latitude, longitude (reprojected to WGS84),
    spatial resolution (resolution_m), capture_date, source, and bounding_box.
    """
    geotiff_bytes = create_geotiff_bytes()
    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("sentinel2_rome.tif", geotiff_bytes, "image/tiff")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "success"

    data = payload["data"]
    # Table schema fields verification
    assert "image_id" in data
    assert data["file_name"].endswith("sentinel2_rome.tif")
    assert "uploads/" in data["storage_path"]
    assert data["file_type"] == "image/tiff"
    assert data["file_size"] == len(geotiff_bytes)

    # Geospatial auto-extracted fields
    assert data["resolution_m"] == 10.0
    assert data["latitude"] is not None
    assert data["longitude"] is not None
    # UTM 33N 500000, 4649776 corresponds to approx lat 41.99, lon 15.00
    assert 41.0 < data["latitude"] < 43.0
    assert 14.0 < data["longitude"] < 16.0

    # Auto-extracted capture date and source from TIFF tags
    assert data["capture_date"] == "2024-06-15"
    assert "Sentinel-2" in data["source"]

    # Metadata JSONB fields
    meta = data["metadata"]
    assert meta["format"] == "TIFF"
    assert meta["crs"] == "EPSG:32633"
    assert "bounding_box" in meta
    assert meta["dimensions"]["width"] == 64
    assert meta["dimensions"]["height"] == 64


def test_upload_geographic_wgs84_geotiff():
    """Test GeoTIFF with direct WGS84 lat/lon coordinates."""
    data = np.zeros((50, 50, 3), dtype=np.uint8)
    bio = io.BytesIO()
    extratags = [
        (33550, "d", 3, (0.0001, 0.0001, 0.0), False),
        (33922, "d", 6, (0.0, 0.0, 0.0, -122.4194, 37.7749, 0.0), False),
        (34735, "H", 8, (1, 1, 0, 1, 1024, 0, 1, 2), False),  # Geographic
    ]
    tifffile.imwrite(bio, data, extratags=extratags)
    geo_bytes = bio.getvalue()

    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("sf_bay.tif", geo_bytes, "image/tiff")},
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert -122.5 < data["longitude"] < -122.3
    assert 37.7 < data["latitude"] < 37.8
    assert data["resolution_m"] is not None


# --- Standard Image Tests (PNG & JPEG) ---


def test_upload_png_with_table_fields():
    """Test uploading a PNG image with user form fields inserted according to satellite_images schema."""
    raw_bytes = create_test_image_bytes(format="PNG", size=(64, 64), color="blue")
    expected_sha256 = hashlib.sha256(raw_bytes).hexdigest()

    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("urban_sentinel.png", raw_bytes, "image/png")},
        data={
            "source": "Sentinel-2",
            "capture_date": "2024-05-20",
            "latitude": "37.7749",
            "longitude": "-122.4194",
            "resolution_m": "10.0",
            "title": "SF Urban Footprint",
            "tags": "urban,sentinel2",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "success"

    data = payload["data"]
    assert data["file_name"].endswith("urban_sentinel.png")
    assert data["file_type"] == "image/png"
    assert data["file_size"] == len(raw_bytes)
    assert data["source"] == "Sentinel-2"
    assert data["capture_date"] == "2024-05-20"
    assert data["latitude"] == 37.7749
    assert data["longitude"] == -122.4194
    assert data["resolution_m"] == 10.0

    # Extended JSONB metadata
    assert data["metadata"]["format"] == "PNG"
    assert data["metadata"]["checksum_sha256"] == expected_sha256
    assert data["metadata"]["title"] == "SF Urban Footprint"
    assert "urban" in data["metadata"]["tags"]


def test_upload_jpeg_without_geo_defaults_to_none():
    """Test standard JPEG without geo information defaults nullable columns to None."""
    raw_bytes = create_test_image_bytes(format="JPEG", size=(50, 50), color="red")

    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("plain_scene.jpg", raw_bytes, "image/jpeg")},
    )

    assert response.status_code == 201
    data = response.json()["data"]

    # Nullable columns in satellite_images table
    assert data["source"] is None
    assert data["capture_date"] is None
    assert data["latitude"] is None
    assert data["longitude"] is None
    assert data["resolution_m"] is None

    # Required columns are present
    assert data["image_id"] is not None
    assert data["file_name"].endswith("plain_scene.jpg")
    assert data["file_type"] == "image/jpeg"
    assert data["file_size"] == len(raw_bytes)
    assert data["metadata"]["format"] == "JPEG"


def test_get_uploaded_image_by_id():
    """Test retrieving image record by image_id."""
    raw_bytes = create_test_image_bytes(format="PNG", size=(40, 40))
    upload_res = client.post(
        "/api/v1/images/upload",
        files={"file": ("retrieve_test.png", raw_bytes, "image/png")},
    )
    assert upload_res.status_code == 201
    image_id = upload_res.json()["data"]["image_id"]

    get_res = client.get(f"/api/v1/images/{image_id}")
    assert get_res.status_code == 200
    get_payload = get_res.json()
    assert get_payload["status"] == "success"
    assert get_payload["data"]["image_id"] == image_id
    assert get_payload["data"]["file_name"].endswith("retrieve_test.png")


def test_get_nonexistent_image_returns_404():
    """Test GET /api/v1/images/{non_existent_id} returns 404."""
    response = client.get("/api/v1/images/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    data = response.json()
    assert data["status"] == "error"
    assert data["error_type"] == "NotFoundException"


def test_list_uploaded_images():
    """Test listing images from satellite_images."""
    response = client.get("/api/v1/images?limit=10&offset=0")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["total"] >= 1
    assert isinstance(payload["items"], list)


def test_upload_invalid_corrupt_file_rejected():
    """Test uploading non-image binary returns 422 validation error."""
    fake_content = b"This is plain text and not a valid satellite image."
    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("fake_image.png", fake_content, "image/png")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert data["error_type"] == "ValidationException"


def test_upload_empty_file_rejected():
    """Test uploading 0-byte file returns 422 validation error."""
    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("empty.png", b"", "image/png")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert data["error_type"] == "ValidationException"


def test_upload_multispectral_uint16_geotiff_rasterio():
    """
    Test uploading a 12-band uint16 GeoTIFF (Sentinel-2 style) parsed with Rasterio.
    This type of satellite imagery typically fails in Pillow but succeeds with Rasterio.
    """
    import rasterio
    from rasterio.io import MemoryFile

    # Generate 12-band uint16 GeoTIFF in memory
    data = np.zeros((12, 64, 64), dtype=np.uint16)
    transform_matrix = rasterio.transform.from_origin(500000, 4649776, 10, 10)

    with MemoryFile() as memfile:
        with memfile.open(
            driver="GTiff",
            width=64,
            height=64,
            count=12,
            dtype="uint16",
            crs="EPSG:32633",
            transform=transform_matrix,
        ) as dst:
            dst.write(data)
        raw_bytes = memfile.read()

    response = client.post(
        "/api/v1/images/upload",
        files={"file": ("sentinel2_12band.tif", raw_bytes, "image/tiff")},
        data={"source": "Sentinel-2 MSI", "capture_date": "2024-07-01"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "success"

    data_rec = payload["data"]
    assert data_rec["file_type"] == "image/tiff"
    assert data_rec["source"] == "Sentinel-2 MSI"
    assert data_rec["capture_date"] == "2024-07-01"
    assert data_rec["resolution_m"] == 10.0
    assert data_rec["metadata"]["dimensions"]["channels"] == 12
    assert data_rec["metadata"]["dimensions"]["width"] == 64
    assert data_rec["metadata"]["dimensions"]["height"] == 64
    assert data_rec["latitude"] is not None
    assert data_rec["longitude"] is not None
