import { useQueryClient } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";

export function useActiveTrainingDelete() {
  const queryClient = useQueryClient();
  const deleteExercisesMutation = rqClient.useMutation(
    "delete",
    "/api/training-history/{id}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/training-history"),
        );
      },
    },
  );

  return {
    deleteExercises: (exerciseId: string) =>
      deleteExercisesMutation.mutate({
        params: { path: { id: exerciseId } },
      }),
    isPending: deleteExercisesMutation.isPending,
    getIsPending: (exerciseId: string) =>
      deleteExercisesMutation.isPending &&
      deleteExercisesMutation.variables?.params?.path?.id === exerciseId,
  };
}
