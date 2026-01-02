import { createBrowserRouter } from "react-router-dom";

import { ROUTES } from "../shared/model/routes";

import { App } from "./app";
import { protectedLoader, ProtectedRoute } from "./protected-route";
import { Providers } from "./providers";

export const router = createBrowserRouter([
  {
    element: (
      <Providers>
        <App />
      </Providers>
    ),
    children: [
      {
        loader: protectedLoader,
        element: (
          <>
            <ProtectedRoute />
          </>
        ),
        children: [
          {
            path: ROUTES.HOME,
            lazy: () => import("@/features/exercises/exercises.page"),
          },
          {
            path: ROUTES.TRAINING,
            lazy: () => import("@/features/trainingList/training.page"),
          },
          {
            path: ROUTES.ACTIVE_TRAINING,
            lazy: () => import("@/features/activeTraining/ActiveTraining.page"),
          },
          {
            path: ROUTES.PROFILE,
            lazy: () => import("@/features/profile/profile.page"),
          },
          {
            path: ROUTES.TEST,
            lazy: () => import("@/features/startTraining/training-start.page"),
          },
          {
            path: ROUTES.TRAINING_HISTORY,
            lazy: () =>
              import("@/features/trainingHistory/training-history.page"),
          },
        ],
      },

      {
        path: ROUTES.LOGIN,
        lazy: () => import("@/features/auth/login.page"),
      },
      {
        path: ROUTES.REGISTER,
        lazy: () => import("@/features/auth/register.page"),
      },
    ],
  },
]);
