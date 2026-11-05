FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN uv venv /opt/venv

# Install the locked dependencies, except torch/torchvision and the CUDA stack
# they drag in (several GB). The service falls back to CPU, so the CPU-only
# wheels are installed separately, pinned to the locked versions.
COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev --no-hashes --no-emit-project -o requirements.txt \
    && grep -E '^(torch|torchvision)==' requirements.txt | cut -d';' -f1 > torch-requirements.txt \
    && grep -vE '^(torch|torchvision|triton|nvidia-|cuda-)' requirements.txt > requirements-base.txt \
    && uv pip install --no-cache -r requirements-base.txt \
    && uv pip install --no-cache -r torch-requirements.txt \
        --index-url https://download.pytorch.org/whl/cpu \
        --extra-index-url https://pypi.org/simple \
        --index-strategy unsafe-best-match

# Bake the face model into the image so the container doesn't download it on
# every start. It is fetched and SHA256-verified by the same code the service
# uses at startup (the dummy key only satisfies the required setting).
COPY app ./app
RUN AI_SERVICE_API_KEY=build python -c "\
from pathlib import Path; \
from app.core.config import get_settings; \
from app.services.face_classifier import download_model_if_missing; \
s = get_settings(); \
download_model_if_missing(s.FACE_MODEL_URL, Path('models/model_85_nn_.pth'), s.FACE_MODEL_SHA256, s.FACE_MODEL_DOWNLOAD_TIMEOUT)"


FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

RUN useradd --system --create-home --uid 10001 appuser

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder --chown=appuser:appuser /app/models ./models
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser main.py ./

USER appuser

# Secrets (AI_SERVICE_API_KEY, ANTHROPIC_API_KEY, AWS_*) are not baked in: pass
# them at runtime with --env-file or -e.
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/internal/v1/health', timeout=4)"

CMD ["python", "main.py"]
