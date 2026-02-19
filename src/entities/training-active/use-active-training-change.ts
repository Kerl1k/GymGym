import { useQueryClient } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

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

  const change = async (data: ApiSchemas["ActiveTraining"]) => {
    await createTrainingMutation.mutateAsync({ body: data });
  };

  return {
    change,
    isPending: createTrainingMutation.isPending,
  };
}
