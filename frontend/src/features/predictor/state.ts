import { defaultDraft, EXERCISES } from "@/features/exercises/config";
import type { ApiError } from "@/lib/api/client";
import type { ModelName, Prediction } from "@/lib/api/types";

export type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      prediction: Prediction;
      features: Record<string, number>;
      extrapolates: boolean;
    }
  | { status: "error"; error: ApiError };

interface ExerciseState {
  draft: Record<string, string>;
  /** Errors stay hidden until the first submit attempt. */
  showErrors: boolean;
  result: ResultState;
  /** Incremented per submit so late responses from older requests are ignored. */
  requestId: number;
}

export interface PredictorState {
  exercise: ModelName;
  byExercise: Record<ModelName, ExerciseState>;
}

export type PredictorAction =
  | { type: "select"; exercise: ModelName }
  | { type: "change"; field: string; value: string }
  | { type: "reset" }
  | { type: "invalid" }
  | { type: "submitted" }
  | {
      type: "succeeded";
      exercise: ModelName;
      requestId: number;
      prediction: Prediction;
      features: Record<string, number>;
      extrapolates: boolean;
    }
  | { type: "failed"; exercise: ModelName; requestId: number; error: ApiError }
  | {
      type: "restore";
      exercise: ModelName;
      draft: Record<string, string>;
      prediction: Prediction;
      features: Record<string, number>;
      extrapolates: boolean;
    };

function freshExercise(exercise: ModelName): ExerciseState {
  return {
    draft: defaultDraft(EXERCISES[exercise]),
    showErrors: false,
    result: { status: "idle" },
    requestId: 0,
  };
}

export function initPredictor(exercise: ModelName): PredictorState {
  return {
    exercise,
    byExercise: {
      dollar: freshExercise("dollar"),
      glucose: freshExercise("glucose"),
      energy: freshExercise("energy"),
    },
  };
}

function update(
  state: PredictorState,
  exercise: ModelName,
  patch: (current: ExerciseState) => Partial<ExerciseState>,
): PredictorState {
  const current = state.byExercise[exercise];
  return {
    ...state,
    byExercise: { ...state.byExercise, [exercise]: { ...current, ...patch(current) } },
  };
}

export function predictorReducer(state: PredictorState, action: PredictorAction): PredictorState {
  switch (action.type) {
    case "select":
      return { ...state, exercise: action.exercise };
    case "change":
      return update(state, state.exercise, (current) => ({
        draft: { ...current.draft, [action.field]: action.value },
      }));
    case "reset":
      return update(state, state.exercise, (current) => ({
        ...freshExercise(state.exercise),
        requestId: current.requestId + 1,
      }));
    case "invalid":
      return update(state, state.exercise, () => ({ showErrors: true }));
    case "submitted":
      return update(state, state.exercise, (current) => ({
        showErrors: true,
        result: { status: "loading" },
        requestId: current.requestId + 1,
      }));
    case "restore": {
      const current = state.byExercise[action.exercise];
      return {
        ...state,
        exercise: action.exercise,
        byExercise: {
          ...state.byExercise,
          [action.exercise]: {
            ...current,
            draft: action.draft,
            showErrors: false,
            requestId: current.requestId + 1,
            result: {
              status: "success",
              prediction: action.prediction,
              features: action.features,
              extrapolates: action.extrapolates,
            },
          },
        },
      };
    }
    case "succeeded":
    case "failed": {
      if (state.byExercise[action.exercise].requestId !== action.requestId) return state;
      const result: ResultState =
        action.type === "failed"
          ? { status: "error", error: action.error }
          : {
              status: "success",
              prediction: action.prediction,
              features: action.features,
              extrapolates: action.extrapolates,
            };
      return update(state, action.exercise, () => ({ result }));
    }
  }
}
