"""Train/test split, model fitting, evaluation, and persistence."""

from __future__ import annotations

from typing import Any

import joblib
import numpy as np
import pandas as pd
import statsmodels.api as sm
from sklearn.linear_model import HuberRegressor, LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from arepa.constants import (
    FEATURE_COLUMNS,
    MODEL_ARTIFACTS,
    RANDOM_STATE,
    TARGET_COLUMNS,
    TEST_SIZE,
)


def split_data(
    df: pd.DataFrame,
    target: str,
    feature_cols: list[str],
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    x = df[feature_cols]
    y = df[target]
    return train_test_split(x, y, test_size=test_size, random_state=random_state)


def train_model(x_train: pd.DataFrame, y_train: pd.Series, scale_features: bool = True) -> Pipeline:
    steps: list[tuple[str, Any]] = []
    if scale_features:
        steps.append(("scaler", StandardScaler()))
    steps.append(("regressor", LinearRegression()))
    pipeline = Pipeline(steps)
    pipeline.fit(x_train, y_train)
    return pipeline


def evaluate_model(
    model: Pipeline,
    x_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict[str, float]:
    preds = model.predict(x_test)
    mse = float(mean_squared_error(y_test, preds))
    return {
        "mse": mse,
        "rmse": float(np.sqrt(mse)),
        "r2": float(r2_score(y_test, preds)),
    }


def get_coefficients(model: Pipeline, feature_names: list[str]) -> pd.DataFrame:
    """Original-unit coefficients for interpretation, standardized ones for impact."""
    regressor: LinearRegression = model.named_steps["regressor"]
    standardized = regressor.coef_.astype(float)
    original = standardized.copy()
    intercept_original = float(regressor.intercept_)
    if "scaler" in model.named_steps:
        scaler: StandardScaler = model.named_steps["scaler"]
        original = standardized / scaler.scale_
        intercept_original = float(regressor.intercept_ - np.sum(standardized * scaler.mean_ / scaler.scale_))
    rows = [
        {
            "feature": name,
            "coefficient": float(raw),
            "standardized_coefficient": float(scaled),
        }
        for name, raw, scaled in zip(feature_names, original, standardized, strict=True)
    ]
    rows.append(
        {
            "feature": "intercept",
            "coefficient": intercept_original,
            "standardized_coefficient": float(regressor.intercept_),
        }
    )
    return pd.DataFrame(rows)


def fit_ols_inference(x_train: pd.DataFrame, y_train: pd.Series) -> sm.regression.linear_model.RegressionResultsWrapper:
    """Optional statsmodels OLS for p-values and confidence intervals."""
    x_const = sm.add_constant(x_train)
    return sm.OLS(y_train, x_const).fit()


def export_model(artifact: dict[str, Any], path: str | None = None, scenario: str | None = None) -> None:
    if path is None:
        if scenario is None:
            raise ValueError("Provide path or scenario")
        path = str(MODEL_ARTIFACTS[scenario])
    joblib.dump(artifact, path)


def load_model(path: str) -> dict[str, Any]:
    return joblib.load(path)


def train_scenario(
    df: pd.DataFrame,
    scenario: str,
    exclude_outliers: bool = False,
) -> dict[str, Any]:
    target = TARGET_COLUMNS[scenario]
    features = FEATURE_COLUMNS[scenario]
    work = df.copy()
    if exclude_outliers and "is_outlier" in work.columns:
        work = work.loc[~work["is_outlier"]]

    x_train, x_test, y_train, y_test = split_data(work, target, features)
    pipeline = train_model(x_train, y_train, scale_features=True)
    metrics = evaluate_model(pipeline, x_test, y_test)
    coef_df = get_coefficients(pipeline, features)
    ols = fit_ols_inference(x_train, y_train)
    huber = Pipeline([("scaler", StandardScaler()), ("regressor", HuberRegressor())])
    huber.fit(x_train, y_train)

    return {
        "scenario": scenario,
        "target": target,
        "feature_names": features,
        "pipeline": pipeline,
        "metrics": metrics,
        "coefficients": coef_df,
        "ols_summary": str(ols.summary()),
        "exclude_outliers": exclude_outliers,
        "train_rows": len(x_train),
        "test_rows": len(x_test),
        "influence": influence_summary(ols),
        "huber_metrics": evaluate_model(huber, x_test, y_test),
    }


def influence_summary(ols: sm.regression.linear_model.RegressionResultsWrapper) -> dict[str, float | int]:
    """Cook's distance flags points that move the fit. The cutoff is a screen, not a deletion rule."""
    cooks = np.asarray(ols.get_influence().cooks_distance[0], dtype=float)
    n = int(ols.nobs)
    threshold = 4 / n
    return {
        "train_rows": n,
        "cooks_threshold": float(threshold),
        "high_influence_rows": int(np.sum(cooks > threshold)),
        "max_cooks_distance": float(np.max(cooks)),
    }
