import { StrictMode } from "react";

import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";

import { enableMocking } from "@/shared/schema";

import { router } from "./router";

function registerGymServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // В dev service worker уже может регистрироваться через vite-плагин,
  // но повторная регистрация того же скрипта безопасна.
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/gym-sw.js")
      .catch(() => undefined);
  });
}

enableMocking().then(() => {
  registerGymServiceWorker();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
