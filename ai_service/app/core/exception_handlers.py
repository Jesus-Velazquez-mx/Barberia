from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.llm.llm_exception import (
    LLM_ERROR_CATEGORY_STATUS,
    ProviderNotSupportedError,
    LLMRequestFailedError,
)
from app.schemas.api import ApiResponse, ContentError
from app.services.unprocessable_exception import UnprocessableContentError
from app.utils.json_utils import build_json_response


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProviderNotSupportedError)
    async def provider_not_supported_handler(
        req: Request, exc: ProviderNotSupportedError
    ):
        return build_json_response(
            status_code=400,
            content=ApiResponse(message=str(exc)),
        )

    @app.exception_handler(LLMRequestFailedError)
    async def llm_request_failed_handler(req: Request, exc: LLMRequestFailedError):
        status = LLM_ERROR_CATEGORY_STATUS.get(exc.original.category, 500)
        return build_json_response(
            status_code=status,
            content=ApiResponse(message=exc.original.desc),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(req: Request, exc: StarletteHTTPException):
        return build_json_response(
            status_code=exc.status_code,
            content=ApiResponse(message=str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(req: Request, exc: RequestValidationError):
        errors = [
            ContentError(
                field=".".join(str(p) for p in error["loc"]), detail=error["msg"]
            )
            for error in exc.errors()
        ]
        return build_json_response(
            status_code=400,
            content=ApiResponse(message="Request validation failed", errors=errors),
        )

    @app.exception_handler(UnprocessableContentError)
    async def unprocessable_content_handler(
        req: Request, exc: UnprocessableContentError
    ):
        return build_json_response(
            status_code=422,  # Unprocessable Content
            content=ApiResponse(message=str(exc), errors=exc.errors),
        )
