import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import type { ApiSchemas } from "@/shared/schema";

import { trainingHistoryStore } from "./training-history.store";

type UseLatestTrainingHistoryByNameProps = {
  trainingName?: string;
};

type HistoryQuery = {
  limit: number;
  orderBy?: string;
  filter?: string;
  where?: string;
};

export function historyExerciseKey(name: string): string {
  return name.trim().toLocaleLowerCase("ru-RU");
}

function byNewest(
  a: ApiSchemas["TrainingHistory"],
  b: ApiSchemas["TrainingHistory"],
): number {
  return new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime();
}

export function useLatestTrainingHistoryByName({
  trainingName,
}: UseLatestTrainingHistoryByNameProps) {
  const normalizedName = trainingName?.trim() ?? "";
  const hasName = normalizedName.length > 0;
  const nameKey = historyExerciseKey(normalizedName);

  // History list accepts `filter` (same shape as trainings). Older clients sent
  // `where`, which the API ignores, so limit=1 was a random recent workout.
  const namedQuery = useMemo<HistoryQuery>(
    () => ({
      limit: 10,
      orderBy: JSON.stringify({ dateStart: "desc" }),
      filter: JSON.stringify({
        name: { equals: normalizedName },
      }),
      where: JSON.stringify({
        name: { equals: normalizedName },
      }),
    }),
    [normalizedName],
  );

  const recentQuery = useMemo<HistoryQuery>(
    () => ({
      limit: 40,
      orderBy: JSON.stringify({ dateStart: "desc" }),
    }),
    [],
  );

  useEffect(() => {
    if (!hasName) return;
    void trainingHistoryStore.fetchList(namedQuery);
    void trainingHistoryStore.fetchList(recentQuery);
  }, [hasName, namedQuery, recentQuery]);

  const { latestHistory, previousSetsByExerciseName, isPending } =
    useMobxSelector(() => {
      const empty = {
        latestHistory: undefined as ApiSchemas["TrainingHistory"] | undefined,
        previousSetsByExerciseName: {} as Record<string, ApiSchemas["Set"][]>,
        isPending: false,
      };
      if (!hasName) return empty;

      const named = trainingHistoryStore.getList(namedQuery);
      const recent = trainingHistoryStore.getList(recentQuery);
      const byId = new Map<string, ApiSchemas["TrainingHistory"]>();
      for (const item of [...(named?.content ?? []), ...(recent?.content ?? [])]) {
        byId.set(item.id, item);
      }

      const all = [...byId.values()].sort(byNewest);
      const sameProgram = all.filter(
        (item) => historyExerciseKey(item.name) === nameKey,
      );
      const previousSetsByExerciseName: Record<string, ApiSchemas["Set"][]> =
        {};

      for (const training of [...sameProgram, ...all]) {
        for (const exercise of training.exercises ?? []) {
          const key = historyExerciseKey(exercise.name);
          if (!key || previousSetsByExerciseName[key]) continue;
          if (!exercise.sets?.length) continue;
          previousSetsByExerciseName[key] = exercise.sets;
        }
      }

      return {
        latestHistory: sameProgram[0],
        previousSetsByExerciseName,
        isPending: named === undefined && recent === undefined,
      };
    });

  return {
    latestHistory,
    previousSetsByExerciseName,
    isPending,
  };
}
