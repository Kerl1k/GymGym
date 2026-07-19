import { makeAutoObservable, observable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
import {
  connectivityStore,
  createLocalExercise,
  enqueueMutation,
  readExercisesSnapshot,
  removeExerciseFromSnapshot,
  requestFlush,
  upsertExerciseInSnapshot,
  writeExercisesSnapshot,
} from "@/entities/offline";
import { ApiSchemas } from "@/shared/schema";

type ExerciseListResponse = { content?: ApiSchemas["ExerciseType"][] };

class ExercisesStore {
  private listByLimit = observable.map<number, ExerciseListResponse | undefined>(undefined, {
    deep: false,
  });
  private loadingByLimit = observable.map<number, boolean>(undefined, { deep: false });
  createPending = false;
  changePending = false;
  deletingId: string | null = null;
  private hydrated = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getList(limit: number): ExerciseListResponse | undefined {
    return this.listByLimit.get(limit);
  }

  isListLoading(limit: number): boolean {
    return (this.loadingByLimit.get(limit) ?? false) && this.getList(limit) === undefined;
  }

  applySnapshot(content: ApiSchemas["ExerciseType"][]) {
    this.listByLimit.forEach((_, limit) => {
      this.listByLimit.set(limit, { content: content.slice(0, limit) });
    });
    if (this.listByLimit.size === 0) {
      this.listByLimit.set(20, { content: content.slice(0, 20) });
    }
  }

  replaceId(tempId: string, serverExercise: ApiSchemas["ExerciseType"]) {
    this.listByLimit.forEach((list, limit) => {
      if (!list?.content) return;
      this.listByLimit.set(limit, {
        ...list,
        content: list.content.map((item) =>
          item.id === tempId ? serverExercise : item,
        ),
      });
    });
  }

  async hydrateFromCache(): Promise<void> {
    if (this.hydrated) return;
    const snapshot = await readExercisesSnapshot();
    if (snapshot?.content) {
      runInAction(() => {
        this.applySnapshot(snapshot.content);
        this.hydrated = true;
      });
    }
  }

  private mergeCreatedIntoLists(createdExercise: ApiSchemas["ExerciseType"]) {
    this.listByLimit.forEach((list, limit) => {
      if (!list) return;

      const previousContent = list.content ?? [];
      const contentWithoutCreated = previousContent.filter(
        (exercise) => exercise.id !== createdExercise.id,
      );

      this.listByLimit.set(limit, {
        ...list,
        content: [createdExercise, ...contentWithoutCreated].slice(0, limit),
      });
    });

    if (this.listByLimit.size === 0) {
      this.listByLimit.set(20, { content: [createdExercise] });
    }
  }

  private patchInLists(updated: ApiSchemas["ExerciseTypeUpdateBody"]) {
    this.listByLimit.forEach((list, limit) => {
      if (!list?.content) return;
      this.listByLimit.set(limit, {
        ...list,
        content: list.content.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                name: updated.name ?? item.name,
                favorite: updated.favorite ?? item.favorite,
                description: updated.description ?? item.description,
                restTime: updated.restTime ?? item.restTime,
                muscleGroups: updated.muscleGroups ?? item.muscleGroups,
                units: updated.units ?? item.units,
              }
            : item,
        ),
      });
    });
  }

  private removeFromLists(exerciseId: string) {
    this.listByLimit.forEach((list, limit) => {
      if (!list?.content) return;
      this.listByLimit.set(limit, {
        ...list,
        content: list.content.filter((item) => item.id !== exerciseId),
      });
    });
  }

  async fetchList(limit: number, force = false): Promise<void> {
    await this.hydrateFromCache();

    if ((this.loadingByLimit.get(limit) ?? false) === true) return;
    if (!force && this.getList(limit) !== undefined) return;

    if (!connectivityStore.isOnline) {
      const snapshot = await readExercisesSnapshot();
      if (snapshot) {
        runInAction(() => {
          this.listByLimit.set(limit, {
            content: snapshot.content.slice(0, limit),
          });
        });
      }
      return;
    }

    this.loadingByLimit.set(limit, true);
    try {
      const result = await fetchClient.GET("/api/exercise-type", {
        params: {
          query: {
            page: 1,
            limit,
          },
        },
      });
      if (result.error) throw result.error;

      const content = result.data?.content ?? [];
      await writeExercisesSnapshot(content);

      runInAction(() => {
        this.listByLimit.set(limit, { content });
        this.hydrated = true;
      });
    } catch {
      const snapshot = await readExercisesSnapshot();
      if (snapshot) {
        runInAction(() => {
          this.listByLimit.set(limit, {
            content: snapshot.content.slice(0, limit),
          });
        });
      } else {
        throw new Error("ExercisesUnavailable");
      }
    } finally {
      runInAction(() => {
        this.loadingByLimit.set(limit, false);
      });
    }
  }

  async create(data: ApiSchemas["ExerciseTypeCreateBody"]): Promise<void> {
    this.createPending = true;
    try {
      const local = createLocalExercise(data);
      runInAction(() => {
        this.mergeCreatedIntoLists(local);
      });
      await upsertExerciseInSnapshot(local);
      await enqueueMutation({
        type: "exercise.create",
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

  async change(data: ApiSchemas["ExerciseTypeUpdateBody"]): Promise<void> {
    this.changePending = true;
    try {
      runInAction(() => {
        this.patchInLists(data);
      });

      const lists = [...this.listByLimit.values()];
      const fromList = lists
        .flatMap((list) => list?.content ?? [])
        .find((item) => item.id === data.id);
      if (fromList) {
        await upsertExerciseInSnapshot(fromList);
      }

      await enqueueMutation({
        type: "exercise.update",
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

  async remove(exerciseId: string): Promise<void> {
    this.deletingId = exerciseId;
    try {
      runInAction(() => {
        this.removeFromLists(exerciseId);
      });
      await removeExerciseFromSnapshot(exerciseId);
      await enqueueMutation({
        type: "exercise.delete",
        entityId: exerciseId,
      });
      requestFlush();
    } finally {
      runInAction(() => {
        this.deletingId = null;
      });
    }
  }
}

export const exercisesStore = new ExercisesStore();
