import { clearActiveTrainingDraft } from "@/entities/training-active/active-training-cache";

import {
  STORE_ID_MAP,
  STORE_OUTBOX,
  STORE_SNAPSHOTS,
  idbClearStore,
} from "./db";

export async function clearOfflineData(): Promise<void> {
  await Promise.all([
    idbClearStore(STORE_SNAPSHOTS),
    idbClearStore(STORE_OUTBOX),
    idbClearStore(STORE_ID_MAP),
  ]);
  clearActiveTrainingDraft();
}
