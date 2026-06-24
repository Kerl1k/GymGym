import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

type UseLatestTrainingHistoryByNameProps = {
  trainingName?: string;
};

export function useLatestTrainingHistoryByName({
  trainingName,
}: UseLatestTrainingHistoryByNameProps) {
  const normalizedName = trainingName?.trim() ?? "";
  const hasName = normalizedName.length > 0;

  const query = useMemo(
    () => ({
      limit: 1,
      orderBy: JSON.stringify({ dateStart: "desc" }),
      where: hasName
        ? JSON.stringify({
            name: {
              equals: normalizedName,
            },
          })
        : undefined,
    }),
    [hasName, normalizedName],
  );

  useEffect(() => {
    if (!hasName) return;
    void trainingHistoryStore.fetchList(query);
  }, [hasName, query]);

  const { latestHistory, isPending } = useMobxSelector(() => {
    const data = hasName ? trainingHistoryStore.getList(query) : undefined;
    return {
      latestHistory: data?.content?.[0],
      isPending: hasName ? trainingHistoryStore.isListLoading(query) : false,
    };
  });

  return {
    latestHistory,
    isPending,
  };
}
