import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { userStore } from "./user.store";

export function useUsersList() {
  const { users, isPending, hasData } = useMobxSelector(() => {
    const data = userStore.getList();
    return {
      users: data ?? [],
      isPending: userStore.isListLoading(),
      hasData: data !== undefined,
    };
  });

  useEffect(() => {
    if (!hasData) {
      void userStore.fetchList();
    }
  }, [hasData]);

  return {
    users,
    isPending,
  };
}
