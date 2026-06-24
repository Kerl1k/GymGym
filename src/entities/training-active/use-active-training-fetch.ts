import { useEffect } from "react";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";

import { activeTrainingStore } from "./active-training.store";

export function useActiveTrainingFetch() {
  useEffect(() => {
    void activeTrainingStore.fetch();
  }, []);

  const { data, isLoading, isFetching, error } = useMobxSelector(() => ({
    data: activeTrainingStore.data,
    isLoading: activeTrainingStore.isLoading,
    isFetching: activeTrainingStore.isFetching,
    error: activeTrainingStore.error,
  }));

  const hasData = data != null;
  const isError = Boolean(error);
  const fetchStatus = activeTrainingStore.fetchStatus;

  return {
    data: data ?? null,
    hasData,
    isLoading,
    isFetching,
    error,
    isError,
    fetchStatus,
  };
}
