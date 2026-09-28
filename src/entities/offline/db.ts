const DB_NAME = "gym-note-offline";
const DB_VERSION = 1;

export const STORE_SNAPSHOTS = "snapshots";
export const STORE_OUTBOX = "outbox";
export const STORE_ID_MAP = "idMap";

export const SNAPSHOT_EXERCISES = "exercises";
export const SNAPSHOT_TRAININGS = "trainings";
export const SNAPSHOT_ACTIVE = "activeTraining";
export const ID_MAP_KEY = "tempToServer";

type StoreName =
  | typeof STORE_SNAPSHOTS
  | typeof STORE_OUTBOX
  | typeof STORE_ID_MAP;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          db.createObjectStore(STORE_SNAPSHOTS);
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_ID_MAP)) {
          db.createObjectStore(STORE_ID_MAP);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // Another tab upgraded the schema or the browser closed the
        // connection: drop the cached handle so the next call reopens it.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        db.onclose = () => {
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error("Failed to open IndexedDB"));
      };
    });
  }

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB request failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IDB transaction aborted"));
  });
}

/** Strip MobX proxies / non-cloneables so IndexedDB structured clone succeeds. */
export function toPlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function idbGet<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const value = await requestToPromise(store.get(key));
    await txDone(tx);
    return value as T | undefined;
  } catch (error) {
    console.warn(`IndexedDB read failed: ${storeName}/${key}`, error);
    return undefined;
  }
}

export async function idbSet<T>(storeName: StoreName, key: string, value: T): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.put(toPlainJson(value), key);
  await txDone(tx);
}

export async function idbDelete(storeName: StoreName, key: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    await txDone(tx);
  } catch {
    // no-op
  }
}

/**
 * Throws on failure: callers rewrite the whole store from this result,
 * so treating a broken DB as "empty" would silently wipe queued data.
 */
export async function idbGetAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  const values = await requestToPromise(tx.objectStore(storeName).getAll());
  await txDone(tx);
  return (values as T[]) ?? [];
}

export async function idbPutAll<T extends { id: string }>(
  storeName: StoreName,
  items: T[],
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.clear();
  const plainItems = toPlainJson(items);
  for (const item of plainItems) {
    store.put(item);
  }
  await txDone(tx);
}

export async function idbClearStore(storeName: StoreName): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    await txDone(tx);
  } catch (error) {
    console.warn(`IndexedDB clear failed: ${storeName}`, error);
  }
}
