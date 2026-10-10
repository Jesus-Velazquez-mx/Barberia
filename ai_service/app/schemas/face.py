from enum import StrEnum
from typing import Self

from pydantic import model_validator

from app.schemas.custom_model import CustomModel


class FaceDetectionRequest(CustomModel):
    # Se debe enviar exactamente uno de los dos. La URL (p. ej. una URL
    # prefirmada de S3) es la vía principal; `photo` se conserva por compatibilidad.
    photo_url: str | None = None  # URL https de la imagen
    photo: str | None = None  # String en Base64 (con o sin prefijo data URL)

    @model_validator(mode="after")
    def _exactly_one_source(self) -> Self:
        if (self.photo_url is None) == (self.photo is None):
            raise ValueError("Provide exactly one of 'photoUrl' or 'photo'")
        return self


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
