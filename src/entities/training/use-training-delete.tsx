import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingStore } from "./training.store";

export function useDeleteTraining() {
  const deleteTraining = useCallback(async (trainingId: string) => {
    await trainingStore.remove(trainingId);
  }, []);

  const { deletingId } = useMobxSelector(() => ({
    deletingId: trainingStore.deletingId,
  }));

  return {
    deleteTraining,
    getIsPending: (trainingId: string) => deletingId === trainingId,
  };
}
