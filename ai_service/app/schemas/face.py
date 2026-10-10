from typing import Literal
from app.schemas.custom_model import CustomModel

class FaceDetectionRequest(CustomModel):
    photo: str  # String en Base64

class FaceDetectionResponse(CustomModel):
    # Forzamos los valores del ENUM de tu base de datos
    facial_structure: Literal["oval", "triangle", "heart", "round", "diamond", "square", "rectangle"]