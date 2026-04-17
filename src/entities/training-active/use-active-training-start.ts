import { rqClient } from "@/entities/instance";
import { useQueryClient } from "@tanstack/react-query";

export function useStartActiveTraining() {
  const queryClient = useQueryClient();
  const startActiveTraining = rqClient.useMutation(
    "post",
    "/api/active-training/start",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/api/active-training"),
        );
      },
    },
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
