const parseBooleanEnv = (value: string | undefined) => value === "true";

export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  SENTRY_ENABLED: parseBooleanEnv(import.meta.env.VITE_SENTRY_ENABLED),
};
