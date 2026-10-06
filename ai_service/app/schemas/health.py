from typing import Literal

from app.schemas.common import CustomModel

class HealtResponse(CustomModel):
    status: Literal["ok"] = "ok"