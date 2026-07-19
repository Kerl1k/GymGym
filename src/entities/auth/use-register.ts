import { useCallback, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { ApiSchemas } from "@/shared/schema";

import { authStore } from "./auth.store";

export function useRegister() {
  const navigate = useNavigate();
  const session = useSession();
  const [offlineError, setOfflineError] = useState<string | undefined>();

  const register = useCallback(
    async (data: ApiSchemas["AuthRegisterBody"]) => {
      setOfflineError(undefined);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOfflineError("Для регистрации нужен интернет");
        return;
      }
      const result = await authStore.register(data);
      if (result?.accessToken) {
        session.login(result.accessToken, result.refreshToken);
        navigate(ROUTES.HOME);
      }
    },
    [navigate, session],
  );

  const { errorCode, isPending } = useMobxSelector(() => ({
    errorCode: authStore.registerErrorCode,
    isPending: authStore.registerPending,
  }));

  const errorMessage =
    offlineError ??
    (errorCode
      ? errorCode === "AlreadyExists"
        ? "Пользователь уже существует"
        : "Не удалось зарегистрироваться"
      : undefined);

  return {
    register,
    isPending,
    errorMessage,
  };
}
