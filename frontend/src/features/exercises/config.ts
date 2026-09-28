import type { ModelName } from "@/lib/api/types";
import { formatInput } from "@/lib/format";
import { encodeHour } from "@/lib/regression";

export type FieldKind = "integer" | "decimal" | "select";

export interface FieldSpec {
  /** Key sent to the API. */
  name: string;
  label: string;
  kind: FieldKind;
  unit?: string;
  /** Hard limits enforced by the backend schema. */
  min?: number;
  max?: number;
  /** Range seen during training; outside it the line extrapolates. */
  training: readonly [number, number];
  defaultValue: string;
  hint: string;
  /** "Con el resto fijo, <effect>…" Used to read the coefficient in words. */
  effect?: string;
  /** Scale the coefficient by this step (inflation is read per 0,01, not per 1). */
  effectStep?: number;
  options?: ReadonlyArray<{ value: string; label: string }>;
}

export interface FigureSpec {
  file: string;
  /** Tab label. */
  short: string;
  caption: string;
  /** What to look for in the figure, in one or two sentences. */
  note: string;
  /** Matches the figsize used when the PNG was saved. */
  ratio: "7 / 4" | "6 / 5";
}

/** A model feature as it appears in the equation; several features can share one input field. */
export interface TermSpec {
  feature: string;
  symbol: string;
  field: string;
}

export interface ExerciseSpec {
  id: ModelName;
  slug: string;
  number: number;
  shortLabel: string;
  title: string;
  question: string;
  target: { label: string; prefix?: string; unit?: string; decimals: number };
  fields: readonly FieldSpec[];
  terms: readonly TermSpec[];
  /** Rows kept after treatment. None were dropped. */
  rows: number;
  figures: readonly FigureSpec[];
  toFeatures(values: Record<string, number>): Record<string, number>;
}

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const identity = (values: Record<string, number>) => ({ ...values });

