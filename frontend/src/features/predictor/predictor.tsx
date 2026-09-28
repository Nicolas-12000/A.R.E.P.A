"use client";

import Link from "next/link";
import { useCallback, useMemo, useReducer, useRef, type ReactNode } from "react";

import { ApiStatus } from "@/components/api-status";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Wordmark } from "@/components/ui/wordmark";
import { draftFromPayload, EXERCISES } from "@/features/exercises/config";
import { checkForm } from "@/features/exercises/validation";
import { useAutoReconnect } from "@/hooks/use-auto-reconnect";
import { isOfflineResource, useResource } from "@/hooks/use-resource";
import { api, clearMetadataCache, toApiError } from "@/lib/api/client";
import type { ModelName, PredictionLogItem } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";
import { ExercisePicker } from "./exercise-picker";
import { HISTORY_LIMIT, HistorySheet } from "./history-sheet";
import { InterpretationCard } from "./interpretation-card";
import { PredictionForm } from "./prediction-form";
import { RelationsCard } from "./relations-card";
import { ResultCard } from "./result-card";
import { initPredictor, predictorReducer } from "./state";

const loadCatalog = (_key: string, signal: AbortSignal) => api.models(signal);
const loadMetadata = (name: ModelName) => api.metadata(name);
const loadHistory = (_key: string, signal: AbortSignal) => api.history(HISTORY_LIMIT, signal);

const DESKTOP_QUERY = "(width >= 64rem)";

