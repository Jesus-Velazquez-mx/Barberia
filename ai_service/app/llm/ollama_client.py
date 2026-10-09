import json
import logging
from typing import Any, TypeVar, Union

import httpx
from ollama import AsyncClient, ResponseError
from pydantic import TypeAdapter, ValidationError

from app.core.config import get_settings
from app.llm.error_handling import enable_error_handling
from app.llm.llm_client import MessageRole
from app.llm.llm_exception import (
    LLMClientError,
    LLMClientErrorCategory,
)
from app.schemas.custom_model import CustomModel
from app.schemas.llm import LLMErrorResponse

ModelT = TypeVar("ModelT", bound=CustomModel)

logger = logging.getLogger(__name__)

# Máximo de caracteres de la respuesta del modelo que se escriben en el log
MAX_LOGGED_PAYLOAD_CHARS = 1500


class OllamaClient:
    provider: str = "Ollama"

    def __init__(
        self,
        model: str | None = None,
        max_tokens: int | None = None,
        system: str | None = None,
        base_url: str | None = None,
        num_ctx: int | None = None,
        temperature: float | None = None,
        keep_alive: str | None = None,
    ):
        # Los valores se resuelven aquí y no al importar el módulo, para que
        # importar OllamaClient no dependa de que exista la configuración.
        settings = get_settings()

        resolved_model = model or settings.OLLAMA_MODEL
        if not resolved_model:
            raise RuntimeError(
                "OLLAMA_MODEL is not configured. Set it in the .env file "
                "(e.g. OLLAMA_MODEL=gemma4:e4b) to use the ollama provider"
            )

        self.model = resolved_model
        self.max_tokens = max_tokens if max_tokens is not None else settings.MAX_TOKENS
        self.system = system
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.num_ctx = num_ctx if num_ctx is not None else settings.OLLAMA_NUM_CTX
        self.temperature = (
            temperature if temperature is not None else settings.OLLAMA_TEMPERATURE
        )
        self.keep_alive = keep_alive or settings.OLLAMA_KEEP_ALIVE
        self.client = AsyncClient(host=self.base_url)

    @enable_error_handling  # Enables retries and error-handling
    async def generate_structured_response(
        self, prompt: str | list[str], schema: type[ModelT]
    ) -> ModelT | LLMErrorResponse:
        normalized_prompt = self._normalize_prompt(prompt)
        messages = self._build_messages(normalized_prompt)
        chat_params = self._build_chat_params(messages, schema)
        response = await self._generate_response(chat_params, normalized_prompt)
        self._validate_done_reason(response, normalized_prompt)
        json_response_payload = self._extract_text_payload(response, normalized_prompt)
        return self._parse_response(json_response_payload, schema, normalized_prompt)

    @staticmethod
    def _normalize_prompt(prompt: str | list[str]) -> list[str]:
        """
        Normaliza el prompt y regresa siempre una lista, sin importar
        si el valor de entrada es una lista o un solo string
        """
        return prompt if isinstance(prompt, list) else [prompt]

    def _build_messages(self, prompt: list[str]) -> list[dict[str, str]]:
        """
        Construye el "historial" de mensajes a enviar al LLM.

        Si hay prompt de sistema, va primero con el rol "system". Después,
        cada elemento del prompt se convierte en un mensaje consecutivo con
        el rol "user". A diferencia de ClaudeClient, no se usa message
        prefilling: el formato JSON se exige con el parámetro `format`.
        """
        messages: list[dict[str, str]] = []

        if self.system:
            messages.append({"role": MessageRole.SYSTEM.value, "content": self.system})

        messages.extend(
            {"role": MessageRole.USER.value, "content": prompt_part}
            for prompt_part in prompt
        )
        return messages

    @staticmethod
    def _build_format_schema(schema: type[ModelT]) -> dict[str, Any]:
        """
        Construye el JSON Schema que se envía en el parámetro `format`.

        Es una unión (anyOf) entre el schema esperado y LLMErrorResponse, de
        modo que el modelo pueda responder con cualquiera de los dos y
        Ollama restrinja la generación a esas estructuras. Si solo se enviara
        el schema esperado, el modelo no tendría forma de reportar datos
        insuficientes. TypeAdapter se encarga de fusionar los $defs.
        """
        return TypeAdapter(Union[schema, LLMErrorResponse]).json_schema(by_alias=True)

    def _build_chat_params(
        self, messages: list[dict[str, str]], schema: type[ModelT]
    ) -> dict[str, Any]:
        """
        Construye los parámetros de la llamada a Ollama:
        - Modelo a utilizar
        - Mensajes a procesar (previamente construidos)
        - format: JSON Schema (structured outputs). A diferencia de
          format="json", que solo garantiza JSON válido, esto restringe la
          generación a los campos del schema (ver _build_format_schema)
        - num_predict: número máximo de tokens a generar
        - num_ctx: tamaño de la ventana de contexto. Ollama usa uno pequeño por
          defecto y trunca el prompt sin avisar, por eso se fija explícitamente
        - temperature: baja, para respuestas estables y estructuradas
        - keep_alive: tiempo que el modelo se queda cargado en memoria
        """
        return {
            "model": self.model,
            "messages": messages,
            "format": self._build_format_schema(schema),
            "options": {
                "num_predict": self.max_tokens,
                "num_ctx": self.num_ctx,
                "temperature": self.temperature,
            },
            "keep_alive": self.keep_alive,
        }

    async def _generate_response(self, chat_params: dict[str, Any], prompt: list[str]):
        """
        Llama a Ollama (utilizando su SDK) con los parámetros definidos y
        devuelve la respuesta generada por el LLM.
        """
        try:
            return await self.client.chat(**chat_params)
        except (ResponseError, ConnectionError, httpx.HTTPError) as exc:
            raise self._translate_exception(exc, prompt) from exc

    def _validate_done_reason(self, response, prompt: list[str]) -> None:
        """
        Valida si la respuesta del LLM fue exitosa. Si la generación se detuvo
        porque se alcanzó el límite de tokens (done_reason == "length"),
        arroja una excepción. De lo contrario, no hace nada.
        """
        if response.done_reason == "length":
            # Se registra qué generó el modelo antes de cortarse: permite ver si
            # fue una respuesta legítimamente larga, texto de razonamiento
            # (thinking) o un ciclo de repetición/espacios en blanco.
            message = getattr(response, "message", None)
            content = getattr(message, "content", None) or ""
            thinking = getattr(message, "thinking", None) or ""
            logger.warning(
                "Ollama model '%s' hit the token limit (num_predict=%s, "
                "eval_count=%s).\nContent chars: %d, thinking chars: %d\n"
                "Content (first %d chars): %r",
                self.model,
                self.max_tokens,
                getattr(response, "eval_count", None),
                len(content),
                len(thinking),
                MAX_LOGGED_PAYLOAD_CHARS,
                content[:MAX_LOGGED_PAYLOAD_CHARS],
            )
            raise LLMClientError(
                LLMClientErrorCategory.TRUNCATED,
                self.provider,
                self.model,
                prompt,
                desc="LLM response surpassed the max allowed tokens",
            )

    def _extract_text_payload(self, response, prompt: list[str]) -> str:
        """
        Extrae el texto de la respuesta del LLM. Si viniera envuelto en una
        cerca de código markdown (```json ... ```), la elimina.
        """
        content = getattr(response.message, "content", None)

        if not content or not content.strip():
            raise LLMClientError(
                LLMClientErrorCategory.INVALID_OUTPUT,
                self.provider,
                self.model,
                prompt,
                desc="LLM response did not contain a text block",
            )

        return self._strip_code_fence(content)

    @staticmethod
    def _strip_code_fence(text: str) -> str:
        payload = text.strip()

        if payload.startswith("```"):
            payload = payload.removeprefix("```json").removeprefix("```")
            payload = payload.removesuffix("```")

        return payload.strip()

    @staticmethod
    def _candidate_payloads(data: Any, model_cls: type[CustomModel]):
        """
        Genera las formas posibles del payload: primero tal cual y, si el
        modelo lo anidó bajo una única clave (ej. {"JdAnalysisResult": {...}}),
        también el contenido desenvuelto.
        """
        yield data

        if isinstance(data, dict) and len(data) == 1:
            key, value = next(iter(data.items()))
            known_keys = set(model_cls.model_fields) | {
                field.alias
                for field in model_cls.model_fields.values()
                if field.alias
            }
            if isinstance(value, dict) and (
                key.lower() == model_cls.__name__.lower() or key not in known_keys
            ):
                yield value

    def _parse_response(
        self, payload: str, schema: type[ModelT], prompt: list[str]
    ) -> ModelT | LLMErrorResponse:
        """
        Convierte la respuesta en texto simple del LLM a un modelo de
        Pydantic para su manipulación de manera programática.

        Tolera que el modelo envuelva el objeto en una clave contenedora
        (ej. {"JdAnalysisResult": {...}}), algo común en modelos locales.
        """
        try:
            data = json.loads(payload)
        except json.JSONDecodeError as exc:
            logger.warning(
                "Ollama model '%s' returned invalid JSON: %s\n"
                "Payload (first %d chars): %s",
                self.model,
                exc,
                MAX_LOGGED_PAYLOAD_CHARS,
                payload[:MAX_LOGGED_PAYLOAD_CHARS],
            )
            raise LLMClientError(
                LLMClientErrorCategory.INVALID_OUTPUT,
                self.provider,
                self.model,
                prompt,
                desc="LLM response did not contain a valid json payload",
            ) from exc

        schema_error: ValidationError | None = None

        for candidate in self._candidate_payloads(data, schema):
            try:
                return schema.model_validate(candidate)
            except ValidationError as exc:
                schema_error = schema_error or exc

        for candidate in self._candidate_payloads(data, LLMErrorResponse):
            try:
                return LLMErrorResponse.model_validate(candidate)
            except ValidationError:
                continue

        # Los modelos locales fallan más que Claude en respetar el schema,
        # así que se deja registro de qué devolvió y qué campos no cumplieron.
        logger.warning(
            "Ollama model '%s' returned a payload that matches neither %s nor "
            "the error schema.\nValidation error: %s\nPayload (first %d chars): %s",
            self.model,
            schema.__name__,
            schema_error,
            MAX_LOGGED_PAYLOAD_CHARS,
            payload[:MAX_LOGGED_PAYLOAD_CHARS],
        )
        raise LLMClientError(
            LLMClientErrorCategory.INVALID_OUTPUT,
            self.provider,
            self.model,
            prompt,
            desc="LLM response did not contain a valid json payload",
        )

    def _translate_exception(self, exc: Exception, prompt) -> LLMClientError:
        """
        Convierte cualquier excepción arrojada por el SDK de Ollama (o por
        httpx) a una excepción personalizada de este proyecto para controlar
        el flujo de este programa a nuestra conveniencia.
        """
        if isinstance(exc, ResponseError):
            category, desc = self._categorize_response_error(exc)
        elif isinstance(exc, httpx.TimeoutException):
            category = LLMClientErrorCategory.TRANSIENT
            desc = "Request to the provider timed out"
        elif isinstance(exc, (ConnectionError, httpx.TransportError)):
            category = LLMClientErrorCategory.PROVIDER_UNAVAILABLE
            desc = (
                f"Failed to connect to Ollama at {self.base_url}. "
                "Check that Ollama is running and reachable"
            )
        else:
            category = LLMClientErrorCategory.UNKNOWN
            desc = f"Unhandled provider error: {exc}"

        return LLMClientError(category, self.provider, self.model, prompt, desc)

    def _categorize_response_error(
        self, exc: ResponseError
    ) -> tuple[LLMClientErrorCategory, str]:
        status = exc.status_code

        if status == 404:
            return (
                LLMClientErrorCategory.INVALID_REQUEST,
                f"Model '{self.model}' was not found in Ollama. "
                f"Pull it first with: ollama pull {self.model}",
            )
        if status in (401, 403):
            return (
                LLMClientErrorCategory.AUTH,
                "Request was rejected due to invalid credentials or insufficient permissions on the server",
            )
        if status == 429:
            return (
                LLMClientErrorCategory.RATE_LIMITED,
                "Provider rate limit was exceeded",
            )
        if status >= 500:
            return (
                LLMClientErrorCategory.PROVIDER_UNAVAILABLE,
                "Provider experienced an internal error",
            )
        if 400 <= status < 500:
            return (
                LLMClientErrorCategory.INVALID_REQUEST,
                "Request was rejected by the provider as malformed or invalid",
            )
        return LLMClientErrorCategory.UNKNOWN, f"Unhandled provider error: {exc}"
