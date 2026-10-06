from fastapi import APIRouter, Depends
from app.core.auth import verify_internal_api_key
from app.api.health import health_router
from app.api.jd_analyze import jd_router
from app.api.tailor import tailor_router
from app.api.fit_score import fit_score_router

protected_routers = [jd_router, fit_score_router, tailor_router]

def get_internal_router() -> APIRouter:
    internal_router = APIRouter(prefix="/internal/v1")

    # Unprotected health router
    internal_router.include_router(health_router)

    for router in protected_routers:
        internal_router.include_router(router, dependencies=[Depends(verify_internal_api_key)])

    return internal_router