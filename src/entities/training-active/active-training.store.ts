import { makeAutoObservable, runInAction } from "mobx";

import { toApiErrorCode } from "@/entities/api/request";
import { exercisesStore } from "@/entities/exercises/exercises.store";
import { fetchClient } from "@/entities/instance";
import {
  buildActiveTrainingFromTemplate,
  connectivityStore,
  enqueueMutation,
  readActiveTrainingSnapshot,
  readExercisesSnapshot,
  readOutbox,
  readTrainingsSnapshot,
  requestFlush,
  syncEngine,
  writeActiveTrainingSnapshot,
} from "@/entities/offline";
import { trainingStore } from "@/entities/training/training.store";
import { ApiSchemas } from "@/shared/schema";

import {
  clearActiveTrainingDraft,
  readActiveTrainingDraft,
} from "./active-training-cache";

const LOCAL_END_PREFIX = "local:";

export function isLocalHistoryId(id: string): boolean {
  return id.startsWith(LOCAL_END_PREFIX);
}

class ActiveTrainingStore {
  data: ApiSchemas["ActiveTraining"] | null | undefined = undefined;
  error: unknown = undefined;
  isFetching = false;
  isUpdating = false;
  isStarting = false;
  isEnding = false;
  isCancelling = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get hasData() {
    return this.data != null;
  }

  get isError() {
    return Boolean(this.error);
  }

  get isLoading() {
    return this.data === undefined && this.isFetching;
  }

  get fetchStatus() {
    return this.isFetching ? "fetching" : "idle";
  }

  applyActiveTraining(data: ApiSchemas["ActiveTraining"] | null) {
    this.data = data;
    this.error = data ? undefined : "NotFound";
  }

  async hydrateFromCache(): Promise<void> {
    const snapshot = await readActiveTrainingSnapshot();
    if (snapshot) {
      runInAction(() => {
        this.data = snapshot.data;
        this.error = snapshot.data ? undefined : "NotFound";
      });
      return;
    }

    // migrate legacy localStorage draft once
    const draft = readActiveTrainingDraft();
    if (draft?.data) {
      await writeActiveTrainingSnapshot(draft.data);
      clearActiveTrainingDraft();
      runInAction(() => {
        this.data = draft.data;
        this.error = undefined;
      });
    }
  }

  async fetch(force = false): Promise<void> {
    if (this.isFetching) return;
    if (!force && this.data !== undefined) return;

    runInAction(() => {
      this.isFetching = true;
    });

    await this.hydrateFromCache();

    if (!connectivityStore.isOnline) {
      runInAction(() => {
        if (this.data === undefined) {
          this.data = null;
          this.error = "NotFound";
        }
        this.isFetching = false;
      });
      return;
    }

    // Prefer local pending active lifecycle over server while outbox has active ops
    const outbox = await readOutbox();
    const hasPendingActive = outbox.some((item) => item.type.startsWith("active."));
    if (hasPendingActive && this.data !== undefined) {
      runInAction(() => {
        this.isFetching = false;
      });
      return;
    }

    try {
      const result = await fetchClient.GET("/api/active-training", {
        params: {},
      });
      if (result.error) {
        throw result.error;
      }

      const serverData = result.data ?? null;
      await writeActiveTrainingSnapshot(serverData);

      runInAction(() => {
        this.data = serverData;
        this.error = serverData ? undefined : "NotFound";
      });
    } catch (error) {
      const snapshot = await readActiveTrainingSnapshot();
      const legacyDraft = readActiveTrainingDraft();

      runInAction(() => {
        if (snapshot?.data) {
          this.data = snapshot.data;
          this.error = undefined;
          return;
        }
        if (legacyDraft?.data) {
          this.data = legacyDraft.data;
          this.error = undefined;
          return;
        }
        if (this.data !== undefined && this.data !== null) {
          this.error = undefined;
          return;
        }

        this.error = toApiErrorCode(error);
      });
    } finally {
      runInAction(() => {
        this.isFetching = false;
      });
    }
  }

  async change(
    nextData: ApiSchemas["ActiveTraining"],
  ): Promise<ApiSchemas["ActiveTraining"]> {
    this.isUpdating = true;
    try {
      runInAction(() => {
        this.data = nextData;
        this.error = undefined;
      });
      await writeActiveTrainingSnapshot(nextData);
      await enqueueMutation({
        type: "active.update",
        body: nextData,
      });
      requestFlush();
      return nextData;
    } finally {
      runInAction(() => {
        this.isUpdating = false;
      });
    }
  }

