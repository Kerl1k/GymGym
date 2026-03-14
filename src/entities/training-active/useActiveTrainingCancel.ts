import { rqClient } from "@/entities/instance";

export function useCancelActiveTraining() {
  const cancelActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/cancel",
    {},
  );

  const cancel = async () => {
    await cancelActiveTraining.mutateAsync({});
  };

  return {
    cancel,
    isPending: cancelActiveTraining.isPending,
  };
}
