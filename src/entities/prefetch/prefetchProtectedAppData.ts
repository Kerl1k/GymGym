import { rqClient } from "@/entities/instance";

import type { QueryClient } from "@tanstack/react-query";


/** Как в `useTrainingList` без аргументов */
function trainingListDefaultInit() {
  const orderBy = undefined;
  const filterBy = undefined;
  return {
    params: {
      query: {
        page: 1,
        limit: 20,
        filter: JSON.stringify(filterBy),
        orderBy: JSON.stringify(orderBy),
      },
    },
  };
}

/** Как в `useFetchActiveHistrory({})` */
function trainingHistoryDefaultInit() {
  const limit = 10;
  const page = undefined;
  const orderBy = undefined;
  return {
    params: {
      query: {
        limit,
        page,
        orderBy: JSON.stringify(orderBy),
        where: undefined,
      },
    },
  };
}

/**
 * Минимальный прогрев кэша после входа: несколько параллельных GET без дублей и без N+1 по id.
 */
export async function prefetchProtectedAppData(queryClient: QueryClient): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery(rqClient.queryOptions("get", "/api/auth/profile")),
    queryClient.prefetchQuery(
      rqClient.queryOptions("get", "/api/active-training", { params: {} }),
    ),
    queryClient.prefetchQuery(
      rqClient.queryOptions("get", "/api/training", trainingListDefaultInit()),
    ),
    queryClient.prefetchQuery(
      rqClient.queryOptions("get", "/api/exercise-type", {
        params: {
          query: {
            page: 1,
            limit: 20,
          },
        },
      }),
    ),
    queryClient.prefetchQuery(
      rqClient.queryOptions("get", "/api/training-history", trainingHistoryDefaultInit()),
    ),
  ]);
}
