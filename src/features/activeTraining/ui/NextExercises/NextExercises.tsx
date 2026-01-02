import { FC } from "react";

import { PlusIcon } from "lucide-react";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useOpen } from "@/shared/lib/useOpen";
import { ApiSchemas } from "@/shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";

type NextExercisesProps = {
  indexCurrentExercise: number;
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  training: ApiSchemas["ActiveTraining"];
};

export const NextExercises: FC<NextExercisesProps> = ({
  training,
  setTraining,
  indexCurrentExercise,
}) => {
  const {
    close: closeExerciseModal,
    isOpen: isExerciseModalOpen,
    open: openExerciseModal,
  } = useOpen();

  const { exercises, isPending: isExercisesLoading } = useExercisesFetchList(
    {},
  );

  const addExercise = (exerciseId: string) => {
    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    if (!selectedExercise) return;

    setTraining((prev) => {
      const newExercise = {
        id: selectedExercise.id,
        name: selectedExercise.name,
        description: selectedExercise.description || "",
        restTime: 90,
        sets: [
          {
            weight: 0,
            repeatCount: 12,
            done: false,
          },
        ],
        muscleGroups: selectedExercise.muscleGroups || [],
        useCustomSets: false,
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Следующие упражнения
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 overflow-hidden">
        {training.exercises
          .slice(indexCurrentExercise + 1)
          .map((exercise, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center text-sm sm:text-base font-medium text-muted-foreground">
                {indexCurrentExercise + index + 2}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {exercise.name}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {exercise.sets.length} подходов ×{" "}
                  {exercise.sets.reduce((sum, set) => sum + set.weight, 0)} кг
                </div>
              </div>
            </div>
          ))}

        <div
          className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-dashed border-border bg-card hover:border-primary cursor-pointer transition-colors"
          onClick={openExerciseModal}
        >
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center text-sm sm:text-base font-medium text-primary">
            <PlusIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-primary truncate">
              Добавить упражнение
            </div>
          </div>
        </div>
      </CardContent>
      <ExerciseSelectModal
        exercises={exercises}
        onSelect={addExercise}
        isOpen={isExerciseModalOpen}
        close={closeExerciseModal}
        isLoading={isExercisesLoading}
      />
    </Card>
  );
};
