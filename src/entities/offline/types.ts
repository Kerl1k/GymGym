import type { ApiSchemas } from "@/shared/schema";

export type SyncStatus = "offline" | "synced" | "syncing" | "error";

export type OutboxMutationType =
  | "exercise.create"
  | "exercise.update"
  | "exercise.delete"
  | "training.create"
  | "training.update"
  | "training.delete"
  | "active.start"
  | "active.update"
  | "active.end"
  | "active.cancel";

type OutboxBase = {
  id: string;
  createdAt: number;
  status: "pending" | "error";
  errorMessage?: string;
};

export type OutboxMutation =
  | (OutboxBase & {
      type: "exercise.create";
      tempId: string;
      body: ApiSchemas["ExerciseTypeCreateBody"];
    })
  | (OutboxBase & {
      type: "exercise.update";
      entityId: string;
      body: ApiSchemas["ExerciseTypeUpdateBody"];
    })
  | (OutboxBase & {
      type: "exercise.delete";
      entityId: string;
    })
  | (OutboxBase & {
      type: "training.create";
      tempId: string;
      body: ApiSchemas["TrainingCreateBody"];
    })
  | (OutboxBase & {
      type: "training.update";
      entityId: string;
      body: ApiSchemas["TrainingUpdateBody"];
    })
  | (OutboxBase & {
      type: "training.delete";
      entityId: string;
    })
  | (OutboxBase & {
      type: "active.start";
      trainingId: string;
      dateStart: string;
    })
  | (OutboxBase & {
      type: "active.update";
      body: ApiSchemas["ActiveTraining"];
    })
  | (OutboxBase & {
      type: "active.end";
      /** Final workout payload saved offline; sent on reconnect with end. */
      finalData?: ApiSchemas["ActiveTraining"];
    })
  | (OutboxBase & {
      type: "active.cancel";
    });

export type ExercisesSnapshot = {
  content: ApiSchemas["ExerciseType"][];
  updatedAt: number;
};

export type TrainingsSnapshot = {
  content: ApiSchemas["Training"][];
  updatedAt: number;
};

export type ActiveTrainingSnapshot = {
  data: ApiSchemas["ActiveTraining"] | null;
  updatedAt: number;
};

export type IdMap = Record<string, string>;
