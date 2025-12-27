import { useState, useEffect, FC } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Progress } from "@/shared/ui/kit/progress";
import { TrainingStats } from "../components/training-stats";
import { ROUTES } from "@/shared/model/routes";
import { useOpen } from "@/shared/lib/useOpen";
import { ApiSchemas } from "@/shared/schema";
import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { RestTimer } from "./RestTimer";
import { ActiveTrainingHeader } from "./ActiveTrainingHeader";
import { NotedWeightModal } from "./NotedWeightModal";

export const ActiveTrainingContent: FC<{
  data: ApiSchemas["ActiveTraining"];
}> = ({ data }) => {
  const navigate = useNavigate();
  const { close, isOpen, open } = useOpen();
  const [training, setTraining] = useState(data);

  const [prevExercise, setPrevExercise] = useState(training.exercises[0].sets);

  const [isResting, setIsResting] = useState(false);

  const indexCurrentExercise = training.exercises.findIndex(
    (ex) => ex.completedSets !== ex.sets.length,
  );

  const restTime =
    training.exercises[indexCurrentExercise].restTime === 0
      ? 90
      : training.exercises[indexCurrentExercise].restTime;

  const [timeLeft, setTimeLeft] = useState(restTime);

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
      const currentEx = updatedExercises[indexCurrentExercise];
      if (currentEx.completedSets >= currentEx.sets.length) {
        setPrevExercise(currentEx.sets);
        setIsResting(true);
        open();

        const returnValue = {
          ...prev,
          exercises: updatedExercises,
        };

        const nextIndex = returnValue.exercises.findIndex(
          (ex) => ex.completedSets !== ex.sets.length,
        );

        if (nextIndex === -1) {
          finishTraining();
        }

        return returnValue;
      }
      setPrevExercise([currentEx.sets[currentEx.completedSets - 1]]);
      open();

      if (isResting) {
        setTimeLeft(restTime);
      } else {
        setIsResting(true);
      }
      return {
        ...prev,
        exercises: updatedExercises,
      };
    });
  };

  const finishTraining = () => {
    navigate(ROUTES.TEST);
  };

  const openChange = () => {
    setPrevExercise(training.exercises[indexCurrentExercise].sets);
    open();
  };

  useEffect(() => {
    setTraining(data);
  }, [data]);

  if (training === undefined && training["exercises"] === 0) return null;
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <ActiveTrainingHeader
            finishTraining={finishTraining}
            trainingLength={training.exercises.length}
            indexCurrentExercise={indexCurrentExercise}
          />
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm sm:text-base text-muted-foreground gap-1">
              <span>Прогресс тренировки</span>
              <span>
                {Math.round(progress)}% ({completedSets}/{totalSets} подходов)
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 lg:col-span-2 space-y-4 sm:space-y-6">
            {training.exercises[indexCurrentExercise].sets.length > 0 && (
              <CurrentExercise
                exercise={training.exercises[indexCurrentExercise]}
                setTraining={setTraining}
                open={openChange}
              />
            )}
            {isResting && (
              <RestTimer
                setTimeLeft={setTimeLeft}
                timeLeft={timeLeft}
                restTime={restTime}
                setIsResting={setIsResting}
                isResting={isResting}
              />
            )}
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Трекер подходов
            </h3>
            <SetTracker
              exercise={training.exercises[indexCurrentExercise]}
              onCompleteSet={() =>
                completeSet(training.exercises[indexCurrentExercise].id)
              }
            />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <TrainingStats training={training} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Следующие упражнения
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {training.exercises
                  .slice(indexCurrentExercise + 1)
                  .map((exercise, index) => (
                    <div
                      key={exercise.id}
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
                          {exercise.sets.length} ×
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
      <NotedWeightModal
        close={close}
        currentExercise={training.exercises[indexCurrentExercise]}
        initialData={prevExercise}
        isOpen={isOpen}
        setTraining={setTraining}
      />
    </div>
  );
};
