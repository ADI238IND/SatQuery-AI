import uuid
from datetime import datetime, timezone
from typing import List

from app.core.exceptions import NotFoundException, ValidationException
from app.core.logging import get_logger
from app.repositories.analysis_repository import analysis_repository
from app.repositories.image_repository import image_repository
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisCreateResponse,
    AnalysisDetailResponse,
    AnalysisResponseData,
)

logger = get_logger(__name__)


class AnalysisService:
    """
    Service layer for analysis request management.
    Validates input parameters, checks image existence in `satellite_images`,
    identifies appropriate workflow_type ('vqa' or 'change_detection'),
    and persists records into the `analyses` and `analysis_images` tables.
    """

    def __init__(self):
        self.analysis_repo = analysis_repository
        self.image_repo = image_repository

    def create_analysis(self, request: AnalysisCreateRequest) -> AnalysisCreateResponse:
        """
        Validates analysis request and creates new analysis record mapped to image IDs.

        Validation rules:
        1. image_ids cannot be empty.
        2. query cannot be empty or whitespace only.
        3. duplicate image_ids are rejected (HTTP 422).
        4. Every image_id must exist in satellite_images DB table (HTTP 404 if missing).
        5. Identifies workflow_type: 1 image -> 'vqa', 2 images -> 'change_detection'.
        """
        # Convert UUID objects to string list for domain processing
        raw_image_ids = [str(img_id) for img_id in request.image_ids]

        # 1. Validate image_ids non-empty
        if not raw_image_ids:
            raise ValidationException(
                message="At least one image_id must be provided.",
                details={"image_ids": raw_image_ids},
            )

        # 2. Validate uniqueness of image_ids
        if len(raw_image_ids) != len(set(raw_image_ids)):
            raise ValidationException(
                message="Duplicate image_ids are not allowed in the request.",
                details={"image_ids": raw_image_ids},
            )

        # 3. Validate query
        query_clean = request.query.strip() if request.query else ""
        if not query_clean:
            raise ValidationException(
                message="Query cannot be empty or contain only whitespace.",
                details={"query": request.query},
            )

        # 4. Check that all image_ids exist in satellite_images table
        for img_id in raw_image_ids:
            img_record = self.image_repo.get_by_id(img_id)
            if not img_record:
                raise NotFoundException(
                    message=f"Satellite image with ID '{img_id}' not found.",
                    details={"missing_image_id": img_id},
                )

        # 5. Determine workflow_type based on image count
        num_images = len(raw_image_ids)
        if num_images == 1:
            workflow_type = "vqa"
        elif num_images == 2:
            workflow_type = "change_detection"
        else:
            raise ValidationException(
                message=f"Unsupported image count ({num_images}). Currently only 1 image ('vqa') or 2 images ('change_detection') are supported.",
                details={"image_count": num_images, "image_ids": raw_image_ids},
            )

        # 6. Construct analysis record
        new_analysis_id = str(uuid.uuid4())
        now_utc = datetime.now(timezone.utc)

        analysis_data = AnalysisResponseData(
            analysis_id=new_analysis_id,
            image_ids=raw_image_ids,
            query=query_clean,
            workflow_type=workflow_type,
            status="pending",
            created_at=now_utc,
            started_at=None,
            completed_at=None,
        )

        # 7. Persist analysis and bridge records atomically (with compensating cleanup)
        saved_record = self.analysis_repo.save_analysis(analysis_data)

        logger.info(
            f"Created analysis request {new_analysis_id} with workflow_type='{workflow_type}' for {num_images} image(s)."
        )

        return AnalysisCreateResponse(
            status="success",
            message="Analysis request created successfully.",
            data=saved_record,
        )

    def get_analysis(self, analysis_id: str) -> AnalysisDetailResponse:
        """
        Retrieves an analysis request and its associated image IDs by analysis_id.
        Raises ValidationException (422) for malformed UUID and NotFoundException (404) if missing.
        """
        # Validate analysis_id is a valid UUID string
        try:
            uuid.UUID(analysis_id)
        except (ValueError, TypeError, AttributeError):
            raise ValidationException(
                message=f"Invalid UUID format for analysis_id: '{analysis_id}'.",
                details={"analysis_id": analysis_id},
            )

        analysis_record = self.analysis_repo.get_by_id(analysis_id)
        if not analysis_record:
            raise NotFoundException(
                message=f"Analysis with ID '{analysis_id}' not found.",
                details={"analysis_id": analysis_id},
            )

        return AnalysisDetailResponse(status="success", data=analysis_record)



# Global singleton instance
analysis_service = AnalysisService()
