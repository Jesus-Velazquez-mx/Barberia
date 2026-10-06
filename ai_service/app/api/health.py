from fastapi import APIRouter

from app.schemas.health import HealtResponse

health_router = APIRouter(prefix="/health")

@health_router.get("/")
async def health_check():
    return HealtResponse()