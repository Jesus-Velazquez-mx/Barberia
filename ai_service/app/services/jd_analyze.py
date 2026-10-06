from app.llm.llm_client_factory import get_llm_client
from app.schemas.api import ApiRequest, ContentError
from app.schemas.jd_analyze import JdAnalysisResult, JdAnalyzeRequest
from app.schemas.llm import LLMErrorResponse
from app.services.request_validation import is_request_content_valid
from app.services.unprocessable_exception import UnprocessableContentError


async def analyze_job(req: ApiRequest[JdAnalyzeRequest]) -> JdAnalysisResult:
    jd_analyze_req = req.data

    is_request_content_valid(req)

    llm_client = get_llm_client(req.provider)

    result_json_schema = JdAnalysisResult.model_json_schema()

    prompt = f"""
    Your task is to analyze a raw description of a job position and return a 
    JSON object containing the relevant information of the job position according 
    to the following schema:

    <result_output_schema>
    {result_json_schema}
    </result_output_schema>

    This is the job description to analyze:
    <job_description>
    Job Title: {jd_analyze_req.job_title}
    Job Description: {jd_analyze_req.job_description_raw}
    </job_description>
    
    Output guidelines for correct result:
    - The output should only contain the JSON object. Do not include any commentary before or after the JSON object.
    - The work_arrangement field can only have the following values: "remote", "hibrid", and "on-site"
    - The content of the following fields must be written on the same language as the job description: required_skills, 
    preferred_skills, and key_responsibilities. The content of all other fields must always be written in English.
    - If there is no enough information to identify employment_type default to "full-time".

    If there is not enough information on the job description to extract the required data you must return
    a JSON object stating the reason the data is insufficient and a list of those fields that cannot be extracted
    using the following schema:

    <error_output_schema>
    {LLMErrorResponse.model_json_schema()}
    </error_output_schema>

    Output guidelines for error response:
    - fields_missing_data field must only contain the name of the fields which lack data, no explanation or commentary.
    """

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
