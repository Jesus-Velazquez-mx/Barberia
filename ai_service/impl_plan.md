# ai_service Implementation Plan

Scope: build out the Python AI microservice per `docs/architecture.md`'s "AI Microservice Architecture" section. Stateless FastAPI service, internal-only, owns all LLM orchestration for JD analysis, fit scoring, and resume tailoring.

## 0. Baseline
Currently just a bare FastAPI hello-world (`main.py`) with `uv`-managed deps (`fastapi` only). Everything below is new.

## 1. Project skeleton (`app/` package)
Set up the layout the architecture doc specifies:
- `app/core/` — `config.py` (Pydantic `BaseSettings` for env vars: `AI_SERVICE_API_KEY`, `ANTHROPIC_API_KEY`, Ollama base URL, model names, timeouts), `auth.py` (FastAPI dependency validating `X-Internal-Api-Key`), `logging.py` (structured logging setup).
- `app/schemas/` — Pydantic v2 models for request/response bodies (defined in detail in section 2 below). These double as the *forced structured output* schemas handed to the LLM.
- `app/llm/` — provider adapters behind a common interface (e.g. an abstract `LlmClient` with `generate_structured(prompt, schema) -> BaseModel`). Implement an Anthropic adapter first; stub or defer Ollama until the interface is proven.
- `app/services/` — one module per capability (`jd_analysis.py`, `fit_score.py`, `tailoring.py`) containing prompt construction + calling the LLM adapter + returning validated Pydantic objects.
- `app/api/` — FastAPI routers per capability, thin (parse request → call service → return response), plus a `health.py`.
- `main.py` — app factory, mounts routers under `/internal/v1`, wires the API-key dependency globally (except `/internal/v1/health`).

Suggested build order: config + auth dependency + health endpoint first (gives you a running, securable service to test against), then the LLM adapter, then one full vertical slice (JD analysis end-to-end) before repeating for fit-score and tailoring.

## 2. Schema Design

The microservice is stateless and never touches Postgres/Redis directly — Spring assembles context from data it already holds and passes it in the request body; the microservice's job is to turn that into schema-conformant LLM output. Response schemas are designed to be persisted **verbatim** into the `jsonb` columns (`job_applications.jd_analysis`, `tailored_resumes.content`) wherever possible, so the Java `ai` module doesn't need to reshape anything.

All wire models use **camelCase** JSON field names (Pydantic `alias_generator=to_camel`, `populate_by_name=True`) to match the Java DTO conventions already established in `api-endpoints.md` (e.g. `MasterProfileResponseDTO`).

### 2.1 Shared profile schemas
Reused as-is across all three capability endpoints. Deliberately mirrors `MasterProfileResponseDTO` from `docs/api-endpoints.md` — Spring's `ai` module can forward the same object it already builds for `GET /profile` without transformation.

```python
class WorkExperienceItem(BaseModel):
    id: UUID
    company: str
    role: str
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    bulletpoints: list[str]

class EducationItem(BaseModel):
    id: UUID
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    grade: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    description: str | None = None

class CertificationItem(BaseModel):
    id: UUID
    name: str
    issuer: str
    issued_at: date | None = None
    expires_at: date | None = None
    credential_url: str | None = None

class ProjectItem(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    tech_stack: list[str] = []
    url: str | None = None

class SkillGroup(BaseModel):
    category: str
    items: list[str]

class MasterProfile(BaseModel):
    user_id: UUID
    work_experience: list[WorkExperienceItem]
    education: list[EducationItem]
    certifications: list[CertificationItem]
    projects: list[ProjectItem]
    skills: list[SkillGroup]
```

### 2.2 `POST /internal/v1/jd/analyze`
Request — raw JD text plus the title Spring already has from `JobApplicationRequestDTO`:
```python
class JdAnalyzeRequest(BaseModel):
    job_title: str
    job_description_raw: str
```

Response — persisted verbatim into `job_applications.jd_analysis`:
```python
class JdAnalysisResult(BaseModel):
    required_skills: list[str]
    preferred_skills: list[str] = []
    seniority_level: str            # "Junior" | "Mid" | "Senior" | "Lead" | ...
    employment_type: str | None = None   # "Full-time" | "Contract" | ...
    tone: str                       # "Formal" | "Casual" | "Startup" | ...
    key_responsibilities: list[str]
    years_of_experience_required: int | None = None
    company_name: str | None = None
    location: str
    work_arrangement: str                # "remote" | "hibrid" | "on-site"
```

