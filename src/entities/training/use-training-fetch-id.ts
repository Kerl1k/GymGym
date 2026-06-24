import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingStore } from "./training.store";

export function useTrainingFetchId(trainingId: string) {
  useEffect(() => {
    void trainingStore.fetchById(trainingId);
  }, [trainingId]);

  const { data, isPending } = useMobxSelector(() => ({
    data: trainingStore.getById(trainingId),
    isPending: trainingStore.isByIdLoading(trainingId),
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
