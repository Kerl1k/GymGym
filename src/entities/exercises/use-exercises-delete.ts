import { useQueryClient } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";

export function useExercisesDelete() {
  const queryClient = useQueryClient();
  const deleteExercisesMutation = rqClient.useMutation(
    "delete",
    "/api/exercise-type/{id}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/exercise-type"),
        );
      },
    },
  );

  return {
    deleteExercises: (exerciseId: string) =>
      deleteExercisesMutation.mutate({
        params: { path: { id: exerciseId } },
      }),
    getIsPending: (exerciseId: string) =>
      deleteExercisesMutation.isPending &&
      deleteExercisesMutation.variables?.params?.path?.id === exerciseId,
  };
}
