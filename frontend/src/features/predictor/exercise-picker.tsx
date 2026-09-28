"use client";

import { useId } from "react";

import { EXERCISE_LIST } from "@/features/exercises/config";
import type { ModelName } from "@/lib/api/types";

/** Native radios: arrow keys and screen readers work without extra code. */
export function ExercisePicker({
  value,
  onChange,
}: {
  value: ModelName;
  onChange: (exercise: ModelName) => void;
}) {
  const name = useId();

  return (
    <fieldset className="mx-auto flex w-full max-w-md rounded-full border border-outline bg-surface p-1">
      <legend className="sr-only">Ejercicio</legend>
      {EXERCISE_LIST.map((exercise) => (
        <label
          key={exercise.id}
          className="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full px-2 text-center text-sm leading-none font-medium text-secondary transition-colors select-none hover:text-primary has-checked:bg-tertiary has-checked:text-on-tertiary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tertiary"
        >
          <input
            type="radio"
            name={name}
            value={exercise.id}
            checked={value === exercise.id}
            onChange={() => onChange(exercise.id)}
            className="sr-only"
          />
          <span className="truncate">{exercise.shortLabel}</span>
        </label>
      ))}
    </fieldset>
  );
}
