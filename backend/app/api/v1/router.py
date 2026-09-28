"""Versioned API routes."""

from fastapi import APIRouter, HTTPException, Query, status

from backend.app.db import session as db_session
from backend.app.db.repository import analytics_summary, list_predictions, log_prediction
from backend.app.schemas import (
    AnalyticsSummary,
    DollarPredictionRequest,
    EnergyPredictionRequest,
    GlucosePredictionRequest,
    HealthResponse,
    ModelCatalogItem,
    ModelMetadataResponse,
    PredictionLogItem,
    PredictionResponse,
)
from backend.app.services import prediction as prediction_service
from backend.app.services.catalog import build_model_catalog
from backend.app.services.model_registry import MODEL_NAMES, registry

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    loaded = registry.loaded_names
    database = db_session.check_db()  # type: ignore[arg-type]
    models_ok = registry.all_loaded
    status = "ok" if models_ok and database != "error" else "degraded"
    return HealthResponse(
        status=status,
        models_loaded=loaded,
        database=database,
        app="AREPA",
    )


@router.post("/predict/dollar", response_model=PredictionResponse)
def predict_dollar(body: DollarPredictionRequest) -> PredictionResponse:
    _ensure_model("dollar")
    result = prediction_service.predict_dollar(body)
    stored = log_prediction("dollar", body.model_dump(), result.prediction)
    return result.model_copy(update={"stored_in_history": stored})


@router.post("/predict/glucose", response_model=PredictionResponse)
def predict_glucose(body: GlucosePredictionRequest) -> PredictionResponse:
    _ensure_model("glucose")
    result = prediction_service.predict_glucose(body)
    stored = log_prediction("glucose", body.model_dump(), result.prediction)
    return result.model_copy(update={"stored_in_history": stored})


@router.post("/predict/energy", response_model=PredictionResponse)
def predict_energy(body: EnergyPredictionRequest) -> PredictionResponse:
    _ensure_model("energy")
    result = prediction_service.predict_energy(body)
    stored = log_prediction("energy", body.model_dump(), result.prediction)
    return result.model_copy(update={"stored_in_history": stored})


@router.get("/predictions/history", response_model=list[PredictionLogItem])
def prediction_history(
    model: str | None = None,
    limit: int = Query(50, ge=1, le=200),
) -> list[PredictionLogItem]:
    _ensure_database()
    if model is not None and model not in MODEL_NAMES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown model")
    rows = list_predictions(model, limit)
    return [
        PredictionLogItem(
            id=row.id,
            model_name=row.model_name,
            input_payload=row.input_payload,
            prediction=row.prediction,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/analytics/summary", response_model=AnalyticsSummary)
def analytics() -> AnalyticsSummary:
    _ensure_database()
    return AnalyticsSummary(**analytics_summary())


@router.get("/models", response_model=list[ModelCatalogItem])
def list_models() -> list[ModelCatalogItem]:
    """Registry of exported models (MSE/R² from deployment sync) for exercise selection in the UI."""
    catalog = build_model_catalog()
    if not catalog:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No models in catalog. Train and export artifacts to models/.",
        )
    return catalog


@router.get("/models/{model_name}/metadata", response_model=ModelMetadataResponse)
def model_metadata(model_name: str) -> ModelMetadataResponse:
    if model_name not in MODEL_NAMES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown model")
    _ensure_model(model_name)
    return prediction_service.get_model_metadata(model_name)


def _ensure_database() -> None:
    if not db_session.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Set AREPA_DATABASE_URL.",
        )


def _ensure_model(name: str) -> None:
    if name not in registry.loaded_names:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model '{name}' is not available. Train and export artifacts to models/.",
        )
