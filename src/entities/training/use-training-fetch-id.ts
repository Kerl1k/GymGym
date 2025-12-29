import { rqClient } from "@/entities/instance";

export function useTrainingFetchId(trainingId: string) {
  const { data, isPending } = rqClient.useQuery("get", "/api/training/{id}", {
    params: {
      path: {
        id: trainingId,
      },
    },
  });

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
