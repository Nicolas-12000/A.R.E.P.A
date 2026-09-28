import pytest


def test_predict_dollar_valid(client):
    response = client.post(
        "/v1/predict/dollar",
        json={"day": 120, "inflation_rate": 0.02, "interest_rate": 5.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["prediction"], float)
    assert data["model_name"] == "dollar"
    assert data["target"] == "dollar_price"
    assert 0 <= data["model_r2"] <= 1
    assert data["model_mse"] > 0


def test_predict_glucose_valid(client):
    response = client.post(
        "/v1/predict/glucose",
        json={"age": 45, "bmi": 25.0, "physical_activity_hours": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "glucose"
    assert 40 < data["prediction"] < 250


def test_predict_energy_valid(client):
    response = client.post(
        "/v1/predict/energy",
        json={"temperature": 22.0, "hour": 14, "day_of_week": 3},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "energy"
    assert 100 < data["prediction"] < 700


@pytest.mark.parametrize(
    "path,payload",
    [
        ("/v1/predict/dollar", {"day": 0, "inflation_rate": 0.02, "interest_rate": 5.0}),
        ("/v1/predict/glucose", {"age": 45, "bmi": 8.0, "physical_activity_hours": 5}),
        ("/v1/predict/energy", {"temperature": 22.0, "hour": 25, "day_of_week": 3}),
    ],
)
def test_predict_invalid_input_returns_422(client, path, payload):
    response = client.post(path, json=payload)
    assert response.status_code == 422


def test_predict_rejects_unknown_fields(client):
    response = client.post(
        "/v1/predict/dollar",
        json={"day": 120, "inflation_rate": 0.02, "interest_rate": 5.0, "evil": 1},
    )
    assert response.status_code == 422


def test_predict_rejects_non_finite_floats(client):
    response = client.post(
        "/v1/predict/dollar",
        json={"day": 120, "inflation_rate": "nan", "interest_rate": 5.0},
    )
    assert response.status_code == 422


def test_predict_dollar_day_above_cap_returns_422(client):
    response = client.post(
        "/v1/predict/dollar",
        json={"day": 100_001, "inflation_rate": 0.02, "interest_rate": 5.0},
    )
    assert response.status_code == 422


def test_model_catalog_lists_three_exercises(client):
    response = client.get("/v1/models")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 3
    names = {item["model_name"] for item in items}
    assert names == {"dollar", "glucose", "energy"}
    dollar = next(i for i in items if i["model_name"] == "dollar")
    assert dollar["exercise_title"].startswith("Ejercicio 1")
    assert dollar["artifact_loaded"] is True
    assert 0 <= dollar["r2_score"] <= 1
    assert dollar["mse"] > 0


def test_model_metadata_dollar(client):
    response = client.get("/v1/models/dollar/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "dollar"
    assert "feature_names" in data
    assert "training_metrics" in data
    assert len(data["coefficients"]) >= 3


def test_model_metadata_unknown(client):
    response = client.get("/v1/models/unknown/metadata")
    assert response.status_code == 404


def test_prediction_service_unit():
    from backend.app.schemas import DollarPredictionRequest
    from backend.app.services.prediction import predict_dollar

    result = predict_dollar(DollarPredictionRequest(day=100, inflation_rate=0.02, interest_rate=5.0))
    assert isinstance(result.prediction, float)
