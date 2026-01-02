import { useQueryClient } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";


export function useChangeTraining() {
  const queryClient = useQueryClient();

  const changeTrainingMutation = rqClient.useMutation(
    "patch",
    "/api/training",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/training"),
        );
      },
    },
  );

  const change = (data: ApiSchemas["TrainingUpdateBody"]) => {
    changeTrainingMutation.mutate({
      body: data,
    });
  };

  return {
    isPending: changeTrainingMutation.isPending,
    change,
  };
}
