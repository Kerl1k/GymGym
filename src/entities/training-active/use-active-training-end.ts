import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { activeTrainingStore } from "./active-training.store";

export function useEndActiveTraining() {
  const end = useCallback(async (): Promise<string> => {
    return activeTrainingStore.end();
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: activeTrainingStore.isEnding,
  }));

  return {
    end,
    isPending,
  };
}
