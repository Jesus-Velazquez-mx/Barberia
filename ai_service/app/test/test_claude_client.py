import asyncio
import os
from types import SimpleNamespace

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "anthropic-test-key")

from app.llm.claude_client import ClaudeClient
from app.llm.llm_exception import LLMClientError, LLMClientErrorCategory
from app.schemas.custom_model import CustomModel
from app.schemas.llm import LLMErrorResponse


class FakeSchema(CustomModel):
    value: str


def _client(*, system: str | None = None, cache_control: bool = True) -> ClaudeClient:
    client = ClaudeClient.__new__(ClaudeClient)
    client.model = "claude-test"
    client.max_tokens = 100
    client.system = system
    client.cache_control = cache_control
    return client


def test_build_messages_normalizes_prompt_parts() -> None:
    client = _client()

    messages = client._build_messages(["first", "second"])

    assert messages == [
        {"role": "user", "content": "first"},
        {"role": "user", "content": "second"},
        {"role": "assistant", "content": "```json"},
    ]
    assert client._normalize_prompt("single") == ["single"]


def test_build_client_params_respects_optional_settings() -> None:
    client = _client(system="Be concise", cache_control=True)

    params = client._build_client_params([])

    assert params == {
        "model": "claude-test",
        "max_tokens": 100,
        "messages": [],
        "stop_sequences": ["```"],
        "system": "Be concise",
        "cache_control": {"type": "ephemeral"},
    }


def test_build_client_params_omits_disabled_optional_settings() -> None:
    client = _client(cache_control=False)

    params = client._build_client_params([])

    assert "system" not in params
    assert "cache_control" not in params


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


def test_parse_response_rejects_invalid_payload() -> None:
    client = _client()

    try:
        client._parse_response("not-json", FakeSchema, ["prompt"])
    except LLMClientError as exc:
        assert exc.category == LLMClientErrorCategory.INVALID_OUTPUT
    else:
        raise AssertionError("Expected invalid output error")


def test_validate_stop_reason_rejects_truncated_response() -> None:
    client = _client()

    try:
        client._validate_stop_reason(
            SimpleNamespace(stop_reason="max_tokens"), ["prompt"]
        )
    except LLMClientError as exc:
        assert exc.category == LLMClientErrorCategory.TRUNCATED
    else:
        raise AssertionError("Expected truncated output error")


def test_extract_text_payload_rejects_response_without_text() -> None:
    client = _client()

    try:
        client._extract_text_payload(
            SimpleNamespace(content=[SimpleNamespace(type="tool_use")]),
            ["prompt"],
        )
    except LLMClientError as exc:
        assert exc.category == LLMClientErrorCategory.INVALID_OUTPUT
    else:
        raise AssertionError("Expected missing text error")


def test_generate_structured_response_orchestrates_helpers() -> None:
    client = _client()

    async def create(**params):
        assert params["messages"][-1] == {
            "role": "assistant",
            "content": "```json",
        }
        return SimpleNamespace(
            stop_reason="end_turn",
            content=[SimpleNamespace(type="text", text='{"value":"ok"}')],
        )

    client.client = SimpleNamespace(messages=SimpleNamespace(create=create)) # type: ignore

    result = asyncio.run(
        client.generate_structured_response("prompt", FakeSchema)
    )

    assert result == FakeSchema(value="ok")
