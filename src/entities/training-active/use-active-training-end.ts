import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import type { ApiSchemas } from "@/shared/schema";

import { activeTrainingStore } from "./active-training.store";

export function useEndActiveTraining() {
  const end = useCallback(
    async (
      finalData?: ApiSchemas["ActiveTraining"] | null,
    ): Promise<string> => activeTrainingStore.end(finalData),
    [],
  );

  const { isPending } = useMobxSelector(() => ({
    isPending: activeTrainingStore.isEnding,
  }));

  return {
    end,
    isPending,
  };
}
