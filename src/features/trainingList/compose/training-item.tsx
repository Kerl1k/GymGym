import { ApiSchemas } from "@/shared/schema";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { Badge } from "@/shared/ui/kit/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import {
  DotsVerticalIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon,
  LayersIcon,
} from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { href, Link } from "react-router-dom";
import { ROUTES } from "@/shared/model/routes";
import { useDeleteTraining } from "../../../entities/training/use-training-delete";
import { PenIcon } from "lucide-react";
import { useOpen } from "@/shared/lib/useOpen";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { ModalDelete } from "@/shared/ui/kit/modalDelete";
import { TrainingCreate } from "../ui/training-create/exercises-create";
import { useState } from "react";

export function TrainingItem({
  training,
}: {
  training: ApiSchemas["Training"];
}) {
  const { deleteTraining, getIsPending } = useDeleteTraining();
  const { open, close, isOpen } = useOpen();
  const [showAllExercises, setShowAllExercises] = useState(false);
  const {
    open: openDelete,
    close: closeDelete,
    isOpen: isDeleteOpen,
  } = useOpen();

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {training.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-xs text-gray-500">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  <span>
                    {training?.createdAt &&
                      new Date(training?.createdAt).toLocaleDateString(
                        "ru-RU",
                        {
                          day: "numeric",
                          month: "short",
                        },
                      )}
                  </span>
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
              <Link
                to={href(ROUTES.ACTIVE_TRAINING, { trainingId: training.id })}
              >
                <DropdownMenuItem className="gap-2">
                  <PlayIcon className="h-4 w-4" />
                  Начать тренировку
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => open()} className="gap-2">
                <PenIcon className="h-4 w-4" />
                Изменить
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDelete()}
                variant="destructive"
                className="gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <LayersIcon className="w-4 h-4" />
            <span>Упражнения ({training.exercises.length})</span>
          </div>

          <div className="space-y-2">
            {(showAllExercises
              ? training.exercises
              : training.exercises.slice(0, 5)
            ).map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {exercise.name}
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="text-xs capitalize">
                  {exercise.type}
                </Badge>
              </div>
            ))}
            {training.exercises.length > 5 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAllExercises(!showAllExercises)}
                >
                  {showAllExercises
                    ? "Скрыть упражнения"
                    : `Показать остальные упражнения (${training.exercises.length - 5})`}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Link to={href(ROUTES.ACTIVE_TRAINING, { trainingId: training.id })}>
            <Button size="lg" variant="outline" className="gap-2">
              <PlayIcon className="w-3 h-3" />
              Начать
            </Button>
          </Link>
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
