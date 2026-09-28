import { clearActiveTrainingDraft } from "@/entities/training-active/active-training-cache";

import {
  STORE_ID_MAP,
  STORE_SNAPSHOTS,
  idbClearStore,
} from "./db";
import { clearOutbox } from "./outbox";
import { syncEngine } from "./sync-engine";

export async function clearOfflineData(): Promise<void> {
  syncEngine.reset();
  await Promise.all([
    idbClearStore(STORE_SNAPSHOTS),
    clearOutbox(),
    idbClearStore(STORE_ID_MAP),
  ]);
  clearActiveTrainingDraft();
}
