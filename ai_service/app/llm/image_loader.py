import asyncio
import ipaddress
import io
import logging
import socket
from urllib.parse import urlsplit

import httpx
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import get_settings
from app.llm.llm_exception import LLMClientErrorCategory

logger = logging.getLogger(__name__)

# Formatos que se aceptan de entrada. Se restringe la lista para no exponer
# decodificadores que no hacen falta (y HEIC/AVIF no vienen incluidos en Pillow).
ALLOWED_INPUT_FORMATS = ["JPEG", "PNG", "WEBP"]

# Content-Type aceptados. S3 devuelve application/octet-stream si el objeto se
# subió sin tipo, así que se permite; la validación real la hace Pillow.
GENERIC_CONTENT_TYPES = {"application/octet-stream", "binary/octet-stream"}

JPEG_QUALITY = 90


class ImageLoadError(Exception):
    """
    Falla al obtener o procesar la imagen. Lleva la categoría con la que el
    cliente LLM la traducirá a LLMClientError. Los mensajes nunca incluyen la
    URL completa: una URL prefirmada contiene credenciales temporales.
    """

    def __init__(self, category: LLMClientErrorCategory, desc: str):
        super().__init__(desc)
        self.category = category
        self.desc = desc


def _invalid(desc: str) -> ImageLoadError:
    return ImageLoadError(LLMClientErrorCategory.INVALID_REQUEST, desc)


def _parse_allowed_hosts(raw: str) -> list[str]:
    return [host.strip().lower() for host in raw.split(",") if host.strip()]


def _host_is_allowed(host: str, allowed: list[str]) -> bool:
    for pattern in allowed:
        if pattern.startswith("*."):
            if host.endswith(pattern[1:]):  # "*.a.com" -> ".a.com"
                return True
        elif host == pattern:
            return True
    return False


def _validate_url(url: str) -> str:
    """
    Valida la URL ANTES de hacer cualquier petición (la URL llega de fuera,
    así que sin esto el servicio podría usarse para pedir recursos internos:
    SSRF). Regresa el host.
    """
    settings = get_settings()
    allowed = _parse_allowed_hosts(settings.IMAGE_ALLOWED_HOSTS)

    if not allowed:
        raise _invalid(
            "Image downloads are not enabled: IMAGE_ALLOWED_HOSTS is not configured"
        )

    try:
        parts = urlsplit(url)
        host = (parts.hostname or "").lower()
        parts.port  # noqa: B018 - valida que el puerto sea numérico
    except ValueError as exc:
        raise _invalid("Image URL is malformed") from exc

    if parts.scheme != "https":
        raise _invalid("Image URL must use https")
    if parts.username or parts.password:
        raise _invalid("Image URL must not contain credentials")
    if not host or not _host_is_allowed(host, allowed):
        raise _invalid("Image URL host is not in the allowed list")

    # Una IP literal nunca es un host válido, aunque alguien la agregara a la lista
    try:
        ipaddress.ip_address(host)
    except ValueError:
        return host
    raise _invalid("Image URL host must be a domain name, not an IP address")


async def _ensure_public_address(host: str, port: int) -> None:
    """
    Rechaza hosts que resuelvan a IPs privadas, loopback o link-local
    (ej. metadata de AWS en 169.254.169.254). Limitación conocida: httpx
    resuelve el DNS otra vez al conectar, así que esto reduce el riesgo de
    DNS rebinding pero no lo elimina; la lista de hosts permitidos es la
    defensa principal.
    """
    try:
        infos = await asyncio.to_thread(
            socket.getaddrinfo, host, port, type=socket.SOCK_STREAM
        )
    except socket.gaierror as exc:
        raise ImageLoadError(
            LLMClientErrorCategory.TRANSIENT, "Could not resolve the image host"
        ) from exc

    for info in infos:
        address = ipaddress.ip_address(info[4][0])
        if not address.is_global:
            raise _invalid("Image URL host resolves to a non-public address")


