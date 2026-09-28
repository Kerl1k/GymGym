import { useCallback, useState } from "react";

import { ApiSchemas } from "@/shared/schema";

import { trainingHistoryStore } from "./training-history.store";
import {
  buildTrainingHistoryQuery,
  type FetchTrainingHistoryWithFiltersProps,
} from "./use-training-history-with-filters";

const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 50;

type ExportFilters = Omit<FetchTrainingHistoryWithFiltersProps, "limit" | "page">;

export function useTrainingHistoryExport() {
  const [isPending, setIsPending] = useState(false);

  const fetchAll = useCallback(
    async (filters: ExportFilters): Promise<ApiSchemas["TrainingHistory"][]> => {
      setIsPending(true);
      try {
        const all: ApiSchemas["TrainingHistory"][] = [];
        for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
          const query = buildTrainingHistoryQuery({
            ...filters,
            limit: EXPORT_PAGE_SIZE,
            page,
          });
          await trainingHistoryStore.fetchList(query, true);
          const data = trainingHistoryStore.getList(query);
          all.push(...(data?.content ?? []));
          if (!data?.meta || page >= data.meta.pages) break;
        }
        return all;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { fetchAll, isPending };
}
