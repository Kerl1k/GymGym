import { useEffect } from "react";

import { runInBackground } from "@/shared/lib/background";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

export function useTrainingHistoryFetchId(historyId: string) {
  useEffect(() => {
    runInBackground(trainingHistoryStore.fetchById(historyId));
  }, [historyId]);

  const { data, isPending } = useMobxSelector(() => ({
    data: trainingHistoryStore.getById(historyId),
    isPending: trainingHistoryStore.isByIdLoading(historyId),
  }));

  if (data === undefined) {
    return {
      data: null,
      isLoading: isPending,
    };
  }

  return {
    data,
    isLoading: isPending,
  };
}
