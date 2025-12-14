import { rqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export function useUpdateActiveTraining() {
  const queryClient = useQueryClient();

  const createTrainingMutation = rqClient.useMutation(
    "post",
    "/active-trainings",
    {
      onSettled: async () => {
        const qwe = await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/active-trainings"),
        );
        return qwe;
      },
    },
  );

  const toggle = (data: ApiSchemas["CreateActiveTraining"]) => {
    createTrainingMutation.mutate({ body: data });
  };

  return {
    toggle,
    isPending: createTrainingMutation.isPending,
  };
}
