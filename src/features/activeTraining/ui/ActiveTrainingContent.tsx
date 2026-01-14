import { useState, useEffect, FC } from "react";

import { useNavigate } from "react-router-dom";

import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { useOpen } from "@/shared/lib/useOpen";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Progress } from "@/shared/ui/kit/progress";

import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { TrainingStats } from "../components/training-stats";

import { ActiveTrainingHeader } from "./ActiveTrainingHeader";
import { NextExercises } from "./NextExercises/NextExercises";
import { NotedWeightModal } from "./NotedWeightModal";
import { RestTimer } from "./RestTimer";

export const ActiveTrainingContent: FC<{
  data: ApiSchemas["ActiveTraining"];
}> = ({ data }) => {
  const { end } = useEndActiveTraining();

  const navigate = useNavigate();
  const { close, isOpen, open } = useOpen();
  const [training, setTraining] = useState(data);

  const [prevExercise, setPrevExercise] = useState(training.exercises[0].sets);

  const [isResting, setIsResting] = useState(false);

  const indexCurrentExercise = training.exercises.findIndex((ex) => {
    const doneSetsCount = ex.sets.filter((set) => set.done).length;

    return doneSetsCount !== ex.sets.length;
  });

  const restTime =
    !training.exercises[indexCurrentExercise].restTime ||
    indexCurrentExercise === -1
      ? 90
      : training.exercises[indexCurrentExercise].restTime;

  const [timeLeft, setTimeLeft] = useState(restTime);

  const totalSets = training.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const completedSets = training.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((set) => set.done).length,
    0,
  );

  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const completeSet = () => {
    setTraining((prev) => {
      const updatedExercises = prev.exercises.map((ex, index) => {
        if (index === indexCurrentExercise) {
          const doneSetsCount = ex.sets.filter((set) => set.done).length;

          return {
            ...ex,
            sets: ex.sets.map((set, index) =>
              index === doneSetsCount ? { ...set, done: true } : set,
            ),
          };
        }
        return ex;
      });

      const currentEx = updatedExercises[indexCurrentExercise];

      const currentExSets = currentEx.sets.filter((set) => set.done).length;

      if (currentExSets >= currentEx.sets.length) {
        setPrevExercise(currentEx.sets);
        setIsResting(true);
        open();

        const returnValue = {
          ...prev,
          exercises: updatedExercises,
        };

        const nextIndex = returnValue.exercises.findIndex(
          (ex) => ex.sets.filter((set) => set.done).length !== ex.sets.length,
        );

        if (nextIndex === -1) {
          finishTraining();
        }

        return returnValue;
      }
      setPrevExercise([currentEx.sets[currentExSets - 1]]);
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
    navigate(ROUTES.END);
    end();
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
      <div className="max-w-full mx-auto w-full overflow-hidden">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-6 sm:mb-8">
            <ActiveTrainingHeader
              name={training.name}
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
            <div className="md:col-span-2 lg:col-span-2 space-y-4 sm:space-y-6 overflow-hidden">
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
                onCompleteSet={completeSet}
                setTraining={setTraining}
                indexCurrentExercise={indexCurrentExercise}
              />
            </div>
            <div className="md:col-span-1 lg:col-span-1 space-y-4 sm:space-y-6">
              <TrainingStats training={training} />
              <NextExercises
                setTraining={setTraining}
                indexCurrentExercise={indexCurrentExercise}
                training={training}
              />
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
    </div>
  );
};
