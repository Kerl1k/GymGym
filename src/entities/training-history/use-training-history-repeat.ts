import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

export function useTrainingHistoryRepeat() {
  const repeatTraining = useCallback(async (
    trainingHistoryId: string,
    dateStart: string,
  ) => {
    try {
      await trainingHistoryStore.repeatTraining(trainingHistoryId, dateStart);
    } catch (error) {
      console.error("Failed to repeat training:", error);
      throw error;
    }
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: trainingHistoryStore.repeatPending,
  }));

  return {
    repeatTraining,
    isPending,
  };
}
