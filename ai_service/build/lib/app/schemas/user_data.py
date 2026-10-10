from typing import Optional

from fastapi.encoders import generate_encoders_by_class_tuples

from app.schemas.custom_model import CustomModel

class UserData(CustomModel):
    age: int
    gender: str
    user_preferences: Optional[str] = None