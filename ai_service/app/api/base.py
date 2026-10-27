from fastapi import APIRouter, Depends
from app.core.auth import verify_internal_api_key
from app.api.health import health_router
from app.api.haircut import haircut_router
from app.api.face import face_router

# All routers that need to be protected behind API key authorization
protected_routers = [haircut_router, face_router]


def get_internal_router() -> APIRouter:
    internal_router = APIRouter(prefix="/internal/v1")

    # Unprotected health router
    internal_router.include_router(health_router)

    for router in protected_routers:
        internal_router.include_router(
            router, dependencies=[Depends(verify_internal_api_key)]
        )

    return internal_router
