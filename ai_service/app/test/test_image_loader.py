import asyncio
import io
import os
import socket

import httpx
import pytest
from PIL import Image

os.environ.setdefault("AI_SERVICE_API_KEY", "test-key")

from app.core.config import Settings
from app.llm import image_loader
from app.llm.llm_exception import LLMClientErrorCategory

REAL_ENSURE_PUBLIC_ADDRESS = image_loader._ensure_public_address

HOST = "bucket.s3.us-east-1.amazonaws.com"
URL = f"https://{HOST}/photo.jpg?X-Amz-Signature=secret"


def _settings(**overrides) -> Settings:
    values = {"IMAGE_ALLOWED_HOSTS": HOST, **overrides}
    return Settings(AI_SERVICE_API_KEY="test-key", **values)  # type: ignore[call-arg]


@pytest.fixture(autouse=True)
def configured(monkeypatch):
    monkeypatch.setattr(image_loader, "get_settings", lambda: _settings())

    async def public(host, port):
        return None

    monkeypatch.setattr(image_loader, "_ensure_public_address", public)


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


def _serve(monkeypatch, handler):
    """Hace que load_image use un transporte simulado en lugar de la red."""
    real = httpx.AsyncClient

    def factory(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(handler)
        return real(*args, **kwargs)

    monkeypatch.setattr(image_loader.httpx, "AsyncClient", factory)


def _ok(content: bytes, content_type="image/jpeg"):
    return lambda request: httpx.Response(
        200, content=content, headers={"content-type": content_type}
    )


def _load(url=URL) -> bytes:
    return asyncio.run(image_loader.load_image(url))


def _error(url=URL) -> image_loader.ImageLoadError:
    with pytest.raises(image_loader.ImageLoadError) as exc_info:
        _load(url)
    return exc_info.value


def test_returns_jpeg_rgb(monkeypatch) -> None:
    _serve(monkeypatch, _ok(_image_bytes(mode="RGBA", fmt="PNG"), "image/png"))

    result = _load()

    with Image.open(io.BytesIO(result)) as image:
        assert image.format == "JPEG"
        assert image.mode == "RGB"


def test_downscales_longest_side(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _settings(IMAGE_MAX_SIDE=64)
    )
    _serve(monkeypatch, _ok(_image_bytes(size=(400, 200))))

    with Image.open(io.BytesIO(_load())) as image:
        assert image.size == (64, 32)


def test_applies_exif_orientation_and_strips_metadata(monkeypatch) -> None:
    # Orientación 6 = rotar 90°: una imagen de 200x100 debe quedar de 100x200
    _serve(monkeypatch, _ok(_image_bytes(size=(200, 100), exif_orientation=6)))

    with Image.open(io.BytesIO(_load())) as image:
        assert image.size == (100, 200)
        assert not image.getexif()


@pytest.mark.parametrize(
    "url",
    [
        f"http://{HOST}/a.jpg",  # sin https
        "https://evil.example.com/a.jpg",  # host fuera de la lista
        f"https://{HOST}.evil.com/a.jpg",  # sufijo engañoso
        f"https://user:pass@{HOST}/a.jpg",  # credenciales en la URL
        "https://169.254.169.254/latest/meta-data",  # IP literal
        "https://[::1]/a.jpg",
        "file:///etc/passwd",
        "not a url",
    ],
)
def test_rejects_disallowed_urls_without_requesting(monkeypatch, url) -> None:
    calls = []
    _serve(monkeypatch, lambda request: calls.append(request) or httpx.Response(200))

    error = _error(url)

    assert error.category == LLMClientErrorCategory.INVALID_REQUEST
    assert calls == []


def test_ip_literal_rejected_even_if_listed(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader,
        "get_settings",
        lambda: _settings(IMAGE_ALLOWED_HOSTS="10.0.0.5"),
    )

    assert _error("https://10.0.0.5/a.jpg").category == (
        LLMClientErrorCategory.INVALID_REQUEST
    )


def test_wildcard_host_pattern(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader,
        "get_settings",
        lambda: _settings(IMAGE_ALLOWED_HOSTS="*.amazonaws.com"),
    )
    _serve(monkeypatch, _ok(_image_bytes()))

    assert _load(URL)
    assert _error("https://amazonaws.com.evil.com/a.jpg").category == (
        LLMClientErrorCategory.INVALID_REQUEST
    )


def test_fails_closed_without_allowed_hosts(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _settings(IMAGE_ALLOWED_HOSTS="")
    )

    error = _error()

    assert error.category == LLMClientErrorCategory.INVALID_REQUEST
    assert "IMAGE_ALLOWED_HOSTS" in error.desc


def test_does_not_follow_redirects(monkeypatch) -> None:
    seen = []

    def handler(request):
        seen.append(str(request.url))
        return httpx.Response(302, headers={"location": "https://evil.com/a.jpg"})

    _serve(monkeypatch, handler)

    assert _error().category == LLMClientErrorCategory.INVALID_REQUEST
    assert len(seen) == 1


@pytest.mark.parametrize(
    ("status", "category"),
    [
        (403, LLMClientErrorCategory.INVALID_REQUEST),
        (404, LLMClientErrorCategory.INVALID_REQUEST),
        (429, LLMClientErrorCategory.TRANSIENT),
        (503, LLMClientErrorCategory.TRANSIENT),
    ],
)
def test_http_error_statuses(monkeypatch, status, category) -> None:
    _serve(monkeypatch, lambda request: httpx.Response(status))

    assert _error().category == category


def test_rejects_non_image_content_type(monkeypatch) -> None:
    _serve(monkeypatch, _ok(b"<html></html>", "text/html"))

    assert _error().category == LLMClientErrorCategory.INVALID_REQUEST


def test_accepts_octet_stream_when_content_is_an_image(monkeypatch) -> None:
    _serve(monkeypatch, _ok(_image_bytes(), "application/octet-stream"))

    assert _load()


def test_rejects_file_that_is_not_an_image(monkeypatch) -> None:
    _serve(monkeypatch, _ok(b"definitely not an image", "image/jpeg"))

    error = _error()

    assert error.category == LLMClientErrorCategory.INVALID_REQUEST
    assert "not a valid image" in error.desc


def test_rejects_unsupported_image_format(monkeypatch) -> None:
    _serve(monkeypatch, _ok(_image_bytes(fmt="GIF"), "image/gif"))

    assert _error().category == LLMClientErrorCategory.INVALID_REQUEST


def test_rejects_truncated_image(monkeypatch) -> None:
    _serve(monkeypatch, _ok(_image_bytes(size=(300, 300))[:200]))

    assert _error().category == LLMClientErrorCategory.INVALID_REQUEST


def test_rejects_declared_size_over_limit(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _settings(IMAGE_MAX_BYTES=100)
    )
    _serve(monkeypatch, _ok(b"x" * 500))

    assert "larger than" in _error().desc


def test_rejects_streamed_size_over_limit(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _settings(IMAGE_MAX_BYTES=100)
    )

    async def body():
        yield b"x" * 60
        yield b"x" * 60

    def handler(request):
        # Sin content-length declarado: el límite debe aplicarse mientras llega
        return httpx.Response(
            200, content=body(), headers={"content-type": "image/jpeg"}
        )

    _serve(monkeypatch, handler)

    assert "larger than" in _error().desc


def test_rejects_too_many_pixels(monkeypatch) -> None:
    monkeypatch.setattr(
        image_loader, "get_settings", lambda: _settings(IMAGE_MAX_PIXELS=1000)
    )
    _serve(monkeypatch, _ok(_image_bytes(size=(200, 100))))

    assert "too large" in _error().desc


def test_timeout_is_transient(monkeypatch) -> None:
    def timeout(request):
        raise httpx.ReadTimeout("slow")

    _serve(monkeypatch, timeout)

    assert _error().category == LLMClientErrorCategory.TRANSIENT


def test_connection_error_is_provider_unavailable(monkeypatch) -> None:
    def down(request):
        raise httpx.ConnectError("down")

    _serve(monkeypatch, down)

    assert _error().category == LLMClientErrorCategory.PROVIDER_UNAVAILABLE


def test_error_messages_never_include_the_signed_url(monkeypatch) -> None:
    _serve(monkeypatch, lambda request: httpx.Response(403))

    assert "X-Amz-Signature" not in _error().desc


def _resolve_to(monkeypatch, address: str) -> None:
    def getaddrinfo(host, port, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, port))]

    monkeypatch.setattr(image_loader.socket, "getaddrinfo", getaddrinfo)


