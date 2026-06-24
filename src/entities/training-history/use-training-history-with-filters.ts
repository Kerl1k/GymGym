import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

type FetchTrainingHistoryWithFiltersProps = {
  limit?: number;
  page?: number;
  sort?: string;
  sortDirection?: "asc" | "desc";
  exerciseName?: string;
  dateFrom?: string;
};

export function useFetchTrainingHistoryWithFilters({
  limit = 50,
  page,
  sort,
  sortDirection = "desc",
  exerciseName,
  dateFrom,
}: FetchTrainingHistoryWithFiltersProps) {
  const orderBySerialized = useMemo(
    () => JSON.stringify(sort ? { [sort]: sortDirection } : undefined),
    [sort, sortDirection],
  );
  const where =
    exerciseName || dateFrom
      ? JSON.stringify({
          ...(exerciseName
            ? {
                exercises: {
                  some: {
                    name: {
                      contains: exerciseName,
                      mode: "insensitive",
                    },
                  },
                },
              }
            : {}),
          ...(dateFrom
            ? {
                dateStart: {
                  gte: dateFrom,
                },
              }
            : {}),
        })
      : undefined;

  const query = useMemo(
    () => ({
      limit: limit,
      page: page,
      orderBy: orderBySerialized,
      where,
    }),
    [limit, page, orderBySerialized, where],
  );

  useEffect(() => {
    void trainingHistoryStore.fetchList(query);
  }, [query]);

  const { history, meta, isPending } = useMobxSelector(() => {
    const data = trainingHistoryStore.getList(query);
    return {
      history: data?.content ?? [],
      meta: data?.meta,
      isPending: trainingHistoryStore.isListLoading(query),
    };
  });

  return {
    history,
    meta,
    isPending,
  };
}
