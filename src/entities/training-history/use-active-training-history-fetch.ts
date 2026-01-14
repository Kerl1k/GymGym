import { rqClient } from "@/entities/instance";

type FetchActiveHistroryProps = {
  limit?: number;
  page?: number;
};

export function useFetchActiveHistrory({
  limit,
  page,
}: FetchActiveHistroryProps) {
  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training-history",
    {
      params: {
        query: {
          limit: limit,
          page: page,
        },
      },
    },
  );

  const history = data?.content ?? [];

  return {
    history,
    isPending,
  };
}
