import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del, createStore } from "idb-keyval";

import type { AsyncStorage } from "@tanstack/query-persist-client-core";

const queryCacheStore = createStore("gym-app-db", "tanstack-query");

const storage: AsyncStorage<string> = {
  getItem: async (key) => (await get(key, queryCacheStore)) ?? null,
  setItem: async (key, value) => {
    await set(key, value, queryCacheStore);
  },
  removeItem: async (key) => {
    await del(key, queryCacheStore);
  },
};

export const queryPersister = createAsyncStoragePersister({
  storage,
  key: "gym-rq-cache",
  throttleTime: 1000,
});
