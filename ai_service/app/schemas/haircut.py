from typing import Optional

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
    haircuts: list[HaircutStyle]
    suggestion_text: str
    reasoning: str
    confidence: float
