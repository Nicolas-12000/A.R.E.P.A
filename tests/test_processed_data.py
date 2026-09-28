"""Processed CSV on disk must match the current treatment pipeline."""

from pathlib import Path

import pandas as pd

from arepa.constants import PROCESSED_DATA_PATHS
from arepa.treatment import treat_data

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_processed_matches_treat_data() -> None:
    for scenario, path in PROCESSED_DATA_PATHS.items():
        expected, _report = treat_data(scenario)
        on_disk = pd.read_csv(path)
        pd.testing.assert_frame_equal(
            on_disk.sort_index(axis=1),
            expected.sort_index(axis=1),
            check_dtype=False,
            rtol=1e-5,
            atol=1e-8,
        )


def test_row_counts_match_raw_sources() -> None:
    counts = {"dollar": 500, "glucose": 2000, "energy": 10000}
    for scenario, expected_rows in counts.items():
        frame, report = treat_data(scenario)
        assert len(frame) == expected_rows
        assert report["rows_clean"] == expected_rows
        assert report["rows_removed"] == 0
