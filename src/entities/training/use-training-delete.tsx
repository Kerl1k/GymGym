import { rqClient } from "@/entities/instance";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteTraining() {
  const queryClient = useQueryClient();
  const deleteTrainingMutation = rqClient.useMutation(
    "delete",
    "/api/training/{id}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/training"),
        );
      },
    },
  );

  return {
    deleteTraining: (trainingId: string) =>
      deleteTrainingMutation.mutate({
        params: { path: { id: trainingId } },
      }),
    getIsPending: (trainingId: string) =>
      deleteTrainingMutation.isPending &&
      deleteTrainingMutation.variables?.params?.path?.id === trainingId,
  };
}
