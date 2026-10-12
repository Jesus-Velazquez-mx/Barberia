import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.llm.image_loader import ImageLoadError, load_image
from app.llm.llm_exception import LLM_ERROR_CATEGORY_STATUS, LLMClientErrorCategory
from app.schemas.api import ApiRequest, ApiResponse, ContentError
from app.schemas.face import FaceDetectionRequest, FaceDetectionResponse
from app.services.face_classifier import classify_face_shape, classify_image_bytes
from app.services.unprocessable_exception import UnprocessableContentError
from app.utils.json_utils import build_json_response

face_router = APIRouter(prefix="/face/detect-structure")


@face_router.post("")
async def detect_structure(req: ApiRequest[FaceDetectionRequest]) -> JSONResponse:  # type: ignore
    data = req.data
    source_field = "photoUrl" if data.photo_url is not None else "photo"

    # La inferencia es trabajo de CPU/GPU: se ejecuta en un thread para no bloquear el event loop
    try:
        if data.photo_url is not None:
            # load_image valida la URL (https + hosts permitidos), descarga con
            # límites de tamaño y regresa la imagen ya normalizada a JPEG
            image_bytes = await load_image(data.photo_url)
            shape = await asyncio.to_thread(classify_image_bytes, image_bytes)
        else:
            shape = await asyncio.to_thread(classify_face_shape, data.photo or "")
    except ImageLoadError as exc:
        if exc.category == LLMClientErrorCategory.INVALID_REQUEST:
            # La URL o la imagen enviada no es válida: error del contenido recibido
            raise UnprocessableContentError(
                req, [ContentError(field=source_field, detail=exc.desc)]
            ) from exc
        # El almacenamiento no respondió (timeout, caído): no es culpa del cliente
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
