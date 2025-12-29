import { rqClient } from "@/entities/instance";

export function useStartActiveTraining() {
  const startActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/start",
    {},
  );

  const start = async (id: string) => {
    await startActiveTraining.mutateAsync({
      body: { id: id, dateStart: new Date().toISOString() },
    });
  };

  return {
    start,
    isPending: startActiveTraining.isPending,
  };
}
