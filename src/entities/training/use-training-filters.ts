import { useState } from "react";

export type TrainingsFilters = {
  search: string;
  sort: string;
};

export function useTrainingsFilters() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("lastOpenedAt");

  return {
    search,
    sort,
    setSearch,
    setSort,
  };
}
