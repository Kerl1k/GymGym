import { useQueryClient } from "@tanstack/react-query";

import { rqClient } from "@/entities/instance";

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
