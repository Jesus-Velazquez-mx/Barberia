import secrets

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import Settings, get_settings


api_key_header = APIKeyHeader(name="X-Internal-Api-Key", auto_error=False)

def verify_internal_api_key(
    api_key: str | None = Security(api_key_header),
    settings: Settings = Depends(get_settings)
) -> None:
    if api_key is None or not secrets.compare_digest(api_key, settings.AI_SERVICE_API_KEY):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key")