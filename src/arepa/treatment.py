"""Dirty → analysis-ready treatment.

Capture errors are removed. Statistical tails that are still physically
possible are kept and labeled. Nothing is dropped only because it is an IQR outlier.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from arepa.constants import COLUMN_MAPS, PROCESSED_DATA_PATHS, PROJECT_ROOT, RAW_DATA_PATHS
from arepa.features import add_cyclic_hour

# Values outside these bounds cannot occur for the measured quantity.
HARD_BOUNDS: dict[str, dict[str, tuple[float, float]]] = {
    "dollar": {
        "day": (1, 100_000),
        "inflation_rate": (-0.5, 1.0),
        "interest_rate": (0.0, 100.0),
        "dollar_price": (0.01, 1_000_000.0),
    },
    "glucose": {
        "age": (0, 120),
        "bmi": (8.0, 80.0),
        "physical_activity_hours": (0.0, 60.0),
        "glucose_level": (15.0, 600.0),
    },
    "energy": {
        "temperature": (-15.0, 55.0),
        "hour": (1, 24),
        "day_of_week": (1, 7),
        "energy_consumption": (0.01, 10_000.0),
    },
}

# IQR hits on these columns are rare-but-valid cases, not shocks to model as noise.
RARE_LEGITIMATE_COLUMNS = {
    "bmi",
    "physical_activity_hours",
    "age",
}


def dirty_path(scenario: str):
    return RAW_DATA_PATHS[scenario]


def load_dirty(scenario: str) -> pd.DataFrame:
    """Load the file as delivered and rename columns to English."""
    frame = pd.read_csv(dirty_path(scenario))
    return frame.rename(columns=COLUMN_MAPS[scenario])


def _coerce_numeric(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    out = df.copy()
    failed: dict[str, int] = {}
    for column in out.columns:
        numeric = pd.to_numeric(out[column], errors="coerce")
        failed[column] = int((numeric.isna() & out[column].notna()).sum())
        out[column] = numeric
    return out, failed


def _iqr_mask(series: pd.Series) -> pd.Series:
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return (series < lower) | (series > upper)


def treat_data(scenario: str) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Apply the full treatment and return the analysis-ready frame plus a report."""
    dirty = load_dirty(scenario)
    rows_in = len(dirty)
    coerced, coercion_failures = _coerce_numeric(dirty)

    exact_duplicates = int(coerced.duplicated().sum())
    deduped = coerced.drop_duplicates()

    bounds = HARD_BOUNDS[scenario]
    capture_error = pd.Series(False, index=deduped.index)
    capture_reasons: dict[str, int] = {}
    for column, (lower, upper) in bounds.items():
        invalid = deduped[column].isna() | (deduped[column] < lower) | (deduped[column] > upper)
        capture_reasons[column] = int(invalid.sum())
        capture_error = capture_error | invalid

    dropped = deduped.loc[capture_error].copy()
    kept = deduped.loc[~capture_error].copy()

    for column in list(kept.columns):
        kept[f"is_outlier_{column}"] = _iqr_mask(kept[column])

    outlier_flags = [column for column in kept.columns if column.startswith("is_outlier_")]
    kept["is_outlier"] = kept[outlier_flags].any(axis=1)

    def row_category(row: pd.Series) -> str:
        flagged = [column.removeprefix("is_outlier_") for column in outlier_flags if row[column]]
        if not flagged:
            return "normal"
        if all(column in RARE_LEGITIMATE_COLUMNS for column in flagged):
            return "rare_legitimate"
        return "real_extreme"

    kept["anomaly_category"] = kept.apply(row_category, axis=1)

    if scenario == "energy":
        kept = add_cyclic_hour(kept)

    category_counts = kept["anomaly_category"].value_counts().to_dict()
    report: dict[str, Any] = {
        "scenario": scenario,
        "source": str(dirty_path(scenario).relative_to(PROJECT_ROOT)),
        "rows_dirty": rows_in,
        "rows_clean": len(kept),
        "rows_removed": int(rows_in - len(kept)),
        "exact_duplicates_removed": exact_duplicates,
        "coercion_failures": coercion_failures,
        "capture_errors_by_column": capture_reasons,
        "capture_errors_removed": int(capture_error.sum()),
        "anomaly_category_counts": {str(key): int(value) for key, value in category_counts.items()},
        "iqr_flags_kept": {column.removeprefix("is_outlier_"): int(kept[column].sum()) for column in outlier_flags},
        "decision": (
            "Rows outside physical bounds are capture errors and are removed. "
            "IQR tails inside those bounds are kept and labeled real_extreme or rare_legitimate."
        ),
        "dropped_preview": dropped.head(10).to_dict(orient="records"),
        "flagged_preview": kept.loc[kept["is_outlier"], list(dirty.columns) + ["anomaly_category"]]
        .head(8)
        .to_dict(orient="records"),
    }
    return kept, report


def save_processed(scenario: str, frame: pd.DataFrame) -> None:
    path = PROCESSED_DATA_PATHS[scenario]
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False)
