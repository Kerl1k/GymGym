import { publicRqClient } from "@/entities/instance";
import { ApiSchemas } from "@/shared/schema";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useNavigate } from "react-router-dom";

export function useRegister() {
  const navigate = useNavigate();

  const session = useSession();
  const registerMutation = publicRqClient.useMutation(
    "post",
    "/api/auth/register",
    {
      onSuccess(data) {
        session.login(data.accessToken);
        navigate(ROUTES.HOME);
      },
    },
  );

  const register = (data: ApiSchemas["AuthRegisterBody"]) => {
    registerMutation.mutate({ body: data });
  };

  const errorMessage = registerMutation.isError
    ? registerMutation.isError
    : undefined;

  return {
    register,
    isPending: registerMutation.isPending,
    errorMessage,
  };
}
