"""Operational tables. Training data stays in CSV; Postgres only stores what the API does."""

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PredictionLog(Base):
    __tablename__ = "predictions_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    model_name: Mapped[str] = mapped_column(String(20), index=True)
    input_payload: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    prediction: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )


class ModelMetadata(Base):
    __tablename__ = "model_metadata"

    id: Mapped[int] = mapped_column(primary_key=True)
    model_name: Mapped[str] = mapped_column(String(20), unique=True)
    r2_score: Mapped[float] = mapped_column(Float)
    mse: Mapped[float] = mapped_column(Float)
    rmse: Mapped[float | None] = mapped_column(Float, nullable=True)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )
    version: Mapped[str] = mapped_column(String(10), default="v1")
