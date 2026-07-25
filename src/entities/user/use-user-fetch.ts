import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { userStore } from "./user.store";

export function useUserFetch(userId: string) {
  useEffect(() => {
    if (!userId) return;
    void userStore.fetchById(userId);
  }, [userId]);

  const { user, isPending } = useMobxSelector(() => ({
    user: userStore.getById(userId),
    isPending: userStore.isByIdLoading(userId),
  }));

  return {
    user: user ?? null,
    isPending: isPending || user === undefined,
  };
}
