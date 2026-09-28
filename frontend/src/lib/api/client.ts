import type {
  CatalogItem,
  Health,
  ModelMetadata,
  ModelName,
  Prediction,
  PredictionLogItem,
} from "./types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

const TIMEOUT_MS = 8000;

/** status 0 means the API could not be reached at all. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isOffline(): boolean {
    return this.status === 0;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new ApiError("La API tardó demasiado en responder.", 0);
  }
  return new ApiError(`No hay conexión con la API en ${API_BASE_URL}.`, 0);
}

function detailMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const { detail } = body as { detail: unknown };
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return "Algún valor está fuera del rango que acepta el modelo.";
  }
  return `La API respondió con error ${status}.`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/v1${path}`, {
      ...init,
      signal,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw toApiError(error);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(detailMessage(body, response.status), response.status);
  }
  return (await response.json()) as T;
}

const metadataCache = new Map<ModelName, Promise<ModelMetadata>>();

export function clearMetadataCache() {
  metadataCache.clear();
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("/health", { signal }),

  models: (signal?: AbortSignal) => request<CatalogItem[]>("/models", { signal }),

  /** Coefficients never change while the API runs, so one request per model is enough. */
  metadata(name: ModelName): Promise<ModelMetadata> {
    let pending = metadataCache.get(name);
    if (!pending) {
      pending = request<ModelMetadata>(`/models/${name}/metadata`);
      pending.catch(() => metadataCache.delete(name));
      metadataCache.set(name, pending);
    }
    return pending;
  },

  predict: (name: ModelName, inputs: Record<string, number>) => {
    const body: Record<string, number> = {};
    for (const [key, value] of Object.entries(inputs)) {
      if (!Number.isFinite(value)) {
        throw new ApiError("Algún valor no es un número válido.", 0);
      }
      body[key] = value;
    }
    return request<Prediction>(`/predict/${name}`, { method: "POST", body: JSON.stringify(body) });
  },

  history: (limit: number, signal?: AbortSignal) => {
    const safe = Math.min(200, Math.max(1, Math.floor(limit)));
    return request<PredictionLogItem[]>(`/predictions/history?limit=${safe}`, { signal });
  },
};
