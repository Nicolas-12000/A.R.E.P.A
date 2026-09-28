import type { FormEvent } from "react";

import { Spinner } from "@/components/ui/spinner";
import type { ExerciseSpec, FieldSpec } from "@/features/exercises/config";
import type { FieldCheck } from "@/features/exercises/validation";
import { cn } from "@/lib/cn";
import { formatInput } from "@/lib/format";

interface PredictionFormProps {
  spec: ExerciseSpec;
  draft: Record<string, string>;
  checks: Record<string, FieldCheck>;
  showErrors: boolean;
  pending: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  className?: string;
}

export function PredictionForm({
  spec,
  draft,
  checks,
  showErrors,
  pending,
  onChange,
  onSubmit,
  onReset,
  className,
}: PredictionFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex min-h-0 flex-col lg:flex-1", className)}
    >
      <div
        className={cn(
          "gap-4 max-lg:grid sm:max-lg:grid-cols-2 md:max-lg:grid-cols-3",
          "lg:mx-auto lg:flex lg:w-full lg:max-w-md lg:min-h-0 lg:flex-1 lg:flex-col lg:justify-between lg:gap-8",
        )}
      >
          {spec.fields.map((field) => (
            <Field
              key={`${spec.id}-${field.name}`}
              idPrefix={spec.id}
              field={field}
              raw={draft[field.name] ?? ""}
              check={checks[field.name] ?? {}}
              showError={showErrors}
              onChange={(value) => onChange(field.name, value)}
            />
          ))}
      </div>

      <div className="mt-5 flex shrink-0 gap-3 border-t border-outline/60 pt-5 lg:mt-0 lg:pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 flex-1 touch-manipulation items-center justify-center gap-2 rounded-md bg-tertiary px-6 font-semibold text-on-tertiary transition-colors hover:bg-tertiary-container disabled:cursor-wait disabled:opacity-80"
        >
          {pending && <Spinner />}
          {pending ? "Calculando…" : "Calcular"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-12 touch-manipulation rounded-md border border-outline px-4 text-sm font-medium text-secondary transition-colors hover:border-secondary hover:text-primary"
        >
          Restablecer
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  idPrefix: string;
  field: FieldSpec;
  raw: string;
  check: FieldCheck;
  showError: boolean;
  onChange: (value: string) => void;
}

function Field({ idPrefix, field, raw, check, showError, onChange }: FieldProps) {
  const id = `${idPrefix}-${field.name}`;
  const error = showError ? check.error : undefined;
  const [low, high] = field.training;

  const control = cn(
    "type-num h-11 w-full rounded-md border bg-surface px-3 text-primary transition-colors outline-none lg:h-12 lg:px-4 lg:text-lg",
    "focus:border-tertiary focus:ring-3 focus:ring-tertiary/20",
    error ? "border-error" : "border-outline hover:border-secondary",
  );

  return (
    <div className="min-w-0 lg:flex lg:flex-col lg:justify-center">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium lg:mb-2 lg:text-base">
        {field.label}
      </label>

      {field.kind === "select" ? (
        <select
          id={id}
          value={raw}
          onChange={(event) => onChange(event.target.value)}
          className={cn(control, "appearance-none bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat pr-9")}
          style={{ backgroundImage: CHEVRON }}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            id={id}
            type="text"
            inputMode={field.kind === "integer" ? "numeric" : "decimal"}
            autoComplete="off"
            enterKeyHint="go"
            maxLength={32}
            value={raw}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint`}
            className={cn(control, field.unit && "pr-16")}
          />
          {field.unit && (
            <span className="type-label pointer-events-none absolute inset-y-0 right-3 flex items-center text-secondary normal-case">
              {field.unit}
            </span>
          )}
        </div>
      )}

      <p
        id={`${id}-hint`}
        className="type-small mt-2 leading-relaxed text-pretty text-secondary lg:mt-2.5 lg:text-sm"
        aria-live="polite"
      >
        {error ? (
          <span className="font-medium text-error">{error}</span>
        ) : check.warning ? (
          <span className="flex gap-2 rounded-sm bg-mark/15 px-2 py-1 text-primary">
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mark" />
            {check.warning}
          </span>
        ) : (
          <>
            {field.hint}{" "}
            <span className="whitespace-nowrap">
              Entrenado con {formatInput(low)}–{formatInput(high)}.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%236b6358' stroke-width='1.5'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`;
