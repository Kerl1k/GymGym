import { get, set } from "idb-keyval";

import { ID_MAP_KEY, offlineStore, OUTBOX_KEY } from "./idbStores";

import type { ClientIdMap, OutboxEntry } from "./types";

export const OUTBOX_CHANGED_EVENT = "gym-outbox-changed";

function dispatchOutboxChanged() {
  window.dispatchEvent(new CustomEvent(OUTBOX_CHANGED_EVENT));
}

async function readOutbox(): Promise<OutboxEntry[]> {
  return (await get(OUTBOX_KEY, offlineStore)) ?? [];
}

async function writeOutbox(entries: OutboxEntry[]): Promise<void> {
  await set(OUTBOX_KEY, entries, offlineStore);
  dispatchOutboxChanged();
}

export async function getOutboxEntries(): Promise<OutboxEntry[]> {
  return readOutbox();
}

export async function getOutboxPendingCount(): Promise<number> {
  const list = await readOutbox();
  return list.length;
}

export async function removeOutboxEntry(entryId: string): Promise<void> {
  const list = await readOutbox();
  await writeOutbox(list.filter((e) => e.id !== entryId));
}

export async function clearOutbox(): Promise<void> {
  await writeOutbox([]);
}

export async function appendOutboxEntry(entry: OutboxEntry): Promise<void> {
  const list = await readOutbox();
  let next = list;

  if (entry.operationKey) {
    next = list.filter((e) => e.operationKey !== entry.operationKey);
  }

  next = [...next, entry];
  await writeOutbox(next);
}

export async function getIdMap(): Promise<ClientIdMap> {
  return (await get(ID_MAP_KEY, offlineStore)) ?? {};
}

export async function mergeIdMap(partial: ClientIdMap): Promise<void> {
  const cur = await getIdMap();
  await set(ID_MAP_KEY, { ...cur, ...partial }, offlineStore);
}

export async function applyIdMapToBody(
  body: string | null,
  map: ClientIdMap,
): Promise<string | null> {
  if (!body) return body;
  let out = body;
  for (const [clientId, serverId] of Object.entries(map)) {
    if (clientId === serverId) continue;
    out = out.split(clientId).join(serverId);
  }
  return out;
}
