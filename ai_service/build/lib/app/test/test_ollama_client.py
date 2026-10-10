import asyncio
import os
from types import SimpleNamespace

import httpx
import pytest
from ollama import ResponseError

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")

from app.core.config import Settings
from app.llm import ollama_client
from app.llm.llm_client_factory import get_llm_client
from app.llm.llm_exception import LLMClientError, LLMClientErrorCategory
from app.llm.ollama_client import OllamaClient
from app.schemas.api import LLMProvider
from app.schemas.custom_model import CustomModel
from app.schemas.llm import LLMErrorResponse


class FakeSchema(CustomModel):
    value: str


def _client(*, system: str | None = None) -> OllamaClient:
    client = OllamaClient.__new__(OllamaClient)
    client.model = "gemma-test"
    client.max_tokens = 100
    client.system = system
    client.base_url = "http://localhost:11434"
    client.num_ctx = 4096
    client.temperature = 0.0
    client.keep_alive = "5m"
    return client


def _response(content: str | None, done_reason: str = "stop") -> SimpleNamespace:
    return SimpleNamespace(
        done_reason=done_reason, message=SimpleNamespace(content=content)
    )


def _category(exc: Exception) -> LLMClientErrorCategory:
    return _client()._translate_exception(exc, ["prompt"]).category


def test_build_messages_normalizes_prompt_parts() -> None:
    client = _client()

    messages = client._build_messages(["first", "second"])

    assert messages == [
        {"role": "user", "content": "first"},
        {"role": "user", "content": "second"},
    ]
    assert client._normalize_prompt("single") == ["single"]


def test_build_messages_puts_system_prompt_first() -> None:
    client = _client(system="Be concise")

    messages = client._build_messages(["hello"])

    assert messages == [
        {"role": "system", "content": "Be concise"},
        {"role": "user", "content": "hello"},
    ]


def test_build_chat_params_sends_schema_with_explicit_limits() -> None:
    client = _client()

    params = client._build_chat_params([], FakeSchema)

    assert params["model"] == "gemma-test"
    assert params["messages"] == []
    assert params["options"] == {"num_predict": 100, "num_ctx": 4096, "temperature": 0.0}
    assert params["keep_alive"] == "5m"
    assert isinstance(params["format"], dict)


def test_format_schema_is_union_of_expected_and_error_schemas() -> None:
    format_schema = OllamaClient._build_format_schema(FakeSchema)
    defs = format_schema["$defs"]

    assert len(format_schema["anyOf"]) == 2
    assert "FakeSchema" in defs
    assert "LLMErrorResponse" in defs
    assert "value" in defs["FakeSchema"]["properties"]
    assert "insufficiencyReason" in defs["LLMErrorResponse"]["properties"]


def test_parse_response_accepts_primary_and_error_schemas() -> None:
    client = _client()
    prompt = ["prompt"]

    result = client._parse_response('{"value":"ok"}', FakeSchema, prompt)
    error = client._parse_response(
        '{"status":"insufficient_data","insufficiency_reason":"missing"}',
        FakeSchema,
        prompt,
    )

    assert result == FakeSchema(value="ok")
    assert isinstance(error, LLMErrorResponse)


def test_parse_response_unwraps_payload_nested_under_schema_name() -> None:
    client = _client()

    result = client._parse_response(
        '{"FakeSchema": {"value": "ok"}}', FakeSchema, ["prompt"]
    )

    assert result == FakeSchema(value="ok")


def test_parse_response_unwraps_payload_nested_under_unknown_key() -> None:
    client = _client()

    result = client._parse_response(
        '{"result": {"value": "ok"}}', FakeSchema, ["prompt"]
    )

    assert result == FakeSchema(value="ok")


def test_parse_response_unwraps_error_payload_nested_under_schema_name() -> None:
    client = _client()

    result = client._parse_response(
        '{"LLMErrorResponse": {"status": "insufficient_data", "insufficiency_reason": "x"}}',
        FakeSchema,
        ["prompt"],
    )

    assert isinstance(result, LLMErrorResponse)


def test_parse_response_does_not_unwrap_when_payload_is_already_valid() -> None:
    client = _client()

    result = client._parse_response('{"value": "ok"}', FakeSchema, ["prompt"])

    assert result == FakeSchema(value="ok")


