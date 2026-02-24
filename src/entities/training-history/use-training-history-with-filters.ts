import { rqClient } from "@/entities/instance";

type FetchTrainingHistoryWithFiltersProps = {
  limit?: number;
  page?: number;
  sort?: string;
  exerciseName?: string;
};

export function useFetchTrainingHistoryWithFilters({
  limit = 50,
  page,
  sort,
  exerciseName,
}: FetchTrainingHistoryWithFiltersProps) {
  const orderBy = sort ? { [sort]: "desc" } : undefined;

  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training-history",
    {
      params: {
        query: {
          limit: limit,
          page: page,
          orderBy: JSON.stringify(orderBy),
          where: exerciseName
            ? JSON.stringify({
                exercises: {
                  some: {
                    name: {
                      contains: exerciseName,
                      mode: "insensitive",
                    },
                  },
                },
              })
            : undefined,
        },
      },
    },
  );

  const history = data?.content ?? [];

  return {
    history,
    isPending,
  };
}
