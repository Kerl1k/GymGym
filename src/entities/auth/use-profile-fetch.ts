import { useEffect } from "react";

import { runInBackground } from "@/shared/lib/background";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { authStore } from "./auth.store";

export function useFetchProfile() {
  useEffect(() => {
    runInBackground(authStore.fetchProfile());
  }, []);

  const { profile, isPending } = useMobxSelector(() => ({
    profile: authStore.profile,
    isPending: authStore.isProfileFetching && authStore.profile === undefined,
  }));

  return {
    profile,
    isPending,
  };
}
