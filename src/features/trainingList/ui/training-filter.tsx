export function ExercisesListLayoutFilters({
  sort,
  filters,
  actions,
}: {
  sort?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      {filters && (
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 whitespace-nowrap">
            Filter by
          </div>
          {filters}
        </div>
      )}
      {sort && (
        <div className="flex items-center gap-2 ">
          <div className="text-sm text-gray-500 whitespace-nowrap">Sort by</div>
          {sort}
        </div>
      )}
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}
