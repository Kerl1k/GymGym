import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";
import { historyExerciseKey } from "./use-latest-training-history-by-name";

type UseTrainingHistoryByNameProps = {
  trainingName?: string;
  limit?: number;
  excludeId?: string;
};

export function useTrainingHistoryByName({
  trainingName,
  limit = 50,
  excludeId,
}: UseTrainingHistoryByNameProps) {
  const normalizedName = trainingName?.trim() ?? "";
  const hasName = normalizedName.length > 0;

  const nameFilter = hasName
    ? JSON.stringify({
        name: {
          equals: normalizedName,
        },
      })
    : undefined;

  const query = useMemo(
    () => ({
      limit,
      orderBy: JSON.stringify({ dateStart: "desc" }),
      filter: nameFilter,
      where: nameFilter,
    }),
    [limit, nameFilter],
  );

  useEffect(() => {
    if (!hasName) return;
    void trainingHistoryStore.fetchList(query);
  }, [hasName, query]);

  const { history, isPending } = useMobxSelector(() => {
    const data = hasName ? trainingHistoryStore.getList(query) : undefined;
    const content = (data?.content ?? []).filter((item) =>
      hasName ? historyExerciseKey(item.name) === historyExerciseKey(normalizedName) : true,
    );
    const sorted = [...content].sort(
      (a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
    );
    return {
      history: excludeId
        ? sorted.filter((item) => item.id !== excludeId)
        : sorted,
      isPending:
        hasName &&
        (data === undefined || trainingHistoryStore.isListLoading(query)),
    };
  });

  return {
    history,
    isPending,
  };
}
