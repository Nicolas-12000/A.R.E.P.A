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


def test_history_rejects_unknown_model(client):
    response = client.get("/v1/predictions/history", params={"model": "stocks"})
    assert response.status_code == 404
