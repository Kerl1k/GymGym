import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { exercisesHandlers } from "./handlers/exercises";
import { trainingsHandlers } from "./handlers/training";

export const worker = setupWorker(
  ...authHandlers,
  ...exercisesHandlers,
  ...trainingsHandlers,
);
