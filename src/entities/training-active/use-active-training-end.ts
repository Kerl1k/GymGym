import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

export function useEndActiveTraining() {
  const endActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/end",
    {},
  );

  const end = async (): Promise<string> => {
    const result = await endActiveTraining.mutateAsync({});

    const trainingHistory = result as ApiSchemas["TrainingHistory"];
    return trainingHistory.id;
  };

  return {
    end,
    isPending: endActiveTraining.isPending,
  };
}
