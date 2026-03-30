import { FC, useState } from "react";

import { CheckIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCancelActiveTraining } from "@/entities/training-active/useActiveTrainingCancel";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { ModalDelete } from "@/shared/ui/kit/modalDelete";

type ActiveTrainingHeaderProps = {
  name: string;
  finishTraining: () => void;
};

export const ActiveTrainingHeader: FC<ActiveTrainingHeaderProps> = ({
  name,
  finishTraining,
}) => {
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { cancel } = useCancelActiveTraining();

  const handleCancel = async () => {
    await cancel();
    navigate(ROUTES.TRAINING);
  };

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    await handleCancel();
  };

  const handleFinishClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmFinish = () => {
    finishTraining();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="w-full flex justify-center items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground ">
          {name}
        </h1>
      </div>
      <div className="w-full flex justify-center items-center gap-2">
        <Button
          onClick={handleCancelClick}
          size="sm"
          variant="ghost"
          className="gap-2 text-sm sm:text-base sm:size-auto"
        >
          <X className="h-5 w-5 color-red-500" />
          <span className="cursor-pointer text-red-500">Отменить</span>
        </Button>
        <Button
          onClick={handleFinishClick}
          size="sm"
          variant="ghost"
          className="gap-2 text-sm sm:text-base sm:size-auto"
        >
          <CheckIcon className="h-5 w-5" />
          <span className="cursor-pointer">Завершить</span>
        </Button>
      </div>
      <ModalDelete
        isOpen={isConfirmModalOpen}
        close={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmFinish}
        title="Подтверждение завершения"
        description="Вы уверены, что хотите завершить тренировку?"
        confirmText="Завершить"
      />
      <ModalDelete
        isOpen={isCancelModalOpen}
        close={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Подтверждение отмены"
        description="Вы уверены, что хотите отменить тренировку?"
        confirmText="Да"
        cancelText="Нет"
      />
    </div>
  );
};
