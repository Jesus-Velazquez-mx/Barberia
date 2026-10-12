from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.schemas.api import ApiResponse, CustomModel


def is_valid_json(json_str: str, schema: type[CustomModel]) -> bool:
    try:
        schema.model_validate_json(json_str)
        return True
    except (ValidationError, ValueError):
        return False


def build_json_response(content: ApiResponse, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code, content=content.model_dump(by_alias=True, exclude_none=True)
    )
