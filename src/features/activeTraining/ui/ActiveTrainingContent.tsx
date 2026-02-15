import { useState, useEffect, FC } from "react";

import { useNavigate } from "react-router-dom";

import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { useOpen } from "@/shared/lib/useOpen";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Progress } from "@/shared/ui/kit/progress";

import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";

import styles from "./ActiveTrainingContent.module.scss";
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

  const [prevExercise, setPrevExercise] = useState(
    training.exercises[0]?.sets || [],
  );

  const [isResting, setIsResting] = useState(false);
  const indexCurrentExercise = training.exercises.findIndex((ex) => {
    const doneSetsCount = ex.sets.filter((set) => set.done).length;

    return doneSetsCount !== ex.sets.length;
  });

  const restTime =
    indexCurrentExercise === -1 ||
    !training.exercises[indexCurrentExercise]?.restTime
      ? 90
      : training.exercises[indexCurrentExercise]?.restTime || 90;

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
        setPrevExercise([currentEx.sets[currentExSets - 1]]);
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

  const finishTraining = async () => {
    await end();
    navigate(ROUTES.END);
  };

  const openChange = () => {
    setPrevExercise(training.exercises[indexCurrentExercise]?.sets || []);
    open();
  };

  useEffect(() => {
    setTraining(data);
  }, [data]);

  if (training === undefined && training["exercises"] === 0) return null;
  console.log(training);
  if (indexCurrentExercise === -1) {
    finishTraining();
  }

  return (
    <div className={styles.container}>
      <div className={styles.layoutContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.headerSection}>
            <ActiveTrainingHeader
              name={training.name}
              finishTraining={finishTraining}
            />
            <div className={styles.progressSection}>
              <div className={styles.progressText}>
                <span>Прогресс тренировки</span>
                <span>
                  {Math.round(progress)}% ({completedSets}/{totalSets} подходов)
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
          <div className={styles.gridLayout}>
            <div className={styles.mainContent}>
              {training.exercises[indexCurrentExercise]?.sets?.length > 0 && (
                <CurrentExercise
                  exercise={training.exercises[indexCurrentExercise]}
                  setTraining={setTraining}
                  open={openChange}
                  onCompleteSet={completeSet}
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
              <h3 className={styles.sectionTitle}>Трекер подходов</h3>
              <SetTracker
                exercise={training.exercises[indexCurrentExercise]}
                setTraining={setTraining}
                indexCurrentExercise={indexCurrentExercise}
              />
            </div>
            <div className={styles.sidebarContent}>
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
          currentExerciseIndex={indexCurrentExercise - 1}
          initialData={prevExercise}
          isOpen={isOpen}
          setTraining={setTraining}
        />
      </div>
    </div>
  );
};
