import { rqClient } from "@/entities/instance";

export function useActiveTrainingFetch() {
  const { data, isPending, error } = rqClient.useQuery(
    "get",
    "/api/active-training",
    {
      params: {},
    },
  );

  if (data === undefined) {
    return {
      data: null,
      isLoading: isPending,
      error: error,
    };
  }

  if (!data) return { data: null, isLoading: isPending, error: error };

  return {
    data: data,
    isLoading: isPending,
    error: error,
  };
}
