"""Sync SQLAlchemy session. Async is unnecessary at this request volume."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.db.models import Base

engine = None
SessionLocal: sessionmaker[Session] | None = None
enabled = False


def init_db(url: str | None) -> None:
    global engine, SessionLocal, enabled
    if not url:
        enabled = False
        engine = None
        SessionLocal = None
        return

    kwargs: dict = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if url in {"sqlite://", "sqlite:///:memory:"}:
            kwargs["poolclass"] = StaticPool

    engine = create_engine(url, **kwargs)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(engine)
    enabled = True


def check_db() -> str:
    if not enabled or engine is None:
        return "disabled"
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
        return "ok"
    except Exception:
        return "error"
