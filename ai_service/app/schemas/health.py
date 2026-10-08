from typing import Literal

from app.schemas.custom_model import CustomModel

class HealtResponse(CustomModel):
    status: Literal["ok"] = "ok"