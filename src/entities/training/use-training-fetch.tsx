import { keepPreviousData } from "@tanstack/query-core";

import { rqClient } from "@/entities/instance";

type UseTrainingListParams = {
  limit?: number;
  filter?: { favorite?: true };
  sort?: string;
  search?: string;
};

export function useTrainingList({
  limit = 20,
  filter,
  sort,
  search,
}: UseTrainingListParams) {
  const orderBy = sort ? { [sort]: "asc" } : undefined;

  const filterBy = search ? { ...filter, name: { contains: search } } : filter;

  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training",
    {
      params: {
        query: {
          page: 1,
          limit,
          filter: JSON.stringify(filterBy),
          orderBy: JSON.stringify(orderBy),
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

  return {
    trainings,
    isPending,
  };
}
