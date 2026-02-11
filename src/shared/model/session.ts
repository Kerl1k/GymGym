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

let refreshTokenPromise: Promise<string | null> | null = null;

export const useSession = createGStore(() => {
  const [accessToken, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const login = (accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const session = accessToken ? jwtDecode<Session>(accessToken) : null;

  const refreshToken = async () => {
    if (!accessToken) {
      return null;
    }

    const session = jwtDecode<Session>(accessToken);

    if (session.exp < Date.now() / 1000) {
      if (!refreshTokenPromise) {
        refreshTokenPromise = publicFetchClient
          .POST("/api/auth/refresh")
          .then((r) => r.data?.accessToken ?? null)
          .then((newToken) => {
            if (newToken) {
              login(newToken);
              return newToken;
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

  return { refreshToken, login, logout, session };
});
