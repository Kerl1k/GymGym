import { ApiSchemas } from "@/shared/schema";

const ACTIVE_TRAINING_DRAFT_KEY = "active-training:draft:v1";

type ActiveTrainingDraftCachePayload = {
  data: ApiSchemas["ActiveTraining"];
  isSynced: boolean;
  updatedAt: number;
};

export function readActiveTrainingDraft():
  | ActiveTrainingDraftCachePayload
  | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_TRAINING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveTrainingDraftCachePayload;
    if (!parsed?.data || !parsed.data?.dateStart) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveTrainingDraft(
  data: ApiSchemas["ActiveTraining"],
  isSynced: boolean,
): void {
  if (typeof window === "undefined") return;

  const payload: ActiveTrainingDraftCachePayload = {
    data,
    isSynced,
    updatedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(
      ACTIVE_TRAINING_DRAFT_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // no-op when storage is unavailable
  }
}

export function clearActiveTrainingDraft(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(ACTIVE_TRAINING_DRAFT_KEY);
  } catch {
    // no-op when storage is unavailable
  }
}
