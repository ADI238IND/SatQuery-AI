from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ImageDimensions(BaseModel):
    """Visual dimensions and channel count of an image."""

    model_config = ConfigDict(extra="ignore")

    width: int = Field(..., gt=0, description="Image width in pixels", examples=[1024])
    height: int = Field(..., gt=0, description="Image height in pixels", examples=[1024])
    channels: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of color or spectral channels",
        examples=[3],
    )


class GeoCoordinates(BaseModel):
    """Geographic point coordinates (WGS84)."""

    model_config = ConfigDict(extra="ignore")

    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees", examples=[37.7749])
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees", examples=[-122.4194])


class GeoBoundingBox(BaseModel):
    """Geographic bounding box defining geospatial spatial extent."""

    model_config = ConfigDict(extra="ignore")

    min_lat: float = Field(..., ge=-90.0, le=90.0, description="Minimum latitude (South)", examples=[37.70])
    min_lon: float = Field(..., ge=-180.0, le=180.0, description="Minimum longitude (West)", examples=[-122.52])
    max_lat: float = Field(..., ge=-90.0, le=90.0, description="Maximum latitude (North)", examples=[37.83])
    max_lon: float = Field(..., ge=-180.0, le=180.0, description="Maximum longitude (East)", examples=[-122.35])


class SatelliteMetadata(BaseModel):
    """Domain-specific metadata for satellite imagery."""

    model_config = ConfigDict(extra="ignore")

    satellite_name: Optional[str] = Field(
        default=None,
        description="Name of satellite constellation (e.g. Sentinel-2, Landsat-8)",
        examples=["Sentinel-2"],
    )
    sensor: Optional[str] = Field(
        default=None,
        description="Sensor or instrument name",
        examples=["MSI"],
    )
    acquisition_date: Optional[datetime] = Field(
        default=None,
        description="UTC acquisition timestamp",
    )
    cloud_cover_percentage: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=100.0,
        description="Estimated scene cloud coverage percentage (0.0 to 100.0)",
        examples=[5.2],
    )
    resolution_meters: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Spatial resolution in meters per pixel",
        examples=[10.0],
    )
    bands: List[str] = Field(
        default_factory=list,
        description="Spectral bands present in the image",
        examples=[["B02", "B03", "B04", "B08"]],
    )
    coordinates: Optional[GeoCoordinates] = Field(
        default=None,
        description="Center geospatial coordinates of the image footprint",
    )
    bounding_box: Optional[GeoBoundingBox] = Field(
        default=None,
        description="Bounding box coordinates of the image footprint",
    )


class ImageUploadParams(BaseModel):
    """Optional metadata and parameters submitted with an image upload."""

    model_config = ConfigDict(extra="ignore")

    title: Optional[str] = Field(default=None, max_length=200, description="Title or label for the image")
    description: Optional[str] = Field(default=None, max_length=1000, description="Contextual scene notes")
    tags: List[str] = Field(default_factory=list, description="Categorization tags")
    source: Optional[str] = Field(default=None, description="Image source or platform (e.g. Sentinel-2, Landsat-8)")
    capture_date: Optional[date] = Field(default=None, description="Acquisition date (YYYY-MM-DD)")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Scene latitude")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Scene longitude")
    resolution_m: Optional[float] = Field(default=None, gt=0.0, description="Resolution in meters per pixel")
    satellite_metadata: Optional[SatelliteMetadata] = Field(default=None, description="Detailed satellite metadata")
    custom_metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary custom metadata")


