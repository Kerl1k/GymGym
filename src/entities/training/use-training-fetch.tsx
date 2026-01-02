import { keepPreviousData } from "@tanstack/query-core";

import { rqClient } from "@/entities/instance";

type UseTrainingListParams = {
  limit?: number;
};

export function useTrainingList({ limit = 20 }: UseTrainingListParams) {
  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training",
    {
      params: {
        query: {
          page: 1,
          limit,
        },
      },
    },
    {
      initialPageParam: 1,
      pageParamName: "page",
      placeholderData: keepPreviousData,
    },
  );

  const trainings = data?.content ?? [];

  console.log(trainings);

  return {
    trainings,
    isPending,
  };
}
