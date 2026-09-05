import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.exceptions import SatqueryException

client = TestClient(app)


def test_health_root_endpoint():
    """Test GET /health returns 200 and expected payload structure."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project_name"] == "Satquery"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


def test_health_v1_endpoint():
    """Test GET /api/v1/health returns 200."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project_name"] == "Satquery"


def test_swagger_docs_accessible():
    """Test Swagger UI documentation is accessible."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()


def test_openapi_json_schema():
    """Test OpenAPI JSON specification contains metadata and routes."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "Satquery"
    assert "/health" in schema["paths"]


def test_custom_exception_handler():
    """Test that SatqueryException produces formatted error response."""
    # Temporarily mount a test route raising SatqueryException
    @app.get("/test-error-endpoint")
    def trigger_error():
        raise SatqueryException(
            message="Test custom exception triggered",
            status_code=400,
            details={"field": "test_input"},
        )

    response = client.get("/test-error-endpoint")
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert data["error_type"] == "SatqueryException"
    assert data["message"] == "Test custom exception triggered"
    assert data["details"] == {"field": "test_input"}