  async start(id: string): Promise<void> {
    this.isStarting = true;
    try {
      const existingLocal =
        this.data ??
        (await readActiveTrainingSnapshot())?.data ??
        null;
      if (existingLocal) {
        throw "AlreadyExists";
      }

      const dateStart = new Date().toISOString();

      let template =
        trainingStore.getById(id) ??
        (await readTrainingsSnapshot())?.content.find((item) => item.id === id) ??
        null;

      if (!template && connectivityStore.isOnline) {
        await trainingStore.fetchById(id, true);
        template = trainingStore.getById(id) ?? null;
      }

      if (!template) {
        throw new Error("TrainingNotFound");
      }

      if (connectivityStore.isOnline) {
        const result = await fetchClient.POST("/api/active-training/start", {
          body: { id, dateStart },
        });
        if (result.error) {
          throw result.error;
        }

        const serverActive = result.data ?? null;
        if (serverActive) {
          runInAction(() => {
            this.data = serverActive;
            this.error = undefined;
          });
          await writeActiveTrainingSnapshot(serverActive);
          return;
        }
      }

      const catalog =
        exercisesStore.getList(20)?.content ??
        (await readExercisesSnapshot())?.content ??
        [];

      const localActive = buildActiveTrainingFromTemplate(
        template,
        dateStart,
        catalog,
      );

      runInAction(() => {
        this.data = localActive;
        this.error = undefined;
      });
      await writeActiveTrainingSnapshot(localActive);
      await enqueueMutation({
        type: "active.start",
        trainingId: id,
        dateStart,
      });
      requestFlush();
    } finally {
      runInAction(() => {
        this.isStarting = false;
      });
    }
  }

  async end(
    finalData?: ApiSchemas["ActiveTraining"] | null,
  ): Promise<string> {
    this.isEnding = true;
    console.log("[active-training/end] store:end start", {
      hasFinalData: Boolean(finalData),
      hasStoreData: Boolean(this.data),
      isOnline: connectivityStore.isOnline,
      isEnding: this.isEnding,
      syncStatus: syncEngine.status,
      lastError: syncEngine.lastError,
      pendingCount: syncEngine.pendingCount,
    });
    try {
      const snapshotFromCache = finalData
        ? null
        : (await readActiveTrainingSnapshot())?.data ?? null;
      const snapshotToSync =
        finalData ?? this.data ?? snapshotFromCache ?? null;

      console.log("[active-training/end] store:end snapshot resolved", {
        source: finalData
          ? "finalData"
          : this.data
            ? "store.data"
            : snapshotFromCache
              ? "cache"
              : "missing",
        trainingName: snapshotToSync?.name,
        exercisesCount: snapshotToSync?.exercises?.length,
        dateStart: snapshotToSync?.dateStart,
      });

      if (!snapshotToSync) {
        console.log(
          "[active-training/end] store:end FAIL ActiveTrainingDataMissing",
        );
        throw new Error("ActiveTrainingDataMissing");
      }

      runInAction(() => {
        syncEngine.lastEndedHistoryId = null;
      });
      console.log("[active-training/end] store:end enqueue active.end");
      await enqueueMutation({
        type: "active.end",
        finalData: snapshotToSync,
      });

      runInAction(() => {
        this.data = null;
        this.error = "NotFound";
      });
      await writeActiveTrainingSnapshot(null);
      clearActiveTrainingDraft();
      console.log("[active-training/end] store:end local state cleared");

      if (connectivityStore.isOnline) {
        console.log("[active-training/end] store:end flush start");
        await syncEngine.flush();
        console.log("[active-training/end] store:end flush done", {
          lastEndedHistoryId: syncEngine.lastEndedHistoryId,
          lastError: syncEngine.lastError,
          syncStatus: syncEngine.status,
          pendingCount: syncEngine.pendingCount,
        });
        if (syncEngine.lastEndedHistoryId) {
          console.log("[active-training/end] store:end success historyId", {
            historyId: syncEngine.lastEndedHistoryId,
          });
          return syncEngine.lastEndedHistoryId;
        }
        // Online flush must produce a history id. Empty outbox without one
        // means the end never reached the server (e.g. silent IDB write loss).
        console.log(
          "[active-training/end] store:end FAIL ActiveEndNotSynced",
          {
            lastError: syncEngine.lastError,
            pendingCount: syncEngine.pendingCount,
          },
        );
        throw syncEngine.lastError ?? "ActiveEndNotSynced";
      }

      console.log(
        "[active-training/end] store:end offline — requestFlush + local id",
      );
      requestFlush();
      const localId = `${LOCAL_END_PREFIX}${crypto.randomUUID()}`;
      console.log("[active-training/end] store:end return local id", {
        localId,
      });
      return localId;
    } catch (error) {
      console.log("[active-training/end] store:end caught error", error);
      throw error;
    } finally {
      runInAction(() => {
        this.isEnding = false;
      });
      console.log("[active-training/end] store:end finally isEnding=false");
    }
  }

  async cancel(): Promise<void> {
    this.isCancelling = true;
    try {
      runInAction(() => {
        this.data = null;
        this.error = "NotFound";
      });
      await writeActiveTrainingSnapshot(null);
      clearActiveTrainingDraft();
      await enqueueMutation({ type: "active.cancel" });
      requestFlush();
    } finally {
      runInAction(() => {
        this.isCancelling = false;
      });
    }
  }
}

export const activeTrainingStore = new ActiveTrainingStore();
