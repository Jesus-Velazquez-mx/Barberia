import asyncio
import io
import os

import pytest
from botocore.exceptions import (
    ClientError,
    ConnectTimeoutError,
    EndpointConnectionError,
    NoCredentialsError,
    ReadTimeoutError,
)
from PIL import Image

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")

from app.core.config import Settings
from app.llm import image_loader
from app.llm.llm_exception import LLMClientErrorCategory


def _settings(**overrides) -> Settings:
    return Settings(AI_SERVICE_API_KEY="test-key", **overrides)  # type: ignore[call-arg]


def _image_bytes(
    size=(200, 100), mode="RGB", fmt="JPEG", exif_orientation: int | None = None
) -> bytes:
    image = Image.new(mode, size, "red")
    buffer = io.BytesIO()
    kwargs = {}
    if exif_orientation:
        exif = Image.Exif()
        exif[0x0112] = exif_orientation
        kwargs["exif"] = exif
    image.save(buffer, format=fmt, **kwargs)
    return buffer.getvalue()


PREFIX = "photos/"
KEY = PREFIX + "7f1c2d3e"


class _FakeBody:
    def __init__(self, chunks: list[bytes]):
        self.chunks = chunks
        self.closed = False

    def iter_chunks(self, chunk_size):
        yield from self.chunks

    def close(self):
        self.closed = True


class _FakeS3:
    def __init__(self, content: bytes | None = None, error: Exception | None = None):
        self.content = content
        self.error = error
        self.calls: list[dict] = []
        self.body: _FakeBody | None = None

    def get_object(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        assert self.content is not None
        self.body = _FakeBody([self.content[i : i + 50] for i in range(0, len(self.content), 50)])
        return {"Body": self.body, "ContentLength": len(self.content)}


def _s3_settings(**overrides) -> Settings:
    values = {
        "AWS_BUCKET": "private-bucket",
        "AWS_REGION": "us-east-1",
        "AWS_BUCKET_KEY_PREFIX": PREFIX,
        **overrides,
    }
    return _settings(**values)


@pytest.fixture
def s3(monkeypatch):
    monkeypatch.setattr(image_loader, "get_settings", lambda: _s3_settings())

    def install(content: bytes | None = None, error: Exception | None = None) -> _FakeS3:
        fake = _FakeS3(content, error)
        monkeypatch.setattr(image_loader, "_s3_client", lambda: fake)
        return fake

    return install


def _client_error(code: str, status: int) -> ClientError:
    return ClientError(
        {"Error": {"Code": code}, "ResponseMetadata": {"HTTPStatusCode": status}},
        "GetObject",
    )


def _load_key(key=KEY) -> bytes:
    return asyncio.run(image_loader.load_image_from_key(key))


def _key_error(key=KEY) -> image_loader.ImageLoadError:
    with pytest.raises(image_loader.ImageLoadError) as exc_info:
        _load_key(key)
    return exc_info.value


def test_s3_returns_jpeg_rgb_and_requests_the_configured_bucket(s3) -> None:
    fake = s3(_image_bytes(mode="RGBA", fmt="PNG"))

    result = _load_key()

    with Image.open(io.BytesIO(result)) as image:
        assert image.format == "JPEG"
        assert image.mode == "RGB"
    assert fake.calls == [{"Bucket": "private-bucket", "Key": KEY}]
    assert fake.body is not None and fake.body.closed


@pytest.mark.parametrize(
    "key",
    [
        "",
        PREFIX,  # solo el prefijo, sin id
        "other/7f1c2d3e",  # fuera del prefijo
        "/" + KEY,
        PREFIX + "../secrets/a",
        PREFIX + "a/../../b",
        PREFIX + "a\nb",
        PREFIX + "x" * 1100,
    ],
)
def test_s3_rejects_keys_outside_the_prefix_without_requesting(s3, key) -> None:
    fake = s3(_image_bytes())

    error = _key_error(key)

    assert error.category == LLMClientErrorCategory.INVALID_PHOTO
    assert fake.calls == []


@pytest.mark.parametrize(
    "overrides",
    [{"AWS_BUCKET": ""}, {"AWS_REGION": ""}, {"AWS_BUCKET_KEY_PREFIX": ""}],
)
def test_s3_fails_closed_when_not_configured(s3, monkeypatch, overrides) -> None:
    fake = s3(_image_bytes())
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _s3_settings(**overrides)
    )

    error = _key_error()

    # Es un problema del servicio, no del contenido enviado por el cliente
    assert error.category == LLMClientErrorCategory.UNKNOWN
    assert fake.calls == []


