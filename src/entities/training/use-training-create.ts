import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useCreateTraining() {
  const queryClient = useQueryClient();

  const createTrainingMutation = rqClient.useMutation("post", "/api/training", {
    onSettled: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/api/training"),
      );
    },
  });

  const create = (data: ApiSchemas["TrainingCreateBody"]) => {
    createTrainingMutation.mutate({ body: data });
  };

  return {
    isPending: createTrainingMutation.isPending,
    create,
  };
}
