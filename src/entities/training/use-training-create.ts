import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useCreateTraining() {
  const queryClient = useQueryClient();

  const createTrainingMutation = rqClient.useMutation("post", "/trainings", {
    onSettled: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/trainings"),
      );
    },
  });

  const create = (data: ApiSchemas["CreateTraining"]) => {
    createTrainingMutation.mutate({ body: data });
  };

  return {
    isPending: createTrainingMutation.isPending,
    create,
  };
}
