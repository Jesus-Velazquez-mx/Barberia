from app.schemas.common import CustomModel, MasterProfile
from app.schemas.jd_analyze import JdAnalysisResult

class FitScoreRequest(CustomModel):
    profile: MasterProfile
    jd_analysis: JdAnalysisResult
    job_description_raw: str

class FitScoreResult(CustomModel):
    fit_score: int                  # 0-100
    rationale: str
    matched_skills: list[str]
    missing_skills: list[str]