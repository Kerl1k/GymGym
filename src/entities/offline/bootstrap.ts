import { exercisesStore } from "@/entities/exercises/exercises.store";
import { trainingStore } from "@/entities/training/training.store";
import { activeTrainingStore } from "@/entities/training-active/active-training.store";
import { trainingHistoryStore } from "@/entities/training-history/training-history.store";

import { connectivityStore } from "./connectivity";
import { syncEngine } from "./sync-engine";

let bootstrapPromise: Promise<void> | null = null;

/** Safe to call from several places: every caller awaits the same run. */
export function bootstrapOffline(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((error: unknown) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  connectivityStore.start();

  syncEngine.bindHooks({
    replaceExerciseId: (tempId, serverExercise) => {
      exercisesStore.replaceId(tempId, serverExercise);
    },
    replaceTrainingId: (tempId, serverTraining) => {
      trainingStore.replaceId(tempId, serverTraining);
    },
    applyExerciseSnapshot: (content) => {
      exercisesStore.applySnapshot(content);
    },
    applyTrainingSnapshot: (content) => {
      trainingStore.applySnapshot(content);
    },
    applyActiveTraining: (data) => {
      activeTrainingStore.applyActiveTraining(data);
    },
    replaceHistoryId: (localHistoryId, serverHistory) =>
      trainingHistoryStore.adoptServerHistory(localHistoryId, serverHistory),
    acceptsActiveSnapshot: () => activeTrainingStore.acceptsIncomingActive(),
    refetchAfterSync: async () => {
      // end() waits on this flush. These GETs have no timeout, so a stalled
      // catalog refetch used to freeze the finish screen after the workout
      // itself was already saved.
      if (activeTrainingStore.isEnding) return;

      const skipActive = activeTrainingStore.isStarting;
      await Promise.allSettled([
        exercisesStore.fetchList(20, true),
        trainingStore.fetchList(
          {
            page: 1,
            limit: 20,
            filter: JSON.stringify(undefined),
            orderBy: JSON.stringify(undefined),
          },
          true,
        ),
        trainingHistoryStore.fetchList({ limit: 40 }, true),
        skipActive ? Promise.resolve() : activeTrainingStore.fetch(true),
      ]);
    },
  });

  await Promise.allSettled([
    exercisesStore.hydrateFromCache(),
    trainingStore.hydrateFromCache(),
    activeTrainingStore.hydrateFromCache(),
    trainingHistoryStore.hydrateFromCache(),
  ]);

  syncEngine.start();
}
