import type { ApiSchemas } from "@/shared/schema";

import type { Query, QueryClient } from "@tanstack/react-query";


type TrainingRow = ApiSchemas["Training"];
type ExerciseRow = ApiSchemas["ExerciseType"];
type TrainingListPayload = { content?: TrainingRow[] };
type ExerciseListPayload = { content?: ExerciseRow[] };
type TrainingHistoryRow = ApiSchemas["TrainingHistory"];

function matchesMethodPath(
  query: Query,
  method: string,
  path: string | ((p: string) => boolean),
) {
  const key = query.queryKey as unknown[];
  if (key[0] !== method || typeof key[1] !== "string") return false;
  const p = key[1];
  return typeof path === "function" ? path(p) : p === path;
}

export function getCachedActiveTraining(
  queryClient: QueryClient,
): ApiSchemas["ActiveTraining"] | undefined {
  const queries = queryClient.getQueryCache().findAll({
    predicate: (q) =>
      matchesMethodPath(q, "get", (p) => p === "/api/active-training"),
  });
  for (const q of queries) {
    const d = q.state.data as ApiSchemas["ActiveTraining"] | undefined;
    if (d && Array.isArray(d.exercises)) return d;
  }
  return undefined;
}

export function findTrainingTemplate(
  queryClient: QueryClient,
  templateId: string,
): TrainingRow | undefined {
  const idQueries = queryClient.getQueryCache().findAll({
    predicate: (q) => matchesMethodPath(q, "get", (p) => p === "/api/training/{id}"),
  });
  for (const q of idQueries) {
    const key = q.queryKey as unknown[];
    const init = key[2] as { params?: { path?: { id?: string } } } | undefined;
    if (init?.params?.path?.id === templateId) {
      const d = q.state.data as TrainingRow | undefined;
      if (d?.id === templateId) return d;
    }
  }

  const listQueries = queryClient.getQueryCache().findAll({
    predicate: (q) =>
      matchesMethodPath(q, "get", (p) => p === "/api/training"),
  });
  for (const q of listQueries) {
    const data = q.state.data as TrainingListPayload | undefined;
    const hit = data?.content?.find((t) => t.id === templateId);
    if (hit) return hit;
  }
  return undefined;
}

export function findExerciseType(
  queryClient: QueryClient,
  exerciseId: string,
): ExerciseRow | undefined {
  const queries = queryClient.getQueryCache().findAll({
    predicate: (q) =>
      matchesMethodPath(q, "get", (p) => p === "/api/exercise-type"),
  });
  for (const q of queries) {
    const data = q.state.data as ExerciseListPayload | undefined;
    const hit = data?.content?.find((e) => e.id === exerciseId);
    if (hit) return hit;
  }
  return undefined;
}

export function findTrainingHistoryById(
  queryClient: QueryClient,
  historyId: string,
): TrainingHistoryRow | undefined {
  const queries = queryClient.getQueryCache().findAll({
    predicate: (q) =>
      matchesMethodPath(q, "get", (p) => p === "/api/training-history/{id}"),
  });
  for (const q of queries) {
    const key = q.queryKey as unknown[];
    const init = key[2] as { params?: { path?: { id?: string } } } | undefined;
    if (init?.params?.path?.id === historyId) {
      const d = q.state.data as TrainingHistoryRow | undefined;
      if (d) return d;
    }
  }
  return undefined;
}

export function findTrainingById(
  queryClient: QueryClient,
  trainingId: string,
): TrainingRow | undefined {
  const tpl = findTrainingTemplate(queryClient, trainingId);
  if (tpl) return tpl;
  return undefined;
}
