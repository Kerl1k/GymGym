import { StrictMode } from "react";

import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";

import { initSentry, setSentryUser } from "@/shared/lib/sentry";
import { useSession } from "@/shared/model/session";

import { router } from "./router";

async function clearDevServiceWorkers(): Promise<void> {
  if (import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("gym-shell-"))
        .map((key) => caches.delete(key)),
    );
  }
}

async function bootstrap() {
  await clearDevServiceWorkers();

  initSentry();
  const currentSession = useSession.getState().session;
  if (currentSession) {
    setSentryUser({ id: currentSession.userId, email: currentSession.email });
  }

  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/gym-sw.js").catch(() => {
        // registration can fail on unsupported contexts
      });
    });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void bootstrap();
