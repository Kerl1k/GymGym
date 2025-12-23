import { Skeleton } from "@/shared/ui/kit/skeleton";
import React from "react";

export function ExercisesListLayout({
  header,
  filters,
  children,
}: {
  header: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6">
      <div className="flex gap-4">
        <div className="flex-1 p-2 sm:p-4 flex flex-col gap-4 sm:gap-6">
          {header}
          {filters}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ExercisesListLayoutHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="flex gap-2">{actions}</div>
    </div>
  );
}

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {filters && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="text-sm text-gray-500 whitespace-nowrap">
            Filter by
          </div>
          {filters}
        </div>
      )}
      {sort && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="text-sm text-gray-500 whitespace-nowrap">Sort by</div>
          {sort}
        </div>
      )}
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}

export function ExercisesListLayoutContent({
  children,
  cursorRef,
  hasCursor,
  isEmpty,
  isPending,
  isPendingNext,
  renderList,
}: {
  children?: React.ReactNode;
  isEmpty?: boolean;
  isPending?: boolean;
  isPendingNext?: boolean;
  cursorRef?: React.Ref<HTMLDivElement>;
  hasCursor?: boolean;
  renderList?: () => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {isPending && (
        <div className="text-center py-6 sm:py-10 text-sm sm:text-base">
          Загрузка...
        </div>
      )}
      {renderList && (
        <ExercisesListLayoutList>{renderList?.()}</ExercisesListLayoutList>
      )}

      {!isPending && children}

      {isEmpty && !isPending && (
        <div className="text-center py-6 sm:py-10 text-sm sm:text-base">
          Доски не найдены
        </div>
      )}

      {hasCursor && (
        <div ref={cursorRef} className="text-center py-4 sm:py-8">
          {isPendingNext && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 sm:h-10 w-full" />
              <Skeleton className="h-8 sm:h-10 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export function ExercisesListLayoutList({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return <div className={`grid ${gridClass} gap-3`}>{children}</div>;
}

export function ExercisesLayoutContentGroups({
  groups,
}: {
  groups: {
    title: string;
    items: React.ReactNode;
  }[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {groups.map((group) => (
        <div key={group.title}>
          <div className="text-base sm:text-lg font-bold mb-2">
            {group.title}
          </div>
          {group.items}
        </div>
      ))}
    </div>
  );
}
