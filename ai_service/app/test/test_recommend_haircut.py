import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.llm.error_handling import is_retriable
from app.llm.llm_exception import (
    LLMClientError,
    LLMClientErrorCategory,
    LLMRequestFailedError,
)
from app.schemas.api import ApiRequest
from app.schemas.haircut import (
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
)
from app.schemas.llm import LLMErrorResponse
from app.services import face_classifier
from app.services import recommend_haircut as service_module
from app.services.unprocessable_exception import UnprocessableContentError
from main import app

PHOTO_KEY = "photos/user-1"

USER_DATA: dict = {
    "age": 25,
    "gender": "male",
    "facialStructure": "oval",
    "userPreferences": "Bajo mantenimiento, que se vea natural",
}

HAIRCUTS = [
    {"id": "1", "name": "Low fade", "description": "Short on the sides"},
    {"id": "2", "name": "Pompadour", "description": "Volume on top"},
]


class FakeLLMClient:
    """Reemplaza al cliente real: no hace llamadas de red ni gasta tokens"""

    provider = "Fake"
    model = "fake-model"

    def __init__(self, result):
        self.result = result
        self.calls: list[dict] = []

    async def generate_structured_response(self, prompt, schema, photo_key=None):
        self.calls.append({"prompt": prompt, "schema": schema, "photo_key": photo_key})
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.fixture(autouse=True)
def classifier_must_not_run(monkeypatch):
    """La estructura facial la detecta el backend, no este endpoint"""

    def fail(*args, **kwargs):
        raise AssertionError("The face classifier must not run when recommending")

    monkeypatch.setattr(face_classifier, "classify_face_shape", fail)
    monkeypatch.setattr(face_classifier, "classify_image_bytes", fail)


@pytest.fixture
def use_fake_llm(monkeypatch):
    def _use(result):
        client = FakeLLMClient(result)
        monkeypatch.setattr(service_module, "get_llm_client", lambda provider: client)
        return client

    return _use


def build_payload(haircuts=None, facial_structure="oval", photo_key=PHOTO_KEY) -> dict:
    return {
        "provider": "anthropic",
        "data": {
            "suggestedHaircuts": HAIRCUTS if haircuts is None else haircuts,
            "photoKey": photo_key,
            "userData": {**USER_DATA, "facialStructure": facial_structure},
        },
    }


def build_request(
    haircuts=None, facial_structure="oval"
) -> ApiRequest[HaircutRecommendationRequest]:
    return ApiRequest[HaircutRecommendationRequest].model_validate(
        build_payload(haircuts, facial_structure)
    )


def llm_result(
    haircuts=None,
    suggestion_text="Te recomiendo este corte.",
    reasoning="Se ajusta a tu tipo de rostro.",
    confidence=0.9,
) -> HaircutRecommendationResponse:
    return HaircutRecommendationResponse.model_validate(
        {
            "haircuts": haircuts if haircuts is not None else [HAIRCUTS[0]],
            "suggestionText": suggestion_text,
            "reasoning": reasoning,
            "confidence": confidence,
        }
    )


def no_suitable_result(
    haircuts=None, reasoning="Buscas el cabello largo y solo hay cortes cortos."
) -> HaircutRecommendationResponse:
    return HaircutRecommendationResponse.model_validate(
        {
            "status": "no_suitable_haircut",
            "haircuts": haircuts or [],
            "reasoning": reasoning,
        }
    )


def run_service(req):
    return asyncio.run(service_module.recommend_haircut(req))


# ---------- Servicio ----------


def test_valid_response_is_returned(use_fake_llm):
    client = use_fake_llm(llm_result())

    res = run_service(build_request())

    assert [h.id for h in res.haircuts] == ["1"]
    assert res.confidence == 0.9
    assert len(client.calls) == 1


def test_photo_key_is_sent_to_the_client_not_in_prompt(use_fake_llm):
    client = use_fake_llm(llm_result())

    run_service(build_request())

    call = client.calls[0]
    assert call["photo_key"] == PHOTO_KEY
    assert PHOTO_KEY not in str(call["prompt"])
    assert call["schema"] is HaircutRecommendationResponse


def test_prompt_contains_candidate_haircuts(use_fake_llm):
    client = use_fake_llm(llm_result())

    run_service(build_request())

    prompt = str(client.calls[0]["prompt"])
    assert "Low fade" in prompt
    assert "Pompadour" in prompt


def test_facial_structure_from_request_is_included_once_in_prompt(use_fake_llm):
    client = use_fake_llm(llm_result())

    run_service(build_request(facial_structure="round"))

    prompt = str(client.calls[0]["prompt"])
    block = prompt.split("<facial_structure>")[1].split("</facial_structure>")[0]
    user_data = prompt.split("<user_data>")[1].split("</user_data>")[0]
    assert block.strip() == "round"
    assert "facialStructure" not in user_data
    assert "userPreferences" in user_data


def test_name_and_description_come_from_request_not_llm(use_fake_llm):
    altered = {"id": "1", "name": "ALTERED", "description": "ALTERED"}
    use_fake_llm(llm_result(haircuts=[altered]))

    res = run_service(build_request())

    assert res.haircuts[0].name == "Low fade"
    assert res.haircuts[0].description == "Short on the sides"


