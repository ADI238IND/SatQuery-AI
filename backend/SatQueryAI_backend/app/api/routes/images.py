import json
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, File, Form, Query, UploadFile, status

from app.schemas.image import (
    GeoCoordinates,
    ImageDetailResponse,
    ImageListResponse,
    ImageUploadParams,
    ImageUploadResponse,
    SatelliteMetadata,
)
from app.services.image_service import image_service

router = APIRouter(tags=["Satellite Imagery"])


@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Satellite Image",
    description=(
        "Upload a satellite imagery file (PNG, JPEG, TIFF). "
        "Extracts geospatial coordinates and spatial resolution from GeoTIFF / EXIF metadata, "
        "persists the record into the 'satellite_images' table, "
        "and returns a structured response matching the database table schema."
    ),
)
async def upload_image(
    file: UploadFile = File(..., description="Satellite image file binary (TIFF, PNG, JPEG)"),
    source: Optional[str] = Form(
        default=None,
        description="Originating satellite platform or data source (e.g. 'Sentinel-2', 'Landsat-8')",
    ),
    capture_date: Optional[str] = Form(
        default=None,
        description="Image capture date (YYYY-MM-DD or ISO 8601)",
    ),
    latitude: Optional[float] = Form(
        default=None,
        ge=-90.0,
        le=90.0,
        description="Geographic latitude coordinate (decimal degrees WGS84)",
    ),
    longitude: Optional[float] = Form(
        default=None,
        ge=-180.0,
        le=180.0,
        description="Geographic longitude coordinate (decimal degrees WGS84)",
    ),
    resolution_m: Optional[float] = Form(
        default=None,
        gt=0.0,
        description="Spatial resolution in meters per pixel",
    ),
    title: Optional[str] = Form(default=None, description="Optional title or label for the scene"),
    description: Optional[str] = Form(default=None, description="Contextual scene notes or description"),
    tags: Optional[str] = Form(
        default=None,
        description="Comma-separated or JSON array of tags (e.g. 'urban,flood,sentinel2')",
    ),
    cloud_cover_percentage: Optional[float] = Form(
        default=None,
        ge=0.0,
        le=100.0,
        description="Estimated scene cloud coverage percentage (0.0 to 100.0)",
    ),
    bands: Optional[str] = Form(
        default=None,
        description="Comma-separated spectral bands (e.g. 'B02,B03,B04,B08')",
    ),
    custom_metadata: Optional[str] = Form(
        default=None,
        description="Optional JSON string of custom key-value metadata",
    ),
    # Aliases for backward compatibility
    satellite_name: Optional[str] = Form(default=None, description="Alias for 'source'"),
    acquisition_date: Optional[str] = Form(default=None, description="Alias for 'capture_date'"),
    resolution_meters: Optional[float] = Form(default=None, description="Alias for 'resolution_m'"),
) -> ImageUploadResponse:
    """Handles satellite image upload, parsing metadata and returning structured image response."""
    # Resolve aliases
    effective_source = source or satellite_name
    effective_resolution_m = resolution_m if resolution_m is not None else resolution_meters
    effective_date_str = capture_date or acquisition_date

    # Parse tags
    parsed_tags = []
    if tags:
        if tags.strip().startswith("[") and tags.strip().endswith("]"):
            try:
                parsed_tags = json.loads(tags)
            except Exception:
                parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]
        else:
            parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    # Parse bands
    parsed_bands = []
    if bands:
        parsed_bands = [b.strip() for b in bands.split(",") if b.strip()]

    # Parse capture date
    parsed_capture_date: Optional[date] = None
    if effective_date_str:
        try:
            clean = effective_date_str.strip().replace("Z", "+00:00")
            if "T" in clean:
                parsed_capture_date = datetime.fromisoformat(clean).date()
            else:
                parsed_capture_date = date.fromisoformat(clean[:10])
        except Exception:
            pass

    # Parse custom metadata
    parsed_custom = {}
    if custom_metadata:
        try:
            parsed_custom = json.loads(custom_metadata)
        except Exception:
            pass

    # Build SatelliteMetadata helper if auxiliary satellite fields are present
    satellite_meta = None
    if any(x is not None for x in [cloud_cover_percentage, parsed_bands]):
        coords = None
        if latitude is not None and longitude is not None:
            coords = GeoCoordinates(latitude=latitude, longitude=longitude)
        satellite_meta = SatelliteMetadata(
            satellite_name=effective_source,
            cloud_cover_percentage=cloud_cover_percentage,
            resolution_meters=effective_resolution_m,
            bands=parsed_bands,
            coordinates=coords,
        )

    upload_params = ImageUploadParams(
        title=title,
        description=description,
        tags=parsed_tags,
        source=effective_source,
        capture_date=parsed_capture_date,
        latitude=latitude,
        longitude=longitude,
        resolution_m=effective_resolution_m,
        satellite_metadata=satellite_meta,
        custom_metadata=parsed_custom,
    )

    return await image_service.process_image_upload(file=file, params=upload_params)


@router.get(
    "/{image_id}",
    response_model=ImageDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Image by ID",
    description="Retrieve the complete satellite image record matching the database table schema.",
)
async def get_image(image_id: str) -> ImageDetailResponse:
    """Fetches details for a single uploaded satellite image."""
    image_data = image_service.get_image(image_id)
    return ImageDetailResponse(status="success", data=image_data)


@router.get(
    "",
    response_model=ImageListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Images",
    description="Retrieve a paginated list of uploaded satellite imagery records from 'satellite_images'.",
)
async def list_images(
    limit: int = Query(default=50, ge=1, le=100, description="Max items to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
) -> ImageListResponse:
    """Lists uploaded images."""
    return image_service.list_images(limit=limit, offset=offset)
