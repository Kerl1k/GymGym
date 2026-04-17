import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export function useEndActiveTraining() {
  const queryClient = useQueryClient();
  const endActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/end",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/active-training"),
        );
      },
    },
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
