import { useState, useEffect, FC, useCallback, useRef } from "react";

import { CheckCircle2Icon, PencilIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import { useOpen } from "@/shared/lib/useOpen";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";
import { Loader } from "@/shared/ui/kit/loader";
import { Progress } from "@/shared/ui/kit/progress";

import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { getIndex } from "../model/utils";

import styles from "./ActiveTrainingContent.module.scss";
import { ActiveTrainingHeader } from "./ActiveTrainingHeader";
import { NotedWeightModal } from "./NotedWeightModal";
import { RestTimer } from "./RestTimer";

export const ActiveTrainingContent: FC<{
  data: ApiSchemas["ActiveTraining"];
}> = ({ data }) => {
  const { end } = useEndActiveTraining();
  const { change, isPending } = useUpdateActiveTraining();

  const navigate = useNavigate();
  const { close, isOpen, open } = useOpen();
  const {
    close: closeExerciseModal,
    isOpen: isExerciseModalOpen,
    open: openExerciseModal,
  } = useOpen();
  const { exercises, isPending: isExercisesLoading } = useExercisesFetchList(
    {},
  );

  const [trainingData, setTrainingData] =
    useState<ApiSchemas["ActiveTraining"]>(data);
  const [prevExercise, setPrevExercise] = useState(
    data.exercises[0]?.sets || [],
  );
  const [isResting, setIsResting] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null);

  const syncTimeoutRef = useRef<number | null>(null);
  const latestTrainingRef = useRef<ApiSchemas["ActiveTraining"]>(data);
  const syncChainRef = useRef<Promise<void>>(Promise.resolve());

  const indexCurrentExercise = getIndex(trainingData.exercises);
  const activeExerciseIndex = selectedExerciseIndex ?? indexCurrentExercise;
  const activeExercise = trainingData.exercises[activeExerciseIndex];

  useEffect(() => {
    latestTrainingRef.current = trainingData;
  }, [trainingData]);

  const flushTrainingSync = useCallback(async () => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    const snapshot = latestTrainingRef.current;
    syncChainRef.current = syncChainRef.current.then(() => change(snapshot));
    await syncChainRef.current;
  }, [change]);

  const addExercise = (exerciseId: string) => {
    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    if (!selectedExercise) return;

    setTrainingWrapper((prev) => {
      const newExercise = {
        id: selectedExercise.id,
        name: selectedExercise.name,
        description: selectedExercise.description || "",
        restTime: 90,
        sets: [
          {
            units: unitsFromCatalogStrings(selectedExercise.units),
            done: false,
          },
        ],
        muscleGroups: selectedExercise.muscleGroups || [],
        useCustomSets: true,
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  };

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

  const completeSet = async (completedSet: ApiSchemas["Set"]) => {
    const updatedExercises = trainingData.exercises.map((ex, index) => {
      if (index === activeExerciseIndex) {
        const doneSetsCount = ex.sets.filter((set) => set.done).length;

        return {
          ...ex,
          sets: ex.sets.map((set, setIndex) =>
            setIndex === doneSetsCount ? { ...completedSet, done: true } : set,
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

  const handleSetCompletion = async () => {
    const currentExercise = trainingData.exercises[activeExerciseIndex];
    const currentSets = currentExercise?.sets.filter((set) => set.done).length;
    const isSelectedFullyCompletedExercise =
      selectedExerciseIndex !== null &&
      selectedExerciseIndex !== indexCurrentExercise &&
      currentExercise?.sets.every((set) => set.done);

    setPrevExercise(
      currentExercise?.sets?.[currentSets]
        ? [currentExercise?.sets?.[currentSets]]
        : [],
    );

    if (!isSelectedFullyCompletedExercise && currentExercise?.restTime !== 0) {
      setIsResting(true);
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          const readyReg = reg ?? (await navigator.serviceWorker.ready);

          const NOTIFICATION_TAG = "gym-rest-timer";
          const title = "Отдых окончен";
          const body = "Можно приступать к следующему подходу.";
          const options: NotificationOptions = {
            body,
            tag: NOTIFICATION_TAG,
            requireInteraction: true,
          };

          if (readyReg.active) {
            readyReg.active.postMessage({
              type: "SCHEDULE_REST_NOTIFICATION",
              title,
              options,
            });
          }
          await readyReg.showNotification(title, options);
        }
      } catch {
        /* fallback */
      }
    }

    open();
  };

  const finishTraining = async () => {
    await flushTrainingSync();
    const historyId = await end();
    navigate(`${ROUTES.END.replace(/:id/, historyId)}`);
  };

  const setTrainingWrapper = (
    value: React.SetStateAction<ApiSchemas["ActiveTraining"]>,
    options?: { flush?: boolean },
  ) => {
    setTrainingData((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      latestTrainingRef.current = next;

      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

      if (options?.flush) {
        const snapshot = next;
        syncChainRef.current = syncChainRef.current.then(() => change(snapshot));
        return next;
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        const snapshot = latestTrainingRef.current;
        syncChainRef.current = syncChainRef.current.then(() => change(snapshot));
      }, 600);

      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setTrainingData(data);
  }, [data]);

  useEffect(() => {
    if (selectedExerciseIndex === null) return;
    const selectedExercise = trainingData.exercises[selectedExerciseIndex];
    if (!selectedExercise) setSelectedExerciseIndex(null);
  }, [selectedExerciseIndex, trainingData.exercises]);

  if (!trainingData || trainingData.exercises.length === 0) return null;

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
              exerciseId={activeExercise?.id}
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
                  onCompleteSet={handleSetCompletion}
                />
              )}
              {isResting && (
                <RestTimer
                  restTime={
                    trainingData.exercises[activeExerciseIndex]?.restTime ?? 0
                  }
                  setIsResting={setIsResting}
                  isResting={isResting}
                />
              )}
              <SetTracker
                exercise={activeExercise}
                setTraining={setTrainingWrapper}
                indexCurrentExercise={activeExerciseIndex}
              />
            </div>
            <div className={styles.sidebarContent}>
              <Card className="w-full overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl">
                    Упражнения
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 sm:space-y-3">
                  {selectedExerciseIndex !== null &&
                    selectedExerciseIndex !== indexCurrentExercise && (
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseIndex(null)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
                      >
                        Вернуться к текущему упражнению
                      </button>
                    )}

                  {trainingData.exercises.map((exercise, index) => {
                    const isSelected = activeExerciseIndex === index;
                    const isCompleted =
                      exercise.sets.length > 0 &&
                      exercise.sets.every((set) => set.done);
                    const doneCount = exercise.sets.filter(
                      (s) => s.done,
                    ).length;

                    return (
                      <button
                        key={`${exercise.id}-${index}`}
                        type="button"
                        onClick={() => setSelectedExerciseIndex(index)}
                        className={`w-full rounded-xl border p-3 text-left transition-all sm:p-4 ${
                          isSelected
                            ? "border-primary/50 bg-primary/10"
                            : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {index + 1}. {exercise.name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                              {isCompleted && (
                                <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                              )}
                              {doneCount} / {exercise.sets.length} подходов
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={openExerciseModal}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5 sm:p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary">
                      <PlusIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-primary">
                        Добавить упражнение
                      </span>
                    </span>
                  </button>
                </CardContent>
              </Card>

              <ExerciseSelectModal
                exercises={exercises}
                onSelect={addExercise}
                isOpen={isExerciseModalOpen}
                close={closeExerciseModal}
                isLoading={isExercisesLoading}
              />
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
