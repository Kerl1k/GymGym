import { useState, useEffect, FC, useCallback, useRef, useMemo } from "react";

import { useNavigate } from "react-router-dom";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { connectivityStore, syncEngine } from "@/entities/offline";
import {
  isLocalHistoryId,
} from "@/entities/training-active/active-training.store";
import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { useLatestTrainingHistoryByName } from "@/entities/training-history/use-latest-training-history-by-name";
import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import { runInBackground } from "@/shared/lib/background";
import { toast } from "@/shared/lib/toast";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { useOpen } from "@/shared/lib/useOpen";
import { useWakeLock } from "@/shared/lib/useWakeLock";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";
import { Loader } from "@/shared/ui/kit/loader";

import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { getIndex } from "../model/utils";

import styles from "./ActiveTrainingContent.module.scss";
import { ActiveTrainingHeader } from "./ActiveTrainingHeader";
import { ExercisesSidebar } from "./ExercisesSidebar";
import { NotedWeightModal } from "./NotedWeightModal";
import { RestTimer } from "./RestTimer";

type TrainingSyncStatus = "synced" | "syncing" | "error" | "offline";
const SYNC_DEBOUNCE_MS = 1200;
const DEFAULT_REST_TIME_SEC = 90;

function toActiveExercise(
  exercise: ApiSchemas["ExerciseType"],
  setsCount: number,
): ApiSchemas["ActiveTraining"]["exercises"][number] {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description || "",
    restTime: exercise.restTime > 0 ? exercise.restTime : DEFAULT_REST_TIME_SEC,
    sets: Array.from({ length: setsCount }, () => ({
      units: unitsFromCatalogStrings(exercise.units),
      done: false,
    })),
    muscleGroups: exercise.muscleGroups || [],
    useCustomSets: true,
  };
}

type ActiveTrainingContentProps = {
  data: ApiSchemas["ActiveTraining"];
  onFinishStart: () => void;
  onFinishError: () => void;
};

