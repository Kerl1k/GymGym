import { makeAutoObservable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import { useSession } from "@/entities/session/session";
import type { ApiSchemas } from "@/shared/schema";

import { toUpdateActiveTrainingBody } from "./active-training-body";
import { connectivityStore } from "./connectivity";
import { registerFlushHandler } from "./flush-scheduler";
import { readIdMap, rememberIdMapping } from "./id-map";
import {
  applyIdMapToOutbox,
  markMutationInFlight,
  markOutboxError,
  readOutbox,
  removeFromOutbox,
  sortMutationsForFlush,
} from "./outbox";
import {
  remapSnapshotsIds,
  writeActiveTrainingSnapshot,
  writeExercisesSnapshot,
  writeTrainingsSnapshot,
} from "./snapshot-store";

import type { OutboxMutation, SyncStatus } from "./types";

type StoreHooks = {
  replaceExerciseId: (tempId: string, serverExercise: ApiSchemas["ExerciseType"]) => void;
  replaceTrainingId: (tempId: string, serverTraining: ApiSchemas["Training"]) => void;
  applyExerciseSnapshot: (content: ApiSchemas["ExerciseType"][]) => void;
  applyTrainingSnapshot: (content: ApiSchemas["Training"][]) => void;
  applyActiveTraining: (data: ApiSchemas["ActiveTraining"] | null) => void;
  refetchAfterSync: () => Promise<void>;
};

type FlushOptions = {
  /** User-initiated retry: ignores the error backoff window. */
  force?: boolean;
};

const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 5 * 60_000;

/** In-flight flush chain (kept off the MobX tree). */
let flushPromise: Promise<void> | null = null;

function errorMessageOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "SyncFailed";
}

function isNetworkFailure(message: string): boolean {
  return (
    !connectivityStore.isOnline ||
    message === "Failed to fetch" ||
    message.includes("NetworkError") ||
    message.toLowerCase().includes("network") ||
    message.includes("Load failed")
  );
}

class SyncEngine {
  status: SyncStatus = "synced";
  lastError: string | null = null;
  pendingCount = 0;
  lastEndedHistoryId: string | null = null;

  private queued = false;
  private hooks: StoreHooks | null = null;
  private started = false;
  /** Bumped on reset so a flush started for a previous session stops. */
  private generation = 0;
  private failedAttempts = 0;
  private retryAfter = 0;
  private retryTimer: number | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  bindHooks(hooks: StoreHooks) {
    this.hooks = hooks;
  }

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    connectivityStore.start();
    registerFlushHandler(() => this.flush());

