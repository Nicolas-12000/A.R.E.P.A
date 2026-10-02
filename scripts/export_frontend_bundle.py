#!/usr/bin/env python3
"""Export metrics + coefficients for browser-side inference (no joblib in the client)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from arepa.constants import FEATURE_COLUMNS, TARGET_COLUMNS  # noqa: E402

METRICS_PATH = PROJECT_ROOT / "models" / "training_metrics.json"
OUT_PATH = PROJECT_ROOT / "frontend" / "public" / "models" / "bundle.json"

EXERCISE_TITLES = {
    "dollar": "Ejercicio 1: Precio del dólar",
    "glucose": "Ejercicio 2: Nivel de glucosa",
    "energy": "Ejercicio 3: Consumo de energía",
}


def main() -> None:
    if not METRICS_PATH.is_file():
        raise SystemExit(f"Missing {METRICS_PATH}. Run scripts/train_models.py first.")

    raw = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    models: dict[str, object] = {}

    for scenario in ("dollar", "glucose", "energy"):
        block = raw[scenario]
        metrics = block["metrics_published"]
        models[scenario] = {
            "exercise_title": EXERCISE_TITLES[scenario],
            "target": TARGET_COLUMNS[scenario],
            "feature_names": FEATURE_COLUMNS[scenario],
            "metrics": metrics,
            "coefficients": block["coefficients"],
        }

    payload = {
        "version": "1",
        "source": "models/training_metrics.json",
        "algorithm": "OLS + StandardScaler (coeficientes en unidades originales)",
        "models": models,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
