import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ApiSchemas } from "@/shared/schema";

import { exercisesStore } from "./exercises.store";

export function useCreateExercises() {
  const create = useCallback(async (data: ApiSchemas["ExerciseTypeCreateBody"]) => {
    await exercisesStore.create(data);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: exercisesStore.createPending,
  }));

  return {
    isPending,
    create,
  };
}
