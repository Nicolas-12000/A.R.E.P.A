import type { ModelName, PredictionLogItem } from "@/lib/api/types";

const STORAGE_KEY = "arepa:prediction-history";
const MAX_ROWS = 50;

interface StoredHistory {
  nextId: number;
  rows: PredictionLogItem[];
}

function readStore(): StoredHistory {
  if (typeof window === "undefined") return { nextId: 1, rows: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nextId: 1, rows: [] };
    const parsed = JSON.parse(raw) as StoredHistory;
    if (!Array.isArray(parsed.rows)) return { nextId: 1, rows: [] };
    return parsed;
  } catch {
    return { nextId: 1, rows: [] };
  }
}

function writeStore(store: StoredHistory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listLocalHistory(limit: number): PredictionLogItem[] {
  const { rows } = readStore();
  return rows.slice(0, Math.min(limit, rows.length));
}

export function appendLocalHistory(
  model_name: ModelName,
  input_payload: Record<string, number>,
  prediction: number,
): PredictionLogItem {
  const store = readStore();
  const row: PredictionLogItem = {
    id: store.nextId,
    model_name,
    input_payload,
    prediction,
    created_at: new Date().toISOString(),
  };
  store.nextId += 1;
  store.rows = [row, ...store.rows].slice(0, MAX_ROWS);
  writeStore(store);
  return row;
}
