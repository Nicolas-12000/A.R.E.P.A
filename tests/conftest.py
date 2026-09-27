import os

os.environ["AREPA_DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.model_registry import registry


@pytest.fixture(scope="session", autouse=True)
def load_models():
    registry.load_all()
    yield


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
