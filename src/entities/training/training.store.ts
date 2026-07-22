import { makeAutoObservable, observable, runInAction } from "mobx";

import { exercisesStore } from "@/entities/exercises/exercises.store";
import { fetchClient } from "@/entities/instance";
import {
  connectivityStore,
  createLocalTraining,
  enqueueMutation,
  readExercisesSnapshot,
  readTrainingsSnapshot,
  removeTrainingFromSnapshot,
  requestFlush,
  upsertTrainingInSnapshot,
  writeTrainingsSnapshot,
} from "@/entities/offline";
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
  private hydrated = false;

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

  applySnapshot(content: ApiSchemas["Training"][]) {
    this.lists.forEach((_, key) => {
      const query = parseSerializedObject<TrainingListQuery>(key);
      if (!query) return;
      const filtered = content.filter((item) => this.matchesListFilter(item, query));
      const sorted = this.sortByOrder(filtered, query);
      this.lists.set(key, { content: sorted.slice(0, query.limit) });
    });
    content.forEach((training) => {
      this.byId.set(training.id, training);
    });
  }

  replaceId(tempId: string, serverTraining: ApiSchemas["Training"]) {
    this.lists.forEach((list, key) => {
      if (!list?.content) return;
      this.lists.set(key, {
        ...list,
        content: list.content.map((item) =>
          item.id === tempId ? serverTraining : item,
        ),
      });
    });
    if (this.byId.has(tempId)) {
      this.byId.delete(tempId);
    }
    this.byId.set(serverTraining.id, serverTraining);
  }

  async hydrateFromCache(): Promise<void> {
    if (this.hydrated) return;
    const snapshot = await readTrainingsSnapshot();
    if (snapshot?.content) {
      runInAction(() => {
        this.applySnapshot(snapshot.content);
        this.hydrated = true;
      });
    }
  }

  async fetchList(query: TrainingListQuery, force = false): Promise<void> {
    await this.hydrateFromCache();
    const key = this.listKey(query);
    if ((this.listLoading.get(key) ?? false) === true) return;
    if (!force && this.lists.get(key) !== undefined) return;

    if (!connectivityStore.isOnline) {
      const snapshot = await readTrainingsSnapshot();
      if (snapshot) {
        const filtered = snapshot.content.filter((item) =>
          this.matchesListFilter(item, query),
        );
        const sorted = this.sortByOrder(filtered, query);
        runInAction(() => {
          this.lists.set(key, { content: sorted.slice(0, query.limit) });
        });
      }
      return;
    }

    this.listLoading.set(key, true);
    try {
      const result = await fetchClient.GET("/api/training", {
        params: { query },
      });
      if (result.error) throw result.error;

      const content = result.data?.content ?? [];
      // Merge into full snapshot for offline filtering later
      const previous = (await readTrainingsSnapshot())?.content ?? [];
      const mergedMap = new Map(previous.map((item) => [item.id, item]));
      content.forEach((item) => mergedMap.set(item.id, item));
      const merged = [...mergedMap.values()];
      await writeTrainingsSnapshot(merged);

      runInAction(() => {
        this.lists.set(key, { content });
        content.forEach((training) => this.byId.set(training.id, training));
        this.hydrated = true;
      });
    } catch {
      const snapshot = await readTrainingsSnapshot();
      if (snapshot) {
        const filtered = snapshot.content.filter((item) =>
          this.matchesListFilter(item, query),
        );
        const sorted = this.sortByOrder(filtered, query);
        runInAction(() => {
          this.lists.set(key, { content: sorted.slice(0, query.limit) });
        });
      } else {
        throw new Error("TrainingsUnavailable");
      }
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
    await this.hydrateFromCache();
    if ((this.byIdLoading.get(trainingId) ?? false) === true) return;
    if (!force && this.byId.get(trainingId) !== undefined) return;

    if (!connectivityStore.isOnline) {
      const snapshot = await readTrainingsSnapshot();
      const found = snapshot?.content.find((item) => item.id === trainingId) ?? null;
      runInAction(() => {
        this.byId.set(trainingId, found);
      });
      return;
    }

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

      const training = result.data ?? null;
      if (training) {
        await upsertTrainingInSnapshot(training);
      }

      runInAction(() => {
        this.byId.set(trainingId, training);
      });
    } catch {
      const snapshot = await readTrainingsSnapshot();
      const found = snapshot?.content.find((item) => item.id === trainingId);
      if (found) {
        runInAction(() => {
          this.byId.set(trainingId, found);
        });
      } else {
        throw new Error("TrainingUnavailable");
      }
    } finally {
      runInAction(() => {
        this.byIdLoading.set(trainingId, false);
      });
    }
  }

  async create(data: ApiSchemas["TrainingCreateBody"]): Promise<void> {
    this.createPending = true;
    try {
      const catalog =
        exercisesStore.getList(20)?.content ??
        (await readExercisesSnapshot())?.content ??
        [];
      const local = createLocalTraining(data, catalog);

      runInAction(() => {
        this.lists.forEach((list, key) => {
          if (!list) return;
          const query = parseSerializedObject<TrainingListQuery>(key);
          if (!query || !this.matchesListFilter(local, query)) return;

          const previousContent = list.content ?? [];
          const contentWithoutCreated = previousContent.filter(
            (training) => training.id !== local.id,
          );
          const merged = [local, ...contentWithoutCreated];
          const sorted = this.sortByOrder(merged, query);
          this.lists.set(key, {
            ...list,
            content: sorted.slice(0, query.limit),
          });
        });
        this.byId.set(local.id, local);
      });

      await upsertTrainingInSnapshot(local);
      await enqueueMutation({
        type: "training.create",
        tempId: local.id,
        body: data,
      });
      requestFlush();
    } finally {
      runInAction(() => {
        this.createPending = false;
      });
    }
  }

  async change(data: ApiSchemas["TrainingUpdateBody"]): Promise<void> {
    this.changePending = true;
    try {
      const catalog =
        exercisesStore.getList(20)?.content ??
        (await readExercisesSnapshot())?.content ??
        [];
      const byId = new Map(catalog.map((item) => [item.id, item]));
      const existing = this.byId.get(data.id);

      const updated: ApiSchemas["Training"] = {
        id: data.id,
        name: data.name ?? existing?.name ?? "",
        favorite: data.favorite ?? existing?.favorite ?? false,
        description: data.description ?? existing?.description ?? "",
        exerciseTypes: data.exerciseTypes.map((ref) => {
          const fromExisting = existing?.exerciseTypes.find((item) => item.id === ref.id);
          const fromCatalog = byId.get(ref.id);
          return {
            id: ref.id,
            name: fromExisting?.name ?? fromCatalog?.name ?? "Упражнение",
            favorite: fromExisting?.favorite ?? fromCatalog?.favorite ?? false,
            description: fromExisting?.description ?? fromCatalog?.description ?? "",
            muscleGroups: fromExisting?.muscleGroups ?? fromCatalog?.muscleGroups ?? [],
            restTime: fromExisting?.restTime ?? fromCatalog?.restTime ?? 90,
          };
        }),
      };

      runInAction(() => {
        this.byId.set(data.id, updated);
        this.lists.clear();
      });
      await upsertTrainingInSnapshot(updated);
      await enqueueMutation({
        type: "training.update",
        entityId: data.id,
        body: data,
      });
      requestFlush();
    } finally {
      runInAction(() => {
        this.changePending = false;
      });
    }
  }

  async remove(trainingId: string): Promise<void> {
    this.deletingId = trainingId;
    try {
      runInAction(() => {
        this.lists.clear();
        this.byId.delete(trainingId);
      });
      await removeTrainingFromSnapshot(trainingId);
      await enqueueMutation({
        type: "training.delete",
        entityId: trainingId,
      });
      requestFlush();
    } finally {
      runInAction(() => {
        this.deletingId = null;
      });
    }
  }
}

export const trainingStore = new TrainingStore();
