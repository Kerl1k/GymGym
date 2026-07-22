import { useCallback } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import type { ApiSchemas } from "@/shared/schema";

import { activeTrainingStore } from "./active-training.store";

export function useEndActiveTraining() {
  const end = useCallback(
    async (
      finalData?: ApiSchemas["ActiveTraining"] | null,
    ): Promise<string> => {
      console.log("[active-training/end] hook:end called", {
        hasFinalData: Boolean(finalData),
        trainingName: finalData?.name,
        exercisesCount: finalData?.exercises?.length,
        dateStart: finalData?.dateStart,
      });
      try {
        const historyId = await activeTrainingStore.end(finalData);
        console.log("[active-training/end] hook:end success", { historyId });
        return historyId;
      } catch (error) {
        console.log("[active-training/end] hook:end failed", error);
        throw error;
      }
    },
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
