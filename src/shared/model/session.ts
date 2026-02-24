import { useState } from "react";

import { createGStore } from "create-gstore";
import { jwtDecode } from "jwt-decode";

import { publicFetchClient } from "../../entities/instance";

type Session = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

let refreshTokenPromise: Promise<string | null> | null = null;

export const useSession = createGStore(() => {
  const [accessToken, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const login = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
  };

  const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  };

  const session = accessToken ? jwtDecode<Session>(accessToken) : null;

  const refreshToken = async () => {
    if (!accessToken) {
      return null;
    }

    const session = jwtDecode<Session>(accessToken);

    if (session.exp < Date.now() / 1000) {
      if (!refreshTokenPromise) {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!storedRefreshToken) {
          logout();
          return null;
        }

        refreshTokenPromise = publicFetchClient
          .POST("/api/auth/refresh", {
            headers: {
              Cookie: `refreshToken=${storedRefreshToken}`,
            },
          })
          .then((r) => {
            if (r.data?.accessToken && r.data?.refreshToken) {
              login(r.data.accessToken, r.data.refreshToken);
              return r.data.accessToken;
            } else {
              logout();
              return null;
            }
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      const newToken = await refreshTokenPromise;

      if (newToken) {
        return newToken;
      } else {
        return null;
      }
    }

    return accessToken;
  };

  return { refreshToken, login, logout, session, getRefreshToken };
});
