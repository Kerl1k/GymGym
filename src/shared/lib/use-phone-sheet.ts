import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

const PHONE_QUERY = "(max-width: 768px)";

function readPhoneFrame(): CSSProperties | undefined {
  if (typeof window === "undefined") return undefined;
  if (!window.matchMedia(PHONE_QUERY).matches) return undefined;
  const viewport = window.visualViewport;
  if (!viewport) return undefined;
  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
    right: "auto",
    bottom: "auto",
  };
}

function revealField(container: HTMLElement, field: HTMLElement) {
  const pad = 16;
  const containerRect = container.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  if (fieldRect.bottom > containerRect.bottom - pad) {
    container.scrollTop += fieldRect.bottom - containerRect.bottom + pad;
  } else if (fieldRect.top < containerRect.top + pad) {
    container.scrollTop -= containerRect.top + pad - fieldRect.top;
  }
}

/** На телефоне растягивает оверлей по видимой области, в том числе над клавиатурой. */
export function usePhoneSheet(onClose: () => void): {
  overlayStyle?: CSSProperties;
  contentRef: RefObject<HTMLDivElement | null>;
} {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const contentRef = useRef<HTMLDivElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<CSSProperties | undefined>(
    readPhoneFrame,
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("[data-slot='dialog-content']")) return;
      onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(PHONE_QUERY);
    const viewport = window.visualViewport;

    const revealActiveField = () => {
      const root = contentRef.current;
      const active = document.activeElement;
      if (!root || !(active instanceof HTMLElement) || !root.contains(active)) {
        return;
      }
      if (!active.matches("input, textarea, select")) return;
      revealField(root, active);
    };

    const update = () => {
      setOverlayStyle(readPhoneFrame());
      requestAnimationFrame(() => {
        requestAnimationFrame(revealActiveField);
      });
    };

    update();
    media.addEventListener("change", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);

    const root = contentRef.current;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select")) return;
      requestAnimationFrame(() => {
        if (contentRef.current) revealField(contentRef.current, target);
      });
    };
    root?.addEventListener("focusin", onFocusIn);

    return () => {
      media.removeEventListener("change", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      root?.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return { overlayStyle, contentRef };
}
