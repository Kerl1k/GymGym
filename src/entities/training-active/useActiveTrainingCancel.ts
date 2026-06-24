import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { activeTrainingStore } from "./active-training.store";

export function useCancelActiveTraining() {
  const cancel = useCallback(async () => {
    await activeTrainingStore.cancel();
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: activeTrainingStore.isCancelling,
  }));

  return {
    cancel,
    isPending,
  };
}
