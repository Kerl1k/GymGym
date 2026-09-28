import createFetchClient from "openapi-fetch";

import { CONFIG } from "@/shared/model/config";
import { ApiPaths } from "@/shared/schema";

export const publicFetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});
