import { useState, useEffect, FC } from "react";

import { useNavigate } from "react-router-dom";

import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { useOpen } from "@/shared/lib/useOpen";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Loader } from "@/shared/ui/kit/loader";
import { Progress } from "@/shared/ui/kit/progress";

import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { getIndex } from "../model/utils";

import styles from "./ActiveTrainingContent.module.scss";
import { ActiveTrainingHeader } from "./ActiveTrainingHeader";
import { NextExercises } from "./NextExercises/NextExercises";
import { NotedWeightModal } from "./NotedWeightModal";
import { RestTimer } from "./RestTimer";

export const ActiveTrainingContent: FC<{
  data: ApiSchemas["ActiveTraining"];
}> = ({ data }) => {
  const { end } = useEndActiveTraining();
  const { change, isPending } = useUpdateActiveTraining();

  const navigate = useNavigate();
  const { close, isOpen, open } = useOpen();

  const [trainingData, setTrainingData] =
    useState<ApiSchemas["ActiveTraining"]>(data);
  const [prevExercise, setPrevExercise] = useState(
    data.exercises[0]?.sets || [],
  );
  const [isResting, setIsResting] = useState(false);

  const indexCurrentExercise = getIndex(trainingData.exercises);

  const totalSets = trainingData.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const completedSets =
    trainingData.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((set) => set.done).length,
      0,
    ) / totalSets;

  const progress = totalSets > 0 ? completedSets * 100 : 0;

  const completeSet = async () => {
    const updatedExercises = trainingData.exercises.map((ex, index) => {
      if (index === indexCurrentExercise) {
        const doneSetsCount = ex.sets.filter((set) => set.done).length;

        return {
          ...ex,
          sets: ex.sets.map((set, setIndex) =>
            setIndex === doneSetsCount ? { ...set, done: true } : set,
          ),
        };
      }
      return ex;
    });

    setTrainingWrapper({
      ...trainingData,
      exercises: updatedExercises,
    });

    const nextIndex = getIndex(updatedExercises);

    if (nextIndex === -1) {
      finishTraining();
    }
  };

  const handleSetCompletion = () => {
    const currentSets = trainingData.exercises[
      indexCurrentExercise
    ]?.sets.filter((set) => set.done).length;

    setPrevExercise(
      trainingData.exercises[indexCurrentExercise]?.sets?.[currentSets]
        ? [trainingData.exercises[indexCurrentExercise]?.sets?.[currentSets]]
        : [],
    );
    setIsResting(true);
    open();
  };

  const finishTraining = async () => {
    const historyId = await end();
    navigate(`${ROUTES.END.replace(/:id/, historyId)}`);
  };

  const openChange = () => {
    setPrevExercise(trainingData.exercises[indexCurrentExercise]?.sets || []);
    open();
  };

  const setTrainingWrapper = (
    value: React.SetStateAction<ApiSchemas["ActiveTraining"]>,
  ) => {
    if (typeof value === "function") {
      const newData = value(trainingData);
      setTrainingData(newData);
      change(newData);
    } else {
      setTrainingData(value);
      change(value);
    }
  };

  useEffect(() => {
    setTrainingData(data);
  }, []);

  if (trainingData === undefined && trainingData["exercises"] === 0)
    return null;

  if (indexCurrentExercise === -1) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="large" />
        <span className="ml-4">
          {isPending ? "Сохранение изменений" : "Идет завершение тренировки"}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.layoutContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.headerSection}>
            <ActiveTrainingHeader
              name={trainingData.name}
              finishTraining={finishTraining}
            />
            <div className={styles.progressSection}>
              <div className={styles.progressText}>
                <span>Прогресс тренировки</span>
                <span>
                  {Math.round(progress)}% ({completedSets} подходов)
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
          <div className={styles.gridLayout}>
            <div className={styles.mainContent}>
              {trainingData.exercises[indexCurrentExercise]?.sets?.length >
                0 && (
                <CurrentExercise
                  exercise={trainingData.exercises[indexCurrentExercise]}
                  setTraining={setTrainingWrapper}
                  open={openChange}
                  onCompleteSet={handleSetCompletion}
                />
              )}
              {isResting && (
                <RestTimer
                  restTime={
                    trainingData.exercises[indexCurrentExercise]?.restTime
                  }
                  setIsResting={setIsResting}
                  isResting={isResting}
                />
              )}
              <h3 className={styles.sectionTitle}>Трекер подходов</h3>
              <SetTracker
                exercise={trainingData.exercises[indexCurrentExercise]}
                setTraining={setTrainingWrapper}
                indexCurrentExercise={indexCurrentExercise}
              />
            </div>
            <div className={styles.sidebarContent}>
              <NextExercises
                setTraining={setTrainingWrapper}
                indexCurrentExercise={indexCurrentExercise}
                training={trainingData}
              />
            </div>
          </div>
        </div>
        <NotedWeightModal
          close={close}
          currentExercise={trainingData.exercises[indexCurrentExercise]}
          currentExerciseIndex={indexCurrentExercise - 1}
          initialData={prevExercise}
          isOpen={isOpen}
          setTraining={setTrainingWrapper}
          completeSet={completeSet}
        />
      </div>
    </div>
  );
};
