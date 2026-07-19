import { makeAutoObservable, observable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

type HistoryListQuery = {
  limit: number;
  page?: number;
  orderBy?: string;
  where?: string;
};

type HistoryListResponse = {
  content?: ApiSchemas["TrainingHistory"][];
  meta?: { limit: number; page: number; pages: number };
};

class TrainingHistoryStore {
  private lists = observable.map<string, HistoryListResponse | undefined>(undefined, {
    deep: false,
  });
  private listLoading = observable.map<string, boolean>(undefined, { deep: false });
  private byId = observable.map<string, ApiSchemas["TrainingHistory"] | null | undefined>(undefined, {
    deep: false,
  });
  private byIdLoading = observable.map<string, boolean>(undefined, { deep: false });
  changePending = false;
  deletingId: string | null = null;
  repeatPending = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private listKey(query: HistoryListQuery): string {
    return JSON.stringify(query);
  }

  getList(query: HistoryListQuery): HistoryListResponse | undefined {
    return this.lists.get(this.listKey(query));
  }

  isListLoading(query: HistoryListQuery): boolean {
    const key = this.listKey(query);
    return (this.listLoading.get(key) ?? false) && this.lists.get(key) === undefined;
  }

  async fetchList(query: HistoryListQuery, force = false): Promise<void> {
    const key = this.listKey(query);
    if ((this.listLoading.get(key) ?? false) === true) return;
    if (!force && this.lists.get(key) !== undefined) return;

    this.listLoading.set(key, true);
    try {
      const result = await fetchClient.GET("/api/training-history", {
        params: {
          query,
        },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.lists.set(key, result.data ?? { content: [], meta: undefined });
      });
    } catch {
      // Offline / flaky network: keep previous cache, don't reject for void callers
      if (this.lists.get(key) === undefined) {
        runInAction(() => {
          this.lists.set(key, { content: [], meta: undefined });
        });
      }
    } finally {
      runInAction(() => {
        this.listLoading.set(key, false);
      });
    }
  }

  getById(historyId: string): ApiSchemas["TrainingHistory"] | null | undefined {
    return this.byId.get(historyId);
  }

  isByIdLoading(historyId: string): boolean {
    return (this.byIdLoading.get(historyId) ?? false) && this.byId.get(historyId) === undefined;
  }

  async fetchById(historyId: string, force = false): Promise<void> {
    if (!historyId) return;
    if ((this.byIdLoading.get(historyId) ?? false) === true) return;
    if (!force && this.byId.get(historyId) !== undefined) return;

    this.byIdLoading.set(historyId, true);
    try {
      const result = await fetchClient.GET("/api/training-history/{id}", {
        params: {
          path: {
            id: historyId,
          },
        },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.byId.set(historyId, result.data ?? null);
      });
    } finally {
      runInAction(() => {
        this.byIdLoading.set(historyId, false);
      });
    }
  }

  async change(data: ApiSchemas["TrainingHistoryUpdate"]): Promise<void> {
    this.changePending = true;
    try {
      const result = await fetchClient.PATCH("/api/training-history", {
        body: data,
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.lists.clear();
        if (data.id) {
          this.byId.delete(data.id);
        }
      });
    } finally {
      runInAction(() => {
        this.changePending = false;
      });
    }
  }

  async remove(historyId: string): Promise<void> {
    this.deletingId = historyId;
    try {
      const result = await fetchClient.DELETE("/api/training-history/{id}", {
        params: { path: { id: historyId } },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.lists.clear();
        this.byId.delete(historyId);
      });
    } finally {
      runInAction(() => {
        this.deletingId = null;
      });
    }
  }

  async repeatTraining(trainingHistoryId: string, dateStart: string): Promise<void> {
    this.repeatPending = true;
    try {
      const response = await fetchClient.POST("/api/active-training/repeat", {
        body: {
          trainingHistoryId,
          dateStart,
        },
      });
      if (response.error) {
        throw response.error;
      }
    } finally {
      runInAction(() => {
        this.repeatPending = false;
      });
    }
  }
}

export const trainingHistoryStore = new TrainingHistoryStore();
