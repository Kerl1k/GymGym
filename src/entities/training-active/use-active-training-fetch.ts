import { rqClient } from "@/entities/instance";

export function useActiveTrainingFetch() {
  const { data, isPending, isFetching, error } = rqClient.useQuery(
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
      isFetching,
      error: error,
    };
  }

  if (!data)
    return { data: null, isLoading: isPending, isFetching, error: error };

  return {
    data: data,
    isLoading: isPending,
    isFetching,
    error: error,
  };
}
