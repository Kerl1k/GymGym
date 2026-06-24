import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

export function useActiveTrainingDelete() {
  const deleteExercises = useCallback(async (exerciseId: string) => {
    await trainingHistoryStore.remove(exerciseId);
  }, []);

  const { deletingId } = useMobxSelector(() => ({
    deletingId: trainingHistoryStore.deletingId,
  }));

  return {
    deleteExercises,
    isPending: deletingId !== null,
    getIsPending: (exerciseId: string) => deletingId === exerciseId,
  };
}