@pytest.mark.parametrize(
    "bad_result, expected_field",
    [
        (llm_result(haircuts=[]), "haircuts"),
        (
            llm_result(haircuts=[{"id": "999", "name": "x", "description": "x"}]),
            "haircuts[0].id",
        ),
        (llm_result(confidence=1.5), "confidence"),
        (llm_result(confidence=-0.1), "confidence"),
        (llm_result(reasoning="   "), "reasoning"),
        (llm_result(suggestion_text=""), "suggestion_text"),
        (llm_result(suggestion_text=None), "suggestion_text"),
        (llm_result(confidence=None), "confidence"),
        (no_suitable_result(haircuts=[HAIRCUTS[0]]), "haircuts"),
        (no_suitable_result(reasoning="  "), "reasoning"),
    ],
)
def test_invalid_llm_response_raises_unprocessable(
    use_fake_llm, bad_result, expected_field
):
    use_fake_llm(bad_result)

    with pytest.raises(UnprocessableContentError) as exc:
        run_service(build_request())

    assert expected_field in {e.field for e in exc.value.errors}


def test_default_status_is_recommended(use_fake_llm):
    use_fake_llm(llm_result())

    res = run_service(build_request())

    assert res.status == "recommended"


def test_no_suitable_haircut_is_returned_with_reason(use_fake_llm):
    use_fake_llm(no_suitable_result())

    res = run_service(build_request())

    assert res.status == "no_suitable_haircut"
    assert res.haircuts == []
    assert "cortos" in res.reasoning
    assert res.suggestion_text is None
    assert res.confidence is None


def test_prompt_explains_no_suitable_haircut_outcome(use_fake_llm):
    client = use_fake_llm(llm_result())

    run_service(build_request())

    prompt = str(client.calls[0]["prompt"])
    assert "no_suitable_haircut" in prompt
    assert "closest compatible one" not in prompt


def test_llm_error_response_raises_unprocessable(use_fake_llm):
    use_fake_llm(
        LLMErrorResponse.model_validate(
            {
                "insufficiencyReason": "The photo does not show the face",
                "fieldsMissingData": ["photo"],
            }
        )
    )

    with pytest.raises(UnprocessableContentError) as exc:
        run_service(build_request())

    fields = {e.field for e in exc.value.errors}
    assert "photo" in fields
    assert any("does not show the face" in e.detail for e in exc.value.errors)


def test_empty_suggested_haircuts_does_not_call_llm(use_fake_llm):
    client = use_fake_llm(llm_result())

    with pytest.raises(UnprocessableContentError) as exc:
        run_service(build_request(haircuts=[]))

    assert "suggested_haircuts" in {e.field for e in exc.value.errors}
    assert client.calls == []


# ---------- Endpoint (requiere que el controlador ya llame al servicio) ----------

ENDPOINT = "/internal/v1/haircut/recommend"


def auth_headers() -> dict:
    return {"X-Internal-Api-Key": get_settings().AI_SERVICE_API_KEY}


def test_endpoint_requires_api_key():
    res = TestClient(app).post(ENDPOINT, json=build_payload())

    assert res.status_code == 401


def test_endpoint_returns_recommendation(use_fake_llm):
    use_fake_llm(llm_result())

    res = TestClient(app).post(ENDPOINT, json=build_payload(), headers=auth_headers())

    assert res.status_code == 200
    body = res.json()
    assert body["data"]["haircuts"][0]["id"] == "1"
    assert body["data"]["confidence"] == 0.9
    assert "suggestionText" in body["data"]
    assert body["data"]["status"] == "recommended"


def test_endpoint_returns_no_suitable_haircut(use_fake_llm):
    use_fake_llm(no_suitable_result())

    res = TestClient(app).post(ENDPOINT, json=build_payload(), headers=auth_headers())

    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "no_suitable_haircut"
    assert data["haircuts"] == []
    assert "cortos" in data["reasoning"]


def test_endpoint_returns_422_when_content_is_invalid(use_fake_llm):
    use_fake_llm(llm_result(confidence=2.0))

    res = TestClient(app).post(ENDPOINT, json=build_payload(), headers=auth_headers())

    assert res.status_code == 422
    assert res.json()["errors"]

def test_unusable_photo_returns_400(use_fake_llm):
    error = LLMClientError(
        LLMClientErrorCategory.INVALID_PHOTO,
        "Fake",
        "fake-model",
        "prompt",
        "Photo was not found",
    )
    client = use_fake_llm(LLMRequestFailedError(error, attempts=1))

    res = TestClient(app).post(ENDPOINT, json=build_payload(), headers=auth_headers())

    assert res.status_code == 400
    assert res.json()["message"] == "Photo was not found"
    assert len(client.calls) == 1


def test_empty_photo_key_returns_400(use_fake_llm):
    client = use_fake_llm(llm_result())

    res = TestClient(app).post(
        ENDPOINT, json=build_payload(photo_key=""), headers=auth_headers()
    )

    assert res.status_code == 400
    assert client.calls == []


def test_missing_facial_structure_returns_400(use_fake_llm):
    client = use_fake_llm(llm_result())
    payload = build_payload()
    del payload["data"]["userData"]["facialStructure"]

    res = TestClient(app).post(ENDPOINT, json=payload, headers=auth_headers())

    assert res.status_code == 400
    assert client.calls == []


def test_invalid_photo_is_not_retried():
    error = LLMClientError(
        LLMClientErrorCategory.INVALID_PHOTO, "Fake", "fake-model", "prompt", "x"
    )

    assert not is_retriable(error)
