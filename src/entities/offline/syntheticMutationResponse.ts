
import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import type { ApiSchemas } from "@/shared/schema";

import {
  findExerciseType,
  findTrainingHistoryById,
  findTrainingTemplate,
  getCachedActiveTraining,
} from "./cacheLookup";

import type { QueryClient } from "@tanstack/react-query";

function safeJsonParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function trainingTemplateToActive(
  training: ApiSchemas["Training"],
  dateStart: string,
  queryClient: QueryClient,
): ApiSchemas["ActiveTraining"] {
  return {
    dateStart,
    name: training.name,
    description: training.description,
    exercises: training.exerciseTypes.map((et) => {
      const catalog = findExerciseType(queryClient, et.id);
      const units = unitsFromCatalogStrings(catalog?.units);
      return {
        id: et.id,
        name: et.name,
        description: et.description || "",
        restTime: et.restTime ?? catalog?.restTime ?? 90,
        muscleGroups: et.muscleGroups ?? catalog?.muscleGroups ?? [],
        useCustomSets: true,
        sets: [{ units, done: false }],
      };
    }),
  };
}

function historyToActive(
  history: ApiSchemas["TrainingHistory"],
  dateStart: string,
): ApiSchemas["ActiveTraining"] {
  return {
    dateStart,
    name: history.name,
    description: history.description,
    exercises: history.exercises.map((ex, i) => ({
      id: `history-ex-${i}-${crypto.randomUUID().slice(0, 8)}`,
      name: ex.name,
      description: ex.description,
      restTime: ex.restTime,
      muscleGroups: ex.muscleGroups,
      useCustomSets: ex.useCustomSets,
      sets: ex.sets,
    })),
  };
}

export function buildSyntheticJson(
  pathname: string,
  method: string,
  bodyText: string | null,
  queryClient: QueryClient,
): unknown {
  const m = method.toUpperCase();

  if (m === "POST" && pathname === "/api/training") {
    const body = safeJsonParse<ApiSchemas["TrainingCreateBody"]>(bodyText);
    if (!body) return {};
    const id = crypto.randomUUID();
    const exerciseTypes = body.exerciseTypes.map((ref) => {
      const et = findExerciseType(queryClient, ref.id);
      if (et) {
        return {
          id: et.id,
          name: et.name,
          favorite: et.favorite,
          description: et.description,
          muscleGroups: et.muscleGroups,
          restTime: et.restTime,
        };
      }
      return {
        id: ref.id,
        name: "",
        favorite: false,
        description: "",
        muscleGroups: [] as string[],
        restTime: 90,
      };
    });
    const row: ApiSchemas["Training"] = {
      id,
      name: body.name,
      favorite: body.favorite ?? false,
      description: body.description ?? "",
      exerciseTypes,
    };
    return row;
  }

  if (m === "PATCH" && pathname === "/api/training") {
    const patch = safeJsonParse<ApiSchemas["TrainingUpdateBody"]>(bodyText);
    if (!patch) return {};
    const base = findTrainingTemplate(queryClient, patch.id);
    if (!base) return { ...patch, id: patch.id } as ApiSchemas["Training"];
    const exerciseTypes = patch.exerciseTypes
      ? patch.exerciseTypes.map((ref) => {
          const fromBase = base.exerciseTypes.find((x) => x.id === ref.id);
          const et = findExerciseType(queryClient, ref.id);
          if (fromBase) return fromBase;
          if (et) {
            return {
              id: et.id,
              name: et.name,
              favorite: et.favorite,
              description: et.description,
              muscleGroups: et.muscleGroups,
              restTime: et.restTime,
            };
          }
          return {
            id: ref.id,
            name: "",
            favorite: false,
            description: "",
            muscleGroups: [] as string[],
            restTime: 90,
          };
        })
      : base.exerciseTypes;
    return {
      ...base,
      ...patch,
      exerciseTypes,
    } satisfies ApiSchemas["Training"];
  }

  if (m === "DELETE" && pathname.startsWith("/api/training/")) {
    return {};
  }

  if (m === "POST" && pathname === "/api/active-training/start") {
    const b = safeJsonParse<ApiSchemas["ActiveTrainingStartBody"]>(bodyText);
    if (!b) return {};
    const tpl = findTrainingTemplate(queryClient, b.id);
    if (!tpl) return trainingTemplateToActive(
      {
        id: b.id,
        name: "Тренировка",
        favorite: false,
        description: "",
        exerciseTypes: [],
      },
      b.dateStart,
      queryClient,
    );
    return trainingTemplateToActive(tpl, b.dateStart, queryClient);
  }

  if (m === "PATCH" && pathname === "/api/active-training/update") {
    const parsed = safeJsonParse<ApiSchemas["ActiveTraining"]>(bodyText);
    if (parsed) return parsed;
    return getCachedActiveTraining(queryClient) ?? {};
  }

  if (m === "POST" && pathname === "/api/active-training/end") {
    const active = getCachedActiveTraining(queryClient);
    const histId = crypto.randomUUID();
    if (!active) {
      return {
        id: histId,
        name: "",
        description: "",
        exercises: [],
        dateStart: new Date().toISOString(),
      } satisfies ApiSchemas["TrainingHistory"];
    }
    return {
      id: histId,
      name: active.name,
      description: active.description,
      exercises: active.exercises.map(
        ({ name, description, restTime, sets, muscleGroups, useCustomSets }) => ({
          name,
          description,
          restTime,
          sets,
          muscleGroups,
          useCustomSets,
        }),
      ),
      dateStart: active.dateStart,
    } satisfies ApiSchemas["TrainingHistory"];
  }

  if (m === "POST" && pathname === "/api/active-training/cancel") {
    return {};
  }

  if (m === "POST" && pathname === "/api/active-training/repeat") {
    const b = safeJsonParse<ApiSchemas["ActiveTrainingRepeatParams"]>(bodyText);
    if (!b) return {};
    const hist = findTrainingHistoryById(queryClient, b.trainingHistoryId);
    if (!hist) return { dateStart: b.dateStart, name: "", description: "", exercises: [] };
    return historyToActive(hist, b.dateStart);
  }

  if (m === "POST" && pathname === "/api/exercise-type") {
    const body = safeJsonParse<ApiSchemas["ExerciseTypeCreateBody"]>(bodyText);
    if (!body) return {};
    const id = crypto.randomUUID();
    const row: ApiSchemas["ExerciseType"] = {
      id,
      name: body.name,
      favorite: body.favorite ?? false,
      description: body.description ?? "",
      restTime: body.restTime ?? 90,
      muscleGroups: body.muscleGroups ?? [],
      units: body.units ?? [],
    };
    return row;
  }

  if (m === "PATCH" && pathname === "/api/exercise-type") {
    const patch = safeJsonParse<ApiSchemas["ExerciseTypeUpdateBody"]>(bodyText);
    if (!patch) return {};
    const base = findExerciseType(queryClient, patch.id);
    if (!base) return patch;
    return { ...base, ...patch } satisfies ApiSchemas["ExerciseType"];
  }

  if (m === "DELETE" && pathname.startsWith("/api/exercise-type/")) {
    return {};
  }

  if (m === "PATCH" && pathname === "/api/training-history") {
    const patch = safeJsonParse<ApiSchemas["TrainingHistoryUpdate"]>(bodyText);
    if (!patch) return {};
    const base = findTrainingHistoryById(queryClient, patch.id);
    if (!base) return patch;
    return { ...base, ...patch } satisfies ApiSchemas["TrainingHistory"];
  }

  if (m === "DELETE" && pathname.startsWith("/api/training-history/")) {
    return {};
  }

  return {};
}
