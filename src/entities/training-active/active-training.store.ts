import { makeAutoObservable, runInAction, when } from "mobx";

import { toApiErrorCode } from "@/entities/api/request";
import { exercisesStore } from "@/entities/exercises/exercises.store";
import { fetchClient } from "@/entities/instance";
import {
  buildActiveTrainingFromHistory,
  buildActiveTrainingFromTemplate,
  connectivityStore,
  createLocalHistoryId,
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
import { trainingHistoryStore } from "@/entities/training-history/training-history.store";
import { normalizeActiveTrainingRest } from "@/shared/lib/rest-time";
import { ApiSchemas } from "@/shared/schema";

import {
  clearActiveTrainingDraft,
  readActiveTrainingDraft,
} from "./active-training-cache";

export { isLocalHistoryId } from "@/entities/offline";

/** Online finish gives up and completes locally so the screen cannot spin forever. */
const END_ONLINE_WAIT_MS = 20_000;

let endingPromise: Promise<string> | null = null;

function raceWithTimeout(
  work: Promise<unknown>,
  ms: number,
): Promise<"done" | "timeout"> {
  let timer: number | undefined;
  return new Promise((resolve, reject) => {
    timer = window.setTimeout(() => resolve("timeout"), ms);
    work.then(
      () => {
        if (timer !== undefined) window.clearTimeout(timer);
        resolve("done");
      },
      (error: unknown) => {
        if (timer !== undefined) window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

class ActiveTrainingStore {
  data: ApiSchemas["ActiveTraining"] | null | undefined = undefined;
  error: unknown = undefined;
  isFetching = false;
  isUpdating = false;
  isStarting = false;
  isEnding = false;
  isCancelling = false;
  /** Set once a workout is closed locally; a late /update must not reopen it. */
  private ignoreIncomingActive = false;

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

  acceptsIncomingActive(): boolean {
    return !this.ignoreIncomingActive;
  }

  applyActiveTraining(data: ApiSchemas["ActiveTraining"] | null) {
    if (data && this.ignoreIncomingActive) return;
    this.adoptExternal(data);
  }

  /** Server and cache payloads use 60s when rest was never set. */
  private adoptExternal(data: ApiSchemas["ActiveTraining"] | null) {
    this.data = data ? normalizeActiveTrainingRest(data) : null;
    this.error = data ? undefined : "NotFound";
  }

  async hydrateFromCache(): Promise<void> {
    if (this.ignoreIncomingActive) return;

    const snapshot = await readActiveTrainingSnapshot();
    if (snapshot) {
      runInAction(() => {
        this.adoptExternal(snapshot.data);
      });
      return;
    }

    // migrate legacy localStorage draft once
    const draft = readActiveTrainingDraft();
    if (draft?.data) {
      await writeActiveTrainingSnapshot(draft.data);
      clearActiveTrainingDraft();
      runInAction(() => {
        this.adoptExternal(draft.data);
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
    const outbox = await readOutbox().catch(() => []);
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

      const serverData = result.data
        ? normalizeActiveTrainingRest(result.data)
        : null;
      if (serverData && this.ignoreIncomingActive) {
        return;
      }
      await writeActiveTrainingSnapshot(serverData);

      runInAction(() => {
        this.adoptExternal(serverData);
      });
    } catch (error) {
      const snapshot = await readActiveTrainingSnapshot();
      const legacyDraft = readActiveTrainingDraft();

      runInAction(() => {
        if (snapshot?.data && !this.ignoreIncomingActive) {
          this.adoptExternal(snapshot.data);
          return;
        }
        if (legacyDraft?.data && !this.ignoreIncomingActive) {
          this.adoptExternal(legacyDraft.data);
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
    this.ignoreIncomingActive = false;
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
        const result = await fetchClient
          .POST("/api/active-training/start", {
            body: { id, dateStart },
          })
          .catch((error: unknown) => {
            if (error instanceof TypeError) {
              return null;
            }
            throw error;
          });

        if (result) {
          if (result.error) {
            throw result.error;
          }

          const serverActive = result.data
            ? normalizeActiveTrainingRest(result.data)
            : null;
          if (serverActive) {
            runInAction(() => {
              this.adoptExternal(serverActive);
            });
            await writeActiveTrainingSnapshot(serverActive);
            return;
          }
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

  /** Start a workout from cached history and queue `active.repeat` for later. */
  async startFromHistory(
    history: ApiSchemas["TrainingHistory"],
    dateStart: string,
    historyIdForQueue: string,
  ): Promise<void> {
    this.ignoreIncomingActive = false;
    const existingLocal =
      this.data ?? (await readActiveTrainingSnapshot())?.data ?? null;
    if (existingLocal) {
      throw "AlreadyExists";
    }

    const localActive = buildActiveTrainingFromHistory(history, dateStart);
    runInAction(() => {
      this.data = localActive;
      this.error = undefined;
    });
    await writeActiveTrainingSnapshot(localActive);
    await enqueueMutation({
      type: "active.repeat",
      trainingHistoryId: historyIdForQueue,
      dateStart,
    });
    requestFlush();
  }

  async end(
    finalData?: ApiSchemas["ActiveTraining"] | null,
  ): Promise<string> {
    if (endingPromise) return endingPromise;

    const run = this.finishSession(finalData);
    endingPromise = run;
    try {
      return await run;
    } finally {
      if (endingPromise === run) endingPromise = null;
    }
  }

  private async finishSession(
    finalData?: ApiSchemas["ActiveTraining"] | null,
  ): Promise<string> {
    this.isEnding = true;
    try {
      const snapshotFromCache = finalData
        ? null
        : (await readActiveTrainingSnapshot())?.data ?? null;
      const snapshotToSync =
        finalData ?? this.data ?? snapshotFromCache ?? null;

      if (!snapshotToSync) {
        throw new Error("ActiveTrainingDataMissing");
      }

      runInAction(() => {
        syncEngine.lastEndedHistoryId = null;
      });
      runInAction(() => {
        this.data = snapshotToSync;
        this.error = undefined;
      });
      await writeActiveTrainingSnapshot(snapshotToSync);

      const localHistoryId = createLocalHistoryId();
      const deadline = Date.now() + END_ONLINE_WAIT_MS;
      const remainingMs = () => Math.max(0, deadline - Date.now());

      // /end keeps whatever the server already stored. Patch first, but do not
      // wait forever: a stalled request used to leave the finish screen up.
      if (connectivityStore.isOnline) {
        await enqueueMutation({
          type: "active.update",
          body: snapshotToSync,
        });
        const updateWait = await raceWithTimeout(
          syncEngine.flush({ force: true }),
          remainingMs(),
        );
        if (updateWait === "timeout") {
          await enqueueMutation({
            type: "active.end",
            finalData: snapshotToSync,
            localHistoryId,
          });
          return await this.finishLocally(snapshotToSync, localHistoryId);
        }
      }

      await enqueueMutation({
        type: "active.end",
        finalData: snapshotToSync,
        localHistoryId,
      });

      if (!connectivityStore.isOnline || syncEngine.status === "offline") {
        return await this.finishLocally(snapshotToSync, localHistoryId);
      }

      const waitForHistoryId = when(() =>
        Boolean(syncEngine.lastEndedHistoryId),
      );
      const historySignal = waitForHistoryId.then(
        () => undefined,
        () => undefined,
      );
      try {
        await raceWithTimeout(
          Promise.race([
            historySignal,
            syncEngine.flush({ force: true }),
          ]),
          remainingMs(),
        );
      } finally {
        waitForHistoryId.cancel();
      }

      if (syncEngine.lastEndedHistoryId) {
        return syncEngine.lastEndedHistoryId;
      }

      // No server id (offline, HTTP error, or the request never returned).
      // active.end stays queued and is replayed; the summary opens locally.
      return await this.finishLocally(snapshotToSync, localHistoryId);
    } finally {
      // Keep isEnding until the next microtask so the caller can navigate
      // to /end/:id before the page would render "Тренировка не начата".
      queueMicrotask(() => {
        runInAction(() => {
          this.isEnding = false;
        });
      });
    }
  }

  private async finishLocally(
    snapshot: ApiSchemas["ActiveTraining"],
    historyId: string,
  ): Promise<string> {
    runInAction(() => {
      this.ignoreIncomingActive = true;
      this.data = null;
      this.error = "NotFound";
    });
    await trainingHistoryStore.recordLocalFinish(snapshot, historyId);
    await writeActiveTrainingSnapshot(null);
    clearActiveTrainingDraft();

    requestFlush();
    return historyId;
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
