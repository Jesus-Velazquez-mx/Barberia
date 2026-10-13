import asyncio
import ipaddress
import io
import logging
import socket
from functools import lru_cache
from urllib.parse import urlsplit

import boto3
import httpx
from botocore.config import Config
from botocore.exceptions import (
    BotoCoreError,
    ClientError,
    ConnectTimeoutError,
    EndpointConnectionError,
    NoCredentialsError,
    ReadTimeoutError,
)
from botocore.exceptions import ConnectionError as BotoConnectionError
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


_S3_CHUNK_BYTES = 64 * 1024

# Códigos de error de S3 agrupados por cómo se reportan al cliente
_S3_NOT_FOUND_CODES = {"NoSuchKey", "404", "NotFound"}
# Sin s3:ListBucket, S3 responde AccessDenied (403) cuando el objeto no existe
_S3_ACCESS_DENIED_CODES = {"AccessDenied", "403"}
_S3_AUTH_CODES = {
    "InvalidAccessKeyId",
    "SignatureDoesNotMatch",
    "ExpiredToken",
    "InvalidToken",
}
_S3_TRANSIENT_CODES = {
    "SlowDown",
    "RequestTimeout",
    "InternalError",
    "ServiceUnavailable",
    "RequestTimeTooSkewed",
}


def _validate_key(key: str) -> None:
    """
    La key llega de fuera, y las credenciales de S3 pueden leer todo el
    prefijo (o el bucket entero, según la política), así que solo se aceptan
    keys dentro de AWS_BUCKET_KEY_PREFIX con una forma razonable.
    """
    settings = get_settings()
    prefix = settings.AWS_BUCKET_KEY_PREFIX

    if not (settings.AWS_BUCKET and settings.AWS_REGION and prefix):
        raise ImageLoadError(
            LLMClientErrorCategory.UNKNOWN,
            "Photo downloads are not enabled: AWS_BUCKET, AWS_REGION and "
            "AWS_BUCKET_KEY_PREFIX must be configured",
        )

    if (
        not key
        or len(key) > 1024
        or key.startswith("/")
        or not key.startswith(prefix)
        or len(key) == len(prefix)
        or any(ord(char) < 32 or ord(char) == 127 for char in key)
        or ".." in key.split("/")
    ):
        raise _invalid("Photo key is not valid")


@lru_cache
def _build_s3_client(
    region: str, access_key: str | None, secret_key: str | None, timeout: float
):
    return boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(
            signature_version="s3v4",
            connect_timeout=timeout,
            read_timeout=timeout,
            retries={"max_attempts": 2, "mode": "standard"},
        ),
    )


def _s3_client():
    settings = get_settings()
    secret = settings.AWS_SECRET_ACCESS_KEY
    return _build_s3_client(
        settings.AWS_REGION,
        settings.AWS_ACCESS_KEY_ID,
        secret.get_secret_value() if secret else None,
        settings.IMAGE_DOWNLOAD_TIMEOUT,
    )


def _fetch_s3_object(key: str) -> bytes:
    """
    Trabajo bloqueante (boto3 es síncrono): se ejecuta en un thread. Lee en
    streaming y se detiene en cuanto supera IMAGE_MAX_BYTES.
    """
    settings = get_settings()
    max_bytes = settings.IMAGE_MAX_BYTES

    response = _s3_client().get_object(Bucket=settings.AWS_BUCKET, Key=key)
    body = response["Body"]
    try:
        declared = response.get("ContentLength")
        if declared is not None and declared > max_bytes:
            raise _invalid(f"Image is larger than {max_bytes} bytes")

        buffer = bytearray()
        for chunk in body.iter_chunks(_S3_CHUNK_BYTES):
            buffer.extend(chunk)
            if len(buffer) > max_bytes:
                raise _invalid(f"Image is larger than {max_bytes} bytes")
        return bytes(buffer)
    finally:
        body.close()


def _s3_client_error(exc: ClientError) -> ImageLoadError:
    error = exc.response.get("Error", {})
    code = str(error.get("Code", ""))
    status = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode", 0)

    if code in _S3_NOT_FOUND_CODES:
        return _invalid("Photo was not found")
    if code in _S3_ACCESS_DENIED_CODES:
        # Puede ser un objeto inexistente o una política mal configurada:
        # al cliente se le dice lo primero, en el log queda la pista.
        logger.warning(
            "S3 denied access to a photo (%s). The object may not exist or the "
            "credentials may lack s3:GetObject on the prefix",
            code,
        )
        return _invalid("Photo was not found")
    if code in _S3_AUTH_CODES:
        logger.error("S3 rejected the configured credentials (%s)", code)
        return ImageLoadError(
            LLMClientErrorCategory.AUTH, "Image storage rejected the credentials"
        )
    if code in _S3_TRANSIENT_CODES or status == 429 or status >= 500:
        return ImageLoadError(
            LLMClientErrorCategory.TRANSIENT,
            f"Image storage returned an error ({code or status})",
        )
    logger.error("Unexpected S3 error (%s, HTTP %s)", code, status)
    return ImageLoadError(
        LLMClientErrorCategory.UNKNOWN, f"Image storage returned an error ({code})"
    )


async def _download_s3(key: str) -> bytes:
    """
    Descarga la foto `key` del bucket privado con las credenciales del
    servicio. A diferencia de `_download`, no recibe una URL: el host siempre
    es el bucket configurado, así que no hay SSRF que mitigar; lo que se valida
    es que la key esté dentro del prefijo permitido.
    """
    _validate_key(key)

    try:
        return await asyncio.to_thread(_fetch_s3_object, key)
    except ImageLoadError:
        raise
    except ClientError as exc:
        raise _s3_client_error(exc) from exc
    except NoCredentialsError as exc:
        logger.error("No AWS credentials available to read photos")
        raise ImageLoadError(
            LLMClientErrorCategory.AUTH, "Image storage credentials are not configured"
        ) from exc
    except (ConnectTimeoutError, ReadTimeoutError) as exc:
        raise ImageLoadError(
            LLMClientErrorCategory.TRANSIENT, "Image download timed out"
        ) from exc
    except (EndpointConnectionError, BotoConnectionError) as exc:
        raise ImageLoadError(
            LLMClientErrorCategory.PROVIDER_UNAVAILABLE,
            "Could not connect to the image storage",
        ) from exc
    except BotoCoreError as exc:
        logger.error("Unexpected boto error while reading a photo: %s", exc)
        raise ImageLoadError(
            LLMClientErrorCategory.UNKNOWN, "Image storage request failed"
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


async def load_image_from_key(key: str) -> bytes:
    """
    Igual que `load_image`, pero la foto se lee del bucket privado de S3 a
    partir de su key.
    """
    raw = await _download_s3(key)
    try:
        return await asyncio.to_thread(normalize_image, raw)
    finally:
        del raw
