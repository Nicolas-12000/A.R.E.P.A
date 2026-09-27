"""Transforms that training and the API must share."""

from __future__ import annotations

import math

import numpy as np
import pandas as pd


def encode_hour(hour: float) -> tuple[float, float]:
    """Map hour 1–24 onto a circle so hour 24 sits next to hour 1."""
    angle = 2 * math.pi * (hour - 1) / 24
    return math.sin(angle), math.cos(angle)


def add_cyclic_hour(frame: pd.DataFrame, column: str = "hour") -> pd.DataFrame:
    out = frame.copy()
    angle = 2 * np.pi * (out[column].astype(float) - 1) / 24
    out[f"{column}_sin"] = np.sin(angle)
    out[f"{column}_cos"] = np.cos(angle)
    return out
