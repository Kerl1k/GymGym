import { useState, useEffect, FC, useCallback, useRef, useMemo } from "react";


import { useNavigate } from "react-router-dom";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import {
  clearActiveTrainingDraft,
  readActiveTrainingDraft,
  writeActiveTrainingDraft,
} from "@/entities/training-active/active-training-cache";
import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { useEndActiveTraining } from "@/entities/training-active/use-active-training-end";
import { useLatestTrainingHistoryByName } from "@/entities/training-history/use-latest-training-history-by-name";
import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import { showRestTimerDoneNotification } from "@/shared/lib/restTimerNotification";
import { useOpen } from "@/shared/lib/useOpen";
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

type TrainingSyncStatus = "synced" | "syncing" | "error";
const SYNC_DEBOUNCE_MS = 1200;
const AUTO_RETRY_MS = 15000;

export const ActiveTrainingContent: FC<{
  data: ApiSchemas["ActiveTraining"];
}> = ({ data }) => {
  const { end } = useEndActiveTraining();
  const { change } = useUpdateActiveTraining();

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

  const cachedDraft = readActiveTrainingDraft();
  const initialData =
    cachedDraft && cachedDraft.data.dateStart === data.dateStart
      ? cachedDraft.data
      : data;

  const [trainingData, setTrainingData] =
    useState<ApiSchemas["ActiveTraining"]>(initialData);
  const [prevExercise, setPrevExercise] = useState(
    initialData.exercises[0]?.sets || [],
  );
  const [isResting, setIsResting] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null);
  const [syncStatus, setSyncStatus] = useState<TrainingSyncStatus>(() =>
    cachedDraft && !cachedDraft.isSynced ? "error" : "synced",
  );
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const { latestHistory } = useLatestTrainingHistoryByName({
    trainingName: trainingData.name,
  });

  const latestTrainingRef = useRef<ApiSchemas["ActiveTraining"]>(initialData);
  const syncChainRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRestMsRef = useRef<number>(0);
  const syncTimeoutRef = useRef<number | null>(null);
  const hasPendingSyncRef = useRef(false);
  const hasHydratedCacheRef = useRef(false);

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
    if (!hasPendingSyncRef.current) return;

    hasPendingSyncRef.current = false;
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    const snapshot = latestTrainingRef.current;
    setSyncStatus("syncing");

    syncChainRef.current = syncChainRef.current.then(async () => {
      try {
        await change(snapshot);

        if (latestTrainingRef.current === snapshot && !hasPendingSyncRef.current) {
          setSyncStatus("synced");
          writeActiveTrainingDraft(snapshot, true);
          clearActiveTrainingDraft();
        }
      } catch {
        hasPendingSyncRef.current = true;
        setSyncStatus("error");
        writeActiveTrainingDraft(snapshot, false);
      }
    });

    await syncChainRef.current;
  }, [change]);

  const scheduleTrainingSync = useCallback(
    (snapshot: ApiSchemas["ActiveTraining"], immediate = false) => {
      latestTrainingRef.current = snapshot;
      hasPendingSyncRef.current = true;
      setSyncStatus("syncing");
      writeActiveTrainingDraft(snapshot, false);

      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }

      if (immediate) {
        void flushTrainingSync();
        return;
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        syncTimeoutRef.current = null;
        void flushTrainingSync();
      }, SYNC_DEBOUNCE_MS);
    },
    [flushTrainingSync],
  );

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

    pendingRestMsRef.current =
      !isSelectedFullyCompletedExercise && (currentExercise?.restTime ?? 0) > 0
        ? (currentExercise?.restTime ?? 0) * 1000
        : 0;

    open();
  };

  const scheduleRestNotification = useCallback(async (delayMs: number) => {
    if (delayMs <= 0) return;

    window.setTimeout(() => {
      void showRestTimerDoneNotification();
    }, delayMs);
  }, []);

  const handleAfterNotedWeightClose = useCallback(() => {
    const delayMs = pendingRestMsRef.current;
    pendingRestMsRef.current = 0;

    if (delayMs > 0) {
      setIsResting(true);
      void scheduleRestNotification(delayMs);
    }
  }, [scheduleRestNotification]);

  const finishTraining = async () => {
    await flushTrainingSync();
    const historyId = await end();
    clearActiveTrainingDraft();
    navigate(`${ROUTES.END.replace(/:id/, historyId)}`);
  };

  const setTrainingWrapper = (
    value: React.SetStateAction<ApiSchemas["ActiveTraining"]>,
  ) => {
    setTrainingData((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      scheduleTrainingSync(next);
      return next;
    });
  };

  useEffect(() => {
    if (hasHydratedCacheRef.current) {
      if (data.dateStart === latestTrainingRef.current.dateStart) return;
      hasPendingSyncRef.current = false;
      setSyncStatus("synced");
      clearActiveTrainingDraft();
      setTrainingData(data);
      latestTrainingRef.current = data;
      return;
    }

    hasHydratedCacheRef.current = true;
    const draft = readActiveTrainingDraft();
    if (draft && draft.data.dateStart === data.dateStart) {
      setTrainingData(draft.data);
      latestTrainingRef.current = draft.data;
      if (!draft.isSynced) {
        hasPendingSyncRef.current = true;
        setSyncStatus("error");
        void flushTrainingSync();
      } else {
        setSyncStatus("synced");
      }
      return;
    }

    setTrainingData(data);
    latestTrainingRef.current = data;
  }, [data, flushTrainingSync]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (syncStatus !== "error") return;

    const timer = window.setInterval(() => {
      void flushTrainingSync();
    }, AUTO_RETRY_MS);

    return () => window.clearInterval(timer);
  }, [flushTrainingSync, syncStatus]);

  const handleRetrySync = useCallback(async () => {
    setIsRetryingSync(true);
    try {
      await flushTrainingSync();
    } finally {
      setIsRetryingSync(false);
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
            {/* <div className={styles.progressSection}>
              <div className={styles.progressText}>
                <span>Прогресс тренировки</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div> */}
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