def test_parse_response_rejects_invalid_payload() -> None:
    client = _client()

    with pytest.raises(LLMClientError) as exc_info:
        client._parse_response("not-json", FakeSchema, ["prompt"])

    assert exc_info.value.category == LLMClientErrorCategory.INVALID_OUTPUT


def test_parse_response_logs_payload_and_failed_fields(caplog) -> None:
    client = _client()

    with caplog.at_level("WARNING", logger="app.llm.ollama_client"):
        with pytest.raises(LLMClientError):
            client._parse_response('{"other": "x"}', FakeSchema, ["prompt"])

    assert "FakeSchema" in caplog.text
    assert "value" in caplog.text  # the field the model did not provide
    assert '{"other": "x"}' in caplog.text


def test_parse_response_does_not_log_on_success(caplog) -> None:
    client = _client()

    with caplog.at_level("WARNING", logger="app.llm.ollama_client"):
        client._parse_response('{"value":"ok"}', FakeSchema, ["prompt"])

    assert caplog.text == ""


def test_validate_done_reason_rejects_truncated_response() -> None:
    client = _client()

    with pytest.raises(LLMClientError) as exc_info:
        client._validate_done_reason(_response("{", done_reason="length"), ["prompt"])

    assert exc_info.value.category == LLMClientErrorCategory.TRUNCATED


def test_validate_done_reason_logs_what_was_generated_when_truncated(caplog) -> None:
    client = _client()

    with caplog.at_level("WARNING", logger="app.llm.ollama_client"):
        with pytest.raises(LLMClientError):
            client._validate_done_reason(
                _response('{"value": "abc', done_reason="length"), ["prompt"]
            )

    assert "token limit" in caplog.text
    assert '{"value": "abc' in caplog.text


def test_validate_done_reason_accepts_normal_stop() -> None:
    _client()._validate_done_reason(_response("{}", done_reason="stop"), ["prompt"])


@pytest.mark.parametrize("content", [None, "", "   \n"])
def test_extract_text_payload_rejects_empty_content(content: str | None) -> None:
    client = _client()

    with pytest.raises(LLMClientError) as exc_info:
        client._extract_text_payload(_response(content), ["prompt"])

    assert exc_info.value.category == LLMClientErrorCategory.INVALID_OUTPUT


@pytest.mark.parametrize(
    "content",
    [
        '{"value":"ok"}',
        '  {"value":"ok"}\n',
        '```json\n{"value":"ok"}\n```',
        '```\n{"value":"ok"}\n```',
    ],
)
def test_extract_text_payload_strips_code_fences(content: str) -> None:
    client = _client()

    payload = client._extract_text_payload(_response(content), ["prompt"])

    assert payload == '{"value":"ok"}'


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (404, LLMClientErrorCategory.INVALID_REQUEST),
        (400, LLMClientErrorCategory.INVALID_REQUEST),
        (401, LLMClientErrorCategory.AUTH),
        (403, LLMClientErrorCategory.AUTH),
        (429, LLMClientErrorCategory.RATE_LIMITED),
        (500, LLMClientErrorCategory.PROVIDER_UNAVAILABLE),
        (503, LLMClientErrorCategory.PROVIDER_UNAVAILABLE),
        (-1, LLMClientErrorCategory.UNKNOWN),
    ],
)
def test_translate_response_error_by_status(
    status: int, expected: LLMClientErrorCategory
) -> None:
    assert _category(ResponseError("boom", status)) == expected


def test_translate_missing_model_tells_user_how_to_pull_it() -> None:
    error = _client()._translate_exception(ResponseError("nope", 404), ["prompt"])

    assert "ollama pull gemma-test" in error.desc


def test_translate_connection_problems() -> None:
    assert _category(ConnectionError("down")) == (
        LLMClientErrorCategory.PROVIDER_UNAVAILABLE
    )
    assert _category(httpx.ConnectError("down")) == (
        LLMClientErrorCategory.PROVIDER_UNAVAILABLE
    )


def test_translate_timeout_is_transient() -> None:
    assert _category(httpx.ReadTimeout("slow")) == LLMClientErrorCategory.TRANSIENT


def test_translate_unknown_exception() -> None:
    assert _category(Exception("???")) == LLMClientErrorCategory.UNKNOWN