### 2.3 `POST /internal/v1/fit-score`
Request — the profile plus the already-analyzed JD (Spring calls `jd/analyze` first, stores the result, then passes it back in here rather than making the microservice redo that work):
```python
class FitScoreRequest(BaseModel):
    profile: MasterProfile
    jd_analysis: JdAnalysisResult
    job_description_raw: str
```

Response — only `fit_score` maps to a real column (`job_applications.fit_score`, plain `INTEGER`); the rest is informational context that Spring may log or forward into the `tailor` call, not persist:
```python
class FitScoreResult(BaseModel):
    fit_score: int                  # 0-100
    rationale: str
    matched_skills: list[str]
    missing_skills: list[str]
```

### 2.4 `POST /internal/v1/tailor`
Request — same context as fit-score, since tailoring needs the JD analysis to decide what to select/rewrite:
```python
class TailorRequest(BaseModel):
    profile: MasterProfile
    jd_analysis: JdAnalysisResult
    job_description_raw: str
    job_title: str
```

Response — shaped to match `TailoredResumeResponseDTO` from `docs/api-endpoints.md` minus `applicationId` (Java adds that). `content` is persisted verbatim into `tailored_resumes.content`; `fit_score` and `suggestions` map to their own columns:
```python
class TailoredContent(BaseModel):
    summary: str
    selected_experience_ids: list[UUID]
    tailored_bullets: dict[UUID, list[str]]   # keyed by work_experience.id
    selected_project_ids: list[UUID]

class TailorResult(BaseModel):
    fit_score: int
    content: TailoredContent
    suggestions: str
```
Note: `tailored_resumes.final_markdown_content` is deliberately **not** produced here — the architecture doc scopes the microservice to "structured LLM output" only, so flattening `content` into renderable markdown is assumed to be a Java-side templating concern, not an LLM call. Revisit if that assumption turns out wrong.

### 2.5 `GET /internal/v1/health`
```python
class HealthResponse(BaseModel):
    status: Literal["ok"]
```

## 3. LLM orchestration layer
- Define the common adapter interface before writing the Anthropic client, so swapping/adding Ollama later doesn't touch service code.
- Use Anthropic's structured/tool-forced output (or equivalent) to get schema-conformant JSON back, validated through the Pydantic response models from section 2 — this is the enforcement point for the "structured LLM output" requirement.
- Centralize retry/timeout/error handling in this layer (not per-service) so all three capabilities get consistent failure behavior surfaced back to Spring as clean errors.

## 4. Capability endpoints
Build in this order, each as a vertical slice (schema → service → router → manual test):
1. `POST /internal/v1/jd/analyze` — simplest, no cross-input reasoning; good for proving the schema/LLM plumbing.
2. `POST /internal/v1/fit-score` — takes profile + parsed JD, returns numeric score + rationale.
3. `POST /internal/v1/tailor` — most complex; consumes JD analysis output when constructing the tailoring prompt.

Each router handles only HTTP concerns; all prompt/LLM logic stays in `app/services/`.

## 5. Internal auth
Implement the `X-Internal-Api-Key` dependency and apply it to every router except `/internal/v1/health`. Test both the 401/403 rejection path and the happy path before moving on — this is the only thing standing between this service and being an open LLM proxy.

## 6. Local + integration testing
- Unit tests per service module with the LLM adapter mocked (pytest).
- A way to hit the running service manually (`uv run fastapi dev main.py` + curl/httpie) with a fake `X-Internal-Api-Key` to validate each endpoint end-to-end against the real Anthropic API before wiring up Java.
- Once stable, this is the point to circle back to the Java side and build the `ai` module's `AiServiceClient` against the now-real contract.

## 7. Deployment
Lowest priority until the above is functionally solid:
- `Dockerfile` for the service.
- Add it as a service in the root `docker-compose.yml`, networked with the Spring Boot app.
- Wire `AI_SERVICE_API_KEY` / `ANTHROPIC_API_KEY` into its own env, not shared through Java.

## Open questions to resolve as you go
- Whether Ollama support is needed now or can be deferred (architecture doc treats it as a config-selectable provider, not mandatory day one).
- Whether `final_markdown_content` really stays a Java-side templating concern (assumed above) or should become a fourth LLM-backed capability.
- Whether `fit-score` and `tailor` should stay separate calls (as modeled here, matching the two separate endpoints in the architecture doc) or whether `tailor` should internally recompute a resume-specific fit score without a round trip — currently modeled as two independent Spring-orchestrated calls.
