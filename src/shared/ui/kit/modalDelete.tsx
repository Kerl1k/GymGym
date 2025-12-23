import React from "react";
import { Modal } from "./modalWindow/modal";
import { Button } from "./button";

interface ModalDeleteProps {
  isOpen: boolean;
  close: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ModalDelete: React.FC<ModalDeleteProps> = ({
  isOpen,
  close,
  onConfirm,
  title = "Подтверждение удаления",
  description = "Вы уверены, что хотите удалить этот элемент? Это действие нельзя будет отменить.",
  confirmText = "Удалить",
  cancelText = "Отмена",
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    close();
  };

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="outline" onClick={close} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
