"""Plotting helpers for EDA and report figures."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


def plot_feature_relationship(
    df: pd.DataFrame,
    feature: str,
    target: str,
    save_path: Path | None = None,
) -> None:
    fig, ax = plt.subplots(figsize=(7, 4))
    sns.regplot(data=df, x=feature, y=target, scatter_kws={"alpha": 0.35, "s": 18}, ax=ax)
    ax.set_title(f"{target} vs {feature}")
    fig.tight_layout()
    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(save_path, dpi=120)
    plt.close(fig)


def plot_correlation_heatmap(df: pd.DataFrame, columns: list[str], save_path: Path | None = None) -> None:
    corr = df[columns].corr()
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0, ax=ax)
    ax.set_title("Feature correlation")
    fig.tight_layout()
    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(save_path, dpi=120)
    plt.close(fig)


def save_all_feature_plots(
    df: pd.DataFrame,
    features: list[str],
    target: str,
    output_dir: Path,
    prefix: str,
) -> None:
    for feat in features:
        if feat.endswith("_sin") or feat.endswith("_cos"):
            continue
        if feat not in df.columns:
            continue
        plot_feature_relationship(
            df,
            feat,
            target,
            save_path=output_dir / f"{prefix}_{feat}_vs_{target}.png",
        )