    window.addEventListener("online", () => {
      void this.flush();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void this.flush();
      }
    });

    void this.refreshPendingCount();
    if (connectivityStore.isOnline) {
      void this.flush();
    } else {
      runInAction(() => {
        this.status = "offline";
      });
    }
  }

  /** Stops any in-flight flush and forgets per-session state (logout). */
  reset() {
    this.generation += 1;
    this.queued = false;
    this.failedAttempts = 0;
    this.retryAfter = 0;
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    markMutationInFlight(null);
    this.status = "synced";
    this.lastError = null;
    this.pendingCount = 0;
    this.lastEndedHistoryId = null;
  }

  async refreshPendingCount() {
    let count: number;
    try {
      count = (await readOutbox()).length;
    } catch (error) {
      console.warn("Не удалось прочитать очередь синхронизации", error);
      return;
    }
    runInAction(() => {
      this.pendingCount = count;
      if (!connectivityStore.isOnline) {
        this.status = "offline";
      } else if (count === 0 && this.status !== "error") {
        this.status = "synced";
      }
    });
  }

  /** Never rejects: failures are reflected in `status` / `lastError`. */
  async flush(options: FlushOptions = {}): Promise<void> {
    try {
      await this.flushUnsafe(options);
    } catch (error) {
      console.error("Sync flush failed", error);
      runInAction(() => {
        this.status = "error";
        this.lastError = errorMessageOf(error);
      });
    }
  }

  private async flushUnsafe(options: FlushOptions): Promise<void> {
    if (!connectivityStore.isOnline) {
      runInAction(() => {
        this.status = "offline";
      });
      await this.refreshPendingCount();
      return;
    }

    if (!options.force && Date.now() < this.retryAfter) {
      this.scheduleRetry();
      return;
    }

    // Coalesce concurrent callers onto one chain; mark queued so the
    // in-flight loop does another pass after new mutations land.
    if (flushPromise) {
      this.queued = true;
      await flushPromise;
      // Mutation may have been enqueued after the loop's last empty check.
      if (
        connectivityStore.isOnline &&
        this.status !== "error" &&
        (await readOutbox()).length > 0
      ) {
        return this.flushUnsafe(options);
      }
      return;
    }

    flushPromise = this.runFlushLoop(this.generation).finally(() => {
      flushPromise = null;
    });

    await flushPromise;
  }

  private scheduleRetry() {
    if (this.retryTimer !== null) return;
    const delay = Math.max(0, this.retryAfter - Date.now());
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  private registerFailure() {
    this.failedAttempts += 1;
    const delay = Math.min(
      RETRY_MAX_MS,
      RETRY_BASE_MS * 2 ** (this.failedAttempts - 1),
    );
    this.retryAfter = Date.now() + delay;
    this.scheduleRetry();
  }

  private registerSuccess() {
    this.failedAttempts = 0;
    this.retryAfter = 0;
  }

  private async runFlushLoop(generation: number): Promise<void> {
    do {
      this.queued = false;
      await this.runFlushPass(generation);
      if (generation !== this.generation) return;
      if (this.status === "error" || this.status === "offline") {
        return;
      }
      if (!connectivityStore.isOnline) {
        runInAction(() => {
          this.status = "offline";
        });
        return;
      }
    } while (this.queued || (await readOutbox()).length > 0);
  }

  private async runFlushPass(generation: number): Promise<void> {
    runInAction(() => {
      this.status = "syncing";
      this.lastError = null;
    });

    const token = await useSession.getState().refreshToken();
    if (generation !== this.generation) return;
    if (!token) {
      runInAction(() => {
        this.status = "error";
        this.lastError = "AuthRequired";
      });
      return;
    }

    await applyIdMapToOutbox();

    // Re-read after each mutation so concurrent enqueueMutation
    // (e.g. active.end during an in-flight update flush) is not wiped.
    while (true) {
      if (generation !== this.generation) return;

      const remaining = sortMutationsForFlush(await readOutbox());
      if (remaining.length === 0) break;

      const mutation = remaining[0];
      markMutationInFlight(mutation.id);
      try {
        await this.replayMutation(mutation);
        if (generation !== this.generation) return;

        const next = await removeFromOutbox(mutation.id);
        if (mutation.type === "exercise.create" || mutation.type === "training.create") {
          // Later mutations may reference the temp id just resolved.
          await applyIdMapToOutbox();
        }
        this.registerSuccess();
        runInAction(() => {
          this.pendingCount = next.length;
        });
      } catch (error) {
        if (generation !== this.generation) return;

        const message = errorMessageOf(error);
        if (isNetworkFailure(message)) {
          // No "online" event will fire if the browser already thinks it is
          // online, so retry on our own.
          if (connectivityStore.isOnline) {
            this.registerFailure();
          }
          runInAction(() => {
            this.status = "offline";
          });
          return;
        }

        const next = await markOutboxError(mutation.id, message);
        this.registerFailure();
        runInAction(() => {
          this.status = "error";
          this.lastError = message;
          this.pendingCount = next.length;
        });
        return;
      } finally {
        markMutationInFlight(null);
      }
    }

    if (this.hooks) {
      await this.hooks.refetchAfterSync();
    }
    if (generation !== this.generation) return;

    runInAction(() => {
      this.status = "synced";
      this.lastError = null;
      this.pendingCount = 0;
    });
  }

  /** True when a previous attempt already created this entity on the server. */
  private async isAlreadyCreated(tempId: string): Promise<boolean> {
    const map = await readIdMap();
    return Boolean(map[tempId]);
  }

  private async replayMutation(mutation: OutboxMutation): Promise<void> {
    switch (mutation.type) {
      case "exercise.create": {
        if (await this.isAlreadyCreated(mutation.tempId)) return;
        const result = await fetchClient.POST("/api/exercise-type", {
          body: mutation.body,
        });
        if (result.error) throw result.error;
        const created = result.data;
        if (!created) throw new Error("EmptyCreateExercise");
        await rememberIdMapping(mutation.tempId, created.id);
        await remapSnapshotsIds(mutation.tempId, created.id);
        this.hooks?.replaceExerciseId(mutation.tempId, created);
        return;
      }
      case "exercise.update": {
        const result = await fetchClient.PATCH("/api/exercise-type", {
          body: mutation.body,
        });
        if (result.error) throw result.error;
        return;
      }
      case "exercise.delete": {
        const result = await fetchClient.DELETE("/api/exercise-type/{id}", {
          params: { path: { id: mutation.entityId } },
        });
        if (result.error) throw result.error;
        return;
      }
      case "training.create": {
        if (await this.isAlreadyCreated(mutation.tempId)) return;
        const result = await fetchClient.POST("/api/training", {
          body: mutation.body,
        });
        if (result.error) throw result.error;
        const created = result.data;
        if (!created) throw new Error("EmptyCreateTraining");
        await rememberIdMapping(mutation.tempId, created.id);
        await remapSnapshotsIds(mutation.tempId, created.id);
        this.hooks?.replaceTrainingId(mutation.tempId, created);
        return;
      }
      case "training.update": {
        const result = await fetchClient.PATCH("/api/training", {
          body: mutation.body,
        });
        if (result.error) throw result.error;
        return;
      }
      case "training.delete": {
        const result = await fetchClient.DELETE("/api/training/{id}", {
          params: { path: { id: mutation.entityId } },
        });
        if (result.error) throw result.error;
        return;
      }
      case "active.start": {
        const result = await fetchClient.POST("/api/active-training/start", {
          body: { id: mutation.trainingId, dateStart: mutation.dateStart },
        });
        if (result.error) throw result.error;
        return;
      }
      case "active.update": {
        const result = await fetchClient.PATCH("/api/active-training/update", {
          body: toUpdateActiveTrainingBody(mutation.body),
        });
        if (result.error) throw result.error;
        if (result.data) {
          await writeActiveTrainingSnapshot(result.data);
          this.hooks?.applyActiveTraining(result.data);
        }
        return;
      }
      case "active.end": {
        // Prefer end-with-body so offline sets/weights are applied on finish.
        // Fall back to empty body only if we somehow lost finalData.
        const result = mutation.finalData
          ? await fetchClient.POST("/api/active-training/end", {
              body: mutation.finalData,
            })
          : await fetchClient.POST("/api/active-training/end", {});
        if (result.error) throw result.error;
        const history = result.data as ApiSchemas["TrainingHistory"] | undefined;
        if (history?.id) {
          runInAction(() => {
            this.lastEndedHistoryId = history.id;
          });
        }
        await writeActiveTrainingSnapshot(null);
        this.hooks?.applyActiveTraining(null);
        return;
      }
      case "active.cancel": {
        const result = await fetchClient.POST("/api/active-training/cancel", {});
        if (result.error) throw result.error;
        await writeActiveTrainingSnapshot(null);
        this.hooks?.applyActiveTraining(null);
        return;
      }
      default:
        return;
    }
  }
}

export const syncEngine = new SyncEngine();

export async function persistExercisesSnapshot(
  content: ApiSchemas["ExerciseType"][],
): Promise<void> {
  await writeExercisesSnapshot(content);
}

export async function persistTrainingsSnapshot(
  content: ApiSchemas["Training"][],
): Promise<void> {
  await writeTrainingsSnapshot(content);
}
