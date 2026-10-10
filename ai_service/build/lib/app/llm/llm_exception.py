from enum import StrEnum
from typing import Optional


class LLMClientErrorCategory(StrEnum):
    # Retriable
    TRANSIENT = "transient"
    RATE_LIMITED = "rate_limited"
    TRUNCATED = "truncated"
    INVALID_OUTPUT = "invalid_output"
    PROVIDER_UNAVAILABLE = "provider_unavailable"

    # Non-retriable
    AUTH = "auth"
    INVALID_REQUEST = "invalid_request"
    UNKNOWN = "unknown"

    # Used only by the attempt loop, not the LLM client
    TIMEOUT_EXCEEDED = "timeout_exceeded"


LLM_ERROR_CATEGORY_STATUS = {
    LLMClientErrorCategory.TRANSIENT: 503,
    LLMClientErrorCategory.RATE_LIMITED: 429,
    LLMClientErrorCategory.TRUNCATED: 502,
    LLMClientErrorCategory.INVALID_OUTPUT: 502,
    LLMClientErrorCategory.PROVIDER_UNAVAILABLE: 503,
    LLMClientErrorCategory.AUTH: 502,
    LLMClientErrorCategory.INVALID_REQUEST: 500,
    LLMClientErrorCategory.UNKNOWN: 500,
    LLMClientErrorCategory.TIMEOUT_EXCEEDED: 504,
}


class LLMClientError(Exception):
    """Raise when LLM client fails to generate a response.
    Used internally to map provider-specific exceptions
    to a broad category for error-handling"""

    def __init__(
        self,
        category: LLMClientErrorCategory,
        provider: str,
        model: str,
        request,
        desc: str,
        retry_after: Optional[float] = None,
    ):
        message = f"{category} ERROR. {provider} client with {model} model failed to handle request: {request}.\n{desc}"

        super().__init__(message)

        self.category = category
        self.provider = provider
        self.model = model
        self.request = request
        self.desc = desc
        self.retry_after = retry_after


class LLMRequestFailedError(Exception):
    """Raise when LLM client fails to process a request.
    Used as wrapper for LLMClientError to pass the exception to the caller service"""

    def __init__(self, original: LLMClientError, attempts: int):
        message = (
            f"LLM request failed after {attempts} attempt(s) "
            f"[{original.category}]: {original}"
        )
        super().__init__(message)

        self.original = original
        self.attempts = attempts


class ProviderNotSupportedError(Exception):
    """Raise on get_llm_client() when provider is not found"""

    def __init__(self, provider: str):
        message = f"{provider} provider could not be found or is not supported"

        super().__init__(message)

        self.provider = provider
