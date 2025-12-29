import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useChangeExercises() {
  const queryClient = useQueryClient();

  const changeExercisesMutation = rqClient.useMutation(
    "patch",
    "/api/exercise-type",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/exercise-type"),
        );
      },
    },
  );

  const change = (data: ApiSchemas["ExerciseTypeUpdateBody"]) => {
    changeExercisesMutation.mutate({
      body: data,
    });
  };

  return {
    isPending: changeExercisesMutation.isPending,
    change,
  };
}
