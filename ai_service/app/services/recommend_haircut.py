import json

from app.llm.llm_client_factory import get_llm_client
from app.schemas.api import ApiRequest, ContentError
from app.schemas.haircut import (
    HaircutRecommendationRequest,
    HaircutRecommendationResponse,
)
from app.schemas.llm import LLMErrorResponse
from app.services.unprocessable_exception import UnprocessableContentError


def _build_haircut_prompt(
    result_json_schema,
    haircut_req: HaircutRecommendationRequest,
) -> str:
    candidate_haircuts = json.dumps(
        [h.model_dump() for h in haircut_req.suggested_haircuts],
        ensure_ascii=False,
        indent=2,
    )
    # La estructura facial va en su propio bloque del prompt, no se repite aquí
    user_data = haircut_req.user_data.model_dump_json(
        indent=2, exclude_none=True, by_alias=True, exclude={"facial_structure"}
    )
    facial_structure = haircut_req.user_data.facial_structure.value

    return f"""
    Your task is to recommend the most suitable haircut for a person and return a
    JSON object according to the following schema:

    <result_output_schema>
    {result_json_schema}
    </result_output_schema>

    These are the candidate haircuts. You can only recommend haircuts from this list:
    <candidate_haircuts>
    {candidate_haircuts}
    </candidate_haircuts>

    This is the information provided about the person:
    <user_data>
    {user_data}
    </user_data>

    The person's facial structure was determined beforehand by a dedicated classifier. Treat it
    as a fact and do not contradict it:
    <facial_structure>
    {facial_structure}
    </facial_structure>

    General styling guidance by facial structure:
    - oval: balanced proportions; most haircuts suit it, so the other criteria weigh more.
    - round: favor haircuts that add height on top and keep the sides short to elongate the face;
      avoid volume at the sides.
    - square: favor haircuts that soften the angular jaw (textured or slightly longer top, rounded lines)
      or that complement it with clean, short sides.
    - rectangle: avoid adding much height on top; favor haircuts with volume or width at the sides, or a
      fringe, to visually shorten the face.
    - heart: favor haircuts that balance a wide forehead and a narrow chin, such as a fringe or side-swept
      top with volume in the lower sides; avoid excessive volume on top.

    The person's photo is attached to this message as an image. Use it to assess additional visible
    characteristics such as hair type, hair density and current hair length.

    Output guidelines for correct result:
    - The output should only contain the JSON object. Do not include any commentary before or after the JSON object.
    - The haircuts field must only contain haircuts from the candidate list, reusing their exact id, name and description.
      Include only the haircuts that genuinely suit the person (at least one), ordered from most to least suitable.
    - The facial structure is the main criterion to rank the candidate haircuts.
    - If userPreferences is present, it is a hard requirement: only recommend haircuts compatible with it. Among the
      compatible ones, choose those that best suit the facial structure. If no candidate satisfies both criteria,
      recommend the closest compatible one, say so in reasoning and use a confidence value below 0.6.
    - reasoning must (a) state the detected facial structure and explain why the recommended haircut suits it,
      (b) mention at least one other characteristic that is actually visible in the photo (hair type, density or
      current length), and (c) explain how userPreferences is respected, if present. It must be at most 4 sentences.
      Do not mention anything that cannot be seen in the photo.
    - suggestionText is a short, friendly message addressed to the person presenting the recommendation.
    - confidence must be a number between 0.0 and 1.0. Use a value below 0.6 if the photo is blurry, partially
      covered or otherwise limits the assessment.
    - suggestionText and reasoning must always be written in Spanish.

    If there is not enough information to produce a reliable recommendation you must return
    a JSON object stating the reason the data is insufficient and a list of those fields that lack data
    using the following schema:

    <error_output_schema>
    {LLMErrorResponse.model_json_schema()}
    </error_output_schema>

    Output guidelines for error response:
    - fieldsMissingData field must only contain the name of the fields which lack data, no explanation or commentary.
    - If the photo is missing, unreadable, or does not show the person's face and hair, return the error response
      with "photo" in fieldsMissingData instead of guessing.
    """


def _validate_request_content(req: ApiRequest[HaircutRecommendationRequest]) -> None:
    haircut_req = req.data
    errors: list[ContentError] = []

    if not haircut_req.suggested_haircuts:
        errors.append(
            ContentError(
                field="suggested_haircuts",
                detail="at least one suggested haircut is required",
            )
        )
    if not haircut_req.photo_key.strip():
        errors.append(ContentError(field="photoKey", detail="photo key is required"))

    if errors:
        raise UnprocessableContentError(req, errors)


def _validate_llm_response(
    req: ApiRequest[HaircutRecommendationRequest],
    res: HaircutRecommendationResponse,
) -> None:
    candidates = {h.id for h in req.data.suggested_haircuts}
    errors: list[ContentError] = []

    if not res.haircuts:
        errors.append(
            ContentError(field="haircuts", detail="LLM did not return any haircut")
        )
    for index, haircut in enumerate(res.haircuts):
        if haircut.id not in candidates:
            errors.append(
                ContentError(
                    field=f"haircuts[{index}].id",
                    detail=f"'{haircut.id}' is not one of the suggested haircuts",
                )
            )
    if not res.suggestion_text.strip():
        errors.append(
            ContentError(field="suggestion_text", detail="LLM returned an empty value")
        )
    if not res.reasoning.strip():
        errors.append(
            ContentError(field="reasoning", detail="LLM returned an empty value")
        )
    if not 0.0 <= res.confidence <= 1.0:
        errors.append(
            ContentError(
                field="confidence",
                detail=f"must be between 0.0 and 1.0, got {res.confidence}",
            )
        )

    if errors:
        raise UnprocessableContentError(req, errors)


def _overwrite_haircut_details(
    req: HaircutRecommendationRequest, res: HaircutRecommendationResponse
) -> None:
    """Use the name and description from the request, not the LLM's copy."""
    originals = {h.id: h for h in req.suggested_haircuts}
    res.haircuts = [originals[h.id].model_copy() for h in res.haircuts]


async def recommend_haircut(
    req: ApiRequest[HaircutRecommendationRequest],
) -> HaircutRecommendationResponse:
    _validate_request_content(req)

    haircut_req = req.data
    prompt = _build_haircut_prompt(
        HaircutRecommendationResponse.model_json_schema(),
        haircut_req,
    )

    llm_client = get_llm_client(req.provider)

    haircut_res = await llm_client.generate_structured_response(
        prompt, HaircutRecommendationResponse, photo_key=haircut_req.photo_key
    )

    if isinstance(haircut_res, HaircutRecommendationResponse):
        _validate_llm_response(req, haircut_res)
        _overwrite_haircut_details(haircut_req, haircut_res)
        return haircut_res

    errors = [ContentError(detail=haircut_res.insufficiency_reason)]
    if haircut_res.fields_missing_data:
        errors += [
            ContentError(
                field=f,
                detail="Insufficient data in request to determine this field",
            )
            for f in haircut_res.fields_missing_data
        ]
    raise UnprocessableContentError(request=req, errors=errors)