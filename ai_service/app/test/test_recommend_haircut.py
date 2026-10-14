import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.schemas.api import ApiRequest
from app.schemas.haircut import (
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
)
from app.schemas.llm import LLMErrorResponse
from app.services import recommend_haircut as service_module
from app.services.unprocessable_exception import UnprocessableContentError
from main import app

PHOTO_URL = "https://example-bucket.s3.amazonaws.com/photos/user-1.jpg"

USER_DATA: dict = {
    "age": 25,
    "gender": "male",
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

    async def generate_structured_response(self, prompt, schema, image_url=None):
        self.calls.append({"prompt": prompt, "schema": schema, "image_url": image_url})
        return self.result


@pytest.fixture
def use_fake_llm(monkeypatch):
    def _use(result, facial_structure="oval"):
        client = FakeLLMClient(result)
        monkeypatch.setattr(service_module, "get_llm_client", lambda provider: client)

        async def fake_detect(photo):
            client.classified_photo = photo
            return facial_structure

        # Evita cargar el modelo de PyTorch y descargar la foto en las pruebas
        monkeypatch.setattr(service_module, "_detect_facial_structure", fake_detect)
        return client

    return _use


def build_payload(haircuts=None) -> dict:
    return {
        "provider": "anthropic",
        "data": {
            "suggestedHaircuts": HAIRCUTS if haircuts is None else haircuts,
            "photo": PHOTO_URL,
            "userData": USER_DATA,
        },
    }


def build_request(haircuts=None) -> ApiRequest[HaircutRecommendationRequest]:
    return ApiRequest[HaircutRecommendationRequest].model_validate(
        build_payload(haircuts)
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


def run_service(req):
    return asyncio.run(service_module.recommend_haircut(req))


# ---------- Servicio ----------


def test_valid_response_is_returned(use_fake_llm):
    client = use_fake_llm(llm_result())

    res = run_service(build_request())

    assert [h.id for h in res.haircuts] == ["1"]
    assert res.confidence == 0.9
    assert len(client.calls) == 1


def test_photo_url_is_sent_as_image_not_in_prompt(use_fake_llm):
    client = use_fake_llm(llm_result())

    run_service(build_request())

    call = client.calls[0]
    assert call["image_url"] == PHOTO_URL
    assert PHOTO_URL not in str(call["prompt"])
    assert call["schema"] is HaircutRecommendationResponse


def test_prompt_contains_candidate_haircuts(use_fake_llm):
    client = use_fake_llm(llm_result())

    run_service(build_request())

    prompt = str(client.calls[0]["prompt"])
    assert "Low fade" in prompt
    assert "Pompadour" in prompt


def test_detected_facial_structure_is_included_in_prompt(use_fake_llm):
    client = use_fake_llm(llm_result(), facial_structure="round")

    run_service(build_request())

    prompt = str(client.calls[0]["prompt"])
    block = prompt.split("<facial_structure>")[1].split("</facial_structure>")[0]
    assert block.strip() == "round"
    assert client.classified_photo == PHOTO_URL


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
    ],
)
def test_invalid_llm_response_raises_unprocessable(
    use_fake_llm, bad_result, expected_field
):
    use_fake_llm(bad_result)

    with pytest.raises(UnprocessableContentError) as exc:
        run_service(build_request())

    assert expected_field in {e.field for e in exc.value.errors}


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


def test_endpoint_returns_422_when_content_is_invalid(use_fake_llm):
    use_fake_llm(llm_result(confidence=2.0))

    res = TestClient(app).post(ENDPOINT, json=build_payload(), headers=auth_headers())

    assert res.status_code == 422
    assert res.json()["errors"]