export const EXERCISES: Record<ModelName, ExerciseSpec> = {
  dollar: {
    id: "dollar",
    slug: "dolar",
    number: 1,
    shortLabel: "Dólar",
    title: "Precio del dólar",
    question: "¿Cuánto costará el dólar según el día, la inflación y la tasa de interés?",
    target: { label: "Precio estimado", prefix: "$", unit: "COP", decimals: 2 },
    fields: [
      {
        name: "day",
        label: "Día",
        kind: "integer",
        min: 1,
        max: 100_000,
        training: [1, 500],
        defaultValue: "120",
        hint: "Índice del día en la serie.",
        effect: "un día más",
      },
      {
        name: "inflation_rate",
        label: "Inflación diaria",
        kind: "decimal",
        min: 0,
        max: 1,
        training: [0.0038, 0.0393],
        defaultValue: "0,02",
        hint: "Como fracción: 0,02 equivale a 2 %.",
        effect: "0,01 más de inflación",
        effectStep: 0.01,
      },
      {
        name: "interest_rate",
        label: "Tasa de interés",
        kind: "decimal",
        unit: "%",
        min: 0,
        max: 100,
        training: [3.6516, 6.3162],
        defaultValue: "5",
        hint: "Tasa diaria en porcentaje.",
        effect: "un punto más de tasa",
      },
    ],
    terms: [
      { feature: "day", symbol: "día", field: "day" },
      { feature: "inflation_rate", symbol: "infl", field: "inflation_rate" },
      { feature: "interest_rate", symbol: "tasa", field: "interest_rate" },
    ],
    rows: 500,
    figures: [
      {
        file: "dollar_day_vs_dollar_price.png",
        short: "Día",
        caption: "Día y precio del dólar",
        note: "Los puntos casi dibujan la recta: el día explica prácticamente todo el precio (r ≈ 1,00).",
        ratio: "7 / 4",
      },
      {
        file: "dollar_inflation_rate_vs_dollar_price.png",
        short: "Inflación",
        caption: "Inflación y precio del dólar",
        note: "Nube plana sin pendiente clara (r ≈ 0,02). Por sí sola, la inflación diaria casi no mueve el precio.",
        ratio: "7 / 4",
      },
      {
        file: "dollar_interest_rate_vs_dollar_price.png",
        short: "Tasa",
        caption: "Tasa de interés y precio del dólar",
        note: "Relación muy débil (r ≈ 0,07): la recta apenas se inclina frente a la dispersión.",
        ratio: "7 / 4",
      },
      {
        file: "dollar_correlation.png",
        short: "Correlación",
        caption: "Correlación entre las variables",
        note: "Solo el día está correlacionado con el precio. Las entradas casi no se correlacionan entre sí, así que no hay multicolinealidad.",
        ratio: "6 / 5",
      },
    ],
    toFeatures: identity,
  },
  glucose: {
    id: "glucose",
    slug: "glucosa",
    number: 2,
    shortLabel: "Glucosa",
    title: "Nivel de glucosa",
    question: "¿Qué nivel de glucosa se espera según la edad, el IMC y la actividad física?",
    target: { label: "Glucosa estimada", unit: "mg/dL", decimals: 1 },
    fields: [
      {
        name: "age",
        label: "Edad",
        kind: "integer",
        unit: "años",
        min: 1,
        max: 120,
        training: [20, 79],
        defaultValue: "45",
        hint: "Edad en años cumplidos.",
        effect: "un año más",
      },
      {
        name: "bmi",
        label: "IMC",
        kind: "decimal",
        unit: "kg/m²",
        min: 10,
        max: 80,
        training: [10.5867, 39.4302],
        defaultValue: "25,0",
        hint: "Índice de masa corporal.",
        effect: "un punto más de IMC",
      },
      {
        name: "physical_activity_hours",
        label: "Actividad física",
        kind: "decimal",
        unit: "h",
        min: 0,
        max: 168,
        training: [0, 9],
        defaultValue: "5",
        hint: "Horas semanales de ejercicio.",
        effect: "una hora más de actividad",
      },
    ],
    terms: [
      { feature: "age", symbol: "edad", field: "age" },
      { feature: "bmi", symbol: "imc", field: "bmi" },
      { feature: "physical_activity_hours", symbol: "act", field: "physical_activity_hours" },
    ],
    rows: 2000,
    figures: [
      {
        file: "glucose_age_vs_glucose_level.png",
        short: "Edad",
        caption: "Edad y nivel de glucosa",
        note: "La relación más fuerte (r ≈ 0,79): con más edad, la glucosa sube de forma sostenida.",
        ratio: "7 / 4",
      },
      {
        file: "glucose_bmi_vs_glucose_level.png",
        short: "IMC",
        caption: "IMC y nivel de glucosa",
        note: "Pendiente positiva pero suave (r ≈ 0,14): el IMC aporta, con mucha dispersión alrededor.",
        ratio: "7 / 4",
      },
      {
        file: "glucose_physical_activity_hours_vs_glucose_level.png",
        short: "Actividad",
        caption: "Actividad física y nivel de glucosa",
        note: "La recta baja (r ≈ −0,20): más horas de ejercicio se asocian con menos glucosa.",
        ratio: "7 / 4",
      },
      {
        file: "glucose_correlation.png",
        short: "Correlación",
        caption: "Correlación entre las variables",
        note: "La edad domina y las entradas son casi independientes. El R² moderado viene de lo que la tabla no mide.",
        ratio: "6 / 5",
      },
    ],
    toFeatures: identity,
  },
  energy: {
    id: "energy",
    slug: "energia",
    number: 3,
    shortLabel: "Energía",
    title: "Consumo de energía",
    question: "¿Cuánta energía se consumirá según la temperatura, la hora y el día?",
    target: { label: "Consumo estimado", unit: "kWh", decimals: 1 },
    fields: [
      {
        name: "temperature",
        label: "Temperatura",
        kind: "decimal",
        unit: "°C",
        min: -40,
        max: 60,
        training: [5.388, 44.6312],
        defaultValue: "22",
        hint: "Temperatura ambiente.",
        effect: "un grado más",
      },
      {
        name: "hour",
        label: "Hora",
        kind: "integer",
        unit: "h",
        min: 1,
        max: 24,
        training: [1, 24],
        defaultValue: "14",
        hint: "De 1 a 24. El modelo la trata como un ciclo.",
      },
      {
        name: "day_of_week",
        label: "Día de la semana",
        kind: "select",
        min: 1,
        max: 7,
        training: [1, 7],
        defaultValue: "3",
        hint: "Lunes = 1, domingo = 7.",
        effect: "un día más hacia el domingo",
        options: WEEKDAYS.map((label, index) => ({ value: String(index + 1), label })),
      },
    ],
    terms: [
      { feature: "temperature", symbol: "temp", field: "temperature" },
      { feature: "hour_sin", symbol: "sen(h)", field: "hour" },
      { feature: "hour_cos", symbol: "cos(h)", field: "hour" },
      { feature: "day_of_week", symbol: "día", field: "day_of_week" },
    ],
    rows: 10000,
    figures: [
      {
        file: "energy_temperature_vs_energy_consumption.png",
        short: "Temperatura",
        caption: "Temperatura y consumo",
        note: "La relación más fuerte (r ≈ 0,77): cada grado más empuja el consumo hacia arriba.",
        ratio: "7 / 4",
      },
      {
        file: "energy_hour_vs_energy_consumption.png",
        short: "Hora",
        caption: "Hora del día y consumo",
        note: "Columnas por hora con una tendencia al alza (r ≈ 0,53). El modelo la trata como ciclo con seno y coseno.",
        ratio: "7 / 4",
      },
      {
        file: "energy_day_of_week_vs_energy_consumption.png",
        short: "Día",
        caption: "Día de la semana y consumo",
        note: "Casi plana y levemente negativa (r ≈ −0,10): hacia el fin de semana se consume un poco menos.",
        ratio: "7 / 4",
      },
      {
        file: "energy_correlation.png",
        short: "Correlación",
        caption: "Correlación entre las variables",
        note: "Temperatura y hora explican el consumo y no se correlacionan entre sí.",
        ratio: "6 / 5",
      },
    ],
    toFeatures({ hour, ...rest }) {
      const [hourSin, hourCos] = encodeHour(hour);
      return { ...rest, hour_sin: hourSin, hour_cos: hourCos };
    },
  },
};

export const EXERCISE_LIST = Object.values(EXERCISES).sort((a, b) => a.number - b.number);

export function exerciseFromSlug(slug: string | undefined): ModelName {
  return EXERCISE_LIST.find((exercise) => exercise.slug === slug)?.id ?? "dollar";
}

export function defaultDraft(spec: ExerciseSpec): Record<string, string> {
  return Object.fromEntries(spec.fields.map((field) => [field.name, field.defaultValue]));
}

/** Rebuild form strings from a stored prediction payload. */
export function draftFromPayload(spec: ExerciseSpec, payload: Record<string, number>): Record<string, string> {
  return Object.fromEntries(
    spec.fields.map((field) => {
      const value = payload[field.name];
      if (value === undefined || typeof value !== "number" || !Number.isFinite(value)) {
        return [field.name, field.defaultValue];
      }
      if (field.kind === "select") return [field.name, String(value)];
      return [field.name, formatInput(value)];
    }),
  );
}

export function fieldLabel(spec: ExerciseSpec, name: string): string {
  return spec.fields.find((field) => field.name === name)?.label ?? name;
}

export const FIGURE_FILES = new Set(EXERCISE_LIST.flatMap((exercise) => exercise.figures.map((figure) => figure.file)));