def test_generate_structured_response_orchestrates_helpers() -> None:
    client = _client()

    async def chat(**params):
        assert isinstance(params["format"], dict)
        assert "anyOf" in params["format"]
        assert params["messages"] == [{"role": "user", "content": "prompt"}]
        return _response('{"value":"ok"}')

    client.client = SimpleNamespace(chat=chat)  # type: ignore

    result = asyncio.run(client.generate_structured_response("prompt", FakeSchema))

    assert result == FakeSchema(value="ok")


def test_generate_structured_response_translates_sdk_errors() -> None:
    client = _client()

    async def chat(**params):
        raise ResponseError("model not found", 404)

    client.client = SimpleNamespace(chat=chat)  # type: ignore

    # 404 is non-retriable, so the retry loop gives up on the first attempt
    from app.llm.llm_exception import LLMRequestFailedError

    with pytest.raises(LLMRequestFailedError) as exc_info:
        asyncio.run(client.generate_structured_response("prompt", FakeSchema))

    assert exc_info.value.attempts == 1
    assert exc_info.value.original.category == LLMClientErrorCategory.INVALID_REQUEST


def _settings(**overrides) -> Settings:
    return Settings(AI_SERVICE_API_KEY="test-key", **overrides)  # type: ignore[call-arg]


def test_init_reads_defaults_from_settings(monkeypatch) -> None:
    monkeypatch.setattr(
        ollama_client,
        "get_settings",
        lambda: _settings(
            OLLAMA_MODEL="gemma4:e4b",
            OLLAMA_BASE_URL="http://localhost:11434",
            OLLAMA_NUM_CTX=8192,
            MAX_TOKENS=1000,
        ),
    )

    client = OllamaClient()

    assert client.provider == "Ollama"
    assert client.model == "gemma4:e4b"
    assert client.base_url == "http://localhost:11434"
    assert client.num_ctx == 8192
    assert client.max_tokens == 1000


def test_init_fails_fast_without_model(monkeypatch) -> None:
    monkeypatch.setattr(
        ollama_client, "get_settings", lambda: _settings(OLLAMA_MODEL=None)
    )

    with pytest.raises(RuntimeError, match="OLLAMA_MODEL"):
        OllamaClient()


def test_factory_returns_ollama_client(monkeypatch) -> None:
    monkeypatch.setattr(
        ollama_client, "get_settings", lambda: _settings(OLLAMA_MODEL="gemma4:e4b")
    )

    client = get_llm_client(LLMProvider.OLLAMA)

    assert isinstance(client, OllamaClient)


# --- Imágenes -------------------------------------------------------------

IMAGE = b"\xff\xd8fake-jpeg-bytes"


def test_build_messages_attaches_images_to_last_user_message() -> None:
    client = _client(system="Be concise")

    messages = client._build_messages(["first", "second"], [IMAGE])

    assert "images" not in messages[0]
    assert "images" not in messages[1]
    assert messages[2] == {"role": "user", "content": "second", "images": [IMAGE]}


def test_build_messages_without_images_has_no_images_key() -> None:
    messages = _client()._build_messages(["hello"])

    assert messages == [{"role": "user", "content": "hello"}]


def test_generate_sends_downloaded_image_as_bytes(monkeypatch) -> None:
    client = _client()
    sent = {}

    async def load_image(url):
        sent["url"] = url
        return IMAGE

    async def chat(**params):
        # Se copia lo enviado: al terminar, el cliente limpia los mensajes
        sent["last_message"] = dict(params["messages"][-1])
        return _response('{"value":"ok"}')

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    client.client = SimpleNamespace(chat=chat)  # type: ignore

    result = asyncio.run(
        client.generate_structured_response(
            "prompt", FakeSchema, image_url="https://bucket/photo.jpg"
        )
    )

    assert result == FakeSchema(value="ok")
    assert sent["url"] == "https://bucket/photo.jpg"
    assert sent["last_message"]["images"] == [IMAGE]
    assert isinstance(sent["last_message"]["images"][0], bytes)


def test_generate_without_image_url_never_loads_an_image(monkeypatch) -> None:
    client = _client()

    async def load_image(url):
        raise AssertionError("should not be called")

    async def chat(**params):
        assert "images" not in params["messages"][-1]
        return _response('{"value":"ok"}')

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    client.client = SimpleNamespace(chat=chat)  # type: ignore

    asyncio.run(client.generate_structured_response("prompt", FakeSchema))


