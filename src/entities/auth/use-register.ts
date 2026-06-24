import { useCallback } from "react";

import { useNavigate } from "react-router-dom";

import { useMobxSelector } from "@/shared/lib/useMobxSelector";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { ApiSchemas } from "@/shared/schema";

import { authStore } from "./auth.store";

export function useRegister() {
  const navigate = useNavigate();
  const session = useSession();

  const register = useCallback(
    async (data: ApiSchemas["AuthRegisterBody"]) => {
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

  const errorMessage = errorCode
    ? errorCode === "AlreadyExists"
      ? "Пользователь уже существует"
      : "Не удалось зарегистрироваться"
    : undefined;

  return {
    register,
    isPending,
    errorMessage,
  };
}
