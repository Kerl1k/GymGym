import { makeAutoObservable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import { useSession } from "@/shared/model/session";
import type { ApiSchemas } from "@/shared/schema";

import { toUpdateActiveTrainingBody } from "./active-training-body";
import { connectivityStore } from "./connectivity";
import { registerFlushHandler } from "./flush-scheduler";
import { rememberIdMapping } from "./id-map";
import {
  applyIdMapToOutbox,
  readOutbox,
  replaceOutbox,
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

/** In-flight flush chain (kept off the MobX tree). */
let flushPromise: Promise<void> | null = null;

class SyncEngine {
  status: SyncStatus = "synced";
  lastError: string | null = null;
  pendingCount = 0;
  lastEndedHistoryId: string | null = null;

  private queued = false;
  private hooks: StoreHooks | null = null;
  private started = false;

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

  async refreshPendingCount() {
    const items = await readOutbox();
    runInAction(() => {
      this.pendingCount = items.length;
      if (!connectivityStore.isOnline) {
        this.status = "offline";
      } else if (items.length === 0 && this.status !== "error") {
        this.status = "synced";
      }
    });
  }

  async flush(): Promise<void> {
    console.log("[active-training/end] sync:flush enter", {
      isOnline: connectivityStore.isOnline,
      status: this.status,
      lastError: this.lastError,
      pendingCount: this.pendingCount,
      hasInFlight: Boolean(flushPromise),
      lastEndedHistoryId: this.lastEndedHistoryId,
    });
    if (!connectivityStore.isOnline) {
      console.log("[active-training/end] sync:flush skip offline");
      runInAction(() => {
        this.status = "offline";
      });
      await this.refreshPendingCount();
      return;
    }

    // Coalesce concurrent callers onto one chain; mark queued so the
    // in-flight loop does another pass after new mutations land.
    if (flushPromise) {
      console.log(
        "[active-training/end] sync:flush coalesce onto in-flight",
      );
      this.queued = true;
      await flushPromise;
      // Mutation may have been enqueued after the loop's last empty check.
      if (
        connectivityStore.isOnline &&
        (await readOutbox()).length > 0 &&
        this.status !== "error"
      ) {
        console.log(
          "[active-training/end] sync:flush re-enter after coalesce",
        );
        return this.flush();
      }
      console.log("[active-training/end] sync:flush coalesce done", {
        status: this.status,
        lastError: this.lastError,
        lastEndedHistoryId: this.lastEndedHistoryId,
      });
      return;
    }

    flushPromise = this.runFlushLoop().finally(() => {
      flushPromise = null;
    });

    await flushPromise;
    console.log("[active-training/end] sync:flush complete", {
      status: this.status,
      lastError: this.lastError,
      pendingCount: this.pendingCount,
      lastEndedHistoryId: this.lastEndedHistoryId,
    });
  }

  private async runFlushLoop(): Promise<void> {
    do {
      this.queued = false;
      await this.runFlushPass();
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

  private async runFlushPass(): Promise<void> {
    runInAction(() => {
      this.status = "syncing";
      this.lastError = null;
    });

    const token = await useSession.getState().refreshToken();
    if (!token) {
      console.log(
        "[active-training/end] sync:flushPass FAIL AuthRequired",
      );
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
      const remaining = sortMutationsForFlush(await readOutbox());
      if (remaining.length === 0) break;

      const mutation = remaining[0];
      console.log("[active-training/end] sync:flushPass next mutation", {
        id: mutation.id,
        type: mutation.type,
        status: mutation.status,
        queueLength: remaining.length,
        typesAhead: remaining.map((item) => item.type),
      });
      try {
        await this.replayMutation(mutation);
        const after = await readOutbox();
        const next = after.filter((item) => item.id !== mutation.id);
        await replaceOutbox(next);
        runInAction(() => {
          this.pendingCount = next.length;
        });
        if (mutation.type === "active.end") {
          console.log(
            "[active-training/end] sync:flushPass active.end removed from outbox",
            { lastEndedHistoryId: this.lastEndedHistoryId },
          );
        }
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "SyncFailed";

        console.log("[active-training/end] sync:flushPass mutation catch", {
          mutationType: mutation.type,
          mutationId: mutation.id,
          message,
          error,
        });

        const isNetworkError =
          !connectivityStore.isOnline ||
          message === "Failed to fetch" ||
          message.includes("NetworkError") ||
          message.includes("network");

        if (isNetworkError) {
          console.log(
            "[active-training/end] sync:flushPass network error → offline",
            { mutationType: mutation.type, message },
          );
          runInAction(() => {
            this.status = "offline";
          });
          return;
        }

        const after = await readOutbox();
        const marked: OutboxMutation = {
          ...mutation,
          status: "error",
          errorMessage: message,
        };
        const next = [
          marked,
          ...after.filter((item) => item.id !== mutation.id),
        ];
        await replaceOutbox(next);
        console.log(
          "[active-training/end] sync:flushPass marked mutation error",
          {
            mutationType: mutation.type,
            message,
            pendingCount: next.length,
          },
        );
        runInAction(() => {
          this.status = "error";
          this.lastError = message;
          this.pendingCount = next.length;
        });
        return;
      }
    }

    if (this.hooks) {
      await this.hooks.refetchAfterSync();
    }

    runInAction(() => {
      this.status = "synced";
      this.lastError = null;
      this.pendingCount = 0;
    });
  }

  private async replayMutation(mutation: OutboxMutation): Promise<void> {
    switch (mutation.type) {
      case "exercise.create": {
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
        console.log("[active-training/end] sync:replay POST /api/active-training/end", {
          hasFinalData: Boolean(mutation.finalData),
          trainingName: mutation.finalData?.name,
          exercisesCount: mutation.finalData?.exercises?.length,
          dateStart: mutation.finalData?.dateStart,
          bodyPreview: mutation.finalData
            ? {
                name: mutation.finalData.name,
                exercises: mutation.finalData.exercises?.map((ex) => ({
                  id: ex.id,
                  name: ex.name,
                  setsDone: ex.sets?.filter((s) => s.done).length,
                  setsTotal: ex.sets?.length,
                })),
              }
            : null,
        });
        const result = mutation.finalData
          ? await fetchClient.POST("/api/active-training/end", {
              body: mutation.finalData,
            })
          : await fetchClient.POST("/api/active-training/end", {});
        console.log("[active-training/end] sync:replay response", {
          hasError: Boolean(result.error),
          error: result.error,
          hasData: Boolean(result.data),
          historyId: (result.data as ApiSchemas["TrainingHistory"] | undefined)
            ?.id,
          response: result.data,
        });
        if (result.error) {
          console.log(
            "[active-training/end] sync:replay FAIL result.error",
            result.error,
          );
          throw result.error;
        }
        const history = result.data as ApiSchemas["TrainingHistory"] | undefined;
        if (history?.id) {
          runInAction(() => {
            this.lastEndedHistoryId = history.id;
          });
          console.log(
            "[active-training/end] sync:replay lastEndedHistoryId set",
            { historyId: history.id },
          );
        } else {
          console.log(
            "[active-training/end] sync:replay WARN no history.id in response",
            { data: result.data },
          );
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
