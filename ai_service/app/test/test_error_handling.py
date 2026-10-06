import asyncio

import pytest

from app.core.config import Settings
from app.llm import error_handling
from app.llm.error_handling import (
    backoff_delay,
    enable_error_handling,
    parse_retry_after,
)
from app.llm.llm_exception import (
    LLMClientError,
    LLMClientErrorCategory,
    LLMRequestFailedError,
)
from ai_service.app.schemas.custom_model import CustomModel

PROMPT = "summarize this job description"
TIMEOUT = 0.05
MAX_ATTEMPTS = 3
MAX_BACKOFF_SECONDS = 30

_HANG = object()


class FakeSchema(CustomModel):
    value: str


class FakeClient:
    """Satisfies the LLMClient contract without touching a provider SDK.

    Deliberately not ClaudeClient: that module calls get_settings() at import
    time, so importing it would demand real credentials."""

    provider = "fake"
    model = "fake-model"

    def __init__(self, *outcomes):
        self.outcomes = list(outcomes)
        self.calls = 0

    @enable_error_handling
    async def generate_structured_response(self, prompt, schema):
        self.calls += 1
        # Past the end of the script, the last outcome repeats.
        outcome = self.outcomes[min(self.calls - 1, len(self.outcomes) - 1)]

        if outcome is _HANG:
            await asyncio.sleep(10)
        if isinstance(outcome, BaseException):
            raise outcome

        return outcome


def _error(
    category: LLMClientErrorCategory, retry_after: float | None = None
) -> LLMClientError:
    return LLMClientError(
        category,
        provider="fake",
        model="fake-model",
        request=PROMPT,
        desc="scripted failure",
        retry_after=retry_after,
    )


def _settings() -> Settings:
    return Settings(
        AI_SERVICE_API_KEY="test-key",
        ANTHROPIC_API_KEY="anthropic-test-key",
        ANTHROPIC_MODEL="claude-test",
        LLM_TIMEOUT=TIMEOUT,
        LLM_MAX_ATTEMPTS=MAX_ATTEMPTS,
    )


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
def stub_settings_and_backoff(monkeypatch) -> list[int]:
    """Pin the retry budget and collapse backoff to zero.

    Returns the list of attempt numbers backoff was asked about, so tests can
    assert how many retries happened without waiting for real delays."""

    monkeypatch.setattr(error_handling, "get_settings", _settings)

    recorded: list[int] = []

    def no_wait(exc: LLMClientError, attempts: int) -> float:
        recorded.append(attempts)
        return 0.0

    monkeypatch.setattr(error_handling, "backoff_delay", no_wait)

    return recorded


@pytest.mark.anyio
async def test_timeout_error_carries_real_client_context() -> None:
    client = FakeClient(_HANG)

    with pytest.raises(LLMRequestFailedError) as exc_info:
        await client.generate_structured_response(PROMPT, FakeSchema)

    failure = exc_info.value
    assert failure.attempts == 1

    original = failure.original
    assert original.category == LLMClientErrorCategory.TIMEOUT_EXCEEDED
    assert original.provider == "fake"
    assert original.model == "fake-model"
    assert original.request == PROMPT
    assert "mock" not in str(failure)


@pytest.mark.anyio
async def test_timeout_context_resolves_keyword_prompt() -> None:
    client = FakeClient(_HANG)

    with pytest.raises(LLMRequestFailedError) as exc_info:
        await client.generate_structured_response(prompt=PROMPT, schema=FakeSchema)

    assert exc_info.value.original.request == PROMPT


@pytest.mark.anyio
async def test_decorated_method_is_callable_and_returns_result() -> None:
    expected = FakeSchema(value="ok")
    client = FakeClient(expected)

    result = await client.generate_structured_response(PROMPT, FakeSchema)

    assert result is expected
    assert client.calls == 1
    assert client.generate_structured_response.__name__ == (
        "generate_structured_response"
    )


@pytest.mark.anyio
async def test_non_retriable_error_fails_with_real_attempt_count(
    stub_settings_and_backoff: list[int],
) -> None:
    client = FakeClient(_error(LLMClientErrorCategory.AUTH))

    with pytest.raises(LLMRequestFailedError) as exc_info:
        await client.generate_structured_response(PROMPT, FakeSchema)

    failure = exc_info.value
    assert failure.attempts == 1
    assert failure.original.category == LLMClientErrorCategory.AUTH
    assert client.calls == 1
    assert stub_settings_and_backoff == []


@pytest.mark.anyio
async def test_retriable_error_is_retried_then_succeeds(
    stub_settings_and_backoff: list[int],
) -> None:
    expected = FakeSchema(value="ok")
    client = FakeClient(_error(LLMClientErrorCategory.TRANSIENT), expected)

    result = await client.generate_structured_response(PROMPT, FakeSchema)

    assert result is expected
    assert client.calls == 2
    assert stub_settings_and_backoff == [1]


@pytest.mark.anyio
async def test_gives_up_after_max_attempts(
    stub_settings_and_backoff: list[int],
) -> None:
    client = FakeClient(_error(LLMClientErrorCategory.PROVIDER_UNAVAILABLE))

    with pytest.raises(LLMRequestFailedError) as exc_info:
        await client.generate_structured_response(PROMPT, FakeSchema)

    failure = exc_info.value
    assert failure.attempts == MAX_ATTEMPTS
    assert failure.original.category == LLMClientErrorCategory.PROVIDER_UNAVAILABLE
    assert client.calls == MAX_ATTEMPTS
    # Slept between attempts only, never after the last one.
    assert stub_settings_and_backoff == [1, 2]


def test_backoff_prefers_provider_retry_after() -> None:
    exc = _error(LLMClientErrorCategory.RATE_LIMITED, retry_after=2.0)

    assert backoff_delay(exc, attempts=1) == 2.0


def test_backoff_caps_provider_retry_after() -> None:
    exc = _error(LLMClientErrorCategory.RATE_LIMITED, retry_after=3600.0)

    assert backoff_delay(exc, attempts=1) == MAX_BACKOFF_SECONDS


def test_backoff_grows_and_stays_within_jitter_bounds() -> None:
    exc = _error(LLMClientErrorCategory.TRANSIENT)

    assert 0.5 <= backoff_delay(exc, attempts=1) <= 1.0
    assert 1.0 <= backoff_delay(exc, attempts=2) <= 2.0
    assert 2.0 <= backoff_delay(exc, attempts=3) <= 4.0
    assert backoff_delay(exc, attempts=99) <= MAX_BACKOFF_SECONDS


def test_rate_limit_without_retry_after_falls_back_to_backoff() -> None:
    exc = _error(LLMClientErrorCategory.RATE_LIMITED)

    assert 0.5 <= backoff_delay(exc, attempts=1) <= 1.0


@pytest.mark.parametrize(
    ("header", "expected"),
    [
        ("5", 5.0),
        ("1.5", 1.5),
        (None, None),
        ("Wed, 21 Oct 2015 07:28:00 GMT", None),
    ],
)
def testparse_retry_after(header: str | None, expected: float | None) -> None:
    assert parse_retry_after(header) == expected
