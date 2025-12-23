import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useChangeExercises() {
  const queryClient = useQueryClient();

  const changeExercisesMutation = rqClient.useMutation(
    "put",
    "/exercises/{exerciseId}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/exercises"),
        );
      },
    },
  );

  const change = (exercisesId: string, data: ApiSchemas["CreateExercise"]) => {
    changeExercisesMutation.mutate({
      body: data,
      params: { path: { exerciseId: exercisesId } },
    });
  };

  return {
    isPending: changeExercisesMutation.isPending,
    change,
  };
}
