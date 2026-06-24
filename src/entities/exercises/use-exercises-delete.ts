import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { exercisesStore } from "./exercises.store";

export function useExercisesDelete() {
  const deleteExercises = useCallback(async (exerciseId: string) => {
    await exercisesStore.remove(exerciseId);
  }, []);

  const { deletingId } = useMobxSelector(() => ({
    deletingId: exercisesStore.deletingId,
  }));

  return {
    deleteExercises,
    getIsPending: (exerciseId: string) => deletingId === exerciseId,
  };
}
