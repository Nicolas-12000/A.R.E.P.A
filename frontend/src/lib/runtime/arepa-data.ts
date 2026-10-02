import { EXERCISES } from "@/features/exercises/config";
import { api } from "@/lib/api/client";
import type { CatalogItem, Health, ModelMetadata, ModelName, Prediction, PredictionLogItem } from "@/lib/api/types";

import {
  appendLocalHistory,
  listLocalHistory,
} from "./local-history";
import { localCatalog, localMetadata, localPredict } from "./local-models";
import { configuredMode, type ResolvedRuntime } from "./mode";

let resolvedMode: ResolvedRuntime | null = null;

export function getResolvedRuntime(): ResolvedRuntime | null {
  return resolvedMode;
}

export function resetRuntimeProbe() {
  resolvedMode = null;
}

async function resolveRuntime(signal?: AbortSignal): Promise<ResolvedRuntime> {
  const mode = configuredMode();
  if (mode === "local") {
    resolvedMode = "local";
    return "local";
  }
  if (mode === "api") {
    resolvedMode = "api";
    return "api";
  }
  if (resolvedMode) return resolvedMode;

  try {
    await api.health(signal);
    resolvedMode = "api";
  } catch {
    resolvedMode = "local";
  }
  return resolvedMode;
}

export async function arepaHealth(signal?: AbortSignal): Promise<Health & { runtime: ResolvedRuntime }> {
  const runtime = await resolveRuntime(signal);
  if (runtime === "local") {
    return {
      status: "ok",
      models_loaded: ["dollar", "glucose", "energy"],
      database: "disabled",
      app: "AREPA (modo local — sin API)",
      runtime,
    };
  }

  try {
    const health = await api.health(signal);
    return { ...health, runtime: "api" };
  } catch {
    resolvedMode = "local";
    return arepaHealth(signal);
  }
}

export async function arepaModels(signal?: AbortSignal): Promise<CatalogItem[]> {
  const runtime = await resolveRuntime(signal);
  if (runtime === "local") return localCatalog();
  try {
    return await api.models(signal);
  } catch {
    resolvedMode = "local";
    return localCatalog();
  }
}

export async function arepaMetadata(name: ModelName): Promise<ModelMetadata> {
  const runtime = await resolveRuntime();
  if (runtime === "local") return localMetadata(name);
  try {
    return await api.metadata(name);
  } catch {
    resolvedMode = "local";
    return localMetadata(name);
  }
}

export async function arepaPredict(name: ModelName, inputs: Record<string, number>): Promise<Prediction> {
  const runtime = await resolveRuntime();
  const spec = EXERCISES[name];

  if (runtime === "local") {
    const result = await localPredict(name, inputs, spec);
    appendLocalHistory(name, inputs, result.prediction);
    return { ...result, stored_in_history: true };
  }

  try {
    const result = await api.predict(name, inputs);
    if (result.stored_in_history) return result;
    appendLocalHistory(name, inputs, result.prediction);
    return { ...result, stored_in_history: true };
  } catch {
    resolvedMode = "local";
    const result = await localPredict(name, inputs, spec);
    appendLocalHistory(name, inputs, result.prediction);
    return { ...result, stored_in_history: true };
  }
}

export async function arepaHistory(limit: number, signal?: AbortSignal): Promise<PredictionLogItem[]> {
  const runtime = await resolveRuntime(signal);

  if (runtime === "local") {
    return listLocalHistory(limit);
  }

  try {
    return await api.history(limit, signal);
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : 0;
    if (status === 503 || status === 0) {
      resolvedMode = "local";
      return listLocalHistory(limit);
    }
    throw error;
  }
}
