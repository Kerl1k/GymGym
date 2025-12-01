import { rqClient } from "@/shared/api/instance";
import { ApiSchemas } from "@/shared/api/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useCreateBoard() {
  const queryClient = useQueryClient();

  const createBoardMutation = rqClient.useMutation("post", "/exercises", {
    onSettled: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/exercises"),
      );
    },
  });

  const create = (data: ApiSchemas["CreateExercise"]) => {
    createBoardMutation.mutate({ body: data });
  };

  return {
    isPending: createBoardMutation.isPending,
    create,
  };
}
