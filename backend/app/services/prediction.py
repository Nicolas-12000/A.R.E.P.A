"""Build feature vectors and run sklearn pipeline inference."""

from __future__ import annotations

from typing import Any

import pandas as pd

from arepa.features import encode_hour
from backend.app.schemas import (
    DollarPredictionRequest,
    EnergyPredictionRequest,
    GlucosePredictionRequest,
    ModelMetadataResponse,
    PredictionResponse,
)
from backend.app.services.model_registry import registry


def _predict(model_name: str, features: dict[str, float | int]) -> PredictionResponse:
    artifact = registry.get(model_name)
    pipeline = artifact["pipeline"]
    feature_names: list[str] = artifact["feature_names"]
    metrics: dict[str, float] = artifact["metrics"]

    row = {name: features[name] for name in feature_names}
    x = pd.DataFrame([row], columns=feature_names)
    prediction = float(pipeline.predict(x)[0])

    return PredictionResponse(
        prediction=prediction,
        model_name=model_name,  # type: ignore[arg-type]
        target=artifact["target"],
        model_r2=float(metrics["r2"]),
        model_mse=float(metrics["mse"]),
        model_rmse=float(metrics["rmse"]) if "rmse" in metrics else None,
    )


def predict_dollar(body: DollarPredictionRequest) -> PredictionResponse:
    return _predict(
        "dollar",
        {
            "day": body.day,
            "inflation_rate": body.inflation_rate,
            "interest_rate": body.interest_rate,
        },
    )


def predict_glucose(body: GlucosePredictionRequest) -> PredictionResponse:
    return _predict(
        "glucose",
        {
            "age": body.age,
            "bmi": body.bmi,
            "physical_activity_hours": body.physical_activity_hours,
        },
    )


def predict_energy(body: EnergyPredictionRequest) -> PredictionResponse:
    hour_sin, hour_cos = encode_hour(body.hour)
    return _predict(
        "energy",
        {
            "temperature": body.temperature,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "day_of_week": body.day_of_week,
        },
    )


def get_model_metadata(model_name: str) -> ModelMetadataResponse:
    artifact = registry.get(model_name)
    coefs: list[dict[str, Any]] = artifact.get("coefficients") or []
    return ModelMetadataResponse(
        model_name=model_name,  # type: ignore[arg-type]
        target=artifact["target"],
        feature_names=artifact["feature_names"],
        training_metrics=artifact["metrics"],
        coefficients=coefs,
    )
