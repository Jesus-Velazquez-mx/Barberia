from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.llm.image_loader import ImageLoadError
from app.llm.llm_exception import LLM_ERROR_CATEGORY_STATUS, LLMClientErrorCategory
from app.schemas.api import ApiRequest, ApiResponse, ContentError
from app.schemas.face import FaceDetectionRequest, FaceDetectionResponse
from app.services.face_classifier import classify_face_shape
from app.services.unprocessable_exception import UnprocessableContentError
from app.utils.json_utils import build_json_response

face_router = APIRouter(prefix="/face/detect-structure")


@face_router.post("")
async def detect_structure(req: ApiRequest[FaceDetectionRequest]) -> JSONResponse:  # type: ignore
    data = req.data

    try:
        shape = await classify_face_shape(data.photo_key)
    except ImageLoadError as exc:
        if exc.category == LLMClientErrorCategory.INVALID_REQUEST:
            # La key no es válida, no existe o el objeto no es una imagen: error del contenido recibido
            raise UnprocessableContentError(
                req, [ContentError(field="photoKey", detail=exc.desc)]
            ) from exc
        # El almacenamiento no respondió o la configuración es incorrecta: no es culpa del cliente
        raise HTTPException(
            status_code=LLM_ERROR_CATEGORY_STATUS.get(exc.category, 502),
            detail=exc.desc,
        ) from exc

    res = FaceDetectionResponse(facial_structure=shape)  # type: ignore[arg-type]

    return build_json_response(
        content=ApiResponse(
            data=res, message="Facial structure classified successfully"
        )
    )
