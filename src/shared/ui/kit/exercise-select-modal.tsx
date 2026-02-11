import { FC, useState } from "react";

import {
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  DumbbellIcon,
  XIcon,
} from "lucide-react";

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
};

const muscleGroups = [
  "Грудь",
  "Спина",
  "Плечи",
  "Бицепс",
  "Трицепс",
  "Пресс",
  "Ноги",
  "Ягодицы",
  "Икры",
  "Бицепс бедра",
  "Трапеции",
  "Предплечья",
];

const muscleGroupColors: Record<string, string> = {
  Грудь: "bg-red-500/20 text-red-600 border border-red-500/30",
  Спина: "bg-green-500/20 text-green-600 border border-green-500/30",
  Плечи: "bg-blue-500/20 text-blue-600 border border-blue-500/30",
  Бицепс: "bg-purple-500/20 text-purple-600 border border-purple-500/30",
  Трицепс: "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30",
  Пресс: "bg-orange-500/20 text-orange-600 border border-orange-500/30",
  Ноги: "bg-indigo-500/20 text-indigo-600 border border-indigo-500/30",
  Ягодицы: "bg-pink-500/20 text-pink-600 border border-pink-500/30",
  Икры: "bg-teal-500/20 text-teal-600 border border-teal-500/30",
  "Бицепс бедра": "bg-lime-500/20 text-lime-600 border border-lime-500/30",
  Трапеции: "bg-cyan-500/20 text-cyan-600 border border-cyan-500/30",
  Предплечья: "bg-amber-500/20 text-amber-600 border border-amber-500/30",
};

export const ExerciseSelectModal: FC<ExerciseSelectModalProps> = ({
  exercises,
  onSelect,
  isOpen,
  close,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | string>("all");
  const sortBy = "name";
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredExercises = exercises
    .filter((exercise) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((exercise) => {
      if (selectedType === "all") return true;
      return exercise.muscleGroups?.some((group) =>
        group.toLowerCase().includes(selectedType.toLowerCase()),
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const aType = a.muscleGroups?.[0] || "other";
        const bType = b.muscleGroups?.[0] || "other";
        return sortDirection === "asc"
          ? aType.localeCompare(bType)
          : bType.localeCompare(aType);
      }
    });

  const handleSelect = (exerciseId: string) => {
    onSelect(exerciseId);
    close();
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
  };

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      className="max-w-[95vw] w-full sm:max-w-2xl md:max-w-3xl"
      title=" Выбор упражнения"
    >
      <div className="p-4 sm:p-6 border-b border-border bg-card">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Найти упражнение..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 h-10 text-sm sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
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
                {muscleGroups.map((group) => (
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
              {sortBy === "name" ? "По названию" : "По типу"}
              {sortDirection === "asc" ? " ↑" : " ↓"}
            </Button>

            {(searchTerm || selectedType !== "all") && (
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

      <div className="flex-1 overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4 h-[calc(100vh-200px)] overflow-y-auto">
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
          <ScrollArea className="h-[calc(100vh-350px)] w-full p-2 sm:p-3">
            <div className="space-y-2">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise.id)}
                    className="w-full p-3 bg-muted/50 hover:bg-muted transition-colors duration-200 rounded-lg border border-border flex items-start gap-3 group"
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
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${muscleGroupColors[muscleGroup] || "bg-muted text-muted-foreground border border-border"}`}
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
                      <ArrowUpDownIcon className="h-4 w-4" />
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
