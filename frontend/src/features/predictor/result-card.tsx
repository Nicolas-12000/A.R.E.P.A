import type { ReactNode, Ref } from "react";

import { Card, CardLabel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExerciseSpec } from "@/features/exercises/config";
import type { ResourceState } from "@/hooks/use-resource";
import type { ApiError } from "@/lib/api/client";
import type { CatalogItem } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatMetric, formatNumber } from "@/lib/format";
import { fitQuality, type FitTone } from "@/lib/regression";
import type { ResultState } from "./state";

interface ResultCardProps {
  spec: ExerciseSpec;
  result: ResultState;
  catalog: ResourceState<CatalogItem[]>;
  ref?: Ref<HTMLElement>;
  className?: string;
}

export function ResultCard({ spec, result, catalog, ref, className }: ResultCardProps) {
  return (
    <Card
      ref={ref}
      aria-live="polite"
      aria-busy={result.status === "loading"}
      className={cn("scroll-mt-36 shadow-focus lg:scroll-mt-24", className)}
    >
      <CardLabel>{spec.target.label}</CardLabel>
      <div className="mt-3">
        {result.status === "loading" && <ResultSkeleton />}
        {result.status === "error" && <ErrorNotice error={result.error} />}
        {result.status === "idle" && <IdleResult spec={spec} catalog={catalog} />}
        {result.status === "success" && (
          <SuccessResult
            spec={spec}
            prediction={result.prediction.prediction}
            r2={result.prediction.model_r2}
            mse={result.prediction.model_mse}
            rmse={result.prediction.model_rmse}
            stored={result.prediction.stored_in_history}
            extrapolates={result.extrapolates}
          />
        )}
      </div>
    </Card>
  );
}

function Value({ spec, value }: { spec: ExerciseSpec; value: number }) {
  const { prefix, unit, decimals } = spec.target;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="type-num-xl leading-none lg:text-[clamp(2.25rem,4vw,3.25rem)]">
        {prefix}
        {formatNumber(value, decimals)}
      </span>
      {unit && <span className="type-label text-secondary">{unit}</span>}
    </p>
  );
}

function MarginRange({
  prefix,
  decimals,
  low,
  prediction,
  high,
  error,
}: {
  prefix: string;
  decimals: number;
  low: number;
  prediction: number;
  high: number;
  error: number;
}) {
  const span = high - low || 1;
  const center = ((prediction - low) / span) * 100;

  return (
    <div className="rounded-md bg-neutral/70 px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-secondary uppercase">
        Margen de error (±{formatNumber(error, decimals)})
      </p>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-outline/50">
        <div className="absolute inset-y-0 left-[8%] right-[8%] rounded-full bg-tertiary/25" />
        <div
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-tertiary shadow-sm"
          style={{ left: `${8 + (center / 100) * 84}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <span className="type-num text-xs text-primary sm:text-sm">
          {prefix}
          {formatNumber(low, decimals)}
        </span>
        <span className="type-num text-xs font-medium text-tertiary sm:text-sm">
          {prefix}
          {formatNumber(prediction, decimals)}
        </span>
        <span className="type-num text-xs text-primary sm:text-sm">
          {prefix}
          {formatNumber(high, decimals)}
        </span>
      </div>
    </div>
  );
}

function SuccessResult({
  spec,
  prediction,
  r2,
  mse,
  rmse,
  stored,
  extrapolates,
}: {
  spec: ExerciseSpec;
  prediction: number;
  r2: number;
  mse: number;
  rmse: number | null;
  stored: boolean;
  extrapolates: boolean;
}) {
  const { decimals, prefix = "" } = spec.target;
  const error = rmse ?? Math.sqrt(mse);
  const low = prediction - error;
  const high = prediction + error;

  const fit = fitQuality(r2);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <Value spec={spec} value={prediction} />
        <FitBadge tone={fit.tone} label={fit.label} className="mb-0.5 shrink-0" />
      </div>

      <MarginRange
        prefix={prefix}
        decimals={decimals}
        low={low}
        prediction={prediction}
        high={high}
        error={error}
      />

      <MetricChips r2={r2} mse={mse} rmse={rmse} />

      <footer className="space-y-2 border-t border-outline/70 pt-2.5">
        {extrapolates && (
          <p className="type-small flex gap-2 leading-relaxed text-pretty rounded-md bg-mark/15 px-3 py-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-mark" />
            Hay entradas fuera del rango de entrenamiento: la recta extrapola y el error real puede ser mayor.
          </p>
        )}
        <p className="text-xs text-secondary">
          {stored ? "Guardado en el historial." : "No se guardó en el historial (sin base de datos)."}
        </p>
      </footer>
    </div>
  );
}

function IdleResult({ spec, catalog }: { spec: ExerciseSpec; catalog: ResourceState<CatalogItem[]> }) {
  if (catalog.status === "error" && !catalog.data) return <ErrorNotice error={catalog.error} />;

  const item = "data" in catalog ? catalog.data?.find((model) => model.model_name === spec.id) : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-md bg-neutral/50 px-4 py-3">
        <span aria-hidden className="type-num-xl shrink-0 text-tertiary/25 lg:text-5xl">
          ŷ
        </span>
        <p className="type-small leading-relaxed text-pretty text-secondary">
          Completa los datos y pulsa <span className="font-medium text-primary">Calcular</span>. Verás la
          predicción con su margen de error.
        </p>
      </div>
      {item ? <MetricChips r2={item.r2_score} mse={item.mse} rmse={item.rmse} /> : <MetricsSkeleton />}
    </div>
  );
}

function MetricChips({
  r2,
  mse,
  rmse,
  className,
}: {
  r2: number;
  mse: number;
  rmse: number | null;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)} role="list" aria-label="Métricas del modelo">
      <Chip label="R²" value={formatNumber(r2, 3)} />
      <Chip label="MSE" value={formatMetric(mse)} />
      <Chip label="RMSE" value={rmse !== null ? formatMetric(rmse) : "—"} />
    </div>
  );
}

const FIT_TONES: Record<FitTone, string> = {
  high: "bg-positive/10 text-positive",
  good: "bg-positive/10 text-positive",
  moderate: "bg-mark/20 text-primary",
};

function FitBadge({ tone, label, className }: { tone: FitTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-center text-xs font-semibold tracking-normal normal-case",
        FIT_TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="inline-flex min-w-0 items-baseline justify-between gap-2 rounded-md border border-outline bg-surface px-2.5 py-2.5"
      role="listitem"
    >
      <span className="type-label text-secondary">{label}</span>
      <span className="type-num text-sm font-medium">{value}</span>
    </span>
  );
}

function MetricsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-3">
      <span className="sr-only">Calculando la predicción…</span>
      <Skeleton className="h-12 w-44 max-w-full" />
      <Skeleton className="h-18 w-full rounded-md" />
      <MetricsSkeleton />
    </div>
  );
}

export function ErrorNotice({ error, children }: { error: ApiError; children?: ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-error/30 px-3 py-3">
      <p className="type-small font-medium text-error">{error.message}</p>
      {error.isOffline && (
        <p className="type-small mt-1.5 text-secondary">
          Arranca el backend desde la raíz del repo con{" "}
          <code className="rounded-sm bg-neutral px-1 py-0.5 font-mono text-code break-all text-primary">
            docker compose up --build
          </code>
          .
        </p>
      )}
      {children}
    </div>
  );
}
