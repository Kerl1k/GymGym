import { makeAutoObservable, observable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import {
  connectivityStore,
  historyFromActiveTraining,
  isLocalHistoryId,
  readHistorySnapshot,
  readIdMap,
  resolveId,
  writeHistorySnapshot,
} from "@/entities/offline";
import { ApiSchemas } from "@/shared/schema";

type HistoryListQuery = {
  limit: number;
  page?: number;
  orderBy?: string;
  /** Documented query param. Same JSON shape as the trainings list. */
  filter?: string;
  /** Kept for backends that still read the old name. */
  where?: string;
};

type HistoryListResponse = {
  content?: ApiSchemas["TrainingHistory"][];
  meta?: { limit: number; page: number; pages: number };
};

type HistoryNameFilter = {
  name?: { equals?: string; contains?: string };
};

function historyNameKey(name: string): string {
  return name.trim().toLocaleLowerCase("ru-RU");
}

function parseObject<T extends object>(serialized?: string): T | undefined {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized) as T;
    return typeof parsed === "object" && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function matchesHistoryFilter(
  item: ApiSchemas["TrainingHistory"],
  query: HistoryListQuery,
): boolean {
  const filter = parseObject<HistoryNameFilter>(query.filter ?? query.where);
  const equalsName = filter?.name?.equals?.trim();
  if (equalsName && historyNameKey(item.name) !== historyNameKey(equalsName)) {
    return false;
  }

  const containsName = filter?.name?.contains?.trim();
  if (
    containsName &&
    !item.name.toLowerCase().includes(containsName.toLowerCase())
  ) {
    return false;
  }

  return true;
}

function projectHistory(
  content: ApiSchemas["TrainingHistory"][],
  query: HistoryListQuery,
): ApiSchemas["TrainingHistory"][] {
  const filtered = content.filter((item) => matchesHistoryFilter(item, query));
  const orderBy = parseObject<Record<string, "asc" | "desc">>(query.orderBy);
  const [field, direction] = Object.entries(orderBy ?? {})[0] ?? [];
  const sorted = [...filtered];

  if (field === "dateStart") {
    const multiplier = direction === "asc" ? 1 : -1;
    sorted.sort(
      (a, b) =>
        (new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()) *
        multiplier,
    );
  } else {
    sorted.sort(
      (a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
    );
  }

  const limit = query.limit > 0 ? query.limit : sorted.length;
  const page = query.page && query.page > 0 ? query.page : 1;
  const start = (page - 1) * limit;
  return sorted.slice(start, start + limit);
}

function isNetworkFailure(error: unknown): boolean {
  if (!connectivityStore.isOnline) return true;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("failed to fetch") || message.includes("network");
  }
  return false;
}

class TrainingHistoryStore {
  private lists = observable.map<string, HistoryListResponse | undefined>(undefined, {
    deep: false,
  });
  private listLoading = observable.map<string, boolean>(undefined, { deep: false });
  private byId = observable.map<string, ApiSchemas["TrainingHistory"] | null | undefined>(undefined, {
    deep: false,
  });
  private byIdLoading = observable.map<string, boolean>(undefined, { deep: false });
  /** null until the IndexedDB snapshot has been read. */
  private catalog: ApiSchemas["TrainingHistory"][] | null = null;
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

  async hydrateFromCache(): Promise<void> {
    await this.loadCatalog();
  }

  private async loadCatalog(): Promise<ApiSchemas["TrainingHistory"][]> {
    if (this.catalog) return this.catalog;
    const snapshot = await readHistorySnapshot();
    const content = snapshot?.content ?? [];
    runInAction(() => {
      this.catalog = content;
      content.forEach((item) => this.byId.set(item.id, item));
    });
    return content;
  }

  private publishQuery(query: HistoryListQuery) {
    const content = projectHistory(this.catalog ?? [], query);
    this.lists.set(this.listKey(query), { content });
    content.forEach((item) => this.byId.set(item.id, item));
  }

  private refreshOpenLists() {
    this.lists.forEach((_, key) => {
      const query = parseObject<HistoryListQuery>(key);
      if (!query) return;
      const content = projectHistory(this.catalog ?? [], query);
      this.lists.set(key, { content });
    });
  }

  private async mergeIntoCatalog(
    incoming: ApiSchemas["TrainingHistory"][],
  ): Promise<void> {
    const current = await this.loadCatalog();
    const merged = new Map(current.map((item) => [item.id, item]));
    incoming.forEach((item) => merged.set(item.id, item));
    const next = [...merged.values()];
    await writeHistorySnapshot(next);
    runInAction(() => {
      this.catalog = next;
      next.forEach((item) => this.byId.set(item.id, item));
    });
  }

  private async upsert(history: ApiSchemas["TrainingHistory"]): Promise<void> {
    const current = await this.loadCatalog();
    const next = [history, ...current.filter((item) => item.id !== history.id)];
    await writeHistorySnapshot(next);
    runInAction(() => {
      this.catalog = next;
      this.byId.set(history.id, history);
      this.refreshOpenLists();
    });
  }

  async findCached(
    historyId: string,
  ): Promise<ApiSchemas["TrainingHistory"] | null> {
    if (!historyId) return null;
    const map = await readIdMap();
    const resolved = resolveId(historyId, map);
    const catalog = await this.loadCatalog();
    return (
      catalog.find((item) => item.id === historyId || item.id === resolved) ??
      null
    );
  }

  /** Remember a workout finished offline so the summary screen can open it. */
  async recordLocalFinish(
    data: ApiSchemas["ActiveTraining"],
    historyId: string,
  ): Promise<void> {
    await this.upsert(historyFromActiveTraining(data, historyId));
  }

  /** Replace the local summary row once `active.end` returns a server id. */
  async adoptServerHistory(
    localId: string | undefined,
    server: ApiSchemas["TrainingHistory"],
  ): Promise<void> {
    const current = await this.loadCatalog();
    const next = [
      server,
      ...current.filter((item) => item.id !== server.id && item.id !== localId),
    ];
    await writeHistorySnapshot(next);
    runInAction(() => {
      this.catalog = next;
      if (localId) this.byId.delete(localId);
      this.byId.set(server.id, server);
      if (localId) this.byId.set(localId, server);
      this.refreshOpenLists();
    });
  }

  async fetchList(query: HistoryListQuery, force = false): Promise<void> {
    const key = this.listKey(query);
    if ((this.listLoading.get(key) ?? false) === true) return;
    if (!force && this.lists.get(key) !== undefined) return;

    this.listLoading.set(key, true);
    try {
      await this.loadCatalog();

      if (!connectivityStore.isOnline) {
        runInAction(() => {
          this.publishQuery(query);
        });
        return;
      }

      const result = await fetchClient.GET("/api/training-history", {
        params: {
          query,
        },
      });
      if (result.error) throw result.error;

      await this.mergeIntoCatalog(result.data?.content ?? []);
      runInAction(() => {
        this.publishQuery(query);
      });
    } catch {
      // Serve whatever is already cached. Do not write an empty snapshot:
      // a failed request is not proof that the user has no history.
      if (this.catalog) {
        runInAction(() => {
          this.publishQuery(query);
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
      const cached = await this.findCached(historyId);
      if (isLocalHistoryId(historyId) || !connectivityStore.isOnline) {
        runInAction(() => {
          this.byId.set(historyId, cached);
        });
        return;
      }

      const result = await fetchClient.GET("/api/training-history/{id}", {
        params: {
          path: {
            id: historyId,
          },
        },
      });
      if (result.error) throw result.error;

      if (result.data) {
        await this.upsert(result.data);
      }
      runInAction(() => {
        this.byId.set(historyId, result.data ?? cached);
      });
    } catch {
      const cached = await this.findCached(historyId);
      runInAction(() => {
        if (cached) {
          this.byId.set(historyId, cached);
          return;
        }
        if (this.byId.get(historyId) === undefined) {
          this.byId.set(historyId, null);
        }
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
        this.byId.delete(historyId);
        if (this.catalog) {
          this.catalog = this.catalog.filter((item) => item.id !== historyId);
        }
        for (const [key, list] of this.lists.entries()) {
          if (!list?.content) continue;
          const nextContent = list.content.filter((item) => item.id !== historyId);
          if (nextContent.length === list.content.length) continue;
          this.lists.set(key, { ...list, content: nextContent });
        }
      });
      if (this.catalog) {
        await writeHistorySnapshot(this.catalog);
      }
    } finally {
      runInAction(() => {
        this.deletingId = null;
      });
    }
  }

  async repeatTraining(trainingHistoryId: string, dateStart: string): Promise<void> {
    this.repeatPending = true;
    try {
      const map = await readIdMap();
      const queueId = resolveId(trainingHistoryId, map);

      if (connectivityStore.isOnline && !isLocalHistoryId(queueId)) {
        try {
          const response = await fetchClient.POST("/api/active-training/repeat", {
            body: {
              trainingHistoryId: queueId,
              dateStart,
            },
          });
          if (response.error) throw response.error;
          return;
        } catch (error) {
          if (!isNetworkFailure(error)) throw error;
        }
      }

      const history =
        (await this.findCached(trainingHistoryId)) ??
        (await this.findCached(queueId));
      if (!history) {
        throw new Error("HistoryNotFound");
      }

      const { activeTrainingStore } = await import(
        "@/entities/training-active/active-training.store"
      );
      await activeTrainingStore.startFromHistory(history, dateStart, queueId);
    } finally {
      runInAction(() => {
        this.repeatPending = false;
      });
    }
  }
}

export const trainingHistoryStore = new TrainingHistoryStore();