def test_image_is_discarded_after_success(monkeypatch) -> None:
    client = _client()
    captured = {}

    async def load_image(url):
        return IMAGE

    async def chat(**params):
        captured["messages"] = params["messages"]
        assert "images" in params["messages"][-1]  # sí viajó con la imagen
        return _response('{"value":"ok"}')

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    client.client = SimpleNamespace(chat=chat)  # type: ignore

    asyncio.run(
        client.generate_structured_response(
            "prompt", FakeSchema, image_url="https://bucket/photo.jpg"
        )
    )

    # Tras terminar no queda ninguna referencia a la imagen en los mensajes
    assert all("images" not in message for message in captured["messages"])


def test_image_is_discarded_even_when_the_model_fails(monkeypatch) -> None:
    client = _client()
    captured = {}

    async def load_image(url):
        return IMAGE

    async def chat(**params):
        captured["messages"] = params["messages"]
        raise ResponseError("model not found", 404)

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    client.client = SimpleNamespace(chat=chat)  # type: ignore

    from app.llm.llm_exception import LLMRequestFailedError

    with pytest.raises(LLMRequestFailedError):
        asyncio.run(
            client.generate_structured_response(
                "prompt", FakeSchema, image_url="https://bucket/photo.jpg"
            )
        )

    assert all("images" not in message for message in captured["messages"])


def test_image_load_error_becomes_llm_client_error(monkeypatch) -> None:
    from app.llm.image_loader import ImageLoadError
    from app.llm.llm_exception import LLMRequestFailedError

    client = _client()

    async def load_image(url):
        raise ImageLoadError(LLMClientErrorCategory.INVALID_REQUEST, "bad image")

    async def chat(**params):
        raise AssertionError("the model must not be called without the image")

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    client.client = SimpleNamespace(chat=chat)  # type: ignore

    with pytest.raises(LLMRequestFailedError) as exc_info:
        asyncio.run(
            client.generate_structured_response(
                "prompt", FakeSchema, image_url="https://bucket/photo.jpg"
            )
        )

    # INVALID_REQUEST no se reintenta
    assert exc_info.value.attempts == 1
    assert exc_info.value.original.category == LLMClientErrorCategory.INVALID_REQUEST
    assert exc_info.value.original.desc == "bad image"


def test_transient_image_error_is_retried(monkeypatch) -> None:
    from app.llm.image_loader import ImageLoadError

    client = _client()
    attempts = {"count": 0}

    async def load_image(url):
        attempts["count"] += 1
        if attempts["count"] == 1:
            raise ImageLoadError(LLMClientErrorCategory.TRANSIENT, "timed out")
        return IMAGE

    async def chat(**params):
        return _response('{"value":"ok"}')

    async def no_sleep(_):
        return None

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    monkeypatch.setattr("app.llm.error_handling.asyncio.sleep", no_sleep)
    client.client = SimpleNamespace(chat=chat)  # type: ignore

    result = asyncio.run(
        client.generate_structured_response(
            "prompt", FakeSchema, image_url="https://bucket/photo.jpg"
        )
    )

    assert result == FakeSchema(value="ok")
    assert attempts["count"] == 2


def test_real_sdk_serializes_image_bytes_as_base64(monkeypatch) -> None:
    """Usa el SDK real de Ollama (sin red) para comprobar la serialización."""
    import base64
    import json as jsonlib

    from ollama import AsyncClient

    client = _client()
    requests = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(jsonlib.loads(request.content))
        return httpx.Response(
            200,
            json={
                "model": "gemma-test",
                "done": True,
                "done_reason": "stop",
                "message": {"role": "assistant", "content": '{"value":"ok"}'},
            },
        )

    async def load_image(url):
        return IMAGE

    monkeypatch.setattr(ollama_client, "load_image", load_image)
    client.client = AsyncClient(
        host="http://ollama.test", transport=httpx.MockTransport(handler)
    )

    result = asyncio.run(
        client.generate_structured_response(
            "describe", FakeSchema, image_url="https://bucket/photo.jpg"
        )
    )

    assert result == FakeSchema(value="ok")
    sent = requests[0]["messages"][-1]
    assert sent["images"] == [base64.b64encode(IMAGE).decode()]
