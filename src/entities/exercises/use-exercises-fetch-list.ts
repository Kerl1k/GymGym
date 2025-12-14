import { rqClient } from "@/entities/instance";
import { keepPreviousData } from "@tanstack/query-core";
import { RefCallback, useCallback } from "react";

type UseExercisesListParams = {
  limit?: number;
  isFavorite?: boolean;
  search?: string;
  sort?: "createdAt" | "updatedAt" | "lastOpenedAt" | "name";
};

export function useExercisesFetchList({
  limit = 20,
  isFavorite,
  search,
  sort,
}: UseExercisesListParams) {
  const { fetchNextPage, data, isFetchingNextPage, isPending, hasNextPage } =
    rqClient.useInfiniteQuery(
      "get",
      "/exercises",
      {
        params: {
          query: {
            page: 1,
            limit,
            isFavorite,
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

  const exercises = data?.pages.flatMap((page) => page.list) ?? [];

  return {
    exercises,
    isFetchingNextPage,
    isPending,
    hasNextPage,
    cursorRef,
  };
}
