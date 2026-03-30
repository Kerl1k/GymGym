import { useState, useEffect, FC, useMemo } from "react";

import { CheckCircle2Icon, PencilIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { useOpen } from "@/shared/lib/useOpen";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
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
  const [selectedCompletedExerciseIndex, setSelectedCompletedExerciseIndex] =
    useState<number | null>(null);

  const indexCurrentExercise = getIndex(trainingData.exercises);
  const activeExerciseIndex =
    selectedCompletedExerciseIndex ?? indexCurrentExercise;
  const activeExercise = trainingData.exercises[activeExerciseIndex];

  const completedExercises = useMemo(
    () =>
      trainingData.exercises
        .map((exercise, index) => ({ exercise, index }))
        .filter(
          ({ exercise }) =>
            exercise.sets.length > 0 && exercise.sets.every((set) => set.done),
        ),
    [trainingData.exercises],
  );

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

  const completeSet = async ({
    weight,
    repeatCount,
  }: {
    weight: number;
    repeatCount: number;
  }) => {
    const updatedExercises = trainingData.exercises.map((ex, index) => {
      if (index === activeExerciseIndex) {
        const doneSetsCount = ex.sets.filter((set) => set.done).length;

        return {
          ...ex,
          sets: ex.sets.map((set, setIndex) =>
            setIndex === doneSetsCount
              ? { done: true, repeatCount: repeatCount, weight: weight }
              : set,
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
    const currentExercise = trainingData.exercises[activeExerciseIndex];
    const currentSets = currentExercise?.sets.filter((set) => set.done).length;
    const isSelectedCompletedExercise =
      selectedCompletedExerciseIndex !== null &&
      selectedCompletedExerciseIndex !== indexCurrentExercise &&
      currentExercise?.sets.every((set) => set.done);

    setPrevExercise(
      currentExercise?.sets?.[currentSets]
        ? [currentExercise?.sets?.[currentSets]]
        : [],
    );

    if (!isSelectedCompletedExercise && currentExercise?.restTime !== 0) {
      setIsResting(true);
    }

    open();
  };

  const finishTraining = async () => {
    const historyId = await end();
    navigate(`${ROUTES.END.replace(/:id/, historyId)}`);
  };

  const openChange = () => {
    setPrevExercise(trainingData.exercises[activeExerciseIndex]?.sets || []);
    open();
  };

  const setTrainingWrapper = (
    value: React.SetStateAction<ApiSchemas["ActiveTraining"]>,
  ) => {
    const newData = typeof value === "function" ? value(trainingData) : value;
    setTrainingData(newData);
    change(newData);
  };

  useEffect(() => {
    setTrainingData(data);
  }, [data]);

  useEffect(() => {
    if (selectedCompletedExerciseIndex === null) return;

    const selectedExercise =
      trainingData.exercises[selectedCompletedExerciseIndex];
    if (!selectedExercise || !selectedExercise.sets.every((set) => set.done)) {
      setSelectedCompletedExerciseIndex(null);
    }
  }, [selectedCompletedExerciseIndex, trainingData.exercises]);

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
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
          <div className={styles.gridLayout}>
            <div className={styles.mainContent}>
              {activeExercise?.sets?.length > 0 && (
                <CurrentExercise
                  exercise={activeExercise}
                  setTraining={setTrainingWrapper}
                  open={openChange}
                  onCompleteSet={handleSetCompletion}
                />
              )}
              {isResting && (
                <RestTimer
                  restTime={
                    trainingData.exercises[indexCurrentExercise]?.restTime ?? 0
                  }
                  setIsResting={setIsResting}
                  isResting={isResting}
                />
              )}
              <h3 className={styles.sectionTitle}>Трекер подходов</h3>
              <SetTracker
                exercise={activeExercise}
                setTraining={setTrainingWrapper}
                indexCurrentExercise={activeExerciseIndex}
              />
            </div>
            <div className={styles.sidebarContent}>
              <NextExercises
                setTraining={setTrainingWrapper}
                indexCurrentExercise={indexCurrentExercise}
                training={trainingData}
              />
              <Card className="w-full overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl">
                    Выполненные упражнения
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 sm:space-y-3">
                  {selectedCompletedExerciseIndex !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedCompletedExerciseIndex(null)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
                    >
                      Вернуться к текущему упражнению
                    </button>
                  )}
                  {completedExercises.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Выполненных упражнений пока нет.
                    </div>
                  )}
                  {completedExercises.map(({ exercise, index }) => {
                    const isSelected = activeExerciseIndex === index;
                    return (
                      <button
                        key={`${exercise.id}-${index}`}
                        type="button"
                        onClick={() => setSelectedCompletedExerciseIndex(index)}
                        className={`w-full rounded-xl border p-3 text-left transition-all sm:p-4 ${
                          isSelected
                            ? "border-primary/50 bg-primary/10"
                            : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {exercise.name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                              <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                              {exercise.sets.length} / {exercise.sets.length}{" "}
                              подходов
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                            <PencilIcon className="h-3.5 w-3.5" />
                            Редактировать
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <NotedWeightModal
          close={close}
          currentExercise={activeExercise}
          initialData={prevExercise}
          isOpen={isOpen}
          completeSet={completeSet}
        />
      </div>
    </div>
  );
};
