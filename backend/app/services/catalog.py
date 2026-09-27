"""Build exercise catalog for the UI from Postgres model_metadata and joblib artifacts."""

from __future__ import annotations

from backend.app.db.repository import list_registered_models
from backend.app.schemas import ModelCatalogItem
from backend.app.services.model_registry import MODEL_NAMES, registry

EXERCISE_TITLES: dict[str, str] = {
    "dollar": "Ejercicio 1: Precio del dólar",
    "glucose": "Ejercicio 2: Nivel de glucosa",
    "energy": "Ejercicio 3: Consumo de energía",
}


def build_model_catalog() -> list[ModelCatalogItem]:
    db_by_name = {row.model_name: row for row in list_registered_models()}
    items: list[ModelCatalogItem] = []

    for name in MODEL_NAMES:
        loaded = name in registry.loaded_names
        artifact = registry.get(name) if loaded else None
        target = str(artifact["target"]) if artifact else _default_target(name)
        row = db_by_name.get(name)

        if row is not None:
            items.append(
                ModelCatalogItem(
                    model_name=name,  # type: ignore[arg-type]
                    exercise_title=EXERCISE_TITLES[name],
                    target=target,
                    r2_score=float(row.r2_score),
                    mse=float(row.mse),
                    rmse=float(row.rmse) if row.rmse is not None else None,
                    version=row.version,
                    trained_at=row.trained_at,
                    artifact_loaded=loaded,
                )
            )
        elif artifact is not None:
            metrics = artifact["metrics"]
            items.append(
                ModelCatalogItem(
                    model_name=name,  # type: ignore[arg-type]
                    exercise_title=EXERCISE_TITLES[name],
                    target=target,
                    r2_score=float(metrics["r2"]),
                    mse=float(metrics["mse"]),
                    rmse=float(metrics["rmse"]) if metrics.get("rmse") is not None else None,
                    version="v1",
                    trained_at=None,
                    artifact_loaded=True,
                )
            )

    return items


def _default_target(name: str) -> str:
    return {
        "dollar": "dollar_price",
        "glucose": "glucose_level",
        "energy": "energy_consumption",
    }[name]
