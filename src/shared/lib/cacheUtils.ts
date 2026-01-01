/**
 * Утилиты для управления кэшем Service Worker
 */
import React from "react";

// Функция для отправки сообщения Service Worker
interface SWMessage {
  type: string;
  scope?: string;
  url?: string;
  [key: string]: unknown;
}

export function sendMessageToSW(message: SWMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      reject(new Error("Service Worker не доступен"));
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        resolve();
      } else {
        reject(new Error(event.data.error || "Не удалось отправить сообщение"));
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [
      messageChannel.port2,
    ]);
  });
}

/**
 * Инвалидация всего API кэша
 */
export function invalidateAllApiCache(): Promise<void> {
  return sendMessageToSW({
    type: "CACHE_INVALIDATE",
    scope: "ALL",
  });
}

/**
 * Инвалидация кэша для конкретного URL
 * @param url URL для инвалидации
 */
export function invalidateUrlCache(url: string): Promise<void> {
  return sendMessageToSW({
    type: "CACHE_INVALIDATE",
    url: url,
  });
}

/**
 * Проверка поддержки Service Worker
 */
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * Проверка, зарегистрирован ли Service Worker
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  } catch {
    return false;
  }
}

/**
 * Хук для инвалидации кэша при мутациях
 * Используйте этот хук в компонентах, где выполняются мутации данных
 */
export function useCacheInvalidation() {
  const invalidateCache = async () => {
    try {
      await invalidateAllApiCache();
      console.log("API кэш успешно инвалидирован");
    } catch (error) {
      console.error("Не удалось инвалидировать кэш:", error);
    }
  };

  return { invalidateCache };
}

/**
 * Хук для работы с офлайн-мутациями
 * Обрабатывает мутации с поддержкой офлайн-режима
 */
export function useOfflineMutation() {
  const performMutation = async (
    url: string,
    method: "POST" | "PUT" | "DELETE",
    data: unknown,
  ): Promise<{ success: boolean; offline?: boolean; data?: unknown }> => {
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Если это офлайн-ответ от Service Worker
      if (responseData.offline) {
        return { success: true, offline: true, data: responseData };
      }

      return { success: true, data: responseData };
    } catch (error) {
      console.error("Ошибка при выполнении мутации:", error);
      return { success: false };
    }
  };

  return { performMutation };
}

/**
 * Проверка статуса сети
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Хук для отслеживания статуса сети
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
