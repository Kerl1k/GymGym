import { createOpenApiHttp } from "openapi-msw";
import { CONFIG } from "@/shared/model/config";
import { ApiPaths } from ".";

export const http = createOpenApiHttp<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});
