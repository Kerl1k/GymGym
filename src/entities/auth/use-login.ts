import { useCallback, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { ApiSchemas } from "@/shared/schema";

import { authStore } from "./auth.store";

export function useLogin() {
  const navigate = useNavigate();
  const session = useSession();
  const [offlineError, setOfflineError] = useState<string | undefined>();

  const login = useCallback(
    async (data: ApiSchemas["AuthLoginBody"]) => {
      setOfflineError(undefined);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOfflineError("Для входа нужен интернет");
        return;
      }
      const result = await authStore.login(data);
      if (result?.accessToken) {
        session.login(result.accessToken, result.refreshToken);
        navigate(ROUTES.HOME);
      }
    },
    [navigate, session],
  );

  const { errorCode, isPending } = useMobxSelector(() => ({
    errorCode: authStore.loginErrorCode,
    isPending: authStore.loginPending,
  }));

  const errorMessage =
    offlineError ??
    (errorCode
      ? errorCode === "InvalidCredentials"
        ? "Неправильно введены данные"
        : "Не удалось выполнить вход"
      : undefined);

  return {
    login,
    isPending,
    errorMessage,
  };
}
