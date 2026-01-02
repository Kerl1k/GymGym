import { useQueryClient } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";


export function useCreateExercises() {
  const queryClient = useQueryClient();

  const createExercisesMutation = rqClient.useMutation(
    "post",
    "/api/exercise-type",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/exercise-type"),
        );
      },
    },
  );

  const create = (data: ApiSchemas["ExerciseTypeCreateBody"]) => {
    createExercisesMutation.mutate({ body: data });
  };

  return {
    isPending: createExercisesMutation.isPending,
    create,
  };
}
