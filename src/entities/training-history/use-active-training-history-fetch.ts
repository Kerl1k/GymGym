import { useEffect, useMemo } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { trainingHistoryStore } from "./training-history.store";

type FetchActiveHistoryProps = {
  limit?: number;
  page?: number;
  sort?: string;
};

export function useFetchActiveHistory({
  limit = 10,
  page,
  sort,
}: FetchActiveHistoryProps) {
  const orderBySerialized = useMemo(
    () => JSON.stringify(sort ? { [sort]: "desc" } : undefined),
    [sort],
  );
  const query = useMemo(
    () => ({
      limit: limit,
      page: page,
      orderBy: orderBySerialized,
    }),
    [limit, page, orderBySerialized],
  );

  useEffect(() => {
    void trainingHistoryStore.fetchList(query);
  }, [query]);

  const { history, isPending } = useMobxSelector(() => {
    const data = trainingHistoryStore.getList(query);
    return {
      history: data?.content ?? [],
      isPending: trainingHistoryStore.isListLoading(query),
    };
  });

  return {
    history,
    isPending,
  };
}
