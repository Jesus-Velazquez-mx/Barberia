from app.schemas.api import ApiResponse, ContentError
from app.schemas.jd_analyze import JdAnalysisResult
from app.utils.json_utils import build_json_response

import json
import pytest
from pydantic import ValidationError


def _result(**overrides) -> JdAnalysisResult:
    values = dict(
        required_skills=["cortes"],
        seniority_level="mid",
        tone="formal",
        key_responsibilities=["cortar"],
        location="Centro",
        work_arrangement="on-site",
        employment_type="full-time",
    )
    values.update(overrides)
    return JdAnalysisResult(**values)  # type: ignore[arg-type]


def test_build_json_response_uses_camel_case_keys() -> None:
    res = build_json_response(ApiResponse(data=_result(), message="ok"))
    body = json.loads(res.body)

    assert set(body["data"]) == {
        "requiredSkills",
        "preferredSkills",
        "seniorityLevel",
        "employmentType",
        "tone",
        "keyResponsibilities",
        "location",
        "workArrangement",
    }
    assert "required_skills" not in body["data"]


def test_build_json_response_omits_none_fields() -> None:
    res = build_json_response(
        ApiResponse(data=_result(employment_type=None), message="ok")
    )
    body = json.loads(res.body)

    assert "employmentType" not in body["data"]
    assert "companyName" not in body["data"]


def test_build_json_response_keeps_error_fields() -> None:
    res = build_json_response(
        ApiResponse(
            message="bad", errors=[ContentError(field="jobTitle", detail="short")]
        ),
        status_code=422,
    )
    body = json.loads(res.body)

    assert res.status_code == 422
    assert body["errors"] == [{"field": "jobTitle", "detail": "short"}]


@pytest.mark.parametrize("field", ["seniority_level", "tone"])
def test_jd_result_rejects_values_outside_schema(field: str) -> None:
    with pytest.raises(ValidationError):
        _result(**{field: "Professional"})
