import { useIsRestoring } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";

export function useActiveTrainingFetch() {
  const isRestoring = useIsRestoring();
  const { data, isPending, isFetching, error, isError, fetchStatus } = rqClient.useQuery(
    "get",
    "/api/active-training",
    {
      params: {},
    },
  );

  const hasData = data != null;

  return {
    data: data ?? null,
    hasData,
    isLoading: isPending,
    isFetching,
    error,
    isError,
    fetchStatus,
    isRestoring,
  };
}
