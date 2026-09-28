import { useEffect } from "react";

/** Keeps the screen on while `enabled`; the browser drops the lock when the tab is hidden, so it is re-acquired on return. */
export function useWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      if (sentinel && !sentinel.released) return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (disposed) {
          await next.release();
          return;
        }
        sentinel = next;
      } catch {
        /* denied, e.g. battery saver */
      }
    };

    const onVisibilityChange = () => {
      void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sentinel && !sentinel.released) {
        void sentinel.release().catch(() => {});
      }
      sentinel = null;
    };
  }, [enabled]);
}
