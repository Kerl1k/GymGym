import * as Sentry from "@sentry/react";

import { CONFIG } from "@/shared/model/config";

const NOISY_ERROR_MESSAGES = [
  "ResizeObserver loop limit exceeded",
  "Non-Error promise rejection captured",
];

const isSentryEnabled = CONFIG.SENTRY_ENABLED && Boolean(CONFIG.SENTRY_DSN);

export function initSentry() {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    environment: CONFIG.SENTRY_ENVIRONMENT,
    beforeSend(event, hint) {
      const message =
        hint.originalException instanceof Error
          ? hint.originalException.message
          : event.message;

      if (
        message &&
        NOISY_ERROR_MESSAGES.some((noiseMessage) =>
          message.includes(noiseMessage),
        )
      ) {
        return null;
      }

      return event;
    },
  });
}

export function setSentryUser(user: { id: string; email: string } | null) {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.setUser(user);
}

export function captureException(error: unknown) {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.captureException(error);
}
