import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import { useQueryClient } from "@tanstack/react-query";

export function useChangeTraining() {
  const queryClient = useQueryClient();

  const changeTrainingMutation = rqClient.useMutation(
    "put",
    "/trainings/{trainingId}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/trainings"),
        );
      },
    },
  );

  const change = (trainingId: string, data: ApiSchemas["CreateTraining"]) => {
    changeTrainingMutation.mutate({
      body: data,
      params: { path: { trainingId } },
    });
  };

  return {
    isPending: changeTrainingMutation.isPending,
    change,
  };
}
