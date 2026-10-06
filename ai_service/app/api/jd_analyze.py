from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.jd_analyze import analyze_job
from app.schemas.api import ApiRequest, ApiResponse
from app.schemas.jd_analyze import JdAnalyzeRequest
from app.llm.llm_exception import LLMRequestFailedError
from app.utils.json_utils import build_json_response

jd_router = APIRouter(prefix="/jd/analyze")


@jd_router.post("")
async def analyze(req: ApiRequest[JdAnalyzeRequest]) -> JSONResponse:
    res = await analyze_job(req)
    return build_json_response(
        content=ApiResponse(
            data=res, message="Job description has been successfully analyzed"
        )
    )
