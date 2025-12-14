import { components, paths } from "./generated";

export async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }

  const { worker } = await import("@/shared/api/browser");
  return worker.start();
}

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];
