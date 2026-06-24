import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ApiSchemas } from "@/shared/schema";

import { trainingHistoryStore } from "./training-history.store";

export function useChangeTrainingHistory() {
  const change = useCallback(async (data: ApiSchemas["TrainingHistoryUpdate"]) => {
    await trainingHistoryStore.change(data);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: trainingHistoryStore.changePending,
  }));

  return {
    isPending,
    change,
  };
}
