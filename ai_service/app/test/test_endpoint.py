from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from main import app


def _test_settings() -> Settings:
    return Settings(
        AI_SERVICE_API_KEY="test-key",
        ANTHROPIC_API_KEY="anthropic-test-key",
        ANTHROPIC_MODEL="claude-test",
    )


def test_rejects_missing_key() -> None:
    app.dependency_overrides[get_settings] = _test_settings
    client = TestClient(app)

    resp = client.post("/internal/v1/jd/analyze")

    assert resp.status_code == 401
    app.dependency_overrides.clear()


def test_rejects_wrong_key() -> None:
    app.dependency_overrides[get_settings] = _test_settings
    client = TestClient(app)

    resp = client.post(
        "/internal/v1/jd/analyze",
        headers={"X-Internal-Api-Key": "wrong"},
    )

    assert resp.status_code == 401
    app.dependency_overrides.clear()


# def test_accepts_correct_key() -> None:
#     app.dependency_overrides[get_settings] = _test_settings
#     client = TestClient(app)

#     payload = {
#         "data": {
#             "jobTitle": "X" * 5,
#             "jobDescriptionRaw": "X" * 50,
#         },
#         "provider": "anthropic",
#     }

#     resp = client.post(
#         "/internal/v1/jd/analyze",
#         headers={"X-Internal-Api-Key": "test-key"},
#         json=payload,
#     )

#     print(resp.json())

#     assert resp.status_code == 200
#     app.dependency_overrides.clear()
