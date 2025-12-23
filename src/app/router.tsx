import { ROUTES } from "../shared/model/routes";
import { createBrowserRouter } from "react-router-dom";
import { App } from "./app";
import { Providers } from "./providers";
import { protectedLoader, ProtectedRoute } from "./protected-route";
import { AppHeader } from "@/features/header";

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
            <AppHeader />
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
            lazy: () => import("@/features/trainingList/exercises.page"),
          },
          {
            path: ROUTES.ACTIVE_TRAINING,
            lazy: () =>
              import("@/features/activeTraining/ui/ActiveTraining.page"),
          },
          {
            path: ROUTES.PROFILE,
            lazy: () => import("@/features/profile/profile.page"),
          },
          {
            path: ROUTES.TEST,
            lazy: () => import("@/features/startTraining/training-start.page"),
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
