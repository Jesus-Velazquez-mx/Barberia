from enum import StrEnum

from pydantic import Field

from app.schemas.custom_model import CustomModel


class FaceDetectionRequest(CustomModel):
    # Key del objeto en el bucket privado de S3 (la que el backend usó al
    # generar la URL prefirmada de subida). El servicio descarga la foto con
    # sus propias credenciales.
    photo_key: str = Field(min_length=1, max_length=1024)


class FacialStructureType(StrEnum):
    OVAL = "oval"
    TRIANGLE = "triangle"
    HEART = "heart"
    ROUND = "round"
    DIAMOND = "diamond"
    SQUARE = "square"
    RECTANGLE = "rectangle"


class FaceDetectionResponse(CustomModel):
    facial_structure: FacialStructureType
