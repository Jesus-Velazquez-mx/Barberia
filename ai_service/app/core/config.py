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


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
