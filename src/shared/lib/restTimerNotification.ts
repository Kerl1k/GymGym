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
 * Показывает уведомление, когда приложение в фоне/без фокуса.
 * Если пользователь полностью закрыл вкладку, JS не выполняется — нужен push с сервера.
 */
export async function showRestTimerDoneNotification(): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const title = "Отдых окончен";
  const body = "Можно приступать к следующему подходу.";
  const options: NotificationOptions = {
    body,
    tag: NOTIFICATION_TAG,
    requireInteraction: true,
  };

  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}
