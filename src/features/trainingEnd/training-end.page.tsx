import { useMemo } from "react";

import { Share2Icon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useTrainingHistoryByName } from "@/entities/training-history/use-training-history-by-name";
import { useChangeTrainingHistory } from "@/entities/training-history/use-training-history-change";
import { useTrainingHistoryFetchId } from "@/entities/training-history/use-training-history-fetch-id";
import { toast } from "@/shared/lib/toast";
import { shareText, trainingSummaryText } from "@/shared/lib/training-export";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { computeBestByExercise } from "@/shared/ui/user-profile";

import { TrainingChanges } from "../trainingChanges/training-start.page";

import { BestResults } from "./ui/BestResults";

const convertTrainingHistoryToActiveTraining = (
  history: ApiSchemas["TrainingHistory"],
): ApiSchemas["ActiveTraining"] => {
  return {
    dateStart: history.dateStart,
    name: history.name,
    description: history.description,
    exercises: history.exercises.map((exercise) => ({
      id: "",
      name: exercise.name,
      description: exercise.description,
      restTime: exercise.restTime,
      sets: exercise.sets,
      muscleGroups: exercise.muscleGroups,
      useCustomSets: exercise.useCustomSets,
    })),
  };
};

const convertActiveTrainingToTrainingHistoryUpdate = (
  activeTraining: ApiSchemas["ActiveTraining"],
  historyId: string,
): ApiSchemas["TrainingHistoryUpdate"] => {
  return {
    id: historyId,
    dateStart: activeTraining.dateStart,
    name: activeTraining.name,
    description: activeTraining.description,
    exercises: activeTraining.exercises.map((exercise) => ({
      name: exercise.name,
      description: exercise.description,
      restTime: exercise.restTime,
      sets: exercise.sets,
      muscleGroups: exercise.muscleGroups,
      useCustomSets: exercise.useCustomSets,
    })),
  };
};

const TrainingEndPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: history } = useTrainingHistoryFetchId(id || "");
  const { history: previousHistory, isPending: isPreviousPending } =
    useTrainingHistoryByName({
      trainingName: history?.name,
      excludeId: history?.id,
    });

  const previousBestByExercise = useMemo(() => {
    return Object.fromEntries(computeBestByExercise(previousHistory));
  }, [previousHistory]);

  const { change } = useChangeTrainingHistory();

  const navigate = useNavigate();

  const onSave = async (data: ApiSchemas["ActiveTraining"]) => {
    if (history) {
      const trainingHistoryUpdate =
        convertActiveTrainingToTrainingHistoryUpdate(data, history.id);
      try {
        await change(trainingHistoryUpdate);
      } catch (error) {
        console.error("Не удалось сохранить тренировку", error);
        toast.error("Не удалось сохранить изменения. Попробуйте ещё раз.");
        return;
      }
    }

    toast.success("Тренировка сохранена");
    navigate(ROUTES.HOME);
  };

  const activeTrainingData = history
    ? convertTrainingHistoryToActiveTraining(history)
    : null;

  if (!history || !activeTrainingData) {
    return <div>Тренировка не найдена</div>;
  }

  const handleShare = async () => {
    const result = await shareText(
      history.name,
      trainingSummaryText(history),
    );
    if (result === "copied") toast.success("Итоги скопированы в буфер обмена");
    if (result === "failed") toast.error("Не удалось поделиться итогами");
  };

  return (
    <>
      <div className="mx-auto flex max-w-[1200px] justify-end px-4 pt-4 sm:px-6">
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2Icon className="h-4 w-4" />
          Поделиться итогами
        </Button>
      </div>
      <BestResults
        current={history}
        previousHistory={previousHistory}
        isPending={isPreviousPending}
      />
      <TrainingChanges
        data={activeTrainingData}
        onSave={onSave}
        previousBestByExercise={previousBestByExercise}
      />
    </>
  );
};

export const Component = TrainingEndPage;
