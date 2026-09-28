import { formatInput, parseDecimal } from "@/lib/format";
import type { ExerciseSpec, FieldSpec } from "./config";

export interface FieldCheck {
  value?: number;
  /** Blocks submission. */
  error?: string;
  /** Allowed, but the prediction is an extrapolation. */
  warning?: string;
}

const MAX_INPUT_CHARS = 32;

export function checkField(field: FieldSpec, raw: string): FieldCheck {
  if (raw.length > MAX_INPUT_CHARS) return { error: "Valor demasiado largo." };
  if (raw.trim() === "") return { error: "Requerido." };

  if (field.kind === "select") {
    const allowed = field.options?.map((option) => option.value) ?? [];
    if (!allowed.includes(raw)) return { error: "Opción no válida." };
  }

  const value = parseDecimal(raw);
  if (Number.isNaN(value)) return { error: "Escribe un número, por ejemplo 12,5." };
  if (field.kind !== "decimal" && !Number.isInteger(value)) return { error: "Debe ser un número entero." };
  if (field.min !== undefined && value < field.min) {
    return { error: `El mínimo es ${formatInput(field.min)}.` };
  }
  if (field.max !== undefined && value > field.max) {
    return { error: `El máximo es ${formatInput(field.max)}.` };
  }

  const [low, high] = field.training;
  if (value < low || value > high) {
    return {
      value,
      warning: `Fuera del rango de entrenamiento (${formatInput(low)} a ${formatInput(high)}): la recta extrapola.`,
    };
  }
  return { value };
}

export interface FormCheck {
  checks: Record<string, FieldCheck>;
  /** Present only when every field is valid. */
  values?: Record<string, number>;
  extrapolates: boolean;
}

export function checkForm(spec: ExerciseSpec, draft: Record<string, string>): FormCheck {
  const checks: Record<string, FieldCheck> = {};
  const values: Record<string, number> = {};
  let valid = true;

  for (const field of spec.fields) {
    const check = checkField(field, draft[field.name] ?? "");
    checks[field.name] = check;
    if (check.value === undefined) valid = false;
    else values[field.name] = check.value;
  }

  return {
    checks,
    values: valid ? values : undefined,
    extrapolates: Object.values(checks).some((check) => check.warning),
  };
}