async def _download(url: str) -> bytes:
    """
    Descarga la imagen en streaming y se detiene en cuanto supera
    IMAGE_MAX_BYTES. No sigue redirects: un redirect podría apuntar a un
    host que no está en la lista.
    """
    settings = get_settings()
    max_bytes = settings.IMAGE_MAX_BYTES
    host = _validate_url(url)
    await _ensure_public_address(host, urlsplit(url).port or 443)

    try:
        async with httpx.AsyncClient(
            timeout=settings.IMAGE_DOWNLOAD_TIMEOUT, follow_redirects=False
        ) as http:
            async with http.stream("GET", url) as response:
                status = response.status_code
                if 300 <= status < 400:
                    raise _invalid("Image URL redirected, redirects are not followed")
                if status in (401, 403, 404, 410):
                    raise _invalid(
                        f"Image could not be fetched (HTTP {status}). "
                        "The URL may have expired or the object does not exist"
                    )
                if status == 429 or status >= 500:
                    raise ImageLoadError(
                        LLMClientErrorCategory.TRANSIENT,
                        f"Image storage returned HTTP {status}",
                    )
                if status >= 400:
                    raise _invalid(f"Image could not be fetched (HTTP {status})")

                content_type = (
                    response.headers.get("content-type", "").split(";")[0].strip().lower()
                )
                if not (
                    content_type.startswith("image/")
                    or content_type in GENERIC_CONTENT_TYPES
                ):
                    raise _invalid("Image URL did not return an image")

                declared = response.headers.get("content-length")
                if declared and declared.isdigit() and int(declared) > max_bytes:
                    raise _invalid(f"Image is larger than {max_bytes} bytes")

                buffer = bytearray()
                async for chunk in response.aiter_bytes():
                    buffer.extend(chunk)
                    if len(buffer) > max_bytes:
                        raise _invalid(f"Image is larger than {max_bytes} bytes")
                return bytes(buffer)
    except httpx.TimeoutException as exc:
        raise ImageLoadError(
            LLMClientErrorCategory.TRANSIENT, "Image download timed out"
        ) from exc
    except httpx.HTTPError as exc:
        raise ImageLoadError(
            LLMClientErrorCategory.PROVIDER_UNAVAILABLE,
            "Could not connect to the image storage",
        ) from exc


def normalize_image(raw: bytes) -> bytes:
    """
    Valida que sea una imagen real y la normaliza a JPEG RGB en memoria:
    corrige la orientación EXIF, reduce el lado mayor y descarta los
    metadatos (EXIF/GPS) al volver a codificar. Es trabajo de CPU, por eso
    se ejecuta fuera del event loop.
    """
    settings = get_settings()
    try:
        with Image.open(io.BytesIO(raw), formats=ALLOWED_INPUT_FORMATS) as image:
            width, height = image.size
            if width * height > settings.IMAGE_MAX_PIXELS:
                raise _invalid("Image dimensions are too large")
            image.load()  # Fuerza la decodificación completa: detecta archivos corruptos
            image = ImageOps.exif_transpose(image)

            if image.mode in ("RGBA", "LA", "P"):
                rgba = image.convert("RGBA")
                flattened = Image.new("RGB", rgba.size, (255, 255, 255))
                flattened.paste(rgba, mask=rgba.getchannel("A"))
                image = flattened
            elif image.mode != "RGB":
                image = image.convert("RGB")

            image.thumbnail((settings.IMAGE_MAX_SIDE, settings.IMAGE_MAX_SIDE))

            output = io.BytesIO()
            image.save(output, format="JPEG", quality=JPEG_QUALITY)
            return output.getvalue()
    except ImageLoadError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError) as exc:
        raise _invalid(
            "File is not a valid image (accepted formats: JPEG, PNG, WEBP)"
        ) from exc


async def load_image(url: str) -> bytes:
    """
    Descarga la imagen de `url`, la valida y la regresa como bytes JPEG listos
    para enviarse al modelo. Todo ocurre en memoria; nada se escribe a disco.
    """
    raw = await _download(url)
    try:
        return await asyncio.to_thread(normalize_image, raw)
    finally:
        del raw
