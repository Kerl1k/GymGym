import { useEffect } from "react";

import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { captureException } from "@/shared/lib/sentry";

function formatErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-lg rounded-lg border p-6 bg-card text-card-foreground">
        <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ошибка уже отправлена в мониторинг. Попробуйте обновить страницу.
        </p>
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm break-words">
          {formatErrorMessage(error)}
        </p>
      </div>
    </div>
  );
}
