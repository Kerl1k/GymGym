import { rqClient } from "@/entities/instance";

export function useFetchActiveHistrory() {
  const { data, isPending } = rqClient.useQuery("get", "/api/training-history");

  const history = data?.content ?? [];

  return {
    history,
    isPending,
  };
}
