import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingStore } from "./training.store";

type UseTrainingListParams = {
  limit?: number;
  filter?: { favorite?: true };
  sort?: string;
  search?: string;
};

export function useTrainingList({
  limit = 20,
  filter,
  sort,
  search,
}: UseTrainingListParams) {
  const orderBySerialized = useMemo(
    () => JSON.stringify(sort ? { [sort]: "asc" } : undefined),
    [sort],
  );
  const filterSerialized = useMemo(
    () => JSON.stringify(search ? { ...filter, name: { contains: search } } : filter),
    [filter, search],
  );
  const query = useMemo(
    () => ({
      page: 1,
      limit,
      filter: filterSerialized,
      orderBy: orderBySerialized,
    }),
    [filterSerialized, limit, orderBySerialized],
  );

  const { trainings, isPending, hasData } = useMobxSelector(() => {
    const data = trainingStore.getList(query);
    return {
      trainings: data?.content ?? [],
      isPending: trainingStore.isListLoading(query),
      hasData: data !== undefined,
    };
  });

  useEffect(() => {
    if (!hasData) {
      void trainingStore.fetchList(query);
    }
  }, [hasData, query]);

  return {
    trainings,
    isPending,
  };
}
