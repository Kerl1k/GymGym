
import type { ApiSchemas } from "@/shared/schema";

import { activeTrainingKey, trainingByIdKey, trainingHistoryByIdKey } from "./offlineQueryKeys";

import type { QueryClient } from "@tanstack/react-query";

type ListPayload<T> = { content?: T[]; meta?: unknown };

function isTrainingListKey(key: unknown[]) {
  return key[0] === "get" && key[1] === "/api/training";
}

function isExerciseListKey(key: unknown[]) {
  return key[0] === "get" && key[1] === "/api/exercise-type";
}

export function patchCachesAfterOfflineMutation(
  queryClient: QueryClient,
  pathname: string,
  method: string,
  payload: unknown,
): void {
  const m = method.toUpperCase();

  if (m === "POST" && pathname === "/api/training" && payload && typeof payload === "object") {
    const training = payload as ApiSchemas["Training"];
    queryClient.setQueriesData<ListPayload<ApiSchemas["Training"]>>(
      { predicate: (q) => isTrainingListKey(q.queryKey as unknown[]) },
      (old) => {
        if (!old?.content) return old;
        if (old.content.some((t) => t.id === training.id)) return old;
        return { ...old, content: [...old.content, training] };
      },
    );
    queryClient.setQueryData(trainingByIdKey(training.id), training);
  }

  if (m === "PATCH" && pathname === "/api/training" && payload && typeof payload === "object") {
    const training = payload as ApiSchemas["Training"];
    queryClient.setQueriesData<ListPayload<ApiSchemas["Training"]>>(
      { predicate: (q) => isTrainingListKey(q.queryKey as unknown[]) },
      (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((t) => (t.id === training.id ? training : t)),
        };
      },
    );
    queryClient.setQueryData(trainingByIdKey(training.id), training);
  }

  if (m === "DELETE" && pathname.startsWith("/api/training/")) {
    const id = pathname.replace("/api/training/", "");
    queryClient.setQueriesData<ListPayload<ApiSchemas["Training"]>>(
      { predicate: (q) => isTrainingListKey(q.queryKey as unknown[]) },
      (old) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.filter((t) => t.id !== id) };
      },
    );
    queryClient.removeQueries({ queryKey: trainingByIdKey(id) });
  }

  if (m === "POST" && pathname === "/api/exercise-type" && payload && typeof payload === "object") {
    const ex = payload as ApiSchemas["ExerciseType"];
    queryClient.setQueriesData<ListPayload<ApiSchemas["ExerciseType"]>>(
      { predicate: (q) => isExerciseListKey(q.queryKey as unknown[]) },
      (old) => {
        if (!old?.content) return old;
        if (old.content.some((e) => e.id === ex.id)) return old;
        return { ...old, content: [...old.content, ex] };
      },
    );
  }

  if (m === "PATCH" && pathname === "/api/exercise-type" && payload && typeof payload === "object") {
    const ex = payload as ApiSchemas["ExerciseType"];
    queryClient.setQueriesData<ListPayload<ApiSchemas["ExerciseType"]>>(
      { predicate: (q) => isExerciseListKey(q.queryKey as unknown[]) },
      (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((e) => (e.id === ex.id ? ex : e)),
        };
      },
    );
  }

  if (m === "DELETE" && pathname.startsWith("/api/exercise-type/")) {
    const id = pathname.replace("/api/exercise-type/", "");
    queryClient.setQueriesData<ListPayload<ApiSchemas["ExerciseType"]>>(
      { predicate: (q) => isExerciseListKey(q.queryKey as unknown[]) },
      (old) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.filter((e) => e.id !== id) };
      },
    );
  }

  if (
    (m === "POST" && pathname === "/api/active-training/start") ||
    (m === "POST" && pathname === "/api/active-training/repeat")
  ) {
    if (payload && typeof payload === "object") {
      queryClient.setQueryData(activeTrainingKey, payload as ApiSchemas["ActiveTraining"]);
    }
  }

  if (m === "PATCH" && pathname === "/api/active-training/update" && payload && typeof payload === "object") {
    queryClient.setQueryData(activeTrainingKey, payload as ApiSchemas["ActiveTraining"]);
  }

  if (m === "POST" && pathname === "/api/active-training/end" && payload && typeof payload === "object") {
    queryClient.removeQueries({ queryKey: activeTrainingKey });
    const hist = payload as ApiSchemas["TrainingHistory"];
    queryClient.setQueryData(trainingHistoryByIdKey(hist.id), hist);
    queryClient.setQueriesData<ListPayload<ApiSchemas["TrainingHistory"]>>(
      { predicate: (q) => (q.queryKey as unknown[])[1] === "/api/training-history" },
      (old) => {
        if (!old?.content) return old;
        if (old.content.some((h) => h.id === hist.id)) return old;
        return { ...old, content: [hist, ...old.content] };
      },
    );
  }

  if (m === "POST" && pathname === "/api/active-training/cancel") {
    queryClient.removeQueries({ queryKey: activeTrainingKey });
  }

  if (m === "PATCH" && pathname === "/api/training-history" && payload && typeof payload === "object") {
    const hist = payload as ApiSchemas["TrainingHistory"];
    queryClient.setQueryData(trainingHistoryByIdKey(hist.id), hist);
    queryClient.setQueriesData<ListPayload<ApiSchemas["TrainingHistory"]>>(
      { predicate: (q) => (q.queryKey as unknown[])[1] === "/api/training-history" },
      (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((h) => (h.id === hist.id ? hist : h)),
        };
      },
    );
  }

  if (m === "DELETE" && pathname.startsWith("/api/training-history/")) {
    const id = pathname.replace("/api/training-history/", "");
    queryClient.removeQueries({ queryKey: trainingHistoryByIdKey(id) });
    queryClient.setQueriesData<ListPayload<ApiSchemas["TrainingHistory"]>>(
      { predicate: (q) => (q.queryKey as unknown[])[1] === "/api/training-history" },
      (old) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.filter((h) => h.id !== id) };
      },
    );
  }
}
