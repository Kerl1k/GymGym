import { makeAutoObservable, observable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

type UserHistoryResponse = {
  content: ApiSchemas["TrainingHistory"][];
  meta: {
    limit?: number;
    page?: number;
    pages?: number;
  };
};

class UserStore {
  private list: ApiSchemas["User"][] | undefined = undefined;
  private listLoading = false;
  private byId = observable.map<string, ApiSchemas["User"] | null | undefined>(
    undefined,
    { deep: false },
  );
  private byIdLoading = observable.map<string, boolean>(undefined, {
    deep: false,
  });
  private historyByUserId = observable.map<
    string,
    UserHistoryResponse | undefined
  >(undefined, { deep: false });
  private historyLoading = observable.map<string, boolean>(undefined, {
    deep: false,
  });

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getList(): ApiSchemas["User"][] | undefined {
    return this.list;
  }

  isListLoading(): boolean {
    return this.listLoading && this.list === undefined;
  }

  async fetchList(force = false): Promise<void> {
    if (this.listLoading) return;
    if (!force && this.list !== undefined) return;

    this.listLoading = true;
    try {
      const result = await fetchClient.GET("/api/user");
      if (result.error) throw result.error;

      runInAction(() => {
        this.list = result.data ?? [];
      });
    } finally {
      runInAction(() => {
        this.listLoading = false;
      });
    }
  }

  getById(userId: string): ApiSchemas["User"] | null | undefined {
    return this.byId.get(userId);
  }

  isByIdLoading(userId: string): boolean {
    return (
      (this.byIdLoading.get(userId) ?? false) &&
      this.byId.get(userId) === undefined
    );
  }

  async fetchById(userId: string, force = false): Promise<void> {
    if (!userId) return;
    if ((this.byIdLoading.get(userId) ?? false) === true) return;
    if (!force && this.byId.get(userId) !== undefined) return;

    this.byIdLoading.set(userId, true);
    try {
      const result = await fetchClient.GET("/api/user/{id}", {
        params: { path: { id: userId } },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.byId.set(userId, result.data ?? null);
      });
    } finally {
      runInAction(() => {
        this.byIdLoading.set(userId, false);
      });
    }
  }

  getHistory(userId: string): UserHistoryResponse | undefined {
    return this.historyByUserId.get(userId);
  }

  isHistoryLoading(userId: string): boolean {
    return (
      (this.historyLoading.get(userId) ?? false) &&
      this.historyByUserId.get(userId) === undefined
    );
  }

  async fetchHistory(userId: string, force = false): Promise<void> {
    if (!userId) return;
    if ((this.historyLoading.get(userId) ?? false) === true) return;
    if (!force && this.historyByUserId.get(userId) !== undefined) return;

    this.historyLoading.set(userId, true);
    try {
      const result = await fetchClient.GET("/api/user/{id}/history", {
        params: { path: { id: userId } },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.historyByUserId.set(userId, {
          content: result.data?.content ?? [],
          meta: result.data?.meta ?? {},
        });
      });
    } finally {
      runInAction(() => {
        this.historyLoading.set(userId, false);
      });
    }
  }
}

export const userStore = new UserStore();
