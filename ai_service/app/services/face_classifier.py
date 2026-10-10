import base64
import binascii
import hashlib
import io
import logging
import os
from pathlib import Path

import httpx
import torch
import torchvision.transforms as T
from PIL import Image

from app.core.config import get_settings
from app.llm.image_loader import ImageLoadError, normalize_image
from app.llm.llm_exception import LLMClientErrorCategory

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Clases que reconoce el modelo entrenado, en el orden de su salida
class_names = ["Heart", "Oblong", "Oval", "Round", "Square"]

# Mapeo estricto al ENUM de la base de datos (ver FacialStructureType)
label_map = {
    "heart": "heart",
    "oblong": "rectangle",
    "oval": "oval",
    "round": "round",
    "square": "square",
}

_transform = T.Compose(
    [
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

_DOWNLOAD_CHUNK_BYTES = 1024 * 1024

# Modelo cargado en load_face_model() al iniciar el servicio (ver lifespan en main.py).
# Nada de esto se ejecuta al importar el módulo.
_model: torch.nn.Module | None = None
_device: torch.device | None = None


class ModelIntegrityError(Exception):
    """El archivo del modelo no coincide con el SHA256 esperado."""


def _sha256_of_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(_DOWNLOAD_CHUNK_BYTES):
            digest.update(chunk)
    return digest.hexdigest()


def download_model_if_missing(
    url: str, path: Path, sha256: str, timeout: float
) -> None:
    """
    Garantiza que `path` contiene el modelo esperado. Si el archivo ya existe y
    su SHA256 coincide no hace nada; si existe pero difiere (descarga truncada,
    versión anterior) lo reemplaza. La descarga va a un archivo temporal y solo
    se mueve al destino final después de verificar el hash.
    """
    expected = sha256.lower()

    if path.exists():
        if _sha256_of_file(path) == expected:
            logger.info("Face model found locally at %s, using local file", path)
            return
        logger.warning("Face model at %s does not match expected hash, re-downloading", path)
        path.unlink()

    path.parent.mkdir(parents=True, exist_ok=True)
    partial = path.with_name(path.name + ".part")
    logger.info("Downloading face model to %s", path)

    digest = hashlib.sha256()
    try:
        with httpx.stream(
            "GET", url, timeout=timeout, follow_redirects=True
        ) as response:
            response.raise_for_status()
            with open(partial, "wb") as f:
                for chunk in response.iter_bytes(_DOWNLOAD_CHUNK_BYTES):
                    digest.update(chunk)
                    f.write(chunk)

        if digest.hexdigest() != expected:
            raise ModelIntegrityError(
                "Downloaded face model does not match the expected SHA256"
            )
        os.replace(partial, path)
    finally:
        partial.unlink(missing_ok=True)

    logger.info("Face model downloaded and verified at %s", path)


def load_face_model() -> None:
    """Descarga (si hace falta) y carga el modelo en memoria. Llamar una vez al iniciar."""
    global _model, _device

    settings = get_settings()
    path = Path(settings.FACE_MODEL_PATH)
    if not path.is_absolute():
        path = PROJECT_ROOT / path

    download_model_if_missing(
        settings.FACE_MODEL_URL,
        path,
        settings.FACE_MODEL_SHA256,
        settings.FACE_MODEL_DOWNLOAD_TIMEOUT,
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # weights_only=False porque el archivo es un modelo completo serializado con
    # pickle (ejecuta código al cargar). Es aceptable solo porque la revisión y el
    # SHA256 están fijados arriba. TODO: exportar state_dict/safetensors y cargar
    # con weights_only=True.
    model = torch.load(path, map_location=device, weights_only=False)
    model.eval()
    model.to(device)

    _model, _device = model, device
    logger.info("Face model loaded on %s", device)


def get_model() -> tuple[torch.nn.Module, torch.device]:
    if _model is None or _device is None:
        raise RuntimeError("Face model is not loaded; call load_face_model() first")
    return _model, _device


def _invalid(desc: str) -> ImageLoadError:
    return ImageLoadError(LLMClientErrorCategory.INVALID_REQUEST, desc)


def _decode_photo(base64_img: str) -> bytes:
    """Decodifica el base64 (con o sin prefijo data URL) y normaliza la imagen a JPEG RGB."""
    if base64_img.startswith("data:"):
        _, _, base64_img = base64_img.partition(",")

    max_bytes = get_settings().IMAGE_MAX_BYTES
    # Cota previa a decodificar: 4 caracteres base64 son 3 bytes
    if len(base64_img) > (max_bytes * 4) // 3 + 4:
        raise _invalid(f"Image is larger than {max_bytes} bytes")

    try:
        raw = base64.b64decode(base64_img, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise _invalid("Photo is not valid base64") from exc

    if len(raw) > max_bytes:
        raise _invalid(f"Image is larger than {max_bytes} bytes")

    return normalize_image(raw)


def classify_face_shape(base64_img: str) -> str:
    """
    Clasifica una foto recibida en base64. Lanza ImageLoadError si no es una
    imagen válida. Devuelve un valor de FacialStructureType.
    """
    return classify_image_bytes(_decode_photo(base64_img))


def classify_image_bytes(image_bytes: bytes) -> str:
    """
    Ejecuta la inferencia sobre una imagen ya validada y normalizada (la que
    regresan `load_image` o `normalize_image`). Es el punto común de las dos
    entradas: base64 y URL.
    """
    model, device = get_model()

    with Image.open(io.BytesIO(image_bytes)) as image:
        image_tensor = _transform(image.convert("RGB")).unsqueeze(0).to(device) # type: ignore

    with torch.inference_mode():
        outputs = model(image_tensor)
        predicted_class = int(torch.argmax(outputs, dim=1).item())

    predicted_label = class_names[predicted_class].lower().strip()
    return label_map.get(predicted_label, "oval")
