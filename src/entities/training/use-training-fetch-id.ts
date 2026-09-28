import { useEffect } from "react";

import { runInBackground } from "@/shared/lib/background";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingStore } from "./training.store";

export function useTrainingFetchId(trainingId: string) {
  useEffect(() => {
    runInBackground(trainingStore.fetchById(trainingId));
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
