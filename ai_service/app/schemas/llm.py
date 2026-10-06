from typing import Literal, Optional

from app.schemas.common import CustomModel


class LLMErrorResponse(CustomModel):
    status: Literal["insufficient_data"] = "insufficient_data"
    insufficiency_reason: str
    fields_missing_data: Optional[list[str]] = None
