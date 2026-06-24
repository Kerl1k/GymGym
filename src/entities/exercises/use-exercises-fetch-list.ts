import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { exercisesStore } from "./exercises.store";

type UseExercisesListParams = {
  limit?: number;
};

export function useExercisesFetchList({ limit = 20 }: UseExercisesListParams) {
  useEffect(() => {
    void exercisesStore.fetchList(limit);
  }, [limit]);

  const { exercises, isPending } = useMobxSelector(() => {
    const data = exercisesStore.getList(limit);
    return {
      exercises: data?.content ?? [],
      isPending: exercisesStore.isListLoading(limit),
    };
  });

  return {
    exercises,
    isPending,
  };
}
