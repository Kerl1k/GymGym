import { useEffect } from "react";

import { runInBackground } from "@/shared/lib/background";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { exercisesStore } from "./exercises.store";

type UseExercisesListParams = {
  limit?: number;
};

export function useExercisesFetchList({ limit = 20 }: UseExercisesListParams) {
  const { exercises, isPending, hasData } = useMobxSelector(() => {
    const data = exercisesStore.getList(limit);
    return {
      exercises: data?.content ?? [],
      isPending: exercisesStore.isListLoading(limit),
      hasData: data !== undefined,
    };
  });

  useEffect(() => {
    if (!hasData) {
      runInBackground(exercisesStore.fetchList(limit));
    }
  }, [hasData, limit]);

  return {
    exercises,
    isPending,
  };
}
