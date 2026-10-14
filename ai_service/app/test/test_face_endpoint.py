import io
import os

import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")

from app.core.config import Settings, get_settings
from app.llm.image_loader import ImageLoadError
from app.llm.llm_exception import LLMClientErrorCategory
from app.services import face_classifier
from main import app

KEY = "photos/7f1c2d3e"
ENDPOINT = "/internal/v1/face/detect-structure"
HEADERS = {"X-Internal-Api-Key": "test-key"}


def _test_settings() -> Settings:
    return Settings(AI_SERVICE_API_KEY="test-key")  # type: ignore[call-arg]


def _jpeg() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (300, 200), "tan").save(buffer, format="JPEG")
    return buffer.getvalue()


class _FakeModel(torch.nn.Module):
    def __init__(self, predicted_class: str):
        super().__init__()
        self.index = face_classifier.class_names.index(predicted_class)

    def forward(self, x):
        logits = torch.zeros(x.shape[0], len(face_classifier.class_names))
        logits[:, self.index] = 10.0
        return logits


@pytest.fixture
def client(monkeypatch):
    app.dependency_overrides[get_settings] = _test_settings
    model = _FakeModel("Heart")
    monkeypatch.setattr(
        face_classifier, "get_model", lambda: (model, torch.device("cpu"))
    )
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def loaded_keys(monkeypatch) -> list[str]:
    keys: list[str] = []

    async def fake_load_image_from_key(key: str) -> bytes:
        keys.append(key)
        return _jpeg()

    monkeypatch.setattr(
        face_classifier, "load_image_from_key", fake_load_image_from_key
    )
    return keys


def _post(client: TestClient, data: dict):
    return client.post(
        ENDPOINT, headers=HEADERS, json={"data": data, "provider": "anthropic"}
    )


def test_classifies_from_photo_key(client, loaded_keys) -> None:
    resp = _post(client, {"photoKey": KEY})

    assert resp.status_code == 200
    assert resp.json()["data"] == {"facialStructure": "heart"}
    assert loaded_keys == [KEY]


@pytest.mark.parametrize(
    "data",
    [
        {},
        {"photoKey": ""},
        {"photoUrl": "https://bucket.s3.amazonaws.com/photo.jpg"},
        {"photo": "aGVsbG8="},
    ],
    ids=["missing", "empty", "url-no-longer-accepted", "base64-no-longer-accepted"],
)
def test_requires_photo_key(client, loaded_keys, data) -> None:
    resp = _post(client, data)

    assert resp.status_code == 400
    assert resp.json()["message"] == "Request validation failed"
    assert loaded_keys == []


def test_invalid_key_is_unprocessable_content(client, monkeypatch) -> None:
    async def rejecting(key: str) -> bytes:
        raise ImageLoadError(
            LLMClientErrorCategory.INVALID_REQUEST, "Photo key is not valid"
        )

    monkeypatch.setattr(face_classifier, "load_image_from_key", rejecting)

    resp = _post(client, {"photoKey": "other/abc"})

    assert resp.status_code == 422
    assert resp.json()["errors"] == [
        {"field": "photoKey", "detail": "Photo key is not valid"}
    ]


@pytest.mark.parametrize(
    ("category", "status"),
    [
        (LLMClientErrorCategory.TRANSIENT, 503),
        (LLMClientErrorCategory.PROVIDER_UNAVAILABLE, 503),
        (LLMClientErrorCategory.AUTH, 502),
        (LLMClientErrorCategory.UNKNOWN, 500),
    ],
)
def test_storage_failures_are_not_reported_as_client_errors(
    client, monkeypatch, category, status
) -> None:
    async def failing(key: str) -> bytes:
        raise ImageLoadError(category, "Image storage failure")

    monkeypatch.setattr(face_classifier, "load_image_from_key", failing)

    resp = _post(client, {"photoKey": KEY})

    assert resp.status_code == status
    assert resp.json()["message"] == "Image storage failure"


def test_requires_api_key(client, loaded_keys) -> None:
    resp = client.post(
        ENDPOINT, json={"data": {"photoKey": KEY}, "provider": "anthropic"}
    )

    assert resp.status_code == 401
    assert loaded_keys == []
