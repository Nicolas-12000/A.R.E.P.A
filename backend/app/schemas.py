"""Request/response schemas for prediction endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, confloat


class _PredictionInput(BaseModel):
    """Reject unknown JSON keys and non-finite floats on prediction bodies."""

    model_config = ConfigDict(extra="forbid")


class DollarPredictionRequest(_PredictionInput):
    day: int = Field(..., ge=1, le=100_000, description="Day index in the series")
    inflation_rate: confloat(ge=0, le=1, allow_inf_nan=False) = Field(..., description="Daily inflation rate")
    interest_rate: confloat(ge=0, le=100, allow_inf_nan=False) = Field(..., description="Daily interest rate (%)")


class GlucosePredictionRequest(_PredictionInput):
    age: int = Field(..., ge=1, le=120)
    bmi: confloat(ge=10, le=80, allow_inf_nan=False)
    physical_activity_hours: confloat(ge=0, le=168, allow_inf_nan=False)


class EnergyPredictionRequest(_PredictionInput):
    temperature: confloat(ge=-40, le=60, allow_inf_nan=False) = Field(..., description="Temperature in °C")
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
