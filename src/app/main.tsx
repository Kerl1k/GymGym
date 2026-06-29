import { StrictMode } from "react";

import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";

import { initSentry, setSentryUser } from "@/shared/lib/sentry";
import { useSession } from "@/shared/model/session";
import { enableMocking } from "@/shared/schema";

import { router } from "./router";

initSentry();
const currentSession = useSession.getState().session;
if (currentSession) {
  setSentryUser({ id: currentSession.userId, email: currentSession.email });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
