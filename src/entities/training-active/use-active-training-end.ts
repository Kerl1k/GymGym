import { rqClient } from "@/entities/instance";

export function useEndActiveTraining() {
  const endActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/end",
    {},
  );

  const end = async () => {
    await endActiveTraining.mutateAsync({
      body: {},
    });
  };

  return {
    end,
    isPending: endActiveTraining.isPending,
  };
}
