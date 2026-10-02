import { EXERCISES, type ExerciseSpec } from "@/features/exercises/config";
import type { CatalogItem, Coefficient, ModelMetadata, ModelName, Prediction } from "@/lib/api/types";
import { buildEquation } from "@/lib/regression";

export interface ModelBundle {
  exercise_title: string;
  target: string;
  feature_names: string[];
  metrics: { mse: number; rmse: number; r2: number };
  coefficients: Coefficient[];
}

export interface ArepaBundle {
  version: string;
  source: string;
  algorithm: string;
  models: Record<ModelName, ModelBundle>;
}

let bundlePromise: Promise<ArepaBundle> | null = null;

export function loadBundle(): Promise<ArepaBundle> {
  if (!bundlePromise) {
    bundlePromise = fetch("/models/bundle.json", { cache: "force-cache" }).then(async (response) => {
      if (!response.ok) {
        throw new Error("No se encontró /models/bundle.json. Ejecuta scripts/export_frontend_bundle.py.");
      }
      return (await response.json()) as ArepaBundle;
    });
  }
  return bundlePromise;
}

export function clearBundleCache() {
  bundlePromise = null;
}

function toMetadata(name: ModelName, model: ModelBundle): ModelMetadata {
  return {
    model_name: name,
    target: model.target,
    algorithm: "linear_regression_ols",
    feature_names: model.feature_names,
    training_metrics: {
      mse: model.metrics.mse,
      rmse: model.metrics.rmse,
      r2: model.metrics.r2,
    },
    coefficients: model.coefficients,
    version: "local-bundle",
  };
}

export async function localCatalog(): Promise<CatalogItem[]> {
  const bundle = await loadBundle();
  return (Object.keys(bundle.models) as ModelName[]).map((name) => {
    const model = bundle.models[name];
    return {
      model_name: name,
      exercise_title: model.exercise_title,
      target: model.target,
      r2_score: model.metrics.r2,
      mse: model.metrics.mse,
      rmse: model.metrics.rmse,
      version: "local",
      trained_at: null,
      artifact_loaded: true,
    };
  });
}

export async function localMetadata(name: ModelName): Promise<ModelMetadata> {
  const bundle = await loadBundle();
  return toMetadata(name, bundle.models[name]);
}

export async function localPredict(
  name: ModelName,
  inputs: Record<string, number>,
  spec: ExerciseSpec = EXERCISES[name],
): Promise<Prediction> {
  const bundle = await loadBundle();
  const model = bundle.models[name];
  const metadata = toMetadata(name, model);
  const features = spec.toFeatures(inputs);
  const equation = buildEquation(spec, metadata, features);
  if (equation.total === undefined || !Number.isFinite(equation.total)) {
    throw new Error("No se pudo calcular la predicción en modo local.");
  }

  return {
    prediction: equation.total,
    model_name: name,
    target: model.target,
    model_r2: model.metrics.r2,
    model_mse: model.metrics.mse,
    model_rmse: model.metrics.rmse,
    stored_in_history: false,
  };
}
