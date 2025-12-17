import { rqClient } from "@/entities/instance";
import { keepPreviousData } from "@tanstack/query-core";
import { RefCallback, useCallback } from "react";

type UseTrainingListParams = {
  limit?: number;
  search?: string;
  sort?: string;
};

export function useTrainingList({
  limit = 20,
  search,
  sort,
}: UseTrainingListParams) {
  const { fetchNextPage, data, isFetchingNextPage, isPending, hasNextPage } =
    rqClient.useInfiniteQuery(
      "get",
      "/trainings",
      {
        params: {
          query: {
            page: 1,
            limit,
            search,
            sort,
          },
        },
      },
      {
        initialPageParam: 1,
        pageParamName: "page",
        getNextPageParam: (lastPage, _, lastPageParams) =>
          Number(lastPageParams) < lastPage.totalPages
            ? Number(lastPageParams) + 1
            : null,

        placeholderData: keepPreviousData,
      },
    );

  const cursorRef: RefCallback<HTMLDivElement> = useCallback(
    (el) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchNextPage();
          }
        },
        { threshold: 0.5 },
      );

      if (el) {
        observer.observe(el);

        return () => {
          observer.disconnect();
        };
      }
    },
    [fetchNextPage],
  );
  console.log(data);
  const trainings = data?.pages.flatMap((page) => page.list) ?? [];

  return {
    trainings,
    isFetchingNextPage,
    isPending,
    hasNextPage,
    cursorRef,
  };
}
