from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.utils.json_utils import build_json_response
from app.schemas.api import ApiRequest, ApiResponse
from app.schemas.haircut import (
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
    HaircutStyle,
)

haircut_router = APIRouter(prefix="/haircut/recommend")


@haircut_router.post("")
async def generate_haircut_recommendation(req: ApiRequest[HaircutRecommendationRequest]) -> JSONResponse:  # type: ignore
    haircut = req.data.suggested_haircuts[0]

    # TODO - Placeholder
    res = HaircutRecommendationResponse(
        haircuts=[
            HaircutStyle(
                id=haircut.id, name=haircut.name, description=haircut.description
            )
        ],
        suggestion_text="",
        reasoning="",
        confidence=0.0,
    )

    return build_json_response(
        content=ApiResponse(
            data=res, message="Haircut recommendation generated successfully"
        )
    )
