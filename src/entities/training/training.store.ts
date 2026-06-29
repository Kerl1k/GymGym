import { makeAutoObservable, observable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";

type TrainingListQuery = {
  page: number;
  limit: number;
  filter?: string;
  orderBy?: string;
};

type TrainingListResponse = { content?: ApiSchemas["Training"][] };

function parseSerializedObject<T extends object>(serialized?: string): T | undefined {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized) as T;
    return typeof parsed === "object" && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

class TrainingStore {
  private lists = observable.map<string, TrainingListResponse | undefined>(undefined, {
    deep: false,
  });
  private listLoading = observable.map<string, boolean>(undefined, { deep: false });
  private byId = observable.map<string, ApiSchemas["Training"] | null | undefined>(undefined, {
    deep: false,
  });
  private byIdLoading = observable.map<string, boolean>(undefined, { deep: false });
  createPending = false;
  changePending = false;
  deletingId: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private listKey(query: TrainingListQuery): string {
    return JSON.stringify(query);
  }

  private matchesListFilter(training: ApiSchemas["Training"], query: TrainingListQuery) {
    const parsedFilter = parseSerializedObject<{
      favorite?: boolean;
      name?: { contains?: string };
    }>(query.filter);

    if (parsedFilter?.favorite === true && !training.favorite) {
      return false;
    }

    const containsName = parsedFilter?.name?.contains?.trim();
    if (containsName) {
      return training.name.toLowerCase().includes(containsName.toLowerCase());
    }

    return true;
  }

  private sortByOrder(
    trainings: ApiSchemas["Training"][],
    query: TrainingListQuery,
  ): ApiSchemas["Training"][] {
    const orderBy = parseSerializedObject<Record<string, "asc" | "desc">>(query.orderBy);
    if (!orderBy) return trainings;

    const [field, direction] =
      Object.entries(orderBy)[0] ?? (["", "asc"] as [string, "asc" | "desc"]);
    const directionMultiplier = direction === "desc" ? -1 : 1;
    const sorted = [...trainings];

    if (field === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name) * directionMultiplier);
      return sorted;
    }

    if (field === "favorite") {
      sorted.sort(
        (a, b) => (Number(a.favorite) - Number(b.favorite)) * directionMultiplier,
      );
      return sorted;
    }

    return trainings;
  }

  getList(query: TrainingListQuery): TrainingListResponse | undefined {
    return this.lists.get(this.listKey(query));
  }

  isListLoading(query: TrainingListQuery): boolean {
    const key = this.listKey(query);
    return (this.listLoading.get(key) ?? false) && this.lists.get(key) === undefined;
  }

  async fetchList(query: TrainingListQuery, force = false): Promise<void> {
    const key = this.listKey(query);
    if ((this.listLoading.get(key) ?? false) === true) return;
    if (!force && this.lists.get(key) !== undefined) return;

    this.listLoading.set(key, true);
    try {
      const result = await fetchClient.GET("/api/training", {
        params: { query },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.lists.set(key, result.data ?? { content: [] });
      });
    } finally {
      runInAction(() => {
        this.listLoading.set(key, false);
      });
    }
  }

  getById(trainingId: string): ApiSchemas["Training"] | null | undefined {
    return this.byId.get(trainingId);
  }

  isByIdLoading(trainingId: string): boolean {
    return (this.byIdLoading.get(trainingId) ?? false) && this.byId.get(trainingId) === undefined;
  }

  async fetchById(trainingId: string, force = false): Promise<void> {
    if (!trainingId) return;
    if ((this.byIdLoading.get(trainingId) ?? false) === true) return;
    if (!force && this.byId.get(trainingId) !== undefined) return;

    this.byIdLoading.set(trainingId, true);
    try {
      const result = await fetchClient.GET("/api/training/{id}", {
        params: {
          path: {
            id: trainingId,
          },
        },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.byId.set(trainingId, result.data ?? null);
      });
    } finally {
      runInAction(() => {
        this.byIdLoading.set(trainingId, false);
      });
    }
  }

  async create(data: ApiSchemas["TrainingCreateBody"]): Promise<void> {
    this.createPending = true;
    try {
      const result = await fetchClient.POST("/api/training", { body: data });
      if (result.error) throw result.error;
      const createdTraining = result.data;

      runInAction(() => {
        if (!createdTraining) {
          return;
        }

        this.lists.forEach((list, key) => {
          if (!list) return;

          const query = parseSerializedObject<TrainingListQuery>(key);
          if (!query || !this.matchesListFilter(createdTraining, query)) {
            return;
          }

          const previousContent = list.content ?? [];
          const contentWithoutCreated = previousContent.filter(
            (training) => training.id !== createdTraining.id,
          );
          const merged = [createdTraining, ...contentWithoutCreated];
          const sorted = this.sortByOrder(merged, query);

          this.lists.set(key, {
            ...list,
            content: sorted.slice(0, query.limit),
          });
        });
      });
    } finally {
      runInAction(() => {
        this.createPending = false;
      });
    }
  }

  async change(data: ApiSchemas["TrainingUpdateBody"]): Promise<void> {
    this.changePending = true;
    try {
      const result = await fetchClient.PATCH("/api/training", {
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

  async remove(trainingId: string): Promise<void> {
    this.deletingId = trainingId;
    try {
      const result = await fetchClient.DELETE("/api/training/{id}", {
        params: { path: { id: trainingId } },
      });
      if (result.error) throw result.error;

      runInAction(() => {
        this.lists.clear();
        this.byId.delete(trainingId);
      });
    } finally {
      runInAction(() => {
        this.deletingId = null;
      });
    }
  }
}

export const trainingStore = new TrainingStore();
