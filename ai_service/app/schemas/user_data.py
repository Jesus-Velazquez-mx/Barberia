from typing import Optional

from fastapi.encoders import generate_encoders_by_class_tuples

from app.schemas.face import FacialStructureType
from app.schemas.custom_model import CustomModel

class UserData(CustomModel):
    age: int
    gender: str
    facial_structure: FacialStructureType
    user_preferences: Optional[str] = None