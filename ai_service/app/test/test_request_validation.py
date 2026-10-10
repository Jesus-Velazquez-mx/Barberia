import pytest

from app.schemas.api import ApiRequest, LLMProvider
from app.schemas.jd_analyze import JdAnalyzeRequest
from app.services.request_validation import validate_request_content
from app.services.unprocessable_exception import UnprocessableContentError


def _req(title: str, description: str) -> ApiRequest[JdAnalyzeRequest]:
    return ApiRequest[JdAnalyzeRequest](
        data=JdAnalyzeRequest(job_title=title, job_description_raw=description),
        provider=LLMProvider.OLLAMA,
    )


def test_short_fields_are_reported_with_camel_case_names() -> None:
    with pytest.raises(UnprocessableContentError) as exc_info:
        validate_request_content(_req("Hi", "corto"))

    fields = {error.field for error in exc_info.value.errors}

    assert fields == {"jobTitle", "jobDescriptionRaw"}


def test_valid_request_passes_validation() -> None:
    validate_request_content(_req("Barbero profesional", "x" * 60))
