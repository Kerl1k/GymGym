import { CheckCircle2Icon, InfoIcon, XCircleIcon, XIcon } from "lucide-react";

import { cn } from "@/shared/lib/css";
import { dismissToast, useToasts, type ToastVariant } from "@/shared/lib/toast";

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: "border-border bg-popover text-popover-foreground",
  success: "border-emerald-500/40 bg-popover text-popover-foreground",
  error: "border-destructive/50 bg-popover text-popover-foreground",
  info: "border-blue-500/40 bg-popover text-popover-foreground",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald-500" />;
  }
  if (variant === "error") {
    return <XCircleIcon className="h-5 w-5 shrink-0 text-destructive" />;
  }
  if (variant === "info") {
    return <InfoIcon className="h-5 w-5 shrink-0 text-blue-500" />;
  }
  return null;
}

export function Toaster() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      data-slot="toaster"
      className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === "error" ? "alert" : "status"}
          className={cn(
            "animate-slide-up flex items-start gap-3 rounded-xl border p-3 shadow-lg",
            VARIANT_CLASSES[t.variant],
          )}
        >
          <ToastIcon variant={t.variant} />
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Закрыть уведомление"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
