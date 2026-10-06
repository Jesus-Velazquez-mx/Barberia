from enum import StrEnum
from typing import Generic, Optional, TypeVar

from ai_service.app.schemas.custom_model import CustomModel

DataT = TypeVar("DataT")


class LLMProvider(StrEnum):
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


class ApiRequest(CustomModel, Generic[DataT]):
    data: DataT
    provider: LLMProvider


class ContentError(CustomModel):
    field: Optional[str] = None
    detail: str


class ApiResponse(CustomModel, Generic[DataT]):
    data: Optional[DataT] = None
    message: str
    errors: Optional[list[ContentError]] = None
