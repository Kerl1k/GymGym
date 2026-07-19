import { FC, useState } from "react";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCancelActiveTraining } from "@/entities/training-active/useActiveTrainingCancel";
import { ROUTES } from "@/shared/model/routes";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { ModalDelete } from "@/shared/ui/kit/modalDelete";

type ActiveTrainingHeaderProps = {
  name: string;
  exerciseId?: string;
  finishTraining: () => void;
  syncStatus: "synced" | "syncing" | "error" | "offline";
  onRetrySync: () => void;
  isRetryingSync: boolean;
};

export const ActiveTrainingHeader: FC<ActiveTrainingHeaderProps> = ({
  name,
  exerciseId,
  finishTraining,
  syncStatus,
  onRetrySync,
  isRetryingSync,
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
    console.log("[active-training/end] UI:header confirm finish", {
      name,
      exerciseId,
      syncStatus,
    });
    finishTraining();
  };

  const handleEditExercise = () => {
    if (!exerciseId) return;
    navigate(`${ROUTES.START.replace(/:id/, exerciseId)}`);
  };

  return (
    <div className="mb-4 rounded-2xl p-3 backdrop-blur sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl md:text-2xl">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {syncStatus === "synced" && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2Icon className="h-3 w-3" />
                Синхронизировано
              </Badge>
            )}
            {syncStatus === "offline" && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangleIcon className="h-3 w-3" />
                Оффлайн — сохраняется локально
              </Badge>
            )}
            {syncStatus === "syncing" && (
              <Badge variant="info" className="gap-1">
                <RefreshCwIcon className="h-3 w-3 animate-spin" />
                Сохранение в фоне
              </Badge>
            )}
            {syncStatus === "error" && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangleIcon className="h-3 w-3" />
                Не сохранено на сервере
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleEditExercise}
            size="sm"
            variant="secondary"
            disabled={!exerciseId}
            className="gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Изменить упражнение
          </Button>

          <Button
            onClick={handleCancelClick}
            size="sm"
            variant="outline"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Отменить
          </Button>

          <Button
            onClick={handleFinishClick}
            size="sm"
            variant="default"
            className="gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            Завершить
          </Button>
          {syncStatus === "error" && (
            <Button
              onClick={onRetrySync}
              size="sm"
              variant="secondary"
              className="gap-2"
              disabled={isRetryingSync}
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isRetryingSync ? "animate-spin" : ""}`}
              />
              Повторить отправку
            </Button>
          )}
        </div>
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
