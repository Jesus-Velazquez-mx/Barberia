from fastapi import FastAPI
import uvicorn

from app.api.base import get_internal_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers

app = FastAPI()

app.include_router(get_internal_router())

register_exception_handlers(app)

settings = get_settings()

if __name__ == "__main__":
    uvicorn.run(app, host=settings.APP_HOST, port=settings.APP_PORT)
