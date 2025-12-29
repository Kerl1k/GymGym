import { rqClient } from "@/entities/instance";

export function useActiveTrainingFetch() {
  const { data, isPending } = rqClient.useQuery("get", "/api/active-training", {
    params: {},
  });

  if (data === undefined) {
    return {
      data: null,
      isLoading: isPending,
    };
  }

  if (!data) return { data: null, isLoading: isPending };

  return {
    data: data,
    isLoading: isPending,
  };
}
