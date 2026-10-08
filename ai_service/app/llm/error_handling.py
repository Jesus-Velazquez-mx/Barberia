import asyncio
import functools
import random
from inspect import signature

from app.llm.llm_client import LLMClient
from app.llm.llm_exception import (
    LLMClientError,
    LLMClientErrorCategory,
    LLMRequestFailedError,
)
from app.core.config import get_settings

def enable_error_handling(generate_response_func):
    """Retry a client's response generation within an overall time budget."""

    @functools.wraps(generate_response_func)
    async def wrapper(self: LLMClient, *args, **kwargs):
        global_settings = get_settings()
        timeout = global_settings.LLM_TIMEOUT
        max_attempts = global_settings.LLM_MAX_ATTEMPTS

        bound = signature(generate_response_func).bind(self, *args, **kwargs)
        bound.apply_defaults()
        request = bound.arguments["prompt"]

        attempts = 0

        async def attempt_loop():
            nonlocal attempts
            while True:
                try:
                    attempts += 1
                    return await generate_response_func(self, *args, **kwargs)
                except LLMClientError as exc:
                    if not is_retriable(exc) or attempts >= max_attempts:
                        raise LLMRequestFailedError(exc, attempts) from exc
                    await asyncio.sleep(backoff_delay(exc, attempts))

        try:
            return await asyncio.wait_for(attempt_loop(), timeout=timeout)
        except asyncio.TimeoutError as exc:
            timeout_exc = LLMClientError(
                LLMClientErrorCategory.TIMEOUT_EXCEEDED,
                provider=self.provider,
                model=self.model,
                request=request,
                desc=(
                    f"Overall LLM request time budget of {timeout}s exceeded "
                    f"after {attempts} attempt(s)"
                ),
            )
            raise LLMRequestFailedError(timeout_exc, attempts) from exc

    return wrapper


def is_retriable(exc: LLMClientError):
    return exc.category not in [
        LLMClientErrorCategory.AUTH,
        LLMClientErrorCategory.INVALID_REQUEST,
        LLMClientErrorCategory.UNKNOWN,
    ]


def backoff_delay(exc: LLMClientError, attempts: int) -> float:
    """Seconds to wait before the next attempt"""

    global_settings = get_settings()

    if (
        exc.category == LLMClientErrorCategory.RATE_LIMITED
        and exc.retry_after is not None
    ):
        return min(exc.retry_after, global_settings.MAX_BACKOFF_SECONDS)

    delay = min(global_settings.BASE_BACKOFF_SECONDS * 2 ** (attempts - 1), global_settings.MAX_BACKOFF_SECONDS)

    return random.uniform(delay / 2, delay)


def parse_retry_after(value: str | None) -> float | None:
    """Parse a `retry-after` response header into seconds"""

    if value is None:
        return None

    try:
        return float(value)
    except ValueError:
        return None
