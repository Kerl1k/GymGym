import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { userStore } from "./user.store";

export function useUserHistory(userId: string) {
  useEffect(() => {
    if (!userId) return;
    void userStore.fetchHistory(userId);
  }, [userId]);

  const { history, meta, isPending, hasData, error } = useMobxSelector(() => {
    const data = userStore.getHistory(userId);
    return {
      history: data?.content ?? [],
      meta: data?.meta,
      isPending: userStore.isHistoryLoading(userId),
      hasData: data !== undefined,
      error: userStore.getHistoryError(userId),
    };
  });

  return {
    history,
    meta,
    error,
    isPending: isPending || (!hasData && !error && Boolean(userId)),
  };
}
