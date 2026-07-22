import {
  ID_MAP_KEY,
  STORE_ID_MAP,
  idbGet,
  idbSet,
} from "./db";

import type { IdMap } from "./types";

export async function readIdMap(): Promise<IdMap> {
  return (await idbGet<IdMap>(STORE_ID_MAP, ID_MAP_KEY)) ?? {};
}

export async function writeIdMap(map: IdMap): Promise<void> {
  await idbSet(STORE_ID_MAP, ID_MAP_KEY, map);
}

export async function rememberIdMapping(tempId: string, serverId: string): Promise<void> {
  if (!tempId || !serverId || tempId === serverId) return;
  const map = await readIdMap();
  map[tempId] = serverId;
  await writeIdMap(map);
}

export function resolveId(id: string, map: IdMap): string {
  let current = id;
  const seen = new Set<string>();
  while (map[current] && !seen.has(current)) {
    seen.add(current);
    current = map[current];
  }
  return current;
}

export function rewriteIdsInValue<T>(value: T, map: IdMap): T {
  if (value == null || Object.keys(map).length === 0) return value;

  if (typeof value === "string") {
    return resolveId(value, map) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteIdsInValue(item, map)) as T;
  }

  if (typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === "id" && typeof nested === "string") {
        next[key] = resolveId(nested, map);
      } else {
        next[key] = rewriteIdsInValue(nested, map);
      }
    }
    return next as T;
  }

  return value;
}
