import type { ExerciseSpec } from "@/features/exercises/config";
import type { ModelMetadata } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

/** Same cyclic encoding as src/arepa/features.py: hour 1 and hour 24 end up next to each other. */
export function encodeHour(hour: number): [number, number] {
  const angle = (2 * Math.PI * (hour - 1)) / 24;
  return [Math.sin(angle), Math.cos(angle)];
}

export type ImpactDirection = "up" | "down" | "cyclic";

export interface Impact {
  field: string;
  /** |standardized coefficient|: change in ŷ for one standard deviation of the input. */
  weight: number;
  /** weight relative to the strongest input (0–1), for bar widths. */
  share: number;
  direction: ImpactDirection;
}

/**
 * Ranks inputs by standardized coefficient. Features that come from one input
 * (sin and cos of the hour) are merged into their amplitude, since neither sign alone
 * says whether the hour raises or lowers the prediction.
 */
export function rankImpact(spec: ExerciseSpec, metadata: ModelMetadata): Impact[] {
  const standardized = new Map(
    metadata.coefficients.map((row) => [row.feature, row.standardized_coefficient]),
  );

  const byField = new Map<string, number[]>();
  for (const term of spec.terms) {
    const value = standardized.get(term.feature);
    if (value === undefined) continue;
    byField.set(term.field, [...(byField.get(term.field) ?? []), value]);
  }

  const impacts = [...byField].map(([field, values]) => ({
    field,
    weight: values.length > 1 ? Math.hypot(...values) : Math.abs(values[0]),
    direction: (values.length > 1 ? "cyclic" : values[0] >= 0 ? "up" : "down") as ImpactDirection,
  }));

  const strongest = Math.max(...impacts.map((impact) => impact.weight), Number.EPSILON);
  return impacts
    .map((impact) => ({ ...impact, share: impact.weight / strongest }))
    .sort((a, b) => b.weight - a.weight);
}

export interface EquationTerm {
  feature: string;
  symbol: string;
  field: string;
  /** Coefficient in original units (β). */
  coefficient: number;
  value?: number;
  contribution?: number;
}

export interface Equation {
  intercept: number;
  terms: EquationTerm[];
  /** β₀ + Σ βᵢxᵢ; only when features are given. */
  total?: number;
}

export function buildEquation(
  spec: ExerciseSpec,
  metadata: ModelMetadata,
  features?: Record<string, number>,
): Equation {
  const coefficients = new Map(metadata.coefficients.map((row) => [row.feature, row.coefficient]));
  const intercept = coefficients.get("intercept") ?? 0;

  const terms = spec.terms.map((term) => {
    const coefficient = coefficients.get(term.feature) ?? 0;
    const value = features?.[term.feature];
    return {
      ...term,
      coefficient,
      value,
      contribution: value === undefined ? undefined : coefficient * value,
    };
  });

  const total = features
    ? terms.reduce((sum, term) => sum + (term.contribution ?? 0), intercept)
    : undefined;

  return { intercept, terms, total };
}

export type FitTone = "high" | "good" | "moderate";

/** Reads each coefficient the way the assignment asks: what happens to ŷ when that input moves, rest fixed. */
export function describeEffect(spec: ExerciseSpec, metadata: ModelMetadata, field: string): string {
  const terms = spec.terms.filter((term) => term.field === field);
  const input = spec.fields.find((item) => item.name === field);
  const coefficients = new Map(metadata.coefficients.map((row) => [row.feature, row.coefficient]));

  if (terms.length !== 1 || !input?.effect) {
    return "La hora no entra como un número: seno y coseno hacen que la hora 24 quede junto a la 1. El peso de arriba es la amplitud de ese ciclo.";
  }

  const step = input.effectStep ?? 1;
  const change = (coefficients.get(terms[0].feature) ?? 0) * step;
  const { prefix = "", unit, decimals } = spec.target;
  const magnitude = `${prefix}${formatNumber(Math.abs(change), decimals)}${unit ? ` ${unit}` : ""}`;
  const direction = change >= 0 ? "sube" : "baja";
  return `Con el resto fijo, ${input.effect} ${direction} la predicción en ${magnitude}.`;
}

export function fitQuality(r2: number): { tone: FitTone; label: string } {
  if (r2 >= 0.9) return { tone: "high", label: "Ajuste alto" };
  if (r2 >= 0.75) return { tone: "good", label: "Ajuste bueno" };
  return { tone: "moderate", label: "Ajuste moderado" };
}
