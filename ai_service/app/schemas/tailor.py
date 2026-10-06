from uuid import UUID

from app.schemas.common import CustomModel, MasterProfile
from app.schemas.jd_analyze import JdAnalysisResult

class TailorRequest(CustomModel):
    profile: MasterProfile
    jd_analysis: JdAnalysisResult
    job_description_raw: str
    job_title: str

class TailoredContent(CustomModel):
    summary: str
    selected_experience_ids: list[UUID]
    tailored_bullets: dict[UUID, list[str]]   # keyed by work_experience.id
    selected_project_ids: list[UUID]

class TailorResult(CustomModel):
    fit_score: int
    content: TailoredContent
    suggestions: str