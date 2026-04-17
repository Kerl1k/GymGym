import { rqClient } from "@/entities/instance";
import { useQueryClient } from "@tanstack/react-query";

export function useCancelActiveTraining() {
  const queryClient = useQueryClient();
  const cancelActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/cancel",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/active-training"),
        );
      },
    },
  );

  const cancel = async () => {
    await cancelActiveTraining.mutateAsync({});
  };

  return {
    cancel,
    isPending: cancelActiveTraining.isPending,
  };
}
