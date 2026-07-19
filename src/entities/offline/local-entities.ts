import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import type { ApiSchemas } from "@/shared/schema";

export function buildActiveTrainingFromTemplate(
  training: ApiSchemas["Training"],
  dateStart: string,
  exerciseCatalog?: ApiSchemas["ExerciseType"][],
): ApiSchemas["ActiveTraining"] {
  const byId = new Map((exerciseCatalog ?? []).map((item) => [item.id, item]));

  return {
    dateStart,
    name: training.name,
    description: training.description,
    exercises: training.exerciseTypes.map((exerciseType) => {
      const catalog = byId.get(exerciseType.id);
      return {
        id: exerciseType.id,
        name: exerciseType.name,
        description: exerciseType.description || "",
        restTime: exerciseType.restTime || catalog?.restTime || 90,
        sets: [
          {
            units: unitsFromCatalogStrings(catalog?.units),
            done: false,
          },
        ],
        muscleGroups: exerciseType.muscleGroups || catalog?.muscleGroups || [],
        useCustomSets: false,
      };
    }),
  };
}

export function createLocalExercise(
  body: ApiSchemas["ExerciseTypeCreateBody"],
  tempId = crypto.randomUUID(),
): ApiSchemas["ExerciseType"] {
  return {
    id: tempId,
    name: body.name,
    favorite: body.favorite ?? false,
    description: body.description ?? "",
    restTime: body.restTime ?? 90,
    muscleGroups: body.muscleGroups ?? [],
    units: body.units ?? ["Вес", "Повторения"],
  };
}

export function createLocalTraining(
  body: ApiSchemas["TrainingCreateBody"],
  exerciseCatalog: ApiSchemas["ExerciseType"][],
  tempId = crypto.randomUUID(),
): ApiSchemas["Training"] {
  const byId = new Map(exerciseCatalog.map((item) => [item.id, item]));

  return {
    id: tempId,
    name: body.name,
    favorite: body.favorite ?? false,
    description: body.description ?? "",
    exerciseTypes: body.exerciseTypes.map((ref) => {
      const exercise = byId.get(ref.id);
      return {
        id: ref.id,
        name: exercise?.name ?? "Упражнение",
        favorite: exercise?.favorite ?? false,
        description: exercise?.description ?? "",
        muscleGroups: exercise?.muscleGroups ?? [],
        restTime: exercise?.restTime ?? 90,
      };
    }),
  };
}
