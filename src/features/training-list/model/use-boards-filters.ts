import { useState } from "react";

export type BoardsFilters = {
  search: string;
  sort: string;
};

export function useBoardsFilters() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("lastOpenedAt");

  return {
    search,
    sort,
    setSearch,
    setSort,
  };
}
