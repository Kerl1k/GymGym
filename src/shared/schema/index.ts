import { components, paths } from "./generated";

export async function enableMocking() {
  // Mocking disabled
  return Promise.resolve();
}

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];
