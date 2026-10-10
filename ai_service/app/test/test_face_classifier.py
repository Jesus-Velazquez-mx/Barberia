import base64
import hashlib
import io
import os
import subprocess
import sys

import httpx
import pytest
import torch
from PIL import Image

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")

from app.core.config import Settings
from app.llm.image_loader import ImageLoadError
from app.schemas.face import FacialStructureType
from app.services import face_classifier

PAYLOAD = b"fake-model-weights" * 1000
PAYLOAD_SHA256 = hashlib.sha256(PAYLOAD).hexdigest()
URL = "https://huggingface.co/owner/repo/resolve/abc123/model.pth"


def _settings(**overrides) -> Settings:
    return Settings(AI_SERVICE_API_KEY="test-key", **overrides)  # type: ignore[call-arg]


def _serve(monkeypatch, handler) -> list[str]:
    """Hace que download_model_if_missing use un transporte simulado en lugar de la red."""
    requested: list[str] = []

    def fake_stream(method, url, **kwargs):
        requested.append(url)
        client = httpx.Client(transport=httpx.MockTransport(handler))
        return client.stream(method, url, **kwargs)

    monkeypatch.setattr(face_classifier.httpx, "stream", fake_stream)
    return requested


def _image_b64(size=(300, 200), fmt="JPEG", prefix="") -> str:
    buffer = io.BytesIO()
    Image.new("RGB", size, "tan").save(buffer, format=fmt)
    return prefix + base64.b64encode(buffer.getvalue()).decode()


class _FakeModel(torch.nn.Module):
    """Devuelve logits fijos para la clase indicada, sin importar la entrada."""

    def __init__(self, predicted_index: int):
        super().__init__()
        self.predicted_index = predicted_index
        self.seen_shape: tuple[int, ...] | None = None

    def forward(self, x):
        self.seen_shape = tuple(x.shape)
        logits = torch.zeros(x.shape[0], len(face_classifier.class_names))
        logits[:, self.predicted_index] = 10.0
        return logits


@pytest.fixture
def fake_model(monkeypatch):
    def install(predicted_class: str) -> _FakeModel:
        model = _FakeModel(face_classifier.class_names.index(predicted_class))
        monkeypatch.setattr(
            face_classifier, "get_model", lambda: (model, torch.device("cpu"))
        )
        return model

    return install


# --- Esquema / mapeo -------------------------------------------------------


def test_every_mapped_label_is_a_valid_facial_structure() -> None:
    valid = {member.value for member in FacialStructureType}

    assert set(face_classifier.label_map.values()) <= valid


def test_every_class_name_has_a_mapping() -> None:
    mapped = set(face_classifier.label_map)

    assert {name.lower() for name in face_classifier.class_names} <= mapped


# --- Importar el módulo no tiene efectos secundarios --------------------------


def test_import_does_not_download_or_load_the_model() -> None:
    code = (
        "import socket\n"
        "def blocked(*a, **k): raise AssertionError('network access at import time')\n"
        "socket.socket.connect = blocked\n"
        "import app.services.face_classifier as fc\n"
        "assert fc._model is None\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", code],
        capture_output=True,
        text=True,
        cwd=face_classifier.PROJECT_ROOT,
        env={**os.environ, "AI_SERVICE_API_KEY": "test-key"},
    )

    assert result.returncode == 0, result.stderr


def test_get_model_before_load_raises(monkeypatch) -> None:
    monkeypatch.setattr(face_classifier, "_model", None)

    with pytest.raises(RuntimeError):
        face_classifier.get_model()


# --- Descarga y verificación ------------------------------------------------------


def test_downloads_and_verifies_model(tmp_path, monkeypatch) -> None:
    target = tmp_path / "models" / "model.pth"
    requested = _serve(monkeypatch, lambda request: httpx.Response(200, content=PAYLOAD))

    face_classifier.download_model_if_missing(URL, target, PAYLOAD_SHA256, 5.0)

    assert target.read_bytes() == PAYLOAD
    assert not target.with_name("model.pth.part").exists()
    assert requested == [URL]


