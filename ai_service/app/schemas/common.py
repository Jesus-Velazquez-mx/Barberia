from datetime import date
from enum import StrEnum
from typing import Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CustomModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, validate_by_name=True)


class WorkExperienceItem(CustomModel):
    id: UUID
    company: str
    role: str
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    bulletpoints: list[str]


class EducationItem(CustomModel):
    id: UUID
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    grade: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    description: str | None = None


class CertificationItem(CustomModel):
    id: UUID
    name: str
    issuer: str
    issued_at: date | None = None
    expires_at: date | None = None
    credential_url: str | None = None


class ProjectItem(CustomModel):
    id: UUID
    name: str
    description: str | None = None
    tech_stack: list[str] = []
    url: str | None = None


class SkillGroup(CustomModel):
    category: str
    items: list[str]


class MasterProfile(CustomModel):
    user_id: UUID
    work_experience: list[WorkExperienceItem]
    education: list[EducationItem]
    certifications: list[CertificationItem]
    projects: list[ProjectItem]
    skills: list[SkillGroup]
