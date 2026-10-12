import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
import uvicorn

from app.api.base import get_internal_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.services.face_classifier import load_face_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Descarga/verifica y carga el modelo de rostros una sola vez. Si falla, el
    # servicio no arranca (mejor que fallar en la primera petición).
    await asyncio.to_thread(load_face_model)
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(get_internal_router())

register_exception_handlers(app)

settings = get_settings()

if __name__ == "__main__":
    uvicorn.run(app, host=settings.APP_HOST, port=settings.APP_PORT)
