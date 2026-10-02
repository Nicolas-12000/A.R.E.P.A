export type ArepaRuntimeMode = "auto" | "api" | "local";

export type ResolvedRuntime = "api" | "local";

const ENV_MODE = (process.env.NEXT_PUBLIC_AREPA_MODE ?? "auto").toLowerCase();

export function configuredMode(): ArepaRuntimeMode {
  if (ENV_MODE === "api") return "api";
  if (ENV_MODE === "local" || ENV_MODE === "front-only" || ENV_MODE === "frontend") return "local";
  return "auto";
}

export function modeLabel(resolved: ResolvedRuntime): string {
  return resolved === "local" ? "Modo local" : "API en línea";
}
