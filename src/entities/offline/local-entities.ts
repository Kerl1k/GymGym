import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import { normalizeRestTime } from "@/shared/lib/rest-time";
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
        restTime: normalizeRestTime(
          exerciseType.restTime ?? catalog?.restTime,
        ),
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

export function historyFromActiveTraining(
  data: ApiSchemas["ActiveTraining"],
  id: string,
): ApiSchemas["TrainingHistory"] {
  return {
    id,
    dateStart: data.dateStart,
    name: data.name,
    description: data.description,
    exercises: data.exercises.map((exercise) => ({
      name: exercise.name,
      description: exercise.description,
      restTime: exercise.restTime,
      sets: exercise.sets,
      muscleGroups: exercise.muscleGroups,
      useCustomSets: exercise.useCustomSets,
    })),
  };
}

export function buildActiveTrainingFromHistory(
  history: ApiSchemas["TrainingHistory"],
  dateStart: string,
): ApiSchemas["ActiveTraining"] {
  return {
    dateStart,
    name: history.name,
    description: history.description,
    exercises: history.exercises.map((exercise) => ({
      id: "",
      name: exercise.name,
      description: exercise.description || "",
      restTime: normalizeRestTime(exercise.restTime),
      sets:
        exercise.sets.length > 0
          ? exercise.sets.map((set) => ({
              units: set.units.map((unit) => ({
                name: unit.name,
                value: unit.value,
              })),
              done: false,
            }))
          : [{ units: [], done: false }],
      muscleGroups: exercise.muscleGroups || [],
      useCustomSets: exercise.useCustomSets,
    })),
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
    restTime: normalizeRestTime(body.restTime),
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
        restTime: normalizeRestTime(exercise?.restTime),
      };
    }),
  };
}
