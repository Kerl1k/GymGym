import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";

interface TrainingAlreadyStartedModalProps {
  isOpen: boolean;
  close: () => void;
  onEndCurrentAndStartNew: () => void;
  trainingName: string;
}

export function TrainingAlreadyStartedModal({
  isOpen,
  close,
  onEndCurrentAndStartNew,
  trainingName,
}: TrainingAlreadyStartedModalProps) {
  const navigate = useNavigate();

  const handleGoToStartedTraining = () => {
    close();
    navigate(ROUTES.START);
  };

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      title={`Тренировка ${trainingName} начата`}
      description={`У вас уже есть начатая тренировка. Что вы хотите сделать?`}
    >
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={handleGoToStartedTraining}
        >
          Перейти к начатой тренировке
        </Button>
        <Button
          size="lg"
          variant="destructive"
          className="w-full"
          onClick={onEndCurrentAndStartNew}
        >
          Завершить текущую и начать новую
        </Button>
      </div>
    </Modal>
  );
}
