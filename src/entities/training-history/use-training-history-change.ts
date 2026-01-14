import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

export function useChangeTrainingHistory() {
  const changeTrainingMutation = rqClient.useMutation(
    "patch",
    "/api/training-history",
    {},
  );

  const change = (data: ApiSchemas["TrainingHistoryUpdate"]) => {
    changeTrainingMutation.mutate({
      body: data,
    });
  };

  return {
    isPending: changeTrainingMutation.isPending,
    change,
  };
}
