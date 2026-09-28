import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

export type FetchTrainingHistoryWithFiltersProps = {
  limit?: number;
  page?: number;
  sort?: string;
  sortDirection?: "asc" | "desc";
  exerciseName?: string;
  dateFrom?: string;
};

export function buildTrainingHistoryQuery({
  limit = 50,
  page,
  sort,
  sortDirection = "desc",
  exerciseName,
  dateFrom,
}: FetchTrainingHistoryWithFiltersProps) {
  const orderBy = JSON.stringify(
    sort ? { [sort]: sortDirection } : undefined,
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

  return { limit, page, orderBy, where };
}

export function useFetchTrainingHistoryWithFilters({
  limit = 50,
  page,
  sort,
  sortDirection = "desc",
  exerciseName,
  dateFrom,
}: FetchTrainingHistoryWithFiltersProps) {
  const query = useMemo(
    () =>
      buildTrainingHistoryQuery({
        limit,
        page,
        sort,
        sortDirection,
        exerciseName,
        dateFrom,
      }),
    [limit, page, sort, sortDirection, exerciseName, dateFrom],
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
