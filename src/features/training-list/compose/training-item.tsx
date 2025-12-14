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
// import { useDeleteTraining } from "../model/use-delete-training";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { href, Link } from "react-router-dom";
import { ROUTES } from "@/shared/model/routes";

export function TrainingItem({
  training,
}: {
  training: ApiSchemas["Training"];
}) {
  // const deleteTraining = useDeleteTraining();

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
              <DropdownMenuItem className="gap-2">
                <PlayIcon className="h-4 w-4" />
                <Link
                  to={href(ROUTES.START_TRAINING, { trainingId: training.id })}
                >
                  Начать тренировку
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="gap-2">
                <TrashIcon className="h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {training.exercises && training.exercises.length > 0 ? (
          <>
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <LayersIcon className="w-4 h-4" />
                <span>Упражнения ({training.exercises.length})</span>
              </div>

              <div className="space-y-2">
                {training.exercises.map((exercise, index) => (
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
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  /* TODO: реализовать начало тренировки */
                }}
              >
                <PlayIcon className="w-4 h-4" />
                Начать
              </Button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="text-gray-400 mb-2">Нет добавленных упражнений</div>
            <Button size="sm" variant="ghost">
              Добавить упражнение
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
