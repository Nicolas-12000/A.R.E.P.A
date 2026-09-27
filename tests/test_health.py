def test_health_returns_ok_when_models_loaded(client):
    response = client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["app"] == "AREPA"
    assert body["status"] == "ok"
    assert set(body["models_loaded"]) == {"dollar", "energy", "glucose"}
    assert body["database"] == "ok"


def test_health_degraded_when_database_errors(client, monkeypatch):
    from backend.app.db import session as db_session

    monkeypatch.setattr(db_session, "check_db", lambda: "error")
    response = client.get("/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["database"] == "error"
    assert body["status"] == "degraded"


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "AREPA"
