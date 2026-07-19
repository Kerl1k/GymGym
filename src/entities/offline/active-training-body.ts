import type { ApiSchemas } from "@/shared/schema";

/** PATCH body without exercise ids — matches UpdateActiveTrainingBody. */
export function toUpdateActiveTrainingBody(
  data: ApiSchemas["ActiveTraining"],
): ApiSchemas["UpdateActiveTrainingBody"] {
  return {
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
