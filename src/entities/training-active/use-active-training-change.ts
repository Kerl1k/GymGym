import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ApiSchemas } from "@/shared/schema";

import { activeTrainingStore } from "./active-training.store";

export function useUpdateActiveTraining() {
  const change = useCallback(async (data: ApiSchemas["ActiveTraining"]) => {
    return activeTrainingStore.change(data);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: activeTrainingStore.isUpdating,
  }));

  return {
    change,
    isPending,
  };
}
