"""Data loading, auditing, cleaning, and feature engineering."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from statsmodels.stats.outliers_influence import variance_inflation_factor

from arepa.constants import TARGET_COLUMNS


def load_data(scenario: str) -> pd.DataFrame:
    """Load the dirty CSV from data/raw and rename columns."""
    from arepa.treatment import load_dirty

    return load_dirty(scenario)


def audit_data(df: pd.DataFrame) -> dict[str, Any]:
    """Return null counts, dtypes, duplicate count, and basic describe stats."""
    null_pct = (df.isnull().mean() * 100).round(2)
    return {
        "row_count": len(df),
        "column_count": len(df.columns),
        "dtypes": df.dtypes.astype(str).to_dict(),
        "null_percent": null_pct.to_dict(),
        "duplicate_rows": int(df.duplicated().sum()),
        "describe": df.describe(include="all").to_dict(),
    }


def clean_data(df: pd.DataFrame, scenario: str) -> pd.DataFrame:
    """
    Apply scenario-specific cleaning.

    No rows are dropped by default: datasets have no nulls/duplicates in the
    provided files. Energy gets cyclic hour encoding.
    """
    out = df.copy()
    out = out.drop_duplicates()
    out = out.dropna(how="any")

    if scenario == "energy":
        out = encode_cyclic_feature(out, "hour", period=24)

    return out


def detect_outliers(
    df: pd.DataFrame,
    columns: list[str] | None = None,
    method: str = "iqr",
) -> pd.DataFrame:
    """
    Flag IQR outliers per column via ``is_outlier_<col>`` (does not remove rows).

    Outliers are kept for modeling; flags support with/without comparisons.
    """
    out = df.copy()
    numeric_cols = columns or out.select_dtypes(include=[np.number]).columns.tolist()
    target_cols = set(TARGET_COLUMNS.values())
    feature_cols = [c for c in numeric_cols if c not in target_cols and not c.startswith("is_outlier")]

    for col in feature_cols:
        if method != "iqr":
            raise ValueError(f"Unsupported outlier method: {method}")
        q1, q3 = out[col].quantile(0.25), out[col].quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        out[f"is_outlier_{col}"] = (out[col] < lower) | (out[col] > upper)

    out["is_outlier"] = out[[c for c in out.columns if c.startswith("is_outlier_")]].any(axis=1)
    return out


def encode_cyclic_feature(df: pd.DataFrame, col: str, period: int) -> pd.DataFrame:
    """Add sin/cos encoding for cyclic features (e.g. hour of day)."""
    out = df.copy()
    angle = 2 * np.pi * (out[col] - 1) / period
    out[f"{col}_sin"] = np.sin(angle)
    out[f"{col}_cos"] = np.cos(angle)
    return out


def check_multicollinearity(df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    """Compute variance inflation factor (VIF) for each feature."""
    x = df[feature_cols].astype(float)
    vif_rows = []
    for i, col in enumerate(feature_cols):
        vif = variance_inflation_factor(x.values, i)
        vif_rows.append({"feature": col, "vif": float(vif)})
    return pd.DataFrame(vif_rows).sort_values("vif", ascending=False)


def prepare_scenario_frame(scenario: str) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Dirty file → treated frame. The report is the dirty-vs-clean record."""
    from arepa.treatment import treat_data

    treated, report = treat_data(scenario)
    return treated, report
