import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { compileTsServiceWorker } from "./vite-plugins/compile-ts-service-worker";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      compileTsServiceWorker(),
      react(),
      tsconfigPaths(),
      tailwindcss(),
    ],
  };
});
