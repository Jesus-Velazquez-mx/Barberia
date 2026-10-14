from typing import Literal, Optional

from pydantic import Field

from app.schemas.user_data import UserData
from app.schemas.custom_model import CustomModel


class HaircutStyle(CustomModel):
    id: str
    name: str
    description: Optional[str] = None


class HaircutRecommendationRequest(CustomModel):
    suggested_haircuts: list[HaircutStyle]
    photo_key: str = Field(min_length=1, max_length=1024)  # Key de la foto en el bucket privado de S3
    user_data: UserData


class HaircutRecommendationResponse(CustomModel):
    """
    - recommended: haircuts (al menos uno), suggestion_text y confidence son obligatorios.
    - no_suitable_haircut: ningún candidato es compatible con las preferencias; haircuts va vacío
      y reasoning explica por qué.
    """

    status: Literal["recommended", "no_suitable_haircut"] = "recommended"
    haircuts: list[HaircutStyle] = Field(default_factory=list)
    suggestion_text: Optional[str] = None
    reasoning: str
    confidence: Optional[float] = None
