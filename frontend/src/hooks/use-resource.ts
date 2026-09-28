"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, toApiError } from "@/lib/api/client";

export type ResourceState<T> =
  | { status: "idle" }
  | { status: "loading"; data?: T }
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError; data?: T };

interface Settled<T> {
  key: string;
  nonce: number;
  data?: T;
  error?: ApiError;
}

/**
 * Loads `load(key)` whenever `key` changes and aborts the previous request.
 * `load` must be stable (define it at module level). A `null` key means "don't load".
 * On reload the previous data stays available, so the UI can refresh without flashing skeletons.
 */
export function useResource<K extends string, T>(
  key: K | null,
  load: (key: K, signal: AbortSignal) => Promise<T>,
): [ResourceState<T>, () => void] {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();

    load(key, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, nonce, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setSettled((previous) => ({
          key,
          nonce,
          data: previous?.key === key ? previous.data : undefined,
          error: toApiError(error),
        }));
      },
    );

    return () => controller.abort();
  }, [key, nonce, load]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  if (key === null) return [{ status: "idle" }, reload];

  const sameKey = settled?.key === key;
  if (!sameKey || settled.nonce !== nonce) {
    return [{ status: "loading", data: sameKey ? settled.data : undefined }, reload];
  }
  if (settled.error) return [{ status: "error", error: settled.error, data: settled.data }, reload];
  return [{ status: "success", data: settled.data as T }, reload];
}
