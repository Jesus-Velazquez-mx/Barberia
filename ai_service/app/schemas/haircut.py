from typing import Optional

from app.schemas.custom_model import CustomModel


class HaircutStyle(CustomModel):
    id: str
    name: str
    description: str


class HaircutRecommendationRequest(CustomModel):
    suggested_haircuts: list[HaircutStyle]
    photo: str  # Foto en base64
    age: Optional[int] = None
    user_preferences: Optional[str] = None


class HaircutRecommendationResponse(CustomModel):
    haircuts: list[HaircutStyle]
    suggestion_text: str
    reasoning: str
    confidence: float
