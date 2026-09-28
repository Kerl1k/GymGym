/**
 * Fire-and-forget for promises started from effects/handlers: the error is
 * logged instead of surfacing as an unhandled rejection.
 */
export function runInBackground(promise: Promise<unknown>, label?: string) {
  promise.catch((error: unknown) => {
    console.error(label ?? "Background task failed", error);
  });
}
