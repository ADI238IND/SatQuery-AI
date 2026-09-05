from fastapi import APIRouter, status
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisCreateResponse,
    AnalysisDetailResponse,
)
from app.services.analysis_service import analysis_service

router = APIRouter(tags=["Analysis Management"])


@router.post(
    "",
    response_model=AnalysisCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Analysis Request",
    description=(
        "Receives a satellite imagery analysis request containing image_ids and a query. "
        "Validates image presence, identifies workflow_type (1 image -> 'vqa', 2 images -> 'change_detection'), "
        "and creates an analysis record and bridge mapping records."
    ),
)
async def create_analysis(payload: AnalysisCreateRequest) -> AnalysisCreateResponse:
    """Endpoint to create a new satellite imagery analysis request."""
    return analysis_service.create_analysis(payload)


@router.get(
    "/{analysis_id}",
    response_model=AnalysisDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Analysis Request by ID",
    description=(
        "Retrieve details and mapped image IDs for an existing satellite imagery analysis request by analysis_id."
    ),
)
async def get_analysis(analysis_id: str) -> AnalysisDetailResponse:
    """Endpoint to fetch details for an existing satellite imagery analysis request."""
    return analysis_service.get_analysis(analysis_id)

