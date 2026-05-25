import { StrictMode } from "react";

import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";

import { enableMocking } from "@/shared/schema";

import { router } from "./router";

function registerGymServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // В dev Vite подгружает модули через fetch; SW ломает dynamic import() и HMR.
  if (import.meta.env.DEV) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) {
          if (r.active?.scriptURL?.includes("gym-sw")) void r.unregister();
        }
      });
    });
    return;
  }
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/gym-sw.js");
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
