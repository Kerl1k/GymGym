import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ApiSchemas } from "@/shared/schema";

import { trainingStore } from "./training.store";

export function useChangeTraining() {
  const change = useCallback(async (data: ApiSchemas["TrainingUpdateBody"]) => {
    await trainingStore.change(data);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: trainingStore.changePending,
  }));

  return {
    isPending,
    change,
  };
}
