from enum import StrEnum
from typing import Protocol, TypeVar

from app.schemas.custom_model import CustomModel
from app.schemas.llm import LLMErrorResponse

ModelT = TypeVar("ModelT", bound=CustomModel)


class LLMClient(Protocol):
    """Contract every LLM client must satisfy"""

    provider: str
    model: str

    async def generate_structured_response(
        self, prompt: str | list[str], schema: type[ModelT]
    ) -> ModelT | LLMErrorResponse: ...


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
