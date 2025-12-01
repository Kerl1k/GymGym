import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/kit/dialog";

interface ModalProps {
  isOpen: boolean;
  close: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Modal({
  isOpen,
  close,
  children,
  title,
  description,
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className={className}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
