from typing import Any, TypeVar

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
from app.schemas.custom_model import CustomModel
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
        normalized_prompt = self._normalize_prompt(prompt)
        messages = self._build_messages(normalized_prompt)
        client_params = self._build_client_params(messages)
        response = await self._generate_response(client_params, normalized_prompt)
        self._validate_stop_reason(response, normalized_prompt)
        json_response_payload = self._extract_text_payload(response, normalized_prompt)
        return self._parse_response(json_response_payload, schema, normalized_prompt)

    @staticmethod
    def _normalize_prompt(prompt: str | list[str]) -> list[str]:
        """
        Normaliza el prompt y regresa siempre una lista, sin importar
        si el valor de entrada es una lista o un solo string
        """
        return prompt if isinstance(prompt, list) else [prompt]

    @staticmethod
    def _build_messages(prompt: list[str]) -> list[dict[str, str]]:
        """
        Toma el prompt normalizado y construye el "historial" de mensajes
        a enviar al LLM. 

        Para cada elemento de prompt, crea un mensaje individual de manera
        consecutiva asignando el rol de usuario ("user") a cada uno. Finalmente,
        agrega un mensaje prefabricado (message prefilling) para garantizar
        que el LLM responda en formato JSON.
        """
        messages = [
            {"role": MessageRole.USER.value, "content": prompt_part}
            for prompt_part in prompt
        ]
        messages.append({"role": MessageRole.ASSISTANT.value, "content": "```json"})
        return messages

    def _build_client_params(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        """
        Construye el objeto client_params que contiene el modelo
        específico de Anthropic a utilizar y sus especificaciones: 
        - Mensajes a procesar (previamente construidos)
        - Número máximo de tokens
        - Stop sequence (obliga al modelo a interrumpir la generación)
        - Prompt de sistema
        - Activación de control de caché
        """
        client_params: dict[str, Any] = {
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

        return client_params

    async def _generate_response(self, client_params: dict[str, Any], prompt: list[str]):
        """
        Llama a la API de Anthropic (utilizando su SDK) con los parámetros 
        definidos y devuelve la respuesta generada por el LLM.        
        """
        try:
            return await self.client.messages.create(**client_params)
        except APIError as exc:
            raise self._translate_exception(exc, prompt) from exc

    # TODO - Refactorizar para manejar todas las stop reasons, no solo max_tokens
    def _validate_stop_reason(self, response, prompt: list[str]) -> None:
        """
        Valida si la respuesta del LLM fue exitosa. Si la razón por la
        que la respuesta se detuvo es porque se alcanzó el límite
        máximo de tokens establecido, entonces arroja una excepción.
        De lo contrario, no hace nada.        
        """
        if response.stop_reason == "max_tokens":
            raise LLMClientError(
                LLMClientErrorCategory.TRUNCATED,
                self.provider,
                self.model,
                prompt,
                desc="LLM response surpassed the max allowed tokens",
            )

    def _extract_text_payload(self, response, prompt: list[str]) -> str:
        """
        Extrae el contenido relevante de la respuesta del LLM ignorando
        cualquier bloque de metadata.
        """
        try:
            return next(b.text for b in response.content if b.type == "text")
        except StopIteration:
            raise LLMClientError(
                LLMClientErrorCategory.INVALID_OUTPUT,
                self.provider,
                self.model,
                prompt,
                desc="LLM response did not contain a text block",
            )

    def _parse_response(
        self, payload: str, schema: type[ModelT], prompt: list[str]
    ) -> ModelT | LLMErrorResponse:
        """
        Convierte la respuesta en texto simple del LLM a un modelo de 
        Pydantic para su manipulación de manera programática.
        """
        try:
            return schema.model_validate_json(payload)
        except (ValidationError, ValueError):
            pass

        try:
            return LLMErrorResponse.model_validate_json(payload)
        except (ValidationError, ValueError):
            raise LLMClientError(
                LLMClientErrorCategory.INVALID_OUTPUT,
                self.provider,
                self.model,
                prompt,
                desc="LLM response did not contain a valid json payload",
            )

    def _translate_exception(self, exc: APIError, prompt) -> LLMClientError:
        """
        Convierte cualquier excepción arrojada por el SDK de Anthropic
        a una excepción personalizada (definidas en este mismo proyecto) 
        para controlar el flujo de este programa a nuestra conveniencia.       
        """
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
