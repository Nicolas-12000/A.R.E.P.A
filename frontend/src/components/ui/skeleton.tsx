import { cn } from "@/lib/cn";

/** Placeholder with the geometry of the content it replaces; size it with utilities. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}
