const NOTIFICATION_TAG = "gym-rest-timer";

export type RestTimerNotifyPermission = NotificationPermission | "unsupported";

export async function requestRestTimerNotificationPermission(): Promise<RestTimerNotifyPermission> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Показывает уведомление, когда вкладка/окно в фоне или свернуто.
 * Если пользователь полностью закрыл вкладку, JS не выполняется — нужен push с сервера.
 */
export async function showRestTimerDoneNotification(): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState !== "hidden") return;

  const title = "Отдых окончен";
  const body = "Можно приступать к следующему подходу.";
  const options: NotificationOptions = {
    body,
    tag: NOTIFICATION_TAG,
    icon: "/vite.svg",
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({
          type: "SHOW_REST_NOTIFICATION",
          title,
          options,
        });
        return;
      }
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fallback */
  }

  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}
