import { makeAutoObservable, observable, runInAction } from "mobx";

import { toApiErrorCode } from "@/entities/api/request";
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
  private listError: string | null = null;
  private byId = observable.map<string, ApiSchemas["User"] | null | undefined>(
    undefined,
    { deep: false },
  );
  private byIdLoading = observable.map<string, boolean>(undefined, {
    deep: false,
  });
  private byIdError = observable.map<string, string>(undefined, {
    deep: false,
  });
  private historyByUserId = observable.map<
    string,
    UserHistoryResponse | undefined
  >(undefined, { deep: false });
  private historyLoading = observable.map<string, boolean>(undefined, {
    deep: false,
  });
  private historyError = observable.map<string, string>(undefined, {
    deep: false,
  });

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getList(): ApiSchemas["User"][] | undefined {
    return this.list;
  }

  getListError(): string | null {
    return this.listError;
  }

  isListLoading(): boolean {
    return this.listLoading && this.list === undefined;
  }

  async fetchList(force = false): Promise<void> {
    if (this.listLoading) return;
    if (!force && this.list !== undefined) return;

    this.listLoading = true;
    this.listError = null;
    try {
      const result = await fetchClient.GET("/api/user");
      if (result.error) throw result.error;

      runInAction(() => {
        this.list = result.data ?? [];
      });
    } catch (error) {
      runInAction(() => {
        this.listError = toApiErrorCode(error);
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

  getByIdError(userId: string): string | null {
    return this.byIdError.get(userId) ?? null;
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
    this.byIdError.delete(userId);
    try {
      const result = await fetchClient.GET("/api/user/{id}", {
        params: { path: { id: userId } },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.byId.set(userId, result.data ?? null);
      });
    } catch (error) {
      runInAction(() => {
        this.byIdError.set(userId, toApiErrorCode(error));
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

  getHistoryError(userId: string): string | null {
    return this.historyError.get(userId) ?? null;
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
    this.historyError.delete(userId);
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
    } catch (error) {
      runInAction(() => {
        this.historyError.set(userId, toApiErrorCode(error));
      });
    } finally {
      runInAction(() => {
        this.historyLoading.set(userId, false);
      });
    }
  }
}

export const userStore = new UserStore();
