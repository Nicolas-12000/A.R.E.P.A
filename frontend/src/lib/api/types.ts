/** Mirrors backend/app/schemas.py. */

export type ModelName = "dollar" | "glucose" | "energy";

export interface Health {
  status: "ok" | "degraded";
  models_loaded: ModelName[];
  database: "disabled" | "ok" | "error";
  app: string;
}

export interface CatalogItem {
  model_name: ModelName;
  exercise_title: string;
  target: string;
  r2_score: number;
  mse: number;
  rmse: number | null;
  version: string;
  trained_at: string | null;
  artifact_loaded: boolean;
}

export interface Coefficient {
  feature: string;
  coefficient: number;
  standardized_coefficient: number;
}

export interface ModelMetadata {
  model_name: ModelName;
  target: string;
  algorithm: string;
  feature_names: string[];
  training_metrics: Record<string, number>;
  coefficients: Coefficient[];
  version: string;
}

export interface Prediction {
  prediction: number;
  model_name: ModelName;
  target: string;
  model_r2: number;
  model_mse: number;
  model_rmse: number | null;
  stored_in_history: boolean;
}

export interface PredictionLogItem {
  id: number;
  model_name: ModelName;
  input_payload: Record<string, number>;
  prediction: number;
  created_at: string;
}
