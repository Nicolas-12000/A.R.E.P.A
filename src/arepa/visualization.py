"""Plotting helpers for EDA and report figures.

Colors mirror frontend/DESIGN.md so the figures sit naturally inside the web UI.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from matplotlib.colors import LinearSegmentedColormap

INK = "#1B2A27"
AXIS = "#5A6762"
GRID = "#DEDDD1"
SURFACE = "#FFFFFB"
POINT = "#16615B"
LINE = "#C98A0B"
MORA = "#A8395A"

LABELS = {
    "day": "Día",
    "inflation_rate": "Inflación diaria",
    "interest_rate": "Tasa de interés (%)",
    "dollar_price": "Precio del dólar",
    "age": "Edad (años)",
    "bmi": "IMC",
    "physical_activity_hours": "Actividad física (h/semana)",
    "glucose_level": "Glucosa (mg/dL)",
    "temperature": "Temperatura (°C)",
    "hour": "Hora del día",
    "day_of_week": "Día de la semana",
    "energy_consumption": "Consumo (kWh)",
}

CORRELATION_CMAP = LinearSegmentedColormap.from_list("arepa", [MORA, SURFACE, POINT])


def _label(column: str) -> str:
    return LABELS.get(column, column)


def _style(fig: plt.Figure, ax: plt.Axes) -> None:
    fig.patch.set_facecolor(SURFACE)
    ax.set_facecolor(SURFACE)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(GRID)
    ax.tick_params(colors=AXIS, labelsize=9)
    ax.xaxis.label.set_color(AXIS)
    ax.yaxis.label.set_color(AXIS)
    ax.title.set_color(INK)
    ax.grid(color=GRID, linewidth=0.6, alpha=0.7)
    ax.set_axisbelow(True)


def plot_feature_relationship(
    df: pd.DataFrame,
    feature: str,
    target: str,
    save_path: Path | None = None,
) -> None:
    fig, ax = plt.subplots(figsize=(7, 4))
    _style(fig, ax)
    sns.regplot(
        data=df,
        x=feature,
        y=target,
        scatter_kws={"alpha": 0.22, "s": 14, "color": POINT, "edgecolors": "none"},
        line_kws={"color": LINE, "linewidth": 2.4},
        ax=ax,
    )
    ax.set_xlabel(_label(feature))
    ax.set_ylabel(_label(target))
    ax.set_title(f"{_label(target)} vs. {_label(feature)}", loc="left", fontsize=11, fontweight="semibold", color=INK)
    fig.tight_layout()
    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(save_path, dpi=144, facecolor=SURFACE)
    plt.close(fig)


def plot_correlation_heatmap(df: pd.DataFrame, columns: list[str], save_path: Path | None = None) -> None:
    corr = df[columns].corr().rename(index=_label, columns=_label)
    fig, ax = plt.subplots(figsize=(6, 5))
    _style(fig, ax)
    ax.grid(False)
    sns.heatmap(
        corr,
        annot=True,
        fmt=".2f",
        cmap=CORRELATION_CMAP,
        vmin=-1,
        vmax=1,
        center=0,
        linewidths=2,
        linecolor=SURFACE,
        annot_kws={"fontsize": 9},
        cbar_kws={"shrink": 0.8},
        ax=ax,
    )
    ax.set_title("Correlación entre variables", loc="left", fontsize=11, fontweight="semibold", color=INK)
    ax.tick_params(length=0)
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    colorbar = ax.collections[0].colorbar
    colorbar.outline.set_visible(False)
    colorbar.ax.tick_params(colors=AXIS, labelsize=8, length=0)
    fig.tight_layout()
    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(save_path, dpi=144, facecolor=SURFACE)
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