export function Predictor({ initialExercise, intro }: { initialExercise: ModelName; intro: ReactNode }) {
  const [state, dispatch] = useReducer(predictorReducer, initialExercise, initPredictor);
  const { exercise } = state;
  const current = state.byExercise[exercise];
  const spec = EXERCISES[exercise];

  const [catalog, reloadCatalog] = useResource("catalog", loadCatalog);
  const [metadata, reloadMetadata] = useResource(exercise, loadMetadata);
  const [history, reloadHistory] = useResource("history", loadHistory);

  const apiOffline =
    isOfflineResource(catalog) || isOfflineResource(metadata) || isOfflineResource(history);

  const reloadApiData = useCallback(() => {
    clearMetadataCache();
    reloadCatalog();
    reloadMetadata();
    reloadHistory();
  }, [reloadCatalog, reloadMetadata, reloadHistory]);

  useAutoReconnect(apiOffline, reloadApiData);

  const form = useMemo(() => checkForm(spec, current.draft), [spec, current.draft]);
  const resultRef = useRef<HTMLElement>(null);

  function select(next: ModelName) {
    dispatch({ type: "select", exercise: next });
    const url = new URL(window.location.href);
    url.searchParams.set("ejercicio", EXERCISES[next].slug);
    window.history.replaceState(null, "", url);
  }

  function restoreFromHistory(row: PredictionLogItem) {
    const rowSpec = EXERCISES[row.model_name];
    const catalogItem = "data" in catalog ? catalog.data?.find((item) => item.model_name === row.model_name) : undefined;
    if (!rowSpec || !catalogItem) return;

    const draft = draftFromPayload(rowSpec, row.input_payload);
    const restored = checkForm(rowSpec, draft);
    if (!restored.values) return;
    const values = restored.values;

    dispatch({
      type: "restore",
      exercise: row.model_name,
      draft,
      prediction: {
        prediction: row.prediction,
        model_name: row.model_name,
        target: catalogItem.target,
        model_r2: catalogItem.r2_score,
        model_mse: catalogItem.mse,
        model_rmse: catalogItem.rmse,
        stored_in_history: true,
      },
      features: rowSpec.toFeatures(values),
      extrapolates: restored.extrapolates,
    });

    const url = new URL(window.location.href);
    url.searchParams.set("ejercicio", rowSpec.slug);
    window.history.replaceState(null, "", url);

    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      });
    }
  }

  async function submit() {
    if (!form.values) {
      dispatch({ type: "invalid" });
      return;
    }

    const requestId = current.requestId + 1;
    const values = form.values;
    const { extrapolates } = form;
    dispatch({ type: "submitted" });

    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    }

    try {
      const prediction = await api.predict(exercise, values);
      dispatch({
        type: "succeeded",
        exercise,
        requestId,
        prediction,
        features: spec.toFeatures(values),
        extrapolates,
      });
      if (prediction.stored_in_history) reloadHistory();
    } catch (error) {
      dispatch({ type: "failed", exercise, requestId, error: toApiError(error) });
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-outline bg-neutral/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-[max(1rem,env(safe-area-inset-left))] sm:px-6">
          <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-sm">
            <Logo className="size-11 shrink-0 sm:size-12" />
            <Wordmark compact />
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <HistorySheet history={history} onOpen={reloadHistory} onSelect={restoreFromHistory} />
            <ApiStatus />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:space-y-6 lg:pt-12 lg:pb-16">
        <section className="relative isolate grid gap-6 pb-4 lg:grid-cols-12 lg:items-center lg:pb-7">
          <HeroDecor />
          <div className="lg:col-span-8">{intro}</div>
        </section>

        <ExercisePicker value={exercise} onChange={select} />

        <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="flex w-full min-h-0 flex-col lg:w-5/12 lg:self-stretch">
            <Card className="flex min-h-0 flex-col lg:flex-1">
            <div className="shrink-0 lg:text-center">
              <p className="type-label text-tertiary">Ejercicio {spec.number}</p>
              <h2 className="type-title mt-1.5 lg:mt-2">{spec.title}</h2>
              <p className="type-small mx-auto mt-1.5 max-w-md leading-relaxed text-pretty text-secondary lg:mt-2 lg:text-base">
                {spec.question}
              </p>
            </div>
            <dl className="mt-4 grid shrink-0 grid-cols-3 divide-x divide-outline rounded-md bg-neutral/70 py-3 lg:mt-5 lg:py-4">
              <Stat label="Observaciones" value={formatNumber(spec.rows, 0)} />
              <Stat label="Retiradas" value="0" />
              <Stat label="Entradas" value={String(spec.fields.length)} />
            </dl>
            <PredictionForm
              className="mt-5 lg:mt-6 lg:min-h-0 lg:flex-1"
              spec={spec}
              draft={current.draft}
              checks={form.checks}
              showErrors={current.showErrors}
              pending={current.result.status === "loading"}
              onChange={(field, value) => dispatch({ type: "change", field, value })}
              onSubmit={submit}
              onReset={() => dispatch({ type: "reset" })}
            />
            </Card>
          </div>

          <div className="grid min-h-0 min-w-0 flex-1 gap-4 self-stretch md:grid-cols-2 md:items-stretch lg:flex lg:flex-col lg:gap-6">
            <ResultCard
              ref={resultRef}
              spec={spec}
              result={current.result}
              catalog={catalog}
              className="h-full md:h-auto lg:shrink-0"
            />
            <InterpretationCard
              spec={spec}
              metadata={metadata}
              onRetry={reloadMetadata}
              features={current.result.status === "success" ? current.result.features : undefined}
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        <RelationsCard spec={spec} />
      </main>
    </>
  );
}

/** Soft shapes behind the hero: a maíz disc, an outline ring and a dot grid, echoing the mascot and the plot. */
function HeroDecor() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 220"
      className="pointer-events-none absolute top-1/2 right-0 -z-10 hidden h-72 w-auto -translate-y-1/2 text-tertiary lg:block"
    >
      <circle cx="300" cy="96" r="84" fill="var(--color-mark)" opacity="0.14" />
      <circle cx="238" cy="130" r="70" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.2" />
      <g fill="currentColor" opacity="0.28">
        {Array.from({ length: 24 }, (_, dot) => (
          <circle key={dot} cx={48 + (dot % 6) * 14} cy={40 + Math.floor(dot / 6) * 14} r="1.6" />
        ))}
      </g>
      <path d="M372 170v14m-7-7h14" stroke="var(--color-mark)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse px-3 text-center">
      <dt className="mt-0.5 text-xs leading-snug text-secondary">{label}</dt>
      <dd className="font-mono text-xl font-medium tabular-nums lg:text-2xl">{value}</dd>
    </div>
  );
}
