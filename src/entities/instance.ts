import createFetchClient from "openapi-fetch";

import { apiLoggingMiddleware } from "@/entities/api/logging-middleware";
import { publicFetchClient } from "@/entities/api/public-client";
import { useSession } from "@/entities/session/session";
import { CONFIG } from "@/shared/model/config";
import { ApiPaths } from "@/shared/schema";

export { publicFetchClient };

export const fetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});

fetchClient.use({
  async onRequest({ request }) {
    const accessToken = await useSession.getState().refreshToken();

    if (accessToken) {
      request.headers.set("Authorization", `Bearer ${accessToken}`);
    }
  },
});

fetchClient.use(apiLoggingMiddleware);
