import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

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

  const query = useMemo(
    () => ({
      limit,
      orderBy: JSON.stringify({ dateStart: "desc" }),
      where: hasName
        ? JSON.stringify({
            name: {
              equals: normalizedName,
            },
          })
        : undefined,
    }),
    [hasName, limit, normalizedName],
  );

  useEffect(() => {
    if (!hasName) return;
    void trainingHistoryStore.fetchList(query);
  }, [hasName, query]);

  const { history, isPending } = useMobxSelector(() => {
    const data = hasName ? trainingHistoryStore.getList(query) : undefined;
    const content = data?.content ?? [];
    return {
      history: excludeId
        ? content.filter((item) => item.id !== excludeId)
        : content,
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
