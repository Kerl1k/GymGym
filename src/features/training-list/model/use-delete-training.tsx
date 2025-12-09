import { rqClient } from "@/shared/api/instance";
import { useQueryClient } from "@tanstack/react-query";

export function useDeleteTraining() {
  const queryClient = useQueryClient();
  const deleteTrainingMutation = rqClient.useMutation(
    "delete",
    "/trainings/{trainingId}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/trainings"),
        );
      },
    },
  );

  return {
    deleteTraining: (trainingId: string) =>
      deleteTrainingMutation.mutate({
        params: { path: { trainingId } },
      }),
    getIsPending: (trainingId: string) =>
      deleteTrainingMutation.isPending &&
      deleteTrainingMutation.variables?.params?.path?.trainingId === trainingId,
  };
}
