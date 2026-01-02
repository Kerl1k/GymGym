import { Outlet, redirect , Navigate } from "react-router-dom";

import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { enableMocking } from "@/shared/schema";

export function ProtectedRoute() {
  const { session } = useSession();

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  return <Outlet />;
}

export async function protectedLoader() {
  await enableMocking();

  const token = await useSession.getState().refreshToken();

  if (!token) {
    return redirect(ROUTES.LOGIN);
  }

  return null;
}