@pytest.mark.parametrize(
    ("code", "status", "category"),
    [
        ("NoSuchKey", 404, LLMClientErrorCategory.INVALID_PHOTO),
        ("AccessDenied", 403, LLMClientErrorCategory.INVALID_PHOTO),
        ("InvalidAccessKeyId", 403, LLMClientErrorCategory.AUTH),
        ("SignatureDoesNotMatch", 403, LLMClientErrorCategory.AUTH),
        ("SlowDown", 503, LLMClientErrorCategory.TRANSIENT),
        ("InternalError", 500, LLMClientErrorCategory.TRANSIENT),
        ("Teapot", 418, LLMClientErrorCategory.UNKNOWN),
    ],
)
def test_s3_error_codes_are_categorized(s3, code, status, category) -> None:
    s3(error=_client_error(code, status))

    assert _key_error().category == category


@pytest.mark.parametrize(
    ("error", "category"),
    [
        (ReadTimeoutError(endpoint_url="https://s3"), LLMClientErrorCategory.TRANSIENT),
        (
            ConnectTimeoutError(endpoint_url="https://s3"),
            LLMClientErrorCategory.TRANSIENT,
        ),
        (
            EndpointConnectionError(endpoint_url="https://s3"),
            LLMClientErrorCategory.PROVIDER_UNAVAILABLE,
        ),
        (NoCredentialsError(), LLMClientErrorCategory.AUTH),
    ],
)
def test_s3_connection_errors_are_categorized(s3, error, category) -> None:
    s3(error=error)

    assert _key_error().category == category


def test_s3_rejects_object_over_limit(s3, monkeypatch) -> None:
    s3(b"x" * 500)
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _s3_settings(IMAGE_MAX_BYTES=100)
    )

    assert "larger than" in _key_error().desc


def test_s3_rejects_streamed_size_over_limit_without_declared_length(
    s3, monkeypatch
) -> None:
    fake = s3(b"x" * 500)
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _s3_settings(IMAGE_MAX_BYTES=100)
    )
    original = fake.get_object
    # Sin ContentLength declarado: el límite debe aplicarse mientras llega
    fake.get_object = lambda **kw: {"Body": original(**kw)["Body"]}  # type: ignore[method-assign]

    assert "larger than" in _key_error().desc
    assert fake.body is not None and fake.body.closed


def test_s3_rejects_file_that_is_not_an_image(s3) -> None:
    s3(b"definitely not an image")

    error = _key_error()

    assert error.category == LLMClientErrorCategory.INVALID_PHOTO
    assert "not a valid image" in error.desc


def test_s3_client_uses_explicit_credentials_from_settings(monkeypatch) -> None:
    from pydantic import SecretStr

    image_loader._build_s3_client.cache_clear()
    monkeypatch.setattr(
        image_loader,
        "get_settings",
        lambda: _s3_settings(
            AWS_ACCESS_KEY_ID="AKIATEST", AWS_SECRET_ACCESS_KEY=SecretStr("secret")
        ),
    )

    client = image_loader._s3_client()

    credentials = client._request_signer._credentials
    assert credentials.access_key == "AKIATEST"
    assert credentials.secret_key == "secret"
    assert client.meta.region_name == "us-east-1"
    image_loader._build_s3_client.cache_clear()


# --- Normalización de la imagen ------------------------------------------------


def test_downscales_longest_side(s3, monkeypatch) -> None:
    s3(_image_bytes(size=(400, 200)))
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _s3_settings(IMAGE_MAX_SIDE=64)
    )

    with Image.open(io.BytesIO(_load_key())) as image:
        assert image.size == (64, 32)


def test_applies_exif_orientation_and_strips_metadata(s3) -> None:
    # Orientación 6 = rotar 90°: una imagen de 200x100 debe quedar de 100x200
    s3(_image_bytes(size=(200, 100), exif_orientation=6))

    with Image.open(io.BytesIO(_load_key())) as image:
        assert image.size == (100, 200)
        assert not image.getexif()


def test_rejects_unsupported_image_format(s3) -> None:
    s3(_image_bytes(fmt="GIF"))

    assert _key_error().category == LLMClientErrorCategory.INVALID_PHOTO


def test_rejects_truncated_image(s3) -> None:
    s3(_image_bytes(size=(300, 300))[:200])

    assert _key_error().category == LLMClientErrorCategory.INVALID_PHOTO


def test_rejects_too_many_pixels(s3, monkeypatch) -> None:
    s3(_image_bytes(size=(200, 100)))
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _s3_settings(IMAGE_MAX_PIXELS=1000)
    )

    assert "too large" in _key_error().desc
