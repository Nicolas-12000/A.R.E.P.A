"""Read and write prediction logs."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from backend.app.db import session as db_session
from backend.app.db.models import ModelMetadata, PredictionLog

logger = logging.getLogger(__name__)


def _normalize_payload(payload: dict) -> dict[str, object]:
    """Stable comparison for JSON payloads (float rounding, key order)."""
    normalized: dict[str, object] = {}
    for key in sorted(payload):
        value = payload[key]
        if isinstance(value, float):
            normalized[key] = round(value, 10)
        else:
            normalized[key] = value
    return normalized


def _same_inputs(left: dict, right: dict) -> bool:
    return _normalize_payload(left) == _normalize_payload(right)


def log_prediction(model_name: str, payload: dict, prediction: float) -> bool:
    """Persist one prediction unless it repeats the latest log entry (same model and inputs).

    Returns False if DB is off or the insert failed. Returns True when stored or when skipped as a duplicate.
    """
    if not db_session.enabled or db_session.SessionLocal is None:
        return False
    try:
        with db_session.SessionLocal() as session:
            latest = session.scalar(select(PredictionLog).order_by(PredictionLog.id.desc()).limit(1))
            if (
                latest is not None
                and latest.model_name == model_name
                and _same_inputs(latest.input_payload, payload)
            ):
                return True

            session.add(
                PredictionLog(
                    model_name=model_name,
                    input_payload=payload,
                    prediction=prediction,
                )
            )
            session.commit()
        return True
    except Exception:
        logger.exception("Could not store prediction log")
        return False


def sync_model_metadata(artifacts: dict[str, dict]) -> None:
    if not db_session.enabled or db_session.SessionLocal is None:
        return
    with db_session.SessionLocal() as session:
        for name, artifact in artifacts.items():
            metrics = artifact["metrics"]
            row = session.scalar(select(ModelMetadata).where(ModelMetadata.model_name == name))
            if row is None:
                row = ModelMetadata(model_name=name, r2_score=0.0, mse=0.0)
                session.add(row)
            row.r2_score = float(metrics["r2"])
            row.mse = float(metrics["mse"])
            row.rmse = float(metrics["rmse"]) if metrics.get("rmse") is not None else None
            row.version = "v1"
        session.commit()


def list_registered_models() -> list[ModelMetadata]:
    if not db_session.enabled or db_session.SessionLocal is None:
        return []
    with db_session.SessionLocal() as session:
        return list(session.scalars(select(ModelMetadata).order_by(ModelMetadata.model_name)))


def list_predictions(model_name: str | None, limit: int) -> list[PredictionLog]:
    if not db_session.enabled or db_session.SessionLocal is None:
        return []
    stmt = select(PredictionLog).order_by(PredictionLog.id.desc()).limit(limit)
    if model_name:
        stmt = stmt.where(PredictionLog.model_name == model_name)
    with db_session.SessionLocal() as session:
        return list(session.scalars(stmt))


def analytics_summary() -> dict:
    empty = {
        "total_predictions": 0,
        "most_used_model": None,
        "avg_prediction_by_model": {},
        "predictions_last_7_days": 0,
    }
    if not db_session.enabled or db_session.SessionLocal is None:
        return empty

    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
    with db_session.SessionLocal() as session:
        total = session.scalar(select(func.count()).select_from(PredictionLog)) or 0
        counts = session.execute(
            select(PredictionLog.model_name, func.count(), func.avg(PredictionLog.prediction)).group_by(
                PredictionLog.model_name
            )
        ).all()
        recent = (
            session.scalar(select(func.count()).select_from(PredictionLog).where(PredictionLog.created_at >= cutoff))
            or 0
        )

    most_used = None
    averages: dict[str, float] = {}
    best = -1
    for name, count, average in counts:
        averages[name] = float(average)
        if count > best:
            best = count
            most_used = name

    return {
        "total_predictions": int(total),
        "most_used_model": most_used,
        "avg_prediction_by_model": averages,
        "predictions_last_7_days": int(recent),
    }
