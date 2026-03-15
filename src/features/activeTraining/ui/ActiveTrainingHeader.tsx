import { FC } from "react";

import { CheckIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCancelActiveTraining } from "@/entities/training-active/useActiveTrainingCancel";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";

type ActiveTrainingHeaderProps = {
  name: string;
  finishTraining: () => void;
};

export const ActiveTrainingHeader: FC<ActiveTrainingHeaderProps> = ({
  name,
  finishTraining,
}) => {
  const navigate = useNavigate();

  const { cancel } = useCancelActiveTraining();

  const handleCancel = async () => {
    await cancel();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
          {name}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleCancel}
          size="sm"
          variant="ghost"
          className="gap-2 text-sm sm:text-base sm:size-auto"
        >
          <X className="h-5 w-5" />
          <span className="hidden sm:inline cursor-pointer text-red-500">
            Отменить
          </span>
        </Button>
        <Button
          onClick={finishTraining}
          size="sm"
          variant="ghost"
          className="gap-2 text-sm sm:text-base sm:size-auto"
        >
          <CheckIcon className="h-5 w-5" />
          <span className="hidden sm:inline cursor-pointer">Завершить</span>
        </Button>
      </div>
    </div>
  );
};
