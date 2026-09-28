import { useSyncExternalStore } from "react";

export type ToastVariant = "default" | "success" | "error" | "info";

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_DURATION_MS = 4000;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return toasts;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(
  message: string,
  variant: ToastVariant,
  durationMs = DEFAULT_DURATION_MS,
) {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  if (durationMs > 0) {
    window.setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

export const toast = Object.assign(
  (message: string, durationMs?: number) =>
    push(message, "default", durationMs),
  {
    success: (message: string, durationMs?: number) =>
      push(message, "success", durationMs),
    error: (message: string, durationMs?: number) =>
      push(message, "error", durationMs),
    info: (message: string, durationMs?: number) =>
      push(message, "info", durationMs),
  },
);

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
