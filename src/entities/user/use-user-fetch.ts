import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { userStore } from "./user.store";

export function useUserFetch(userId: string) {
  useEffect(() => {
    if (!userId) return;
    void userStore.fetchById(userId);
  }, [userId]);

  const { user, isPending, error } = useMobxSelector(() => ({
    user: userStore.getById(userId),
    isPending: userStore.isByIdLoading(userId),
    error: userStore.getByIdError(userId),
  }));

  return {
    user: user ?? null,
    error,
    isPending: isPending || (user === undefined && !error && Boolean(userId)),
  };
}