class ImageResponseData(BaseModel):
    """
    Image record strictly matching the `satellite_images` Supabase database table schema:
    - image_id: uuid (PK)
    - file_name: text
    - storage_path: text
    - file_type: text
    - file_size: int8
    - source: text
    - capture_date: date
    - latitude: float8
    - longitude: float8
    - resolution_m: float8
    - metadata: jsonb
    - created_at: timestamptz
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    image_id: str = Field(
        ...,
        description="Unique UUID identifier for the satellite image",
        examples=["c8a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c"],
    )
    file_name: str = Field(
        ...,
        description="File name of the image stored in Supabase storage",
        examples=["c8a1b2c3_sentinel2_scene.tif"],
    )
    storage_path: str = Field(
        ...,
        description="Storage bucket path / object key",
        examples=["satellite-images/uploads/c8a1b2c3_sentinel2_scene.tif"],
    )
    file_type: str = Field(
        ...,
        description="MIME content type of the image file (e.g. image/tiff, image/png, image/jpeg)",
        examples=["image/tiff"],
    )
    file_size: Optional[int] = Field(
        default=None,
        ge=0,
        description="Size of the image file in bytes",
        examples=[4194304],
    )
    source: Optional[str] = Field(
        default=None,
        description="Originating satellite platform or source (e.g. Sentinel-2, Landsat-8, Drone)",
        examples=["Sentinel-2"],
    )
    capture_date: Optional[date] = Field(
        default=None,
        description="Image capture date (YYYY-MM-DD)",
        examples=["2024-04-12"],
    )
    latitude: Optional[float] = Field(
        default=None,
        ge=-90.0,
        le=90.0,
        description="Geographic latitude coordinate (decimal degrees WGS84)",
        examples=[37.7749],
    )
    longitude: Optional[float] = Field(
        default=None,
        ge=-180.0,
        le=180.0,
        description="Geographic longitude coordinate (decimal degrees WGS84)",
        examples=[-122.4194],
    )
    resolution_m: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Spatial resolution in meters per pixel",
        examples=[10.0],
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Extended JSONB metadata (dimensions, format, checksum, bounding box, bands, etc.)",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Record creation timestamp with timezone (UTC)",
    )


class ImageUploadResponse(BaseModel):
    """Standardized API response returned after an image upload."""

    model_config = ConfigDict(extra="ignore")

    status: str = Field(default="success", description="Operation status", examples=["success"])
    message: str = Field(
        default="Image uploaded and processed successfully.",
        description="Human-readable result message",
        examples=["Image uploaded and processed successfully."],
    )
    data: ImageResponseData = Field(
        ...,
        description="Detailed record matching the satellite_images table schema",
    )


class ImageDetailResponse(BaseModel):
    """Response returned when fetching details for a specific image."""

    model_config = ConfigDict(extra="ignore")

    status: str = Field(default="success", examples=["success"])
    data: ImageResponseData = Field(..., description="Image record matching satellite_images schema")


class ImageListResponse(BaseModel):
    """Response returned when querying or listing uploaded images."""

    model_config = ConfigDict(extra="ignore")

    status: str = Field(default="success", examples=["success"])
    total: int = Field(..., ge=0, description="Total count of images matching the query", examples=[1])
    items: List[ImageResponseData] = Field(default_factory=list, description="List of satellite image records")


class ImageContext(BaseModel):
    """
    Standardized internal image context for downstream AI specialist workflows
    (VQA, Change Detection). Bundles database metadata with actual image bytes
    so that consumers receive one unified object instead of independently
    querying PostgreSQL and Supabase Storage.

    This model is NOT exposed via API responses — it is an internal service-layer
    construct consumed by specialist adapters.
    """

    model_config = ConfigDict(extra="ignore", arbitrary_types_allowed=True)

    # Core identifiers
    image_id: str = Field(..., description="UUID from satellite_images table")
    file_name: str = Field(..., description="Stored filename in Supabase Storage")
    file_type: str = Field(..., description="MIME content type (e.g. image/tiff)")
    file_size: Optional[int] = Field(default=None, description="File size in bytes")
    storage_path: str = Field(..., description="Supabase Storage bucket/object path")

    # Actual image data
    image_bytes: Optional[bytes] = Field(
        default=None,
        description="Raw image binary downloaded from Supabase Storage",
        exclude=True,  # Never serialize to JSON
    )

    # Geospatial fields from satellite_images table
    source: Optional[str] = Field(default=None, description="Satellite platform or data source")
    capture_date: Optional[date] = Field(default=None, description="Image acquisition date")
    latitude: Optional[float] = Field(default=None, description="Center latitude (WGS84)")
    longitude: Optional[float] = Field(default=None, description="Center longitude (WGS84)")
    resolution_m: Optional[float] = Field(default=None, description="Spatial resolution in meters/pixel")

    # Full JSONB metadata from the database (dimensions, CRS, bounding_box, bands, etc.)
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Complete JSONB metadata preserved from upload processing",
    )
    created_at: Optional[datetime] = Field(default=None, description="Record creation timestamp")

    @property
    def has_image_bytes(self) -> bool:
        """Returns True if actual image binary data is loaded."""
        return self.image_bytes is not None and len(self.image_bytes) > 0

    @property
    def dimensions(self) -> Optional[Dict[str, Any]]:
        """Extracts image dimensions from metadata JSONB if available."""
        if self.metadata:
            return self.metadata.get("dimensions")
        return None

    @property
    def crs(self) -> Optional[str]:
        """Extracts coordinate reference system from metadata JSONB if available."""
        if self.metadata:
            return self.metadata.get("crs")
        return None

    @property
    def bounding_box(self) -> Optional[Dict[str, Any]]:
        """Extracts bounding box from metadata JSONB if available."""
        if self.metadata:
            return self.metadata.get("bounding_box")
        return None
