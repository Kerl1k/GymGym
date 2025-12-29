import { rqClient } from "@/entities/instance";
import { keepPreviousData } from "@tanstack/query-core";

type UseExercisesListParams = {
  limit?: number;
};

export function useExercisesFetchList({ limit = 20 }: UseExercisesListParams) {
  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/exercise-type",
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

  const exercises = data?.content ?? [];

  return {
    exercises,
    isPending,
  };
}
