from typing import Literal, Optional, Self

from pydantic import ConfigDict, Field, model_validator

from app.schemas.user_data import UserData
from app.schemas.custom_model import CustomModel


class HaircutStyle(CustomModel):
    id: str
    name: str
    description: Optional[str] = None


class HaircutRecommendationRequest(CustomModel):
    suggested_haircuts: list[HaircutStyle]
    photo_key: str = Field(min_length=1, max_length=1024)  # Key de la foto en el bucket privado de S3
    user_data: UserData


class HaircutRecommendationResponse(CustomModel):
    """
    - recommended: haircuts (al menos uno), suggestion_text y confidence son obligatorios.
    - no_suitable_haircut: ningún candidato es compatible con las preferencias; haircuts va vacío
      y reasoning explica por qué.
    """

    # Una clave desconocida (p. ej. la lista de cortes bajo otro nombre) es un
    # error de salida del LLM, no algo que se deba ignorar en silencio.
    model_config = ConfigDict(extra="forbid")

    status: Literal["recommended", "no_suitable_haircut"] = "recommended"
    haircuts: list[HaircutStyle] = Field(default_factory=list)
    suggestion_text: Optional[str] = None
    reasoning: str
    confidence: Optional[float] = None

    @model_validator(mode="after")
    def _recommended_requires_haircuts(self) -> Self:
        # Sin esto, un payload sin `haircuts` se valida con los valores por
        # defecto (status="recommended", haircuts=[]) y pasa como respuesta buena.
        if self.status == "recommended" and not self.haircuts:
            raise ValueError("status 'recommended' requires at least one haircut")
        return self
