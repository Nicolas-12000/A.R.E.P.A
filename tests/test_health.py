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


def _preflight(client, origin: str):
    return client.options(
        "/v1/health",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )


def test_cors_allows_local_and_private_network_origins(client):
    for origin in ("http://localhost:3001", "http://10.255.255.254:3000", "http://192.168.1.20:3000"):
        assert _preflight(client, origin).status_code == 200, origin


def test_cors_rejects_public_origins(client):
    assert _preflight(client, "https://example.com").status_code == 400


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "AREPA"
