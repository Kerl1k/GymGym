import { makeAutoObservable, observable, runInAction } from "mobx";

import { fetchClient } from "@/entities/instance";
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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getList(limit: number): ExerciseListResponse | undefined {
    return this.listByLimit.get(limit);
  }

  isListLoading(limit: number): boolean {
    return (this.loadingByLimit.get(limit) ?? false) && this.getList(limit) === undefined;
  }

  async fetchList(limit: number, force = false): Promise<void> {
    if ((this.loadingByLimit.get(limit) ?? false) === true) return;
    if (!force && this.getList(limit) !== undefined) return;

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

      runInAction(() => {
        this.listByLimit.set(limit, result.data ?? { content: [] });
      });
    } finally {
      runInAction(() => {
        this.loadingByLimit.set(limit, false);
      });
    }
  }

  async create(data: ApiSchemas["ExerciseTypeCreateBody"]): Promise<void> {
    this.createPending = true;
    try {
      const result = await fetchClient.POST("/api/exercise-type", { body: data });
      if (result.error) throw result.error;
      const createdExercise = result.data;
      runInAction(() => {
        if (!createdExercise) {
          return;
        }

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
      });
    } finally {
      runInAction(() => {
        this.createPending = false;
      });
    }
  }

  async change(data: ApiSchemas["ExerciseTypeUpdateBody"]): Promise<void> {
    this.changePending = true;
    try {
      const result = await fetchClient.PATCH("/api/exercise-type", {
        body: data,
      });
      if (result.error) throw result.error;
      runInAction(() => {
        this.listByLimit.clear();
      });
    } finally {
      runInAction(() => {
        this.changePending = false;
      });
    }
  }

  async remove(exerciseId: string): Promise<void> {
    this.deletingId = exerciseId;
    try {
      const result = await fetchClient.DELETE("/api/exercise-type/{id}", {
        params: { path: { id: exerciseId } },
      });
      if (result.error) throw result.error;
      runInAction(() => {
        this.listByLimit.clear();
      });
    } finally {
      runInAction(() => {
        this.deletingId = null;
      });
    }
  }
}

export const exercisesStore = new ExercisesStore();
