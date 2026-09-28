import type { Middleware } from "openapi-fetch";

const MAX_BODY_LENGTH = 500;

function truncate(value: string) {
  return value.length > MAX_BODY_LENGTH
    ? `${value.slice(0, MAX_BODY_LENGTH)}…`
    : value;
}

function extractServerMessage(body: string): string | undefined {
  if (!body) return undefined;

  try {
    const parsed: unknown = JSON.parse(body);

    if (typeof parsed === "string") return parsed;

    if (parsed && typeof parsed === "object") {
      for (const key of ["message", "error", "detail", "title"]) {
        const value = (parsed as Record<string, unknown>)[key];
        if (typeof value === "string" && value) return value;
      }
    }
  } catch {
    // not JSON
  }

  return truncate(body);
}

async function readBody(response: Response) {
  try {
    return await response.clone().text();
  } catch {
    return "";
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export const apiLoggingMiddleware: Middleware = {
  async onResponse({ request, response, schemaPath, params }) {
    if (response.ok) return;

    const body = await readBody(response);
    const serverMessage = extractServerMessage(body);
    const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;

    console.error(
      `[API] ${request.method} ${schemaPath} → ${status}${serverMessage ? `: ${serverMessage}` : ""}`,
      {
        url: request.url,
        status: response.status,
        pathParams: params.path,
        query: params.query,
        responseBody: truncate(body),
      },
    );
  },

  onError({ request, error, schemaPath }) {
    const reason = navigator.onLine ? "сетевая ошибка" : "нет сети (offline)";

    console.error(
      `[API] ${request.method} ${schemaPath} → ${reason}: ${getErrorMessage(error)}`,
      { url: request.url, error },
    );
  },
};
