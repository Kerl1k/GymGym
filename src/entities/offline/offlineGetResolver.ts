import {
  createFinalURL,
  createQuerySerializer,
  removeTrailingSlash,
} from "openapi-fetch";

import { CONFIG } from "@/shared/model/config";

import type { Query, QueryClient } from "@tanstack/react-query";

const querySerializer = createQuerySerializer({});

function normalizePathnameSearch(
  url: string,
  baseForRelative?: string,
): { pathname: string; search: string } {
  const u = baseForRelative ? new URL(url, baseForRelative) : new URL(url);
  return { pathname: u.pathname, search: u.search };
}

function normalizeQueryString(search: string): string {
  const s = search.startsWith("?") ? search.slice(1) : search;
  if (!s) return "";
  const p = new URLSearchParams(s);
  return [...p.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function urlsMatch(requestUrl: string, builtUrl: string): boolean {
  const a = normalizePathnameSearch(requestUrl);
  const b = normalizePathnameSearch(builtUrl, requestUrl);
  if (a.pathname !== b.pathname) return false;
  return normalizeQueryString(a.search) === normalizeQueryString(b.search);
}

function buildUrlForQueryKey(query: Query): string | null {
  const key = query.queryKey as unknown[];
  if (key[0] !== "get" || typeof key[1] !== "string") return null;
  const path = key[1];
  const init = key[2] as { params?: { path?: Record<string, string>; query?: Record<string, unknown> } } | undefined;
  try {
    const base = removeTrailingSlash(String(CONFIG.API_BASE_URL ?? ""));
    return createFinalURL(path, {
      baseUrl: base,
      params: init?.params ?? {},
      querySerializer,
    });
  } catch {
    return null;
  }
}

function findCachedGetPayload(requestUrl: string, queryClient: QueryClient): unknown | undefined {
  let best: { data: unknown; at: number } | undefined;
  for (const query of queryClient.getQueryCache().getAll()) {
    const built = buildUrlForQueryKey(query);
    if (!built || !urlsMatch(requestUrl, built)) continue;
    const data = query.state.data;
    if (data === undefined) continue;
    const at = query.state.dataUpdatedAt;
    if (!best || at >= best.at) best = { data, at };
  }
  return best?.data;
}

function jsonResponse(status: number, body: unknown): Response {
  const headers = new Headers();
  if (body !== undefined && status !== 204) {
    headers.set("Content-Type", "application/json");
  }
  const text =
    status === 204 || body === undefined
      ? ""
      : typeof body === "string"
        ? JSON.stringify(body)
        : JSON.stringify(body);
  return new Response(text, { status, headers });
}

function emptyListMeta(url: string): { limit: number; page: number; pages: number } {
  const u = new URL(url, typeof window !== "undefined" ? window.location.href : "http://localhost");
  const limit = Number(u.searchParams.get("limit")) || 20;
  const page = Number(u.searchParams.get("page")) || 1;
  return { limit, page, pages: 1 };
}

function emptyHistoryList(url: string) {
  const u = new URL(url, typeof window !== "undefined" ? window.location.href : "http://localhost");
  const limit = Number(u.searchParams.get("limit")) || 10;
  const page = Number(u.searchParams.get("page")) || 1;
  return { content: [], meta: { limit, page, pages: 1 } };
}

async function fallbackGetResponse(request: Request): Promise<Response> {
  const { pathname } = normalizePathnameSearch(request.url);
  const method = request.method.toUpperCase();

  if (method === "HEAD") {
    return new Response(null, { status: 200 });
  }

  if (pathname === "/api/auth/profile") {
    const { useSession } = await import("@/shared/model/session");
    const s = useSession.getState().session;
    if (s) {
      return jsonResponse(200, { id: s.userId, email: s.email });
    }
    return jsonResponse(401, "Unauthorized");
  }

  if (pathname === "/api/active-training") {
    return jsonResponse(404, "NotFound");
  }

  if (pathname === "/api/training") {
    return jsonResponse(200, { content: [], meta: emptyListMeta(request.url) });
  }

  if (pathname === "/api/exercise-type") {
    return jsonResponse(200, { content: [], meta: emptyListMeta(request.url) });
  }

  if (pathname === "/api/training-history") {
    return jsonResponse(200, emptyHistoryList(request.url));
  }

  const trainingId = pathname.match(/^\/api\/training\/([^/]+)$/)?.[1];
  if (trainingId && !pathname.includes("{")) {
    return jsonResponse(404, "NotFound");
  }

  const exerciseId = pathname.match(/^\/api\/exercise-type\/([^/]+)$/)?.[1];
  if (exerciseId) {
    return jsonResponse(404, "NotFound");
  }

  const historyId = pathname.match(/^\/api\/training-history\/([^/]+)$/)?.[1];
  if (historyId) {
    return jsonResponse(404, "NotFound");
  }

  return jsonResponse(404, "NotFound");
}

/**
 * Офлайн-обработка GET/HEAD: сначала точное совпадение URL с ключом кэша TanStack Query,
 * иначе — ответы в форме, ожидаемой бекендом (пустые списки, NotFound, профиль из сессии).
 */
export async function resolveOfflineReadRequest(
  request: Request,
  queryClient: QueryClient,
): Promise<Response> {
  const method = request.method.toUpperCase();

  const cached = findCachedGetPayload(request.url, queryClient);
  if (cached !== undefined) {
    if (method === "HEAD") {
      return new Response(null, { status: 200 });
    }
    return jsonResponse(200, cached);
  }

  return fallbackGetResponse(request);
}
