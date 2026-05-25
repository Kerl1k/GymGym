import { queryClient } from "@/entities/query-client";
import type { ApiSchemas } from "@/shared/schema";

import { trainingByIdKey } from "./offlineQueryKeys";
import {
  applyIdMapToBody,
  getIdMap,
  getOutboxEntries,
  mergeIdMap,
  removeOutboxEntry,
} from "./outboxOps";

import type { OutboxEntry } from "./types";

let draining = false;

async function authHeaders(): Promise<HeadersInit> {
  const { useSession } = await import("@/shared/model/session");
  const token = await useSession.getState().refreshToken();
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function remapTrainingInClient(
  clientId: string,
  server: ApiSchemas["Training"],
): void {
  queryClient.setQueryData(trainingByIdKey(clientId), undefined);
  queryClient.setQueryData(trainingByIdKey(server.id), server);
  queryClient.setQueriesData(
    {
      predicate: (q) => {
        const k = q.queryKey as unknown[];
        return k[0] === "get" && k[1] === "/api/training";
      },
    },
    (old: { content?: ApiSchemas["Training"][] } | undefined) => {
      if (!old?.content) return old;
      return {
        ...old,
        content: old.content.map((t) =>
          t.id === clientId ? server : t.id === server.id ? server : t,
        ),
      };
    },
  );
}

function remapExerciseInClient(
  clientId: string,
  server: ApiSchemas["ExerciseType"],
): void {
  queryClient.setQueriesData(
    {
      predicate: (q) => {
        const k = q.queryKey as unknown[];
        return k[0] === "get" && k[1] === "/api/exercise-type";
      },
    },
    (old: { content?: ApiSchemas["ExerciseType"][] } | undefined) => {
      if (!old?.content) return old;
      return {
        ...old,
        content: old.content.map((e) =>
          e.id === clientId ? server : e.id === server.id ? server : e,
        ),
      };
    },
  );
}

async function handlePostSuccess(entry: OutboxEntry, res: Response): Promise<void> {
  const pathname = new URL(entry.url).pathname;
  const text = await res.clone().text();
  if (!text) return;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return;
  }

  if (pathname === "/api/training" && entry.method.toUpperCase() === "POST") {
    const clientId = entry.context?.clientTrainingId;
    const server = data as ApiSchemas["Training"];
    if (clientId && server?.id && clientId !== server.id) {
      await mergeIdMap({ [clientId]: server.id });
      remapTrainingInClient(clientId, server);
    }
  }

  if (pathname === "/api/exercise-type" && entry.method.toUpperCase() === "POST") {
    const clientId = entry.context?.clientExerciseTypeId;
    const server = data as ApiSchemas["ExerciseType"];
    if (clientId && server?.id && clientId !== server.id) {
      await mergeIdMap({ [clientId]: server.id });
      remapExerciseInClient(clientId, server);
    }
  }
}

export async function drainOutboxOnce(): Promise<void> {
  if (draining) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  draining = true;
  try {
    const map = await getIdMap();
    let entries = await getOutboxEntries();
    entries = [...entries].sort((a, b) => a.createdAt - b.createdAt);

    for (const entry of entries) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;

      const body = await applyIdMapToBody(entry.body, map);
      const headers = new Headers(await authHeaders());
      headers.set("Idempotency-Key", entry.idempotencyKey);
      if (body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      let res: Response;
      try {
        res = await fetch(entry.url, {
          method: entry.method,
          headers,
          body: body ?? null,
        });
      } catch {
        break;
      }

      if (res.status === 401) {
        break;
      }

      if (!res.ok) {
        break;
      }

      if (entry.method.toUpperCase() === "POST" || entry.method.toUpperCase() === "PATCH") {
        await handlePostSuccess(entry, res);
      }

      await removeOutboxEntry(entry.id);
    }
  } finally {
    draining = false;
  }
}

export function registerOutboxSync(): () => void {
  const onOnline = () => {
    void drainOutboxOnce();
  };

  window.addEventListener("online", onOnline);
  void drainOutboxOnce();

  return () => window.removeEventListener("online", onOnline);
}
