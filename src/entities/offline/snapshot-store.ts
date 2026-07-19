import type { ApiSchemas } from "@/shared/schema";

import {
  SNAPSHOT_ACTIVE,
  SNAPSHOT_EXERCISES,
  SNAPSHOT_TRAININGS,
  STORE_SNAPSHOTS,
  idbGet,
  idbSet,
} from "./db";

import type {
  ActiveTrainingSnapshot,
  ExercisesSnapshot,
  TrainingsSnapshot,
} from "./types";

export async function readExercisesSnapshot(): Promise<ExercisesSnapshot | null> {
  return (await idbGet<ExercisesSnapshot>(STORE_SNAPSHOTS, SNAPSHOT_EXERCISES)) ?? null;
}

export async function writeExercisesSnapshot(
  content: ApiSchemas["ExerciseType"][],
): Promise<void> {
  const payload: ExercisesSnapshot = {
    content,
    updatedAt: Date.now(),
  };
  await idbSet(STORE_SNAPSHOTS, SNAPSHOT_EXERCISES, payload);
}

export async function readTrainingsSnapshot(): Promise<TrainingsSnapshot | null> {
  return (await idbGet<TrainingsSnapshot>(STORE_SNAPSHOTS, SNAPSHOT_TRAININGS)) ?? null;
}

export async function writeTrainingsSnapshot(
  content: ApiSchemas["Training"][],
): Promise<void> {
  const payload: TrainingsSnapshot = {
    content,
    updatedAt: Date.now(),
  };
  await idbSet(STORE_SNAPSHOTS, SNAPSHOT_TRAININGS, payload);
}

export async function readActiveTrainingSnapshot(): Promise<ActiveTrainingSnapshot | null> {
  return (await idbGet<ActiveTrainingSnapshot>(STORE_SNAPSHOTS, SNAPSHOT_ACTIVE)) ?? null;
}

export async function writeActiveTrainingSnapshot(
  data: ApiSchemas["ActiveTraining"] | null,
): Promise<void> {
  const payload: ActiveTrainingSnapshot = {
    data,
    updatedAt: Date.now(),
  };
  await idbSet(STORE_SNAPSHOTS, SNAPSHOT_ACTIVE, payload);
}

export async function upsertExerciseInSnapshot(
  exercise: ApiSchemas["ExerciseType"],
): Promise<ApiSchemas["ExerciseType"][]> {
  const current = (await readExercisesSnapshot())?.content ?? [];
  const next = [exercise, ...current.filter((item) => item.id !== exercise.id)];
  await writeExercisesSnapshot(next);
  return next;
}

export async function removeExerciseFromSnapshot(
  exerciseId: string,
): Promise<ApiSchemas["ExerciseType"][]> {
  const current = (await readExercisesSnapshot())?.content ?? [];
  const next = current.filter((item) => item.id !== exerciseId);
  await writeExercisesSnapshot(next);
  return next;
}

export async function upsertTrainingInSnapshot(
  training: ApiSchemas["Training"],
): Promise<ApiSchemas["Training"][]> {
  const current = (await readTrainingsSnapshot())?.content ?? [];
  const next = [training, ...current.filter((item) => item.id !== training.id)];
  await writeTrainingsSnapshot(next);
  return next;
}

export async function removeTrainingFromSnapshot(
  trainingId: string,
): Promise<ApiSchemas["Training"][]> {
  const current = (await readTrainingsSnapshot())?.content ?? [];
  const next = current.filter((item) => item.id !== trainingId);
  await writeTrainingsSnapshot(next);
  return next;
}

export async function remapSnapshotsIds(
  tempId: string,
  serverId: string,
): Promise<void> {
  if (!tempId || !serverId || tempId === serverId) return;

  const exercises = await readExercisesSnapshot();
  if (exercises) {
    await writeExercisesSnapshot(
      exercises.content.map((item) =>
        item.id === tempId ? { ...item, id: serverId } : item,
      ),
    );
  }

  const trainings = await readTrainingsSnapshot();
  if (trainings) {
    await writeTrainingsSnapshot(
      trainings.content.map((training) => {
        const nextTraining =
          training.id === tempId ? { ...training, id: serverId } : { ...training };
        nextTraining.exerciseTypes = nextTraining.exerciseTypes.map((exercise) =>
          exercise.id === tempId ? { ...exercise, id: serverId } : exercise,
        );
        return nextTraining;
      }),
    );
  }

  const active = await readActiveTrainingSnapshot();
  if (active?.data) {
    await writeActiveTrainingSnapshot({
      ...active.data,
      exercises: active.data.exercises.map((exercise) =>
        exercise.id === tempId ? { ...exercise, id: serverId } : exercise,
      ),
    });
  }
}
