import { setupWorker } from "msw/browser";
import { trainingsHandlers } from "@/entities/training/training";
import { authHandlers } from "@/entities/auth/auth";
import { exercisesHandlers } from "@/entities/exercises/exercises";
import { activeTrainingsHandlers } from "@/entities/training-active/active-training";

export const worker = setupWorker(
  ...authHandlers,
  ...exercisesHandlers,
  ...trainingsHandlers,
  ...activeTrainingsHandlers,
);
