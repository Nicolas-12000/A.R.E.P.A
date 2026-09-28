def test_prediction_is_stored_and_listed(client):
    created = client.post(
        "/v1/predict/dollar",
        json={"day": 10, "inflation_rate": 0.02, "interest_rate": 5.0},
    )
    assert created.status_code == 200
    body = created.json()
    value = body["prediction"]
    assert body["stored_in_history"] is True

    history = client.get("/v1/predictions/history", params={"model": "dollar", "limit": 10})
    assert history.status_code == 200
    rows = history.json()
    assert rows
    assert rows[0]["model_name"] == "dollar"
    assert rows[0]["prediction"] == value
    assert rows[0]["input_payload"]["day"] == 10

    summary = client.get("/v1/analytics/summary")
    assert summary.status_code == 200
    body = summary.json()
    assert body["total_predictions"] >= 1
    assert body["most_used_model"] == "dollar"


def test_duplicate_prediction_is_not_logged_again(client):
    payload = {"day": 77, "inflation_rate": 0.019, "interest_rate": 4.5}
    first = client.post("/v1/predict/dollar", json=payload)
    second = client.post("/v1/predict/dollar", json=payload)
    assert first.status_code == second.status_code == 200
    assert first.json()["stored_in_history"] is True
    assert second.json()["stored_in_history"] is True

    history = client.get("/v1/predictions/history", params={"model": "dollar", "limit": 50})
    assert history.status_code == 200
    matches = [row for row in history.json() if row["input_payload"]["day"] == 77]
    assert len(matches) == 1

    changed = client.post("/v1/predict/dollar", json={**payload, "day": 78})
    assert changed.status_code == 200
    history = client.get("/v1/predictions/history", params={"model": "dollar", "limit": 50})
    matches = [row for row in history.json() if row["input_payload"]["day"] in (77, 78)]
    assert len(matches) == 2


def test_history_rejects_unknown_model(client):
    response = client.get("/v1/predictions/history", params={"model": "stocks"})
    assert response.status_code == 404
