import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ApiSchemas } from "@/shared/schema";

import { exercisesStore } from "./exercises.store";

export function useChangeExercises() {
  const change = useCallback(async (data: ApiSchemas["ExerciseTypeUpdateBody"]) => {
    await exercisesStore.change(data);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: exercisesStore.changePending,
  }));

  return {
    isPending,
    change,
  };
}
