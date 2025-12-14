import { rqClient } from "@/entities/instance";

export function useTrainingFetch() {
  const { data, isPending } = rqClient.useQuery("get", "/active-trainings", {
    params: {},
  });

  if (data === undefined) {
    return {
      data: null,
      isLoading: isPending,
    };
  }

  return {
    data,
    isLoading: isPending,
  };
}
