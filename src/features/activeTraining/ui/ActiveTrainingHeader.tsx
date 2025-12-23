import { Button } from "@/shared/ui/kit/button";
import { CheckIcon } from "lucide-react";
import { FC } from "react";

type ActiveTrainingHeaderProps = {
  finishTraining: () => void;
  trainingLength: number;
  indexCurrentExercise: number;
};

export const ActiveTrainingHeader: FC<ActiveTrainingHeaderProps> = ({
  finishTraining,
  indexCurrentExercise,
  trainingLength,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Забыл добавить название в тип, но оно тут будет, честно
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Упражнение {indexCurrentExercise + 1} из {trainingLength}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={finishTraining}
          size="sm"
          variant="ghost"
          className="gap-2 text-sm sm:text-base sm:size-auto"
        >
          <CheckIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Завершить</span>
        </Button>
      </div>
    </div>
  );
};
