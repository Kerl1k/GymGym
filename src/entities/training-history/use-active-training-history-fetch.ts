import { rqClient } from "@/entities/instance";

type FetchActiveHistroryProps = {
  limit?: number;
  page?: number;
  sort?: string;
};

export function useFetchActiveHistrory({
  limit = 10,
  page,
  sort,
}: FetchActiveHistroryProps) {
  const orderBy = sort ? { [sort]: "desc" } : undefined;

  const { data, isPending } = rqClient.useQuery(
    "get",
    "/api/training-history",
    {
      params: {
        query: {
          limit: limit,
          page: page,
          orderBy: JSON.stringify(orderBy),
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
