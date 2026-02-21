import { useTrainingsFilters } from "@/entities/training/use-training-filters";
import { SearchInput } from "@/shared/ui/kit/search";

interface TrainingFilterProps {
  onSearchChange?: (search: string) => void;
  onSortChange?: (sort: string) => void;
  searchValue?: string;
  sortValue?: string;
  searchPlaceholder?: string;
  sortItems?: { value: string; label: string }[];
  showSearch?: boolean;
  showSort?: boolean;
  actions?: React.ReactNode;
}

export function TrainingFilter({
  onSearchChange,
  searchValue = "",
  searchPlaceholder = "Поиск тренировок...",
  showSearch = true,
  showSort = true,
  actions,
}: TrainingFilterProps) {
  const filters = useTrainingsFilters();

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      filters.setSearch(value);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
      {showSearch && (
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-[200px]">
          <div className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
            Поиск
          </div>
          <SearchInput
            value={onSearchChange ? searchValue : filters.search}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {showSort && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
            Сортировка
          </div>
        </div>
      )}

      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}
