import { FC, useState } from "react";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { ApiSchemas } from "@/shared/schema";
import { SearchIcon, FilterIcon, ArrowUpDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Modal } from "./modalWindow/modal";

type ExerciseSelectModalProps = {
  exercises: ApiSchemas["Exercise"][];
  onSelect: (exerciseId: string) => void;
  isLoading?: boolean;
  close: () => void;
  isOpen: boolean;
};

type ExerciseType = "strength" | "cardio" | "flexibility" | "other";

const exerciseTypes: Record<ExerciseType, string> = {
  strength: "Силовые",
  cardio: "Кардио",
  flexibility: "Растяжка",
  other: "Другие",
};

export const ExerciseSelectModal: FC<ExerciseSelectModalProps> = ({
  exercises,
  onSelect,
  isOpen,
  close,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ExerciseType | "all">("all");
  const sortBy = "name";
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredExercises = exercises
    .filter((exercise) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((exercise) => {
      if (selectedType === "all") return true;
      return exercise.muscleGroups?.some((group) => {
        const lowerGroup = group.toLowerCase();
        return (
          lowerGroup.includes(selectedType) ||
          (selectedType === "strength" && lowerGroup.includes("strength")) ||
          (selectedType === "cardio" && lowerGroup.includes("cardio")) ||
          (selectedType === "flexibility" && lowerGroup.includes("flexibility"))
        );
      });
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

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      className="max-w-[95vw] w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl"
    >
      <div className="p-2 sm:p-4 overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-end">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск упражнений..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap justify-start w-full sm:justify-end sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  {selectedType === "all"
                    ? "Все типы"
                    : exerciseTypes[selectedType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setSelectedType("all")}>
                  Все типы
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedType("strength")}>
                  {exerciseTypes.strength}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedType("cardio")}>
                  {exerciseTypes.cardio}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSelectedType("flexibility")}
                >
                  {exerciseTypes.flexibility}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedType("other")}>
                  {exerciseTypes.other}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={toggleSortDirection}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              <ArrowUpDownIcon className="h-4 w-4 mr-2" />
              {sortBy === "name" ? "По названию" : "По типу"}
              {sortDirection === "asc" ? " ↑" : " ↓"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 w-full">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded animate-pulse w-full"
              />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[40vh] sm:h-[300px] md:h-[400px] lg:h-[500px] pr-4 w-full border rounded-lg overflow-hidden">
            <div className="space-y-2">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <Button
                    key={exercise.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3 text-left hover:bg-accent flex-col items-start"
                    onClick={() => handleSelect(exercise.id)}
                  >
                    <div className="flex flex-col items-start w-full gap-2">
                      <div className="flex items-center w-full flex-wrap gap-2">
                        <span className="font-medium text-left break-words">
                          {exercise.name}
                        </span>
                        {exercise.muscleGroups &&
                          exercise.muscleGroups.length > 0 &&
                          exercise.muscleGroups.map((muscleGroup) => (
                            <span
                              key={muscleGroup}
                              className="text-xs bg-muted px-2 py-1 rounded-full flex-shrink-0"
                            >
                              {muscleGroup}
                            </span>
                          ))}
                      </div>
                      {exercise.description && (
                        <span className="text-xs text-muted-foreground break-words w-full">
                          {exercise.description}
                        </span>
                      )}
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Упражнения не найдены
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </Modal>
  );
};
