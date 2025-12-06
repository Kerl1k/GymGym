import { rqClient } from "@/shared/api/instance";
import { ApiSchemas } from "@/shared/api/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useCreateTraining() {
  const queryClient = useQueryClient();

  const createBoardMutation = rqClient.useMutation("post", "/trainings", {
    onSettled: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/trainings"),
      );
    },
  });

  const create = (data: ApiSchemas["CreateTraining"]) => {
    createBoardMutation.mutate({ body: data });
  };

  return {
    isPending: createBoardMutation.isPending,
    create,
  };
}
