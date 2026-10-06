from typing import TypeVar

from anthropic import (
    AsyncAnthropic,
    APIConnectionError,
    APIError,
    APIResponseValidationError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    ConflictError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
    UnprocessableEntityError,
)
from anthropic.types import OutputConfigParam
from pydantic import ValidationError

from app.llm.error_handling import enable_error_handling, parse_retry_after
from app.core.config import get_settings
from app.llm.llm_client import MessageRole
from app.llm.llm_exception import (
    LLMClientError,
    LLMClientErrorCategory,
)
from app.schemas.common import CustomModel
from app.schemas.llm import LLMErrorResponse

global_settings = get_settings()
ModelT = TypeVar("ModelT", bound=CustomModel)


class ClaudeClient:
    provider: str = "Anthropic"

    def __init__(
        self,
        model: str = global_settings.ANTHROPIC_MODEL,
        max_tokens: int = global_settings.MAX_TOKENS,
        system: str | None = None,
        cache_control: bool = True,
    ):
        self.model = model
        self.max_tokens = max_tokens
        self.system = system
        self.cache_control = cache_control
        self.client = AsyncAnthropic(api_key=global_settings.ANTHROPIC_API_KEY)

    @enable_error_handling  # Enables retries and error-handling
    async def generate_structured_response(
        self, prompt: str | list[str], schema: type[ModelT]
    ) -> ModelT | LLMErrorResponse:
        messages = []

        prompt = prompt if isinstance(prompt, list) else [prompt]

        for p in prompt:
            messages.append({"role": MessageRole.USER.value, "content": p})

        messages.append({"role": MessageRole.ASSISTANT.value, "content": "```json"})

        client_params = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": messages,
            "stop_sequences": ["```"],
            # "output_config": self._build_output_config(schema),
        }

        if self.system:
            client_params["system"] = self.system

        if self.cache_control:
            client_params["cache_control"] = {"type": "ephemeral"}

        try:
            response = await self.client.messages.create(**client_params)
        except APIError as exc:
            raise self._translate_exception(exc, prompt) from exc

        if response.stop_reason == "max_tokens":
            raise LLMClientError(
                LLMClientErrorCategory.TRUNCATED,
                self.provider,
                self.model,
                prompt,
                desc="LLM response surpassed the max allowed tokens",
            )

        try:
            json_response_payload = next(
                b.text for b in response.content if b.type == "text"
            )
        except StopIteration:
            raise LLMClientError(
                LLMClientErrorCategory.INVALID_OUTPUT,
                self.provider,
                self.model,
                prompt,
                desc="LLM response did not contain a text block",
            )

        try:
            return schema.model_validate_json(json_response_payload)
        except (ValidationError, ValueError):
            pass

        try:
            return LLMErrorResponse.model_validate_json(json_response_payload)
        except (ValidationError, ValueError):
            raise LLMClientError(
                LLMClientErrorCategory.INVALID_OUTPUT,
                self.provider,
                self.model,
                prompt,
                desc="LLM response did not contain a valid json payload",
            )

    def _translate_exception(self, exc: APIError, prompt) -> LLMClientError:
        retry_after = None

        if isinstance(exc, RateLimitError):
            category = LLMClientErrorCategory.RATE_LIMITED
            desc = "Provider rate limit was exceeded"
            retry_after = parse_retry_after(exc.response.headers.get("retry-after"))
        elif isinstance(exc, APITimeoutError):
            category = LLMClientErrorCategory.TRANSIENT
            desc = "Request to the provider timed out"
        elif isinstance(exc, APIConnectionError):
            category = LLMClientErrorCategory.PROVIDER_UNAVAILABLE
            desc = "Failed to connect to the provider"
        elif isinstance(exc, InternalServerError):
            category = LLMClientErrorCategory.PROVIDER_UNAVAILABLE
            desc = "Provider experienced an internal error"
        elif isinstance(exc, (AuthenticationError, PermissionDeniedError)):
            category = LLMClientErrorCategory.AUTH
            desc = "Request was rejected due to invalid credentials or insufficient permissions on the server"
        elif isinstance(
            exc,
            (BadRequestError, UnprocessableEntityError, NotFoundError, ConflictError),
        ):
            category = LLMClientErrorCategory.INVALID_REQUEST
            desc = "Request was rejected by the provider as malformed or invalid"
        elif isinstance(exc, APIResponseValidationError):
            category = LLMClientErrorCategory.INVALID_OUTPUT
            desc = "Provider response did not match the expected shape"
        else:
            category = LLMClientErrorCategory.UNKNOWN
            desc = f"Unhandled provider error: {exc}"

        return LLMClientError(
            category, self.provider, self.model, prompt, desc, retry_after
        )

    def _build_output_config(self, schema: type[CustomModel]) -> OutputConfigParam:
        json_schema = schema.model_json_schema()
        json_schema["additionalProperties"] = False

        return {
            "format": {
                "type": "json_schema",
                "schema": json_schema,
            }
        }
