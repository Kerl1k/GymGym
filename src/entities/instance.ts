import createFetchClient from "openapi-fetch";

import { CONFIG } from "@/shared/model/config";

import { useSession } from "../shared/model/session";
import { ApiPaths } from "../shared/schema";

export const fetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});

export const publicFetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});

fetchClient.use({
  async onRequest({ request }) {
    const accessToken = await useSession.getState().refreshToken();

    if (accessToken) {
      request.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      return;
    }
  },
});
