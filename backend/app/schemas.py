"""Request/response schemas for prediction endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DollarPredictionRequest(BaseModel):
    day: int = Field(..., ge=1, description="Day index in the series")
    inflation_rate: float = Field(..., ge=0, le=1, description="Daily inflation rate")
    interest_rate: float = Field(..., ge=0, le=100, description="Daily interest rate (%)")


class GlucosePredictionRequest(BaseModel):
    age: int = Field(..., ge=1, le=120)
    bmi: float = Field(..., ge=10, le=80)
    physical_activity_hours: float = Field(..., ge=0, le=168)


class EnergyPredictionRequest(BaseModel):
    temperature: float = Field(..., ge=-40, le=60, description="Temperature in °C")
    hour: int = Field(..., ge=1, le=24, description="Hour of day (1–24)")
    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday … 7=Sunday")


class PredictionResponse(BaseModel):
    prediction: float
    model_name: Literal["dollar", "glucose", "energy"]
    target: str
    model_r2: float
    model_mse: float
    model_rmse: float | None = None
    stored_in_history: bool = Field(
        False,
        description="True when the row was saved to predictions_log (requires a working database).",
    )


class ModelCatalogItem(BaseModel):
    """Deployed model summary for the web UI (Postgres registry, aligned with encargo exercises)."""

    model_name: Literal["dollar", "glucose", "energy"]
    exercise_title: str
    target: str
    r2_score: float
    mse: float
    rmse: float | None = None
    version: str = "v1"
    trained_at: datetime | None = None
    artifact_loaded: bool = Field(description="True when the .joblib is loaded in this process.")


class ModelMetadataResponse(BaseModel):
    model_name: Literal["dollar", "glucose", "energy"]
    target: str
    algorithm: str = "Multiple Linear Regression (StandardScaler + sklearn)"
    feature_names: list[str]
    training_metrics: dict[str, float]
    coefficients: list[dict[str, float | str]]
    version: str = "v1"


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    models_loaded: list[str]
    database: Literal["disabled", "ok", "error"]
    app: str


class PredictionLogItem(BaseModel):
    id: int
    model_name: str
    input_payload: dict
    prediction: float
    created_at: datetime


class AnalyticsSummary(BaseModel):
    total_predictions: int
    most_used_model: str | None
    avg_prediction_by_model: dict[str, float]
    predictions_last_7_days: int
