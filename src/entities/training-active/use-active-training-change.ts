import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateActiveTraining() {
  const queryClient = useQueryClient();

  const createTrainingMutation = rqClient.useMutation(
    "patch",
    "/api/active-training/update",
    {
      onSettled: async () => {
        return await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/active-training"),
        );
      },
    },
  );

  const change = (data: ApiSchemas["ActiveTraining"]) => {
    createTrainingMutation.mutate({ body: data });
  };

  return {
    change,
    isPending: createTrainingMutation.isPending,
  };
}
