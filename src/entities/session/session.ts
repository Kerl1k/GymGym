import { jwtDecode } from "jwt-decode";
import { makeAutoObservable, runInAction } from "mobx";

import { publicFetchClient } from "@/entities/api/public-client";
import { setSentryUser } from "@/shared/lib/sentry";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";

type Session = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
/** userId the locally cached offline data belongs to. */
const DATA_OWNER_KEY = "offlineDataOwner";

type UserDataResetListener = () => void | Promise<void>;
const userDataResetListeners = new Set<UserDataResetListener>();

/**
 * Registers cleanup of locally cached user data. Called on explicit logout
 * and when a different user logs in — but not when the session merely
 * expires, so unsynced offline changes survive a re-login.
 */
export function onUserDataReset(listener: UserDataResetListener): () => void {
  userDataResetListeners.add(listener);
  return () => userDataResetListeners.delete(listener);
}

function resetUserData() {
  localStorage.removeItem(DATA_OWNER_KEY);
  userDataResetListeners.forEach((listener) => {
    Promise.resolve(listener()).catch((error: unknown) => {
      console.error("Не удалось очистить локальные данные", error);
    });
  });
}

function decodeSession(token: string | null): Session | null {
  if (!token) return null;
  try {
    return jwtDecode<Session>(token);
  } catch {
    return null;
  }
}

function readStoredAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !decodeSession(token)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

class SessionStore {
  accessToken: string | null = readStoredAccessToken();
  private refreshTokenPromise: Promise<string | null> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get session(): Session | null {
    return decodeSession(this.accessToken);
  }

  login(accessToken: string, refreshToken?: string) {
    const nextSession = decodeSession(accessToken);
    if (!nextSession) {
      this.expire();
      return;
    }

    const previousOwner = localStorage.getItem(DATA_OWNER_KEY);
    if (previousOwner && previousOwner !== nextSession.userId) {
      resetUserData();
    }
    localStorage.setItem(DATA_OWNER_KEY, nextSession.userId);

    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    this.accessToken = accessToken;

    setSentryUser({
      id: nextSession.userId,
      email: nextSession.email,
    });
  }

  /** Explicit sign-out: also drops locally cached data of this user. */
  logout() {
    this.expire();
    resetUserData();
  }

  /** Tokens are no longer valid; local data is kept for the next login. */
  private expire() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken = null;
    setSentryUser(null);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async refreshToken(): Promise<string | null> {
    const session = decodeSession(this.accessToken);
    if (!this.accessToken || !session) {
      return null;
    }

    if (session.exp >= Date.now() / 1000) {
      return this.accessToken;
    }

    const isOffline =
      typeof navigator !== "undefined" && navigator.onLine === false;

    // Offline: keep expired access token so local-first UI can work.
    // Refresh will run on reconnect before sync flush.
    if (isOffline) {
      return this.accessToken;
    }

    if (!this.refreshTokenPromise) {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        this.expire();
        return null;
      }

      const expiredToken = this.accessToken;
      this.refreshTokenPromise = publicFetchClient
        .POST("/api/auth/refresh", {
          body: {
            refreshToken: storedRefreshToken,
          },
        })
        .then(
          (r) => {
            if (r.data?.accessToken && r.data?.refreshToken) {
              this.login(r.data.accessToken, r.data.refreshToken);
              return r.data.accessToken;
            }
            this.expire();
            return null;
          },
          // Network failure: the refresh token may still be valid, so keep
          // the session and let the next request try again.
          () => expiredToken,
        )
        .finally(() => {
          runInAction(() => {
            this.refreshTokenPromise = null;
          });
        });
    }

    return this.refreshTokenPromise;
  }

  hasStoredSession(): boolean {
    return Boolean(this.accessToken || localStorage.getItem(REFRESH_TOKEN_KEY));
  }
}

const sessionStore = new SessionStore();

type SessionSnapshot = {
  refreshToken: () => Promise<string | null>;
  login: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  session: Session | null;
  getRefreshToken: () => string | null;
  hasStoredSession: () => boolean;
};

function getSessionSnapshot(): SessionSnapshot {
  return {
    refreshToken: sessionStore.refreshToken,
    login: sessionStore.login,
    logout: sessionStore.logout,
    session: sessionStore.session,
    getRefreshToken: sessionStore.getRefreshToken,
    hasStoredSession: sessionStore.hasStoredSession,
  };
}

type UseSessionHook = (() => SessionSnapshot) & {
  getState: () => SessionSnapshot;
};

export const useSession: UseSessionHook = Object.assign(
  () => useMobxSelector(getSessionSnapshot),
  {
    getState: getSessionSnapshot,
  },
);
