import { rqClient } from "@/entities/instance";

type FetchTrainingHistoryWithFiltersProps = {
  limit?: number;
  page?: number;
  sort?: string;
  sortDirection?: "asc" | "desc";
  exerciseName?: string;
  dateFrom?: string;
};

export function useFetchTrainingHistoryWithFilters({
  limit = 50,
  page,
  sort,
  sortDirection = "desc",
  exerciseName,
  dateFrom,
}: FetchTrainingHistoryWithFiltersProps) {
  const orderBy = sort ? { [sort]: sortDirection } : undefined;
  const where =
    exerciseName || dateFrom
      ? JSON.stringify({
          ...(exerciseName
            ? {
                exercises: {
                  some: {
                    name: {
                      contains: exerciseName,
                      mode: "insensitive",
                    },
                  },
                },
              }
            : {}),
          ...(dateFrom
            ? {
                dateStart: {
                  gte: dateFrom,
                },
              }
            : {}),
        })
      : undefined;

  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training-history",
    {
      params: {
        query: {
          limit: limit,
          page: page,
          orderBy: JSON.stringify(orderBy),
          where,
        },
      },
    },
  );

  const history = data?.content ?? [];
  const meta = data?.meta;

  return {
    history,
    meta,
    isPending,
  };
}
