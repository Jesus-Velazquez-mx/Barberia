import json

from app.services.request_validation import validate_request_content
from app.llm.llm_client_factory import get_llm_client
from app.schemas.api import ApiRequest, ContentError
from app.schemas.jd_analyze import JdAnalysisResult, JdAnalyzeRequest
from app.schemas.llm import LLMErrorResponse
from app.services.unprocessable_exception import UnprocessableContentError


def _schema_for_prompt(schema_cls) -> str:
    """
    Serializa el JSON Schema como JSON válido y sin el `title` raíz. Dejar el
    nombre de la clase (ej. "JdAnalysisResult") en el prompt hace que algunos
    modelos locales lo usen como clave contenedora del objeto.
    """
    json_schema = schema_cls.model_json_schema()
    json_schema.pop("title", None)
    return json.dumps(json_schema, indent=2)


def _build_jd_analyze_prompt(jd_analyze_req: JdAnalyzeRequest) -> str:
    return f"""
    Your task is to analyze a raw description of a job position and return a 
    JSON object containing the relevant information of the job position according 
    to the following schema:

    <result_output_schema>
    {_schema_for_prompt(JdAnalysisResult)}
    </result_output_schema>

    This is the job description to analyze:
    <job_description>
    Job Title: {jd_analyze_req.job_title}
    Job Description: {jd_analyze_req.job_description_raw}
    </job_description>
    
    Output guidelines for correct result:
    - The output should only contain the JSON object. Do not include any commentary before or after the JSON object.
    - The fields must be placed directly at the root of the JSON object. Do NOT wrap the object inside another key
    (for example, do not use "JdAnalysisResult" as a key).
    - Use the field names exactly as they appear in the schema (camelCase).
    - The workArrangement field can only have the following values: "remote", "hibrid", and "on-site"
    - The content of the following fields must be written on the same language as the job description: requiredSkills, 
    preferredSkills, and keyResponsibilities. The content of all other fields must always be written in English.
    - The seniorityLevel and tone fields can only have the values listed in the schema. Choose the closest one.
    - If there is no enough information to identify employmentType default to "full-time".
    - Do not invent data. Only use information that is present in the job description.

    If the text does not describe a job position (for example, it has no tasks, skills or requirements from which
    requiredSkills and keyResponsibilities can be extracted), or there is not enough information on the job description 
    to extract the required data, you must NOT fill the result object with guesses. Instead, you must return
    a JSON object stating the reason the data is insufficient and a list of those fields that cannot be extracted
    using the following schema:

    <error_output_schema>
    {_schema_for_prompt(LLMErrorResponse)}
    </error_output_schema>

    Output guidelines for error response:
    - The error object must also be placed at the root, without a wrapper key.
    - fieldsMissingData field must only contain the name of the fields which lack data, no explanation or commentary.
    """


async def analyze_job(req: ApiRequest[JdAnalyzeRequest]) -> JdAnalysisResult:
    validate_request_content(req)

    jd_analyze_req = req.data
    prompt = _build_jd_analyze_prompt(jd_analyze_req)

    llm_client = get_llm_client(req.provider)

    jd_analysis_res = await llm_client.generate_structured_response(
        prompt, JdAnalysisResult
    )

    if isinstance(jd_analysis_res, JdAnalysisResult):
        _overwrite_user_provided_values(jd_analyze_req, jd_analysis_res)
        return jd_analysis_res
    else:
        errors = [ContentError(detail=jd_analysis_res.insufficiency_reason)]
        if jd_analysis_res.fields_missing_data:
            errors += [
                ContentError(
                    field=f,
                    detail="Insufficient data in job description to determine this field",
                )
                for f in jd_analysis_res.fields_missing_data
            ]
        raise UnprocessableContentError(request=req, errors=errors)


def _overwrite_user_provided_values(
    req: JdAnalyzeRequest, res: JdAnalysisResult
) -> None:
    for key in res.__dict__.keys():
        if hasattr(req, key) and getattr(req, key):
            setattr(res, key, getattr(req, key))
