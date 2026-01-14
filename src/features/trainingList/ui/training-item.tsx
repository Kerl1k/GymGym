import { useState } from "react";

import {
  DotsVerticalIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon,
  LayersIcon,
} from "@radix-ui/react-icons";
import { PenIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useStartActiveTraining } from "@/entities/training-active/use-active-training-start";
import { useOpen } from "@/shared/lib/useOpen";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { ModalDelete } from "@/shared/ui/kit/modalDelete";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";

import { useDeleteTraining } from "../../../entities/training/use-training-delete";

import { TrainingCreate } from "./training-create/training-create";

export function TrainingItem({
  training,
}: {
  training: ApiSchemas["Training"];
}) {
  const { deleteTraining, getIsPending } = useDeleteTraining();
  const { start } = useStartActiveTraining();

  const { open, close, isOpen } = useOpen();
  const [showAllExercises, setShowAllExercises] = useState(false);

  const navigator = useNavigate();
  const {
    open: openDelete,
    close: closeDelete,
    isOpen: isDeleteOpen,
  } = useOpen();

  const startTraining = async (id: string) => {
    start(id);
    navigator(ROUTES.START);
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200 border-border">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
              <PlayIcon className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                {training.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                  <ClockIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <DotsVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => startTraining(training.id)}
                className="gap-2 text-sm sm:text-base"
              >
                <PlayIcon className="h-4 w-4" />
                Начать тренировку
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => open()}
                className="gap-2 text-sm sm:text-base"
              >
                <PenIcon className="h-4 w-4" />
                Изменить
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDelete()}
                variant="destructive"
                className="gap-2 text-sm sm:text-base"
              >
                <TrashIcon className="h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-muted-foreground mb-2">
            <LayersIcon className="w-4 h-4" />
            <span>Упражнения ({training.exerciseTypes.length})</span>
          </div>

          <div className="space-y-2">
            {(showAllExercises
              ? training.exerciseTypes
              : training.exerciseTypes.slice(0, 5)
            ).map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-6 sm:w-8 h-6 sm:h-8 bg-background border border-border rounded-md flex items-center justify-center text-xs sm:text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-medium text-foreground">
                      {exercise.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {exercise.muscleGroups.slice(0, 3).map((muscleGroup) => (
                    <Badge
                      key={muscleGroup}
                      variant="secondary"
                      className="text-xs sm:text-sm capitalize"
                    >
                      {muscleGroup}
                    </Badge>
                  ))}
                  {exercise.muscleGroups.length > 3 && (
                    <div className="relative group">
                      <Badge
                        variant="secondary"
                        className="text-xs sm:text-sm capitalize cursor-pointer"
                      >
                        +{exercise.muscleGroups.length - 3}
                      </Badge>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-background border border-border rounded-md p-2 shadow-lg z-10">
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscleGroups.slice(3).map((muscleGroup) => (
                            <Badge
                              key={muscleGroup}
                              variant="secondary"
                              className="text-xs sm:text-sm capitalize"
                            >
                              {muscleGroup}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {training.exerciseTypes.length > 5 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-sm sm:text-base"
                  onClick={() => setShowAllExercises(!showAllExercises)}
                >
                  {showAllExercises
                    ? "Скрыть упражнения"
                    : `Показать остальные упражнения (${training.exerciseTypes.length - 5})`}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-sm sm:text-base w-full sm:w-auto"
            onClick={() => startTraining(training.id)}
          >
            <PlayIcon className="w-3 h-3" />
            Начать
          </Button>
        </div>
      </CardContent>
      <Modal close={close} isOpen={isOpen} title="Изменение тренировки">
        <TrainingCreate training={training} close={close} />
      </Modal>
      <ModalDelete
        isOpen={isDeleteOpen}
        close={closeDelete}
        onConfirm={() => deleteTraining(training.id)}
        isLoading={getIsPending(training.id)}
        title="Удаление тренировки"
        description={`Вы уверены, что хотите удалить тренировку "${training.name}"? Все данные будут безвозвратно удалены.`}
      />
    </Card>
  );
}
