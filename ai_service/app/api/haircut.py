from fastapi import APIRouter
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.utils.json_utils import build_json_response
from app.schemas.api import ApiRequest, ApiResponse
from app.schemas.haircut import HaircutRecommendationRequest
from app.services.recommend_haircut import recommend_haircut

haircut_router = APIRouter(prefix="/haircut/recommend")


@haircut_router.post("")
async def generate_haircut_recommendation(req: ApiRequest[HaircutRecommendationRequest]) -> JSONResponse:    
    res = await recommend_haircut(req)

    return build_json_response(
        content=ApiResponse(
            data=res, message="Haircut recommendation generated successfully"
        )
    )
