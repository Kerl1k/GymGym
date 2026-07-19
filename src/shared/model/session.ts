import { jwtDecode } from "jwt-decode";
import { makeAutoObservable, runInAction } from "mobx";

import { publicFetchClient } from "../../entities/instance";
import { clearOfflineData } from "../../entities/offline/clear";
import { setSentryUser } from "../lib/sentry";
import { useMobxSelector } from "../lib/useMobxSelector";

type Session = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

class SessionStore {
  accessToken: string | null = localStorage.getItem(TOKEN_KEY);
  private refreshTokenPromise: Promise<string | null> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get session(): Session | null {
    return this.accessToken ? jwtDecode<Session>(this.accessToken) : null;
  }

  login(accessToken: string, refreshToken?: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    this.accessToken = accessToken;

    const currentSession = this.session;
    if (currentSession) {
      setSentryUser({
        id: currentSession.userId,
        email: currentSession.email,
      });
    }
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken = null;
    setSentryUser(null);
    void clearOfflineData();
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async refreshToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    const session = jwtDecode<Session>(this.accessToken);

    if (session.exp < Date.now() / 1000) {
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
          this.logout();
          return null;
        }

        this.refreshTokenPromise = publicFetchClient
          .POST("/api/auth/refresh", {
            body: {
              refreshToken: storedRefreshToken,
            },
          })
          .then((r) => {
            if (r.data?.accessToken && r.data?.refreshToken) {
              this.login(r.data.accessToken, r.data.refreshToken);
              return r.data.accessToken;
            } else {
              this.logout();
              return null;
            }
          })
          .finally(() => {
            runInAction(() => {
              this.refreshTokenPromise = null;
            });
          });
      }

      const newToken = await this.refreshTokenPromise;

      if (newToken) {
        return newToken;
      } else {
        return null;
      }
    }

    return this.accessToken;
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
  () =>
    useMobxSelector(() => ({
      refreshToken: sessionStore.refreshToken,
      login: sessionStore.login,
      logout: sessionStore.logout,
      session: sessionStore.session,
      getRefreshToken: sessionStore.getRefreshToken,
      hasStoredSession: sessionStore.hasStoredSession,
    })),
  {
    getState: getSessionSnapshot,
  },
);
