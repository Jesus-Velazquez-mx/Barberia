from app.schemas.api import BaseApiRequest, ContentError


class UnprocessableContentError(Exception):
    """Raise when request was well-formed but deterministic validation
    or LLM validation failed for the request's content"""

    def __init__(self, request: BaseApiRequest, errors: list[ContentError] | None = None):
        message = "Request was well-formed but content could not be processed."

        super().__init__(message)

        self.request = request
        self.errors = errors or []