@pytest.mark.parametrize(
    "address", ["127.0.0.1", "10.0.0.8", "192.168.1.5", "169.254.169.254"]
)
def test_rejects_hosts_resolving_to_non_public_addresses(monkeypatch, address) -> None:
    _resolve_to(monkeypatch, address)

    with pytest.raises(image_loader.ImageLoadError) as exc_info:
        asyncio.run(REAL_ENSURE_PUBLIC_ADDRESS(HOST, 443))

    assert exc_info.value.category == LLMClientErrorCategory.INVALID_REQUEST


def test_accepts_hosts_resolving_to_public_addresses(monkeypatch) -> None:
    _resolve_to(monkeypatch, "52.216.1.1")

    asyncio.run(REAL_ENSURE_PUBLIC_ADDRESS(HOST, 443))


def test_unresolvable_host_is_transient(monkeypatch) -> None:
    def getaddrinfo(host, port, **kwargs):
        raise socket.gaierror("no such host")

    monkeypatch.setattr(image_loader.socket, "getaddrinfo", getaddrinfo)

    with pytest.raises(image_loader.ImageLoadError) as exc_info:
        asyncio.run(REAL_ENSURE_PUBLIC_ADDRESS(HOST, 443))

    assert exc_info.value.category == LLMClientErrorCategory.TRANSIENT
