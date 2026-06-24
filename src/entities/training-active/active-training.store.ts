import { makeAutoObservable, runInAction } from "mobx";

import { toApiErrorCode } from "@/entities/api/request";
import { fetchClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

import {
  clearActiveTrainingDraft,
  readActiveTrainingDraft,
} from "./active-training-cache";

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

  async fetch(force = false): Promise<void> {
    if (this.isFetching) return;
    if (!force && this.data !== undefined) return;

    runInAction(() => {
      this.isFetching = true;
    });

    try {
      const result = await fetchClient.GET("/api/active-training", {
        params: {},
      });
      if (result.error) {
        throw result.error;
      }

      runInAction(() => {
        this.data = result.data ?? null;
        this.error = undefined;
      });
    } catch (error) {
      const localDraft = readActiveTrainingDraft();

      runInAction(() => {
        if (localDraft?.data) {
          this.data = localDraft.data;
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
      const result = await fetchClient.PATCH("/api/active-training/update", {
        body: nextData,
      });
      if (result.error) {
        throw result.error;
      }

      runInAction(() => {
        this.data = result.data ?? nextData;
        this.error = undefined;
      });

      return result.data ?? nextData;
    } finally {
      runInAction(() => {
        this.isUpdating = false;
      });
    }
  }

  async start(id: string): Promise<void> {
    this.isStarting = true;
    try {
      const result = await fetchClient.POST("/api/active-training/start", {
        body: { id, dateStart: new Date().toISOString() },
      });
      if (result.error) {
        throw result.error;
      }

      await this.fetch(true);
    } finally {
      runInAction(() => {
        this.isStarting = false;
      });
    }
  }

  async end(): Promise<string> {
    this.isEnding = true;
    try {
      const result = await fetchClient.POST("/api/active-training/end", {});
      if (result.error) {
        throw result.error;
      }

      const trainingHistory = result.data as ApiSchemas["TrainingHistory"];
      runInAction(() => {
        this.data = null;
        this.error = "NotFound";
      });
      clearActiveTrainingDraft();

      return trainingHistory.id;
    } finally {
      runInAction(() => {
        this.isEnding = false;
      });
    }
  }

  async cancel(): Promise<void> {
    this.isCancelling = true;
    try {
      const result = await fetchClient.POST("/api/active-training/cancel", {});
      if (result.error) {
        throw result.error;
      }

      runInAction(() => {
        this.data = null;
        this.error = "NotFound";
      });
      clearActiveTrainingDraft();
    } finally {
      runInAction(() => {
        this.isCancelling = false;
      });
    }
  }
}

export const activeTrainingStore = new ActiveTrainingStore();
