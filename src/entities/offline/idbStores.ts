import { createStore } from "idb-keyval";

export const offlineStore = createStore("gym-app-db", "offline-sync");

export const OUTBOX_KEY = "outbox-entries-v1";
export const ID_MAP_KEY = "client-server-id-map-v1";
