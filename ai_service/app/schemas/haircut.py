from app.schemas.user_data import UserData
from app.schemas.custom_model import CustomModel


class HaircutStyle(CustomModel):
    id: str
    name: str
    description: str


class HaircutRecommendationRequest(CustomModel):
    suggested_haircuts: list[HaircutStyle]
    photo: str  # Foto en base64
    user_data: UserData


class HaircutRecommendationResponse(CustomModel):
    haircuts: list[HaircutStyle]
    suggestion_text: str
    reasoning: str
    confidence: float
