"""Load and cache serialized joblib artifacts at startup."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib

from backend.app.config import settings

logger = logging.getLogger(__name__)

MODEL_NAMES = ("dollar", "glucose", "energy")


class ModelRegistry:
    def __init__(self, models_dir: Path | None = None) -> None:
        self._models_dir = models_dir or settings.models_dir
        self._artifacts: dict[str, dict[str, Any]] = {}

    def load_all(self) -> None:
        missing: list[str] = []
        for name in MODEL_NAMES:
            path = self._models_dir / f"{name}_model.joblib"
            if not path.is_file():
                missing.append(str(path))
                continue
            self._artifacts[name] = joblib.load(path)
            logger.info("Loaded model artifact: %s", path)

        if missing:
            logger.warning("Missing model files: %s", ", ".join(missing))

    def get(self, model_name: str) -> dict[str, Any]:
        if model_name not in self._artifacts:
            raise KeyError(f"Model '{model_name}' is not loaded")
        return self._artifacts[model_name]

    @property
    def loaded_names(self) -> list[str]:
        return sorted(self._artifacts.keys())

    @property
    def all_loaded(self) -> bool:
        return set(self.loaded_names) == set(MODEL_NAMES)


registry = ModelRegistry()
