import { useState, useEffect, FC } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Progress } from "@/shared/ui/kit/progress";
import { TrainingStats } from "../components/training-stats";
import { ROUTES } from "@/shared/model/routes";
import { useOpen } from "@/shared/lib/useOpen";
import { ChangeModal } from "./ChangeModal";
import { ApiSchemas } from "@/shared/schema";
import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { RestTimer } from "./RestTimer";
import { ActiveTrainingHeader } from "./ActiveTrainingHeader";

export const ActiveTrainingContent: FC<{
  data: ApiSchemas["ActiveTraining"];
}> = ({ data }) => {
  const navigate = useNavigate();
  const { close, isOpen, open } = useOpen();
  const [training, setTraining] = useState(data);

  const [isResting, setIsResting] = useState(false);

  const indexCurrentExercise = training.exercises.findIndex(
    (ex) => ex.completedSets !== ex.sets.length,
  );

  const totalSets = training.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const completedSets = training.exercises.reduce(
    (sum, ex) => sum + ex.completedSets,
    0,
  );

  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // // Функция для завершения подхода
  const completeSet = (exerciseId: string) => {
    setTraining((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id === exerciseId && ex.completedSets < ex.sets.length) {
          return { ...ex, completedSets: ex.completedSets + 1 };
        }
        return ex;
      });

      // Если все подходы текущего упражнения выполнены, переходим к следующему
      const currentEx = updatedExercises[indexCurrentExercise];
      if (currentEx.completedSets >= currentEx.sets.length) {
        setIsResting(true);
        return {
          ...prev,
          exercises: updatedExercises,
        };
      }

      // Начинаем отдых
      setIsResting(true);

      return {
        ...prev,
        exercises: updatedExercises,
      };
    });
  };

  // Функция для завершения тренировки
  const finishTraining = () => {
    navigate(ROUTES.HOME);
  };

  useEffect(() => {
    setTraining(data);
  }, [data]);

  if (training === undefined && training["exercises"] === 0) return null;
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <ActiveTrainingHeader
            finishTraining={finishTraining}
            trainingLength={training.exercises.length}
            indexCurrentExercise={indexCurrentExercise}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Прогресс тренировки</span>
              <span>
                {Math.round(progress)}% ({completedSets}/{totalSets} подходов)
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {training.exercises[indexCurrentExercise].sets.length > 0 && (
              <CurrentExercise
                exercise={training.exercises[indexCurrentExercise]}
                setTraining={setTraining}
                open={open}
              />
            )}
            {isResting && (
              <RestTimer
                currentRestTime={
                  training.exercises[indexCurrentExercise].restTime
                }
                setIsResting={setIsResting}
                isResting={isResting}
              />
            )}
            Трекер подходов
            <SetTracker
              exercise={training.exercises[indexCurrentExercise]}
              onCompleteSet={() =>
                completeSet(training.exercises[indexCurrentExercise].id)
              }
            />
          </div>
          <div className="space-y-6">
            <TrainingStats training={training} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Следующие упражнения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {training.exercises
                  .slice(indexCurrentExercise + 1)
                  .map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {indexCurrentExercise + index + 2}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {exercise.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {exercise.sets.length} ×{" "}
                          {exercise.sets.reduce(
                            (sum, set) => sum + set.weight,
                            0,
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ChangeModal
        currentExercise={training.exercises[indexCurrentExercise]}
        close={close}
        isOpen={isOpen}
      />
    </div>
  );
};
