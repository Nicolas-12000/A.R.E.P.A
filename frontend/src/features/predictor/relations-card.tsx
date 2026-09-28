"use client";

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { CardLabel } from "@/components/ui/card";
import type { ExerciseSpec, FigureSpec } from "@/features/exercises/config";
import { cn } from "@/lib/cn";

/** Bump when the PNGs are regenerated, so browsers holding the old long-lived cache refetch them. */
const FIGURE_VERSION = "2";

const figureSrc = (figure: FigureSpec) => `/figures/${figure.file}?v=${FIGURE_VERSION}`;

/** The scatter and correlation plots the assignment asks for: one large figure at a time, with its reading. */
export function RelationsCard({ spec }: { spec: ExerciseSpec }) {
  const [selected, setSelected] = useState({ exercise: spec.id, index: 0 });
  const index = selected.exercise === spec.id ? selected.index : 0;
  const figure = spec.figures[index];

  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function select(next: number) {
    const wrapped = (next + spec.figures.length) % spec.figures.length;
    setSelected({ exercise: spec.id, index: wrapped });
    return wrapped;
  }

  function handleKeyDown(event: KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    tabRefs.current[select(index + step)]?.focus();
  }

  return (
    <section className="rounded-lg border border-outline bg-surface">
      <div className="grid min-w-0 lg:grid-cols-12 lg:items-stretch">
        <div className="min-w-0 border-b border-outline p-4 sm:p-5 lg:col-span-4 lg:flex lg:min-h-0 lg:flex-col lg:justify-center lg:border-r lg:border-b-0 lg:p-6">
          <div className="w-full lg:mx-auto lg:max-w-sm lg:text-center">
            <CardLabel>Relación con la variable dependiente</CardLabel>
            <p className="type-small mt-2 leading-relaxed text-pretty text-secondary">
              Cada punto es una observación; la recta es el ajuste simple de esa variable.
            </p>

            <div
              role="tablist"
              aria-label="Figura"
              aria-orientation="vertical"
              className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:mt-5 lg:flex lg:flex-col"
            >
              {spec.figures.map((item, itemIndex) => {
                const active = itemIndex === index;
                return (
                  <button
                    key={item.file}
                    ref={(node) => {
                      tabRefs.current[itemIndex] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${itemIndex}`}
                    aria-selected={active}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => select(itemIndex)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "flex min-w-0 touch-manipulation items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors sm:col-span-1",
                      "lg:w-full lg:justify-center lg:text-center",
                      active
                        ? "border-tertiary bg-tertiary/8 text-tertiary"
                        : "border-outline text-secondary hover:border-secondary/60 hover:text-primary",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "type-label grid size-6 shrink-0 place-items-center rounded-full",
                        active ? "bg-tertiary text-on-tertiary" : "bg-neutral",
                      )}
                    >
                      {itemIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1 lg:flex-none">
                      <span className="block text-sm leading-snug font-semibold">{item.short}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-secondary sm:hidden lg:block">
                        {item.caption}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p
              className="type-small mt-4 w-full rounded-md bg-mark/12 px-3 py-2.5 leading-relaxed text-pretty text-primary lg:mt-5"
              aria-live="polite"
            >
              {figure.note}
            </p>

            <div className="type-small mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-secondary lg:mt-5 lg:justify-center">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2 rounded-full bg-tertiary" />
                Observaciones
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-0.5 w-4 rounded-full bg-mark" />
                Ajuste simple
              </span>
            </div>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${index}`}
          className="min-w-0 bg-neutral/40 p-3 sm:p-5 lg:col-span-8 lg:flex lg:items-center lg:justify-center lg:p-6"
        >
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="group relative mx-auto block w-full max-w-full cursor-zoom-in"
          >
            <div
              className="relative overflow-hidden rounded-md border border-outline bg-surface"
              style={{ aspectRatio: figure.ratio }}
            >
              <Image
                key={figure.file}
                src={figureSrc(figure)}
                alt={figure.caption}
                fill
                unoptimized
                sizes="(min-width: 64rem) 60vw, 100vw"
                className="object-contain p-1 sm:p-2"
              />
            </div>
            <span
              className="type-label pointer-events-none absolute right-1 bottom-1 rounded-sm bg-primary/85 px-2 py-1 text-on-primary shadow-sm sm:right-2 sm:bottom-2"
            >
              Ampliar
            </span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-label={figure.caption}
        onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
        className="m-auto max-h-[92dvh] w-[min(72rem,94vw)] max-w-[calc(100vw-1rem)] rounded-lg border border-outline bg-surface p-0 backdrop:bg-primary/75 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline px-4 py-3">
          <p className="min-w-0 flex-1 text-sm leading-snug font-semibold text-pretty">{figure.caption}</p>
          <div className="flex shrink-0 gap-2">
            <DialogButton label="Figura anterior" onClick={() => select(index - 1)}>
              ←
            </DialogButton>
            <DialogButton label="Figura siguiente" onClick={() => select(index + 1)}>
              →
            </DialogButton>
            <DialogButton label="Cerrar" onClick={() => dialogRef.current?.close()}>
              ✕
            </DialogButton>
          </div>
        </div>
        <div className="relative mx-auto max-h-[calc(92dvh-7rem)] w-full min-w-0" style={{ aspectRatio: figure.ratio }}>
          <Image
            src={figureSrc(figure)}
            alt={figure.caption}
            fill
            unoptimized
            sizes="94vw"
            className="object-contain p-2"
          />
        </div>
        <p className="type-small border-t border-outline px-4 py-3 leading-relaxed text-pretty text-secondary">
          {figure.note}
        </p>
      </dialog>
    </section>
  );
}

function DialogButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 touch-manipulation place-items-center rounded-md border border-outline text-secondary transition-colors hover:border-secondary hover:text-primary"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
