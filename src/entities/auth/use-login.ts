import { useNavigate } from "react-router-dom";

import { publicRqClient } from "@/entities/instance";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { ApiSchemas } from "@/shared/schema";

export function useLogin() {
  const navigate = useNavigate();

  const session = useSession();
  const loginMutation = publicRqClient.useMutation("post", "/api/auth/login", {
    onSuccess(data) {
      session.login(data.accessToken);
      navigate(ROUTES.HOME);
    },
  });

  const login = (data: ApiSchemas["AuthLoginBody"]) => {
    loginMutation.mutate({ body: data });
  };

  const errorMessage = loginMutation.isError
    ? loginMutation.isError
    : undefined;

  return {
    login,
    isPending: loginMutation.isPending,
    errorMessage,
  };
}
