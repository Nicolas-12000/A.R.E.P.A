#!/usr/bin/env python3
"""Train all three linear models and export joblib artifacts + metrics JSON."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from arepa.constants import FEATURE_COLUMNS, FIGURES_DIR, MODELS_DIR, TARGET_COLUMNS
from arepa.data_pipeline import check_multicollinearity, prepare_scenario_frame
from arepa.modeling import export_model, train_scenario
from arepa.treatment import save_processed
from arepa.visualization import plot_correlation_heatmap, save_all_feature_plots


def main() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    summary: dict[str, object] = {}

    for scenario in ("dollar", "glucose", "energy"):
        df, treatment = prepare_scenario_frame(scenario)
        save_processed(scenario, df)
        target = TARGET_COLUMNS[scenario]
        features = FEATURE_COLUMNS[scenario]

        vif = check_multicollinearity(df, features)
        published = train_scenario(df, scenario, exclude_outliers=False)
        without_iqr_flags = train_scenario(df, scenario, exclude_outliers=True)

        export_model(
            {
                "pipeline": published["pipeline"],
                "feature_names": published["feature_names"],
                "target": target,
                "metrics": published["metrics"],
                "coefficients": published["coefficients"].to_dict(orient="records"),
                "scenario": scenario,
                "fit_excludes_anomalies": False,
            },
            scenario=scenario,
        )

        plot_features = [f for f in features if f in df.columns]
        if scenario == "energy":
            plot_features = ["temperature", "hour", "day_of_week"]
        save_all_feature_plots(df, plot_features, target, FIGURES_DIR, prefix=scenario)
        plot_correlation_heatmap(
            df,
            plot_features + [target],
            save_path=FIGURES_DIR / f"{scenario}_correlation.png",
        )

        summary[scenario] = {
            "treatment": treatment,
            "vif": vif.to_dict(orient="records"),
            "metrics_published": published["metrics"],
            "metrics_without_iqr_flags": without_iqr_flags["metrics"],
            "huber_metrics": published["huber_metrics"],
            "influence": published["influence"],
            "coefficients": published["coefficients"].to_dict(orient="records"),
            "outlier_rows_kept": int(df["is_outlier"].sum()) if "is_outlier" in df.columns else 0,
        }
        print(
            f"[{scenario}] R²={published['metrics']['r2']:.4f} "
            f"Cook>{published['influence']['cooks_threshold']:.4f}: "
            f"{published['influence']['high_influence_rows']}"
        )

    metrics_path = MODELS_DIR / "training_metrics.json"
    metrics_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    report_path = PROJECT_ROOT / "report" / "data_treatment.md"
    report_path.write_text(_treatment_markdown(summary), encoding="utf-8")
    print(f"Wrote artifacts to {MODELS_DIR}, figures to {FIGURES_DIR}, report to {report_path}")


def _treatment_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Tratamiento de datos",
        "",
        "La data sucia está en `data/raw/`. La data tratada está en `data/processed/`.",
        "Solo se elimina un registro si el valor es físicamente imposible.",
        "El IQR marca colas para revisarlas. No autoriza a sacarlas del ajuste.",
        "El modelo publicado es la regresión lineal con todas las filas válidas.",
        "La distancia de Cook dice qué filas sí mueven la recta. Huber es la comprobación robusta: baja el peso de la cola sin borrarla.",
        "",
    ]
    for scenario, payload in summary.items():
        treatment = payload["treatment"]
        lines.append(f"## {scenario}")
        lines.append("")
        lines.append(f"- Fuente sucia: `{treatment['source']}`")
        lines.append(f"- Filas sucias: {treatment['rows_dirty']}")
        lines.append(f"- Filas tratadas: {treatment['rows_clean']}")
        lines.append(f"- Filas eliminadas: {treatment['rows_removed']}")
        lines.append(f"- Duplicados exactos: {treatment['exact_duplicates_removed']}")
        lines.append(f"- Errores de captura: {treatment['capture_errors_removed']}")
        lines.append(f"- Categorías conservadas: {treatment['anomaly_category_counts']}")
        lines.append(f"- Flags IQR (conservados): {treatment['iqr_flags_kept']}")
        published = payload["metrics_published"]
        sensitivity = payload["metrics_without_iqr_flags"]
        huber = payload["huber_metrics"]
        influence = payload["influence"]
        lines.append(
            f"- Modelo publicado (todas las filas válidas): R²={published['r2']:.4f}, MSE={published['mse']:.2f}, RMSE={published['rmse']:.2f}"
        )
        lines.append(
            f"- Sensibilidad sin filas marcadas por IQR: R²={sensitivity['r2']:.4f}, MSE={sensitivity['mse']:.2f}, RMSE={sensitivity['rmse']:.2f}"
        )
        lines.append(
            f"- Huber (mismo split, pesos menores en la cola): R²={huber['r2']:.4f}, MSE={huber['mse']:.2f}, RMSE={huber['rmse']:.2f}"
        )
        lines.append(
            f"- Cook's distance > {influence['cooks_threshold']:.4f} en entrenamiento: "
            f"{influence['high_influence_rows']} de {influence['train_rows']} "
            f"(máximo {influence['max_cooks_distance']:.4f})"
        )
        lines.append("")
        lines.append("| Variable | Coeficiente (unidad original) | Coeficiente estandarizado |")
        lines.append("|---|---:|---:|")
        for row in payload["coefficients"]:
            lines.append(
                f"| {row['feature']} | {row['coefficient']:.4f} | {row['standardized_coefficient']:.4f} |"
            )
        lines.append("")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
