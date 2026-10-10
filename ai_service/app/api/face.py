import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas.api import ApiRequest, ApiResponse
from app.schemas.face import FaceDetectionRequest, FaceDetectionResponse
from app.services.face_classifier import classify_face_shape
from app.utils.json_utils import build_json_response

face_router = APIRouter(prefix="/face/detect-structure")

@face_router.post("")
async def detect_structure(req: ApiRequest[FaceDetectionRequest]) -> JSONResponse:
    # Ejecutamos la clasificación de Hugging Face en un thread para no bloquear el Event Loop
    shape = await asyncio.to_thread(classify_face_shape, req.data.photo)
    
    res = FaceDetectionResponse(facial_structure=shape)
    
    return build_json_response(
        content=ApiResponse(
            data=res, message="Facial structure classified via Hugging Face"
        )
    )