export const ActiveTrainingContent: FC<ActiveTrainingContentProps> = ({
  data,
  onFinishStart,
  onFinishError,
}) => {
  const { end } = useEndActiveTraining();
  const { change } = useUpdateActiveTraining();
  useWakeLock();

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

  const engineStatus = useMobxSelector(() => {
    if (!connectivityStore.isOnline) return "offline" as const;
    if (syncEngine.status === "syncing") return "syncing" as const;
    if (syncEngine.status === "error" || syncEngine.pendingCount > 0) {
      return syncEngine.status === "error" ? ("error" as const) : ("syncing" as const);
    }
    return "synced" as const;
  });

  const [trainingData, setTrainingData] =
    useState<ApiSchemas["ActiveTraining"]>(data);
  const [prevExercise, setPrevExercise] = useState(
    data.exercises[0]?.sets || [],
  );
  const [isResting, setIsResting] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const { latestHistory } = useLatestTrainingHistoryByName({
    trainingName: trainingData.name,
  });

  const latestTrainingRef = useRef<ApiSchemas["ActiveTraining"]>(data);
  const pendingRestMsRef = useRef<number>(0);
  const syncTimeoutRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(false);

  const syncStatus: TrainingSyncStatus = engineStatus;

  const indexCurrentExercise = getIndex(trainingData.exercises);
  const activeExerciseIndex = selectedExerciseIndex ?? indexCurrentExercise;
  const activeExercise = trainingData.exercises[activeExerciseIndex];
  const isViewingPastExercise =
    selectedExerciseIndex !== null &&
    selectedExerciseIndex !== indexCurrentExercise;
  const previousSetsByExerciseName = useMemo(() => {
    const grouped = new Map<string, ApiSchemas["Set"][]>();
    if (!latestHistory?.exercises) return grouped;

    latestHistory.exercises.forEach((exercise) => {
      grouped.set(exercise.name, exercise.sets ?? []);
    });

    return grouped;
  }, [latestHistory]);
  const previousSetsForActiveExercise = activeExercise
    ? previousSetsByExerciseName.get(activeExercise.name) ?? []
    : [];

  useEffect(() => {
    latestTrainingRef.current = trainingData;
  }, [trainingData]);

  const flushTrainingSync = useCallback(async () => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    const snapshot = latestTrainingRef.current;
    await change(snapshot);
  }, [change]);

  const scheduleTrainingSync = useCallback(
    (snapshot: ApiSchemas["ActiveTraining"], immediate = false) => {
      latestTrainingRef.current = snapshot;

      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }

      if (immediate) {
        runInBackground(flushTrainingSync(), "Не удалось сохранить тренировку");
        return;
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        syncTimeoutRef.current = null;
        runInBackground(flushTrainingSync(), "Не удалось сохранить тренировку");
      }, SYNC_DEBOUNCE_MS);
    },
    [flushTrainingSync],
  );

  const addExercise = (exerciseId: string) => {
    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    if (!selectedExercise) return;

    setTrainingWrapper((prev) => ({
      ...prev,
      exercises: [...prev.exercises, toActiveExercise(selectedExercise, 1)],
    }));
  };

  const [replaceExerciseIndex, setReplaceExerciseIndex] = useState<
    number | null
  >(null);

  const replacementCandidates = useMemo(() => {
    if (replaceExerciseIndex === null) return [];
    const usedNames = new Set(trainingData.exercises.map((ex) => ex.name));
    return exercises.filter((ex) => !usedNames.has(ex.name));
  }, [exercises, replaceExerciseIndex, trainingData.exercises]);

  const replaceExercise = (exerciseId: string) => {
    const index = replaceExerciseIndex;
    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    setReplaceExerciseIndex(null);
    if (index === null || !selectedExercise) return;

    setTrainingWrapper((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index
          ? toActiveExercise(selectedExercise, Math.max(ex.sets.length, 1))
          : ex,
      ),
    }));
    toast.success(`Упражнение заменено на «${selectedExercise.name}»`);
  };

  const completeSet = async (
    completedSet: ApiSchemas["Set"],
  ): Promise<{ finished: boolean }> => {
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

    const nextTraining = {
      ...trainingData,
      exercises: updatedExercises,
    };

    // Keep the ref in sync before any setState/unmount — the last set
    // used to be lost because finishTraining ran before React flushed.
    latestTrainingRef.current = nextTraining;
    setTrainingWrapper(nextTraining);

    const nextIndex = getIndex(updatedExercises);

    if (nextIndex === -1) {
      await finishTraining(nextTraining);
      return { finished: true };
    }
    return { finished: false };
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

    pendingRestMsRef.current =
      !isSelectedFullyCompletedExercise && (currentExercise?.restTime ?? 0) > 0
        ? (currentExercise?.restTime ?? 0) * 1000
        : 0;

    open();
  };

  const handleAfterNotedWeightClose = useCallback(() => {
    const delayMs = pendingRestMsRef.current;
    pendingRestMsRef.current = 0;

    if (delayMs > 0) {
      setIsResting(true);
    }
  }, []);

  const finishTraining = async (
    snapshot?: ApiSchemas["ActiveTraining"],
  ) => {
    const finalData = snapshot ?? latestTrainingRef.current;
    latestTrainingRef.current = finalData;
    onFinishStart();
    setIsResting(false);
    // end() sends finalData itself, so the debounced update is redundant.
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    try {
      const historyId = await end(finalData);
      if (isLocalHistoryId(historyId)) {
        navigate(ROUTES.TRAINING);
        return;
      }
      navigate(ROUTES.END.replace(":id", historyId));
    } catch (error) {
      console.error("Не удалось завершить тренировку", error);
      onFinishError();
    }
  };

  const setTrainingWrapper = (
    value: React.SetStateAction<ApiSchemas["ActiveTraining"]>,
  ) => {
    if (typeof value === "function") {
      setTrainingData((prev) => {
        const next = value(prev);
        scheduleTrainingSync(next);
        return next;
      });
      return;
    }

    scheduleTrainingSync(value);
    setTrainingData(value);
  };

  useEffect(() => {
    if (hasHydratedRef.current) {
      if (data.dateStart === latestTrainingRef.current.dateStart) return;
      setTrainingData(data);
      latestTrainingRef.current = data;
      return;
    }

    hasHydratedRef.current = true;
    setTrainingData(data);
    latestTrainingRef.current = data;
  }, [data]);

  const changeRef = useRef(change);
  changeRef.current = change;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
        runInBackground(
          changeRef.current(latestTrainingRef.current),
          "Не удалось сохранить тренировку",
        );
      }
    };
  }, []);

  const handleRetrySync = useCallback(async () => {
    setIsRetryingSync(true);
    try {
      await flushTrainingSync();
      await syncEngine.flush({ force: true });
    } catch (error) {
      console.error("Не удалось повторить синхронизацию", error);
    } finally {
      if (isMountedRef.current) setIsRetryingSync(false);
    }
  }, [flushTrainingSync]);

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
        <span className="ml-4">Идет завершение тренировки</span>
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
              syncStatus={syncStatus}
              onRetrySync={handleRetrySync}
              isRetryingSync={isRetryingSync}
            />
          </div>
          <div className={styles.gridLayout}>
            <div className={styles.mainContent}>
              {activeExercise?.sets?.length > 0 && (
                <CurrentExercise
                  exercise={activeExercise}
                  setTraining={setTrainingWrapper}
                  onCompleteSet={handleSetCompletion}
                  showCompleteButton={!isViewingPastExercise}
                  previousSets={previousSetsForActiveExercise}
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
                <CardContent>
                  <ExercisesSidebar
                    exercises={trainingData.exercises}
                    indexCurrentExercise={indexCurrentExercise}
                    activeExerciseIndex={activeExerciseIndex}
                    selectedExerciseIndex={selectedExerciseIndex}
                    setSelectedExerciseIndex={setSelectedExerciseIndex}
                    setTraining={setTrainingWrapper}
                    openExerciseModal={openExerciseModal}
                    onReplaceExercise={setReplaceExerciseIndex}
                  />
                </CardContent>
              </Card>

              <ExerciseSelectModal
                exercises={exercises}
                onSelect={addExercise}
                isOpen={isExerciseModalOpen}
                close={closeExerciseModal}
                isLoading={isExercisesLoading}
              />
              <ExerciseSelectModal
                exercises={replacementCandidates}
                onSelect={replaceExercise}
                isOpen={replaceExerciseIndex !== null}
                close={() => setReplaceExerciseIndex(null)}
                isLoading={isExercisesLoading}
                searchPlaceholder="Найти замену..."
              />
            </div>
          </div>
        </div>
        <NotedWeightModal
          close={close}
          onAfterClose={handleAfterNotedWeightClose}
          currentExercise={activeExercise}
          initialData={prevExercise}
          previousSets={previousSetsForActiveExercise}
          isOpen={isOpen}
          completeSet={completeSet}
        />
      </div>
    </div>
  );
};
