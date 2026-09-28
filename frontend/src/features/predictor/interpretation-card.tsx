"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { Card, CardLabel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fieldLabel, type ExerciseSpec } from "@/features/exercises/config";
import type { ResourceState } from "@/hooks/use-resource";
import type { ModelMetadata } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatNumber, formatSigned } from "@/lib/format";
import { buildEquation, describeEffect, rankImpact, type ImpactDirection } from "@/lib/regression";
import { ErrorNotice } from "./result-card";

const TABS = [
  { id: "impact", label: "Impacto" },
  { id: "equation", label: "Ecuación" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface InterpretationCardProps {
  spec: ExerciseSpec;
  metadata: ResourceState<ModelMetadata>;
  onRetry: () => void;
  /** Features of the last successful prediction, to fill the equation. */
  features?: Record<string, number>;
  className?: string;
}

export function InterpretationCard({ spec, metadata, onRetry, features, className }: InterpretationCardProps) {
  const [tab, setTab] = useState<TabId>("impact");
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const data = "data" in metadata ? metadata.data : undefined;

  return (
    <Card className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-3">
        <CardLabel>Interpretación</CardLabel>
        <div role="tablist" aria-label="Vista" className="grid grid-cols-2 rounded-md bg-neutral p-0.5">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-${item.id}-tab`}
              aria-selected={tab === item.id}
              aria-controls={`${baseId}-${item.id}-panel`}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "h-9 touch-manipulation rounded-sm px-3 text-sm font-medium transition-colors",
                tab === item.id ? "bg-surface text-primary shadow-sm" : "text-secondary hover:text-primary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-${tab}-panel`}
        aria-labelledby={`${baseId}-${tab}-tab`}
        className="mt-4 flex min-h-0 flex-1 flex-col lg:mt-5"
      >
        {metadata.status === "error" && !data ? (
          <ErrorNotice error={metadata.error}>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-tertiary underline-offset-4 hover:underline"
            >
              Reintentar
            </button>
          </ErrorNotice>
        ) : !data || data.model_name !== spec.id ? (
          <InterpretationSkeleton />
        ) : tab === "impact" ? (
          <ImpactList spec={spec} metadata={data} />
        ) : (
          <EquationTable spec={spec} metadata={data} features={features} />
        )}
      </div>
    </Card>
  );
}

const BAR_TONES: Record<ImpactDirection, string> = {
  up: "bg-positive",
  down: "bg-mora",
  cyclic: "bg-secondary",
};

const DIRECTION_TEXT: Record<ImpactDirection, string> = {
  up: "sube",
  down: "baja",
  cyclic: "cíclico",
};

function ImpactList({ spec, metadata }: { spec: ExerciseSpec; metadata: ModelMetadata }) {
  const impacts = rankImpact(spec, metadata);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="flex flex-1 flex-col justify-center gap-3 lg:gap-3.5">
        {impacts.map((impact, index) => (
          <li key={impact.field} className="rounded-md bg-neutral/45 px-3.5 py-3 sm:px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm leading-snug font-semibold text-primary">
                  {fieldLabel(spec, impact.field)}
                </p>
                {index === 0 && (
                  <span className="inline-block rounded-sm bg-mark/25 px-1.5 py-0.5 text-xs font-medium text-primary">
                    Mayor impacto
                  </span>
                )}
              </div>
              <p className="type-num shrink-0 pt-0.5 text-sm tabular-nums text-secondary">
                <span className="sr-only">Peso relativo </span>
                {formatNumber(impact.weight, 2)}
                <span className="sr-only">, {DIRECTION_TEXT[impact.direction]}</span>
              </p>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface lg:h-2.5">
              <div
                className={cn("h-full rounded-full", BAR_TONES[impact.direction])}
                style={{ width: `${Math.max(impact.share * 100, 2)}%` }}
              />
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-pretty text-secondary">
              {describeEffect(spec, metadata, impact.field)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2 border-t border-outline pt-3">
        <div className="type-small flex flex-wrap gap-x-4 gap-y-1.5 text-secondary">
          <Legend tone="bg-positive" label="Sube ŷ" />
          <Legend tone="bg-mora" label="Baja ŷ" />
          {impacts.some((impact) => impact.direction === "cyclic") && (
            <Legend tone="bg-secondary" label="Cíclico (hora)" />
          )}
        </div>
        <p className="text-xs leading-relaxed text-pretty text-secondary">
          Coeficiente estandarizado: cuánto cambia ŷ al mover la variable una desviación estándar.
        </p>
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2 rounded-full", tone)} />
      {label}
    </span>
  );
}

/** Small coefficients (per unit of a fraction, like inflation) need more digits to not read as 0. */
function coefficientDecimals(value: number): number {
  return value !== 0 && Math.abs(value) < 0.01 ? 4 : 2;
}

function EquationTable({
  spec,
  metadata,
  features,
}: {
  spec: ExerciseSpec;
  metadata: ModelMetadata;
  features?: Record<string, number>;
}) {
  const { intercept, terms, total } = buildEquation(spec, metadata, features);
  const decimals = spec.target.decimals;
  const rowPad = features ? "py-2" : "py-2.5 lg:py-3";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p
        className={cn(
          "shrink-0 text-center font-mono leading-relaxed text-pretty wrap-break-word",
          features ? "text-code sm:text-sm" : "text-sm sm:text-base lg:text-[1.0625rem] lg:leading-snug",
        )}
      >
        ŷ = {formatNumber(intercept, 2)}
        {terms.map((term) => (
          <span key={term.feature}>
            {" "}
            {term.coefficient < 0 ? "−" : "+"} {formatNumber(Math.abs(term.coefficient), coefficientDecimals(term.coefficient))}
            ·<span className="text-tertiary">{term.symbol}</span>
          </span>
        ))}
      </p>

      <div className="-mx-4 mt-4 flex min-h-0 flex-1 flex-col justify-center overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        <table
          className={cn(
            "w-full min-w-68 font-mono tabular-nums",
            features ? "text-code sm:text-sm" : "text-sm sm:text-base",
          )}
        >
          <thead>
            <tr className="type-label border-b border-outline text-left text-secondary">
              <th scope="col" className={cn("pr-3 font-medium", rowPad)}>Término</th>
              <th scope="col" className={cn("pr-3 text-right font-medium", rowPad)}>x</th>
              <th scope="col" className={cn("pr-3 text-right font-medium", rowPad)}>β</th>
              <th scope="col" className={cn("text-right font-medium", rowPad)}>β·x</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-outline/60">
              <th scope="row" className={cn("pr-3 text-left font-normal", rowPad)}>β₀</th>
              <td className={cn("pr-3 text-right text-secondary", rowPad)}>—</td>
              <td className={cn("pr-3 text-right", rowPad)}>{formatNumber(intercept, 2)}</td>
              <td className={cn("text-right", rowPad)}>{formatNumber(intercept, decimals)}</td>
            </tr>
            {terms.map((term) => (
              <tr key={term.feature} className="border-b border-outline/60">
                <th scope="row" className={cn("pr-3 text-left font-normal", rowPad)}>
                  <span className="text-tertiary">{term.symbol}</span>
                </th>
                <td className={cn("pr-3 text-right", rowPad)}>
                  {term.value === undefined ? "—" : formatNumber(term.value, Number.isInteger(term.value) ? 0 : 3)}
                </td>
                <td className={cn("pr-3 text-right", rowPad)}>
                  {formatSigned(term.coefficient, coefficientDecimals(term.coefficient))}
                </td>
                <td className={cn("text-right", rowPad)}>
                  {term.contribution === undefined ? "—" : formatSigned(term.contribution, decimals)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3} className="pt-2.5 pr-3 text-left font-semibold">
                ŷ
              </th>
              <td className="pt-2.5 text-right font-semibold">
                {total === undefined ? "—" : formatNumber(total, decimals)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!features && (
        <p className="type-small mt-auto shrink-0 border-t border-outline pt-3 leading-relaxed text-secondary">
          Calcula una predicción para ver el aporte de cada término.
        </p>
      )}
    </div>
  );
}

function InterpretationSkeleton() {
  return (
    <div className="space-y-3.5">
      <span className="sr-only">Cargando interpretación…</span>
      {["w-full", "w-3/5", "w-1/3"].map((width) => (
        <div key={width}>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className={cn("mt-2 h-2 rounded-full", width)} />
        </div>
      ))}
    </div>
  );
}
