import { rqClient } from "@/entities/instance";

export function useTrainingHistoryFetchId(historyId: string) {
  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training-history/{id}",
    {
      params: {
        path: {
          id: historyId,
        },
      },
    },
  );

  if (data === undefined) {
    return {
      data: null,
      isLoading: isPending,
    };
  }

  return {
    data,
    isLoading: isPending,
  };
}
