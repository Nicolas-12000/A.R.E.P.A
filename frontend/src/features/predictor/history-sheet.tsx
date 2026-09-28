"use client";

import { useRef } from "react";

import { CardLabel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EXERCISES, fieldLabel } from "@/features/exercises/config";
import type { ResourceState } from "@/hooks/use-resource";
import type { PredictionLogItem } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatInput, formatNumber, formatRelativeTime } from "@/lib/format";

export const HISTORY_LIMIT = 12;

/** Header button that opens the saved predictions in a side sheet (bottom sheet on phones). */
export function HistorySheet({
  history,
  onOpen,
  onSelect,
}: {
  history: ResourceState<PredictionLogItem[]>;
  onOpen: () => void;
  onSelect: (row: PredictionLogItem) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rows = "data" in history ? history.data : undefined;
  function open() {
    onOpen();
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-10 min-w-10 touch-manipulation items-center justify-center gap-2 rounded-full border border-outline bg-surface px-3 text-sm font-medium text-secondary transition-colors hover:border-secondary/60 hover:text-primary sm:px-4"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 4.75V8l2.25 1.5" strokeLinecap="round" />
        </svg>
        <span className="sr-only sm:not-sr-only">Historial</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Historial de predicciones"
        onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
        className="mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-lg border border-outline bg-surface p-0 text-primary backdrop:bg-primary/60 backdrop:backdrop-blur-sm sm:mt-0 sm:mr-0 sm:mb-0 sm:ml-auto sm:h-dvh sm:max-h-none sm:w-104 sm:rounded-none sm:rounded-l-lg"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-outline px-5 py-4">
            <div>
              <CardLabel>Historial reciente</CardLabel>
              <p className="type-small mt-1 text-secondary">
                Predicciones guardadas en la base de datos. Pulsa una para verla de nuevo.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar historial"
              onClick={() => dialogRef.current?.close()}
              className="grid size-9 place-items-center rounded-md border border-outline text-secondary transition-colors hover:border-secondary hover:text-primary"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {rows ? (
              rows.length === 0 ? (
                <p className="type-small py-6 text-center text-secondary">
                  Aún no hay predicciones. Pulsa Calcular y aparecerán aquí.
                </p>
              ) : (
                <ul className="space-y-3">
                  {rows.map((row) => (
                    <HistoryRow
                      key={row.id}
                      row={row}
                      onSelect={() => {
                        onSelect(row);
                        dialogRef.current?.close();
                      }}
                    />
                  ))}
                </ul>
              )
            ) : history.status === "error" ? (
              <p className="type-small py-6 text-secondary">
                {history.error.status === 503
                  ? "El historial necesita una base de datos. Con docker compose ya viene incluida."
                  : history.error.message}
              </p>
            ) : (
              <HistorySkeleton />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

function HistoryRow({ row, onSelect }: { row: PredictionLogItem; onSelect: () => void }) {
  const spec = EXERCISES[row.model_name];
  const inputs = Object.entries(row.input_payload).map(([name, value]) => [fieldLabel(spec, name), formatInput(value)]);
  const summary = `${spec.shortLabel}: ${spec.target.prefix ?? ""}${formatNumber(row.prediction, spec.target.decimals)}`;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver predicción de ${summary}`}
        className={cn(
          "w-full rounded-md border border-outline bg-neutral/50 p-4 text-left transition-colors",
          "hover:border-tertiary/50 hover:bg-tertiary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary",
        )}
      >
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-label rounded-sm bg-neutral px-1.5 py-0.5 text-secondary">
          {spec.number} · {spec.shortLabel}
        </span>
        <span className="text-xs text-secondary">{formatRelativeTime(row.created_at)}</span>
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-xl font-medium tabular-nums">
          {spec.target.prefix}
          {formatNumber(row.prediction, spec.target.decimals)}
        </span>
        {spec.target.unit && <span className="type-label text-secondary">{spec.target.unit}</span>}
      </p>
      <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-secondary">
        {inputs.map(([label, value]) => (
          <div key={label} className="flex gap-1">
            <dt>{label}</dt>
            <dd className="font-mono text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      </button>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-5 py-3">
      <span className="sr-only">Cargando historial…</span>
      {[0, 1, 2].map((row) => (
        <div key={row} className="space-y-2 rounded-md border border-outline bg-neutral/50 p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
