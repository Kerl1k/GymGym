import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useCreateExercises() {
  const queryClient = useQueryClient();

  const createExercisesMutation = rqClient.useMutation("post", "/exercises", {
    onSettled: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/exercises"),
      );
    },
  });

  const create = (data: ApiSchemas["CreateExercise"]) => {
    createExercisesMutation.mutate({ body: data });
  };

  return {
    isPending: createExercisesMutation.isPending,
    create,
  };
}
