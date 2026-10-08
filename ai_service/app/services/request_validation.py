from pydantic import BaseModel

from app.schemas.api import ApiRequest, ContentError
from app.schemas.jd_analyze import JdAnalyzeRequest
from app.services.unprocessable_exception import UnprocessableContentError

MIN_FIELD_LENGTHS: dict[str, int] = {
    "job_title": 5,
    "job_description_raw": 50,
}


def _collect_invalid_fields(model: BaseModel, path: str = "") -> list[ContentError]:
    errors = []
    for field_name, value in model:
        field_path = f"{path}.{field_name}" if path else field_name
        if isinstance(value, BaseModel):
            errors.extend(_collect_invalid_fields(value, field_path))
        elif isinstance(value, list):
            for index, item in enumerate(value):
                if isinstance(item, BaseModel):
                    errors.extend(
                        _collect_invalid_fields(item, f"{field_path}[{index}]")
                    )
        elif isinstance(value, str):
            min_length = MIN_FIELD_LENGTHS.get(field_name)
            if min_length is not None and len(value) < min_length:
                errors.append(
                    ContentError(
                        field=field_path,
                        detail=f"minimum length is {min_length}, got {len(value)}",
                    )
                )
    return errors


def validate_request_content(
    req: ApiRequest[JdAnalyzeRequest],
) -> None:
    errors = _collect_invalid_fields(req.data)
    if errors:
        raise UnprocessableContentError(req, errors)
