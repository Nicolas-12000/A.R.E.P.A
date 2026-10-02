"use client";

import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAutoReconnect } from "@/hooks/use-auto-reconnect";
import { isOfflineResource, useResource } from "@/hooks/use-resource";
import { arepaHealth, resetRuntimeProbe } from "@/lib/runtime/arepa-data";
import { cn } from "@/lib/cn";

const loadHealth = (_key: string, signal: AbortSignal) => arepaHealth(signal);

const TONES = {
  ok: { dot: "bg-positive", label: "En línea", detail: "API en línea" },
  local: { dot: "bg-tertiary", label: "Modo local", detail: "Predicción en el navegador (sin API)" },
  degraded: { dot: "bg-mark", label: "Parcial", detail: "API sin base de datos o sin algún modelo" },
  offline: { dot: "bg-error", label: "Sin conexión", detail: "No hay conexión con la API" },
} as const;

/** Re-checks when the tab becomes visible again, so starting the backend is picked up without reloading. */
export function ApiStatus() {
  const [health, reload] = useResource("health", loadHealth);

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  useAutoReconnect(isOfflineResource(health), () => {
    resetRuntimeProbe();
    reload();
  });

  if (health.status === "loading" && !health.data) return <Skeleton className="h-10 w-10 rounded-full sm:w-28" />;

  const data = health.status === "error" || !("data" in health) ? undefined : health.data;
  const tone =
    data?.runtime === "local"
      ? TONES.local
      : TONES[data?.status === "degraded" ? "degraded" : data?.status === "ok" ? "ok" : "offline"];

  return (
    <button
      type="button"
      onClick={() => {
        resetRuntimeProbe();
        reload();
      }}
      title={`${tone.detail}. Pulsa para comprobar de nuevo.`}
      className="inline-flex h-10 min-w-10 touch-manipulation items-center justify-center gap-2 rounded-full border border-outline bg-surface px-3 text-sm font-medium text-secondary transition-colors hover:text-primary sm:px-4"
    >
      <span aria-hidden className={cn("size-2.5 rounded-full", tone.dot)} />
      <span className="sr-only sm:not-sr-only">
        <span className="sr-only">API: </span>
        {tone.label}
      </span>
    </button>
  );
}
