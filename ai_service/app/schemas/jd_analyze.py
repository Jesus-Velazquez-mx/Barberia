from typing import Optional

from ai_service.app.schemas.custom_model import CustomModel


class JdAnalyzeRequest(CustomModel):
    job_title: str
    job_description_raw: str
    company_name: Optional[str] = None
    location: Optional[str] = None
    work_arrangement: Optional[str] = None


class JdAnalysisResult(CustomModel):
    required_skills: list[str]
    preferred_skills: list[str] = []
    seniority_level: str  # "junior" | "mid" | "senior" | "lead" | ...
    employment_type: str | None = None  # "full-time" | "contract" | ...
    tone: str  # "formal" | "casual" | "startup" | ...
    key_responsibilities: list[str]
    years_of_experience_required: int | None = None
    company_name: str | None = None
    location: str
    work_arrangement: str  # "remote" | "hibrid" | "on-site"