def test_hash_mismatch_raises_and_leaves_no_file(tmp_path, monkeypatch) -> None:
    target = tmp_path / "model.pth"
    _serve(monkeypatch, lambda request: httpx.Response(200, content=b"tampered"))

    with pytest.raises(face_classifier.ModelIntegrityError):
        face_classifier.download_model_if_missing(URL, target, PAYLOAD_SHA256, 5.0)

    assert not target.exists()
    assert not target.with_name("model.pth.part").exists()


def test_http_error_leaves_no_file(tmp_path, monkeypatch) -> None:
    target = tmp_path / "model.pth"
    _serve(monkeypatch, lambda request: httpx.Response(503))

    with pytest.raises(httpx.HTTPStatusError):
        face_classifier.download_model_if_missing(URL, target, PAYLOAD_SHA256, 5.0)

    assert not target.exists()
    assert not target.with_name("model.pth.part").exists()


def test_existing_valid_file_is_not_downloaded_again(tmp_path, monkeypatch) -> None:
    target = tmp_path / "model.pth"
    target.write_bytes(PAYLOAD)
    requested = _serve(monkeypatch, lambda request: httpx.Response(200, content=b"x"))

    face_classifier.download_model_if_missing(URL, target, PAYLOAD_SHA256, 5.0)

    assert requested == []
    assert target.read_bytes() == PAYLOAD


def test_existing_corrupt_file_is_replaced(tmp_path, monkeypatch) -> None:
    target = tmp_path / "model.pth"
    target.write_bytes(b"truncated")
    _serve(monkeypatch, lambda request: httpx.Response(200, content=PAYLOAD))

    face_classifier.download_model_if_missing(URL, target, PAYLOAD_SHA256, 5.0)

    assert target.read_bytes() == PAYLOAD


def test_expected_hash_comparison_is_case_insensitive(tmp_path, monkeypatch) -> None:
    target = tmp_path / "model.pth"
    _serve(monkeypatch, lambda request: httpx.Response(200, content=PAYLOAD))

    face_classifier.download_model_if_missing(
        URL, target, PAYLOAD_SHA256.upper(), 5.0
    )

    assert target.exists()


# --- Clasificación ------------------------------------------------------------------


@pytest.mark.parametrize(
    ("predicted", "expected"),
    [
        ("Heart", "heart"),
        ("Oblong", "rectangle"),
        ("Oval", "oval"),
        ("Round", "round"),
        ("Square", "square"),
    ],
)
def test_classify_maps_prediction_to_enum(fake_model, predicted, expected) -> None:
    model = fake_model(predicted)

    shape = face_classifier.classify_face_shape(_image_b64())

    assert shape == expected
    assert FacialStructureType(shape)
    assert model.seen_shape == (1, 3, 224, 224)


def test_classify_accepts_data_url_prefix(fake_model) -> None:
    fake_model("Oval")

    shape = face_classifier.classify_face_shape(
        _image_b64(prefix="data:image/jpeg;base64,")
    )

    assert shape == "oval"


def test_classify_accepts_png(fake_model) -> None:
    fake_model("Round")

    assert face_classifier.classify_face_shape(_image_b64(fmt="PNG")) == "round"


def test_classify_does_not_keep_module_level_result(fake_model) -> None:
    fake_model("Square")

    face_classifier.classify_face_shape(_image_b64())

    assert not hasattr(face_classifier, "_latest_detected_structure")
    assert not hasattr(face_classifier, "get_latest_structure")


def test_classify_rejects_invalid_base64(fake_model) -> None:
    fake_model("Oval")

    with pytest.raises(ImageLoadError):
        face_classifier.classify_face_shape("this is !!! not base64")


def test_classify_rejects_non_image_payload(fake_model) -> None:
    fake_model("Oval")
    payload = base64.b64encode(b"definitely not an image").decode()

    with pytest.raises(ImageLoadError):
        face_classifier.classify_face_shape(payload)


def test_classify_rejects_oversized_payload(fake_model, monkeypatch) -> None:
    fake_model("Oval")
    monkeypatch.setattr(
        face_classifier, "get_settings", lambda: _settings(IMAGE_MAX_BYTES=100)
    )

    with pytest.raises(ImageLoadError):
        face_classifier.classify_face_shape(_image_b64(size=(400, 400)))
