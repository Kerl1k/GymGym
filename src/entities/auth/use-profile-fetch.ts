import { rqClient } from "@/entities/instance";

export function useFetchProfile() {
  const { data, isPending } = rqClient.useQuery("get", "/api/auth/profile");

  const profile = data;

  return {
    profile,
    isPending,
  };
}
