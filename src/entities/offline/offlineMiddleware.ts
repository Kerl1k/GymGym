import { queryClient } from "@/entities/query-client";

import { patchCachesAfterOfflineMutation } from "./offlineCachePatch";
import { resolveOfflineReadRequest } from "./offlineGetResolver";
import { appendOutboxEntry } from "./outboxOps";
import { buildSyntheticJson } from "./syntheticMutationResponse";

import type { OutboxEntry } from "./types";
import type { Middleware } from "openapi-fetch";

function isMutating(method: string) {
  const m = method.toUpperCase();
  return m === "POST" || m === "PATCH" || m === "PUT" || m === "DELETE";
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function operationKeyFor(method: string, pathname: string): string | undefined {
  if (method.toUpperCase() === "PATCH" && pathname === "/api/active-training/update") {
    return "patch:active-training-update";
  }
  return undefined;
}

export const offlineFetchMiddleware: Middleware = {
  async onRequest({ request }) {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      return;
    }

    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD") {
      return resolveOfflineReadRequest(request, queryClient);
    }

    if (!isMutating(request.method)) {
      return;
    }

    const pathname = pathnameOf(request.url);
    const bodyText =
      method === "GET" || method === "HEAD" ? null : await request.clone().text();

    const synthetic = buildSyntheticJson(pathname, method, bodyText, queryClient);
    patchCachesAfterOfflineMutation(queryClient, pathname, method, synthetic);

    const entryId = crypto.randomUUID();
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? entryId;

    const context: OutboxEntry["context"] = {};
    if (pathname === "/api/training" && method.toUpperCase() === "POST") {
      if (synthetic && typeof synthetic === "object" && "id" in synthetic) {
        context.clientTrainingId = String((synthetic as { id: string }).id);
      }
    }
    if (pathname === "/api/exercise-type" && method.toUpperCase() === "POST") {
      if (synthetic && typeof synthetic === "object" && "id" in synthetic) {
        context.clientExerciseTypeId = String((synthetic as { id: string }).id);
      }
    }

    const entry: OutboxEntry = {
      id: entryId,
      method,
      url: request.url,
      body: bodyText,
      operationKey: operationKeyFor(method, pathname),
      idempotencyKey,
      createdAt: Date.now(),
      context: Object.keys(context).length ? context : undefined,
    };

    await appendOutboxEntry(entry);

    return new Response(JSON.stringify(synthetic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
