import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-lg border border-outline bg-surface p-4 sm:p-5", className)}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("type-label text-secondary", className)} {...props} />;
}
