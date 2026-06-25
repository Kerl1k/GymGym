import { FC, useEffect, useMemo, useState } from "react";

import {
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  DumbbellIcon,
  ChevronRightIcon,
} from "lucide-react";

import { MUSCLE_GROUPS, getMuscleGroupColor } from "@/shared/lib/utils";
import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Input } from "@/shared/ui/kit/input";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { Skeleton } from "@/shared/ui/kit/skeleton";

import { Modal } from "./modalWindow/modal";

type ExerciseSelectModalProps = {
  exercises: ApiSchemas["ExerciseType"][];
  onSelect: (exerciseId: string) => void;
  isLoading?: boolean;
  close: () => void;
  isOpen: boolean;
  searchPlaceholder?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  onSelectAll?: () => void;
};

export const ExerciseSelectModal: FC<ExerciseSelectModalProps> = ({
  exercises,
  onSelect,
  isOpen,
  close,
  isLoading = false,
  searchPlaceholder = "Найти упражнение...",
  includeAllOption = false,
  allOptionLabel = "Все упражнения",
  onSelectAll,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | string>("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedType("all");
    }
  }, [isOpen]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredExercises = useMemo(
    () =>
      exercises
        .filter((exercise) => {
          if (
            normalizedSearch &&
            !exercise.name.toLowerCase().includes(normalizedSearch)
          ) {
            return false;
          }

          if (selectedType === "all") return true;
          return exercise.muscleGroups?.some((group) =>
            group.toLowerCase().includes(selectedType.toLowerCase()),
          );
        })
        .sort((a, b) =>
          sortDirection === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        ),
    [exercises, normalizedSearch, selectedType, sortDirection],
  );

  const handleSelect = (exerciseId: string) => {
    onSelect(exerciseId);
    close();
  };

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
      close();
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const clearFilters = () => {
    setSelectedType("all");
  };

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      className="max-h-[90vh] w-full max-w-[95vw] overflow-hidden p-0 gap-0 sm:max-w-2xl md:max-w-3xl"
      disableAutoFocus
    >
      <div className="border-b border-border bg-card px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-3 py-1.5 h-8 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 px-3 py-2 text-sm">
                  <FilterIcon className="h-3.5 w-3.5 mr-2" />
                  {selectedType === "all" ? "Все группы мышц" : selectedType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onSelect={() => setSelectedType("all")}>
                  <span className="text-sm">Все группы мышц</span>
                </DropdownMenuItem>
                {MUSCLE_GROUPS.map((group) => (
                  <DropdownMenuItem
                    key={group}
                    onSelect={() => setSelectedType(group)}
                    className="text-sm"
                  >
                    {group}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={toggleSortDirection}
              className="h-9 px-3 py-2 text-sm"
            >
              <ArrowUpDownIcon className="h-3.5 w-3.5 mr-2" />
              По названию
              {sortDirection === "asc" ? " ↑" : " ↓"}
            </Button>

            {selectedType !== "all" && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-9 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-3 px-5 pb-5 pt-5 sm:px-7 sm:pb-7">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
              >
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[min(60vh,32rem)] w-full px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="space-y-2.5">
              {includeAllOption && onSelectAll && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full p-4 bg-muted/50 hover:bg-muted/80 transition-colors duration-200 rounded-lg border border-border flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                    <DumbbellIcon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-foreground">
                    {allOptionLabel}
                  </span>
                </button>
              )}
              {filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise.id)}
                    className="w-full p-4 bg-muted/50 hover:bg-muted transition-colors duration-200 rounded-lg border border-border flex items-start gap-3 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                      <DumbbellIcon className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm sm:text-base font-medium text-foreground truncate group-hover:text-primary">
                          {exercise.name}
                        </h3>
                      </div>

                      {exercise.muscleGroups &&
                        exercise.muscleGroups.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {exercise.muscleGroups
                              .slice(0, 3)
                              .map((muscleGroup) => (
                                <span
                                  key={muscleGroup}
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${getMuscleGroupColor(muscleGroup)}`}
                                >
                                  {muscleGroup}
                                </span>
                              ))}
                            {exercise.muscleGroups.length > 3 && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium border border-border">
                                +{exercise.muscleGroups.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                      {exercise.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {exercise.description}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-1 text-muted-foreground group-hover:text-primary">
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="mx-auto mb-4 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <DumbbellIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                    Упражнения не найдены
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </Modal>
  );
};
