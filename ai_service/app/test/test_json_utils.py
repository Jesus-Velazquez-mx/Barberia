from app.schemas.api import ApiResponse, ContentError
from app.schemas.haircut import HaircutRecommendationResponse, HaircutStyle
from app.utils.json_utils import build_json_response

import json
import pytest
from pydantic import ValidationError


def _result(**overrides) -> HaircutRecommendationResponse:
    values = dict(
        status="recommended",
        haircuts=[HaircutStyle(id="1", name="Fade", description="Degradado")],
        suggestion_text="Te queda bien",
        reasoning="Rostro ovalado",
        confidence=0.9,
    )
    values.update(overrides)
    return HaircutRecommendationResponse(**values)  # type: ignore[arg-type]


def test_build_json_response_uses_camel_case_keys() -> None:
    res = build_json_response(ApiResponse(data=_result(), message="ok"))
    body = json.loads(res.body)

    assert set(body["data"]) == {
        "status",
        "haircuts",
        "suggestionText",
        "reasoning",
        "confidence",
    }
    assert "suggestion_text" not in body["data"]


def test_build_json_response_omits_none_fields() -> None:
    res = build_json_response(
        ApiResponse(data=_result(confidence=None), message="ok")
    )
    body = json.loads(res.body)

    assert "confidence" not in body["data"]
    assert "description" in body["data"]["haircuts"][0]


def test_build_json_response_keeps_error_fields() -> None:
    res = build_json_response(
        ApiResponse(
            message="bad", errors=[ContentError(field="photoKey", detail="short")]
        ),
        status_code=422,
    )
    body = json.loads(res.body)

    assert res.status_code == 422
    assert body["errors"] == [{"field": "photoKey", "detail": "short"}]


def test_haircut_result_rejects_values_outside_schema() -> None:
    with pytest.raises(ValidationError):
        _result(status="Professional")
