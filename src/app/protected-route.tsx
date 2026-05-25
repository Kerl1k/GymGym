import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Outlet, redirect, Navigate } from "react-router-dom";

import { prefetchProtectedAppData } from "@/entities/prefetch/prefetchProtectedAppData";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { enableMocking } from "@/shared/schema";

export function ProtectedRoute() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const didPrefetch = useRef(false);

  useEffect(() => {
    if (!session) {
      didPrefetch.current = false;
      return;
    }
    if (didPrefetch.current) return;
    didPrefetch.current = true;
    void prefetchProtectedAppData(queryClient);
  }, [session, queryClient]);

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  return <Outlet />;
}

export async function protectedLoader() {
  await enableMocking();

  const accessToken = await useSession.getState().refreshToken();

  if (!accessToken) {
    return redirect(ROUTES.LOGIN);
  }

  return null;
}
