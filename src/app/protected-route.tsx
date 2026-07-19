import { useEffect, useRef } from "react";

import { Outlet, redirect, Navigate } from "react-router-dom";

import { bootstrapOffline } from "@/entities/offline/bootstrap";
import { prefetchProtectedAppData } from "@/entities/prefetch/prefetchProtectedAppData";
import { prefetchProtectedRouteModules } from "@/entities/prefetch/prefetchProtectedRouteModules";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";

export function ProtectedRoute() {
  const { session } = useSession();
  const didPrefetch = useRef(false);

  useEffect(() => {
    if (!session) {
      didPrefetch.current = false;
      return;
    }
    if (didPrefetch.current) return;
    didPrefetch.current = true;
    void (async () => {
      await bootstrapOffline();
      await Promise.all([
        prefetchProtectedAppData(),
        prefetchProtectedRouteModules(),
      ]);
    })();
  }, [session]);

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  return <Outlet />;
}

// eslint-disable-next-line react-refresh/only-export-components
export async function protectedLoader() {
  const state = useSession.getState();
  const isOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;

  if (isOffline) {
    if (state.hasStoredSession()) {
      await bootstrapOffline();
      return null;
    }
    return redirect(ROUTES.LOGIN);
  }

  const accessToken = await state.refreshToken();

  if (!accessToken) {
    return redirect(ROUTES.LOGIN);
  }

  await bootstrapOffline();
  return null;
}
