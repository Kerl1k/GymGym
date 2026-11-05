import type { ApiSchemas } from "@/shared/schema";

/**
 * Exercise catalog rows are stored with 60 seconds when rest was never chosen.
 * The workout timer should stay off until a person sets another value.
 */
export const BACKEND_DEFAULT_REST_SEC = 60;

export function normalizeRestTime(restTime: number | null | undefined): number {
  if (restTime == null || restTime <= 0 || restTime === BACKEND_DEFAULT_REST_SEC) {
    return 0;
  }
  return restTime;
}

export function normalizeActiveTrainingRest(
  training: ApiSchemas["ActiveTraining"],
): ApiSchemas["ActiveTraining"] {
  return {
    ...training,
    exercises: training.exercises.map((exercise) => ({
      ...exercise,
      restTime: normalizeRestTime(exercise.restTime),
    })),
  };
}
