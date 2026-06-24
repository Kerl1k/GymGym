import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { activeTrainingStore } from "./active-training.store";

export function useStartActiveTraining() {
  const start = useCallback(async (id: string) => {
    await activeTrainingStore.start(id);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: activeTrainingStore.isStarting,
  }));

  return {
    start,
    isPending,
  };
}
