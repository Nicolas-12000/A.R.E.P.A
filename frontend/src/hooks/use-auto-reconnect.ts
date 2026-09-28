"use client";

import { useEffect, useRef } from "react";

import { api } from "@/lib/api/client";

const BASE_INTERVAL_MS = 3000;
const MAX_INTERVAL_MS = 15000;

/**
 * Polls `/health` while `active`. On success, runs `onReconnect` so failed fetches can retry
 * without a manual "Reintentar" click. Backs off when the API is still down.
 */
export function useAutoReconnect(active: boolean, onReconnect: () => void) {
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let interval = BASE_INTERVAL_MS;

    const schedule = (delay: number) => {
      timeoutId = setTimeout(() => void tick(), delay);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        await api.health();
        if (cancelled) return;
        interval = BASE_INTERVAL_MS;
        onReconnectRef.current();
      } catch {
        if (cancelled) return;
        interval = Math.min(Math.round(interval * 1.5), MAX_INTERVAL_MS);
      }
      schedule(interval);
    };

    schedule(0);

    const onVisible = () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      interval = BASE_INTERVAL_MS;
      schedule(0);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active]);
}
