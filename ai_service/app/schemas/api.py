from enum import StrEnum
from typing import Generic, Optional, TypeVar

from app.schemas.custom_model import CustomModel

DataT = TypeVar("DataT")


class LLMProvider(StrEnum):
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


class BaseApiRequest(CustomModel, Generic[DataT]):
    data: DataT


class ApiRequest(BaseApiRequest[DataT], Generic[DataT]):
    """Request for endpoints that call an LLM."""

    provider: LLMProvider


class ContentError(CustomModel):
    field: Optional[str] = None
    detail: str


class ApiResponse(CustomModel, Generic[DataT]):
    data: Optional[DataT] = None
    message: str
    errors: Optional[list[ContentError]] = None
