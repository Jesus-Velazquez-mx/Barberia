import base64
import io
import os

import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")

from app.api import face as face_api
from app.core.config import Settings, get_settings
from app.llm.image_loader import ImageLoadError
from app.llm.llm_exception import LLMClientErrorCategory
from app.services import face_classifier
from main import app

URL = "https://bucket.s3.us-east-1.amazonaws.com/photo.jpg?X-Amz-Signature=secret"
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
def loaded_urls(monkeypatch) -> list[str]:
    urls: list[str] = []

    async def fake_load_image(url: str) -> bytes:
        urls.append(url)
        return _jpeg()

    monkeypatch.setattr(face_api, "load_image", fake_load_image)
    return urls


def _post(client: TestClient, data: dict):
    return client.post(
        ENDPOINT, headers=HEADERS, json={"data": data, "provider": "anthropic"}
    )


def test_classifies_from_photo_url(client, loaded_urls) -> None:
    resp = _post(client, {"photoUrl": URL})

    assert resp.status_code == 200
    assert resp.json()["data"] == {"facialStructure": "heart"}
    assert loaded_urls == [URL]


def test_classifies_from_base64_without_downloading(client, loaded_urls) -> None:
    photo = base64.b64encode(_jpeg()).decode()

    resp = _post(client, {"photo": photo})

    assert resp.status_code == 200
    assert resp.json()["data"] == {"facialStructure": "heart"}
    assert loaded_urls == []


@pytest.mark.parametrize(
    "data",
    [
        {},
        {"photoUrl": URL, "photo": "aGVsbG8="},
    ],
    ids=["neither", "both"],
)
def test_requires_exactly_one_source(client, loaded_urls, data) -> None:
    resp = _post(client, data)

    assert resp.status_code == 400
    assert resp.json()["message"] == "Request validation failed"
    assert loaded_urls == []


def test_invalid_url_is_unprocessable_content(client, monkeypatch) -> None:
    async def rejecting(url: str) -> bytes:
        raise ImageLoadError(
            LLMClientErrorCategory.INVALID_REQUEST,
            "Image URL host is not in the allowed list",
        )

    monkeypatch.setattr(face_api, "load_image", rejecting)

    resp = _post(client, {"photoUrl": URL})

    assert resp.status_code == 422
    assert resp.json()["errors"] == [
        {"field": "photoUrl", "detail": "Image URL host is not in the allowed list"}
    ]
    assert "Signature" not in resp.text


def test_invalid_base64_reports_photo_field(client) -> None:
    resp = _post(client, {"photo": "not base64!!"})

    assert resp.status_code == 422
    assert resp.json()["errors"][0]["field"] == "photo"


@pytest.mark.parametrize(
    ("category", "status"),
    [
        (LLMClientErrorCategory.TRANSIENT, 503),
        (LLMClientErrorCategory.PROVIDER_UNAVAILABLE, 503),
    ],
)
def test_storage_failures_are_not_reported_as_client_errors(
    client, monkeypatch, category, status
) -> None:
    async def failing(url: str) -> bytes:
        raise ImageLoadError(category, "Image download timed out")

    monkeypatch.setattr(face_api, "load_image", failing)

    resp = _post(client, {"photoUrl": URL})

    assert resp.status_code == status
    assert resp.json()["message"] == "Image download timed out"


def test_requires_api_key(client, loaded_urls) -> None:
    resp = client.post(
        ENDPOINT, json={"data": {"photoUrl": URL}, "provider": "anthropic"}
    )

    assert resp.status_code == 401
    assert loaded_urls == []
