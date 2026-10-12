from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # API key for internal ai service
    AI_SERVICE_API_KEY: str

    # Provider-agnostic LLM params
    LLM_TIMEOUT: float = 90.0  # Seconds
    LLM_MAX_ATTEMPTS: int = 3
    MAX_TOKENS: int = 1000
    BASE_BACKOFF_SECONDS: float = 1.0
    MAX_BACKOFF_SECONDS: float = 30.0

    # Anthropic params
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-haiku-4-5"

    # Ollama params
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str | None = None
    OLLAMA_NUM_CTX: int = 8192  # Context window (tokens). Ollama's default is small and truncates silently
    OLLAMA_TEMPERATURE: float = 0.0
    OLLAMA_KEEP_ALIVE: str = "10m"  # How long the model stays loaded in memory

    # Image params (images are downloaded from a URL, processed in memory and
    # discarded; they are never written to disk)
    # Comma-separated hosts the service may download images from. Accepts exact
    # hosts and "*.domain" wildcards, e.g. "my-bucket.s3.us-east-1.amazonaws.com".
    # Empty = image downloads are rejected (fail closed, avoids SSRF).
    IMAGE_ALLOWED_HOSTS: str = ""
    IMAGE_MAX_BYTES: int = 10 * 1024 * 1024  # Max size of the downloaded file
    IMAGE_MAX_PIXELS: int = 40_000_000  # Max width * height (decompression bomb guard)
    IMAGE_MAX_SIDE: int = 1024  # Longest side (px) sent to the model
    IMAGE_DOWNLOAD_TIMEOUT: float = 15.0  # Seconds

    # Face shape classifier params. The weights are a pickled PyTorch model, so
    # the URL must be pinned to a commit (never "main") and the file is only
    # accepted when its SHA256 matches.
    FACE_MODEL_PATH: str = "models/model_85_nn_.pth"  # Relative to the project root
    FACE_MODEL_URL: str = (
        "https://huggingface.co/fahd9999/model_85_nn_/resolve/"
        "e68b8b251e12f0c3e3de2238eff4030e0eda8e8a/model_85_nn_.pth"
    )
    FACE_MODEL_SHA256: str = (
        "881f08dfdb50d80b2176e7558c6bb558f8ddc4101ffa4576ed8ad7fa9ad167e7"
    )
    FACE_MODEL_DOWNLOAD_TIMEOUT: float = 120.0  # Seconds


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
