export const LOCAL_HISTORY_PREFIX = "local:";

export function isLocalHistoryId(id: string): boolean {
  return id.startsWith(LOCAL_HISTORY_PREFIX);
}

export function createLocalHistoryId(): string {
  return `${LOCAL_HISTORY_PREFIX}${crypto.randomUUID()}`;
}
