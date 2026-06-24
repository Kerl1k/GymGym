export function toApiErrorCode(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "UnknownError";
}

export function toApiError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(toApiErrorCode(error));
}
