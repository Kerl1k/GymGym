import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ApiSchemas } from "@/shared/schema";

import { trainingStore } from "./training.store";

export function useCreateTraining() {
  const create = useCallback(async (data: ApiSchemas["TrainingCreateBody"]) => {
    await trainingStore.create(data);
  }, []);

  const { isPending } = useMobxSelector(() => ({
    isPending: trainingStore.createPending,
  }));

  return {
    isPending,
    create,
  };
}
