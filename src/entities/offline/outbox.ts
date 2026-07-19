import { STORE_OUTBOX, idbGetAll, idbPutAll } from "./db";
import { readIdMap, resolveId, rewriteIdsInValue } from "./id-map";

import type { OutboxMutation } from "./types";

function newMutationId(): string {
  return crypto.randomUUID();
}

function entityKey(mutation: OutboxMutation): string | null {
  switch (mutation.type) {
    case "exercise.create":
      return `exercise:${mutation.tempId}`;
    case "exercise.update":
    case "exercise.delete":
      return `exercise:${mutation.entityId}`;
    case "training.create":
      return `training:${mutation.tempId}`;
    case "training.update":
    case "training.delete":
      return `training:${mutation.entityId}`;
    case "active.start":
    case "active.update":
    case "active.end":
    case "active.cancel":
      return "active";
    default:
      return null;
  }
}

function isCreate(type: OutboxMutation["type"]): boolean {
  return type === "exercise.create" || type === "training.create";
}

function isCatalogDelete(type: OutboxMutation["type"]): boolean {
  return type === "exercise.delete" || type === "training.delete";
}

function isCatalogUpdate(type: OutboxMutation["type"]): boolean {
  return type === "exercise.update" || type === "training.update";
}

function isActiveMutation(type: OutboxMutation["type"]): boolean {
  return type.startsWith("active.");
}

function sortByCreatedAt(mutations: OutboxMutation[]): OutboxMutation[] {
  return [...mutations].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

/**
 * Collapse the active-training lifecycle into at most:
 * start → end(with finalData) | cancel
 * Workout payload is folded into end.finalData so reconnect always sends sets/weights.
 */
function coalesceActiveLifecycle(active: OutboxMutation[]): OutboxMutation[] {
  if (active.length === 0) return [];

  const start = active.find((item) => item.type === "active.start");
  const latestUpdate = [...active]
    .reverse()
    .find(
      (item): item is Extract<OutboxMutation, { type: "active.update" }> =>
        item.type === "active.update",
    );
  const terminal = [...active]
    .reverse()
    .find(
      (item) => item.type === "active.end" || item.type === "active.cancel",
    );

  // Local-only start cancelled before sync → drop everything
  if (start && terminal?.type === "active.cancel") {
    return [];
  }

  // Cancel without pending start (session already on server) → cancel only
  if (terminal?.type === "active.cancel") {
    return [
      {
        ...terminal,
        status: "pending",
        errorMessage: undefined,
      },
    ];
  }

  const result: OutboxMutation[] = [];
  if (start) {
    result.push({
      ...start,
      status: "pending",
      errorMessage: undefined,
    });
  }

  if (terminal?.type === "active.end") {
    const finalData =
      ("finalData" in terminal ? terminal.finalData : undefined) ??
      latestUpdate?.body;
    console.log("[active-training/end] outbox:coalesce active.end", {
      hasTerminalFinalData: Boolean(
        "finalData" in terminal ? terminal.finalData : undefined,
      ),
      hasLatestUpdateBody: Boolean(latestUpdate?.body),
      hasFinalData: Boolean(finalData),
      trainingName: finalData?.name,
      dateStart: finalData?.dateStart,
      keepStart: Boolean(start),
      activeQueueTypes: active.map((item) => item.type),
    });
    if (!finalData) {
      console.log(
        "[active-training/end] outbox:coalesce WARN active.end without finalData",
      );
    }
    // Never drop end from the queue — without it start would sync alone.
    result.push({
      id: terminal.id,
      createdAt: terminal.createdAt,
      type: "active.end",
      ...(finalData ? { finalData } : {}),
      status: "pending",
      errorMessage: undefined,
    });
    return result;
  }

  // No terminal yet: keep start + latest update for crash recovery mid-workout
  if (latestUpdate) {
    result.push({
      ...latestUpdate,
      status: "pending",
      errorMessage: undefined,
    });
  }

  return result;
}

/** Coalesce pending mutations to minimize REST calls (LWW). */
export function coalesceMutations(mutations: OutboxMutation[]): OutboxMutation[] {
  // IDB returns by primary key (UUID); always process chronologically first.
  const chronological = sortByCreatedAt(mutations);
  const catalog: OutboxMutation[] = [];
  const active: OutboxMutation[] = [];

  for (const incoming of chronological) {
    if (isActiveMutation(incoming.type)) {
      active.push(incoming);
      continue;
    }

    const key = entityKey(incoming);
    if (!key) {
      catalog.push(incoming);
      continue;
    }

    const existingIndex = catalog.findIndex((item) => entityKey(item) === key);
    if (existingIndex === -1) {
      catalog.push(incoming);
      continue;
    }

    const existing = catalog[existingIndex];

    // create + delete (never synced) → drop both
    if (isCreate(existing.type) && isCatalogDelete(incoming.type)) {
      catalog.splice(existingIndex, 1);
      continue;
    }

    // create + update → fold into create body
    if (existing.type === "exercise.create" && incoming.type === "exercise.update") {
      catalog[existingIndex] = {
        ...existing,
        body: {
          name: incoming.body.name ?? existing.body.name,
          favorite: incoming.body.favorite ?? existing.body.favorite,
          description: incoming.body.description ?? existing.body.description,
          restTime: incoming.body.restTime ?? existing.body.restTime,
          muscleGroups: incoming.body.muscleGroups ?? existing.body.muscleGroups,
          units: incoming.body.units ?? existing.body.units,
        },
        createdAt: incoming.createdAt,
        status: "pending",
        errorMessage: undefined,
      };
      continue;
    }

    if (existing.type === "training.create" && incoming.type === "training.update") {
      catalog[existingIndex] = {
        ...existing,
        body: {
          name: incoming.body.name ?? existing.body.name,
          favorite: incoming.body.favorite ?? existing.body.favorite,
          description: incoming.body.description ?? existing.body.description,
          exerciseTypes: incoming.body.exerciseTypes ?? existing.body.exerciseTypes,
        },
        createdAt: incoming.createdAt,
        status: "pending",
        errorMessage: undefined,
      };
      continue;
    }

    // catalog update + delete → keep delete only
    if (isCatalogUpdate(existing.type) && isCatalogDelete(incoming.type)) {
      catalog[existingIndex] = {
        ...incoming,
        createdAt: Math.min(existing.createdAt, incoming.createdAt),
        status: "pending",
        errorMessage: undefined,
      };
      continue;
    }

    // multiple catalog updates → LWW latest
    if (isCatalogUpdate(existing.type) && isCatalogUpdate(incoming.type)) {
      catalog[existingIndex] = {
        ...incoming,
        createdAt: Math.min(existing.createdAt, incoming.createdAt),
        status: "pending",
        errorMessage: undefined,
      };
      continue;
    }

    // replace same-entity conflict with latest
    catalog[existingIndex] = {
      ...incoming,
      status: "pending",
      errorMessage: undefined,
    };
  }

  return [...catalog, ...coalesceActiveLifecycle(active)];
}

const MUTATION_ORDER: Record<OutboxMutation["type"], number> = {
  "exercise.create": 10,
  "exercise.update": 20,
  "exercise.delete": 30,
  "training.create": 40,
  "training.update": 50,
  "training.delete": 60,
  "active.start": 70,
  "active.update": 80,
  "active.end": 90,
  "active.cancel": 90,
};

export function sortMutationsForFlush(mutations: OutboxMutation[]): OutboxMutation[] {
  return [...mutations].sort((a, b) => {
    const orderDiff = MUTATION_ORDER[a.type] - MUTATION_ORDER[b.type];
    if (orderDiff !== 0) return orderDiff;
    return a.createdAt - b.createdAt;
  });
}

export async function readOutbox(): Promise<OutboxMutation[]> {
  const items = await idbGetAll<OutboxMutation>(STORE_OUTBOX);
  return sortByCreatedAt(items);
}

export async function writeOutbox(mutations: OutboxMutation[]): Promise<void> {
  await idbPutAll(STORE_OUTBOX, mutations);
}

export async function enqueueMutation(
  mutation: {
    [T in OutboxMutation["type"]]: Omit<
      Extract<OutboxMutation, { type: T }>,
      "id" | "createdAt" | "status" | "errorMessage"
    > & {
      id?: string;
      createdAt?: number;
      status?: "pending" | "error";
    };
  }[OutboxMutation["type"]],
): Promise<OutboxMutation[]> {
  const current = await readOutbox();
  const nextItem = {
    ...mutation,
    id: mutation.id ?? newMutationId(),
    createdAt: mutation.createdAt ?? Date.now(),
    status: mutation.status ?? "pending",
  } as OutboxMutation;

  if (mutation.type === "active.end") {
    console.log("[active-training/end] outbox:enqueue before coalesce", {
      currentTypes: current.map((item) => item.type),
      currentCount: current.length,
      hasFinalData:
        "finalData" in mutation ? Boolean(mutation.finalData) : false,
    });
  }

  const coalesced = coalesceMutations([...current, nextItem]);
  await writeOutbox(coalesced);

  if (mutation.type === "active.end") {
    console.log("[active-training/end] outbox:enqueue after coalesce", {
      coalescedTypes: coalesced.map((item) => item.type),
      coalescedCount: coalesced.length,
      endItem: coalesced.find((item) => item.type === "active.end"),
    });
  }

  return coalesced;
}

export async function replaceOutbox(mutations: OutboxMutation[]): Promise<void> {
  await writeOutbox(mutations);
}

export async function applyIdMapToOutbox(): Promise<OutboxMutation[]> {
  const map = await readIdMap();
  const current = await readOutbox();
  if (Object.keys(map).length === 0) return current;

  const rewritten = current.map((mutation) => {
    switch (mutation.type) {
      case "exercise.create":
        return {
          ...mutation,
          tempId: resolveId(mutation.tempId, map),
          body: rewriteIdsInValue(mutation.body, map),
        };
      case "exercise.update":
        return {
          ...mutation,
          entityId: resolveId(mutation.entityId, map),
          body: {
            ...rewriteIdsInValue(mutation.body, map),
            id: resolveId(mutation.body.id, map),
          },
        };
      case "exercise.delete":
        return {
          ...mutation,
          entityId: resolveId(mutation.entityId, map),
        };
      case "training.create":
        return {
          ...mutation,
          tempId: resolveId(mutation.tempId, map),
          body: {
            ...mutation.body,
            exerciseTypes: mutation.body.exerciseTypes.map((item) => ({
              id: resolveId(item.id, map),
            })),
          },
        };
      case "training.update":
        return {
          ...mutation,
          entityId: resolveId(mutation.entityId, map),
          body: {
            ...mutation.body,
            id: resolveId(mutation.body.id, map),
            exerciseTypes: mutation.body.exerciseTypes.map((item) => ({
              id: resolveId(item.id, map),
            })),
          },
        };
      case "training.delete":
        return {
          ...mutation,
          entityId: resolveId(mutation.entityId, map),
        };
      case "active.start":
        return {
          ...mutation,
          trainingId: resolveId(mutation.trainingId, map),
        };
      case "active.update":
        return {
          ...mutation,
          body: rewriteIdsInValue(mutation.body, map),
        };
      case "active.end":
        return {
          ...mutation,
          finalData: mutation.finalData
            ? rewriteIdsInValue(mutation.finalData, map)
            : mutation.finalData,
        };
      default:
        return mutation;
    }
  });

  await writeOutbox(rewritten);
  return rewritten;
}

export async function hasPendingMutations(): Promise<boolean> {
  const items = await readOutbox();
  return items.length > 0;
}
